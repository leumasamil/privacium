DO $$ DECLARE ddl text; BEGIN
 SELECT pg_get_functiondef('public.enviar_comunicacao_anpd(uuid,jsonb,uuid)'::regprocedure) INTO ddl;
 ddl:=replace(ddl, 'i.iniciado_em + interval ''72 hours''', 'public.limite_anpd_uteis(i.iniciado_em,public.prazo_agente_anpd(i.empresa_cnpj))');
 EXECUTE ddl;
END $$;
CREATE FUNCTION public.validar_pi01_enquadramento() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.data->'signatures' ? 'PI-01' AND NEW.data->'signatures'->'PI-01' IS DISTINCT FROM OLD.data->'signatures'->'PI-01' AND NOT public.enquadramento_vigente(NEW.cnpj) THEN RAISE EXCEPTION 'Assine primeiro o enquadramento do agente neste ciclo'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER exigir_enquadramento_pi01 BEFORE UPDATE ON public.workspace_empresa FOR EACH ROW EXECUTE FUNCTION public.validar_pi01_enquadramento();