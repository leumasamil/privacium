create or replace function public.verify_audit_chain()
returns table (ok boolean, total bigint, broken_at bigint)
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  r record;
  prev text := repeat('0', 64);
  n bigint := 0;
begin
  if not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'dpo')) then
    raise exception 'not allowed';
  end if;
  for r in select * from public.audit_log order by seq loop
    n := n + 1;
    if r.prev_hash <> prev or r.hash <> encode(digest(r.seq::text || '|' || to_char(r.ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || r.role::text || '|' || r.op || '|' || r.target || '|' || r.detail || '|' || r.prev_hash, 'sha256'), 'hex') then
      return query select false, n, r.seq; return;
    end if;
    prev := r.hash;
  end loop;
  return query select true, n, null::bigint;
end;
$$;
grant execute on function public.verify_audit_chain() to authenticated;