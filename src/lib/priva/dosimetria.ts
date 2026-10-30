/** Atenuantes cumulativas (Res. CD/ANPD nº 4/2023) vinculadas aos PIs do Método BLLOCO. */
export const DOSIMETRIA = [
  { id: "governanca", pis: ["PI-01", "PI-02"], rule: "Política de Privacidade e ROTI estruturado comprovados", pct: 20 },
  { id: "seguranca", pis: ["PI-03"], rule: "Medidas técnicas de segurança e Escudo de IA implementados", pct: 20 },
  { id: "mitigacao", pis: ["PI-04"], rule: "Mecanismos internos de mitigação, logs forenses e célula de resposta ativa", pct: 20 },
  { id: "ripd", pis: ["PI-05"], rule: "RIPD elaborado tempestivamente, antes da conclusão do processo fiscalizatório", pct: 15 },
] as const;

export const TETO_REDUCAO = 75;

export function fatorAtivo(pis: readonly string[], chancelados: Record<string, unknown>) {
  return pis.every((p) => !!chancelados[p]);
}

/** Soma cumulativa dos fatores cujos PIs estão todos chancelados, limitada a 75%. */
export function reducaoDosimetria(chancelados: Record<string, unknown>): number {
  const soma = DOSIMETRIA.reduce((a, d) => a + (fatorAtivo(d.pis, chancelados) ? d.pct : 0), 0);
  return Math.min(TETO_REDUCAO, soma);
}

export function multaComAtenuantes(base: number, reducao: number) {
  return Math.round(base * (1 - reducao / 100));
}

/** Orçamento total do prazo ANPD: 3 dias úteis = 72 horas úteis (Res. CD/ANPD nº 15/2024, art. 6º). */
export const SLA_MS = 3 * 24 * 3600 * 1000;
export function slaRestante(inicio: string | null, agora: number) {
  if (!inicio) return SLA_MS;
  return restanteANPD(inicio, null, agora);
}
