import type { Database } from "@/integrations/supabase/types";
import { cicloDaLinha, validarCiclo } from "./cicloVida";

export type RotRow = Database["public"]["Tables"]["registro_operacoes"]["Row"];
export type RotInput = Omit<RotRow, "id" | "codigo" | "criado_por" | "criado_em" | "atualizado_em">;

export const TITULARES = ["Colaboradores", "Clientes", "Fornecedores", "Visitantes", "Candidatos", "Menores de Idade"];
export const DADOS = ["Nome", "CPF", "RG", "Telefone", "E-mail", "Endereço", "Dados Bancários", "Imagem"];
export const SENSIVEIS = ["N/A", "Biometria", "Prontuário de Saúde", "Origem Racial", "Filiação Sindical", "Convicção Religiosa", "Dado Genético"];
export const SALVAGUARDAS = ["Criptografia", "BitLocker", "Acesso Restrito RBAC", "Proxy de IA", "MFA", "Anonimização"];
export const INFRA = ["Servidor Local", "Nuvem Corporativa", "Arquivo Físico"] as const;

/** Insumo (documento de entrada) — LGPD art. 5º, I / ISO/IEC 27002:2022 — 5.12 (Classificação da informação; referência bibliográfica, item 9.6 do blueprint). */
export const INSUMOS = ["currículo", "nota fiscal", "banco de dados", "contrato", "formulário", "prontuário", "e-mail", "imagem/documento digitalizado"];
/** Meio de fornecimento — LGPD art. 37 (registro das operações). */
export const MEIOS = ["site", "e-mail", "presencial/recepção", "telefone", "API/sistema", "documento físico"];

/** Campo 7A — art. 7º da LGPD (dado pessoal), 10 hipóteses. */
export const HIPOTESES_7A: string[] = [
  "Art. 7º, I – Consentimento do titular",
  "Art. 7º, II – Cumprimento de obrigação legal ou regulatória",
  "Art. 7º, III – Execução de políticas públicas (administração pública)",
  "Art. 7º, IV – Estudos por órgão de pesquisa",
  "Art. 7º, V – Execução de contrato ou procedimentos preliminares",
  "Art. 7º, VI – Exercício regular de direitos em processo",
  "Art. 7º, VII – Proteção da vida ou incolumidade física",
  "Art. 7º, VIII – Tutela da saúde",
  "Art. 7º, IX – Legítimo interesse do controlador ou de terceiro",
  "Art. 7º, X – Proteção do crédito",
];

/** Campo 7B — art. 11 da LGPD (dado pessoal sensível). */
export const HIPOTESES_7B: string[] = [
  "Art. 11, I – Consentimento específico e destacado",
  "Art. 11, II, a – Cumprimento de obrigação legal ou regulatória",
  "Art. 11, II, b – Execução de políticas públicas",
  "Art. 11, II, c – Estudos por órgão de pesquisa",
  "Art. 11, II, d – Exercício regular de direitos",
  "Art. 11, II, e – Proteção da vida ou incolumidade física",
  "Art. 11, II, f – Tutela da saúde",
  "Art. 11, II, g – Garantia de prevenção à fraude e segurança do titular",
];

export function hasSensivel(r: Pick<RotRow, "dados_sensiveis">) {
  return r.dados_sensiveis.some((s) => s !== "N/A");
}

/** Linha de risco: menores de idade ou qualquer dado pessoal sensível diferente de N/A. */
export function isRisky(r: Pick<RotRow, "categoria_titulares" | "dados_sensiveis">) {
  return r.categoria_titulares.includes("Menores de Idade") || hasSensivel(r);
}

/** Regra de estado 7A × 7B: sem dado pessoal sensível o 7B é limpo e desabilitado. Linhas antigas com art. 11 no 7A migram para o 7B. */
export function normalizeHipoteses(r: RotInput): RotInput {
  let { hipotese_tratamento: a, hipotese_sensivel: b } = r;
  if (a.startsWith("Art. 11")) { b = b || a; a = ""; }
  if (!hasSensivel(r)) b = null;
  return { ...r, hipotese_tratamento: a, hipotese_sensivel: b };
}

const PROIBIDOS = /(base legal|hip[oó]tese legal)/i;

/** Retorna a mensagem de erro de validação (bloqueante), ou null se a linha pode ser salva. */
export function validateRot(r: RotInput): string | null {
  const texto = [r.finalidade_especifica, r.hipotese_tratamento, r.hipotese_sensivel ?? "", r.tempo_retencao, r.base_prazo, r.compartilhamento, r.justificativa_mitigacao ?? "",
    ...r.categoria_titulares, ...r.dados_pessoais, ...r.dados_sensiveis, ...r.salvaguardas].join(" ");
  if (PROIBIDOS.test(texto)) return 'Termo proibido: use "Hipótese de Tratamento" (terminologia da LGPD).';
  const erroCiclo = validarCiclo(cicloDaLinha(r));
  if (erroCiclo) return erroCiclo;
  if (!r.categoria_titulares.length) return "Preencha o campo 3 (Categoria de Titulares) para salvar — marque ao menos um grupo de pessoas.";
  if (!r.dados_pessoais.length) return "Preencha o campo 4 (Dados Pessoais) para salvar — marque ao menos um dado pessoal tratado.";
  if (!r.dados_sensiveis.length) return 'Preencha o campo 5 (Dado Pessoal Sensível) para salvar — marque o dado ou "N/A" se não houver.';
  if (!r.finalidade_especifica.trim()) return "Preencha o campo 6 (Finalidade Específica) para salvar — descreva para que o dado pessoal é usado.";
  if (!r.hipotese_tratamento.startsWith("Art. 7º")) return "Selecione o campo 7A (hipótese do art. 7º) para salvar — todo processo com dado pessoal precisa de uma.";
  const b = r.hipotese_sensivel ?? "";
  if (hasSensivel(r) && !b.startsWith("Art. 11")) return "Selecione o campo 7B (hipótese do art. 11) para salvar — obrigatório porque o campo 5 tem dado pessoal sensível.";
  if (!hasSensivel(r) && b) return "Limpe o campo 7B para salvar — ele só se aplica quando o campo 5 tem dado pessoal sensível.";
  if (!r.tempo_retencao.trim()) return "Preencha o campo 8 (Tempo de Retenção) para salvar — informe por quanto tempo o dado pessoal é guardado.";
  if (!r.base_prazo.trim()) return "Preencha o campo 9 (Base do Prazo) para salvar — ele é obrigatório quando o campo 8 está preenchido.";
  if (isRisky(r) && (r.justificativa_mitigacao ?? "").trim().length < 20) return "Escreva a justificativa das medidas mitigadoras (mínimo 20 caracteres) para salvar — obrigatória em processos com menores ou dado pessoal sensível. Responsável: DPO.";
  return null;
}

export type Sugestao = { texto: string; origem: string; patch: Partial<RotInput> };

/**
 * Tabela determinística versionada (v1): finalidade conforme Área › Setor + insumo.
 * Nunca pré-seleciona: toda sugestão exibe "Sugerido — confirme" e exige ação do usuário.
 */
export const VERSAO_SUGESTOES = "v1";
const ORIGEM_FINALIDADE = `tabela determinística ${VERSAO_SUGESTOES} · Área › Setor + insumo`;
const ORIGEM_7A = `tabela determinística ${VERSAO_SUGESTOES} · finalidade/titulares → art. 7º`;
const ORIGEM_7B = `tabela determinística ${VERSAO_SUGESTOES} · dado pessoal sensível → art. 11`;

const SUGESTOES_FINALIDADE_V1: Record<string, { insumo: string; finalidade: string }[]> = {
  "Recursos Humanos": [
    { insumo: "currículo", finalidade: "Seleção e recrutamento de candidatos" },
    { insumo: "contrato", finalidade: "Gestão do contrato de trabalho e obrigações trabalhistas" },
    { insumo: "formulário", finalidade: "Administração de benefícios e folha de pagamento" },
  ],
  "Recepção": [
    { insumo: "formulário", finalidade: "Controle de acesso físico às instalações" },
    { insumo: "imagem/documento digitalizado", finalidade: "Identificação de visitantes para segurança patrimonial" },
  ],
  "Marketing": [
    { insumo: "formulário", finalidade: "Envio de comunicações a titulares que consentiram" },
    { insumo: "site", finalidade: "Gestão de campanhas e relacionamento com clientes" },
  ],
  "Financeiro": [
    { insumo: "nota fiscal", finalidade: "Emissão de documentos fiscais e cumprimento de obrigações tributárias" },
    { insumo: "contrato", finalidade: "Gestão de contas a pagar e a receber" },
  ],
  "Jurídico": [
    { insumo: "contrato", finalidade: "Gestão contratual e exercício regular de direitos em processo" },
    { insumo: "formulário", finalidade: "Governança de privacidade e registro das operações de tratamento" },
  ],
  "Compras": [{ insumo: "contrato", finalidade: "Gestão de fornecedores e cotações" }],
  "Tecnologia da Informação": [{ insumo: "banco de dados", finalidade: "Operação e segurança dos sistemas corporativos" }],
};

/** Sugestões automáticas a partir do que já foi preenchido (o usuário aplica com um clique; nada é pré-selecionado). */
export function sugerir(r: RotInput): Sugestao[] {
  const s: Sugestao[] = [];
  const sens = r.dados_sensiveis;
  const area = (r.area_setor ?? "").split("›")[0]?.trim() ?? "";
  const insumo = r.insumo?.trim().toLowerCase() ?? "";
  if (!r.finalidade_especifica.trim() && area && insumo) {
    const regra = SUGESTOES_FINALIDADE_V1[area]?.find((x) => x.insumo === insumo);
    if (regra) s.push({ texto: `Finalidade: ${regra.finalidade}`, origem: ORIGEM_FINALIDADE, patch: { finalidade_especifica: regra.finalidade } });
  }
  if (!r.hipotese_tratamento) {
    if (r.categoria_titulares.includes("Colaboradores")) s.push({ texto: "Colaboradores: art. 7º, II (obrigações trabalhistas)", origem: ORIGEM_7A, patch: { hipotese_tratamento: HIPOTESES_7A[1]! } });
    else if (r.categoria_titulares.includes("Clientes") || r.categoria_titulares.includes("Fornecedores")) s.push({ texto: "Clientes/fornecedores: art. 7º, V (contrato)", origem: ORIGEM_7A, patch: { hipotese_tratamento: HIPOTESES_7A[4]! } });
    else if ("Compartilhar" in cicloDaLinha(r) && r.categoria_titulares.length) s.push({ texto: "Compartilhamento sem contrato: avalie art. 7º, I (consentimento)", origem: ORIGEM_7A, patch: { hipotese_tratamento: HIPOTESES_7A[0]! } });
  }
  if (hasSensivel(r) && !r.hipotese_sensivel) {
    if (sens.includes("Prontuário de Saúde")) s.push({ texto: "Prontuário de Saúde: art. 11, II, f (tutela da saúde)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[6]! } });
    else if (sens.some((x) => x.startsWith("Biometria"))) s.push({ texto: "Biometria: art. 11, II, g (prevenção à fraude)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[7]! } });
    else if (sens.includes("Filiação Sindical")) s.push({ texto: "Filiação Sindical: art. 11, II, a (obrigação legal)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[1]! } });
    else s.push({ texto: "Sem outra hipótese aplicável: art. 11, I (consentimento específico e destacado)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[0]! } });
  }
  if (!r.tempo_retencao && r.hipotese_tratamento === HIPOTESES_7A[1]! && r.categoria_titulares.includes("Colaboradores"))
    s.push({ texto: "Retenção trabalhista: 5 anos após a rescisão (CF, art. 7º, XXIX)", origem: ORIGEM_7A, patch: { tempo_retencao: "5 anos após a rescisão", base_prazo: "CF, art. 7º, XXIX" } });
  if (!r.tempo_retencao && r.hipotese_tratamento === HIPOTESES_7A[0]!) s.push({ texto: "Consentimento: reter até a revogação (art. 8º, §5º)", origem: ORIGEM_7A, patch: { tempo_retencao: "Até a revogação", base_prazo: "LGPD, art. 8º, §5º" } });
  if (r.categoria_titulares.includes("Menores de Idade") && !(r.justificativa_mitigacao ?? "").includes("art. 14"))
    s.push({ texto: "Menores de idade: registre o consentimento do responsável (art. 14)", origem: ORIGEM_7B, patch: { justificativa_mitigacao: `${r.justificativa_mitigacao ?? ""} Consentimento específico de ao menos um dos pais ou responsável legal (art. 14).`.trim() } });
  if (hasSensivel(r) && !r.salvaguardas.includes("Criptografia")) s.push({ texto: "Dado pessoal sensível: adicionar Criptografia às salvaguardas", origem: ORIGEM_7B, patch: { salvaguardas: [...r.salvaguardas, "Criptografia"] } });
  return s;
}

/** Alerta não bloqueante de coerência dado × hipótese (item 6 do método); fica registrado na trilha ao salvar. */
export const ALERTA_COERENCIA = "Hipótese possivelmente inadequada para o dado pessoal sensível declarado — confirme com fundamento.";

/** Casos mínimos determinísticos: filiação sindical × art. 11, II, d; prontuário em recrutamento; biometria × consentimento sem indicação específica. */
export function alertasCoerencia(r: Pick<RotInput, "dados_sensiveis" | "hipotese_sensivel" | "finalidade_especifica" | "justificativa_mitigacao">): string[] {
  const out: string[] = [];
  const sens = r.dados_sensiveis;
  const h7b = r.hipotese_sensivel ?? "";
  const contexto = `${r.finalidade_especifica} ${r.justificativa_mitigacao ?? ""}`.toLowerCase();
  if (sens.includes("Filiação Sindical") && h7b.startsWith("Art. 11, II, d"))
    out.push(`${ALERTA_COERENCIA} (filiação sindical × exercício regular de direitos — art. 11, II, d)`);
  if (sens.includes("Prontuário de Saúde") && /recrut|seleç|contrata/.test(contexto))
    out.push(`${ALERTA_COERENCIA} (prontuário de saúde em finalidade de recrutamento/contratação)`);
  if (sens.some((x) => x.startsWith("Biometria")) && h7b.startsWith("Art. 11, I") && !/consentimento específico/.test(contexto))
    out.push(`${ALERTA_COERENCIA} (biometria × consentimento, sem indicação de consentimento específico)`);
  return out;
}
