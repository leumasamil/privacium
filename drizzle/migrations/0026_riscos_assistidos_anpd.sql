CREATE FUNCTION public.catalogo_riscos_anpd() RETURNS TABLE(ordem integer, valor text, descricao text, fonte_normativa text) LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT * FROM (VALUES
(1,'Fraude por uso indevido de identidade','Possibilidade de abertura de crédito ou movimentação financeira em nome do titular.','LGPD art. 5º, I / Res. CD/ANPD nº 15/2024 art. 3º'),
(2,'Danos financeiros diretos','Uso fraudulento de dados bancários e de cartão.','LGPD art. 5º, I / Res. CMN nº 4.658/2018 (referência histórica)'),
(3,'Phishing e engenharia social direcionados','Comunicações fraudulentas personalizadas com os dados do titular.','LGPD art. 5º, I / NIST SP 800-61r3'),
(4,'Discriminação e tratamento desigual','Uso indevido de dado pessoal sensível com tratamento discriminatório.','LGPD art. 5º, II e art. 6º, IX'),
(5,'Exposição de dado pessoal sensível','Divulgação de dado pessoal de saúde, biométrico, genético, origem racial ou étnica, convicção religiosa, opinião política, filiação sindical ou vida sexual.','LGPD art. 5º, II'),
(6,'Constrangimento ou dano à imagem','Exposição pública que afete reputação ou privacidade.','LGPD art. 5º, I e art. 6º, IX'),
(7,'Comprometimento de conta com histórico','Acesso à conta do titular com histórico de dados.','LGPD art. 5º, I / NIST SP 800-61r3'),
(8,'Indisponibilidade de serviços essenciais','Interrupção de serviço usado pelo titular.','LGPD art. 6º, IV e V'),
(9,'Perda ou alteração indevida de dados','Corrupção, exclusão ou modificação não autorizada.','LGPD art. 6º, V e VI / Res. CD/ANPD nº 15/2024'),
(10,'Extorsão para recuperação de dados','Tomada de refém dos dados para exigência de pagamento.','LGPD art. 6º / NIST SP 800-61r3'),
(11,'Risco a menores de idade','Exposição ou tratamento de dados de menores sem hipótese de tratamento adequada.','LGPD art. 14 e art. 6º, IX')) AS v(ordem,valor,descricao,fonte_normativa) $$;
REVOKE ALL ON FUNCTION public.catalogo_riscos_anpd() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalogo_riscos_anpd() TO authenticated, service_role;
CREATE FUNCTION public.classificar_riscos_anpd() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; valores text[]:=ARRAY[]::text[]; pares jsonb; texto text; fontes text; detalhes text; medidas_fontes text;
BEGIN
 IF OLD.enviado_anpd_em IS NOT NULL OR NEW.enviado_anpd_em IS NULL THEN RETURN NEW; END IF;
 -- Compatibility with already-published clients. Never rewrite previous submissions.
 IF NOT (NEW.comunicacao ? 'riscos_selecionados') THEN RETURN NEW; END IF;
 IF jsonb_typeof(NEW.comunicacao->'riscos_selecionados') IS DISTINCT FROM 'array' OR jsonb_typeof(NEW.comunicacao->'riscos_detalhes') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Riscos inválidos'; END IF;
 detalhes:=trim(NEW.comunicacao->>'riscos_detalhes');
 IF length(detalhes)<50 THEN RAISE EXCEPTION 'Detalhes específicos exigem mínimo 50 caracteres'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(NEW.comunicacao->'riscos_selecionados') LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR NOT EXISTS(SELECT 1 FROM public.catalogo_riscos_anpd() c WHERE c.valor=item->>'valor') OR (item->>'valor')=ANY(valores) THEN RAISE EXCEPTION 'Riscos devem ser distintos e pertencer ao catálogo'; END IF;
  valores:=array_append(valores,item->>'valor');
 END LOOP;
 IF cardinality(valores)=0 THEN RAISE EXCEPTION 'Marque ao menos um risco'; END IF;
 IF jsonb_typeof(NEW.comunicacao->'medidas_selecionadas') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Marque ao menos uma medida adotada'; END IF;
 IF jsonb_array_length(NEW.comunicacao->'medidas_selecionadas')=0 THEN RAISE EXCEPTION 'Marque ao menos uma medida adotada'; END IF;
 SELECT jsonb_agg(jsonb_build_object('valor',c.valor,'fonte_normativa',c.fonte_normativa) ORDER BY c.ordem),string_agg(c.valor || ': ' || c.descricao,'; ' ORDER BY c.ordem) INTO pares,texto FROM public.catalogo_riscos_anpd() c WHERE c.valor=ANY(valores);
 SELECT string_agg(fonte_normativa,'; ' ORDER BY primeira) INTO fontes FROM (SELECT c.fonte_normativa,min(c.ordem) primeira FROM public.catalogo_riscos_anpd() c WHERE c.valor=ANY(valores) GROUP BY c.fonte_normativa) f;
 SELECT string_agg(fonte_normativa,'; ' ORDER BY primeira) INTO medidas_fontes FROM (SELECT c.fonte_normativa,min(c.ordem) primeira FROM public.catalogo_medidas_anpd() c WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.comunicacao->'medidas_selecionadas') m WHERE m->>'valor'=c.valor) GROUP BY c.fonte_normativa) f;
 NEW.comunicacao:=NEW.comunicacao || jsonb_build_object('riscos_selecionados',pares,'riscos_detalhes',detalhes,'riscos',texto || E'\nDetalhes específicos: ' || detalhes || E'\nFontes: ' || fontes || '.','riscos_versao','2026-10-29.1','medidas',(NEW.comunicacao->>'medidas') || ' Fontes: ' || medidas_fontes || '.');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.classificar_riscos_anpd() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER classificar_riscos_anpd BEFORE UPDATE ON public.incidentes_seguranca FOR EACH ROW EXECUTE FUNCTION public.classificar_riscos_anpd();
COMMENT ON FUNCTION public.catalogo_riscos_anpd() IS '11 fixed normative risks; 50-character case details and selected measures canonicalized within the existing audited ANPD transaction. Historical CMN citation is explicitly labeled, not represented as current law.';