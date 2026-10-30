-- PARTE A: Etapa 2 como lista de PRT (Produto do Tratamento), cada um com destino próprio.
ALTER TABLE public.registro_operacoes ADD COLUMN produtos_tratamento jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.registro_operacoes ADD CONSTRAINT produtos_tratamento_lista CHECK (jsonb_typeof(produtos_tratamento) = 'array');
UPDATE public.registro_operacoes
   SET produtos_tratamento = jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
         'nome', produto_interno,
         'destino', CASE WHEN destino_produto IS NULL THEN NULL
                         ELSE destino_produto || jsonb_strip_nulls(jsonb_build_object('prazo', prazo_produto, 'fundamento', fundamento_produto)) END)))
 WHERE coalesce(trim(produto_interno), '') <> '';
COMMENT ON COLUMN public.registro_operacoes.produtos_tratamento IS 'Lista de PRT (Produto do Tratamento): [{nome, destino:{tipo INTERNO|EXTERNO|ELIMINACAO, area_setor_destino, terceiro_id, terceiro_nome, linha_receptor_id, linha_receptor_codigo, prazo, fundamento}}]. PRT-1 = posição 0.';
COMMENT ON COLUMN public.registro_operacoes.produto_interno IS 'Espelho do nome do PRT-1 (compatibilidade); a fonte é produtos_tratamento.';
COMMENT ON COLUMN public.registro_operacoes.destino_produto IS 'DEPRECATED: substituído por produtos_tratamento[].destino';
COMMENT ON COLUMN public.registro_operacoes.prazo_produto IS 'DEPRECATED: substituído por produtos_tratamento[].destino.prazo';
COMMENT ON COLUMN public.registro_operacoes.fundamento_produto IS 'DEPRECATED: substituído por produtos_tratamento[].destino.fundamento';

-- PARTE B: cadastro de terceiros por empresa (LGPD arts. 5º, VII; 33; 37; 39 e 46).
CREATE TABLE public.terceiros_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  razao_social text NOT NULL,
  cnpj text NOT NULL CHECK (cnpj ~ '^[0-9]{14}$'),
  papel_cadeia text NOT NULL CHECK (papel_cadeia IN ('OPERADOR','CONTROLADOR_INDEPENDENTE','SUBOPERADOR')),
  operador_principal_id uuid REFERENCES public.terceiros_empresa(id),
  contrato_vigente boolean NOT NULL DEFAULT false,
  data_contrato date,
  clausulas_art39 boolean NOT NULL DEFAULT false,
  checklist_art39 jsonb NOT NULL DEFAULT '{}'::jsonb,
  transferencia_internacional boolean NOT NULL DEFAULT false,
  hipotese_art33 text CHECK (hipotese_art33 IS NULL OR hipotese_art33 IN ('I','II-a','II-b','II-c','II-d','III','IV','V','VI','VII','VIII','IX')),
  encarregado_contato text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suboperador_exige_operador CHECK (papel_cadeia <> 'SUBOPERADOR' OR operador_principal_id IS NOT NULL),
  CONSTRAINT transferencia_exige_hipotese CHECK (NOT transferencia_internacional OR hipotese_art33 IS NOT NULL),
  CONSTRAINT contrato_exige_data CHECK (NOT contrato_vigente OR data_contrato IS NOT NULL)
);
CREATE INDEX terceiros_empresa_empresa_idx ON public.terceiros_empresa(empresa_id);

-- O CNPJ fica fora do GRANT de leitura: só sai pela função auditada revelar_cnpj_terceiro.
REVOKE ALL ON public.terceiros_empresa FROM anon, authenticated;
GRANT SELECT (id, empresa_id, razao_social, papel_cadeia, operador_principal_id, contrato_vigente, data_contrato, clausulas_art39, checklist_art39, transferencia_internacional, hipotese_art33, encarregado_contato, ativo, criado_em, atualizado_em) ON public.terceiros_empresa TO authenticated;
GRANT INSERT (empresa_id, razao_social, cnpj, papel_cadeia, operador_principal_id, contrato_vigente, data_contrato, checklist_art39, transferencia_internacional, hipotese_art33, encarregado_contato) ON public.terceiros_empresa TO authenticated;
GRANT UPDATE (razao_social, papel_cadeia, operador_principal_id, contrato_vigente, data_contrato, checklist_art39, transferencia_internacional, hipotese_art33, encarregado_contato, ativo) ON public.terceiros_empresa TO authenticated;
GRANT ALL ON public.terceiros_empresa TO service_role;
ALTER TABLE public.terceiros_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY terceiros_leitura ON public.terceiros_empresa FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY terceiros_escrita ON public.terceiros_empresa FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'DPO_OPERACIONAL') OR public.has_role(auth.uid(),'ADMIN_SISTEMA'));
CREATE POLICY terceiros_atualizacao ON public.terceiros_empresa FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'DPO_OPERACIONAL') OR public.has_role(auth.uid(),'ADMIN_SISTEMA')) WITH CHECK (public.has_role(auth.uid(),'DPO_OPERACIONAL') OR public.has_role(auth.uid(),'ADMIN_SISTEMA'));
CREATE POLICY terceiros_isolamento ON public.terceiros_empresa AS RESTRICTIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR empresa_id = public.minha_empresa_id()) WITH CHECK (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR empresa_id = public.minha_empresa_id());
CREATE POLICY terceiros_empresa_ativa ON public.terceiros_empresa AS RESTRICTIVE FOR ALL TO authenticated USING (public.cnpj_liberado((SELECT e.cnpj FROM public.empresas e WHERE e.id = empresa_id))) WITH CHECK (public.cnpj_liberado((SELECT e.cnpj FROM public.empresas e WHERE e.id = empresa_id)));
-- Sem GRANT de DELETE: exclusão sempre lógica (ativo = false).

-- Checklist do instrumento escrito: clausulas_art39 só é verdadeiro com os 10 itens marcados;
-- suboperador precisa apontar para um operador ativo da mesma empresa.
CREATE OR REPLACE FUNCTION public.terceiros_empresa_validar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; ok boolean := true;
BEGIN
  FOREACH k IN ARRAY ARRAY['instrucoes','proposito','metodos','duracao','deveres','vigencia','controle','responsabilidade','seguranca','direitos_titular'] LOOP
    IF coalesce((NEW.checklist_art39 ->> k)::boolean, false) IS NOT TRUE THEN ok := false; END IF;
  END LOOP;
  NEW.clausulas_art39 := ok;
  IF NEW.papel_cadeia = 'SUBOPERADOR' AND NOT EXISTS (
    SELECT 1 FROM public.terceiros_empresa p WHERE p.id = NEW.operador_principal_id AND p.empresa_id = NEW.empresa_id AND p.papel_cadeia = 'OPERADOR' AND p.ativo AND p.id <> NEW.id
  ) THEN RAISE EXCEPTION 'Suboperador exige vínculo com um operador principal ativo da mesma empresa'; END IF;
  IF NEW.papel_cadeia <> 'SUBOPERADOR' THEN NEW.operador_principal_id := NULL; END IF;
  IF NOT NEW.transferencia_internacional THEN NEW.hipotese_art33 := NULL; END IF;
  IF TG_OP = 'UPDATE' THEN NEW.empresa_id := OLD.empresa_id; NEW.cnpj := OLD.cnpj; END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.terceiros_empresa_validar() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER terceiros_empresa_validar BEFORE INSERT OR UPDATE ON public.terceiros_empresa FOR EACH ROW EXECUTE FUNCTION public.terceiros_empresa_validar();

-- Revelação auditada do CNPJ: DPO, ADMIN ou membro do Comitê de Governança da mesma empresa.
CREATE OR REPLACE FUNCTION public.revelar_cnpj_terceiro(_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE t public.terceiros_empresa%ROWTYPE; r public.app_role; em text; c text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'autenticação necessária'; END IF;
  SELECT * INTO t FROM public.terceiros_empresa WHERE id = _id AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Terceiro não encontrado'; END IF;
  SELECT email INTO em FROM public.profiles WHERE id = auth.uid();
  SELECT role INTO r FROM public.user_roles WHERE user_id = auth.uid()
    ORDER BY CASE role WHEN 'ADMIN_SISTEMA' THEN 0 WHEN 'DPO_OPERACIONAL' THEN 1 ELSE 2 END LIMIT 1;
  IF r IS NULL THEN RAISE EXCEPTION 'Cargo não concedido'; END IF;
  IF NOT (
    public.has_role(auth.uid(),'ADMIN_SISTEMA')
    OR (t.empresa_id = public.minha_empresa_id() AND (
      public.has_role(auth.uid(),'DPO_OPERACIONAL')
      OR EXISTS (SELECT 1 FROM public.membros_empresa x WHERE x.empresa_id = t.empresa_id AND x.membro_comite AND x.ativo AND lower(x.email) = lower(coalesce(em,'')))
    ))
  ) THEN RAISE EXCEPTION 'Leitura do CNPJ do terceiro restrita ao DPO e ao Comitê de Governança'; END IF;
  SELECT cnpj INTO c FROM public.empresas WHERE id = t.empresa_id;
  PERFORM public.registrar_acesso(r, 'SELECT', 'terceiros_empresa', 'Revelação do CNPJ do terceiro ' || t.razao_social, coalesce(c,''), 'cnpj');
  RETURN t.cnpj;
END $$;
REVOKE ALL ON FUNCTION public.revelar_cnpj_terceiro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revelar_cnpj_terceiro(uuid) TO authenticated;

-- O cadastro de terceiros entra no ROT como operação de tratamento própria (uma vez por empresa).
CREATE OR REPLACE FUNCTION public.rot_gestao_fornecedores() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  SELECT cnpj INTO c FROM public.empresas WHERE id = NEW.empresa_id;
  IF c IS NULL OR NOT public.enquadramento_vigente(c) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.registro_operacoes WHERE empresa_cnpj = c AND finalidade_especifica LIKE 'Gestão de fornecedores com acesso a dados pessoais%') THEN RETURN NEW; END IF;
  INSERT INTO public.registro_operacoes (empresa_cnpj, setor, genero_verbo, ciclo_vida, categoria_titulares, dados_pessoais, dados_sensiveis, finalidade_especifica, hipotese_tratamento, tempo_retencao, base_prazo, compartilhamento, salvaguardas, infraestrutura, area_setor, insumo, meio_fornecimento)
  VALUES (c, 'Compras', 'Coletar', '{"Coletar":["receber"],"Reter":["armazenar"]}'::jsonb, ARRAY['Fornecedores'], ARRAY['Nome','E-mail','Telefone'], ARRAY['N/A'],
    'Gestão de fornecedores com acesso a dados pessoais (cadastro de terceiros, contratos e transferências)',
    'Art. 7º, V – Execução de contrato ou procedimentos preliminares',
    'Enquanto vigente o contrato com o terceiro', 'LGPD, art. 37 (registro das operações)',
    'Não Compartilhado', ARRAY['Acesso Restrito RBAC'], 'Nuvem Corporativa',
    'Compras › Contratos', 'contrato', 'API/sistema');
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.rot_gestao_fornecedores() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER terceiros_rot_gestao AFTER INSERT ON public.terceiros_empresa FOR EACH ROW EXECUTE FUNCTION public.rot_gestao_fornecedores();