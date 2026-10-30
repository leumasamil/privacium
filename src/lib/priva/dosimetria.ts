import { restanteANPD } from "./anpd";

/**
 * Simulador de dosimetria DESABILITADO: os percentuais anteriores (20/20/20/15, teto 75%)
 * não correspondiam ao art. 13 da Res. CD/ANPD nº 4/2023. Nenhum percentual é exibido
 * até a revisão do método.
 */
export const SIMULADOR_EM_REVISAO = true as const;
export const AVISO_SIMULADOR = "Simulador em revisão — percentuais em conferência com a Res. CD/ANPD nº 4/2023";
export const FONTE_RES4 = "https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-4-de-24-de-fevereiro-de-2023-466146077";

/** Res. CD/ANPD nº 4/2023, art. 13 — transcrição literal (Diário Oficial da União). */
export const LITERAL_RES4_ART13 = [
  "Art. 13. O valor da multa simples será reduzido, nos percentuais abaixo, caso incidam as seguintes circunstâncias atenuantes:",
  "I - nos casos de cessação da infração:",
  "a) 75% (setenta e cinco por cento), se previamente à instauração de procedimento preparatório pela ANPD;",
  "b) 50% (cinquenta por cento), se após a instauração de procedimento preparatório e até a instauração de processo administrativo sancionador; ou",
  "c) 30% (trinta por cento), se após a instauração de processo administrativo sancionador e até a prolação da decisão de primeira instância no âmbito do processo administrativo sancionador;",
  "II - 20% (vinte por cento), nos casos de implementação de política de boas práticas e de governança ou de adoção reiterada e demonstrada de mecanismos e procedimentos internos capazes de minimizar os danos aos titulares, voltados ao tratamento seguro e adequado de dados, até a prolação da decisão de primeira instância no âmbito do processo administrativo sancionador;",
  "III - nos casos em que o infrator tenha comprovado a implementação de medidas capazes de reverter ou mitigar os efeitos da infração sobre os titulares de dados pessoais afetados:",
  "a) 20% (vinte por cento), previamente à instauração de procedimento preparatório ou processo administrativo sancionador pela ANPD; ou",
  "b) 10% (dez por cento), se após a instauração de procedimento preparatório e até a instauração de processo administrativo sancionador; e",
  "IV - 5% (cinco por cento), nos casos em que se verifique a cooperação ou boa-fé por parte do infrator.",
] as const;

/** Orçamento total do prazo ANPD: 3 dias úteis = 72 horas úteis (Res. CD/ANPD nº 15/2024, art. 6º). */
export const SLA_MS = 3 * 24 * 3600 * 1000;
export function slaRestante(inicio: string | null, agora: number) {
  if (!inicio) return SLA_MS;
  return restanteANPD(inicio, null, agora);
}

/**
 * Rótulo do campo reducao_dosimetria em relatórios e exportações (Parte A.3):
 * NULL significa "não calculado" (simulador em revisão) — nunca exibir "0%".
 */
export function rotuloReducaoDosimetria(reducao: number | null | undefined): string {
  if (reducao === null || reducao === undefined) return "não calculado";
  return `${reducao}%`;
}
