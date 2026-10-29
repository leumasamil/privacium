GRANT INSERT ON public.incidentes_seguranca TO authenticated;
GRANT ALL ON public.incidentes_seguranca TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.trilha_auditoria_sistema FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM authenticated;
COMMENT ON TABLE public.audit_log IS 'DEPRECATED: replaced by trilha_auditoria_sistema';
COMMENT ON TABLE public.workspace_state IS 'DEPRECATED: replaced by workspace_empresa';