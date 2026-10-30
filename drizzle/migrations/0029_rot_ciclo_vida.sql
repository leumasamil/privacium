CREATE OR REPLACE FUNCTION public.ciclo_vida_valido(c jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_typeof(c) = 'object' AND NOT EXISTS (
    SELECT 1 FROM jsonb_each(c) g
    WHERE jsonb_typeof(g.value) <> 'array'
       OR NOT ( (g.key = 'Coletar' AND (g.value - ARRAY['receber','extrair','produzir','classificar']) = '[]'::jsonb)
             OR (g.key = 'Reter' AND (g.value - ARRAY['arquivar','armazenar']) = '[]'::jsonb)
             OR (g.key = 'Processar' AND (g.value - ARRAY['utilizar','acessar','avaliar ou controlar','modificar','reproduzir']) = '[]'::jsonb)
             OR (g.key = 'Compartilhar' AND (g.value - ARRAY['transmitir','distribuir','comunicar','transferir','difundir']) = '[]'::jsonb)
             OR (g.key = 'Eliminar' AND (g.value - ARRAY['eliminar']) = '[]'::jsonb) )
  );
$$;
ALTER TABLE public.registro_operacoes ADD COLUMN IF NOT EXISTS ciclo_vida jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.registro_operacoes ADD CONSTRAINT registro_operacoes_ciclo_vida_chk CHECK (public.ciclo_vida_valido(ciclo_vida));