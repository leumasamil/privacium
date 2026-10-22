create or replace function public.cnpj_valido(_c text) returns boolean language plpgsql immutable set search_path = public as $$
declare d text := regexp_replace(coalesce(_c,''), '\D', '', 'g'); s int; r int; i int;
  w1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2]; w2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
begin
  if length(d) <> 14 or d ~ '^(\d)\1+$' then return false; end if;
  s := 0; for i in 1..12 loop s := s + substr(d,i,1)::int * w1[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  if r <> substr(d,13,1)::int then return false; end if;
  s := 0; for i in 1..13 loop s := s + substr(d,i,1)::int * w2[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  return r = substr(d,14,1)::int;
end $$;

create or replace function public.cpf_valido(_c text) returns boolean language plpgsql immutable set search_path = public as $$
declare d text := regexp_replace(coalesce(_c,''), '\D', '', 'g'); s int; r int; i int;
begin
  if length(d) <> 11 or d ~ '^(\d)\1+$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substr(d,i,1)::int * (11 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  if r <> substr(d,10,1)::int then return false; end if;
  s := 0; for i in 1..10 loop s := s + substr(d,i,1)::int * (12 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  return r = substr(d,11,1)::int;
end $$;

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  cnpj varchar(14) not null unique check (public.cnpj_valido(cnpj)),
  razao_social text not null default '',
  plano_assinatura text not null default 'CORE' check (plano_assinatura in ('CORE','ENTERPRISE')),
  status text not null default 'ATIVO' check (status in ('ATIVO','INATIVO')),
  data_cadastro timestamptz not null default now()
);
create index empresas_status_idx on public.empresas(status);
grant select, update on public.empresas to authenticated;
grant all on public.empresas to service_role;
alter table public.empresas enable row level security;
create policy "members read empresas" on public.empresas for select to authenticated using (public.has_any_role(auth.uid()));
create policy "admin updates empresas" on public.empresas for update to authenticated using (public.has_role(auth.uid(),'ADMIN_SISTEMA')) with check (public.has_role(auth.uid(),'ADMIN_SISTEMA'));

insert into public.empresas (cnpj, razao_social, data_cadastro)
select cnpj, razao_social, created_at from public.workspace_empresa where public.cnpj_valido(cnpj) on conflict do nothing;

create or replace function public.sync_empresa() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.empresas (cnpj, razao_social) values (new.cnpj, new.razao_social) on conflict (cnpj) do nothing;
  return new;
end $$;
create trigger workspace_empresa_sync after insert on public.workspace_empresa for each row execute function public.sync_empresa();

create table public.usuarios (
  id uuid primary key references public.profiles(id) on delete cascade,
  empresa_id uuid references public.empresas(id) on delete set null,
  nome text not null default '',
  cpf varchar(11) unique check (cpf is null or public.cpf_valido(cpf)),
  email varchar(320) not null unique,
  cargo text not null default '',
  perfil_acesso public.app_role,
  data_criacao timestamptz not null default now()
);
create index usuarios_empresa_idx on public.usuarios(empresa_id);
grant select on public.usuarios to authenticated;
grant update (nome, cpf, cargo, empresa_id) on public.usuarios to authenticated;
grant all on public.usuarios to service_role;
alter table public.usuarios enable row level security;
create policy "own or admin read usuarios" on public.usuarios for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'ADMIN_SISTEMA'));
create policy "own or admin update usuarios" on public.usuarios for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'ADMIN_SISTEMA')) with check (id = auth.uid() or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

insert into public.usuarios (id, nome, email, perfil_acesso)
select p.id, coalesce(p.display_name,''), coalesce(p.email, p.id::text || '@sem-email.local'),
  (select r.role from public.user_roles r where r.user_id = p.id order by r.role limit 1)
from public.profiles p on conflict do nothing;

create or replace function public.sync_usuario_from_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (id, nome, email) values (new.id, coalesce(new.display_name,''), coalesce(new.email, new.id::text || '@sem-email.local')) on conflict do nothing;
  return new;
end $$;
create trigger profiles_sync_usuario after insert on public.profiles for each row execute function public.sync_usuario_from_profile();

create or replace function public.sync_perfil_acesso() returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid := coalesce(new.user_id, old.user_id);
begin
  update public.usuarios set perfil_acesso = (select r.role from public.user_roles r where r.user_id = uid order by r.role limit 1) where id = uid;
  return null;
end $$;
create trigger user_roles_sync_perfil after insert or delete on public.user_roles for each row execute function public.sync_perfil_acesso();

alter table public.trilha_auditoria_sistema
  add column id uuid not null default gen_random_uuid() unique,
  add column usuario_id uuid references public.usuarios(id),
  add column acao_executada text check (acao_executada in ('SELECT','INSERT','UPDATE','DELETE')),
  add column tabela_afetada text,
  add column campo_mascarado_acessado varchar(120),
  add column ip_origem text,
  add column timestamp_evento timestamptz,
  add column hash_integridade_sha256 text;
create index trilha_usuario_idx on public.trilha_auditoria_sistema(usuario_id);
create index trilha_ts_idx on public.trilha_auditoria_sistema(timestamp_evento);

create or replace function public.registrar_acesso(_role public.app_role, _op text, _target text, _detail text, _cnpj text, _campo text)
returns public.trilha_auditoria_sistema language plpgsql security definer set search_path = public, extensions
as $$
declare
  prev text; nseq bigint; nts timestamptz := now(); em text; row public.trilha_auditoria_sistema; ip text; nid uuid := gen_random_uuid();
begin
  if not public.has_role(auth.uid(), _role) then raise exception 'role not granted'; end if;
  perform pg_advisory_xact_lock(271002);
  select hash into prev from public.trilha_auditoria_sistema order by seq desc limit 1;
  prev := coalesce(prev, repeat('0', 64));
  nseq := nextval(pg_get_serial_sequence('public.trilha_auditoria_sistema', 'seq'));
  select email into em from public.profiles where id = auth.uid();
  begin
    ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', current_setting('request.headers', true)::json->>'cf-connecting-ip', ''), ',', 1);
  exception when others then ip := ''; end;
  insert into public.trilha_auditoria_sistema (seq, ts, user_id, user_email, role, cnpj, op, target, detail, prev_hash, hash,
    id, usuario_id, acao_executada, tabela_afetada, campo_mascarado_acessado, ip_origem, timestamp_evento, hash_integridade_sha256)
  values (nseq, nts, auth.uid(), em, _role, _cnpj, _op, _target, _detail, prev,
    encode(digest(nseq::text || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || _role::text || '|' || coalesce(_cnpj,'') || '|' || _op || '|' || _target || '|' || _detail || '|' || prev, 'sha256'), 'hex'),
    nid, (select id from public.usuarios where id = auth.uid()), _op, _target, nullif(_campo,''), nullif(trim(ip),''), nts,
    encode(digest(nid::text || '|' || auth.uid()::text || '|' || _op || '|' || _target || '|' || coalesce(_campo,'') || '|' || coalesce(trim(ip),'') || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), 'sha256'), 'hex'))
  returning * into row;
  return row;
end;
$$;
revoke all on function public.registrar_acesso(public.app_role, text, text, text, text, text) from public, anon;
grant execute on function public.registrar_acesso(public.app_role, text, text, text, text, text) to authenticated;

create or replace function public.registrar_trilha(_role public.app_role, _op text, _target text, _detail text, _cnpj text)
returns public.trilha_auditoria_sistema language sql security definer set search_path = public
as $$ select public.registrar_acesso(_role, _op, _target, _detail, _cnpj, null) $$;

create or replace function public.volumetria() returns table (empresas bigint, ativas bigint, usuarios bigint, registros_trilha bigint, perguntas bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'ADMIN_SISTEMA') then raise exception 'not allowed'; end if;
  return query select (select count(*) from public.empresas), (select count(*) from public.empresas where status='ATIVO'),
    (select count(*) from public.usuarios), (select count(*) from public.trilha_auditoria_sistema), (select count(*) from public.question_bank);
end $$;
revoke all on function public.volumetria() from public, anon;
grant execute on function public.volumetria() to authenticated;