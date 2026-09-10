import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
await db.exec(`
  create role anon nologin nosuperuser nobypassrls;
  create role authenticated nologin nosuperuser nobypassrls;
  create schema auth;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
  $$;
  grant usage on schema auth,public to authenticated,anon;
`);
for(const name of readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort()) await db.exec(readFileSync(`supabase/migrations/${name}`,'utf8'));
const alice="11111111-1111-4111-8111-111111111111",bob="22222222-2222-4222-8222-222222222222";
await db.query('insert into auth.users values ($1),($2)',[alice,bob]);
after(()=>db.close());
const payload={title:"Coast",author:"Shared author name",rows:8,cols:48,cells:Array(384).fill(0),palette:[{id:"A",name:"Black",hex:"#000000",finish:"matte"}]};
const asUser=(id,fn)=>db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);return fn(tx);});
const insertDesign=(user,data=payload)=>asUser(user,tx=>tx.query('insert into public.designs(data) values($1) returning id,owner_id',[JSON.stringify(data)]));
const a=(await insertDesign(alice)).rows[0].id,b=(await insertDesign(bob,{...payload,title:"B"})).rows[0].id;

test('owners see only their records, including same author names',async()=>{
  assert.deepEqual((await asUser(alice,tx=>tx.query('select id from public.designs'))).rows.map(r=>r.id),[a]);
  assert.deepEqual((await asUser(bob,tx=>tx.query('select id from public.designs'))).rows.map(r=>r.id),[b]);
});
test('guessed IDs cannot read or update another owner',async()=>{
  assert.equal((await asUser(bob,tx=>tx.query('select data from public.designs where id=$1',[a]))).rows.length,0);
  assert.equal((await asUser(bob,tx=>tx.query('update public.designs set data=$1 where id=$2 returning id',[JSON.stringify({...payload,title:"stolen"}),a]))).rows.length,0);
  assert.equal((await asUser(alice,tx=>tx.query('select data from public.designs where id=$1',[a]))).rows[0].data.title,"Coast");
});
test('cannot spoof an owner or transfer ownership',async()=>{
  await assert.rejects(asUser(bob,tx=>tx.query('insert into public.designs(owner_id,data) values($1,$2)',[alice,JSON.stringify(payload)])),e=>e.code==='42501');
  await assert.rejects(asUser(alice,tx=>tx.query('update public.designs set owner_id=$1 where id=$2',[bob,a])),e=>e.code==='42501');
});
test('owner can update content, but not server timestamps',async()=>{
  await asUser(alice,tx=>tx.query('update public.designs set data=$1 where id=$2',[JSON.stringify({...payload,author:"New author"}),a]));
  assert.equal((await asUser(alice,tx=>tx.query('select owner_id from public.designs where id=$1',[a]))).rows[0].owner_id,alice);
  await assert.rejects(asUser(alice,tx=>tx.query("update public.designs set created_at='2000-01-01' where id=$1",[a])),e=>e.code==='42501');
});
test('progress can be created and updated only for an owned design',async()=>{
  await asUser(alice,tx=>tx.query("insert into public.making_progress(design_id,signature,data) values($1,'s1',$2)",[a,JSON.stringify({column:1,completed:[0]})]));
  await asUser(alice,tx=>tx.query("insert into public.making_progress(owner_id,design_id,signature,data) values($1,$2,'s1',$3) on conflict(owner_id,design_id,signature) do update set owner_id=excluded.owner_id,design_id=excluded.design_id,signature=excluded.signature,data=excluded.data",[alice,a,JSON.stringify({column:2,completed:[0,1]})]));
  assert.equal((await asUser(bob,tx=>tx.query('select * from public.making_progress'))).rows.length,0);
  await assert.rejects(asUser(bob,tx=>tx.query("insert into public.making_progress(design_id,signature,data) values($1,'s1','{}')",[a])),e=>e.code==='42501');
  assert.equal((await asUser(bob,tx=>tx.query("update public.making_progress set data='{}' where design_id=$1 returning design_id",[a]))).rows.length,0);
});
test('progress cannot be reassigned to someone else or their design',async()=>{
  await assert.rejects(asUser(alice,tx=>tx.query('update public.making_progress set owner_id=$1 where design_id=$2',[bob,a])),e=>e.code==='42501');
  await assert.rejects(asUser(alice,tx=>tx.query('update public.making_progress set design_id=$1 where design_id=$2',[b,a])),e=>e.code==='42501');
});
test('exports enforce both event and referenced design ownership',async()=>{
  const id='33333333-3333-4333-8333-333333333333';
  await asUser(alice,tx=>tx.query("insert into public.exports(id,design_id,format) values($1,$2,'pdf')",[id,a]));
  await asUser(alice,tx=>tx.query("insert into public.exports(id,design_id,format) values($1,$2,'pdf') on conflict(owner_id,id) do nothing",[id,a]));
  await asUser(bob,tx=>tx.query("insert into public.exports(id,format) values($1,'png')",[id]));
  await assert.rejects(asUser(bob,tx=>tx.query("insert into public.exports(design_id,format) values($1,'png')",[a])),e=>e.code==='42501');
  await assert.rejects(asUser(bob,tx=>tx.query("insert into public.exports(owner_id,format) values($1,'png')",[alice])),e=>e.code==='42501');
  assert.equal((await asUser(alice,tx=>tx.query('select * from public.exports'))).rows.length,1);
});
test('statistics RPC is invoker-scoped and cannot reveal another user',async()=>{
  const aStats=(await asUser(alice,tx=>tx.query('select public.my_design_stats() stats'))).rows[0].stats;
  const bStats=(await asUser(bob,tx=>tx.query('select public.my_design_stats() stats'))).rows[0].stats;
  assert.deepEqual(aStats.designs,{count:1,beads:384});
  assert.deepEqual(aStats.exports,[{format:'pdf',count:1}]);
  assert.deepEqual(bStats.exports,[{format:'png',count:1}]);
  assert.equal(bStats.authors[0].name,'Shared author name');
});
test('anonymous access to all business tables and statistics is denied',async()=>{
  for(const query of ['select * from public.designs','select * from public.making_progress','select * from public.exports','select public.my_design_stats()']) {
    await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query(query);}),e=>e.code==='42501');
  }
});
test('authenticated role without a valid subject sees no records',async()=>{
  assert.equal((await asUser('',tx=>tx.query('select * from public.designs'))).rows.length,0);
});
