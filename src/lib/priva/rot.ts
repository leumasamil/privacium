import type { Database } from "@/integrations/supabase/types";

export type RotRow = Database["public"]["Tables"]["registro_operacoes"]["Row"];
export type RotInput = Omit<RotRow, "id" | "codigo" | "criado_por" | "criado_em" | "atualizado_em">;

export const TITULARES = ["Colaboradores", "Clientes", "Fornecedores", "Visitantes", "Candidatos", "Menores de Idade"];
export const DADOS = ["Nome", "CPF", "RG", "Telefone", "E-mail", "Endereço", "Dados Bancários", "Imagem"];
export const SENSIVEIS = ["N/A", "Biometria", "Prontuário de Saúde", "Origem Racial", "Filiação Sindical", "Convicção Religiosa", "Dado Genético"];
export const SALVAGUARDAS = ["Criptografia", "BitLocker", "Acesso Restrito RBAC", "Proxy de IA", "MFA", "Anonimização"];
export const INFRA = ["Servidor Local", "Nuvem Corporativa", "Arquivo Físico"] as const;

/** Linha de risco: menores de idade ou qualquer dado sensível diferente de N/A. */
export function isRisky(r: Pick<RotRow, "categoria_titulares" | "dados_sensiveis">) {
  return r.categoria_titulares.includes("Menores de Idade") || r.dados_sensiveis.some((s) => s !== "N/A");
}

const PROIBIDOS = /(base legal|hip[oó]tese legal)/i;

/** Retorna a mensagem de erro de validação, ou null se a linha pode ser salva. */
export function validateRot(r: RotInput): string | null {
  const texto = [r.finalidade_especifica, r.hipotese_tratamento, r.tempo_retencao, r.base_prazo, r.compartilhamento, r.justificativa_mitigacao ?? "",
    ...r.categoria_titulares, ...r.dados_pessoais, ...r.dados_sensiveis, ...r.salvaguardas].join(" ");
  if (PROIBIDOS.test(texto)) return 'Termo proibido: use "Hipótese de Tratamento" (terminologia da LGPD).';
  if (!r.categoria_titulares.length) return "Informe a categoria de titulares.";
  if (!r.dados_pessoais.length) return "Informe ao menos um dado pessoal.";
  if (!r.dados_sensiveis.length) return 'Informe os dados sensíveis ou "N/A".';
  if (!/^Art\. (7º|11)/.test(r.hipotese_tratamento)) return "Selecione a Hipótese de Tratamento (Arts. 7º ou 11).";
  if (r.dados_sensiveis.some((s) => s !== "N/A") && !r.hipotese_tratamento.startsWith("Art. 11")) return "Dados sensíveis exigem hipótese do Art. 11.";
  if (!r.finalidade_especifica.trim() || !r.tempo_retencao.trim() || !r.base_prazo.trim()) return "Preencha finalidade, tempo de retenção e base do prazo.";
  if (isRisky(r) && (r.justificativa_mitigacao ?? "").trim().length < 20) return "Linha de risco: justifique as medidas mitigadoras (mínimo 20 caracteres).";
  return null;
}
