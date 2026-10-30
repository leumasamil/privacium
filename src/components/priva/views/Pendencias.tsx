import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AppLink } from "@/components/priva/AppLink";
import { PageHeader, Panel, Tag } from "@/components/priva/ui";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { useCnpjRows } from "@/lib/priva/useCnpjRows";
import { useQuestions, useRespostas } from "@/lib/priva/questions";
import { DEMO_ATIVOS, DEMO_ROT } from "@/lib/priva/demo";
import { montarChecklist, ordenar, pendenciasBloco5, pendenciasKanban, type Pendencia, type Estado } from "@/lib/priva/pendencias";
import { sugestaoMitigacao, type RiscoId } from "@/lib/privacium/bibliotecaMitigacao";

type Rot = Database["public"]["Tables"]["registro_operacoes"]["Row"];
type Ativo = Database["public"]["Tables"]["ativos_seguranca"]["Row"];

const TOM: Record<Estado, "destructive" | "warning" | "success" | "muted"> = {
  critico: "destructive", atencao: "warning", andamento: "warning", pendente: "muted", bloqueado: "muted", ok: "success",
};
const ROTULO: Record<Estado, string> = {
  critico: "Vencida", atencao: "Atenção", andamento: "Em andamento", pendente: "Não iniciada", bloqueado: "Aguardando etapas", ok: "Concluída",
};
const BLOCO_NOME: Record<number, string> = { 0: "Kanban 5W2H", 1: "Bloco 1 · Diagnóstico", 2: "Bloco 2 · ROT", 3: "Bloco 3 · Salvaguardas", 4: "Bloco 4 · Resposta", 5: "Bloco 5 · Auditoria" };

/** Severidade: pendência vencida ou que trava o ciclo é bloqueante. */
const bloqueante = (p: Pendencia) => p.estado === "critico" || p.estado === "bloqueado";

type RotaBloco = "/kanban" | "/bloco-1" | "/bloco-2" | "/bloco-3" | "/bloco-4" | "/bloco-5";
function destino(p: Pendencia): { to: RotaBloco; hash?: string } {
  if (p.bloco === 0) return { to: "/kanban", hash: p.ancora };
  return { to: `/bloco-${p.bloco}` as RotaBloco, hash: p.ancora };
}

/** Dashboard transversal: tudo que falta no ciclo, da mesma fonte de estado dos blocos. */
export function Pendencias() {
  const { cnpj, signatures, kanban, demo } = usePriva();
  const questions = useQuestions();
  const answers = useRespostas(cnpj);
  const lotes = useCnpjRows("lotes_pgaudit", cnpj, "mes_referencia");
  const incidentes = useCnpjRows("incidentes_seguranca", cnpj, "iniciado_em");
  const ripd = useCnpjRows("ripd_ia", cnpj, "atualizado_em");

  const { data: rot = [] } = useQuery({
    queryKey: ["registro_operacoes", cnpj, demo],
    enabled: !!cnpj,
    queryFn: async (): Promise<Rot[]> => {
      if (demo) return DEMO_ROT;
      const { data, error } = await supabase.from("registro_operacoes").select("*").eq("empresa_cnpj", cnpj ?? "");
      if (error) throw error;
      return data;
    },
  });
  const { data: ativos = [] } = useQuery({
    queryKey: ["ativos_seguranca", cnpj, demo],
    enabled: !!cnpj,
    queryFn: async (): Promise<Ativo[]> => {
      if (demo) return DEMO_ATIVOS;
      const { data, error } = await supabase.from("ativos_seguranca").select("*").eq("empresa_cnpj", cnpj ?? "");
      if (error) throw error;
      return data;
    },
  });

  if (!cnpj) return <Panel title="Dashboard · Pendências"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;

  const endpoints = ativos.filter((a) => a.tipo === "ENDPOINT");
  const cofres = ativos.filter((a) => a.tipo === "COFRE");
  const salvo = ripd.rows[0];
  const riscosSalvos = (salvo?.riscos ?? {}) as Record<string, { mitig?: string }>;
  const riscos = (["vazamento", "vies", "injecao"] as RiscoId[]).map((id) => {
    const sug = sugestaoMitigacao(id, signatures);
    return { label: id, mitig: riscosSalvos[id]?.mitig?.trim() ? riscosSalvos[id]!.mitig! : "texto" in sug ? sug.texto : "" };
  });

  const grupos: { n: number; itens: Pendencia[] }[] = [];
  if (isUnlocked(signatures, 1)) grupos.push({ n: 1, itens: montarChecklist({ n: 1, perguntas: questions.length, respondidas: Object.keys(answers).length, naos: Object.values(answers).filter((v) => !v).length }, signatures) });
  if (isUnlocked(signatures, 2)) grupos.push({ n: 2, itens: montarChecklist({ n: 2, rot: rot as never }, signatures) });
  if (isUnlocked(signatures, 3)) grupos.push({ n: 3, itens: montarChecklist({ n: 3, endpoints, cofres, chaves: demo ? null : null }, signatures) });
  if (isUnlocked(signatures, 4)) grupos.push({ n: 4, itens: montarChecklist({ n: 4, lotes: lotes.rows, incidentes: incidentes.rows, agora: Date.now() }, signatures) });
  if (isUnlocked(signatures, 5)) grupos.push({ n: 5, itens: pendenciasBloco5({ sistema: salvo?.sistema_avaliado ?? "", escudo: salvo?.escudo_digital ?? "", riscos }, signatures) });
  grupos.push({ n: 0, itens: pendenciasKanban(kanban) });

  const todas = grupos.flatMap((g) => g.itens);
  const abertas = todas.filter((p) => p.estado !== "ok");
  const ordenadas = ordenar(abertas);
  const porBloco = grupos.map((g) => ({ n: g.n, abertas: g.itens.filter((p) => p.estado !== "ok").length }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Transversal · Ciclo Privacium Semestral" title="Dashboard · Pendências" />

      <div className="grid gap-3 sm:grid-cols-3" data-testid="contadores">
        <Panel title="Pendências abertas"><p className="font-mono text-3xl font-semibold text-primary" data-testid="total-abertas">{abertas.length}</p></Panel>
        <Panel title="Bloqueantes"><p className="font-mono text-3xl font-semibold text-destructive" data-testid="total-bloqueantes">{abertas.filter(bloqueante).length}</p></Panel>
        <Panel title="Por bloco">
          <ul className="space-y-1 text-xs">
            {porBloco.map((b) => <li key={b.n} className="flex justify-between"><span>{BLOCO_NOME[b.n]}</span><span className="font-mono">{b.abertas}</span></li>)}
          </ul>
        </Panel>
      </div>

      <Panel title="Tudo que falta no ciclo">
        {!ordenadas.length && (
          <p className="flex items-center gap-2 py-4 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Nenhuma pendência aberta. O ciclo está pronto para a próxima assinatura.</p>
        )}
        <ul className="divide-y">
          {ordenadas.map((p) => {
            const d = destino(p);
            return (
              <li key={`${p.bloco}-${p.id}`} className="flex flex-wrap items-center gap-3 py-3" data-testid={`pendencia-${p.id}`}>
                {bloqueante(p) ? <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" /> : <ListChecks className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">{p.titulo}</p>
                  <p className="text-xs text-muted-foreground">{p.exige}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{BLOCO_NOME[p.bloco]} · Responsável: {p.responsavel}</p>
                </div>
                <Tag tone={TOM[p.estado]}>{ROTULO[p.estado]}</Tag>
                <Tag tone={bloqueante(p) ? "destructive" : "muted"}>{bloqueante(p) ? "Bloqueante" : "Normal"}</Tag>
                <AppLink to={d.to} hash={d.hash} className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid={`atalho-${p.id}`}>
                  {p.acao} <ArrowRight className="h-3 w-3" />
                </AppLink>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
