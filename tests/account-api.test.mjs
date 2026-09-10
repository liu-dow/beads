import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {createServer} from 'vite';

const project='https://auth-test.supabase.co',alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const env={SUPABASE_URL:project,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',APP_ORIGIN:'https://atelier.example',GOOGLE_AUTH_ENABLED:'true'};
globalThis.__beadsAuthEnv=env;
const vite=await createServer({configFile:false,appType:'custom',cacheDir:'.sites-runtime/test-cache/accounts',server:{middlewareMode:true,hmr:false,ws:false,watch:null},resolve:{alias:{'@':process.cwd()}},plugins:[{name:'test-cloudflare-env',enforce:'pre',resolveId(id){if(id==='cloudflare:workers')return '\0beads-test-env';},load(id){if(id==='\0beads-test-env')return 'export const env=globalThis.__beadsAuthEnv;';}}]});
const originalFetch=globalThis.fetch;
const requests=[];
const profile=id=>({id,email:id===alice?'alice@example.test':'bob@example.test',aud:'authenticated',role:'authenticated',created_at:'2026-01-01T00:00:00Z',app_metadata:{},user_metadata:{full_name:id===alice?'Alice':'Bob'}});
const jwt=(id,expires=3600)=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+expires,iat:Math.floor(Date.now()/1000),aud:'authenticated',role:'authenticated'})).toString('base64url'),'test-signature'].join('.');
const session=id=>({access_token:jwt(id),refresh_token:`refresh-${id}`,expires_in:3600,token_type:'bearer',user:profile(id)});
let rejectUser=false;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input.url??String(input));
  assert.equal(url.origin,project,'tests must never call a live external service');
  const headers=new Headers(init.headers),body=init.body?JSON.parse(init.body):null;
  requests.push({url,headers,body});
  if(url.pathname==='/auth/v1/token'){
    if(url.searchParams.get('grant_type')==='password')return Response.json(session(body.email==='bob@example.test'?bob:alice));
    if(url.searchParams.get('grant_type')==='pkce')return Response.json(session(alice));
    if(url.searchParams.get('grant_type')==='refresh_token')return Response.json(session(alice));
  }
  if(url.pathname==='/auth/v1/user'){
    if(rejectUser)return Response.json({message:'Invalid JWT',code:'bad_jwt'},{status:401});
    const token=headers.get('authorization')?.replace('Bearer ','');
    if(!token || token==='sb_publishable_test')return Response.json({message:'No session'},{status:401});
    const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
    return Response.json(profile(claims.sub));
  }
  if(url.pathname==='/auth/v1/signup')return Response.json({user:profile(alice)});
  if(url.pathname==='/auth/v1/recover'||url.pathname==='/auth/v1/resend'||url.pathname==='/auth/v1/logout')return Response.json({});
  if(url.pathname==='/rest/v1/designs')return Response.json([]);
  if(url.pathname==='/rest/v1/rpc/my_design_stats')return Response.json({designs:{count:0,beads:0},exports:[],authors:[]});
  throw new Error(`Unmocked request ${url.pathname}`);
};
after(async()=>{globalThis.fetch=originalFetch;delete globalThis.__beadsAuthEnv;await vite.close();});
const auth=await vite.ssrLoadModule('/app/api/auth/[action]/route.ts');
const sessions=await vite.ssrLoadModule('/app/api/auth/session/route.ts');
const google=await vite.ssrLoadModule('/app/auth/google/route.ts');
const callback=await vite.ssrLoadModule('/app/auth/callback/route.ts');
const routes={designs:await vite.ssrLoadModule('/app/api/designs/route.ts'),progress:await vite.ssrLoadModule('/app/api/progress/route.ts'),stats:await vite.ssrLoadModule('/app/api/stats/route.ts')};
const request=(path,body,headers={})=>new Request(`https://atelier.example${path}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
const action=(name,body,headers)=>auth.POST(request(`/api/auth/${name}`,body,headers),{params:Promise.resolve({action:name})});
const cookieJar=response=>response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
let cookie;

test('all six business handlers reject anonymous and forged platform identity',async()=>{
  for(const [name,route] of Object.entries(routes))for(const method of ['GET','POST']){
    const response=await route[method](request(`/api/${name}`,method==='POST'?{}:undefined,{'oai-authenticated-user-id':alice,'oai-authenticated-user-email':'alice@example.test'}));
    assert.equal(response.status,401,`${name} ${method}`);
    assert.match(response.headers.get('cache-control'),/no-store/);
  }
});
test('email login sets HttpOnly secure cookies and a verified session survives reload',async()=>{
  const response=await action('login',{email:'alice@example.test',password:'long-password'});
  assert.equal(response.status,200);assert.equal((await response.json()).user.id,alice);
  assert.ok(response.headers.getSetCookie().length);
  for(const c of response.headers.getSetCookie()){assert.match(c,/HttpOnly/i);assert.match(c,/Secure/i);assert.match(c,/SameSite=Lax/i);}
  cookie=cookieJar(response);
  const check=await sessions.GET(request('/api/auth/session',undefined,{cookie}));
  assert.equal((await check.json()).user.id,alice);
  assert.ok(requests.some(r=>r.url.pathname==='/auth/v1/user'));
});
test('auth server verification rejects an otherwise well-formed cached session',async()=>{
  rejectUser=true;
  const response=await routes.designs.GET(request('/api/designs',undefined,{cookie}));
  assert.equal(response.status,401);rejectUser=false;
});
test('business database client forwards user JWT and filters ownership',async()=>{
  const response=await routes.designs.GET(request('/api/designs',undefined,{cookie}));
  assert.equal(response.status,200);
  const last=requests.findLast(r=>r.url.pathname==='/rest/v1/designs');
  assert.equal(last.url.searchParams.get('owner_id'),`eq.${alice}`);
  assert.match(last.headers.get('authorization'),/^Bearer ey/);
  assert.equal(last.headers.get('apikey'),'sb_publishable_test');
});
test('old account tabs cannot write with a newly switched session',async()=>{
  const before=requests.length;
  const response=await routes.designs.POST(request('/api/designs',{}, {cookie,'x-bead-user':bob}));
  assert.equal(response.status,409);assert.equal((await response.json()).code,'ACCOUNT_CHANGED');
  assert.ok(!requests.slice(before).some(r=>r.url.pathname.startsWith('/rest/')));
});
test('cross-site and simple form requests cannot perform account or design writes',async()=>{
  assert.equal((await action('logout',{}, {cookie,origin:'https://evil.example'})).status,403);
  assert.equal((await action('login',{},{'content-type':'text/plain'})).status,415);
  assert.equal((await routes.designs.POST(request('/api/designs',{}, {cookie,'sec-fetch-site':'cross-site'}))).status,403);
});
test('Google starts PKCE with verifier cookie and a fixed trusted callback',async()=>{
  const response=await google.GET(request('/auth/google?next=https://evil.example'));
  assert.equal(response.status,303);
  const url=new URL(response.headers.get('location'));
  assert.equal(url.origin,project);assert.equal(url.searchParams.get('provider'),'google');
  assert.equal(url.searchParams.get('redirect_to'),'https://atelier.example/auth/callback');
  assert.ok(url.searchParams.get('code_challenge'));
  assert.match(cookieJar(response),/code-verifier/);
});
test('OAuth callback preserves session cookies and blocks open redirects',async()=>{
  const start=await google.GET(request('/auth/google'));
  const response=await callback.GET(request('/auth/callback?code=test-code&next=https://evil.example',undefined,{cookie:cookieJar(start)}));
  assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/studio');
  assert.ok(response.headers.getSetCookie().some(c=>c.includes('auth-token')));
  assert.match(response.headers.get('cache-control'),/no-store/);
});
test('failed callback returns an actionable login error',async()=>{
  const response=await callback.GET(request('/auth/callback?error=access_denied'));
  assert.equal(response.headers.get('location'),'/login?auth_error=callback');
});
test('signup waits for email confirmation instead of claiming a logged in session',async()=>{
  const response=await action('signup',{email:'alice@example.test',password:'long-password',name:'Alice'});
  assert.equal(response.status,200);assert.equal((await response.json()).user,null);
  assert.ok(requests.findLast(r=>r.url.pathname==='/auth/v1/signup').body.code_challenge);
});
test('password recovery uses a fixed reset callback and a neutral account message',async()=>{
  const response=await action('forgot',{email:'unknown@example.test'});
  assert.equal(response.status,200);assert.match((await response.json()).message,/If /);
  const sent=requests.findLast(r=>r.url.pathname==='/auth/v1/recover');
  assert.equal(sent.url.searchParams.get('redirect_to'),'https://atelier.example/auth/callback?next=/auth/reset-password');
  assert.ok(sent.body.code_challenge);
});
test('password reset requires a verified session',async()=>{
  assert.equal((await action('reset',{password:'new-password'})).status,401);
});
test('logout clears the server-managed cookies',async()=>{
  const response=await action('logout',{}, {cookie});
  assert.equal(response.status,200);assert.ok(response.headers.getSetCookie().some(c=>/Max-Age=0/i.test(c)));
});
