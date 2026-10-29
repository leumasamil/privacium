CREATE TABLE public.encarregado_dpo (
 empresa_cnpj varchar(14) PRIMARY KEY REFERENCES public.empresas(cnpj),
 nome text NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 200),
 email text NOT NULL CHECK (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 telefone text, endereco text, publicar_contato boolean NOT NULL DEFAULT false,
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.encarregado_dpo TO authenticated;
GRANT ALL ON public.encarregado_dpo TO service_role;
ALTER TABLE public.encarregado_dpo ENABLE ROW LEVEL SECURITY;
CREATE POLICY dpo_leitura ON public.encarregado_dpo FOR SELECT TO authenticated USING (
 public.has_role(auth.uid(),'ADMIN_SISTEMA') OR
 (public.has_any_role(auth.uid()) AND empresa_cnpj = (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id()))
);
CREATE POLICY dpo_insercao ON public.encarregado_dpo FOR INSERT TO authenticated WITH CHECK (
 public.has_role(auth.uid(),'ADMIN_SISTEMA') OR
 (public.has_role(auth.uid(),'DPO_OPERACIONAL') AND empresa_cnpj = (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id()))
);
CREATE POLICY dpo_edicao ON public.encarregado_dpo FOR UPDATE TO authenticated USING (
 public.has_role(auth.uid(),'ADMIN_SISTEMA') OR
 (public.has_role(auth.uid(),'DPO_OPERACIONAL') AND empresa_cnpj = (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id()))
) WITH CHECK (
 public.has_role(auth.uid(),'ADMIN_SISTEMA') OR
 (public.has_role(auth.uid(),'DPO_OPERACIONAL') AND empresa_cnpj = (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id()))
);
CREATE POLICY dpo_empresa_ativa ON public.encarregado_dpo AS RESTRICTIVE FOR ALL TO authenticated USING (public.cnpj_liberado(empresa_cnpj)) WITH CHECK (public.cnpj_liberado(empresa_cnpj));
CREATE FUNCTION public.auditar_encarregado_dpo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 NEW.atualizado_em := now();
 PERFORM public.registrar_trilha(CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END, TG_OP, 'encarregado_dpo', 'Contato do encarregado atualizado', NEW.empresa_cnpj);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.auditar_encarregado_dpo() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER auditar_encarregado BEFORE INSERT OR UPDATE ON public.encarregado_dpo FOR EACH ROW EXECUTE FUNCTION public.auditar_encarregado_dpo();
ALTER TABLE public.incidentes_seguranca ADD COLUMN processo_id uuid REFERENCES public.registro_operacoes(id), ADD COLUMN comunicacao_atrasada boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.enviar_comunicacao_anpd(_incidente uuid, _form jsonb, _processo uuid) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.incidentes_seguranca; contato text; categorias text[]; permitidas text[]; t timestamptz:=clock_timestamp(); papel public.app_role;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR public.has_role(auth.uid(),'DPO_OPERACIONAL')) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT * INTO i FROM public.incidentes_seguranca WHERE id=_incidente FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Incidente não encontrado'; END IF;
 IF NOT public.cnpj_liberado(i.empresa_cnpj) OR (NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND i.empresa_cnpj IS DISTINCT FROM (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())) THEN RAISE EXCEPTION 'Sem permissão para este CNPJ'; END IF;
 IF i.enviado_anpd_em IS NOT NULL THEN RAISE EXCEPTION 'Comunicação já registrada'; END IF;
 FOR j IN 1..5 LOOP IF i.passos[j] IS DISTINCT FROM true THEN RAISE EXCEPTION 'Conclua as etapas 1 a 5'; END IF; END LOOP;
 IF _form IS NULL OR jsonb_typeof(_form) <> 'object' OR octet_length(_form::text)>32768 THEN RAISE EXCEPTION 'Formulário inválido'; END IF;
 IF length(trim(coalesce(_form->>'natureza','')))=0 OR length(trim(coalesce(_form->>'riscos','')))<30 OR length(trim(coalesce(_form->>'medidas','')))<30 THEN RAISE EXCEPTION 'Preencha natureza, riscos e medidas (mínimo 30 caracteres)'; END IF;
 IF coalesce(_form->>'titulares','') !~ '^[0-9]+$' OR (_form->>'titulares')::numeric < 1 THEN RAISE EXCEPTION 'Informe ao menos 1 titular'; END IF;
 SELECT email INTO contato FROM public.encarregado_dpo WHERE empresa_cnpj=i.empresa_cnpj;
 IF contato IS NULL THEN RAISE EXCEPTION 'Cadastre o encarregado deste CNPJ'; END IF;
 SELECT array_remove(dados_pessoais || dados_sensiveis,'N/A') INTO permitidas FROM public.registro_operacoes WHERE id=_processo AND empresa_cnpj=i.empresa_cnpj;
 IF permitidas IS NULL OR (i.processo_id IS NOT NULL AND i.processo_id <> _processo) THEN RAISE EXCEPTION 'Selecione o processo ROT vinculado ao incidente'; END IF;
 IF jsonb_typeof(_form->'categorias') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Selecione categorias do ROT'; END IF;
 SELECT array_agg(value) INTO categorias FROM jsonb_array_elements_text(_form->'categorias');
 IF coalesce(cardinality(categorias),0)=0 OR NOT categorias <@ permitidas THEN RAISE EXCEPTION 'Categorias devem pertencer ao ROT deste processo'; END IF;
 UPDATE public.incidentes_seguranca SET comunicacao = _form || jsonb_build_object('incidente',i.id,'encarregado',contato), processo_id=_processo, enviado_anpd_em=t, comunicacao_atrasada=(t > i.iniciado_em + interval '72 hours'), passos=ARRAY[true,true,true,true,true,true] WHERE id=i.id;
 papel := CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END;
 PERFORM public.registrar_trilha(papel,'COMUNICACAO_ANPD','incidentes_seguranca','Envio simulado do incidente ' || i.id, i.empresa_cnpj);
 IF t > i.iniciado_em + interval '72 hours' THEN PERFORM public.registrar_trilha(papel,'DESCUMPRIMENTO_SLA','incidentes_seguranca','Comunicação em atraso do incidente ' || i.id,i.empresa_cnpj); END IF;
 RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.enviar_comunicacao_anpd(uuid,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enviar_comunicacao_anpd(uuid,jsonb,uuid) TO authenticated;