import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import type { ReactNode } from "react";
import { Tag } from "@/components/priva/ui";
import { InfoFormula, Sigla } from "@/components/priva/Sigla";
import { FAIXAS_GM, PIS, faixaGM } from "@/lib/priva/glossario";
import { riskZone } from "@/lib/priva/data";
import { isUnlocked } from "@/lib/priva/store";
import { cn } from "@/lib/utils";

type Acao = { to: string; hash?: string; texto: string } | null;

/** Anatomia: nome · valor · definição · (i) fórmula · ação (ou "Nenhuma ação necessária"). */
export function Indicador({ nome, valor, definicao, formula, acao, extra }: {
  nome: ReactNode; valor: string; definicao: string; formula: ReactNode; acao: Acao; extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-md border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-primary">{nome}</p>
        <InfoFormula titulo={typeof nome === "string" ? nome : "indicador"}>{formula}</InfoFormula>
      </div>
      <p className="mt-1 text-3xl font-semibold text-primary">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{definicao}</p>
      {extra && <div className="mt-3">{extra}</div>}
      <div className="mt-auto pt-3 text-xs">
        {acao ? (
          <Link to={acao.to as "/painel"} hash={acao.hash} className="inline-flex items-center gap-1 font-medium text-pendencia hover:underline">
            {acao.texto} <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-concluido"><CheckCircle2 className="h-3 w-3" /> Nenhuma ação necessária</span>
        )}
      </div>
    </div>
  );
}

export function EscalaGM({ gm }: { gm: number }) {
  const f = faixaGM(gm);
  return (
    <div>
      <div className="flex gap-0.5" role="img" aria-label={`Faixa atual: ${f.nome}`}>
        {FAIXAS_GM.map((x, i) => (
          <div key={x.nome} className={cn("h-2 flex-1 rounded-sm", i <= f.indice ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
      <div className="mt-1 grid grid-cols-4 gap-0.5 text-[10px] leading-tight text-muted-foreground">
        {FAIXAS_GM.map((x, i) => {
          const de = i === 0 ? 0 : FAIXAS_GM[i - 1].ate + 1;
          return <span key={x.nome} className={cn(i === f.indice && "font-semibold text-primary")}>{de}–{x.ate}% {x.nome}</span>;
        })}
      </div>
    </div>
  );
}

export function CardGM({ gm }: { gm: number }) {
  const zone = riskZone(gm);
  return (
    <Indicador
      nome="Grau de Maturidade"
      valor={`${gm.toFixed(1).replace(".", ",")}%`}
      definicao="Percentual dos itens do Método BLLOCO já atendidos pela empresa."
      formula={<p>Calculado como (pontos dos itens atendidos ÷ soma dos pesos de todas as perguntas do diagnóstico) × 100. Cada pergunta tem um peso fixo; as críticas para a LGPD pesam mais.</p>}
      extra={<div className="space-y-2"><Tag tone={zone.tone}>{zone.label}</Tag><EscalaGM gm={gm} /></div>}
      acao={gm < 76 ? { to: "/bloco-1", hash: "diagnostico", texto: "Ver o que falta para subir de faixa" } : null}
    />
  );
}

export function CardScore({ score, max }: { score: number; max: number }) {
  return (
    <Indicador
      nome="Score"
      valor={`${score} / ${max}`}
      definicao="Pontos ponderados obtidos sobre o total possível no diagnóstico."
      formula={<p>Soma dos pesos das perguntas respondidas “Sim” no Bloco 1. Cada item vale um peso diferente; o total possível é a soma de todos os pesos.</p>}
      acao={score < max ? { to: "/bloco-1", hash: "diagnostico", texto: "Ver composição do score" } : null}
    />
  );
}

export function CardPIs({ signatures, enterprise }: { signatures: Record<string, unknown>; enterprise: boolean }) {
  const feitos = [1, 2, 3, 4, 5].filter((n) => signatures[`PI-0${n}`]).length;
  const pend = [1, 2, 3, 4, 5].find((n) => !signatures[`PI-0${n}`]);
  return (
    <Indicador
      nome={<><Sigla id="pi">PIs</Sigla> chancelados</>}
      valor={`${feitos} / 5`}
      definicao={`Procedimentos Internos assinados com chancela Gov.br e registrados na trilha.${enterprise ? " Plano Enterprise inclui o PI-06." : ""}`}
      formula={<p>Conta os Procedimentos Internos (PI-01 a PI-05) com assinatura registrada. Cada bloco só libera o seguinte após a chancela do seu PI.</p>}
      extra={
        <ul className="space-y-1 text-xs">
          {[1, 2, 3, 4, 5].map((n) => {
            const ok = !!signatures[`PI-0${n}`];
            const livre = isUnlocked(signatures as Record<string, never>, n);
            return (
              <li key={n} className="flex items-start gap-1.5">
                {ok ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-concluido" /> : <Circle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />}
                <span className="flex-1">{PIS[n].codigo} · {PIS[n].nome}
                  {!ok && (livre
                    ? <> — <Link to={`/bloco-${n}` as "/bloco-1"} hash="saida" className="font-medium text-pendencia hover:underline">Emitir →</Link></>
                    : <span className="text-muted-foreground"> — aguarda o PI anterior</span>)}
                </span>
              </li>
            );
          })}
        </ul>
      }
      acao={pend ? { to: `/bloco-${pend}`, texto: `Emitir o ${PIS[pend].codigo}` } : null}
    />
  );
}

export function CardEventos({ total }: { total: number }) {
  return (
    <Indicador
      nome={<><Sigla id="trilho-core">Trilho Core</Sigla> · Eventos auditados</>}
      valor={String(total)}
      definicao="Registros imutáveis gravados na trilha de auditoria deste CNPJ."
      formula={<p>Cada evento recebe um hash SHA-256 encadeado ao anterior, garantindo que nada possa ser alterado retroativamente.</p>}
      acao={{ to: "/auditoria", texto: "Ver últimos eventos" }}
    />
  );
}

export function CardAcoes({ abertas }: { abertas: number }) {
  return (
    <Indicador
      nome={<>Ações <Sigla id="5w2h">5W2H</Sigla></>}
      valor={`${abertas} ${abertas === 1 ? "ação aberta" : "ações abertas"}`}
      definicao="Planos de ação corretiva com prazo e responsável definidos."
      formula={<p>5W2H: What (o que), Why (por quê), Who (quem), Where (onde), When (quando), How (como), How much (quanto). Conta os cartões do Kanban fora da coluna “concluído”.</p>}
      acao={abertas ? { to: "/kanban", texto: `Ver ${abertas === 1 ? "a ação" : `as ${abertas} ações`}` } : null}
    />
  );
}
