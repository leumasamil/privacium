create or replace function public.cnpj_liberado(_cnpj text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'ADMIN_SISTEMA')
      or coalesce((select status = 'ATIVO' from public.empresas where cnpj = _cnpj), true)
$$;
revoke execute on function public.cnpj_liberado(text) from public, anon;
grant execute on function public.cnpj_liberado(text) to authenticated;

create policy "bloqueio empresa inativa" on public.workspace_empresa as restrictive for all to authenticated using (public.cnpj_liberado(cnpj)) with check (public.cnpj_liberado(cnpj));
create policy "bloqueio empresa inativa" on public.respostas_diagnostico as restrictive for all to authenticated using (public.cnpj_liberado(empresa_cnpj)) with check (public.cnpj_liberado(empresa_cnpj));
create policy "bloqueio empresa inativa" on public.registro_operacoes as restrictive for all to authenticated using (public.cnpj_liberado(empresa_cnpj)) with check (public.cnpj_liberado(empresa_cnpj));
create policy "bloqueio empresa inativa" on public.ativos_seguranca as restrictive for all to authenticated using (public.cnpj_liberado(empresa_cnpj)) with check (public.cnpj_liberado(empresa_cnpj));
create policy "bloqueio empresa inativa" on public.lotes_pgaudit as restrictive for all to authenticated using (public.cnpj_liberado(empresa_cnpj)) with check (public.cnpj_liberado(empresa_cnpj));
create policy "bloqueio empresa inativa" on public.incidentes_seguranca as restrictive for all to authenticated using (public.cnpj_liberado(empresa_cnpj)) with check (public.cnpj_liberado(empresa_cnpj));
create policy "bloqueio empresa inativa" on public.ripd_ia as restrictive for all to authenticated using (public.cnpj_liberado(empresa_cnpj)) with check (public.cnpj_liberado(empresa_cnpj));
create policy "bloqueio empresa inativa" on public.ciclos_priva as restrictive for all to authenticated using (public.cnpj_liberado(empresa_cnpj)) with check (public.cnpj_liberado(empresa_cnpj));
create policy "bloqueio empresa inativa" on public.chaves_recuperacao as restrictive for all to authenticated
  using (public.cnpj_liberado((select a.empresa_cnpj from public.ativos_seguranca a where a.id = ativo_id)))
  with check (public.cnpj_liberado((select a.empresa_cnpj from public.ativos_seguranca a where a.id = ativo_id)));

-- Registro do uso de IA também respeita a suspensão
create or replace function public.registrar_uso_ia(_cnpj text, _tokens integer, _bloqueios integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_any_role(auth.uid()) or not public.cnpj_liberado(_cnpj) then raise exception 'sem permissão'; end if;
  update public.metricas_uso_ia m set
    volume_tokens_sinteticos_gerados = m.volume_tokens_sinteticos_gerados + greatest(_tokens,0),
    quantidade_bloqueios_vazamento = m.quantidade_bloqueios_vazamento + greatest(_bloqueios,0),
    atualizado_em = now()
  from public.empresas e where e.id = m.empresa_id and e.cnpj = _cnpj;
end $$;

-- Empresa do usuário logado
create or replace function public.minha_empresa_id() returns uuid
language sql stable security definer set search_path = public as $$
  select empresa_id from public.usuarios where id = auth.uid()
$$;
revoke execute on function public.minha_empresa_id() from public, anon;
grant execute on function public.minha_empresa_id() to authenticated;

-- Trilha: ADMIN global; DPO apenas da própria empresa (por usuário ou CNPJ); C_SUITE sem acesso
drop policy "admin and dpo read trilha" on public.trilha_auditoria_sistema;
create policy "admin le toda trilha" on public.trilha_auditoria_sistema for select to authenticated
  using (public.has_role(auth.uid(),'ADMIN_SISTEMA'));
create policy "dpo le trilha da propria empresa" on public.trilha_auditoria_sistema for select to authenticated
  using (
    public.has_role(auth.uid(),'DPO_OPERACIONAL')
    and public.minha_empresa_id() is not null
    and (
      usuario_id in (select u.id from public.usuarios u where u.empresa_id = public.minha_empresa_id())
      or cnpj = (select e.cnpj from public.empresas e where e.id = public.minha_empresa_id())
    )
    and public.cnpj_liberado(cnpj)
  );

-- Quem cadastra a primeira empresa fica vinculado a ela
create or replace function public.vincular_criador_empresa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.usuarios set empresa_id = new.id where id = auth.uid() and empresa_id is null
    and not public.has_role(auth.uid(),'ADMIN_SISTEMA');
  return new;
end $$;
create trigger trg_vincular_criador after insert on public.empresas for each row execute function public.vincular_criador_empresa();

-- Mensalidades oficiais: CORE R$ 450,00 / ENTERPRISE R$ 2.450,00
create or replace function public.preparar_conta_empresa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.faturamento_saas (empresa_id, valor_mensalidade, link_fatura_simulado)
  values (new.id, case when new.plano_assinatura = 'ENTERPRISE' then 2450.00 else 450.00 end,
          'https://faturas.priva2ec.com.br/' || new.cnpj || '/' || to_char(now(),'YYYY-MM'));
  insert into public.metricas_uso_ia (empresa_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create or replace function public.sync_mensalidade() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.plano_assinatura is distinct from old.plano_assinatura then
    update public.faturamento_saas set valor_mensalidade = case when new.plano_assinatura = 'ENTERPRISE' then 2450.00 else 450.00 end
    where empresa_id = new.id and status_pagamento <> 'PAGO';
  end if;
  return new;
end $$;
update public.faturamento_saas f set valor_mensalidade = case when e.plano_assinatura = 'ENTERPRISE' then 2450.00 else 450.00 end
from public.empresas e where e.id = f.empresa_id and f.status_pagamento <> 'PAGO';