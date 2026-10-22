ALTER TABLE public.trilha_auditoria_sistema ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.trilha_auditoria_sistema ALTER COLUMN role DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.verificar_trilha()
 RETURNS TABLE(ok boolean, total bigint, broken_at bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
declare r record; prev text := repeat('0', 64); n bigint := 0;
begin
  if not (public.has_role(auth.uid(), 'ADMIN_SISTEMA') or public.has_role(auth.uid(), 'DPO_OPERACIONAL')) then
    raise exception 'not allowed';
  end if;
  for r in select * from public.trilha_auditoria_sistema order by seq loop
    n := n + 1;
    if r.prev_hash <> prev or r.hash <> encode(digest(r.seq::text || '|' || to_char(r.ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || coalesce(r.role::text,'') || '|' || coalesce(r.cnpj,'') || '|' || r.op || '|' || r.target || '|' || r.detail || '|' || r.prev_hash, 'sha256'), 'hex') then
      return query select false, n, r.seq; return;
    end if;
    prev := r.hash;
  end loop;
  return query select true, n, null::bigint;
end;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_falha_login(_email text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
declare prev text; nseq bigint; nts timestamptz := now(); ip text; nid uuid := gen_random_uuid(); em text; det text;
begin
  begin
    ip := trim(split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', current_setting('request.headers', true)::json->>'cf-connecting-ip', ''), ',', 1));
  exception when others then ip := ''; end;
  -- Anti-abuso: no máximo 20 registros por IP por minuto
  if (select count(*) from public.trilha_auditoria_sistema where op = 'LOGIN_FALHA' and coalesce(ip_origem,'') = ip and ts > now() - interval '1 minute') >= 20 then return; end if;
  em := left(lower(trim(coalesce(_email,''))), 120);
  em := case when position('@' in em) > 1 then left(em, 2) || '***' || substring(em from position('@' in em)) else '***' end;
  det := 'Falha de Login · ' || em;
  perform pg_advisory_xact_lock(271002);
  select hash into prev from public.trilha_auditoria_sistema order by seq desc limit 1;
  prev := coalesce(prev, repeat('0', 64));
  nseq := nextval(pg_get_serial_sequence('public.trilha_auditoria_sistema', 'seq'));
  insert into public.trilha_auditoria_sistema (seq, ts, user_id, user_email, role, cnpj, op, target, detail, prev_hash, hash,
    id, usuario_id, acao_executada, tabela_afetada, ip_origem, timestamp_evento, hash_integridade_sha256)
  values (nseq, nts, null, em, null, null, 'LOGIN_FALHA', 'auth', det, prev,
    encode(digest(nseq::text || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || '' || '|' || '' || '|' || 'LOGIN_FALHA' || '|' || 'auth' || '|' || det || '|' || prev, 'sha256'), 'hex'),
    nid, null, 'Falha de Login', 'auth', nullif(ip,''), nts,
    encode(digest(nid::text || '|' || '' || '|' || 'LOGIN_FALHA' || '|' || 'auth' || '|' || '' || '|' || coalesce(ip,'') || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), 'sha256'), 'hex'));
end;
$function$;
REVOKE ALL ON FUNCTION public.registrar_falha_login(text) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_falha_login(text) TO anon, authenticated;