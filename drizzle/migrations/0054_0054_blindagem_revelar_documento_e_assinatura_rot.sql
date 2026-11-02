CREATE OR REPLACE FUNCTION public.revelar_documento_membro(_id uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  m public.membros_empresa%ROWTYPE;
  r public.app_role;
  em text;
  c text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'autenticação necessária'; END IF;
  SELECT * INTO m FROM public.membros_empresa WHERE id = _id AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Membro não encontrado'; END IF;
  SELECT cnpj INTO c FROM public.empresas WHERE id = m.empresa_id;
  IF c IS NULL THEN RAISE EXCEPTION 'Empresa do membro não encontrada'; END IF;
  IF NOT public.has_role(auth.uid(),'ADMIN_SISTEMA') AND c IS DISTINCT FROM public.minha_empresa_cnpj() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  SELECT email INTO em FROM public.profiles WHERE id = auth.uid();
  SELECT role INTO r FROM public.user_roles WHERE user_id = auth.uid()
    ORDER BY CASE role WHEN 'ADMIN_SISTEMA' THEN 0 WHEN 'DPO_OPERACIONAL' THEN 1 ELSE 2 END LIMIT 1;
  IF r IS NULL THEN RAISE EXCEPTION 'Cargo não concedido'; END IF;
  IF NOT (
    public.has_role(auth.uid(),'ADMIN_SISTEMA')
    OR public.has_role(auth.uid(),'DPO_OPERACIONAL')
    OR lower(m.email) = lower(coalesce(em,''))
    OR EXISTS (SELECT 1 FROM public.membros_empresa x WHERE x.empresa_id = m.empresa_id AND x.membro_comite AND x.ativo AND lower(x.email) = lower(coalesce(em,'')))
  ) THEN RAISE EXCEPTION 'Leitura do documento restrita ao DPO, ao Comitê de Governança e ao próprio membro'; END IF;
  PERFORM public.registrar_acesso(r, 'SELECT', 'membros_empresa', 'Revelação de documento do membro ' || m.nome, c, 'documento');
  RETURN m.documento;
END $function$;

CREATE OR REPLACE FUNCTION public.assinar_etapa_rot(_rot_id uuid, _etapa integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  r public.registro_operacoes%ROWTYPE;
  _email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  _uid uuid := auth.uid();
  _nome text; _area text; _hash text; _assinatura jsonb; _role public.app_role;
  _prev text; _nseq bigint; _nts timestamptz := now(); _nid uuid := gen_random_uuid();
  _thash text; _detail text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'autenticação obrigatória'; END IF;
  IF _etapa NOT IN (1, 2) THEN RAISE EXCEPTION 'etapa inválida'; END IF;
  SELECT * INTO r FROM public.registro_operacoes WHERE id = _rot_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'processo não encontrado'; END IF;
  IF NOT public.has_role(_uid,'ADMIN_SISTEMA') AND r.empresa_cnpj IS DISTINCT FROM public.minha_empresa_cnpj() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF NOT public.cnpj_liberado(r.empresa_cnpj) THEN RAISE EXCEPTION 'empresa suspensa'; END IF;

  _area := split_part(coalesce(r.area_setor, r.setor), '›', 1);

  IF _etapa = 1 THEN
    SELECT m.nome INTO _nome FROM public.membros_empresa m JOIN public.empresas e ON e.id = m.empresa_id
    WHERE e.cnpj = r.empresa_cnpj AND m.ativo AND m.papel_rac = 'R' AND lower(m.email) = _email
      AND split_part(m.area_setor, '›', 1) = btrim(_area) LIMIT 1;
    IF _nome IS NULL AND NOT (public.has_role(_uid, 'DPO_OPERACIONAL') OR public.has_role(_uid, 'ADMIN_SISTEMA')) THEN
      RAISE EXCEPTION 'apenas o gestor responsável (R) da área assina a Etapa 1';
    END IF;
    _nome := coalesce(_nome, 'DPO (substituição)');
  ELSE
    IF NOT (public.has_role(_uid, 'DPO_OPERACIONAL') OR public.has_role(_uid, 'ADMIN_SISTEMA')) THEN
      RAISE EXCEPTION 'apenas o DPO assina a Etapa 2';
    END IF;
    SELECT p.display_name INTO _nome FROM public.profiles p WHERE p.id = _uid;
    _nome := coalesce(_nome, _email);
  END IF;

  _hash := encode(sha256(convert_to(_rot_id::text || '|etapa' || _etapa || '|' || _email || '|' || now()::text, 'UTF8')), 'hex');
  _assinatura := jsonb_build_object('assinante', _nome, 'email', _email, 'etapa', _etapa, 'em', now(), 'sha256', _hash);

  IF _etapa = 1 THEN
    UPDATE public.registro_operacoes SET assinatura_etapa1 = _assinatura WHERE id = _rot_id;
  ELSE
    UPDATE public.registro_operacoes SET assinatura_etapa2 = _assinatura WHERE id = _rot_id;
  END IF;

  _detail := 'Assinatura Etapa ' || _etapa || ' — ' || coalesce(r.codigo, _rot_id::text) || ' por ' || _nome || ' (hash ' || left(_hash, 12) || '…)';

  IF public.has_role(_uid, 'DPO_OPERACIONAL') THEN _role := 'DPO_OPERACIONAL';
  ELSIF public.has_role(_uid, 'ADMIN_SISTEMA') THEN _role := 'ADMIN_SISTEMA';
  ELSE _role := NULL; END IF;

  IF _role IS NOT NULL THEN
    PERFORM public.registrar_acesso(_role, 'UPDATE', 'registro_operacoes', _detail, r.empresa_cnpj, 'assinatura_etapa' || _etapa);
  ELSE
    PERFORM pg_advisory_xact_lock(271002);
    SELECT hash INTO _prev FROM public.trilha_auditoria_sistema ORDER BY seq DESC LIMIT 1;
    _prev := coalesce(_prev, repeat('0', 64));
    _nseq := nextval(pg_get_serial_sequence('public.trilha_auditoria_sistema', 'seq'));
    _thash := encode(sha256(convert_to(_prev || _nseq::text || _nts::text || coalesce(_uid::text, '') || _email || 'GESTOR_AREA' || r.empresa_cnpj || 'UPDATE' || 'registro_operacoes' || _detail, 'UTF8')), 'hex');
    INSERT INTO public.trilha_auditoria_sistema (seq, ts, user_id, user_email, role, cnpj, op, target, detail, prev_hash, hash,
      id, usuario_id, acao_executada, tabela_afetada, campo_mascarado_acessado, ip_origem, timestamp_evento, hash_integridade_sha256)
    VALUES (_nseq, _nts, _uid, _email, 'GESTOR_AREA', r.empresa_cnpj, 'UPDATE', 'registro_operacoes', _detail, _prev, _thash,
      _nid, _uid, _detail, 'registro_operacoes', 'assinatura_etapa' || _etapa, '', _nts, _thash);
  END IF;

  RETURN _assinatura;
END;
$function$;