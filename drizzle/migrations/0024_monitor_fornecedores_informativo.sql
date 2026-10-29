CREATE TABLE public.monitor_fornecedores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_cnpj varchar(14) NOT NULL REFERENCES public.empresas(cnpj), fornecedor_nome text NOT NULL, fonte text NOT NULL DEFAULT 'Have I Been Pwned', data_vazamento date NOT NULL, contas_afetadas bigint NOT NULL DEFAULT 0 CHECK(contas_afetadas>=0), tipos_dados text[] NOT NULL DEFAULT '{}', url_referencia text NOT NULL CHECK(url_referencia LIKE 'https://haveibeenpwned.com/%'), processo_rot_id uuid REFERENCES public.registro_operacoes(id), ativo_id uuid REFERENCES public.ativos_seguranca(id), campo_origem text NOT NULL, referencia_chave text NOT NULL, verificado_em timestamptz NOT NULL DEFAULT now(), estado text NOT NULL DEFAULT 'novo' CHECK(estado IN ('novo','em_avaliacao','descartado','confirmado_impacto')), avaliado_por uuid, avaliado_em timestamptz, justificativa text, triagem jsonb NOT NULL DEFAULT '{}', incidente_proprio_id uuid REFERENCES public.incidentes_seguranca(id), UNIQUE(empresa_cnpj,referencia_chave)
);
GRANT SELECT ON public.monitor_fornecedores TO authenticated;
GRANT ALL ON public.monitor_fornecedores TO service_role;
ALTER TABLE public.monitor_fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY monitor_leitura ON public.monitor_fornecedores FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'ADMIN_SISTEMA') OR (public.has_any_role(auth.uid()) AND empresa_cnpj=(SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())));
CREATE POLICY monitor_empresa_ativa ON public.monitor_fornecedores AS RESTRICTIVE FOR ALL TO authenticated USING(public.cnpj_liberado(empresa_cnpj)) WITH CHECK(public.cnpj_liberado(empresa_cnpj));
CREATE TABLE public.monitor_verificacoes (
 empresa_cnpj varchar(14) PRIMARY KEY REFERENCES public.empresas(cnpj), tentativa_em timestamptz, sucesso_em timestamptz, erro boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.monitor_verificacoes TO authenticated;
GRANT ALL ON public.monitor_verificacoes TO service_role;
ALTER TABLE public.monitor_verificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY verificacoes_leitura ON public.monitor_verificacoes FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'ADMIN_SISTEMA') OR (public.has_any_role(auth.uid()) AND empresa_cnpj=(SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())));
CREATE POLICY verificacoes_empresa_ativa ON public.monitor_verificacoes AS RESTRICTIVE FOR ALL TO authenticated USING(public.cnpj_liberado(empresa_cnpj)) WITH CHECK(public.cnpj_liberado(empresa_cnpj));
CREATE FUNCTION public.iniciar_verificacao_fornecedores(_cnpj text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE momento timestamptz:=clock_timestamp(); ultimo timestamptz;
BEGIN
 IF auth.uid() IS NULL OR NOT(public.has_role(auth.uid(),'ADMIN_SISTEMA') OR public.has_role(auth.uid(),'DPO_OPERACIONAL')) OR NOT public.cnpj_liberado(_cnpj) OR (NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND _cnpj IS DISTINCT FROM (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 INSERT INTO public.monitor_verificacoes(empresa_cnpj) VALUES(_cnpj) ON CONFLICT DO NOTHING;
 SELECT tentativa_em INTO ultimo FROM public.monitor_verificacoes WHERE empresa_cnpj=_cnpj FOR UPDATE;
 IF ultimo IS NOT NULL AND momento<ultimo+interval '1 hour' THEN RETURN false; END IF;
 UPDATE public.monitor_verificacoes SET tentativa_em=momento,erro=false WHERE empresa_cnpj=_cnpj;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.iniciar_verificacao_fornecedores(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.iniciar_verificacao_fornecedores(text) TO authenticated;
CREATE FUNCTION public.avaliar_fornecedor(_id uuid,_estado text,_justificativa text DEFAULT '',_triagem jsonb DEFAULT '{}'::jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.monitor_fornecedores; novo uuid; papel public.app_role;
BEGIN
 IF auth.uid() IS NULL OR NOT(public.has_role(auth.uid(),'ADMIN_SISTEMA') OR public.has_role(auth.uid(),'DPO_OPERACIONAL')) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT * INTO m FROM public.monitor_fornecedores WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR NOT public.cnpj_liberado(m.empresa_cnpj) OR (NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND m.empresa_cnpj IS DISTINCT FROM (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())) THEN RAISE EXCEPTION 'Sem permissão para este CNPJ'; END IF;
 IF _estado NOT IN ('em_avaliacao','descartado','confirmado_impacto') OR _estado IS NULL THEN RAISE EXCEPTION 'Estado inválido'; END IF;
 IF m.estado IN ('descartado','confirmado_impacto') THEN RAISE EXCEPTION 'Avaliação já finalizada'; END IF;
 IF _estado IN ('descartado','confirmado_impacto') AND length(trim(coalesce(_justificativa,'')))=0 THEN RAISE EXCEPTION 'Informe a justificativa da decisão da empresa'; END IF;
 IF length(coalesce(_justificativa,''))>4000 OR jsonb_typeof(_triagem) IS DISTINCT FROM 'object' OR octet_length(_triagem::text)>2000 THEN RAISE EXCEPTION 'Avaliação inválida'; END IF;
 IF _estado='confirmado_impacto' THEN
  IF _triagem->>'titulares' IS DISTINCT FROM 'sim' THEN RAISE EXCEPTION 'Confirme impacto em titulares próprios'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.registro_operacoes WHERE id=m.processo_rot_id AND empresa_cnpj=m.empresa_cnpj) AND m.processo_rot_id IS NOT NULL THEN RAISE EXCEPTION 'Processo inválido'; END IF;
  INSERT INTO public.incidentes_seguranca(empresa_cnpj,processo_id) VALUES(m.empresa_cnpj,m.processo_rot_id) RETURNING id INTO novo;
 END IF;
 UPDATE public.monitor_fornecedores SET estado=_estado,avaliado_por=auth.uid(),avaliado_em=clock_timestamp(),justificativa=trim(_justificativa),triagem=jsonb_build_object('sensivel',coalesce(_triagem->>'sensivel','nao_informado'),'titulares',coalesce(_triagem->>'titulares','nao_informado'),'contrato',coalesce(_triagem->>'contrato','nao_informado')),incidente_proprio_id=novo WHERE id=_id;
 papel:=CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END;
 -- Audit company decisions only: never copy supplier names, breach facts or free text into evidence.
 PERFORM public.registrar_trilha(papel,'UPDATE','monitor_fornecedores','Decisão da empresa sobre avaliação interna ' || _id || ': ' || _estado,m.empresa_cnpj);
 IF novo IS NOT NULL THEN PERFORM public.registrar_trilha(papel,'INSERT','incidentes_seguranca','Empresa confirmou impacto próprio e declarou incidente ' || novo,m.empresa_cnpj); END IF;
 RETURN novo;
END $$;
REVOKE ALL ON FUNCTION public.avaliar_fornecedor(uuid,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.avaliar_fornecedor(uuid,text,text,jsonb) TO authenticated;
CREATE FUNCTION public.registrar_avaliacoes_pendentes_encerramento() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE total integer; papel public.app_role;
BEGIN
 IF OLD.encerrado_em IS NULL AND NEW.encerrado_em IS NOT NULL THEN
  SELECT count(*) INTO total FROM public.monitor_fornecedores WHERE empresa_cnpj=NEW.empresa_cnpj AND estado IN ('novo','em_avaliacao');
  IF total>0 THEN
   papel:=CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END;
   PERFORM public.registrar_trilha(papel,'UPDATE','incidentes_seguranca','Empresa encerrou incidente com ' || total || ' avaliações informativas pendentes; não bloqueantes',NEW.empresa_cnpj);
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.registrar_avaliacoes_pendentes_encerramento() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER registrar_avaliacoes_pendentes_encerramento AFTER UPDATE ON public.incidentes_seguranca FOR EACH ROW EXECUTE FUNCTION public.registrar_avaliacoes_pendentes_encerramento();
CREATE INDEX monitor_cnpj_estado ON public.monitor_fornecedores(empresa_cnpj,estado);
COMMENT ON TABLE public.monitor_fornecedores IS 'Informational external references only. Never include rows in forensic evidence, PI documents, hashes, progress or blockers. Only internal decisions are audited.';