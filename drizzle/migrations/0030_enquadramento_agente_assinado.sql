CREATE TABLE public.enquadramentos_agente (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_cnpj text NOT NULL REFERENCES public.empresas(cnpj), criterios jsonb NOT NULL, porte text NOT NULL CHECK (porte IN ('PEQUENO','COMPLETO')), assinado_por uuid NOT NULL REFERENCES public.profiles(id), assinado_em timestamptz NOT NULL DEFAULT clock_timestamp(), hash_sha256 text NOT NULL CHECK (hash_sha256 ~ '^[a-f0-9]{64}$')
);
GRANT SELECT ON public.enquadramentos_agente TO authenticated;
GRANT ALL ON public.enquadramentos_agente TO service_role;
ALTER TABLE public.enquadramentos_agente ENABLE ROW LEVEL SECURITY;
CREATE POLICY leitura_enquadramento ON public.enquadramentos_agente FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY isolamento_enquadramento ON public.enquadramentos_agente AS RESTRICTIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR empresa_cnpj=public.minha_empresa_cnpj());
CREATE POLICY empresa_liberada_enquadramento ON public.enquadramentos_agente AS RESTRICTIVE FOR SELECT TO authenticated USING (public.cnpj_liberado(empresa_cnpj));
CREATE INDEX enquadramento_empresa_data ON public.enquadramentos_agente(empresa_cnpj,assinado_em DESC);
CREATE FUNCTION public.calcular_porte_agente(_criterios jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE k text;
BEGIN
 IF jsonb_typeof(_criterios) IS DISTINCT FROM 'object' OR octet_length(_criterios::text)>8000 THEN RAISE EXCEPTION 'Critérios inválidos'; END IF;
 FOR k IN SELECT unnest(ARRAY['grupoGrande','receitaAcimaTeto','infraLimitada','sensivelLargaEscala','altoRisco','menoresAltoRisco']) LOOP
  IF jsonb_typeof(_criterios->k) IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Responda todos os critérios'; END IF;
 END LOOP;
 IF _criterios->>'tipo' NOT IN ('ME','EPP','LTDA','SA','ASSOCIACAO','OUTRO') OR _criterios->>'tipo' IS NULL OR coalesce(_criterios->>'titulares','') !~ '^[0-9]+$' OR (_criterios->>'titulares')::numeric>9007199254740991 THEN RAISE EXCEPTION 'Tipo societário ou número de titulares inválido'; END IF;
 IF (_criterios->>'infraLimitada')::boolean AND length(trim(coalesce(_criterios->>'descricaoInfra','')))<10 THEN RAISE EXCEPTION 'Descreva a infraestrutura limitada (mínimo 10 caracteres)'; END IF;
 IF (_criterios->>'grupoGrande')::boolean OR (_criterios->>'receitaAcimaTeto')::boolean OR (_criterios->>'sensivelLargaEscala')::boolean OR (_criterios->>'altoRisco')::boolean OR (_criterios->>'menoresAltoRisco')::boolean OR _criterios->>'tipo'='SA' OR (_criterios->>'titulares')::numeric>10000 THEN RETURN 'COMPLETO'; END IF;
 RETURN 'PEQUENO';
END $$;
REVOKE ALL ON FUNCTION public.calcular_porte_agente(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.calcular_porte_agente(jsonb) TO authenticated,service_role;
CREATE FUNCTION public.enquadramento_vigente(_cnpj text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.enquadramentos_agente e WHERE e.empresa_cnpj=_cnpj AND e.assinado_em>= date_trunc('year',now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' + CASE WHEN extract(month FROM now() AT TIME ZONE 'America/Sao_Paulo')>=7 THEN interval '6 months' ELSE interval '0 months' END AND e.assinado_em>coalesce((SELECT max(finalizado_em) FROM public.ciclos_priva WHERE empresa_cnpj=_cnpj),'-infinity'::timestamptz))
$$;
REVOKE ALL ON FUNCTION public.enquadramento_vigente(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.enquadramento_vigente(text) TO authenticated,service_role;
CREATE FUNCTION public.assinar_enquadramento(_cnpj text,_criterios jsonb) RETURNS public.enquadramentos_agente LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.enquadramentos_agente; p text; w jsonb; t timestamptz:=clock_timestamp(); h text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'DPO_OPERACIONAL') OR NOT public.cnpj_liberado(_cnpj) OR (NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND _cnpj IS DISTINCT FROM public.minha_empresa_cnpj()) THEN RAISE EXCEPTION 'Assinatura restrita ao DPO desta empresa'; END IF;
 SELECT data INTO w FROM public.workspace_empresa WHERE cnpj=_cnpj FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;
 p:=public.calcular_porte_agente(_criterios);
 IF p='PEQUENO' AND coalesce((w->>'enterprise')::boolean,false) THEN RAISE EXCEPTION 'Os dados declarados não sustentam o enquadramento como agente de pequeno porte. Gatilho de migração ativo: S.A. ou > 10 mil titulares/mês (gatilho registrado no método).'; END IF;
 h:=encode(digest(_cnpj || '|' || _criterios::text || '|' || p || '|' || auth.uid()::text || '|' || t::text,'sha256'),'hex');
 INSERT INTO public.enquadramentos_agente(empresa_cnpj,criterios,porte,assinado_por,assinado_em,hash_sha256) VALUES(_cnpj,_criterios,p,auth.uid(),t,h) RETURNING * INTO r;
 UPDATE public.workspace_empresa SET data=jsonb_set(data,'{signatures}',coalesce(data->'signatures','{}'::jsonb)-'PI-01'),updated_at=t,updated_by=auth.uid() WHERE cnpj=_cnpj;
 PERFORM public.registrar_trilha('DPO_OPERACIONAL','INSERT','enquadramentos_agente','Declaração de enquadramento PI-01 ' || r.id || ' | porte=' || p || ' | data=' || t || ' | SHA-256=' || h,_cnpj);
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.assinar_enquadramento(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assinar_enquadramento(text,jsonb) TO authenticated;
CREATE FUNCTION public.prazo_agente_anpd(_cnpj text) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN public.enquadramento_vigente(_cnpj) AND (SELECT porte FROM public.enquadramentos_agente WHERE empresa_cnpj=_cnpj ORDER BY assinado_em DESC LIMIT 1)='PEQUENO' THEN 6 ELSE 3 END
$$;
REVOKE ALL ON FUNCTION public.prazo_agente_anpd(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.prazo_agente_anpd(text) TO authenticated,service_role;
CREATE FUNCTION public.validar_enquadramento_rot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NOT public.enquadramento_vigente(NEW.empresa_cnpj) THEN RAISE EXCEPTION 'Assine o enquadramento do agente no Bloco 1 neste Ciclo Privacium Semestral'; END IF; RETURN NEW; END $$;
CREATE TRIGGER exigir_enquadramento_rot BEFORE INSERT OR UPDATE ON public.registro_operacoes FOR EACH ROW EXECUTE FUNCTION public.validar_enquadramento_rot();
ALTER TABLE public.incidentes_seguranca ADD COLUMN prazo_dias_uteis integer CHECK (prazo_dias_uteis IN (3,6));
CREATE FUNCTION public.limite_anpd_uteis(_inicio timestamptz,_dias integer) RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$ DECLARE t timestamptz:=_inicio; n integer:=0; BEGIN IF _dias NOT IN (3,6) THEN RAISE EXCEPTION 'Prazo inválido'; END IF; WHILE n<_dias LOOP t:=t+interval '24 hours'; IF extract(isodow FROM t AT TIME ZONE 'UTC')<6 THEN n:=n+1; END IF; END LOOP; RETURN t; END $$;
CREATE FUNCTION public.fixar_prazo_incidente() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' OR (OLD.enviado_anpd_em IS NULL AND NEW.enviado_anpd_em IS NOT NULL) THEN NEW.prazo_dias_uteis:=public.prazo_agente_anpd(NEW.empresa_cnpj); ELSIF OLD.enviado_anpd_em IS NOT NULL THEN NEW.prazo_dias_uteis:=OLD.prazo_dias_uteis; END IF;
 IF NEW.enviado_anpd_em IS NOT NULL AND (TG_OP='INSERT' OR OLD.enviado_anpd_em IS NULL) THEN NEW.comunicacao_atrasada:=NEW.enviado_anpd_em>public.limite_anpd_uteis(NEW.iniciado_em,coalesce(NEW.prazo_dias_uteis,3)); END IF; RETURN NEW; END $$;
CREATE TRIGGER a_prazo_incidente BEFORE INSERT OR UPDATE ON public.incidentes_seguranca FOR EACH ROW EXECUTE FUNCTION public.fixar_prazo_incidente();