-- Customer data is separate from legacy D1 data. No automatic ownership claims.
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  constraint design_data_valid check (
    jsonb_typeof(data) = 'object'
    and length(data->>'title') between 1 and 100
    and length(data->>'author') between 1 and 80
    and (data->>'rows')::integer between 8 and 40
    and (data->>'cols')::integer between 48 and 160
    and jsonb_typeof(data->'cells') = 'array'
    and jsonb_array_length(data->'cells') = (data->>'rows')::integer * (data->>'cols')::integer
    and jsonb_typeof(data->'palette') = 'array'
    and jsonb_array_length(data->'palette') between 1 and 64
    and data ?& array['title','author','rows','cols','cells','palette']
  )
);
create index designs_owner_updated on public.designs(owner_id, updated_at desc);

create table public.making_progress (
  owner_id uuid not null default auth.uid(),
  design_id uuid not null,
  signature text not null check (length(signature) between 1 and 32),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (owner_id, design_id, signature),
  foreign key (design_id, owner_id) references public.designs(id, owner_id) on delete cascade
);
create index progress_design_owner on public.making_progress(design_id, owner_id);

create table public.exports (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  design_id uuid,
  format text not null check (format in ('png','pdf')),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  foreign key (design_id, owner_id) references public.designs(id, owner_id) on delete cascade
);
create index exports_design_owner on public.exports(design_id, owner_id);

create function public.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger designs_updated before update on public.designs
for each row execute function public.touch_updated_at();
create trigger progress_updated before update on public.making_progress
for each row execute function public.touch_updated_at();
revoke all on function public.touch_updated_at() from public, anon, authenticated;

alter table public.designs enable row level security;
alter table public.making_progress enable row level security;
alter table public.exports enable row level security;

create policy designs_read_own on public.designs for select to authenticated
using ((select auth.uid()) = owner_id);
create policy designs_create_own on public.designs for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy designs_update_own on public.designs for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy progress_read_own on public.making_progress for select to authenticated
using ((select auth.uid()) = owner_id);
create policy progress_create_own on public.making_progress for insert to authenticated
with check ((select auth.uid()) = owner_id and exists (select 1 from public.designs d where d.id = design_id and d.owner_id = (select auth.uid())));
create policy progress_update_own on public.making_progress for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id and exists (select 1 from public.designs d where d.id = design_id and d.owner_id = (select auth.uid())));

create policy exports_read_own on public.exports for select to authenticated
using ((select auth.uid()) = owner_id);
create policy exports_create_own on public.exports for insert to authenticated
with check ((select auth.uid()) = owner_id and (design_id is null or exists (select 1 from public.designs d where d.id = design_id and d.owner_id = (select auth.uid()))));

revoke all on public.designs, public.making_progress, public.exports from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert on public.designs to authenticated;
grant update(data) on public.designs to authenticated;
grant select, insert on public.making_progress to authenticated;
-- PostgREST upsert includes the key columns; RLS and the FK still prevent reassignment.
grant update(owner_id,design_id,signature,data) on public.making_progress to authenticated;
grant select, insert on public.exports to authenticated;

create function public.my_design_stats() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'designs', (select jsonb_build_object('count',count(*),'beads',coalesce(sum(jsonb_array_length(data->'cells')),0)) from public.designs where owner_id=(select auth.uid())),
    'exports', coalesce((select jsonb_agg(jsonb_build_object('format',format,'count',n)) from (select format,count(*) n from public.exports where owner_id=(select auth.uid()) group by format) e),'[]'::jsonb),
    'authors', coalesce((select jsonb_agg(jsonb_build_object('name',name,'count',n,'beads',beads) order by n desc) from (select data->>'author' name,count(*) n,sum(jsonb_array_length(data->'cells')) beads from public.designs where owner_id=(select auth.uid()) group by data->>'author') a),'[]'::jsonb)
  );
$$;
revoke all on function public.my_design_stats() from public, anon;
grant execute on function public.my_design_stats() to authenticated;
