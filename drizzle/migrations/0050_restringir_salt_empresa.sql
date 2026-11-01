REVOKE ALL ON TABLE public.salt_empresa FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.salt_empresa TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.indice_titulares,public.solicitacoes_titular FROM anon,authenticated;
REVOKE ALL ON TABLE public.incidencia_normativa FROM anon;
REVOKE INSERT,UPDATE,DELETE ON public.incidencia_normativa FROM authenticated;
COMMENT ON TABLE public.salt_empresa IS 'Segredo por empresa: acesso somente por funções auditadas; sem leitura direta por clientes.';