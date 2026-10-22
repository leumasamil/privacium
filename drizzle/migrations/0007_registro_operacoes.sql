create table public.registro_operacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_cnpj varchar(14) not null references public.empresas(cnpj) on delete cascade,
  setor varchar(40) not null check (setor in ('RH','TI','Marketing','Compras','Recepção','Jurídico','Financeiro')),
  codigo varchar(24) not null default '',
  genero_verbo varchar(20) not null check (genero_verbo in ('Coletar','Reter','Processar','Compartilhar','Eliminar')),
  categoria_titulares text[] not null default '{}',
  dados_pessoais text[] not null default '{}',
  dados_sensiveis text[] not null default '{N/A}',
  finalidade_especifica text not null,
  hipotese_tratamento text not null,
  tempo_retencao text not null,
  base_prazo text not null,
  compartilhamento text not null default 'Não Compartilhado',
  salvaguardas text[] not null default '{}',
  infraestrutura varchar(30) not null check (infraestrutura in ('Servidor Local','Nuvem Corporativa','Arquivo Físico')),
  justificativa_mitigacao text,
  criado_por uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_cnpj, codigo)
);
create index registro_operacoes_cnpj_idx on public.registro_operacoes(empresa_cnpj);
grant select, insert, update, delete on public.registro_operacoes to authenticated;
grant all on public.registro_operacoes to service_role;
alter table public.registro_operacoes enable row level security;
create policy "members read rot" on public.registro_operacoes for select to authenticated using (public.has_any_role(auth.uid()));
create policy "dpo admin insert rot" on public.registro_operacoes for insert to authenticated with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));
create policy "dpo admin update rot" on public.registro_operacoes for update to authenticated using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA')) with check (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));
create policy "dpo admin delete rot" on public.registro_operacoes for delete to authenticated using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'));

create or replace function public.validar_registro_operacao() returns trigger language plpgsql security definer set search_path = public as $$
declare abbr text; n int; tudo text;
begin
  if not (new.hipotese_tratamento like 'Art. 7º%' or new.hipotese_tratamento like 'Art. 11%') then
    raise exception 'Hipótese de Tratamento deve ser um inciso dos Arts. 7º ou 11 da LGPD';
  end if;
  tudo := lower(concat_ws(' ', new.finalidade_especifica, new.hipotese_tratamento, new.tempo_retencao, new.base_prazo, new.compartilhamento, new.justificativa_mitigacao,
    array_to_string(new.categoria_titulares,' '), array_to_string(new.dados_pessoais,' '), array_to_string(new.dados_sensiveis,' '), array_to_string(new.salvaguardas,' ')));
  if tudo ~ '(base legal|hip[oó]tese legal)' then
    raise exception 'Termo proibido: use "Hipótese de Tratamento" (terminologia da LGPD)';
  end if;
  if ('Menores de Idade' = any(new.categoria_titulares) or exists (select 1 from unnest(new.dados_sensiveis) s where s <> 'N/A'))
     and length(trim(coalesce(new.justificativa_mitigacao,''))) < 20 then
    raise exception 'Linha de risco exige justificativa das medidas mitigadoras (mínimo 20 caracteres)';
  end if;
  if tg_op = 'INSERT' then
    new.criado_por := auth.uid();
    abbr := case new.setor when 'RH' then 'RH' when 'TI' then 'TI' when 'Marketing' then 'MKT' when 'Compras' then 'COM' when 'Recepção' then 'REC' when 'Jurídico' then 'JUR' else 'FIN' end;
    perform pg_advisory_xact_lock(hashtext(new.empresa_cnpj || new.setor));
    select count(*) + 1 into n from public.registro_operacoes where empresa_cnpj = new.empresa_cnpj and setor = new.setor;
    new.codigo := 'PRIVA-' || abbr || '-' || lpad(n::text, 3, '0');
    while exists (select 1 from public.registro_operacoes where empresa_cnpj = new.empresa_cnpj and codigo = new.codigo) loop
      n := n + 1; new.codigo := 'PRIVA-' || abbr || '-' || lpad(n::text, 3, '0');
    end loop;
  else
    new.codigo := old.codigo; new.setor := old.setor; new.empresa_cnpj := old.empresa_cnpj; new.criado_por := old.criado_por;
  end if;
  new.atualizado_em := now();
  return new;
end $$;
revoke execute on function public.validar_registro_operacao() from public, anon, authenticated;
create trigger registro_operacoes_validar before insert or update on public.registro_operacoes for each row execute function public.validar_registro_operacao();

alter publication supabase_realtime add table public.registro_operacoes;