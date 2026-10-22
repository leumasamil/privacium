import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEPARTMENTS, computeGM, maskCNPJ, maskCPF, riskZone } from "@/lib/priva/data";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

type Fatura = { empresa_id: string; valor_mensalidade: number; status_pagamento: string; data_vencimento: string; link_fatura_simulado: string };
type Metrica = { empresa_id: string; volume_tokens_sinteticos_gerados: number; limite_mensal_tokens: number; quantidade_bloqueios_vazamento: number };
type Trilha = { seq: number; usuario_id: string | null; user_email: string | null; acao_executada: string | null; op: string; tabela_afetada: string | null; target: string; ip_origem: string | null; hash_integridade_sha256: string | null; hash: string; timestamp_evento: string | null; ts: string };

const COBRANCA_TONE: Record<string, "success" | "warning" | "destructive"> = { PAGO: "success", PENDENTE: "warning", ATRASADO: "destructive" };

export function AdminDashboard() {
  const { log } = usePriva();
  const [rows, setRows] = useState<EmpresaRow[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [gms, setGms] = useState<Record<string, number>>({});
  const [trilhaDe, setTrilhaDe] = useState<EmpresaRow | null>(null);

  const load = useCallback(async () => {
    const [e, f, m, g] = await Promise.all([
      supabase.from("empresas").select("*").order("data_cadastro"),
      supabase.from("faturamento_saas").select("empresa_id,valor_mensalidade,status_pagamento,data_vencimento,link_fatura_simulado").order("data_vencimento", { ascending: false }),
      supabase.from("metricas_uso_ia").select("empresa_id,volume_tokens_sinteticos_gerados,limite_mensal_tokens,quantidade_bloqueios_vazamento"),
      supabase.rpc("admin_gm_empresas"),
    ]);
    setRows(e.data ?? []);
    setFaturas((f.data ?? []).map((x) => ({ ...x, valor_mensalidade: Number(x.valor_mensalidade) })));
    setMetricas(m.data ?? []);
    setGms(Object.fromEntries((g.data ?? []).map((x) => [x.cnpj, Number(x.gm)])));
  }, []);

  useEffect(() => { void load(); log("SELECT", "empresas", "Abertura do painel ADMIN_SISTEMA"); }, [load, log]);

  const update = async (r: EmpresaRow, patch: Partial<Pick<EmpresaRow, "status" | "plano_assinatura">>, detail: string) => {
    const { error } = await supabase.from("empresas").update(patch).eq("id", r.id);
    if (!error) { log("UPDATE", "empresas", `CNPJ ${r.cnpj}: ${detail}`); void load(); }
  };
  const cobrar = async (r: EmpresaRow, status: string) => {
    const { error } = await supabase.from("faturamento_saas").update({ status_pagamento: status }).eq("empresa_id", r.id);
    if (!error) { log("UPDATE", "faturamento_saas", `CNPJ ${r.cnpj}: cobrança ${status}`); void load(); }
  };

  const fatura = (id: string) => faturas.find((f) => f.empresa_id === id);
  const ativos = rows.filter((r) => r.status === "ATIVO");
  const mrr = ativos.reduce((s, r) => s + (fatura(r.id)?.valor_mensalidade ?? MENSALIDADE[r.plano_assinatura] ?? 0), 0);
  const core = rows.filter((r) => r.plano_assinatura === "CORE").length;
  const ent = rows.length - core;
  const tokens = metricas.reduce((s, m) => s + m.volume_tokens_sinteticos_gerados, 0);
  const bloqueios = metricas.reduce((s, m) => s + m.quantidade_bloqueios_vazamento, 0);

  return (
    <div>
      <PageHeader eyebrow="ADMIN_SISTEMA · Super Administrador" title="Operação comercial do PRIVA 2EC">
        Visão consolidada dos clientes multi-tenant. Acesso exclusivo do dono do ecossistema.
      </PageHeader>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Stat label="Faturamento mensal recorrente (MRR)" value={brl(mrr)} sub={`${ativos.length} empresas ativas`} />
        <div className="rounded-md border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Empresas cadastradas</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{rows.length}</p>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted">
            <div className="bg-primary" style={{ width: `${rows.length ? (core / rows.length) * 100 : 0}%` }} />
            <div className="bg-accent-foreground/60" style={{ width: `${rows.length ? (ent / rows.length) * 100 : 0}%` }} />
          </div>
          <p className="mt-1 flex justify-between text-xs text-muted-foreground"><span>CORE {core}</span><span>ENTERPRISE {ent}</span></p>
        </div>
        <Stat label="Escudo de IA · todas as empresas" value={`${bloqueios} bloqueios`} sub={`${tokens.toLocaleString("pt-BR")} tokens sintéticos (dados higienizados)`} />
      </div>
      <Panel title="Gestão de clientes multi-tenant">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Razão social</th><th>CNPJ</th><th>Plano</th><th>GM</th><th>Cobrança</th><th>Status</th><th className="text-right">Ações</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const f = fatura(r.id); const gm = gms[r.cnpj] ?? 0; const z = riskZone(gm);
                return (
                  <tr key={r.id} className="border-t align-middle">
                    <td className="py-2 font-medium">{r.razao_social || "—"}</td>
                    <td><Masked kind="cnpj" value={r.cnpj} /></td>
                    <td><Tag tone={r.plano_assinatura === "ENTERPRISE" ? "success" : "muted"}>{r.plano_assinatura}</Tag></td>
                    <td><Tag tone={z.tone}>{gm.toFixed(1)}%</Tag></td>
                    <td>
                      <select className="rounded-sm border bg-background px-2 py-1 text-xs" value={f?.status_pagamento ?? "PENDENTE"} onChange={(e) => void cobrar(r, e.target.value)}>
                        {["PAGO", "PENDENTE", "ATRASADO"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                      {f && <span className="ml-2"><Tag tone={COBRANCA_TONE[f.status_pagamento] ?? "muted"}>{brl(f.valor_mensalidade)}</Tag></span>}
                    </td>
                    <td><Tag tone={r.status === "ATIVO" ? "success" : "destructive"}>{r.status}</Tag></td>
                    <td className="space-x-1 whitespace-nowrap text-right">
                      <Button size="sm" variant={r.status === "ATIVO" ? "destructive" : "outline"} onClick={() => void update(r, { status: r.status === "ATIVO" ? "INATIVO" : "ATIVO" }, r.status === "ATIVO" ? "acesso suspenso" : "acesso reativado")}>
                        {r.status === "ATIVO" ? "Suspender acesso" : "Reativar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { const p = r.plano_assinatura === "CORE" ? "ENTERPRISE" : "CORE"; void update(r, { plano_assinatura: p }, `plano → ${p}`); }}>Mudar plano</Button>
                      <Button size="sm" variant="outline" onClick={() => { setTrilhaDe(r); log("SELECT", "trilha_auditoria_sistema", `Trilha forense do CNPJ ${r.cnpj}`); }}>Ver trilha forense</Button>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhum CNPJ cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      <TrilhaModal empresa={trilhaDe} onClose={() => setTrilhaDe(null)} />
    </div>
  );
}

function TrilhaModal({ empresa, onClose }: { empresa: EmpresaRow | null; onClose: () => void }) {
  const [linhas, setLinhas] = useState<Trilha[]>([]);
  const [cpfs, setCpfs] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!empresa) return;
    void (async () => {
      const { data } = await supabase.from("trilha_auditoria_sistema")
        .select("seq,usuario_id,user_email,acao_executada,op,tabela_afetada,target,ip_origem,hash_integridade_sha256,hash,timestamp_evento,ts")
        .eq("cnpj", empresa.cnpj).order("seq", { ascending: false }).limit(200);
      const rows = data ?? [];
      setLinhas(rows);
      const ids = [...new Set(rows.map((r) => r.usuario_id).filter((x): x is string => !!x))];
      if (ids.length) {
        const { data: us } = await supabase.from("usuarios").select("id,cpf").in("id", ids);
        setCpfs(Object.fromEntries((us ?? []).map((u) => [u.id, u.cpf ?? ""])));
      }
    })();
  }, [empresa]);
  return (
    <Dialog open={!!empresa} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Trilha forense coletiva · ISO 27037</DialogTitle>
          <DialogDescription>{empresa?.razao_social} · {maskCNPJ(empresa?.cnpj ?? "")} · últimos {linhas.length} registros</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card text-left uppercase text-muted-foreground">
              <tr><th className="py-2">Usuário (CPF)</th><th>Ação</th><th>Tabela</th><th>IP de origem</th><th>Hash SHA-256</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.seq} className="border-t">
                  <td className="py-1.5 font-mono">{l.usuario_id && cpfs[l.usuario_id] ? maskCPF(cpfs[l.usuario_id]) : "***.***.***-**"}</td>
                  <td>{l.acao_executada ?? l.op}</td>
                  <td className="font-mono">{l.tabela_afetada ?? l.target}</td>
                  <td className="font-mono">{l.ip_origem ?? "—"}</td>
                  <td className="font-mono" title={l.hash_integridade_sha256 ?? l.hash}>{(l.hash_integridade_sha256 ?? l.hash).slice(0, 16)}…</td>
                  <td className="whitespace-nowrap">{new Date(l.timestamp_evento ?? l.ts).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {!linhas.length && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Sem registros para este CNPJ.</td></tr>}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
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
