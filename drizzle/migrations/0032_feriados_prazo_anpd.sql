CREATE OR REPLACE FUNCTION public.limite_anpd_uteis(_inicio timestamptz,_dias integer) RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
-- Feriados nacionais 2026-2027: Lei 662/1949 (red. Lei 10.607/2002), Lei 6.802/1980, Lei 14.759/2023, Lei 9.093/1995 (Paixão, móvel a partir da Páscoa).
DECLARE t timestamptz:=_inicio; n integer:=0;
 f date[]:=ARRAY['2026-01-01','2026-04-03','2026-04-21','2026-05-01','2026-09-07','2026-10-12','2026-11-02','2026-11-15','2026-11-20','2026-12-25',
                 '2027-01-01','2027-03-26','2027-04-21','2027-05-01','2027-09-07','2027-10-12','2027-11-02','2027-11-15','2027-11-20','2027-12-25']::date[];
BEGIN IF _dias NOT IN (3,6) THEN RAISE EXCEPTION 'Prazo inválido'; END IF;
 WHILE n<_dias LOOP t:=t+interval '24 hours';
  IF extract(isodow FROM t AT TIME ZONE 'UTC')<6 AND NOT ((t AT TIME ZONE 'UTC')::date = ANY(f)) THEN n:=n+1; END IF;
 END LOOP; RETURN t; END $$;