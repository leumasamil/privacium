create table public.faturamento_saas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  valor_mensalidade numeric(10,2) not null default 0,
  data_vencimento date not null default (date_trunc('month', now()) + interval '1 month' + interval '9 days')::date,
  status_pagamento text not null default 'PENDENTE' check (status_pagamento in ('PAGO','PENDENTE','ATRASADO')),
  link_fatura_simulado text not null default '',
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.faturamento_saas to authenticated;
grant all on public.faturamento_saas to service_role;
alter table public.faturamento_saas enable row level security;
create policy "admin only faturamento" on public.faturamento_saas for all to authenticated
  using (public.has_role(auth.uid(),'ADMIN_SISTEMA')) with check (public.has_role(auth.uid(),'ADMIN_SISTEMA'));

create table public.metricas_uso_ia (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas(id) on delete cascade,
  volume_tokens_sinteticos_gerados integer not null default 0,
  limite_mensal_tokens integer not null default 50000,
  quantidade_bloqueios_vazamento integer not null default 0,
  atualizado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.metricas_uso_ia to authenticated;
grant all on public.metricas_uso_ia to service_role;
alter table public.metricas_uso_ia enable row level security;
create policy "admin only metricas" on public.metricas_uso_ia for all to authenticated
  using (public.has_role(auth.uid(),'ADMIN_SISTEMA')) with check (public.has_role(auth.uid(),'ADMIN_SISTEMA'));

create or replace function public.preparar_conta_empresa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.faturamento_saas (empresa_id, valor_mensalidade, link_fatura_simulado)
  values (new.id, case when new.plano_assinatura = 'ENTERPRISE' then 4900 else 1500 end,
          'https://faturas.priva2ec.com.br/' || new.cnpj || '/' || to_char(now(),'YYYY-MM'));
  insert into public.metricas_uso_ia (empresa_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger trg_preparar_conta after insert on public.empresas for each row execute function public.preparar_conta_empresa();

create or replace function public.sync_mensalidade() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.plano_assinatura is distinct from old.plano_assinatura then
    update public.faturamento_saas set valor_mensalidade = case when new.plano_assinatura = 'ENTERPRISE' then 4900 else 1500 end
    where empresa_id = new.id and status_pagamento <> 'PAGO';
  end if;
  return new;
end $$;
create trigger trg_sync_mensalidade after update on public.empresas for each row execute function public.sync_mensalidade();

insert into public.faturamento_saas (empresa_id, valor_mensalidade, link_fatura_simulado)
select e.id, case when e.plano_assinatura = 'ENTERPRISE' then 4900 else 1500 end,
       'https://faturas.priva2ec.com.br/' || e.cnpj || '/' || to_char(now(),'YYYY-MM')
from public.empresas e where not exists (select 1 from public.faturamento_saas f where f.empresa_id = e.id);
insert into public.metricas_uso_ia (empresa_id) select id from public.empresas on conflict do nothing;

-- Escudo de IA: qualquer membro registra uso do próprio CNPJ, sem ler os dados globais
create or replace function public.registrar_uso_ia(_cnpj text, _tokens integer, _bloqueios integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_any_role(auth.uid()) then raise exception 'sem permissão'; end if;
  update public.metricas_uso_ia m set
    volume_tokens_sinteticos_gerados = m.volume_tokens_sinteticos_gerados + greatest(_tokens,0),
    quantidade_bloqueios_vazamento = m.quantidade_bloqueios_vazamento + greatest(_bloqueios,0),
    atualizado_em = now()
  from public.empresas e where e.id = m.empresa_id and e.cnpj = _cnpj;
end $$;
revoke execute on function public.registrar_uso_ia(text,integer,integer) from public, anon;
grant execute on function public.registrar_uso_ia(text,integer,integer) to authenticated;

-- GM por empresa, somente para ADMIN_SISTEMA
create or replace function public.admin_gm_empresas() returns table(cnpj text, gm numeric)
language plpgsql stable security definer set search_path = public as $$
declare teto numeric;
begin
  if not public.has_role(auth.uid(),'ADMIN_SISTEMA') then raise exception 'acesso restrito ao ADMIN_SISTEMA'; end if;
  select coalesce(sum(peso_criticidade),0) into teto from public.perguntas_diagnostico;
  return query select e.cnpj::text,
    case when teto = 0 then 0::numeric else round(coalesce(sum(r.pontuacao_obtida),0) * 100.0 / teto, 1) end
  from public.empresas e left join public.respostas_diagnostico r on r.empresa_cnpj = e.cnpj
  group by e.cnpj;
end $$;
revoke execute on function public.admin_gm_empresas() from public, anon;
grant execute on function public.admin_gm_empresas() to authenticated;

-- Empresa suspensa: verificação para bloquear acesso dos usuários do cliente
create or replace function public.empresa_ativa(_cnpj text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'ATIVO' from public.empresas where cnpj = _cnpj), true)
$$;
revoke execute on function public.empresa_ativa(text) from public, anon;
grant execute on function public.empresa_ativa(text) to authenticated;