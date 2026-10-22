ALTER TABLE public.trilha_auditoria_sistema DROP CONSTRAINT trilha_auditoria_sistema_acao_executada_check;
ALTER TABLE public.trilha_auditoria_sistema DROP CONSTRAINT trilha_auditoria_sistema_op_check;
ALTER TABLE public.trilha_auditoria_sistema ADD CONSTRAINT trilha_auditoria_sistema_op_check CHECK (op = ANY (ARRAY['SELECT','INSERT','UPDATE','DELETE','LOGIN_FALHA']));
ALTER TABLE public.trilha_auditoria_sistema ADD CONSTRAINT trilha_auditoria_sistema_acao_executada_check CHECK (acao_executada = ANY (ARRAY['SELECT','INSERT','UPDATE','DELETE','LOGIN_FALHA']));
CREATE OR REPLACE FUNCTION public.registrar_falha_login(_email text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
declare prev text; nseq bigint; nts timestamptz := now(); ip text; nid uuid := gen_random_uuid(); em text; det text;
begin
  begin
    ip := trim(split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', current_setting('request.headers', true)::json->>'cf-connecting-ip', ''), ',', 1));
  exception when others then ip := ''; end;
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
    encode(digest(nseq::text || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '||' || '|LOGIN_FALHA|auth|' || det || '|' || prev, 'sha256'), 'hex'),
    nid, null, 'LOGIN_FALHA', 'auth', nullif(ip,''), nts,
    encode(digest(nid::text || '||LOGIN_FALHA|auth||' || coalesce(ip,'') || '|' || to_char(nts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), 'sha256'), 'hex'));
end;
$function$;