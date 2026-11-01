/**
 * Cadeia de custódia dos PRT (Produtos do Tratamento) — Bloco 2 e prova do art. 43 no Bloco 4.
 * Nó = linha do ROT (Área › Setor + código). Aresta = compartilhamento de um PRT (data, assinaturas, hash).
 * Funções puras e determinísticas: a mesma entrada produz sempre a mesma trilha.
 */
import { produtosDaLinha, receptorSemEscolha, descreverDestinoPRT, prtSemDestino, rotuloPRT, type DestinoProduto, type OrigemCompartilhamento, type RotRow } from "./rot";
import { continuacaoConforme, lerContinuacao, rotuloContinuacao } from './continuacaoReceptor';

export type AssinaturaRot = { assinante: string; email?: string; etapa: number; em: string; sha256: string };
type Linha = Pick<RotRow, "id" | "codigo" | "area_setor" | "setor" | "produtos_tratamento" | "produto_interno" | "destino_produto" | "prazo_produto" | "fundamento_produto" | "origem_compartilhamento" | "assinatura_etapa1" | "assinatura_etapa2" | "salvaguardas" | "justificativa_mitigacao" | "insumo"> & Partial<Pick<RotRow, "excluido_em" | "excluido_por" | "motivo_exclusao" | "origem" | "removida_do_dossie" | "continuacao_receptor">>;

export type NoCadeia = { id: string; codigo: string; rotulo: string; removido: boolean; excluidoEm?: string | null; excluidoPor?: string | null; motivoExclusao?: string | null };
export type ArestaCadeia = {
  prt: string; indicePRT: number; nomePRT: string;
  de: NoCadeia; para: NoCadeia | null; destino: string; tipoDestino: "INTERNO" | "EXTERNO" | "ELIMINACAO" | null;
  data: string | null; assinaturaOrigem: AssinaturaRot | null; assinaturaDestino: AssinaturaRot | null; hash: string | null;
};
export type StatusPRT = { tipo: "COMPLETA" } | { tipo: "PENDENTE"; no: NoCadeia } | { tipo: "ROMPE"; no: NoCadeia; motivo: string };
export type TrilhaPRT = {
  chave: string; origem: NoCadeia; prt: string; nomePRT: string;
  arestas: ArestaCadeia[]; novoTratamento: string[]; status: StatusPRT;
};

const asAss = (v: unknown): AssinaturaRot | null => (v && typeof v === "object" && "sha256" in v ? (v as AssinaturaRot) : null);
export const rotuloNo = (r: Pick<Linha, "codigo" | "area_setor" | "setor">) => `${r.area_setor ?? r.setor} · ${r.codigo}`;
const no = (r: Linha): NoCadeia => ({ id: r.id, codigo: r.codigo, rotulo: rotuloNo(r), removido: !!r.excluido_em, excluidoEm: r.excluido_em ?? null, excluidoPor: r.excluido_por ?? null, motivoExclusao: r.motivo_exclusao ?? null });

/** Linhas visíveis na planilha mestre: as excluídas logicamente (art. 37) ficam só no grafo e no PI-02.
 *  Linhas removidas do dossiê (origem TESTE/DEMONSTRACAO, via remover_registro_de_teste) não aparecem em lugar nenhum. */
export const linhasAtivas = <T extends { excluido_em?: string | null; removida_do_dossie?: boolean | null }>(rows: T[]) => rows.filter((r) => !r.excluido_em && !r.removida_do_dossie);
export const linhasExcluidas = <T extends { excluido_em?: string | null; removida_do_dossie?: boolean | null }>(rows: T[]) => rows.filter((r) => !!r.excluido_em && !r.removida_do_dossie);

const dataBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
/** Descrição do nó removido: data e motivo da exclusão lógica, ou lacuna anterior à migração 0044. */
export function descreverRemocao(n: NoCadeia): string {
  if (!n.removido) return "";
  if (n.excluidoEm) return `excluída logicamente em ${dataBR(n.excluidoEm)}${n.excluidoPor ? ` por ${n.excluidoPor}` : ""} — motivo: ${n.motivoExclusao ?? "não informado"}`;
  return "excluída antes da migração 0044 — data e motivo não recuperáveis";
}

/** B.1 — "não se aplica" só para destino Externo e Eliminação; destino Interno sem receptor é "ausente". */
export function rotuloEtapa1Receptor(a: Pick<ArestaCadeia, "para" | "assinaturaDestino" | "tipoDestino">): string {
  if (a.assinaturaDestino) return `✓ ${a.assinaturaDestino.assinante}`;
  if (a.para || a.tipoDestino === "INTERNO") return "ausente";
  return "não se aplica";
}

export const NOTA_HASH_ASSINATURA = "O hash exibido é da assinatura da Etapa 2 (ato do DPO), não do conteúdo individual de cada PRT. Produtos distintos compartilham o mesmo hash porque derivam do mesmo ato de assinatura.";
export const rotuloStatus = (s: StatusPRT) => (s.tipo === "COMPLETA" ? "Completa" : s.tipo === "PENDENTE" ? "Aguardando decisão do receptor" : `Rompe em: ${s.no.rotulo}`);

/**
 * B.4 — antes de criar uma linha receptora, procura a já existente para o mesmo PRT,
 * mesma origem e mesmo setor: compartilhar duas vezes vincula, nunca duplica.
 */
export function receptoraExistente<T extends Pick<RotRow, "id" | "codigo" | "area_setor" | "insumo" | "origem_compartilhamento">>(linhas: T[], origemId: string, areaSetorDestino: string, nomePRT: string): T | null {
  const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
  return linhas.find((l) => {
    const o = l.origem_compartilhamento as OrigemCompartilhamento | null;
    return o?.linha_origem_id === origemId && norm(l.area_setor) === norm(areaSetorDestino) && norm(l.insumo) === norm(nomePRT);
  }) ?? null;
}

/** Monta as trilhas de todos os PRT, incluindo linhas receptoras cuja origem foi removida (B.3). */
export function montarCadeia(linhas: Linha[]): TrilhaPRT[] {
  const visiveis = linhas.filter((l) => !l.removida_do_dossie);
  const porId = new Map(visiveis.map((l) => [l.id, l]));
  const trilhas: TrilhaPRT[] = [];
  for (const l of visiveis) {
    const origem = no(l);
    const a2 = asAss(l.assinatura_etapa2);
    produtosDaLinha(l).forEach((p, i) => {
      const d = p.destino as DestinoProduto | null | undefined;
      const receptor = d?.tipo === "INTERNO" && d.linha_receptor_id ? porId.get(d.linha_receptor_id) ?? null : null;
      const a1r = receptor ? asAss(receptor.assinatura_etapa1) : null;
      const aresta: ArestaCadeia = {
        prt: rotuloPRT(i), indicePRT: i, nomePRT: p.nome, de: origem, para: receptor ? no(receptor) : null,
        destino: descreverDestinoPRT(d), tipoDestino: (d?.tipo as ArestaCadeia["tipoDestino"]) ?? null, data: a2?.em ?? null, assinaturaOrigem: a2, assinaturaDestino: a1r, hash: a2?.sha256 ?? null,
      };
      let status: StatusPRT = { tipo: "COMPLETA" };
      if (l.excluido_em) status = { tipo: "ROMPE", no: origem, motivo: descreverRemocao(origem) };
      else if (receptorSemEscolha(l)) status = { tipo: "PENDENTE", no: origem };
      else if (prtSemDestino(l, p)) status = { tipo: "ROMPE", no: origem, motivo: "destino não declarado" };
      else if (!a2) status = { tipo: "ROMPE", no: origem, motivo: "assinatura da Etapa 2 (DPO) ausente" };
      else if (d?.tipo === "INTERNO" && !receptor) status = { tipo: "ROMPE", no: origem, motivo: "linha receptora não registrada no setor de destino" };
      else if (receptor && !a1r) status = { tipo: "ROMPE", no: no(receptor), motivo: "assinatura da Etapa 1 (gestor) ausente no receptor" };
      else if (receptor && receptorSemEscolha(receptor)) status = { tipo: 'PENDENTE', no: no(receptor) };
      const novoTratamento = receptor ? [rotuloContinuacao(lerContinuacao(receptor.continuacao_receptor)), ...produtosDaLinha(receptor).map((x, j) => `${rotuloPRT(j)} ${x.nome}`)] : [];
      trilhas.push({ chave: `${l.id}:${i}`, origem, prt: rotuloPRT(i), nomePRT: p.nome, arestas: [aresta], novoTratamento, status });
    });
    const o = l.origem_compartilhamento as OrigemCompartilhamento | null;
    if (o?.linha_origem_id && !porId.has(o.linha_origem_id)) {
      const removida: NoCadeia = { id: o.linha_origem_id, codigo: o.codigo_origem, rotulo: `${o.area_setor_origem} · ${o.codigo_origem}`, removido: true, excluidoEm: null, excluidoPor: null, motivoExclusao: null };
      trilhas.push({
        chave: `${l.id}:origem`, origem: removida, prt: "PRT", nomePRT: l.insumo ?? "insumo recebido",
        arestas: [{ prt: "PRT", indicePRT: -1, nomePRT: l.insumo ?? "", de: removida, para: no(l), destino: `Interno: ${l.area_setor ?? l.setor}`, tipoDestino: "INTERNO", data: null, assinaturaOrigem: null, assinaturaDestino: asAss(l.assinatura_etapa1), hash: null }],
        novoTratamento: produtosDaLinha(l).map((x, j) => `${rotuloPRT(j)} ${x.nome}`),
        status: { tipo: "ROMPE", no: removida, motivo: `origem ${descreverRemocao(removida)}` },
      });
    }
  }
  const porChave = new Map(trilhas.map(t=>[t.chave,t]));
  const expandir = (t: TrilhaPRT, vistos: Set<string>): TrilhaPRT => {
    if(vistos.has(t.chave)) return {...t,status:{tipo:'ROMPE',no:t.origem,motivo:'ciclo de encaminhamento: revisão necessária'}};
    const caminho=new Set(vistos);caminho.add(t.chave);
    const receptorId=t.arestas[0]?.para?.id;
    const receptor=receptorId ? porId.get(receptorId) : undefined;
    if(!receptor || t.status.tipo!=='COMPLETA') return t;
    const c=lerContinuacao(receptor.continuacao_receptor);
    if(c?.tipo==='ELIMINACAO'||c?.tipo==='USO_EXCLUSIVO') return t;
    const filhos = c?.tipo==='INCORPORACAO' ? [porChave.get(`${c.linha_id}:${c.produto_indice}`)].filter((x): x is TrilhaPRT=>!!x) : trilhas.filter(x=>x.origem.id===receptor.id && !x.chave.endsWith(':origem'));
    if(!filhos.length) return {...t,status:{tipo:'ROMPE',no:no(receptor),motivo:'produto da continuidade não localizado'}};
    const expandidos=filhos.map(f=>expandir(f,caminho));
    const ruptura=expandidos.find(f=>f.status.tipo==='ROMPE');
    const pendente=expandidos.find(f=>f.status.tipo==='PENDENTE');
    return {...t,arestas:[...t.arestas,...expandidos.flatMap(f=>f.arestas)],novoTratamento:[...t.novoTratamento,...expandidos.flatMap(f=>f.novoTratamento)],status:ruptura?.status ?? pendente?.status ?? t.status};
  };
  return trilhas.map(t=>expandir(t,new Set()));
}

/** Trilhas que passam pelo nó (como origem ou receptor). */
export const trilhasDoNo = (trilhas: TrilhaPRT[], noId: string) => trilhas.filter((t) => t.origem.id === noId || t.arestas.some((a) => a.para?.id === noId));

export const AVISO_EXCLUDENTE = "Este relatório atesta apenas a existência de prova documental da cadeia de custódia. Não afirma que a excludente de responsabilidade do art. 43 da LGPD está configurada — essa conclusão depende de análise jurídica do caso concreto.";

/** Inciso do art. 43 que a prova documental pode sustentar (nunca afirma a excludente). */
export function incisoSustentado(trilhas: TrilhaPRT[]): string {
  if (!trilhas.length) return "Nenhum: não há PRT registrado neste nó.";
  const rupturas = trilhas.filter((t) => t.status.tipo === "ROMPE");
  if (rupturas.length) return `Nenhum inciso é sustentado pela trilha documental: há ruptura (${rupturas.map((t) => rotuloStatus(t.status)).join("; ")}).`;
  if (trilhas.some(t => t.status.tipo === "PENDENTE")) return "Nenhum inciso é sustentado: a trilha aguarda decisão do receptor; não está completa nem rompida.";
  return "Inciso II — a trilha documenta registro, destino e assinaturas de cada compartilhamento, servindo de prova documental de que o tratamento atribuído seguiu as obrigações de registro (art. 37).";
}

/** C.3 — relatório "Prova de cadeia de custódia" (texto anexável ao dossiê). */
export function relatorioProvaCadeia(args: { noSelecionado: Linha; trilhas: TrilhaPRT[]; linhas: Linha[]; incidenteId: string; art43Literal: string; art43Url: string; geradoEm: string; selecao?: { ts: string; hash: string; simulado?: boolean } | null }): string {
  const { noSelecionado, trilhas, linhas, incidenteId, art43Literal, art43Url, geradoEm, selecao } = args;
  const porId = new Map(linhas.map((l) => [l.id, l]));
  const out: string[] = [];
  out.push("PROVA DE CADEIA DE CUSTÓDIA", `Incidente: ${incidenteId}`, `Nó do incidente: ${rotuloNo(noSelecionado)}`, `Gerado em: ${geradoEm}`, ...(selecao ? [`Seleção do nó registrada na trilha: ${selecao.ts} · SHA-256 ${selecao.hash}${selecao.simulado ? " (simulação)" : ""}`] : []), `Nota: ${NOTA_HASH_ASSINATURA}`, "");
  for (const t of trilhas) {
    out.push(`PRT: ${t.prt} — ${t.nomePRT} (origem ${t.origem.rotulo}${t.origem.removido ? ` — REMOVIDA: ${descreverRemocao(t.origem)}` : ""})`);
    for (const a of t.arestas) {
      out.push(`  ${a.de.rotulo} → ${a.para?.rotulo ?? a.destino}`);
      if (a.para?.removido) out.push(`    Receptor REMOVIDO: ${descreverRemocao(a.para)}`);
      out.push(`    Data: ${a.data ?? "não registrada"}`);
      out.push(`    Assinatura origem (Etapa 2): ${a.assinaturaOrigem ? `${a.assinaturaOrigem.assinante} · SHA-256 ${a.assinaturaOrigem.sha256}` : "ausente"}`);
      out.push(`    Assinatura destino (Etapa 1): ${a.assinaturaDestino ? `${a.assinaturaDestino.assinante} · SHA-256 ${a.assinaturaDestino.sha256}` : rotuloEtapa1Receptor(a)}`);
    }
    if (t.novoTratamento.length) out.push(`  Novo tratamento no receptor: ${t.novoTratamento.join("; ")}`);
    out.push(`  Status: ${rotuloStatus(t.status)}${t.status.tipo === "ROMPE" ? ` (${t.status.motivo})` : ""}`, "");
  }
  out.push("MEDIDAS POR NÓ");
  const nos = new Set<string>([noSelecionado.id, ...trilhas.flatMap((t) => [t.origem.id, ...t.arestas.map((a) => a.para?.id ?? "")])]);
  for (const id of nos) {
    const l = porId.get(id);
    if (!l) continue;
    out.push(`  ${rotuloNo(l)}: ${(l.salvaguardas ?? []).join(", ") || "nenhuma salvaguarda registrada"}${l.justificativa_mitigacao ? ` — ${l.justificativa_mitigacao}` : ""}`);
  }
  out.push("", "LGPD art. 43 (texto integral)", art43Literal, `Fonte: ${art43Url}`, "", `Inciso que a prova documental sustenta: ${incisoSustentado(trilhas)}`, "", AVISO_EXCLUDENTE);
  return out.join("\n");
}
