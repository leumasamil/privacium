import { useEffect, useState } from "react";
import { AppLink as Link } from "@/components/priva/AppLink";
import { AlertTriangle, ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Ajuda5W2H } from "@/lib/priva/ajuda";
import { montarChecklist, ordenar, type Pendencia } from "@/lib/priva/pendencias";
import { usePriva } from "@/lib/priva/store";
import { cn } from "@/lib/utils";
import { ESTADO, EstadoBadge } from "./estado";
import { LinkPendencia } from './LinkPendencia';
import { useDadosBloco } from "./TelaBloqueio";

const ROTULO: Record<string, string> = { DPO_OPERACIONAL: "DPO_OPERACIONAL", C_SUITE: "C_SUITE", ADMIN_SISTEMA: "ADMIN_SISTEMA" };

/** Ajuda operacional 5W2H + "Como resolver" com pendências reais do CNPJ ativo. */
export function AjudaTarefa(props: Ajuda5W2H & { pendencias?: Pendencia[] }) {
  const { bloco, titulo, passos, errosComuns } = props;
  const { userId, cnpj, demo, signatures, roles, log } = usePriva();
  const chave = `privacium:ajuda:${userId ?? "anon"}:${cnpj ?? "-"}:${bloco}`;
  const [aberto, setAberto] = useState("");
  useEffect(() => { setAberto(localStorage.getItem(chave) === "1" ? "ajuda" : ""); }, [chave]);
  const mudar = (v: string) => { setAberto(v); if (!demo) localStorage.setItem(chave, v ? "1" : "0"); };

  const consulta = bloco >= 1 && bloco <= 4 && !props.pendencias && !demo;
  const { data } = useDadosBloco(consulta ? bloco : 0, consulta ? cnpj : null);
  const itens = ordenar(props.pendencias ?? (data && data.n === bloco ? montarChecklist(data, signatures) : []));
  const abertos = itens.filter((i) => i.estado !== "ok");
  const concluidos = itens.filter((i) => i.estado === "ok");
  // Passo atual = primeiro passo do roteiro ainda não coberto (aproximação pela proporção de itens concluídos).
  const passoAtual = itens.length && abertos.length ? Math.min(passos.length - 1, Math.floor((concluidos.length / itens.length) * passos.length)) : -1;
  const pode = (i: Pendencia) => roles.includes(i.responsavel) || (roles.includes("ADMIN_SISTEMA") && i.responsavel !== "C_SUITE");

  const rotulo = bloco === 0 ? "Kanban 5W2H" : `Bloco ${bloco}`;
  const ancora = bloco === 0 ? "kanban-guia" : `bloco-${bloco}-guia`;
  const proxima = bloco >= 1 && bloco <= 4 ? (`/bloco-${bloco + 1}` as "/bloco-2") : ("/painel" as const);
  const linhas: [string, string][] = [
    ["O quê", props.oQue], ["Por quê", props.porQue], ["Quem", props.quem], ["Onde", props.onde],
    ["Quando", props.quando], ["Como", props.como], ["Quanto", props.quanto],
  ];
  const h4 = "mb-2 font-mono text-[10px] uppercase tracking-widest";

  return (
    <Accordion type="single" collapsible value={aberto} onValueChange={mudar} className="rounded-sm border border-l-[3px] border-l-ajuda-border bg-card">
      <AccordionItem value="ajuda" className="border-0">
        <AccordionTrigger className="px-3 py-2 text-xs font-medium text-ajuda hover:no-underline focus-visible:ring-2 focus-visible:ring-ajuda-border">
          <span className="flex flex-wrap items-center gap-2">
            <HelpCircle className="h-4 w-4 text-ajuda" aria-hidden />
            Como executar esta tarefa
            <span className="font-normal text-muted-foreground">· {rotulo} — {titulo}</span>
            {abertos.length > 0 && <span className="rounded-sm border border-pendencia-border bg-pendencia-bg px-1.5 text-[10px] font-semibold text-pendencia">{abertos.length} pendência{abertos.length > 1 ? "s" : ""}</span>}
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-5 px-3 pb-4 text-xs">
          <table className="w-full border-collapse">
            <caption className="sr-only">Quadro 5W2H — {titulo}</caption>
            <tbody>
              {linhas.map(([k, v]) => (
                <tr key={k} className="border-b align-top last:border-0">
                  <th scope="row" className="w-24 py-1.5 pr-3 text-left font-mono text-[10px] uppercase tracking-widest text-ajuda">{k}</th>
                  <td className="py-1.5 text-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section>
            <h4 className={cn(h4, "text-ajuda")}>Passo a passo</h4>
            <ol className="space-y-2">
              {passos.map((p, i) => {
                const atual = i === passoAtual;
                return (
                  <li key={p.titulo} className={cn("flex gap-3 rounded-sm p-2", atual && "border border-l-4 border-andamento-border border-l-andamento-border")}>
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]", atual ? "border-andamento-border text-andamento" : "border-border text-muted-foreground")}>{i + 1}</span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-primary">{p.titulo}{atual && <span className="ml-2 rounded-sm bg-andamento-bg px-1 text-[10px] font-semibold text-andamento">Passo atual</span>}</p>
                      <p><span className="font-medium">→ Ação:</span> {p.acao}</p>
                      <p><span className="font-medium">→ Resultado esperado:</span> {p.resultado}</p>
                      <p className="text-muted-foreground"><span className="font-medium">→ Se não acontecer:</span> {p.seNao}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-live="polite">
            <h4 className={cn(h4, "text-primary")}>Como resolver esta pendência</h4>
            {demo ? (
              <p className="text-muted-foreground">Modo demonstração: as pendências reais do CNPJ não são lidas.</p>
            ) : !cnpj ? (
              <p className="text-muted-foreground">Selecione um CNPJ no menu lateral para ver as pendências.</p>
            ) : abertos.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-l-4 border-l-concluido-border p-3">
                <p className="flex items-center gap-2 text-concluido"><CheckCircle2 className="h-4 w-4" aria-hidden /> Nenhuma pendência nesta tarefa. Você pode seguir para a próxima etapa.</p>
                <Link to={proxima} className="inline-flex items-center gap-1 rounded-sm bg-concluido px-3 py-1.5 font-semibold text-primary-foreground">Avançar <ArrowRight className="h-3 w-3" /></Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {abertos.map((i) => {
                  const e = ESTADO[i.estado];
                  const selar = /^(Selar|Assinar)/.test(i.acao);
                  return (
                    <li key={i.id} className={cn("space-y-1 rounded-sm border border-l-4 p-3", e.borda)}>
                      <div className="flex flex-wrap items-center gap-2">{e.icone("h-4 w-4")}<span className="font-semibold text-primary">{i.titulo}</span><EstadoBadge estado={i.estado} /></div>
                      <p className={cn(i.estado === "critico" ? e.texto : "text-muted-foreground")}>{i.exige}</p>
                      {i.estado === "bloqueado" ? null : pode(i) ? (
                        <>
                          <p><span className="font-medium">Sugestão:</span> {i.sugestao ?? `${i.acao}.`}</p>
                          <LinkPendencia item={i} className={cn("inline-flex items-center gap-1 rounded-sm px-3 py-1.5 font-semibold", selar ? "bg-concluido text-primary-foreground" : "bg-pendencia text-primary-foreground")}>{i.acao} <ArrowRight className="h-3 w-3" /></LinkPendencia>
                        </>
                      ) : (
                        <p className="text-bloqueado">Aguardando {ROTULO[i.responsavel]} —{" "}
                          <button className="font-semibold underline underline-offset-2" onClick={() => {
                            log("INSERT", "solicitacao_assinatura", `Solicitada ação de ${i.responsavel}: ${i.titulo}`);
                            toast.success(`Solicitação registrada na trilha. Avise ${ROTULO[i.responsavel]}.`);
                          }}>{i.id.startsWith("sig") ? "Solicitar assinatura" : `Solicitar a ${ROTULO[i.responsavel]}`}</button>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {!demo && concluidos.length > 0 && (
              <details className="mt-2 rounded-sm border border-concluido-border/40 p-2">
                <summary className="cursor-pointer font-semibold text-concluido">Já concluído ({concluidos.length})</summary>
                <ul className="mt-1 space-y-0.5 text-muted-foreground">{concluidos.map((i) => <li key={i.id} className="flex items-center gap-1">{ESTADO.ok.icone("h-3 w-3")} {i.titulo} — {i.exige}</li>)}</ul>
              </details>
            )}
          </section>

          <section className="border-l-4 border-atencao-border p-2">
            <h4 className={cn(h4, "flex items-center gap-1 text-atencao")}><AlertTriangle className="h-3 w-3" aria-hidden /> Erros comuns</h4>
            <ul className="list-disc space-y-0.5 pl-5">{errosComuns.map((e) => <li key={e}>{e}</li>)}</ul>
          </section>

          <Link to="/manual" search={{ aba: "guias" }} hash={ancora} className="inline-block font-medium text-ajuda underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2">
            Ver no Manual →
          </Link>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
