/** Atenuantes do art. 13 da Res. CD/ANPD nº 4/2023 correlacionadas aos PIs do Método BLLOCO. */
export const DOSIMETRIA = [
  { pi: "PI-01", rule: "Art. 13 – Comprovação de política de boas práticas e governança (diagnóstico)", pct: 20 },
  { pi: "PI-02", rule: "Art. 13 – Registro das Operações de Tratamento (Art. 37 LGPD) como mecanismo interno", pct: 15 },
  { pi: "PI-03", rule: "Art. 13 – Adoção de medidas técnicas de segurança (Art. 46 LGPD)", pct: 20 },
  { pi: "PI-04", rule: "Art. 13 – Cessação, contenção e medidas para reverter ou mitigar o dano", pct: 20 },
] as const;

export const TETO_REDUCAO = 75;

/** Soma cumulativa das atenuantes dos PIs chancelados, limitada a 75%. */
export function reducaoDosimetria(chancelados: Record<string, unknown>): number {
  const soma = DOSIMETRIA.reduce((a, d) => a + (chancelados[d.pi] ? d.pct : 0), 0);
  return Math.min(TETO_REDUCAO, soma);
}

export function multaComAtenuantes(base: number, reducao: number) {
  return Math.round(base * (1 - reducao / 100));
}

export const SLA_MS = 72 * 3600 * 1000;
export function slaRestante(inicio: string | null, agora: number) {
  if (!inicio) return SLA_MS;
  return Math.max(0, SLA_MS - (agora - new Date(inicio).getTime()));
}
