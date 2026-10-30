import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { pendenciasBloco5 } from "@/lib/priva/pendencias";
import { AJUDA } from "@/lib/priva/ajuda";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, PartyPopper, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { DOSIMETRIA, TETO_REDUCAO, fatorAtivo, multaComAtenuantes, reducaoDosimetria } from "@/lib/priva/dosimetria";
import { usePriva } from "@/lib/priva/store";
import { useCnpjRows } from "@/lib/priva/useCnpjRows";
import { DEMO_MULTA_BASE } from "@/lib/priva/demo";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";



const RISKS = [
  { id: "vazamento", label: "Vazamento por prompts", hint: "Colaboradores colando dados pessoais em LLMs externos." },
  { id: "vies", label: "Vieses discriminatórios (RH/Crédito)", hint: "Decisões automatizadas que discriminam candidatos ou clientes (Art. 20 LGPD)." },
  { id: "injecao", label: "Injeção de prompts", hint: "Instruções maliciosas que forçam o modelo a revelar ou alterar dados." },
];
type R = { prob: number; imp: number; descricao: string; mitig: string };
const DEF: R = { prob: 3, imp: 3, descricao: "", mitig: "" };
const ESCUDO_PADRAO = "O Escudo Digital do Bloco 3 tokeniza localmente CPFs, e-mails e nomes ([CPF_TOKEN], [EMAIL_TOKEN], [NOME_TOKEN]) antes do envio a qualquer IA externa e reverte os tokens apenas no navegador do usuário autorizado. Nenhum dado pessoal em claro sai do perímetro do CNPJ.";
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function Bloco5() {
  const { cnpj, roles, signatures, set, log, demo } = usePriva();
  const navigate = useNavigate();
  const canEdit = (roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA"));
  const ripdRows = useCnpjRows("ripd_ia", cnpj, "atualizado_em");
  const ciclos = useCnpjRows("ciclos_priva", cnpj, "ano_fiscal");
  const salvo = ripdRows.rows[0];
  const [sistema, setSistema] = useState("");
  const [ripd, setRipd] = useState<Record<string, R>>({});
  const [escudo, setEscudo] = useState(ESCUDO_PADRAO);
  const [base, setBase] = useState(demo ? DEMO_MULTA_BASE : 1_000_000);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSistema(salvo?.sistema_avaliado ?? "");
    setRipd((salvo?.riscos ?? {}) as Record<string, R>);
    setEscudo(salvo?.escudo_digital || ESCUDO_PADRAO);
  }, [salvo?.atualizado_em]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setBase(demo ? DEMO_MULTA_BASE : 1_000_000); }, [demo]);
  useEffect(() => { if (cnpj) log("SELECT", "ripd_ia", "Abertura do RIPD algorítmico do Bloco 5"); }, [cnpj, log]);

  if (!cnpj) return <Panel title="Auditoria"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;

  const salvar = async (next: { sistema?: string; ripd?: Record<string, R>; escudo?: string }, detail: string) => {
    if (demo) return avisarAcaoDemo();
    if (!canEdit) return;
    const { error } = await supabase.from("ripd_ia").upsert({
      empresa_cnpj: cnpj, sistema_avaliado: next.sistema ?? sistema, riscos: (next.ripd ?? ripd) as Json,
      escudo_digital: next.escudo ?? escudo, atualizado_em: new Date().toISOString(),
    });
    if (error) { toast.error("Falha ao salvar o RIPD."); return; }
    log("UPDATE", "ripd_ia", detail);
  };

  const reducao = reducaoDosimetria(signatures);
  const anoAtual = ciclos.rows[0] ? ciclos.rows[0].ano_fiscal + 1 : new Date().getFullYear();
  const ready = sistema.trim().length > 2 && escudo.trim().length > 20 && RISKS.every((r) => (ripd[r.id] ?? DEF).mitig.trim().length > 10);
  const tone = (n: number): "destructive" | "warning" | "success" => (n >= 15 ? "destructive" : n >= 8 ? "warning" : "success");

  const finalizar = async () => {
    if (demo) return avisarAcaoDemo();
    setBusy(true);
    const { error } = await supabase.from("ciclos_priva").insert({ empresa_cnpj: cnpj, ano_fiscal: anoAtual, reducao_dosimetria: reducao, assinaturas: signatures as unknown as Json });
    setBusy(false);
    if (error) { toast.error("Não foi possível finalizar o ciclo."); return; }
    set({ signatures: {}, incidentStart: null, incidentSteps: [false, false, false, false, false, false] },
      { op: "INSERT", target: "ciclos_priva", detail: `Ciclo Privacium Semestral ${anoAtual} finalizado · Ano Fiscal ${anoAtual + 1} aberto · Bloco 1 reativado` });
    toast.success(`Ano Fiscal ${anoAtual + 1} iniciado. Bloco 1 reativado.`);
    void navigate({ to: "/bloco-1" });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`Bloco 5 · (A) Ciclo Privacium Semestral · Ano Fiscal ${anoAtual}`} title="Auditar o Sistema de Privacidade e Mitigar Riscos" />
      {AJUDA[5] && <AjudaTarefa {...AJUDA[5]} pendencias={pendenciasBloco5({ sistema, escudo, riscos: RISKS.map((r) => ({ label: r.label, mitig: (ripd[r.id] ?? DEF).mitig })) }, signatures)} />}

      <Panel id="ripd" title="RIPD algorítmico · IA e LLMs (Art. 38 LGPD / ISO 42001)">
        <label className="text-xs text-muted-foreground">Sistema de IA avaliado
          <Input disabled={!canEdit} placeholder="Ex.: assistente interno baseado em LLM para atendimento e triagem de currículos" value={sistema}
            onChange={(e) => setSistema(e.target.value)} onBlur={() => salvar({}, "RIPD: sistema avaliado")} />
        </label>
        <div className="mt-4 space-y-4">
          {RISKS.map((r) => {
            const v = { ...DEF, ...ripd[r.id] }; const score = v.prob * v.imp;
            const put = (p: Partial<R>, persist: boolean) => { const n = { ...ripd, [r.id]: { ...v, ...p } }; setRipd(n); if (persist) void salvar({ ripd: n }, `RIPD: ${r.label}`); };
            return (
              <div key={r.id} className="rounded-sm border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="font-semibold text-primary">{r.label}</p><p className="text-xs text-muted-foreground">{r.hint}</p></div>
                  <Tag tone={tone(score)}>Risco {score}</Tag>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[140px_140px_1fr_1fr]">
                  {(["prob", "imp"] as const).map((k) => (
                    <label key={k} className="text-xs text-muted-foreground">{k === "prob" ? "Probabilidade" : "Impacto"} ({v[k]})
                      <input type="range" min={1} max={5} disabled={!canEdit} value={v[k]} onChange={(e) => put({ [k]: +e.target.value }, true)} className="w-full accent-primary" />
                    </label>
                  ))}
                  <Textarea rows={2} disabled={!canEdit} placeholder="Descrição do risco no contexto da empresa…" value={v.descricao} onChange={(e) => put({ descricao: e.target.value }, false)} onBlur={() => salvar({}, `RIPD: ${r.label}`)} />
                  <Textarea rows={2} disabled={!canEdit} placeholder="Medidas de mitigação…" value={v.mitig} onChange={(e) => put({ mitig: e.target.value }, false)} onBlur={() => salvar({}, `RIPD: ${r.label}`)} />
                </div>
              </div>
            );
          })}
        </div>
        <label className="mt-4 block text-xs text-muted-foreground">Barreira mitigadora principal · Escudo Digital (Bloco 3)
          <Textarea rows={3} disabled={!canEdit} value={escudo} onChange={(e) => setEscudo(e.target.value)} onBlur={() => salvar({}, "RIPD: Escudo Digital")} />
        </label>
        {salvo && <p className="mt-2 text-xs text-muted-foreground">Salvo em {new Date(salvo.atualizado_em).toLocaleString("pt-BR")}</p>}
      </Panel>

      <Panel title="Simulador do Escudo Jurídico de Dosimetria · Res. CD/ANPD nº 4/2023">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">A redução é calculada a partir dos mesmos riscos do RIPD acima: risco inerente 5×5 = {INE} contra o risco residual de cada linha.</p>
            {efetivos.map((e) => (
              <div key={e.id} data-testid={`sim-${e.id}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-xs">{e.label}</span>
                  <span className="font-mono text-xs">{INE} → {e.prob}×{e.imp} = {e.prob * e.imp}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-success" style={{ width: `${((INE - e.prob * e.imp) / (INE - 1)) * 100}%` }} /></div>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground" data-testid="calculo-reducao">Redução = {TETO_REDUCAO}% × ({efetivos.map((e) => `${INE}−${e.prob * e.imp}`).join(" + ")}) ÷ ({efetivos.length} × {INE - 1}) = {TETO_REDUCAO}% × {ganho} ÷ {efetivos.length * (INE - 1)} = {reducao}% (teto {TETO_REDUCAO}%)</p>
              <div className="mt-1 h-4 rounded-full bg-muted"><div className="h-4 rounded-full bg-success transition-all" style={{ width: `${(reducao / TETO_REDUCAO) * 100}%` }} /></div>
            </div>
          </div>
          <div className="space-y-3 rounded-md border p-5">
            <label className="text-xs text-muted-foreground">Valor-base hipotético da multa
              <Input type="number" min={0} value={base} onChange={(e) => setBase(Math.max(0, +e.target.value))} />
            </label>
            <div className="flex items-end gap-3">
              <div className="flex-1 text-center"><div className="mx-auto w-10 rounded-t bg-destructive" style={{ height: 120 }} /><p className="mt-1 text-[10px]">Risco inerente</p><p className="font-mono text-xs">{brl(base)}</p></div>
              <div className="flex-1 text-center"><div className="mx-auto w-10 rounded-t bg-success" style={{ height: 120 * (1 - reducao / 100) }} /><p className="mt-1 text-[10px]">Risco residual</p><p className="font-mono text-xs">{brl(multaComAtenuantes(base, reducao))}</p></div>
            </div>
            <p className="text-center font-mono text-3xl font-semibold text-success" data-testid="reducao">−{reducao}%</p>
            <p className="text-xs text-muted-foreground">Estimativa facultativa; o valor real da sanção depende da análise da ANPD.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Responsáveis pelas assinaturas do PI-05">
        <ul className="space-y-1 text-sm">
          {pendSig.map((p) => <li key={p.id} data-testid={`resp-${p.id}`} className="flex flex-wrap justify-between gap-2"><span>{p.titulo}</span><span className="text-xs text-muted-foreground">{p.estado === "ok" ? "Assinado" : p.exige}</span></li>)}
        </ul>
      </Panel>

      <PIOutput pi="PI-05: Escudo Jurídico de Dosimetria" ready={ready} readyHint="Preencha o sistema avaliado, o Escudo Digital e a mitigação de cada risco de IA." dual>
        <h3 className="font-semibold">RIPD – {sistema}</h3>
        <ul className="list-disc pl-5">{efetivos.map((e) => <li key={e.id}>{e.label}: risco residual {e.prob * e.imp} (inerente {INE}). {e.descricao} Mitigação: {e.mitig}</li>)}</ul>
        <p className="mt-2"><b>Barreira principal:</b> {escudo}</p>
        <h3 className="mt-4 font-semibold">Dosimetria</h3>
        <p>Redução de {reducao}% da multa-base, derivada dos riscos residuais acima (Res. CD/ANPD nº 4/2023). Estimativa facultativa; o valor real da sanção depende da análise da ANPD.</p>
      </PIOutput>

      {signatures["PI-05"] && (
        <Panel title="Ciclo Privacium Semestral concluído" className="border-success">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <PartyPopper className="h-10 w-10 text-success" />
            <p className="text-xl font-semibold text-primary">Conformidade estrutural alcançada · Ano Fiscal {anoAtual}</p>
            <p className="max-w-lg text-sm text-muted-foreground">Os cinco Produtos Internos estão chancelados por DPO e Diretoria. Ao finalizar, o ciclo é arquivado com a redução de {reducao}% e o Ano Fiscal {anoAtual + 1} começa pelo Bloco 1.</p>
            <Button onClick={finalizar} disabled={!demo && (busy || !canEdit)}><RefreshCw className="h-4 w-4" /> Finalizar Ciclo Privacium Semestral</Button>
          </div>
        </Panel>
      )}

      {ciclos.rows.length > 0 && (
        <Panel title="Ciclos arquivados">
          <ul className="divide-y text-sm">{ciclos.rows.map((c) => <li key={c.id} className="flex justify-between py-2"><span>Ano Fiscal {c.ano_fiscal}</span><span className="font-mono text-xs">−{c.reducao_dosimetria}% · {new Date(c.finalizado_em).toLocaleDateString("pt-BR")}</span></li>)}</ul>
        </Panel>
      )}
    </div>
  );
}
