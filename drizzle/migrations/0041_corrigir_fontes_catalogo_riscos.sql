CREATE OR REPLACE FUNCTION public.catalogo_riscos_anpd() RETURNS TABLE(ordem integer, valor text, descricao text, fonte_normativa text) LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT * FROM (VALUES
(1,'Fraude por uso indevido de identidade','Possibilidade de abertura de crédito ou movimentação financeira em nome do titular.','LGPD art. 5º, I / NIST SP 800-61r3'),
(2,'Danos financeiros diretos','Uso fraudulento de dados bancários e de cartão.','LGPD art. 5º, I / Res. CMN nº 4.658/2018 (referência histórica)'),
(3,'Phishing e engenharia social direcionados','Comunicações fraudulentas personalizadas com os dados do titular.','LGPD art. 5º, I / NIST SP 800-61r3'),
(4,'Discriminação e tratamento desigual','Uso indevido de dado pessoal sensível com tratamento discriminatório.','LGPD art. 5º, II e art. 6º, IX'),
(5,'Exposição de dado pessoal sensível','Divulgação de dado pessoal de saúde, biométrico, genético, origem racial ou étnica, convicção religiosa, opinião política, filiação sindical ou vida sexual.','LGPD art. 5º, II'),
(6,'Constrangimento ou dano à imagem','Exposição pública que afete reputação ou privacidade.','LGPD art. 5º, I e art. 6º, IX'),
(7,'Comprometimento de conta com histórico','Acesso à conta do titular com histórico de dados.','LGPD art. 5º, I / NIST SP 800-61r3'),
(8,'Indisponibilidade de serviços essenciais','Interrupção de serviço usado pelo titular.','LGPD art. 6º, VII'),
(9,'Perda ou alteração indevida de dados','Corrupção, exclusão ou modificação não autorizada.','LGPD art. 6º, VII / Res. CD/ANPD nº 15/2024'),
(10,'Extorsão para recuperação de dados','Tomada de refém dos dados para exigência de pagamento.','LGPD art. 6º / NIST SP 800-61r3'),
(11,'Risco a menores de idade','Exposição ou tratamento de dados de menores sem hipótese de tratamento adequada.','LGPD art. 14 e art. 6º, IX')) AS v(ordem,valor,descricao,fonte_normativa) $$;
REVOKE ALL ON FUNCTION public.catalogo_riscos_anpd() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalogo_riscos_anpd() TO authenticated, service_role;