-- Item 3c: duas assinaturas por etapa no ROT (Etapa 1 = gestor R da Área › Setor; Etapa 2 = DPO),
-- registradas na trilha com hash SHA-256. Colunas aditivas; nada existente é alterado.
ALTER TABLE public.registro_operacoes
  ADD COLUMN assinatura_etapa1 jsonb,
  ADD COLUMN assinatura_etapa2 jsonb;
COMMENT ON COLUMN public.registro_operacoes.assinatura_etapa1 IS 'Assinatura da Etapa 1 (perímetro) pelo gestor R da área: {assinante, email, em, sha256}';
COMMENT ON COLUMN public.registro_operacoes.assinatura_etapa2 IS 'Assinatura da Etapa 2 (destino) pelo DPO: {assinante, email, em, sha256}';

CREATE OR REPLACE FUNCTION public.assinar_etapa_rot(_rot_id uuid, _etapa int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.registro_operacoes%ROWTYPE;
  _email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  _uid uuid := auth.uid();
  _nome text;
  _area text;
  _hash text;
  _assinatura jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'autenticação obrigatória'; END IF;
  IF _etapa NOT IN (1, 2) THEN RAISE EXCEPTION 'etapa inválida'; END IF;
  SELECT * INTO r FROM public.registro_operacoes WHERE id = _rot_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'processo não encontrado'; END IF;
  IF NOT public.cnpj_liberado(r.empresa_cnpj) THEN RAISE EXCEPTION 'empresa suspensa'; END IF;

  _area := split_part(coalesce(r.area_setor, r.setor), '›', 1);

  IF _etapa = 1 THEN
    -- Gestor responsável (R) da área da linha, na mesma empresa, identificado pelo e-mail do login
    SELECT m.nome INTO _nome
    FROM public.membros_empresa m
    JOIN public.empresas e ON e.id = m.empresa_id
    WHERE e.cnpj = r.empresa_cnpj
      AND m.ativo
      AND m.papel_rac = 'R'
      AND lower(m.email) = _email
      AND split_part(m.area_setor, '›', 1) = btrim(_area)
    LIMIT 1;
    IF _nome IS NULL AND NOT (public.has_role(_uid, 'DPO_OPERACIONAL') OR public.has_role(_uid, 'ADMIN_SISTEMA')) THEN
      RAISE EXCEPTION 'apenas o gestor responsável (R) da área assina a Etapa 1';
    END IF;
    _nome := coalesce(_nome, 'DPO (substituição)');
  ELSE
    IF NOT (public.has_role(_uid, 'DPO_OPERACIONAL') OR public.has_role(_uid, 'ADMIN_SISTEMA')) THEN
      RAISE EXCEPTION 'apenas o DPO assina a Etapa 2';
    END IF;
    SELECT coalesce(p.nome, _email) INTO _nome FROM public.profiles p WHERE p.id = _uid;
    _nome := coalesce(_nome, _email);
  END IF;

  _hash := encode(sha256(convert_to(_rot_id::text || '|etapa' || _etapa || '|' || _email || '|' || now()::text, 'UTF8')), 'hex');
  _assinatura := jsonb_build_object('assinante', _nome, 'email', _email, 'etapa', _etapa, 'em', now(), 'sha256', _hash);

  IF _etapa = 1 THEN
    UPDATE public.registro_operacoes SET assinatura_etapa1 = _assinatura WHERE id = _rot_id;
  ELSE
    UPDATE public.registro_operacoes SET assinatura_etapa2 = _assinatura WHERE id = _rot_id;
  END IF;

  PERFORM public.registrar_acesso(
    'UPDATE', 'registro_operacoes',
    'Assinatura Etapa ' || _etapa || ' — ' || coalesce(r.codigo, _rot_id::text) || ' por ' || _nome || ' (hash ' || left(_hash, 12) || '…)',
    r.empresa_cnpj, 'assinatura_etapa' || _etapa);

  RETURN _assinatura;
END;
$$;
REVOKE ALL ON FUNCTION public.assinar_etapa_rot(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assinar_etapa_rot(uuid, int) TO authenticated;
NOTIFY pgrst, 'reload schema';