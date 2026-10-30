import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLink as Link } from "@/components/priva/AppLink";
import { ArrowRight, BookOpen, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePriva } from "@/lib/priva/store";
import { montarChecklist, PI_INFO, RISCOS_IA, proximoPasso, type DadosBloco, type Estado, type Pendencia } from "@/lib/priva/pendencias";
import type { RotInput } from "@/lib/priva/rot";
import { cn } from "@/lib/utils";
import { ESTADO, EstadoBadge } from "./estado";
import { LinkPendencia } from './LinkPendencia';
import { useEstadoBloco4 } from '@/lib/priva/useEstadoBloco4';
import { DEMO_ATIVOS, DEMO_ROT, DEMO_ROWS, DEMO_QUESTIONS } from '@/lib/priva/demo';
import { avisarAcaoDemo } from '@/lib/priva/demoAction';

const ROTULO: Record<string, string> = { DPO_OPERACIONAL: "DPO_OPERACIONAL", C_SUITE: "Diretoria (C_SUITE)", ADMIN_SISTEMA: "ADMIN_SISTEMA" };

export function useDadosBloco(n: number, cnpj: string | null) {
  const { demo } = usePriva();
  const bloco4 = useEstadoBloco4(n === 4 ? cnpj : null);
  const outros = useQuery({
    queryKey: ["pendencias", n, cnpj, demo],
    enabled: !!cnpj && n !== 4,
    queryFn: async (): Promise<DadosBloco> => {
      if (demo) {
        if (n === 1) return { n: 1, perguntas: DEMO_QUESTIONS.length, respondidas: DEMO_QUESTIONS.length, naos: 40 };
        if (n === 2) return { n: 2, rot: DEMO_ROT };
        if (n === 3) return { n: 3, endpoints: DEMO_ATIVOS.filter(a => a.tipo === 'ENDPOINT'), cofres: DEMO_ATIVOS.filter(a => a.tipo === 'COFRE'), chaves: 20 };
        const ripd = DEMO_ROWS.ripd_ia[0];
        return { n: 5, sistema: ripd?.sistema_avaliado ?? '', escudo: ripd?.escudo_digital ?? '', riscos: [] };
      }
      const c = cnpj ?? "";
      if (n === 1) {
        const [p, r] = await Promise.all([
          supabase.from("perguntas_diagnostico").select("id", { count: "exact", head: true }),
          supabase.from("respostas_diagnostico").select("resposta_binaria").eq("empresa_cnpj", c),
        ]);
        const rows = r.data ?? [];
        return { n: 1, perguntas: p.count ?? 0, respondidas: rows.length, naos: rows.filter((x) => x.resposta_binaria !== "SIM").length };
      }
      if (n === 2) {
        const { data } = await supabase.from("registro_operacoes").select("*").eq("empresa_cnpj", c);
        return { n: 2, rot: (data ?? []) as unknown as RotInput[] };
      }
      if (n === 3) {
        const { data } = await supabase.from("ativos_seguranca").select("id,tipo,protegido,hash_integridade").eq("empresa_cnpj", c);
        const a = data ?? [];
        const ends = a.filter((x) => x.tipo === "ENDPOINT");
        let chaves: number | null = null;
        if (ends.length) {
          const k = await supabase.from("chaves_recuperacao").select("ativo_id", { count: "exact", head: true }).in("ativo_id", ends.map((e) => e.id));
          chaves = k.error ? null : k.count ?? 0;
        }
        return { n: 3, endpoints: ends, cofres: a.filter((x) => x.tipo === "COFRE"), chaves };
      }
      if (n === 5) {
        const { data } = await supabase.from("ripd_ia").select("sistema_avaliado,escudo_digital,riscos").eq("empresa_cnpj", c).maybeSingle();
        const rs = (data?.riscos ?? {}) as Record<string, { mitig?: string }>;
        return { n: 5, sistema: data?.sistema_avaliado ?? "", escudo: data?.escudo_digital ?? "", riscos: RISCOS_IA.map((r) => ({ label: r.label, mitig: rs[r.id]?.mitig ?? "" })) };
      }
      throw new Error('Bloco sem consulta de pendências');
    },
  });
  return n === 4 ? bloco4 : outros;
}


export function TelaBloqueio({ n }: { n: number }) {
  const { cnpj, signatures, roles, role, log, demo } = usePriva();
  const ant = n - 1;
  const pi = PI_INFO[ant] ?? PI_INFO[1];
  const { data, isLoading } = useDadosBloco(ant, cnpj);
  const itens = data ? montarChecklist(data, signatures) : [];
  const feitos = itens.filter((i) => i.estado === "ok").length;
  const pct = itens.length ? Math.round((feitos / itens.length) * 100) : 0;
  const soAssinatura = itens.length > 0 && itens.filter((i) => !i.id.startsWith("sig")).every((i) => i.estado === "ok");
  const prox = proximoPasso(itens, roles);
  const sigFaltando = itens.filter((i) => i.id.startsWith("sig") && i.estado !== "ok");
  const pode = (i: Pendencia) => roles.includes(i.responsavel) || (roles.includes("ADMIN_SISTEMA") && i.responsavel !== "C_SUITE");
  const dependeOutro = itens.filter((i) => i.estado !== "ok" && !pode(i));
  if (!pi) return null;
  const solicitar = (i: Pendencia) => {
    if (demo) return avisarAcaoDemo();
    log("INSERT", "solicitacao_assinatura", `Solicitada ação de ${i.responsavel} no ${pi.codigo}: ${i.titulo}`);
    toast.success(`Solicitação registrada na trilha de auditoria. Avise ${ROTULO[i.responsavel]} para acessar o Bloco ${ant}.`);
  };
  const visiveis = itens.filter((i) => !soAssinatura || i.id.startsWith("sig"));
  const abertos = visiveis.filter((i) => i.estado !== "ok");
  const concluidos = visiveis.filter((i) => i.estado === "ok");

  const textoBotao = prox
    ? prox.id.startsWith("sig") && sigFaltando.length ? `${prox.acao} (falta${sigFaltando.length > 1 ? "m" : ""} ${sigFaltando.length} assinatura${sigFaltando.length > 1 ? "s" : ""})` : prox.acao
    : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b pb-5">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"><Lock className="h-3 w-3" /> Método BLLOCO · bloqueio progressivo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Bloco {n} bloqueado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Falta concluir o Bloco {ant} para liberar esta etapa.</p>
      </header>

      <section className="rounded-md border border-primary/30 bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">O que é o {pi.codigo}</p>
        <p className="mt-1 font-semibold text-primary">{pi.codigo} · {pi.nome}</p>
        <p className="mt-2 text-sm text-foreground">{pi.explica}</p>
      </section>

      <section className="rounded-md border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">O que falta no Bloco {ant}</h2>
        </div>
        {!cnpj ? (
          <p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral para ver as pendências.</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Lendo o estado do CNPJ…</p>
        ) : (
          <>
            {soAssinatura && <p className="mb-3 rounded-sm border border-l-4 border-l-concluido-border p-3 text-sm text-concluido">Todas as etapas foram concluídas. Falta apenas a assinatura digital.</p>}
            <ul className="space-y-2">
              {abertos.map((i) => {
                const e = ESTADO[i.estado];
                return (
                  <li key={i.id} className={cn("flex items-start gap-3 rounded-sm border border-l-4 bg-card p-3", e.borda)}>
                    <span className="mt-0.5 shrink-0">{e.icone()}</span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-primary">{i.titulo}</p><EstadoBadge estado={i.estado} /></div>
                      <p className={cn("text-xs", i.estado === "critico" ? e.texto : "text-muted-foreground")}>{i.exige}</p>
                      <p className="text-xs text-muted-foreground">Responsável: <b>{ROTULO[i.responsavel]}</b></p>
                      {i.estado !== "bloqueado" && (pode(i) ? (
                        <>
                          {i.sugestao && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Próxima ação sugerida:</span> {i.sugestao}</p>}
                          <LinkPendencia item={i} className="inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2">{i.acao} →</LinkPendencia>
                        </>
                      ) : (
                        <p className="text-xs text-bloqueado">Depende de {ROTULO[i.responsavel]}.{" "}
                          <button className="font-semibold underline underline-offset-2" onClick={() => solicitar(i)}>Solicitar a {ROTULO[i.responsavel]} →</button>
                        </p>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            {concluidos.length > 0 && (
              <details className="mt-3 rounded-sm border border-concluido-border/50 p-2 text-sm">
                <summary className="cursor-pointer text-xs font-semibold text-concluido">Já concluído ({concluidos.length})</summary>
                <ul className="mt-2 space-y-1">
                  {concluidos.map((i) => <li key={i.id} className="flex items-center gap-2 text-xs text-muted-foreground">{ESTADO.ok.icone("h-4 w-4")} {i.titulo} — {i.exige}</li>)}
                </ul>
              </details>
            )}
            <div className="mt-4">
              <p className="mb-1 text-sm">Bloco {ant} concluído: {feitos} de {itens.length} itens ({pct}%)</p>
              <Progress value={pct} aria-label={`${pct}% concluído`} className={cn("bg-muted", pct === 100 ? "[&>div]:bg-concluido-border" : "[&>div]:bg-pendencia-border")} />
            </div>
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {prox && pode(prox) && <Button asChild><LinkPendencia item={prox}>{textoBotao} <ArrowRight className="h-4 w-4" /></LinkPendencia></Button>}
        <Button asChild variant="outline"><Link to="/manual" search={{ aba: "guias" }} hash={`bloco-${ant}-guia`}><BookOpen className="h-4 w-4" /> Ver o que falta neste bloco em detalhes</Link></Button>
      </div>

      {cnpj && !isLoading && (
        <p className="rounded-sm border bg-muted/40 p-3 text-sm">
          Você é <b>{ROTULO[role] ?? role}</b>.{" "}
          {dependeOutro.length === 0
            ? "Você tem permissão para concluir todas as pendências acima."
            : <>{dependeOutro.map((d) => d.titulo).join(", ")} depende{dependeOutro.length > 1 ? "m" : ""} de outro usuário ({[...new Set(dependeOutro.map((d) => ROTULO[d.responsavel]))].join(", ")}).{" "}
              <button className="font-medium text-primary underline underline-offset-2" onClick={() => {
                if (demo) return avisarAcaoDemo();
                log("INSERT", "solicitacao_assinatura", `Solicitada ação de ${[...new Set(dependeOutro.map((d) => d.responsavel))].join(", ")} no ${pi.codigo}`);
                toast.success("Solicitação registrada na trilha de auditoria. Avise o responsável para acessar o Bloco " + ant + ".");
              }}>Solicitar {sigFaltando.some((s) => dependeOutro.includes(s)) ? "assinatura" : "ação"}</button></>}
        </p>
      )}
    </div>
  );
}
