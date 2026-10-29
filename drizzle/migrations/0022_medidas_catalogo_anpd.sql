CREATE FUNCTION public.catalogo_medidas_anpd() RETURNS TABLE(ordem integer, valor text, fonte_normativa text) LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT v.ordem, v.valor, CASE WHEN v.ordem BETWEEN 1 AND 4 THEN 'CIS Control 04 / ISO/IEC 27002:2022 — 8.5 e 8.7' WHEN v.ordem BETWEEN 5 AND 9 THEN 'CIS Control 11 / ISO/IEC 27002 — 8.13' WHEN v.ordem BETWEEN 10 AND 13 THEN 'CIS Control 08 / ISO/IEC 27002 — 8.15 e 8.16' WHEN v.ordem BETWEEN 14 AND 19 THEN 'ISO/IEC 27002 — 5.24 a 5.28 / Res. CD/ANPD nº 15/2024' ELSE 'CIS Controls v8 / ISO/IEC 27002 — 5.15 e 8.2' END
 FROM (VALUES
 (1,'Isolamento dos endpoints afetados da rede'),(2,'Bloqueio de indicadores de comprometimento no firewall'),(3,'Revogação de credenciais e sessões ativas'),(4,'Desativação temporária de serviço comprometido'),
 (5,'Restauração a partir de backup íntegro'),(6,'Validação de hash dos dados restaurados'),(7,'Reinstalação de sistemas afetados'),(8,'Uso de ferramenta de descriptografia validada'),(9,'Aplicação de patch de correção'),
 (10,'Preservação de evidências forenses (ISO/IEC 27037)'),(11,'Análise em ambiente isolado (sandbox)'),(12,'Ativação de monitoramento reforçado'),(13,'Revisão de logs de acesso do período'),
 (14,'Acionamento da Célula de Resposta'),(15,'Comunicação à Diretoria'),(16,'Registro do incidente na trilha de auditoria'),(17,'Notificação aos titulares afetados'),(18,'Comunicação à ANPD'),(19,'Acionamento do fornecedor ou seguradora'),
 (20,'Implementação de MFA'),(21,'Revisão de permissões e RLS'),(22,'Treinamento da equipe'),(23,'Revisão de contratos com fornecedores'),(24,'Teste de restauração de backup')) AS v(ordem,valor)
$$;
REVOKE ALL ON FUNCTION public.catalogo_medidas_anpd() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalogo_medidas_anpd() TO authenticated, service_role;
CREATE FUNCTION public.classificar_medidas_anpd() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; valores text[] := ARRAY[]::text[]; canonicas jsonb; texto text; outras text;
BEGIN
 IF OLD.enviado_anpd_em IS NOT NULL OR NEW.enviado_anpd_em IS NULL THEN RETURN NEW; END IF;
 -- Older published clients remain compatible; never infer sources for legacy text.
 IF NOT (NEW.comunicacao ? 'medidas_selecionadas') THEN RETURN NEW; END IF;
 IF jsonb_typeof(NEW.comunicacao->'medidas_selecionadas') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Medidas inválidas'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(NEW.comunicacao->'medidas_selecionadas') LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR NOT EXISTS(SELECT 1 FROM public.catalogo_medidas_anpd() c WHERE c.valor=item->>'valor') OR (item->>'valor')=ANY(valores) THEN RAISE EXCEPTION 'Medidas devem ser distintas e pertencer ao catálogo'; END IF;
  valores := array_append(valores,item->>'valor');
 END LOOP;
 SELECT coalesce(jsonb_agg(jsonb_build_object('valor',c.valor,'fonte_normativa',c.fonte_normativa) ORDER BY c.ordem),'[]'::jsonb), coalesce(string_agg(c.valor,'; ' ORDER BY c.ordem),'') INTO canonicas,texto FROM public.catalogo_medidas_anpd() c WHERE c.valor=ANY(valores);
 IF NEW.comunicacao ? 'outras_medidas' AND jsonb_typeof(NEW.comunicacao->'outras_medidas') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Outras medidas inválidas'; END IF;
 outras := trim(coalesce(NEW.comunicacao->>'outras_medidas',''));
 IF outras <> '' THEN texto := concat_ws('; ',nullif(texto,''),regexp_replace(outras,'[.;]+$','')); END IF;
 IF texto <> '' THEN texto := texto || '.'; END IF;
 IF length(trim(texto)) < 30 THEN RAISE EXCEPTION 'Medidas exigem mínimo 30 caracteres'; END IF;
 NEW.comunicacao := NEW.comunicacao || jsonb_build_object('medidas_selecionadas',canonicas,'outras_medidas',outras,'medidas',texto,'medidas_versao','2026-10-29.1');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.classificar_medidas_anpd() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER classificar_medidas_anpd BEFORE UPDATE ON public.incidentes_seguranca FOR EACH ROW EXECUTE FUNCTION public.classificar_medidas_anpd();
COMMENT ON FUNCTION public.catalogo_medidas_anpd() IS 'ANPD Parte 3 catalog: 24 measures in 5 domains, mirrored in medidasIncidente.ts; canonical sources and text, no legacy rewrites.';