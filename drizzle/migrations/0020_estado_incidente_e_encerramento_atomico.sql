ALTER TABLE public.incidentes_seguranca ADD COLUMN etapas_registro jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.incidentes_seguranca.etapas_registro IS 'Evidence per step: authenticated responsible UUID and server timestamp; legacy booleans are not invented evidence.';
CREATE FUNCTION public.validar_e_auditar_incidente() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j integer; papel public.app_role;
BEGIN
 papel := CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END;
 IF OLD.encerrado_em IS NOT NULL AND (NEW.passos IS DISTINCT FROM OLD.passos OR NEW.encerrado_em IS DISTINCT FROM OLD.encerrado_em OR NEW.enviado_anpd_em IS DISTINCT FROM OLD.enviado_anpd_em) THEN RAISE EXCEPTION 'Incidente já encerrado'; END IF;
 FOR j IN 1..5 LOOP
  IF NEW.passos[j] IS DISTINCT FROM OLD.passos[j] THEN
   IF NEW.passos[j] IS TRUE THEN NEW.etapas_registro := NEW.etapas_registro || jsonb_build_object(j::text,jsonb_build_object('data',clock_timestamp(),'responsavel',auth.uid()));
   ELSE NEW.etapas_registro := NEW.etapas_registro - j::text; END IF;
  END IF;
 END LOOP;
 IF NEW.enviado_anpd_em IS DISTINCT FROM OLD.enviado_anpd_em AND NEW.enviado_anpd_em IS NOT NULL THEN
  NEW.passos[6] := true;
  NEW.etapas_registro := NEW.etapas_registro || jsonb_build_object('6',jsonb_build_object('data',NEW.enviado_anpd_em,'responsavel',auth.uid()));
 END IF;
 IF NEW.passos[6] IS DISTINCT FROM OLD.passos[6] AND NEW.passos[6] IS TRUE AND NEW.enviado_anpd_em IS NULL THEN RAISE EXCEPTION 'Etapa 06 exige comunicação ANPD validada'; END IF;
 IF OLD.encerrado_em IS NULL AND NEW.encerrado_em IS NOT NULL THEN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR public.has_role(auth.uid(),'DPO_OPERACIONAL')) OR NOT public.cnpj_liberado(NEW.empresa_cnpj) OR (NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND NEW.empresa_cnpj IS DISTINCT FROM (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())) THEN RAISE EXCEPTION 'Sem permissão para este CNPJ'; END IF;
  IF NEW.enviado_anpd_em IS NULL THEN RAISE EXCEPTION 'Formulário ANPD não enviado'; END IF;
  FOR j IN 1..6 LOOP
   IF NEW.passos[j] IS DISTINCT FROM true OR coalesce(NEW.etapas_registro->j::text->>'data','')='' OR coalesce(NEW.etapas_registro->j::text->>'responsavel','')='' THEN RAISE EXCEPTION 'Etapa % sem conclusão, data ou responsável registrado',j; END IF;
  END LOOP;
  NEW.encerrado_em := clock_timestamp();
  PERFORM public.registrar_trilha(papel,'UPDATE','incidentes_seguranca','Incidente encerrado ' || NEW.id,NEW.empresa_cnpj);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validar_e_auditar_incidente() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validar_e_auditar_incidente BEFORE UPDATE ON public.incidentes_seguranca FOR EACH ROW EXECUTE FUNCTION public.validar_e_auditar_incidente();
CREATE FUNCTION public.registrar_etapa_incidente(_incidente uuid, _etapa integer, _concluida boolean DEFAULT true) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.incidentes_seguranca; papel public.app_role;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR public.has_role(auth.uid(),'DPO_OPERACIONAL')) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT * INTO i FROM public.incidentes_seguranca WHERE id=_incidente FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Incidente não encontrado'; END IF;
 IF NOT public.cnpj_liberado(i.empresa_cnpj) OR (NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND i.empresa_cnpj IS DISTINCT FROM (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())) THEN RAISE EXCEPTION 'Sem permissão para este CNPJ'; END IF;
 IF i.encerrado_em IS NOT NULL OR _etapa NOT BETWEEN 1 AND 5 OR _etapa IS NULL OR _concluida IS NULL THEN RAISE EXCEPTION 'Etapa inválida ou incidente encerrado'; END IF;
 IF NOT _concluida AND (i.enviado_anpd_em IS NOT NULL OR i.passos[_etapa+1] IS TRUE) THEN RAISE EXCEPTION 'Não é possível reabrir esta etapa'; END IF;
 IF _concluida AND _etapa>1 THEN FOR j IN 1..(_etapa-1) LOOP IF i.passos[j] IS DISTINCT FROM true THEN RAISE EXCEPTION 'Conclua as etapas anteriores'; END IF; END LOOP; END IF;
 i.passos[_etapa] := _concluida;
 UPDATE public.incidentes_seguranca SET passos=i.passos, etapas_registro=CASE WHEN _concluida THEN etapas_registro || jsonb_build_object(_etapa::text,jsonb_build_object('data',clock_timestamp(),'responsavel',auth.uid())) ELSE etapas_registro - _etapa::text END WHERE id=i.id;
 papel := CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END;
 PERFORM public.registrar_trilha(papel,'UPDATE','incidentes_seguranca','Etapa ' || _etapa || CASE WHEN _concluida THEN ' concluída/confirmada ' ELSE ' reaberta ' END || i.id,i.empresa_cnpj);
END $$;
REVOKE ALL ON FUNCTION public.registrar_etapa_incidente(uuid,integer,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_etapa_incidente(uuid,integer,boolean) TO authenticated;
CREATE FUNCTION public.encerrar_incidente(_incidente uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.incidentes_seguranca; motivos text[] := ARRAY[]::text[]; j integer;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR public.has_role(auth.uid(),'DPO_OPERACIONAL')) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT * INTO i FROM public.incidentes_seguranca WHERE id=_incidente FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Incidente não encontrado'; END IF;
 IF NOT public.cnpj_liberado(i.empresa_cnpj) OR (NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND i.empresa_cnpj IS DISTINCT FROM (SELECT cnpj FROM public.empresas WHERE id=public.minha_empresa_id())) THEN RAISE EXCEPTION 'Sem permissão para este CNPJ'; END IF;
 IF i.encerrado_em IS NOT NULL THEN RETURN jsonb_build_object('encerrado',true,'encerrado_em',i.encerrado_em); END IF;
 IF i.enviado_anpd_em IS NULL THEN motivos:=array_append(motivos,'Formulário ANPD não enviado'); END IF;
 FOR j IN 1..6 LOOP
  IF (j<6 AND i.passos[j] IS DISTINCT FROM true) OR coalesce(i.etapas_registro->j::text->>'data','')='' OR coalesce(i.etapas_registro->j::text->>'responsavel','')='' THEN motivos:=array_append(motivos,'Etapa ' || lpad(j::text,2,'0') || ' sem conclusão, data ou responsável registrado'); END IF;
 END LOOP;
 IF cardinality(motivos)>0 THEN RETURN jsonb_build_object('encerrado',false,'motivos_bloqueio',to_jsonb(motivos)); END IF;
 UPDATE public.incidentes_seguranca SET encerrado_em=clock_timestamp() WHERE id=i.id RETURNING encerrado_em INTO i.encerrado_em;
 RETURN jsonb_build_object('encerrado',true,'encerrado_em',i.encerrado_em);
END $$;
REVOKE ALL ON FUNCTION public.encerrar_incidente(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.encerrar_incidente(uuid) TO authenticated;