CREATE OR REPLACE FUNCTION public.cnpj_liberado(_cnpj text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_role(auth.uid(),'ADMIN_SISTEMA')
      or coalesce((select status = 'ATIVO' from public.empresas where cnpj = _cnpj), false)
$function$;