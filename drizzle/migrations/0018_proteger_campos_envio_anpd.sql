REVOKE UPDATE ON public.incidentes_seguranca FROM authenticated;
GRANT UPDATE (passos, encerrado_em) ON public.incidentes_seguranca TO authenticated;
REVOKE INSERT ON public.incidentes_seguranca FROM authenticated;
GRANT INSERT (empresa_cnpj) ON public.incidentes_seguranca TO authenticated;
COMMENT ON COLUMN public.incidentes_seguranca.enviado_anpd_em IS 'Only enviar_comunicacao_anpd may record validated and audited ANPD submissions.';