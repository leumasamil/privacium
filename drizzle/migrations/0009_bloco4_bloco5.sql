create table public.lotes_pgaudit (
  id uuid primary key default gen_random_uuid(),
  empresa_cnpj text not null,
  mes_referencia text not null,
  linhas integer not null default 0,
  conteudo text not null,
  hash_sha256 text,
  gerado_por uuid default auth.uid(),
  gerado_em timestamptz not null default now(),
  unique (empresa_cnpj, mes_referencia)
);
grant select, insert, update on public.lotes_pgaudit to authenticated;
grant all on public.lotes_pgaudit to service_role;
alter table public.lotes_pgaudit enable row level security;
create policy "members read lotes" on public.lotes_pgaudit for select to authenticated using (public.has_any_role(auth.uid()));
create policy "dpo admin write lotes" on public.lotes_pgaudit for all to authenticated
  using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'))
  with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

create table public.incidentes_seguranca (
  id uuid primary key default gen_random_uuid(),
  empresa_cnpj text not null,
  iniciado_em timestamptz not null default now(),
  passos boolean[] not null default array[false,false,false,false,false,false],
  comunicacao jsonb not null default '{}'::jsonb,
  enviado_anpd_em timestamptz,
  encerrado_em timestamptz,
  criado_por uuid default auth.uid()
);
grant select, insert, update on public.incidentes_seguranca to authenticated;
grant all on public.incidentes_seguranca to service_role;
alter table public.incidentes_seguranca enable row level security;
create policy "members read incidentes" on public.incidentes_seguranca for select to authenticated using (public.has_any_role(auth.uid()));
create policy "dpo admin write incidentes" on public.incidentes_seguranca for all to authenticated
  using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'))
  with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

create table public.ripd_ia (
  empresa_cnpj text primary key,
  sistema_avaliado text not null default '',
  riscos jsonb not null default '{}'::jsonb,
  escudo_digital text not null default '',
  atualizado_por uuid default auth.uid(),
  atualizado_em timestamptz not null default now()
);
grant select, insert, update on public.ripd_ia to authenticated;
grant all on public.ripd_ia to service_role;
alter table public.ripd_ia enable row level security;
create policy "members read ripd" on public.ripd_ia for select to authenticated using (public.has_any_role(auth.uid()));
create policy "dpo admin write ripd" on public.ripd_ia for all to authenticated
  using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'))
  with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

create table public.ciclos_priva (
  id uuid primary key default gen_random_uuid(),
  empresa_cnpj text not null,
  ano_fiscal integer not null,
  reducao_dosimetria integer not null,
  assinaturas jsonb not null default '{}'::jsonb,
  finalizado_por uuid default auth.uid(),
  finalizado_em timestamptz not null default now(),
  unique (empresa_cnpj, ano_fiscal)
);
grant select, insert on public.ciclos_priva to authenticated;
grant all on public.ciclos_priva to service_role;
alter table public.ciclos_priva enable row level security;
create policy "members read ciclos" on public.ciclos_priva for select to authenticated using (public.has_any_role(auth.uid()));
create policy "dpo admin insert ciclos" on public.ciclos_priva for insert to authenticated
  with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

alter publication supabase_realtime add table public.lotes_pgaudit;
alter publication supabase_realtime add table public.incidentes_seguranca;
alter publication supabase_realtime add table public.ripd_ia;
alter publication supabase_realtime add table public.ciclos_priva;