-- Camada de PRODUTO INTERNO e TIPO DE AGENTE no ROT (LGPD arts. 5º, VI/VII/X, 6º, I, 16, 37 e 39).
-- Aditivo: linhas existentes recebem o padrão CONTROLADOR e seguem válidas.
ALTER TABLE public.registro_operacoes ADD COLUMN papel_agente text NOT NULL DEFAULT 'CONTROLADOR';
ALTER TABLE public.registro_operacoes ADD CONSTRAINT registro_operacoes_papel_check CHECK (papel_agente IN ('CONTROLADOR','OPERADOR','CONTROLADOR_OPERADOR'));
ALTER TABLE public.registro_operacoes ADD COLUMN contrato_controlador text;
ALTER TABLE public.registro_operacoes ADD CONSTRAINT registro_operacoes_operador_contrato_check CHECK (papel_agente <> 'OPERADOR' OR NULLIF(trim(contrato_controlador), '') IS NOT NULL);
ALTER TABLE public.registro_operacoes ADD COLUMN produto_interno text;
ALTER TABLE public.registro_operacoes ADD COLUMN destino_produto jsonb;
ALTER TABLE public.registro_operacoes ADD COLUMN prazo_produto text;
ALTER TABLE public.registro_operacoes ADD COLUMN fundamento_produto text;
ALTER TABLE public.registro_operacoes ADD COLUMN origem_compartilhamento jsonb;
COMMENT ON COLUMN public.registro_operacoes.papel_agente IS 'Papel do agente na linha: CONTROLADOR / OPERADOR / CONTROLADOR_OPERADOR (LGPD art. 5º, VI e VII). Padrão herdado do enquadramento do Bloco 1, editável por linha.';
COMMENT ON COLUMN public.registro_operacoes.contrato_controlador IS 'Contrato com o controlador que vincula a finalidade quando a linha é OPERADOR (LGPD art. 39).';
COMMENT ON COLUMN public.registro_operacoes.produto_interno IS 'Produto interno gerado: resultado material das operações de tratamento (LGPD art. 5º, X). Conceito de método, não categoria jurídica autônoma. Obrigatório quando o ciclo inclui Processar.';
COMMENT ON COLUMN public.registro_operacoes.destino_produto IS 'Destino do produto (Etapa 2): {tipo: INTERNO|EXTERNO|ELIMINACAO, area_setor_destino?, terceiro?, linha_receptor_id?, linha_receptor_codigo?}.';
COMMENT ON COLUMN public.registro_operacoes.prazo_produto IS 'Prazo de eliminação do produto (LGPD art. 16), separado do prazo do insumo (tempo_retencao).';
COMMENT ON COLUMN public.registro_operacoes.fundamento_produto IS 'Fundamento do prazo do produto (LGPD art. 16), separado do fundamento do insumo (base_prazo).';
COMMENT ON COLUMN public.registro_operacoes.origem_compartilhamento IS 'Linha criada automaticamente no setor receptor: {estado: "insumo recebido", linha_origem_id, codigo_origem, area_setor_origem}.';

-- A varredura de termos proibidos passa a cobrir os novos campos de texto.
CREATE OR REPLACE FUNCTION public.validar_registro_operacao() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE abbr text; n int; tudo text;
BEGIN
  IF NOT (NEW.hipotese_tratamento LIKE 'Art. 7º%' OR NEW.hipotese_tratamento LIKE 'Art. 11%') THEN
    RAISE EXCEPTION 'Hipótese de Tratamento deve ser um inciso dos Arts. 7º ou 11 da LGPD';
  END IF;
  tudo := lower(concat_ws(' ', NEW.finalidade_especifica, NEW.hipotese_tratamento, NEW.tempo_retencao, NEW.base_prazo, NEW.compartilhamento, NEW.justificativa_mitigacao,
    NEW.area_setor, NEW.insumo, NEW.meio_fornecimento, NEW.produto_interno, NEW.contrato_controlador, NEW.prazo_produto, NEW.fundamento_produto,
    array_to_string(NEW.categoria_titulares,' '), array_to_string(NEW.dados_pessoais,' '), array_to_string(NEW.dados_sensiveis,' '), array_to_string(NEW.salvaguardas,' ')));
  IF tudo ~ '(base legal|hip[oó]tese legal)' THEN
    RAISE EXCEPTION 'Termo proibido: use "Hipótese de Tratamento" (terminologia da LGPD)';
  END IF;
  IF ('Menores de Idade' = ANY(NEW.categoria_titulares) OR EXISTS (SELECT 1 FROM unnest(NEW.dados_sensiveis) s WHERE s <> 'N/A'))
     AND length(trim(coalesce(NEW.justificativa_mitigacao,''))) < 20 THEN
    RAISE EXCEPTION 'Linha de risco exige justificativa das medidas mitigadoras (mínimo 20 caracteres)';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.criado_por := auth.uid();
    abbr := CASE NEW.setor WHEN 'RH' THEN 'RH' WHEN 'TI' THEN 'TI' WHEN 'Marketing' THEN 'MKT' WHEN 'Compras' THEN 'COM' WHEN 'Recepção' THEN 'REC' WHEN 'Jurídico' THEN 'JUR' ELSE 'FIN' END;
    PERFORM pg_advisory_xact_lock(hashtext(NEW.empresa_cnpj || NEW.setor));
    SELECT count(*) + 1 INTO n FROM public.registro_operacoes WHERE empresa_cnpj = NEW.empresa_cnpj AND setor = NEW.setor;
    NEW.codigo := 'PRIVA-' || abbr || '-' || lpad(n::text, 3, '0');
    WHILE EXISTS (SELECT 1 FROM public.registro_operacoes WHERE empresa_cnpj = NEW.empresa_cnpj AND codigo = NEW.codigo) LOOP
      n := n + 1; NEW.codigo := 'PRIVA-' || abbr || '-' || lpad(n::text, 3, '0');
    END LOOP;
  ELSE
    NEW.codigo := OLD.codigo; NEW.setor := OLD.setor; NEW.empresa_cnpj := OLD.empresa_cnpj; NEW.criado_por := OLD.criado_por;
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.validar_registro_operacao() FROM PUBLIC, anon, authenticated;