import type { Signature } from "./store";
import type { Pendencia } from "./pendencias";

/** Fonte única do "Próximo passo": todas as telas consomem esta função. */
export type Passo = {
  tipo: "acao" | "concluido" | "aguardando" | "travado";
  /** Bloco onde a ação se resolve. */
  bloco: number;
  frase: string;
  botao: string;
  link: { to: string; hash?: string };
  pendentes: number;
  pendencia?: Pendencia;
};

/** Bloco corrente do CNPJ: o primeiro cujo PI ainda não foi chancelado (6 = ciclo completo). */
export function blocoCorrente(sigs: Record<string, Signature>): number {
  for (let n = 1; n <= 5; n++) if (!sigs[`PI-0${n}`]) return n;
  return 6;
}

/**
 * Prioridade: 1) vencida/risco de SLA; 2) atenção; 3) em andamento; 4) não iniciada da etapa;
 * 5) assinatura pendente. Empate mantém a ordem da etapa.
 */
export function rank(p: Pendencia): number {
  if (p.estado === "critico") return 0;
  if (p.estado === "atencao") return 1;
  if (p.id.startsWith("sig")) return 5;
  if (p.estado === "andamento") return 3;
  return 4;
}

const podeFazer = (p: Pendencia, roles: string[]) =>
  roles.includes(p.responsavel) || (roles.includes("ADMIN_SISTEMA") && p.responsavel !== "C_SUITE");

export function calcularProximoPasso(a: { blocoTela: number; blocoBase: number; itens: Pendencia[]; roles: string[] }): Passo {
  const { blocoTela, blocoBase, itens, roles } = a;
  const abertos = itens
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.estado !== "ok" && p.estado !== "bloqueado")
    .sort((x, y) => rank(x.p) - rank(y.p) || x.i - y.i)
    .map(({ p }) => p);
  const travado = blocoTela !== blocoBase;
  if (!abertos.length) {
    const prox = Math.min(blocoBase + 1, 5);
    return blocoBase >= 5
      ? { tipo: "concluido", bloco: 5, frase: "Etapa concluída. O Ciclo Privacium Semestral deste CNPJ está completo.", botao: "Ver painel", link: { to: "/painel" }, pendentes: 0 }
      : { tipo: "concluido", bloco: prox, frase: "Etapa concluída.", botao: `Avançar para o Bloco ${prox}`, link: { to: `/bloco-${prox}` }, pendentes: 0 };
  }
  const meu = abertos.find((p) => podeFazer(p, roles));
  const alvo = meu ?? abertos[0];
  if (!alvo) throw new Error('Nenhuma pendência disponível');
  const link = alvo.incidenteId && alvo.ancora === 'anpd' ? { to: `/bloco-4/anpd/${alvo.incidenteId}` } : { to: alvo.bloco === 0 ? "/kanban" : `/bloco-${alvo.bloco}`, hash: alvo.ancora };
  if (!meu) {
    return { tipo: "aguardando", bloco: alvo.bloco, frase: `Aguardando ${alvo.responsavel} — ${alvo.titulo}.`, botao: "Solicitar assinatura", link, pendentes: abertos.length, pendencia: alvo };
  }
  const prefixo = travado ? `Para liberar o Bloco ${blocoTela}, conclua no Bloco ${blocoBase}: ` : "";
  return { tipo: travado ? "travado" : "acao", bloco: alvo.bloco, frase: `${prefixo}${alvo.acao}. ${alvo.exige}`, botao: alvo.acao, link, pendentes: abertos.length, pendencia: alvo };
}
