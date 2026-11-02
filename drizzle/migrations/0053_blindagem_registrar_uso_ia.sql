DROP FUNCTION IF EXISTS public.registrar_uso_ia(text, integer, integer);

CREATE OR REPLACE FUNCTION public.registrar_uso_ia(_cnpj text, _tokens integer, _bloqueios integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE _empresa_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão não autenticada'; END IF;
  IF NOT public.has_any_role(auth.uid())
     OR NOT public.cnpj_liberado(_cnpj)
     OR (NOT public.has_role(auth.uid(), 'ADMIN_SISTEMA')
         AND _cnpj IS DISTINCT FROM public.minha_empresa_cnpj()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  SELECT id INTO _empresa_id FROM public.empresas WHERE cnpj = _cnpj;
  IF _empresa_id IS NULL THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;
  UPDATE public.metricas_uso_ia
     SET volume_tokens_sinteticos_gerados = volume_tokens_sinteticos_gerados + coalesce(_tokens,0),
         quantidade_bloqueios_vazamento = quantidade_bloqueios_vazamento + coalesce(_bloqueios,0),
         atualizado_em = now()
   WHERE empresa_id = _empresa_id;
  IF NOT FOUND THEN
    INSERT INTO public.metricas_uso_ia (empresa_id, volume_tokens_sinteticos_gerados, quantidade_bloqueios_vazamento, atualizado_em)
    VALUES (_empresa_id, coalesce(_tokens,0), coalesce(_bloqueios,0), now());
  END IF;
END;
$function$;