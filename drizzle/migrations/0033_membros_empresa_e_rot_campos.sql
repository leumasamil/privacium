-- Cadastro de membros (matriz RAC e Comitê de Governança), segregado por empresa.
-- Justificativa: CPF/CNPJ de membros é dado pessoal e não pode residir em estrutura genérica de progresso (LGPD arts. 6º, VII e VIII, 37 e 46).
CREATE TABLE public.membros_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  documento text NOT NULL,
  tipo_documento text NOT NULL CHECK (tipo_documento IN ('CPF','CNPJ')),
  email text NOT NULL,
  area_setor text,
  papel_rac text CHECK (papel_rac IN ('R','A','C')),
  membro_comite boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX membros_empresa_empresa_idx ON public.membros_empresa(empresa_id);
-- O documento (CPF/CNPJ) NÃO é legível por SELECT direto: a coluna fica fora do GRANT e só é
-- devolvida pela RPC revelar_documento_membro, que audita cada leitura na trilha forense.
GRANT SELECT (id, empresa_id, nome, tipo_documento, email, area_setor, papel_rac, membro_comite, ativo, criado_em, atualizado_em) ON public.membros_empresa TO authenticated;
GRANT INSERT (empresa_id, nome, documento, tipo_documento, email, area_setor, papel_rac, membro_comite) ON public.membros_empresa TO authenticated;
GRANT UPDATE (nome, email, area_setor, papel_rac, membro_comite, ativo) ON public.membros_empresa TO authenticated;
GRANT ALL ON public.membros_empresa TO service_role;
ALTER TABLE public.membros_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY membros_leitura ON public.membros_empresa FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY membros_escrita ON public.membros_empresa FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'DPO_OPERACIONAL') OR public.has_role(auth.uid(),'ADMIN_SISTEMA'));
CREATE POLICY membros_atualizacao ON public.membros_empresa FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'DPO_OPERACIONAL') OR public.has_role(auth.uid(),'ADMIN_SISTEMA')) WITH CHECK (public.has_role(auth.uid(),'DPO_OPERACIONAL') OR public.has_role(auth.uid(),'ADMIN_SISTEMA'));
CREATE POLICY membros_isolamento ON public.membros_empresa AS RESTRICTIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR empresa_id = public.minha_empresa_id()) WITH CHECK (public.has_role(auth.uid(),'ADMIN_SISTEMA') OR empresa_id = public.minha_empresa_id());
CREATE POLICY membros_empresa_ativa ON public.membros_empresa AS RESTRICTIVE FOR ALL TO authenticated USING (public.cnpj_liberado((SELECT e.cnpj FROM public.empresas e WHERE e.id = empresa_id))) WITH CHECK (public.cnpj_liberado((SELECT e.cnpj FROM public.empresas e WHERE e.id = empresa_id)));
-- Sem GRANT de DELETE para authenticated: a exclusão é sempre lógica (ativo = false), preservando a trilha.

CREATE OR REPLACE FUNCTION public.membros_empresa_toque() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em := now(); RETURN NEW; END $$;
CREATE TRIGGER membros_empresa_toque BEFORE UPDATE ON public.membros_empresa FOR EACH ROW EXECUTE FUNCTION public.membros_empresa_toque();

-- Revelação auditada do documento: DPO, ADMIN, membro do Comitê da mesma empresa ou o próprio membro.
CREATE OR REPLACE FUNCTION public.revelar_documento_membro(_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  m public.membros_empresa%ROWTYPE;
  r public.app_role;
  em text;
  c text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'autenticação necessária'; END IF;
  SELECT * INTO m FROM public.membros_empresa WHERE id = _id AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Membro não encontrado'; END IF;
  SELECT email INTO em FROM public.profiles WHERE id = auth.uid();
  SELECT role INTO r FROM public.user_roles WHERE user_id = auth.uid()
    ORDER BY CASE role WHEN 'ADMIN_SISTEMA' THEN 0 WHEN 'DPO_OPERACIONAL' THEN 1 ELSE 2 END LIMIT 1;
  IF r IS NULL THEN RAISE EXCEPTION 'Cargo não concedido'; END IF;
  IF NOT (
    public.has_role(auth.uid(),'ADMIN_SISTEMA')
    OR public.has_role(auth.uid(),'DPO_OPERACIONAL')
    OR (m.empresa_id = public.minha_empresa_id() AND (
      lower(m.email) = lower(coalesce(em,''))
      OR EXISTS (SELECT 1 FROM public.membros_empresa x WHERE x.empresa_id = m.empresa_id AND x.membro_comite AND x.ativo AND lower(x.email) = lower(coalesce(em,'')))
    ))
  ) THEN RAISE EXCEPTION 'Leitura do documento restrita ao DPO, ao Comitê de Governança e ao próprio membro'; END IF;
  SELECT cnpj INTO c FROM public.empresas WHERE id = m.empresa_id;
  PERFORM public.registrar_acesso(r, 'SELECT', 'membros_empresa', 'Revelação de documento do membro ' || m.nome, coalesce(c,''), 'documento');
  RETURN m.documento;
END $$;
REVOKE ALL ON FUNCTION public.revelar_documento_membro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revelar_documento_membro(uuid) TO authenticated;

-- Novos campos do ROT: hierarquia Área › Setor, insumo e meio de fornecimento (aditivos, nulos permitidos).
ALTER TABLE public.registro_operacoes ADD COLUMN area_setor text;
ALTER TABLE public.registro_operacoes ADD COLUMN insumo text;
ALTER TABLE public.registro_operacoes ADD COLUMN meio_fornecimento text;
COMMENT ON COLUMN public.registro_operacoes.area_setor IS 'Hierarquia "Área › Setor" (ex.: Recursos Humanos › Seleção e Recrutamento). A coluna setor segue gerando o ID do processo.';

-- O cadastro de membros entra no ROT como operação de tratamento própria (uma vez por empresa,
-- somente com enquadramento vigente, pois o gatilho do ROT o exige).
CREATE OR REPLACE FUNCTION public.rot_governanca_membros() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  SELECT cnpj INTO c FROM public.empresas WHERE id = NEW.empresa_id;
  IF c IS NULL OR NOT public.enquadramento_vigente(c) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.registro_operacoes WHERE empresa_cnpj = c AND finalidade_especifica LIKE 'Governança de privacidade: cadastro de membros%') THEN RETURN NEW; END IF;
  INSERT INTO public.registro_operacoes (empresa_cnpj, setor, genero_verbo, ciclo_vida, categoria_titulares, dados_pessoais, dados_sensiveis, finalidade_especifica, hipotese_tratamento, tempo_retencao, base_prazo, compartilhamento, salvaguardas, infraestrutura, area_setor, insumo, meio_fornecimento)
  VALUES (c, 'Jurídico', 'Coletar', '{"Coletar":["receber"],"Reter":["armazenar"]}'::jsonb, ARRAY['Colaboradores'], ARRAY['Nome','CPF','E-mail'], ARRAY['N/A'],
    'Governança de privacidade: cadastro de membros, matriz RAC e Comitê de Governança',
    'Art. 7º, II – Cumprimento de obrigação legal ou regulatória',
    'Enquanto durar o programa de privacidade', 'LGPD, art. 37 (registro das operações)',
    'Não Compartilhado', ARRAY['Acesso Restrito RBAC'], 'Nuvem Corporativa',
    'Jurídico › Governança de Privacidade', 'formulário', 'API/sistema');
  RETURN NEW;
END $$;
CREATE TRIGGER membros_rot_governanca AFTER INSERT ON public.membros_empresa FOR EACH ROW EXECUTE FUNCTION public.rot_governanca_membros();

-- A varredura de termos proibidos do ROT passa a cobrir os novos campos.
CREATE OR REPLACE FUNCTION public.validar_registro_operacao() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE abbr text; n int; tudo text;
BEGIN
  IF NOT (NEW.hipotese_tratamento LIKE 'Art. 7º%' OR NEW.hipotese_tratamento LIKE 'Art. 11%') THEN
    RAISE EXCEPTION 'Hipótese de Tratamento deve ser um inciso dos Arts. 7º ou 11 da LGPD';
  END IF;
  tudo := lower(concat_ws(' ', NEW.finalidade_especifica, NEW.hipotese_tratamento, NEW.tempo_retencao, NEW.base_prazo, NEW.compartilhamento, NEW.justificativa_mitigacao,
    NEW.area_setor, NEW.insumo, NEW.meio_fornecimento,
    array_to_string(NEW.categoria_titulares,' '), array_to_string(NEW.dados_pessoais,' '), array_to_string(NEW.dados_sensiveis,' '), array_to_string(NEW.salvaguardas,' ')));
  IF tudo ~ '(base legal|hip[oó]tese legal)' THEN
    RAISE EXCEPTION 'Termo proibido: use "Hipótese de Tratamento" (terminologia da LGPD)';
  END IF;
  IF ('Menores de Idade' = ANY(NEW.categoria_titulares) OR EXISTS (SELECT 1 FROM unnest(NEW.dados_sensiveis) s WHERE s <> 'N/A'))
     AND length(trim(coalesce(NEW.justificativa_mitigacao,''))) < 20 THEN
    RAISE EXCEPTION 'Linha de risco exige justificativa das medidas mitigadoras (mínimo 20 caracteres)';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.criado_por := auth.uid();
    abbr := CASE NEW.setor WHEN 'RH' THEN 'RH' WHEN 'TI' THEN 'TI' WHEN 'Marketing' THEN 'MKT' WHEN 'Compras' THEN 'COM' WHEN 'Recepção' THEN 'REC' WHEN 'Jurídico' THEN 'JUR' ELSE 'FIN' END;
    PERFORM pg_advisory_xact_lock(hashtext(NEW.empresa_cnpj || NEW.setor));
    SELECT count(*) + 1 INTO n FROM public.registro_operacoes WHERE empresa_cnpj = NEW.empresa_cnpj AND setor = NEW.setor;
    NEW.codigo := 'PRIVA-' || abbr || '-' || lpad(n::text, 3, '0');
    WHILE EXISTS (SELECT 1 FROM public.registro_operacoes WHERE empresa_cnpj = NEW.empresa_cnpj AND codigo = NEW.codigo) LOOP
      n := n + 1; NEW.codigo := 'PRIVA-' || abbr || '-' || lpad(n::text, 3, '0');
    END LOOP;
  ELSE
    NEW.codigo := OLD.codigo; NEW.setor := OLD.setor; NEW.empresa_cnpj := OLD.empresa_cnpj; NEW.criado_por := OLD.criado_por;
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.validar_registro_operacao() FROM PUBLIC, anon, authenticated;