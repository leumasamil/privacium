create table public.ativos_seguranca (
  id uuid primary key default gen_random_uuid(),
  empresa_cnpj varchar(14) not null references public.empresas(cnpj) on delete cascade,
  tipo varchar(10) not null check (tipo in ('ENDPOINT','COFRE')),
  identificador text not null,
  descricao text not null default '',
  protegido boolean not null default false,
  provedor_nuvem text,
  estrutura_pasta text,
  hash_integridade varchar(64),
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_cnpj, tipo, identificador)
);
create index ativos_cnpj_idx on public.ativos_seguranca(empresa_cnpj);
grant select, insert, update, delete on public.ativos_seguranca to authenticated;
grant all on public.ativos_seguranca to service_role;
alter table public.ativos_seguranca enable row level security;
create policy "members read ativos" on public.ativos_seguranca for select to authenticated using (public.has_any_role(auth.uid()));
create policy "dpo admin write ativos" on public.ativos_seguranca for all to authenticated
  using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'))
  with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

create table public.chaves_recuperacao (
  ativo_id uuid primary key references public.ativos_seguranca(id) on delete cascade,
  chave text not null,
  registrado_por uuid default auth.uid(),
  registrado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.chaves_recuperacao to authenticated;
grant all on public.chaves_recuperacao to service_role;
alter table public.chaves_recuperacao enable row level security;
create policy "dpo admin chaves" on public.chaves_recuperacao for all to authenticated
  using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'))
  with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

alter publication supabase_realtime add table public.ativos_seguranca;