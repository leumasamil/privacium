ALTER TYPE public.app_role RENAME VALUE 'admin' TO 'ADMIN_SISTEMA';
ALTER TYPE public.app_role RENAME VALUE 'dpo' TO 'DPO_OPERACIONAL';
ALTER TYPE public.app_role RENAME VALUE 'csuite' TO 'C_SUITE';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role) values (new.id, 'ADMIN_SISTEMA'), (new.id, 'DPO_OPERACIONAL');
  end if;
  return new;
end;
$$;

create or replace function public.list_members()
returns table (id uuid, email text, display_name text, roles public.app_role[])
language sql stable security definer set search_path = public
as $$
  select p.id, p.email, p.display_name, coalesce(array_agg(r.role) filter (where r.role is not null), '{}')
  from public.profiles p left join public.user_roles r on r.user_id = p.id
  where public.has_role(auth.uid(), 'ADMIN_SISTEMA')
  group by p.id order by p.created_at
$$;

-- Workspace por CNPJ
create table public.workspace_empresa (
  cnpj text primary key check (cnpj ~ '^[0-9]{14}$'),
  razao_social text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
grant select, insert, update on public.workspace_empresa to authenticated;
grant all on public.workspace_empresa to service_role;
alter table public.workspace_empresa enable row level security;
create policy "members read empresas" on public.workspace_empresa for select to authenticated using (public.has_any_role(auth.uid()));
create policy "dpo or admin create empresa" on public.workspace_empresa for insert to authenticated
  with check (public.has_role(auth.uid(), 'ADMIN_SISTEMA') or public.has_role(auth.uid(), 'DPO_OPERACIONAL'));
create policy "members update empresa" on public.workspace_empresa for update to authenticated
  using (public.has_any_role(auth.uid())) with check (public.has_any_role(auth.uid()));
alter publication supabase_realtime add table public.workspace_empresa;
COMMENT ON TABLE public.workspace_state IS 'DEPRECATED: replaced by workspace_empresa (per CNPJ)';

-- Trilha de auditoria
create table public.trilha_auditoria_sistema (
  seq bigserial primary key,
  ts timestamptz not null default now(),
  user_id uuid not null,
  user_email text,
  role public.app_role not null,
  cnpj text,
  op text not null check (op in ('SELECT','INSERT','UPDATE','DELETE')),
  target text not null,
  detail text not null,
  prev_hash text not null,
  hash text not null
);
grant select on public.trilha_auditoria_sistema to authenticated;
grant all on public.trilha_auditoria_sistema to service_role;
alter table public.trilha_auditoria_sistema enable row level security;
create policy "admin and dpo read trilha" on public.trilha_auditoria_sistema for select to authenticated
  using (public.has_role(auth.uid(), 'ADMIN_SISTEMA') or public.has_role(auth.uid(), 'DPO_OPERACIONAL'));
COMMENT ON TABLE public.audit_log IS 'DEPRECATED: replaced by trilha_auditoria_sistema';

create or replace function public.registrar_trilha(_role public.app_role, _op text, _target text, _detail text, _cnpj text)
returns public.trilha_auditoria_sistema language plpgsql security definer set search_path = public, extensions
as $$
declare
  prev text; nseq bigint; nts timestamptz := now(); em text; row public.trilha_auditoria_sistema;
begin
  if not public.has_role(auth.uid(), _role) then raise exception 'role not granted'; end if;
  perform pg_advisory_xact_lock(271002);
  select hash into prev from public.trilha_auditoria_sistema order by seq desc limit 1;
  prev := coalesce(prev, repeat('0', 64));
  nseq := nextval(pg_get_serial_sequence('public.trilha_auditoria_sistema', 'seq'));
  select email into em from public.profiles where id = auth.uid();
  insert into public.trilha_auditoria_sistema (seq, ts, user_id, user_email, role, cnpj, op, target, detail, prev_hash, hash)
  values (nseq, nts, auth.uid(), em, _role, _cnpj, _op, _target, _detail, prev,
    encode(digest(nseq::text || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || _role::text || '|' || coalesce(_cnpj,'') || '|' || _op || '|' || _target || '|' || _detail || '|' || prev, 'sha256'), 'hex'))
  returning * into row;
  return row;
end;
$$;
revoke all on function public.registrar_trilha(public.app_role, text, text, text, text) from public, anon;
grant execute on function public.registrar_trilha(public.app_role, text, text, text, text) to authenticated;

create or replace function public.verificar_trilha()
returns table (ok boolean, total bigint, broken_at bigint)
language plpgsql stable security definer set search_path = public, extensions
as $$
declare r record; prev text := repeat('0', 64); n bigint := 0;
begin
  if not (public.has_role(auth.uid(), 'ADMIN_SISTEMA') or public.has_role(auth.uid(), 'DPO_OPERACIONAL')) then
    raise exception 'not allowed';
  end if;
  for r in select * from public.trilha_auditoria_sistema order by seq loop
    n := n + 1;
    if r.prev_hash <> prev or r.hash <> encode(digest(r.seq::text || '|' || to_char(r.ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || r.role::text || '|' || coalesce(r.cnpj,'') || '|' || r.op || '|' || r.target || '|' || r.detail || '|' || r.prev_hash, 'sha256'), 'hex') then
      return query select false, n, r.seq; return;
    end if;
    prev := r.hash;
  end loop;
  return query select true, n, null::bigint;
end;
$$;
grant execute on function public.verificar_trilha() to authenticated;