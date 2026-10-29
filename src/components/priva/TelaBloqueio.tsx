import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Loader2, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePriva } from "@/lib/priva/store";
import { montarChecklist, PI_INFO, proximoPasso, type DadosBloco, type Estado, type Pendencia } from "@/lib/priva/pendencias";
import type { RotInput } from "@/lib/priva/rot";
import { cn } from "@/lib/utils";

const ROTULO: Record<string, string> = { DPO_OPERACIONAL: "DPO_OPERACIONAL", C_SUITE: "Diretoria (C_SUITE)", ADMIN_SISTEMA: "ADMIN_SISTEMA" };

function useDadosBloco(n: number, cnpj: string | null) {
  return useQuery({
    queryKey: ["pendencias", n, cnpj],
    enabled: !!cnpj,
    queryFn: async (): Promise<DadosBloco> => {
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
      const [l, i] = await Promise.all([
        supabase.from("lotes_pgaudit").select("mes_referencia,hash_sha256").eq("empresa_cnpj", c),
        supabase.from("incidentes_seguranca").select("id,passos,iniciado_em,enviado_anpd_em,encerrado_em").eq("empresa_cnpj", c),
      ]);
      return { n: 4, lotes: l.data ?? [], incidentes: i.data ?? [], agora: Date.now() };
    },
  });
}

const ICONE: Record<Estado, JSX.Element> = {
  ok: <CheckCircle2 className="h-5 w-5 text-success" aria-label="Concluído" />,
  andamento: <Loader2 className="h-5 w-5 text-warning" aria-label="Em andamento" />,
  pendente: <Circle className="h-5 w-5 text-muted-foreground" aria-label="Não iniciado" />,
  bloqueado: <XCircle className="h-5 w-5 text-destructive" aria-label="Bloqueado" />,
};

function linkDe(p: Pendencia) {
  return { to: `/bloco-${p.bloco}` as "/bloco-1", hash: p.ancora };
}

export function TelaBloqueio({ n }: { n: number }) {
  const { cnpj, signatures, roles, role, log } = usePriva();
  const ant = n - 1;
  const pi = PI_INFO[ant]!;
  const { data, isLoading } = useDadosBloco(ant, cnpj);
  const itens = data ? montarChecklist(data, signatures) : [];
  const feitos = itens.filter((i) => i.estado === "ok").length;
  const pct = itens.length ? Math.round((feitos / itens.length) * 100) : 0;
  const soAssinatura = itens.length > 0 && itens.filter((i) => !i.id.startsWith("sig")).every((i) => i.estado === "ok");
  const prox = proximoPasso(itens, roles);
  const sigFaltando = itens.filter((i) => i.id.startsWith("sig") && i.estado !== "ok");
  const dependeOutro = itens.filter((i) => i.estado !== "ok" && !roles.includes(i.responsavel) && !(roles.includes("ADMIN_SISTEMA") && i.responsavel !== "C_SUITE"));

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
            {soAssinatura && <p className="mb-3 rounded-sm border border-success/40 bg-success/10 p-3 text-sm">Todas as etapas foram concluídas. Falta apenas a assinatura digital.</p>}
            <ul className="divide-y">
              {itens.filter((i) => !soAssinatura || i.id.startsWith("sig")).map((i) => (
                <li key={i.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 shrink-0">{ICONE[i.estado]}</span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium", i.estado === "ok" ? "text-muted-foreground line-through" : "text-primary")}>{i.titulo}</p>
                    <p className="text-xs text-muted-foreground">{i.exige}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Responsável: <b>{ROTULO[i.responsavel]}</b></p>
                  </div>
                  {i.estado !== "ok" && i.estado !== "bloqueado" && (
                    <Link {...linkDe(i)} className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline">Resolver →</Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="mb-1 text-sm">Bloco {ant} concluído: {feitos} de {itens.length} itens ({pct}%)</p>
              <Progress value={pct} />
            </div>
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {prox && <Button asChild><Link {...linkDe(prox)}>{textoBotao} <ArrowRight className="h-4 w-4" /></Link></Button>}
        <Button asChild variant="outline"><Link to="/manual" search={{ aba: "guias" }}><BookOpen className="h-4 w-4" /> Ver o que falta neste bloco em detalhes</Link></Button>
      </div>

      {cnpj && !isLoading && (
        <p className="rounded-sm border bg-muted/40 p-3 text-sm">
          Você é <b>{ROTULO[role] ?? role}</b>.{" "}
          {dependeOutro.length === 0
            ? "Você tem permissão para concluir todas as pendências acima."
            : <>{dependeOutro.map((d) => d.titulo).join(", ")} depende{dependeOutro.length > 1 ? "m" : ""} de outro usuário ({[...new Set(dependeOutro.map((d) => ROTULO[d.responsavel]))].join(", ")}).{" "}
              <button className="font-medium text-primary underline underline-offset-2" onClick={() => {
                log("INSERT", "solicitacao_assinatura", `Solicitada ação de ${[...new Set(dependeOutro.map((d) => d.responsavel))].join(", ")} no ${pi.codigo}`);
                toast.success("Solicitação registrada na trilha de auditoria. Avise o responsável para acessar o Bloco " + ant + ".");
              }}>Solicitar {sigFaltando.some((s) => dependeOutro.includes(s)) ? "assinatura" : "ação"}</button></>}
        </p>
      )}
    </div>
  );
}
