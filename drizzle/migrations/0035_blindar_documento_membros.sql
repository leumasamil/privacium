-- As concessões automáticas de criação de tabela incluíam TODAS as colunas (inclusive o documento)
-- para anon e authenticated. Revoga tudo e reconcede apenas o necessário: o documento (CPF/CNPJ)
-- fica ilegível por consulta direta e só sai pela função auditada revelar_documento_membro.
REVOKE ALL ON public.membros_empresa FROM anon, authenticated;
GRANT SELECT (id, empresa_id, nome, tipo_documento, email, area_setor, papel_rac, membro_comite, ativo, criado_em, atualizado_em) ON public.membros_empresa TO authenticated;
GRANT INSERT (empresa_id, nome, documento, tipo_documento, email, area_setor, papel_rac, membro_comite) ON public.membros_empresa TO authenticated;
GRANT UPDATE (nome, email, area_setor, papel_rac, membro_comite, ativo) ON public.membros_empresa TO authenticated;
NOTIFY pgrst, 'reload schema';