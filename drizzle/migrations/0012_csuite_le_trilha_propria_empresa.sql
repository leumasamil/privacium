CREATE POLICY "csuite le trilha da propria empresa" ON public.trilha_auditoria_sistema FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'C_SUITE'::app_role) AND minha_empresa_id() IS NOT NULL
  AND (usuario_id IN (SELECT u.id FROM usuarios u WHERE u.empresa_id = minha_empresa_id())
       OR cnpj = (SELECT e.cnpj FROM empresas e WHERE e.id = minha_empresa_id())::text)
  AND cnpj_liberado(cnpj));