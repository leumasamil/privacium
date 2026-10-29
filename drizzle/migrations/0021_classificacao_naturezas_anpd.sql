CREATE FUNCTION public.fonte_natureza_anpd(_valor text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE
 WHEN _valor IN ('Ransomware com criptografia de ativos','Ransomware sem criptografia (dupla extorsão / exfiltração prévia)','Extorsão sem criptografia','Ataque à cadeia de suprimentos com impacto em terceiros','DDoS','Indisponibilidade de fornecedor crítico','Falha de infraestrutura com perda de dado') THEN 'NIST SP 800-61r3'
 WHEN _valor IN ('Credential stuffing / uso de credenciais vazadas','Acesso indevido com elevação de privilégio','Conta comprometida por phishing','Insider threat (colaborador ou ex-colaborador)','Acesso indevido a base de dados') THEN 'NIST SP 800-61r3 / MITRE ATT&CK'
 WHEN _valor IN ('Exposição acidental (má configuração, bucket público, envio equivocado)','Exfiltração por agente externo','Perda ou roubo de dispositivo com dados','Publicação indevida em canal aberto') THEN 'NIST SP 800-61r3 / ENISA'
 WHEN _valor IN ('Exploração de vulnerabilidade conhecida sem patch','Zero-day','Injeção / RCE') THEN 'MITRE ATT&CK / CISA KEV'
 WHEN _valor IN ('Fraude de identidade (deepfake, synthetic identity)','Incidente físico com impacto em dados','Outro') THEN 'Descrição própria do DPO'
 ELSE NULL END
$$;
REVOKE ALL ON FUNCTION public.fonte_natureza_anpd(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fonte_natureza_anpd(text) TO authenticated, service_role;
CREATE FUNCTION public.classificar_comunicacao_anpd() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE valor text; fonte text; secundarias jsonb := '[]'::jsonb; item jsonb; vistos text[]; outro boolean; papel public.app_role;
BEGIN
 IF OLD.enviado_anpd_em IS NOT NULL THEN RETURN NEW; END IF;
 IF NEW.enviado_anpd_em IS NULL THEN RETURN NEW; END IF;
 valor := NEW.comunicacao->>'natureza';
 -- Compatibilidade com o formulário publicado anterior, sem reescrever envios existentes.
 IF valor = 'Ransomware' THEN valor := 'Ransomware com criptografia de ativos'; END IF;
 fonte := public.fonte_natureza_anpd(valor);
 IF fonte IS NULL THEN RAISE EXCEPTION 'Selecione uma natureza principal do catálogo ANPD'; END IF;
 vistos := ARRAY[valor]; outro := valor='Outro';
 IF NEW.comunicacao ? 'naturezas_secundarias' AND jsonb_typeof(NEW.comunicacao->'naturezas_secundarias') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Naturezas secundárias inválidas'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(coalesce(NEW.comunicacao->'naturezas_secundarias','[]'::jsonb)) LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR public.fonte_natureza_anpd(item->>'valor') IS NULL OR (item->>'valor')=ANY(vistos) THEN RAISE EXCEPTION 'Naturezas secundárias devem ser distintas e pertencer ao catálogo'; END IF;
  vistos:=array_append(vistos,item->>'valor');
  secundarias:=secundarias || jsonb_build_array(jsonb_build_object('valor',item->>'valor','fonte_normativa',public.fonte_natureza_anpd(item->>'valor')));
  outro := outro OR item->>'valor'='Outro';
 END LOOP;
 IF outro AND length(trim(coalesce(NEW.comunicacao->>'natureza_outro','')))=0 THEN RAISE EXCEPTION 'Outro exige descrição própria do DPO'; END IF;
 NEW.comunicacao := NEW.comunicacao || jsonb_build_object('natureza',valor,'natureza_principal',jsonb_build_object('valor',valor,'fonte_normativa',fonte),'naturezas_secundarias',secundarias,'taxonomia_versao','2026-10-29.1','natureza_outro',CASE WHEN outro THEN trim(NEW.comunicacao->>'natureza_outro') ELSE '' END);
 IF outro THEN
  papel:=CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END;
  PERFORM public.registrar_trilha(papel,'UPDATE','incidentes_seguranca','Ausência de encaixe taxonômico: Outro — descrição própria do DPO registrada na comunicação do incidente ' || NEW.id,NEW.empresa_cnpj);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.classificar_comunicacao_anpd() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER classificar_comunicacao_anpd BEFORE UPDATE ON public.incidentes_seguranca FOR EACH ROW EXECUTE FUNCTION public.classificar_comunicacao_anpd();
COMMENT ON FUNCTION public.fonte_natureza_anpd(text) IS 'ANPD Parte 2 fixed catalog version 2026-10-29.1: 22 natures in 6 groups, mirrored in naturezasIncidente.ts.';