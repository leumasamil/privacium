create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin', 'dpo', 'csuite');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.has_any_role(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id) $$;

create policy "own profile or admin read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own roles or admin read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admin grants roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin revokes roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Signup: create profile; the very first account becomes admin + dpo. Others wait for admin approval.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin'), (new.id, 'dpo');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Shared workspace state (single tenant row)
create table public.workspace_state (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
grant select, insert, update on public.workspace_state to authenticated;
grant all on public.workspace_state to service_role;
alter table public.workspace_state enable row level security;
create policy "members read workspace" on public.workspace_state for select to authenticated
  using (public.has_any_role(auth.uid()));
create policy "members insert workspace" on public.workspace_state for insert to authenticated
  with check (public.has_any_role(auth.uid()));
create policy "members update workspace" on public.workspace_state for update to authenticated
  using (public.has_any_role(auth.uid())) with check (public.has_any_role(auth.uid()));
insert into public.workspace_state (id, data) values (1, '{}'::jsonb);
alter publication supabase_realtime add table public.workspace_state;

-- Immutable, hash-chained audit trail (ISO 27037)
create table public.audit_log (
  seq bigserial primary key,
  ts timestamptz not null default now(),
  user_id uuid not null,
  user_email text,
  role public.app_role not null,
  op text not null check (op in ('SELECT','INSERT','UPDATE','DELETE')),
  target text not null,
  detail text not null,
  prev_hash text not null,
  hash text not null
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "admin and dpo read audit" on public.audit_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'dpo'));

create or replace function public.append_audit(_role public.app_role, _op text, _target text, _detail text)
returns public.audit_log language plpgsql security definer set search_path = public, extensions
as $$
declare
  prev text;
  nseq bigint;
  nts timestamptz := now();
  em text;
  row public.audit_log;
begin
  if not public.has_role(auth.uid(), _role) then
    raise exception 'role not granted';
  end if;
  perform pg_advisory_xact_lock(271001);
  select hash into prev from public.audit_log order by seq desc limit 1;
  prev := coalesce(prev, repeat('0', 64));
  nseq := nextval(pg_get_serial_sequence('public.audit_log', 'seq'));
  select email into em from public.profiles where id = auth.uid();
  insert into public.audit_log (seq, ts, user_id, user_email, role, op, target, detail, prev_hash, hash)
  values (nseq, nts, auth.uid(), em, _role, _op, _target, _detail, prev,
    encode(digest(nseq::text || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || _role::text || '|' || _op || '|' || _target || '|' || _detail || '|' || prev, 'sha256'), 'hex'))
  returning * into row;
  return row;
end;
$$;
revoke all on function public.append_audit(public.app_role, text, text, text) from public, anon;
grant execute on function public.append_audit(public.app_role, text, text, text) to authenticated;

-- Admin lists members with roles
create or replace function public.list_members()
returns table (id uuid, email text, display_name text, roles public.app_role[])
language sql stable security definer set search_path = public
as $$
  select p.id, p.email, p.display_name, coalesce(array_agg(r.role) filter (where r.role is not null), '{}')
  from public.profiles p left join public.user_roles r on r.user_id = p.id
  where public.has_role(auth.uid(), 'admin')
  group by p.id order by p.created_at
$$;
grant execute on function public.list_members() to authenticated;