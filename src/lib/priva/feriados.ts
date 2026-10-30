/** Calendário de feriados nacionais usado pelo contador de prazo do Bloco 4 (2026 e 2027). */
export const FONTE_FERIADOS = 'Lei nº 662/1949 (red. Lei nº 10.607/2002) — 1º/1, 21/4, 1º/5, 7/9, 2/11, 15/11 e 25/12; Lei nº 6.802/1980 — 12/10; Lei nº 14.759/2023 — 20/11; Lei nº 9.093/1995 — Sexta-feira da Paixão, data móvel calculada a partir da Páscoa (algoritmo de Meeus/Jones/Butcher). Carnaval e Corpus Christi são ponto facultativo, não feriado nacional, e não estão incluídos.';
export const ANOS_CALENDARIO = [2026, 2027] as const;

const iso = (a: number, m: number, d: number) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function pascoa(ano: number): string {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(ano, mes, dia);
}

export type Feriado = { data: string; nome: string };
export function feriadosDoAno(ano: number): Feriado[] {
  const p = new Date(`${pascoa(ano)}T00:00:00Z`); p.setUTCDate(p.getUTCDate() - 2);
  return [
    { data: iso(ano, 1, 1), nome: 'Confraternização Universal' },
    { data: p.toISOString().slice(0, 10), nome: 'Sexta-feira da Paixão' },
    { data: iso(ano, 4, 21), nome: 'Tiradentes' },
    { data: iso(ano, 5, 1), nome: 'Dia do Trabalho' },
    { data: iso(ano, 9, 7), nome: 'Independência do Brasil' },
    { data: iso(ano, 10, 12), nome: 'Nossa Senhora Aparecida' },
    { data: iso(ano, 11, 2), nome: 'Finados' },
    { data: iso(ano, 11, 15), nome: 'Proclamação da República' },
    { data: iso(ano, 11, 20), nome: 'Dia Nacional de Zumbi e da Consciência Negra' },
    { data: iso(ano, 12, 25), nome: 'Natal' },
  ];
}
export const FERIADOS_NACIONAIS: Feriado[] = ANOS_CALENDARIO.flatMap(feriadosDoAno);
const DATAS = new Set(FERIADOS_NACIONAIS.map(f => f.data));
export const ehFeriado = (t: number) => DATAS.has(new Date(t).toISOString().slice(0, 10));
