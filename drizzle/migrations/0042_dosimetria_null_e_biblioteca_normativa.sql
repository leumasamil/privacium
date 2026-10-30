-- Parte A: redução de dosimetria — NULL significa "não calculado" (simulador em revisão);
-- 0 significaria "calculado e igual a zero". Converte os registros 0 existentes para NULL.
ALTER TABLE public.ciclos_priva ALTER COLUMN reducao_dosimetria DROP NOT NULL;
UPDATE public.ciclos_priva SET reducao_dosimetria = NULL WHERE reducao_dosimetria = 0;
COMMENT ON COLUMN public.ciclos_priva.reducao_dosimetria IS 'NULL = não calculado (simulador em revisão, Res. CD/ANPD nº 4/2023 art. 13); valor numérico só quando o cálculo estiver habilitado.';

-- Parte B: biblioteca normativa versionada
CREATE TYPE public.categoria_normativa AS ENUM ('REGIME_GERAL', 'LEI_ESPECIAL_SETORIAL', 'FOMENTO_ECONOMICO', 'REFERENCIA_TECNICA');
CREATE TYPE public.status_normativo AS ENUM ('VERIFICADA', 'PENDENTE', 'DIVERGENTE', 'NAO_VERIFICAVEL');

CREATE TABLE public.biblioteca_normativa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  norma text NOT NULL,
  identificador text NOT NULL,
  texto_literal text,
  url_oficial text,
  categoria public.categoria_normativa NOT NULL,
  status public.status_normativo NOT NULL DEFAULT 'PENDENTE',
  verificado_em date,
  verificado_por text,
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (norma, identificador)
);

GRANT SELECT ON public.biblioteca_normativa TO authenticated;
GRANT ALL ON public.biblioteca_normativa TO service_role;

ALTER TABLE public.biblioteca_normativa ENABLE ROW LEVEL SECURITY;

-- Leitura para qualquer usuário autenticado (são textos de lei públicos);
-- escrita somente via RPC verificar_citacao_normativa (DPO/ADMIN), com trilha.
CREATE POLICY biblioteca_normativa_select ON public.biblioteca_normativa
  FOR SELECT TO authenticated USING (true);

-- Marca uma citação como verificada, exigindo URL e texto literal, e grava a trilha com hash.
CREATE OR REPLACE FUNCTION public.verificar_citacao_normativa(_id uuid, _url text, _texto text)
RETURNS public.biblioteca_normativa
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  _role public.app_role;
  _row public.biblioteca_normativa%ROWTYPE;
  _detail text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'autenticação obrigatória'; END IF;
  IF NOT (public.has_role(_uid, 'DPO_OPERACIONAL') OR public.has_role(_uid, 'ADMIN_SISTEMA')) THEN
    RAISE EXCEPTION 'apenas DPO ou administrador verifica citações normativas';
  END IF;
  IF _url IS NULL OR btrim(_url) = '' THEN RAISE EXCEPTION 'URL oficial obrigatória'; END IF;
  IF _texto IS NULL OR length(btrim(_texto)) < 20 THEN RAISE EXCEPTION 'texto literal obrigatório (mínimo 20 caracteres)'; END IF;

  UPDATE public.biblioteca_normativa
  SET status = 'VERIFICADA', texto_literal = _texto, url_oficial = _url,
      verificado_em = current_date, verificado_por = _email, atualizado_em = now()
  WHERE id = _id
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'citação não encontrada'; END IF;

  _detail := 'Citação normativa verificada: ' || _row.norma || ' ' || _row.identificador || ' (hash sha256 do texto: ' || left(encode(sha256(convert_to(_texto, 'UTF8')), 'hex'), 12) || '…)';
  IF public.has_role(_uid, 'DPO_OPERACIONAL') THEN _role := 'DPO_OPERACIONAL'; ELSE _role := 'ADMIN_SISTEMA'; END IF;
  PERFORM public.registrar_acesso(_role, 'UPDATE', 'biblioteca_normativa', _detail, public.minha_empresa_cnpj(), 'texto_literal');

  RETURN _row;
END;
$$;
REVOKE ALL ON FUNCTION public.verificar_citacao_normativa(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verificar_citacao_normativa(uuid, text, text) TO authenticated;