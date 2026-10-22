import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileDown, Hash, Play, Send, Timer } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { maskCNPJ, sha256 } from "@/lib/priva/data";
import { slaRestante } from "@/lib/priva/dosimetria";
import { usePriva } from "@/lib/priva/store";
import { useCnpjRows } from "@/lib/priva/useCnpjRows";
import { DEMO_SLA_MS } from "@/lib/priva/demo";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Lote = Database["public"]["Tables"]["lotes_pgaudit"]["Row"];
type Incidente = Database["public"]["Tables"]["incidentes_seguranca"]["Row"];

export const Route = createFileRoute("/_authenticated/bloco-4")({
  head: () => ({
    meta: [
      { title: "Bloco 4 · Vigiar e Responder — PRIVA 2EC" },
      { name: "description", content: "Console forense pgAudit com hash SHA-256, gestão de crise de ransomware e SLA de 72h da ANPD." },
      { property: "og:title", content: "Bloco 4 · Vigiar e Responder — PRIVA 2EC" },
      { property: "og:description", content: "Console forense pgAudit com hash SHA-256, gestão de crise de ransomware e SLA de 72h da ANPD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <BlockGate n={4}><Bloco4 /></BlockGate>,
});

const STEPS = [
  { t: "Isolamento", d: "Desconectar da rede os endpoints e segmentos afetados, sem desligar as máquinas." },
  { t: "Invocação", d: "Acionar a Célula de Resposta (DPO, TI, Jurídico e Diretoria) e abrir o registro do incidente." },
  { t: "Sandbox", d: "Analisar a amostra do ransomware em ambiente isolado e preservar evidências (ISO 27037)." },
  { t: "Descriptografia", d: "Restaurar a partir de backups íntegros ou ferramentas de descriptografia validadas." },
  { t: "Validação", d: "Conferir hashes de integridade dos dados restaurados e encerrar a contenção." },
  { t: "Reporte", d: "Comunicar a ANPD e os titulares (Res. CD/ANPD nº 15/2024) dentro do prazo de 72h." },
];

const FORM = [
  { k: "natureza", l: "Natureza do incidente", ph: "Ex.: ransomware com criptografia do servidor de arquivos" },
  { k: "categorias", l: "Categorias de dados pessoais afetados", ph: "Ex.: nome, CPF, dados de saúde ocupacional" },
  { k: "titulares", l: "Número aproximado de titulares afetados", ph: "Ex.: 1.250" },
  { k: "riscos", l: "Riscos e consequências aos titulares", ph: "Ex.: fraude de identidade, discriminação" },
  { k: "medidas", l: "Medidas técnicas e de segurança adotadas", ph: "Ex.: isolamento, restauração de backup, troca de credenciais" },
  { k: "encarregado", l: "Contato do Encarregado (DPO)", ph: "Ex.: dpo@empresa.com.br" },
] as const;

const mesAtual = () => new Date().toISOString().slice(0, 7);
const fmt = (ms: number) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

function Bloco4() {
  const { cnpj, roles, log, demo } = usePriva();
  const canEdit = !demo && (roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA"));
  const lotes = useCnpjRows("lotes_pgaudit", cnpj, "mes_referencia");
  const incs = useCnpjRows("incidentes_seguranca", cnpj, "iniciado_em");
  const ativo = incs.rows.find((i) => !i.encerrado_em) ?? null;
  const encerrado = incs.rows.find((i) => i.encerrado_em && i.passos.every(Boolean) && i.enviado_anpd_em);

  useEffect(() => { if (cnpj) log("SELECT", "lotes_pgaudit", "Abertura do console forense do Bloco 4"); }, [cnpj, log]);

  if (!cnpj) return <Panel title="Vigilância"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;

  const lotesComHash = lotes.rows.filter((l) => l.hash_sha256);
  const pronto = lotesComHash.length > 0 && !!encerrado;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 4 · (V) Ciclo PRIVA · ISO 27037" title="Vigiar a Privacidade e Processar Incidentes" />
      <ConsolePgAudit cnpj={cnpj} lotes={lotes.rows} canEdit={canEdit} refresh={lotes.refresh} />
      <CriseRansomware cnpj={cnpj} ativo={ativo} canEdit={canEdit} refresh={incs.refresh} />
      <PIOutput pi="PI-04: Dossiê de Auditoria de Logs e Resposta de Célula" ready={pronto} readyHint="Gere ao menos um lote pgAudit com hash e conclua um incidente com os 6 passos e comunicação à ANPD." dual>
        <p><b>CNPJ:</b> {maskCNPJ(cnpj)}</p>
        <p className="mt-2"><b>Lotes com cadeia de custódia:</b></p>
        <ul className="list-disc pl-5 font-mono text-xs">{lotesComHash.map((l) => <li key={l.id}>{l.mes_referencia} · {l.linhas} linhas · {l.hash_sha256}</li>)}</ul>
        {encerrado && <p className="mt-2"><b>Incidente encerrado:</b> declarado em {new Date(encerrado.iniciado_em).toLocaleString("pt-BR")}, comunicado à ANPD em {new Date(encerrado.enviado_anpd_em ?? "").toLocaleString("pt-BR")}.</p>}
      </PIOutput>
    </div>
  );
}

function ConsolePgAudit({ cnpj, lotes, canEdit, refresh }: { cnpj: string; lotes: Lote[]; canEdit: boolean; refresh: () => void }) {
  const { log } = usePriva();
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const atual = lotes.find((l) => l.id === sel) ?? lotes[0];

  const extrair = async () => {
    setBusy(true);
    const mes = mesAtual();
    const inicio = `${mes}-01T00:00:00Z`;
    const { data, error } = await supabase.from("trilha_auditoria_sistema")
      .select("seq,ts,user_email,op,target,detail,hash").eq("cnpj", cnpj).gte("ts", inicio).order("seq");
    if (error) { setBusy(false); toast.error("Falha ao ler a trilha."); return; }
    const linhas = (data ?? []).map((r) => `${r.ts} | ${r.user_email ?? "-"} | ${r.op} ${r.target} | ${r.detail} | ${r.hash.slice(0, 12)}`);
    const conteudo = [`-- pgAudit · extração mensal ${mes} · CNPJ ${maskCNPJ(cnpj)}`, ...linhas].join("\n");
    const { error: e2 } = await supabase.from("lotes_pgaudit").upsert(
      { empresa_cnpj: cnpj, mes_referencia: mes, linhas: linhas.length, conteudo, hash_sha256: null },
      { onConflict: "empresa_cnpj,mes_referencia" });
    setBusy(false);
    if (e2) { toast.error("Não foi possível salvar o lote."); return; }
    log("INSERT", "lotes_pgaudit", `Extração mensal ${mes} (${linhas.length} linhas)`);
    refresh();
  };

  const calcularHash = async (l: Lote) => {
    const h = await sha256(l.conteudo);
    const { error } = await supabase.from("lotes_pgaudit").update({ hash_sha256: h }).eq("id", l.id);
    if (error) { toast.error("Falha ao gravar o hash."); return; }
    log("UPDATE", "lotes_pgaudit", `Hash SHA-256 do lote ${l.mes_referencia}: ${h.slice(0, 16)}…`);
    refresh();
  };

  const gerarPdf = (l: Lote) => {
    const doc = new jsPDF();
    doc.setFontSize(14); doc.text("PI-04: Dossiê de Auditoria de Logs e Resposta de Célula", 14, 18);
    doc.setFontSize(9);
    const meta = [
      `CNPJ: ${maskCNPJ(cnpj)}   Mês de referência: ${l.mes_referencia}   Linhas: ${l.linhas}`,
      `Gerado em: ${new Date(l.gerado_em).toLocaleString("pt-BR")}`,
      `Hash SHA-256 (cadeia de custódia ISO 27037): ${l.hash_sha256 ?? "não calculado"}`,
      "Procedimento: identificação, coleta, aquisição e preservação; qualquer alteração invalida o hash.",
    ];
    doc.text(meta, 14, 28);
    doc.setFont("courier", "normal"); doc.setFontSize(7);
    const corpo = doc.splitTextToSize(l.conteudo, 180) as string[];
    let y = 52;
    for (const linha of corpo) { if (y > 270) { doc.addPage(); y = 16; } doc.text(linha, 14, y); y += 3.6; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text(["", "Assinatura do DPO (Gov.br): ______________________________", "", "Assinatura da Diretoria (Gov.br): ______________________________"], 14, y + 8);
    doc.save(`PI-04_${l.mes_referencia}.pdf`);
    log("SELECT", "lotes_pgaudit", `PDF do dossiê ${l.mes_referencia} gerado`);
  };

  return (
    <Panel title="Console forense · pgAudit (trilhas mensais)" action={canEdit && <Button size="sm" onClick={extrair} disabled={busy}><Play className="h-4 w-4" /> Extrair lote de {mesAtual()}</Button>}>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ul className="space-y-2">
          {lotes.length === 0 && <li className="text-sm text-muted-foreground">Nenhum lote extraído.</li>}
          {lotes.map((l) => (
            <li key={l.id} className={`rounded-sm border p-3 text-sm ${atual?.id === l.id ? "border-primary" : ""}`}>
              <button className="w-full text-left" onClick={() => setSel(l.id)}>
                <p className="font-mono font-semibold text-primary">{l.mes_referencia}</p>
                <p className="text-xs text-muted-foreground">{l.linhas} linhas</p>
              </button>
              {l.hash_sha256 ? <p className="mt-1 break-all font-mono text-[10px] text-success">{l.hash_sha256}</p> : <Tag tone="warning">Sem hash</Tag>}
              <div className="mt-2 flex gap-2">
                {canEdit && !l.hash_sha256 && <Button size="sm" variant="outline" onClick={() => calcularHash(l)}><Hash className="h-3 w-3" /> SHA-256</Button>}
                <Button size="sm" variant="outline" disabled={!l.hash_sha256} onClick={() => gerarPdf(l)}><FileDown className="h-3 w-3" /> PDF PI-04</Button>
              </div>
            </li>
          ))}
        </ul>
        <pre className="max-h-[320px] min-h-[200px] overflow-auto rounded-sm bg-primary p-4 font-mono text-xs text-primary-foreground">{atual?.conteudo || "$ aguardando extração…"}</pre>
      </div>
    </Panel>
  );
}

function CriseRansomware({ cnpj, ativo, canEdit, refresh }: { cnpj: string; ativo: Incidente | null; canEdit: boolean; refresh: () => void }) {
  const { log, demo } = usePriva();
  const [now, setNow] = useState(Date.now());
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { setForm((ativo?.comunicacao ?? {}) as Record<string, string>); }, [ativo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const restante = demo ? DEMO_SLA_MS : slaRestante(ativo?.iniciado_em ?? null, now);
  const upd = async (patch: Database["public"]["Tables"]["incidentes_seguranca"]["Update"], detail: string) => {
    if (!ativo) return;
    const { error } = await supabase.from("incidentes_seguranca").update(patch).eq("id", ativo.id);
    if (error) { toast.error("Falha ao salvar."); return; }
    log("UPDATE", "incidentes_seguranca", detail);
    refresh();
  };
  const declarar = async () => {
    const { error } = await supabase.from("incidentes_seguranca").insert({ empresa_cnpj: cnpj });
    if (error) { toast.error("Falha ao declarar."); return; }
    log("INSERT", "incidentes_seguranca", "Incidente de ransomware declarado · SLA 72h iniciado");
    refresh();
  };
  const formOk = FORM.every((f) => (form[f.k] ?? "").trim().length > 2);

  return (
    <Panel title="Gerenciamento de Crise Cibernética · Ransomware" action={canEdit && (ativo
      ? <Button size="sm" variant="outline" disabled={!ativo.passos.every(Boolean) || !ativo.enviado_anpd_em} onClick={() => upd({ encerrado_em: new Date().toISOString() }, "Incidente encerrado")}>Encerrar incidente</Button>
      : <Button size="sm" variant="destructive" onClick={declarar}>Declarar incidente</Button>)}>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className={`rounded-md border p-5 text-center ${ativo ? (restante < 24 * 3600000 ? "border-destructive" : "border-warning") : ""}`}>
          <Timer className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className={`mt-2 font-mono text-3xl font-semibold ${ativo && restante < 24 * 3600000 ? "text-destructive" : "text-primary"}`}>{fmt(restante)}</p>
          <p className="mt-1 text-xs text-muted-foreground">SLA de 72h · Res. CD/ANPD nº 15/2024</p>
          {ativo?.enviado_anpd_em && <div className="mt-2"><Tag tone="success">ANPD comunicada</Tag></div>}
          {ativo && restante === 0 && !ativo.enviado_anpd_em && <div className="mt-2"><Tag tone="destructive">Prazo vencido</Tag></div>}
        </div>
        <ol className="space-y-2">
          {STEPS.map((s, i) => (
            <li key={s.t} className="flex items-start gap-3 rounded-sm border bg-background px-3 py-2 text-sm">
              <Checkbox className="mt-0.5" disabled={!canEdit || !ativo || (i > 0 && !ativo.passos[i - 1])} checked={!!ativo?.passos[i]}
                onCheckedChange={(v) => ativo && upd({ passos: ativo.passos.map((x, j) => (j === i ? !!v : x)) }, `Passo ${i + 1} (${s.t}) ${v ? "concluído" : "reaberto"}`)} />
              <div><p className="font-semibold text-primary"><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span> {s.t}</p><p className="text-xs text-muted-foreground">{s.d}</p></div>
            </li>
          ))}
        </ol>
      </div>

      {ativo && (
        <div className="mt-6 rounded-md border p-4">
          <p className="font-semibold text-primary">Comunicação de Incidente de Segurança à ANPD (simulação)</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {FORM.map((f) => (
              <label key={f.k} className="text-xs text-muted-foreground">{f.l}
                {f.k === "riscos" || f.k === "medidas"
                  ? <Textarea rows={2} disabled={!canEdit || !!ativo.enviado_anpd_em} placeholder={f.ph} value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} onBlur={() => upd({ comunicacao: form as Json }, `Formulário ANPD: ${f.l}`)} />
                  : <Input disabled={!canEdit || !!ativo.enviado_anpd_em} placeholder={f.ph} value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} onBlur={() => upd({ comunicacao: form as Json }, `Formulário ANPD: ${f.l}`)} />}
              </label>
            ))}
          </div>
          <Button className="mt-3" disabled={!canEdit || !formOk || !!ativo.enviado_anpd_em || !ativo.passos.slice(0, 5).every(Boolean)}
            onClick={async () => { await upd({ comunicacao: form as Json, enviado_anpd_em: new Date().toISOString(), passos: ativo.passos.map((x, j) => (j === 5 ? true : x)) }, "Comunicação enviada à ANPD (simulado)"); toast.success("Comunicação registrada (envio simulado)."); }}>
            <Send className="h-4 w-4" /> {ativo.enviado_anpd_em ? `Enviado em ${new Date(ativo.enviado_anpd_em).toLocaleString("pt-BR")}` : "Enviar à ANPD (simulado)"}
          </Button>
          {!ativo.enviado_anpd_em && <p className="mt-1 text-xs text-muted-foreground">Requer os passos 1 a 5 concluídos e todos os campos preenchidos.</p>}
        </div>
      )}
    </Panel>
  );
}
