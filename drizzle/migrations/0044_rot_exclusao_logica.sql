ALTER TABLE public.registro_operacoes
  ADD COLUMN IF NOT EXISTS excluido_em timestamptz,
  ADD COLUMN IF NOT EXISTS excluido_por text,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text;
COMMENT ON COLUMN public.registro_operacoes.excluido_em IS 'Exclusão lógica (LGPD art. 37): a linha permanece no banco. Linhas excluídas antes da migração 0044 não são recuperáveis.';

-- Exclusão física proibida para usuários: a linha só sai da planilha por exclusão lógica.
DROP POLICY IF EXISTS "dpo admin delete rot" ON public.registro_operacoes;
REVOKE DELETE ON public.registro_operacoes FROM authenticated, anon;

-- A validação de conteúdo não roda no ato de exclusão (linhas legadas continuam excluíveis).
DROP TRIGGER IF EXISTS registro_operacoes_validar ON public.registro_operacoes;
CREATE TRIGGER registro_operacoes_validar BEFORE INSERT ON public.registro_operacoes FOR EACH ROW EXECUTE FUNCTION public.validar_registro_operacao();
CREATE TRIGGER registro_operacoes_validar_upd BEFORE UPDATE ON public.registro_operacoes FOR EACH ROW
  WHEN (old.excluido_em IS NOT DISTINCT FROM new.excluido_em) EXECUTE FUNCTION public.validar_registro_operacao();

CREATE OR REPLACE FUNCTION public.proteger_exclusao_rot() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF old.excluido_em IS NOT NULL THEN
    RAISE EXCEPTION 'Linha % excluída logicamente: registro histórico imutável (LGPD art. 37)', old.codigo;
  END IF;
  IF (new.excluido_em IS DISTINCT FROM old.excluido_em OR new.excluido_por IS DISTINCT FROM old.excluido_por OR new.motivo_exclusao IS DISTINCT FROM old.motivo_exclusao)
     AND coalesce(current_setting('priva.exclusao_rot', true), '') <> '1' THEN
    RAISE EXCEPTION 'A exclusão de linha do ROT só ocorre pela operação auditada de exclusão lógica';
  END IF;
  RETURN new;
END $$;
REVOKE EXECUTE ON FUNCTION public.proteger_exclusao_rot() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER registro_operacoes_proteger_exclusao BEFORE UPDATE ON public.registro_operacoes FOR EACH ROW EXECUTE FUNCTION public.proteger_exclusao_rot();

CREATE OR REPLACE FUNCTION public.excluir_linha_rot(_rot_id uuid, _motivo text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.registro_operacoes; _role public.app_role; _nome text; _em timestamptz := now(); t public.trilha_auditoria_sistema;
BEGIN
  IF public.has_role(auth.uid(), 'DPO_OPERACIONAL') THEN _role := 'DPO_OPERACIONAL';
  ELSIF public.has_role(auth.uid(), 'ADMIN_SISTEMA') THEN _role := 'ADMIN_SISTEMA';
  ELSE RAISE EXCEPTION 'Somente DPO ou administrador exclui linhas do ROT'; END IF;
  IF length(trim(coalesce(_motivo, ''))) < 10 THEN RAISE EXCEPTION 'Informe o motivo da exclusão (mínimo 10 caracteres)'; END IF;
  SELECT * INTO r FROM public.registro_operacoes WHERE id = _rot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Linha do ROT não encontrada'; END IF;
  IF NOT public.cnpj_liberado(r.empresa_cnpj) THEN RAISE EXCEPTION 'Empresa suspensa'; END IF;
  IF _role <> 'ADMIN_SISTEMA' AND r.empresa_cnpj IS DISTINCT FROM public.minha_empresa_cnpj() THEN RAISE EXCEPTION 'Linha de outra empresa'; END IF;
  IF r.excluido_em IS NOT NULL THEN RAISE EXCEPTION 'Linha já excluída em %', r.excluido_em; END IF;
  SELECT coalesce(nullif(display_name, ''), email) INTO _nome FROM public.profiles WHERE id = auth.uid();
  PERFORM set_config('priva.exclusao_rot', '1', true);
  UPDATE public.registro_operacoes SET excluido_em = _em, excluido_por = coalesce(_nome, auth.uid()::text), motivo_exclusao = trim(_motivo) WHERE id = _rot_id;
  PERFORM set_config('priva.exclusao_rot', '', true);
  t := public.registrar_acesso(_role, 'DELETE', 'registro_operacoes', 'Exclusão lógica (art. 37) · ' || r.codigo || ' · motivo: ' || trim(_motivo), r.empresa_cnpj, null);
  RETURN jsonb_build_object('codigo', r.codigo, 'excluido_em', _em, 'excluido_por', coalesce(_nome, auth.uid()::text), 'hash', t.hash);
END $$;
REVOKE ALL ON FUNCTION public.excluir_linha_rot(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.excluir_linha_rot(uuid, text) TO authenticated;