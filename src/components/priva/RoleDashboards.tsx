import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEPARTMENTS, computeGM, riskZone } from "@/lib/priva/data";
import { useQuestions, useRespostas } from "@/lib/priva/questions";
import { usePriva } from "@/lib/priva/store";
import { Masked, PageHeader, Panel, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmpresaRow = { id: string; cnpj: string; razao_social: string; plano_assinatura: string; status: string; data_cadastro: string };
type Vol = { empresas: number; ativas: number; usuarios: number; registros_trilha: number; perguntas: number };

/** Mensalidade ilustrativa por plano (valores de demonstração). */
export const MENSALIDADE: Record<string, number> = { CORE: 1500, ENTERPRISE: 4900 };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AdminDashboard() {
  const { log } = usePriva();
  const [rows, setRows] = useState<EmpresaRow[]>([]);
  const [vol, setVol] = useState<Vol | null>(null);

  const load = useCallback(async () => {
    const [{ data: e }, { data: v }] = await Promise.all([
      supabase.from("empresas").select("*").order("data_cadastro"),
      supabase.rpc("volumetria"),
    ]);
    setRows(e ?? []);
    const first = v?.[0];
    if (first) setVol({ empresas: Number(first.empresas), ativas: Number(first.ativas), usuarios: Number(first.usuarios), registros_trilha: Number(first.registros_trilha), perguntas: Number(first.perguntas) });
  }, []);

  useEffect(() => { void load(); log("SELECT", "empresas", "Abertura do painel ADMIN_SISTEMA"); }, [load, log]);

  const update = async (r: EmpresaRow, patch: Partial<Pick<EmpresaRow, "status" | "plano_assinatura">>) => {
    const { error } = await supabase.from("empresas").update(patch).eq("id", r.id);
    if (!error) {
      log("UPDATE", "empresas", `CNPJ ${r.cnpj}: ${JSON.stringify(patch)}`);
      void load();
    }
  };

  const ativos = rows.filter((r) => r.status === "ATIVO");
  const mrr = ativos.reduce((s, r) => s + (MENSALIDADE[r.plano_assinatura] ?? 0), 0);

  return (
    <div>
      <PageHeader eyebrow="ADMIN_SISTEMA · Visão geral do SaaS" title="Contratos e volumetria">
        Monitoramento financeiro dos contratos, ativação de CNPJs clientes e volume de dados da plataforma.
      </PageHeader>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Stat label="Receita mensal recorrente" value={brl(mrr)} sub="valores ilustrativos por plano" />
        <Stat label="CNPJs ativos" value={`${vol?.ativas ?? 0} / ${vol?.empresas ?? 0}`} sub="clientes contratantes" />
        <Stat label="Usuários" value={String(vol?.usuarios ?? 0)} sub="contas na plataforma" />
        <Stat label="Registros na trilha" value={String(vol?.registros_trilha ?? 0)} sub={`${vol?.perguntas ?? 0} perguntas no banco`} />
      </div>
      <Panel title="CNPJs clientes">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="py-2">CNPJ</th><th>Razão social</th><th>Plano</th><th>Mensalidade</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2"><Masked kind="cnpj" value={r.cnpj} /></td>
                <td>{r.razao_social || "—"}</td>
                <td>
                  <select className="rounded-sm border bg-background px-2 py-1 text-xs" value={r.plano_assinatura} onChange={(e) => void update(r, { plano_assinatura: e.target.value })}>
                    <option value="CORE">CORE</option><option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </td>
                <td className="font-mono text-xs">{brl(MENSALIDADE[r.plano_assinatura] ?? 0)}</td>
                <td><Tag tone={r.status === "ATIVO" ? "success" : "muted"}>{r.status}</Tag></td>
                <td className="text-right">
                  <Button size="sm" variant="outline" onClick={() => void update(r, { status: r.status === "ATIVO" ? "INATIVO" : "ATIVO" })}>
                    {r.status === "ATIVO" ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhum CNPJ cadastrado.</td></tr>}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/** Impacto (1-5) estimado por departamento para o mapa ERM. */
const IMPACTO: Record<string, number> = { RH: 4, TI: 5, Marketing: 3, Compras: 2, "Recepção": 2, "Jurídico": 4, Financeiro: 5 };

export function CSuiteDashboard() {
  const { cnpj, signatures, log } = usePriva();
  const answers = useRespostas(cnpj);
  const questions = useQuestions();
  const { gm, score, bankMax } = computeGM(answers, questions);
  const zone = riskZone(gm);
  useEffect(() => { log("SELECT", "relatorio_erm", "Abertura do painel C_SUITE"); }, [log]);

  const risks = DEPARTMENTS.map((d) => {
    const qs = questions.filter((q) => q.department === d);
    const total = qs.reduce((s, q) => s + q.weight, 0);
    const got = qs.reduce((s, q) => s + (answers[q.id] ? q.weight : 0), 0);
    const ader = total ? got / total : 0;
    const prob = Math.min(5, Math.max(1, Math.ceil((1 - ader) * 5)));
    return { d, ader, prob, imp: IMPACTO[d] ?? 3 };
  });

  return (
    <div>
      <PageHeader eyebrow="C_SUITE · Visão estratégica" title="Mapa de riscos globais (ERM)">
        Riscos de privacidade por área, em linguagem executiva. Dados pessoais brutos não são exibidos neste painel.
      </PageHeader>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Stat label="Grau de maturidade" value={`${gm.toFixed(1)}%`} sub={<Tag tone={zone.tone}>{zone.label}</Tag>} />
        <Stat label="Score" value={`${score} / ${bankMax}`} sub="pontos ponderados" />
        <Stat label="Etapas concluídas" value={`${Object.keys(signatures).length}`} sub="produtos chancelados" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Panel title="Matriz probabilidade × impacto">
          <div className="grid grid-cols-[auto_repeat(5,3.5rem)] gap-1 text-xs">
            {[5, 4, 3, 2, 1].map((p) => (
              <Row key={p} p={p} risks={risks} />
            ))}
            <span />
            {[1, 2, 3, 4, 5].map((i) => <span key={i} className="text-center text-muted-foreground">{i}</span>)}
          </div>
          <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">Impacto →</p>
        </Panel>
        <Panel title="Relatório gerencial por área">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Área</th><th>Aderência</th><th>Probabilidade</th><th>Impacto</th><th>Nível</th></tr></thead>
            <tbody>
              {risks.map((r) => {
                const lvl = r.prob * r.imp;
                return (
                  <tr key={r.d} className="border-t">
                    <td className="py-2 font-medium">{r.d}</td>
                    <td>{(r.ader * 100).toFixed(0)}%</td><td>{r.prob}</td><td>{r.imp}</td>
                    <td><Tag tone={lvl >= 15 ? "destructive" : lvl >= 8 ? "warning" : "success"}>{lvl >= 15 ? "Alto" : lvl >= 8 ? "Médio" : "Baixo"}</Tag></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

function Row({ p, risks }: { p: number; risks: { d: string; prob: number; imp: number }[] }) {
  return (
    <>
      <span className="flex items-center pr-2 text-muted-foreground">{p}</span>
      {[1, 2, 3, 4, 5].map((i) => {
        const lvl = p * i;
        const here = risks.filter((r) => r.prob === p && r.imp === i);
        return (
          <div key={i} className={cn("flex h-14 flex-col items-center justify-center rounded-sm p-1 text-center text-[10px] leading-tight",
            lvl >= 15 ? "bg-destructive/80 text-destructive-foreground" : lvl >= 8 ? "bg-warning/80 text-warning-foreground" : "bg-success/70 text-success-foreground")}>
            {here.map((r) => <span key={r.d}>{r.d}</span>)}
          </div>
        );
      })}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
