ALTER TABLE public.registro_operacoes ADD COLUMN continuacao_receptor jsonb;
CREATE OR REPLACE FUNCTION public.declarar_continuacao_receptor(_rot_id uuid,_declaracao jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r public.registro_operacoes; c text; t text; d jsonb; alvo public.registro_operacoes; a public.trilha_auditoria_sistema; BEGIN
SELECT * INTO r FROM public.registro_operacoes WHERE id=_rot_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Receptor inexistente'; END IF;
SELECT id INTO c FROM public.empresas WHERE cnpj=r.empresa_cnpj;
PERFORM public.autorizar_titulares(c::uuid);
IF r.excluido_em IS NOT NULL OR r.removida_do_dossie OR r.origem_compartilhamento IS NULL THEN RAISE EXCEPTION 'Linha não é receptor ativo'; END IF;
IF jsonb_typeof(_declaracao) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Declaração inválida'; END IF;
t:=_declaracao->>'tipo';
IF t IS NULL OR t NOT IN ('NOVO_PRT','ELIMINACAO','USO_EXCLUSIVO','INCORPORACAO') THEN RAISE EXCEPTION 'Escolha o tratamento pelo receptor'; END IF;
IF t='NOVO_PRT' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.produtos_tratamento) p WHERE length(btrim(p->>'nome'))>0) THEN RAISE EXCEPTION 'Cadastre o novo PRT na linha receptora'; END IF;
IF t='USO_EXCLUSIVO' AND (r.papel_agente='OPERADOR' OR _declaracao->'anonimizados' IS DISTINCT FROM 'true'::jsonb OR _declaracao->'sem_acesso_terceiro' IS DISTINCT FROM 'true'::jsonb) THEN RAISE EXCEPTION 'Uso exclusivo exige controlador, anonimização e ausência de acesso por terceiro'; END IF;
IF t='INCORPORACAO' THEN
SELECT * INTO alvo FROM public.registro_operacoes WHERE id=(_declaracao->>'linha_id')::uuid AND empresa_cnpj=r.empresa_cnpj AND excluido_em IS NULL AND NOT removida_do_dossie;
IF NOT FOUND OR alvo.id=r.id OR coalesce((_declaracao->>'produto_indice')::integer,-1)<0 OR jsonb_array_length(alvo.produtos_tratamento)<=(_declaracao->>'produto_indice')::integer THEN RAISE EXCEPTION 'Produto existente inválido'; END IF; END IF;
d:=jsonb_build_object('tipo',t,'em',now(),'por',auth.uid(),'anonimizados',t='USO_EXCLUSIVO','sem_acesso_terceiro',t='USO_EXCLUSIVO','linha_id',CASE WHEN t='INCORPORACAO' THEN alvo.id END,'produto_indice',CASE WHEN t='INCORPORACAO' THEN (_declaracao->>'produto_indice')::integer END,'fundamento',CASE t WHEN 'ELIMINACAO' THEN 'LGPD art. 16, caput' WHEN 'USO_EXCLUSIVO' THEN 'LGPD art. 16, IV' ELSE 'Escolha expressa do receptor' END);
a:=public.registrar_acesso(CASE WHEN public.has_role(auth.uid(),'ADMIN_SISTEMA') THEN 'ADMIN_SISTEMA'::public.app_role ELSE 'DPO_OPERACIONAL'::public.app_role END,'UPDATE','registro_operacoes','Continuidade do receptor '||r.codigo||': '||t,r.empresa_cnpj,'continuacao_receptor');
d:=d||jsonb_build_object('hash',a.hash);PERFORM set_config('priva.continuacao_receptor','1',true);
UPDATE public.registro_operacoes SET continuacao_receptor=d,assinatura_etapa1=NULL,assinatura_etapa2=NULL WHERE id=r.id;PERFORM set_config('priva.continuacao_receptor','',true);RETURN d; END $$;
CREATE OR REPLACE FUNCTION public.proteger_continuacao_receptor() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.continuacao_receptor IS DISTINCT FROM OLD.continuacao_receptor AND coalesce(current_setting('priva.continuacao_receptor',true),'')<>'1' THEN RAISE EXCEPTION 'Continuidade só muda pela declaração auditada'; END IF;
IF NEW.continuacao_receptor->>'tipo'='NOVO_PRT' AND NEW.produtos_tratamento IS DISTINCT FROM OLD.produtos_tratamento THEN
PERFORM set_config('priva.continuacao_receptor','1',true);NEW.continuacao_receptor:=NULL;NEW.assinatura_etapa1:=NULL;NEW.assinatura_etapa2:=NULL;PERFORM set_config('priva.continuacao_receptor','',true);END IF; RETURN NEW; END $$;
CREATE TRIGGER proteger_continuacao BEFORE UPDATE ON public.registro_operacoes FOR EACH ROW EXECUTE FUNCTION public.proteger_continuacao_receptor();
REVOKE ALL ON FUNCTION public.declarar_continuacao_receptor(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.declarar_continuacao_receptor(uuid,jsonb) TO authenticated;