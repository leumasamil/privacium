CREATE TABLE public.incidencia_normativa (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campo text NOT NULL, condicao text NOT NULL DEFAULT 'SEMPRE', norma text NOT NULL, identificador text NOT NULL, categoria public.categoria_normativa NOT NULL, biblioteca_normativa_id uuid NOT NULL REFERENCES public.biblioteca_normativa(id), obrigatoria boolean NOT NULL DEFAULT true, UNIQUE(campo,condicao,biblioteca_normativa_id)
);
GRANT SELECT ON public.incidencia_normativa TO authenticated;
GRANT ALL ON public.incidencia_normativa TO service_role;
ALTER TABLE public.incidencia_normativa ENABLE ROW LEVEL SECURITY;
CREATE POLICY incidencia_leitura ON public.incidencia_normativa FOR SELECT TO authenticated USING(true);
CREATE OR REPLACE FUNCTION public.validar_incidencia_normativa() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE b public.biblioteca_normativa;
BEGIN SELECT * INTO b FROM public.biblioteca_normativa WHERE id=NEW.biblioteca_normativa_id;
IF b.status <> 'VERIFICADA' THEN RAISE EXCEPTION 'Citação não verificada'; END IF;
NEW.norma:=b.norma; NEW.identificador:=b.identificador; NEW.categoria:=b.categoria;
IF NEW.obrigatoria AND b.categoria IN ('FOMENTO_ECONOMICO','REFERENCIA_TECNICA') THEN RAISE EXCEPTION 'Referência econômica ou técnica não é fundamento autônomo de obrigação'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER incidencia_validar BEFORE INSERT OR UPDATE ON public.incidencia_normativa FOR EACH ROW EXECUTE FUNCTION public.validar_incidencia_normativa();