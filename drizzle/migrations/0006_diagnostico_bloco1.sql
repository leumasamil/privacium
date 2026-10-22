create table public.perguntas_diagnostico (
  id uuid primary key default gen_random_uuid(),
  ordem int not null unique,
  setor varchar(40) not null check (setor in ('RH','TI','Marketing','Compras','Recepção','Jurídico','Financeiro')),
  questao_critica varchar(160) not null,
  enunciado text not null,
  peso_criticidade int not null check (peso_criticidade between 1 and 10)
);
create index perguntas_setor_idx on public.perguntas_diagnostico(setor);
grant select on public.perguntas_diagnostico to authenticated;
grant all on public.perguntas_diagnostico to service_role;
alter table public.perguntas_diagnostico enable row level security;
create policy "members read perguntas" on public.perguntas_diagnostico for select to authenticated using (public.has_any_role(auth.uid()));
create policy "admin manage perguntas" on public.perguntas_diagnostico for all to authenticated using (public.has_role(auth.uid(),'ADMIN_SISTEMA')) with check (public.has_role(auth.uid(),'ADMIN_SISTEMA'));

with setores as (select array['RH','TI','Marketing','Compras','Recepção','Jurídico','Financeiro'] a),
cats as (select array[
  'Segurança da Informação (Art. 46)','Hipótese de Tratamento (Arts. 7º e 11)',
  'Dados Pessoais Sensíveis (Art. 5º, II)','Compartilhamento com Terceiros (Arts. 26 e 39)',
  'Especificação da Finalidade (Art. 6º, I)','Responsabilização e Prestação de Contas (Art. 6º, X)',
  'Limitação e Minimização de Dados (Art. 6º, III)','Qualidade e Precisão de Dados (Art. 6º, V)'] a,
  array[10,10,9,9,8,8,7,7] w)
insert into public.perguntas_diagnostico (ordem, setor, questao_critica, enunciado, peso_criticidade)
select n, s.a[((n-1)%7)+1], c.a[(((n-1)/7)%8)+1],
  case (n-1)/56
    when 0 then 'No departamento ' || s.a[((n-1)%7)+1] || ', existem salvaguardas técnicas, barreiras lógicas ou rotinas ativas para garantir a conformidade com a Questão Crítica de ' || c.a[(((n-1)/7)%8)+1] || '?'
    when 1 then 'No departamento ' || s.a[((n-1)%7)+1] || ', há evidência documental (política, registro ou contrato) que comprove a conformidade com a Questão Crítica de ' || c.a[(((n-1)/7)%8)+1] || '?'
    else 'No departamento ' || s.a[((n-1)%7)+1] || ', a conformidade com a Questão Crítica de ' || c.a[(((n-1)/7)%8)+1] || ' é monitorada periodicamente, com responsável designado e plano de correção?'
  end,
  c.w[(((n-1)/7)%8)+1]
from generate_series(1,166) n, setores s, cats c;

create or replace function public.meu_cpf() returns text language sql stable security definer set search_path = public as $$
  select cpf from public.usuarios where id = auth.uid()
$$;
revoke all on function public.meu_cpf() from public, anon;
grant execute on function public.meu_cpf() to authenticated;

create table public.respostas_diagnostico (
  id uuid primary key default gen_random_uuid(),
  empresa_cnpj varchar(14) not null references public.empresas(cnpj) on delete cascade,
  pergunta_id uuid not null references public.perguntas_diagnostico(id) on delete cascade,
  usuario_cpf varchar(11) not null references public.usuarios(cpf),
  resposta_binaria varchar(3) not null check (resposta_binaria in ('SIM','NÃO')),
  pontuacao_obtida int not null default 0,
  timestamp_resposta timestamptz not null default now(),
  unique (empresa_cnpj, pergunta_id)
);
create index respostas_cnpj_idx on public.respostas_diagnostico(empresa_cnpj);
grant select, insert, update on public.respostas_diagnostico to authenticated;
grant all on public.respostas_diagnostico to service_role;
alter table public.respostas_diagnostico enable row level security;
create policy "members read respostas" on public.respostas_diagnostico for select to authenticated using (public.has_any_role(auth.uid()));
create policy "auditor insert respostas" on public.respostas_diagnostico for insert to authenticated
  with check ((public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA')) and usuario_cpf = public.meu_cpf());
create policy "auditor update respostas" on public.respostas_diagnostico for update to authenticated
  using (public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA'))
  with check ((public.has_role(auth.uid(),'DPO_OPERACIONAL') or public.has_role(auth.uid(),'ADMIN_SISTEMA')) and usuario_cpf = public.meu_cpf());

create or replace function public.pontuar_resposta() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.pontuacao_obtida := case when new.resposta_binaria = 'SIM' then (select peso_criticidade from public.perguntas_diagnostico where id = new.pergunta_id) else 0 end;
  new.timestamp_resposta := now();
  return new;
end $$;
revoke execute on function public.pontuar_resposta() from public, anon, authenticated;
create trigger respostas_pontuar before insert or update on public.respostas_diagnostico for each row execute function public.pontuar_resposta();

alter publication supabase_realtime add table public.respostas_diagnostico;