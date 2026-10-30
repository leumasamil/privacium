CREATE TYPE public.origem_registro AS ENUM ('REAL', 'TESTE', 'DEMONSTRACAO');

ALTER TABLE public.registro_operacoes
  ADD COLUMN origem public.origem_registro NOT NULL DEFAULT 'REAL',
  ADD COLUMN removida_do_dossie boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.registro_operacoes.origem IS 'Origem da linha: REAL (operação do cliente), TESTE ou DEMONSTRACAO. Linhas TESTE/DEMONSTRACAO nunca entram no PI-02.';
COMMENT ON COLUMN public.registro_operacoes.removida_do_dossie IS 'true = fora do PI-02 e do grafo, mas preservada no banco para auditoria. Só muda pela operação auditada remover_registro_de_teste.';

-- O guardião passa a proteger também origem/removida_do_dossie e a permitir a remoção auditada de teste.
CREATE OR REPLACE FUNCTION public.proteger_exclusao_rot() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF old.excluido_em IS NOT NULL AND coalesce(current_setting('priva.remocao_teste', true), '') <> '1' THEN
    RAISE EXCEPTION 'Linha % excluída logicamente: registro histórico imutável (LGPD art. 37)', old.codigo;
  END IF;
  IF (new.excluido_em IS DISTINCT FROM old.excluido_em OR new.excluido_por IS DISTINCT FROM old.excluido_por OR new.motivo_exclusao IS DISTINCT FROM old.motivo_exclusao)
     AND coalesce(current_setting('priva.exclusao_rot', true), '') <> '1' THEN
    RAISE EXCEPTION 'A exclusão de linha do ROT só ocorre pela operação auditada de exclusão lógica';
  END IF;
  IF (new.origem IS DISTINCT FROM old.origem OR new.removida_do_dossie IS DISTINCT FROM old.removida_do_dossie)
     AND coalesce(current_setting('priva.remocao_teste', true), '') <> '1' THEN
    RAISE EXCEPTION 'A origem e a saída do dossiê só mudam pela operação auditada remover_registro_de_teste';
  END IF;
  RETURN new;
END $$;
REVOKE EXECUTE ON FUNCTION public.proteger_exclusao_rot() FROM PUBLIC, anon, authenticated;

-- Remoção administrativa auditada de registro de teste: só ADMIN_SISTEMA (papel de proprietário do sistema),
-- com justificativa obrigatória. Marca origem=TESTE e removida_do_dossie=true; a linha permanece no banco.
CREATE OR REPLACE FUNCTION public.remover_registro_de_teste(_rot_id uuid, _justificativa text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.registro_operacoes; _nome text; _em timestamptz := now(); t public.trilha_auditoria_sistema;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN_SISTEMA') THEN
    RAISE EXCEPTION 'Somente o proprietário do sistema (ADMIN_SISTEMA) remove registros de teste do dossiê';
  END IF;
  IF length(trim(coalesce(_justificativa, ''))) < 10 THEN
    RAISE EXCEPTION 'Informe a justificativa da remoção (mínimo 10 caracteres)';
  END IF;
  SELECT * INTO r FROM public.registro_operacoes WHERE id = _rot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Linha do ROT não encontrada'; END IF;
  IF r.removida_do_dossie THEN RAISE EXCEPTION 'Linha % já está fora do dossiê', r.codigo; END IF;
  SELECT coalesce(nullif(display_name, ''), email) INTO _nome FROM public.profiles WHERE id = auth.uid();
  PERFORM set_config('priva.remocao_teste', '1', true);
  UPDATE public.registro_operacoes SET origem = 'TESTE', removida_do_dossie = true WHERE id = _rot_id;
  PERFORM set_config('priva.remocao_teste', '', true);
  t := public.registrar_acesso('ADMIN_SISTEMA', 'UPDATE', 'registro_operacoes',
    'Remoção de registro de teste do dossiê · ' || r.codigo || ' · justificativa: ' || trim(_justificativa),
    r.empresa_cnpj, 'origem');
  RETURN jsonb_build_object('codigo', r.codigo, 'removida_em', _em, 'removida_por', coalesce(_nome, auth.uid()::text), 'hash', t.hash);
END $$;
REVOKE ALL ON FUNCTION public.remover_registro_de_teste(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remover_registro_de_teste(uuid, text) TO authenticated;