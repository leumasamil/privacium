// Régua do Ciclo Privacium Semestral semestral: jan–jun e jul–dez.
export type FaseCiclo = "dia1" | "normal" | "alerta30" | "urgente7";
const DIA = 86_400_000;

export function cicloSemestral(now: Date) {
  const y = now.getFullYear();
  const s1 = now.getMonth() < 6;
  const inicio = new Date(y, s1 ? 0 : 6, 1);
  const fim = new Date(y, s1 ? 6 : 12, 1); // exclusivo: congelamento ocorre na véspera
  const congelamento = new Date(fim.getTime() - DIA);
  const diasRestantes = Math.ceil((fim.getTime() - now.getTime()) / DIA);
  const diaDoCiclo = Math.floor((now.getTime() - inicio.getTime()) / DIA) + 1;
  const fase: FaseCiclo = diaDoCiclo === 1 ? "dia1" : diasRestantes <= 7 ? "urgente7" : diasRestantes <= 30 ? "alerta30" : "normal";
  return { inicio, fim, congelamento, diasRestantes, diaDoCiclo, fase, rotulo: `${s1 ? "1º" : "2º"} semestre ${y}` };
}

/** Resposta herdada do ciclo anterior (Delta de Riscos): salva antes do início do ciclo vigente. */
export function respostaHerdada(timestamp: string, now: Date) {
  return new Date(timestamp).getTime() < cicloSemestral(now).inicio.getTime();
}

/** Só valem as assinaturas coletadas no ciclo vigente: um novo semestre exige novo PI-01..PI-05. */
export function assinaturasVigentes<T extends { ts: string }>(sigs: Record<string, T>, now: Date): Record<string, T> {
  const ini = cicloSemestral(now).inicio.getTime();
  return Object.fromEntries(Object.entries(sigs).filter(([, s]) => new Date(s.ts).getTime() >= ini));
}
