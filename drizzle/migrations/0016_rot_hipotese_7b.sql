ALTER TABLE public.registro_operacoes ADD COLUMN IF NOT EXISTS hipotese_sensivel text;
COMMENT ON COLUMN public.registro_operacoes.hipotese_tratamento IS 'Campo 7A: hipótese do art. 7º (dado pessoal). Linhas antigas podem conter art. 11.';
COMMENT ON COLUMN public.registro_operacoes.hipotese_sensivel IS 'Campo 7B: hipótese do art. 11 (dado pessoal sensível).';

create or replace function public.validar_registro_operacao() returns trigger language plpgsql security definer set search_path = public as $$
declare abbr text; n int; tudo text; sens boolean;
begin
  sens := exists (select 1 from unnest(new.dados_sensiveis) s where s <> 'N/A');
  if not (new.hipotese_tratamento like 'Art. 7º%' or new.hipotese_tratamento like 'Art. 11%') then
    raise exception 'Campo 7A: selecione uma hipótese de tratamento do art. 7º da LGPD';
  end if;
  if new.hipotese_sensivel is not null and new.hipotese_sensivel <> '' and new.hipotese_sensivel not like 'Art. 11%' then
    raise exception 'Campo 7B: a hipótese deve ser do art. 11 da LGPD';
  end if;
  if not sens and coalesce(new.hipotese_sensivel,'') <> '' then
    raise exception 'Campo 7B só se aplica quando há dado pessoal sensível';
  end if;
  if sens and coalesce(new.hipotese_sensivel,'') = '' and new.hipotese_tratamento not like 'Art. 11%' then
    raise exception 'Campo 7B obrigatório: dado pessoal sensível exige hipótese do art. 11';
  end if;
  if new.hipotese_sensivel = '' then new.hipotese_sensivel := null; end if;
  tudo := lower(concat_ws(' ', new.finalidade_especifica, new.hipotese_tratamento, new.hipotese_sensivel, new.tempo_retencao, new.base_prazo, new.compartilhamento, new.justificativa_mitigacao,
    array_to_string(new.categoria_titulares,' '), array_to_string(new.dados_pessoais,' '), array_to_string(new.dados_sensiveis,' '), array_to_string(new.salvaguardas,' ')));
  if tudo ~ '(base legal|hip[oó]tese legal)' then
    raise exception 'Termo proibido: use "Hipótese de Tratamento" (terminologia da LGPD)';
  end if;
  if ('Menores de Idade' = any(new.categoria_titulares) or sens)
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