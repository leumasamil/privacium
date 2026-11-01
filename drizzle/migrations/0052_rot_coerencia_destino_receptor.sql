CREATE OR REPLACE FUNCTION public.proteger_continuacao_receptor() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
IF NEW.continuacao_receptor IS DISTINCT FROM OLD.continuacao_receptor AND coalesce(current_setting('priva.continuacao_receptor',true),'')<>'1' THEN RAISE EXCEPTION 'Continuidade só muda pela declaração auditada'; END IF;
IF NEW.continuacao_receptor->>'tipo'='NOVO_PRT' AND (SELECT coalesce(jsonb_agg(p->>'nome' ORDER BY ord),'[]'::jsonb) FROM jsonb_array_elements(NEW.produtos_tratamento) WITH ORDINALITY AS x(p,ord)) IS DISTINCT FROM (SELECT coalesce(jsonb_agg(p->>'nome' ORDER BY ord),'[]'::jsonb) FROM jsonb_array_elements(OLD.produtos_tratamento) WITH ORDINALITY AS x(p,ord)) THEN
NEW.continuacao_receptor:=NULL;NEW.assinatura_etapa1:=NULL;NEW.assinatura_etapa2:=NULL;
END IF; RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.validar_coerencia_destino_rot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE mudou boolean; definitivo boolean; tipo text;
BEGIN
IF TG_OP='INSERT' THEN mudou:=true; ELSE mudou:=NEW.ciclo_vida IS DISTINCT FROM OLD.ciclo_vida OR NEW.produtos_tratamento IS DISTINCT FROM OLD.produtos_tratamento OR NEW.destino_produto IS DISTINCT FROM OLD.destino_produto OR NEW.origem_compartilhamento IS DISTINCT FROM OLD.origem_compartilhamento; END IF;
IF NOT mudou THEN RETURN NEW; END IF;
IF coalesce(NEW.ciclo_vida->'Coletar','[]'::jsonb) ? 'produzir' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.produtos_tratamento) p WHERE length(btrim(coalesce(p->>'nome','')))>0) AND length(btrim(coalesce(NEW.produto_interno,'')))=0 THEN RAISE EXCEPTION 'Etapa 1 com produzir sem PRT na coluna 10C'; END IF;
IF NEW.origem_compartilhamento IS NULL THEN RETURN NEW; END IF;
definitivo:=jsonb_array_length(coalesce(NEW.ciclo_vida->'Compartilhar','[]'::jsonb))>0 OR jsonb_array_length(coalesce(NEW.ciclo_vida->'Eliminar','[]'::jsonb))>0 OR EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.produtos_tratamento) p WHERE p->'destino' IS NOT NULL AND p->'destino'<>'null'::jsonb) OR (NEW.destino_produto IS NOT NULL AND NEW.destino_produto<>'null'::jsonb);
tipo:=NEW.continuacao_receptor->>'tipo';
IF definitivo AND (tipo IS NULL OR tipo NOT IN ('NOVO_PRT','ELIMINACAO','USO_EXCLUSIVO','INCORPORACAO') OR (tipo='USO_EXCLUSIVO' AND (NEW.continuacao_receptor->'anonimizados' IS DISTINCT FROM 'true'::jsonb OR NEW.continuacao_receptor->'sem_acesso_terceiro' IS DISTINCT FROM 'true'::jsonb))) THEN RAISE EXCEPTION 'Pendente — aguardando decisão do receptor. Registre a escolha antes de salvar destino definitivo.'; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER z_validar_coerencia_destino_rot BEFORE INSERT OR UPDATE ON public.registro_operacoes FOR EACH ROW EXECUTE FUNCTION public.validar_coerencia_destino_rot();