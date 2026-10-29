import type { Database } from "@/integrations/supabase/types";

export type RotRow = Database["public"]["Tables"]["registro_operacoes"]["Row"];
export type RotInput = Omit<RotRow, "id" | "codigo" | "criado_por" | "criado_em" | "atualizado_em">;

export const TITULARES = ["Colaboradores", "Clientes", "Fornecedores", "Visitantes", "Candidatos", "Menores de Idade"];
export const DADOS = ["Nome", "CPF", "RG", "Telefone", "E-mail", "Endereço", "Dados Bancários", "Imagem"];
export const SENSIVEIS = ["N/A", "Biometria", "Prontuário de Saúde", "Origem Racial", "Filiação Sindical", "Convicção Religiosa", "Dado Genético"];
export const SALVAGUARDAS = ["Criptografia", "BitLocker", "Acesso Restrito RBAC", "Proxy de IA", "MFA", "Anonimização"];
export const INFRA = ["Servidor Local", "Nuvem Corporativa", "Arquivo Físico"] as const;

/** Campo 7A — art. 7º da LGPD (dado pessoal), 10 hipóteses. */
export const HIPOTESES_7A = [
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
export const HIPOTESES_7B = [
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
  if (!r.categoria_titulares.length) return "Campo 3: informe a categoria de titulares.";
  if (!r.dados_pessoais.length) return "Campo 4: informe ao menos um dado pessoal.";
  if (!r.dados_sensiveis.length) return 'Campo 5: informe o dado pessoal sensível ou "N/A".';
  if (!r.finalidade_especifica.trim()) return "Campo 6: descreva a finalidade específica.";
  if (!r.hipotese_tratamento.startsWith("Art. 7º")) return "Campo 7A: selecione a hipótese do art. 7º para o dado pessoal.";
  const b = r.hipotese_sensivel ?? "";
  if (hasSensivel(r) && !b.startsWith("Art. 11")) return "Campo 7B: dado pessoal sensível exige hipótese do art. 11.";
  if (!hasSensivel(r) && b) return "Campo 7B só se aplica quando há dado pessoal sensível.";
  if (!r.tempo_retencao.trim() || !r.base_prazo.trim()) return "Campos 8 e 9: preencha o tempo de retenção e a base do prazo.";
  if (isRisky(r) && (r.justificativa_mitigacao ?? "").trim().length < 20) return "Linha de risco: justifique as medidas mitigadoras (mínimo 20 caracteres).";
  return null;
}

export type Sugestao = { texto: string; patch: Partial<RotInput> };

/** Sugestões automáticas a partir do que já foi preenchido (o usuário aplica com um clique). */
export function sugerir(r: RotInput): Sugestao[] {
  const s: Sugestao[] = [];
  const sens = r.dados_sensiveis;
  if (!r.hipotese_tratamento) {
    if (r.categoria_titulares.includes("Colaboradores")) s.push({ texto: "Colaboradores: art. 7º, II (obrigações trabalhistas)", patch: { hipotese_tratamento: HIPOTESES_7A[1] } });
    else if (r.categoria_titulares.includes("Clientes") || r.categoria_titulares.includes("Fornecedores")) s.push({ texto: "Clientes/fornecedores: art. 7º, V (contrato)", patch: { hipotese_tratamento: HIPOTESES_7A[4] } });
    else if (r.genero_verbo === "Compartilhar" && r.categoria_titulares.length) s.push({ texto: "Compartilhamento sem contrato: avalie art. 7º, I (consentimento)", patch: { hipotese_tratamento: HIPOTESES_7A[0] } });
  }
  if (hasSensivel(r) && !r.hipotese_sensivel) {
    if (sens.includes("Prontuário de Saúde")) s.push({ texto: "Prontuário de Saúde: art. 11, II, f (tutela da saúde)", patch: { hipotese_sensivel: HIPOTESES_7B[6] } });
    else if (sens.includes("Biometria")) s.push({ texto: "Biometria: art. 11, II, g (prevenção à fraude)", patch: { hipotese_sensivel: HIPOTESES_7B[7] } });
    else if (sens.includes("Filiação Sindical")) s.push({ texto: "Filiação Sindical: art. 11, II, a (obrigação legal)", patch: { hipotese_sensivel: HIPOTESES_7B[1] } });
    else s.push({ texto: "Sem outra hipótese aplicável: art. 11, I (consentimento específico e destacado)", patch: { hipotese_sensivel: HIPOTESES_7B[0] } });
  }
  if (!r.tempo_retencao && r.hipotese_tratamento === HIPOTESES_7A[1] && r.categoria_titulares.includes("Colaboradores"))
    s.push({ texto: "Retenção trabalhista: 5 anos após a rescisão (CF, art. 7º, XXIX)", patch: { tempo_retencao: "5 anos após a rescisão", base_prazo: "CF, art. 7º, XXIX" } });
  if (!r.tempo_retencao && r.hipotese_tratamento === HIPOTESES_7A[0]) s.push({ texto: "Consentimento: reter até a revogação (art. 8º, §5º)", patch: { tempo_retencao: "Até a revogação", base_prazo: "LGPD, art. 8º, §5º" } });
  if (r.categoria_titulares.includes("Menores de Idade") && !(r.justificativa_mitigacao ?? "").includes("art. 14"))
    s.push({ texto: "Menores de idade: registre o consentimento do responsável (art. 14)", patch: { justificativa_mitigacao: `${r.justificativa_mitigacao ?? ""} Consentimento específico de ao menos um dos pais ou responsável legal (art. 14).`.trim() } });
  if (hasSensivel(r) && !r.salvaguardas.includes("Criptografia")) s.push({ texto: "Dado pessoal sensível: adicionar Criptografia às salvaguardas", patch: { salvaguardas: [...r.salvaguardas, "Criptografia"] } });
  return s;
}
