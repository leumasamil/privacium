import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { AJUDA } from "@/lib/priva/ajuda";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, FileDown, Hash, Lock, Play, Send, Timer } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { maskCNPJ, sha256 } from "@/lib/priva/data";
import { slaRestante } from "@/lib/priva/dosimetria";
import { cn } from "@/lib/utils";
import { usePriva } from "@/lib/priva/store";
import { useCnpjRows } from "@/lib/priva/useCnpjRows";
import { DEMO_SLA_MS } from "@/lib/priva/demo";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Lote = Database["public"]["Tables"]["lotes_pgaudit"]["Row"];
type Incidente = Database["public"]["Tables"]["incidentes_seguranca"]["Row"];

export const Route = createFileRoute("/_authenticated/bloco-4")({
  head: () => ({
    meta: [
      { title: "Bloco 4 · Vigiar e Responder — Privacium" },
      { name: "description", content: "Console forense pgAudit com hash SHA-256, gestão de crise de ransomware e SLA de 72h da ANPD." },
      { property: "og:title", content: "Bloco 4 · Vigiar e Responder — Privacium" },
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
  { k: "incidente", l: "Número do incidente", ph: "Ex.: a54ac7 (copie do console forense acima)", h: "Identificador curto do incidente ativo; use o botão ao lado para preencher." },
  { k: "natureza", l: "Natureza do incidente", ph: "Ex.: ransomware com criptografia do servidor de arquivos", h: "Descreva o tipo de ataque ou falha e o sistema atingido." },
  { k: "categorias", l: "Categorias de dados pessoais afetados", ph: "Selecione os campos 4 e 5 registrados no ROT deste processo.", h: "Liste o dado pessoal e o dado pessoal sensível atingidos, conforme o ROT." },
  { k: "titulares", l: "Número aproximado de titulares afetados", ph: "Ex.: 1240", h: "Estimativa numérica; pode ser revisada depois na comunicação complementar." },
  { k: "riscos", l: "Riscos e consequências aos titulares", ph: "Ex.: Risco de acesso não autorizado a dados pessoais e indisponibilidade temporária. Dados restaurados de backup íntegro, sem indício de exfiltração.", h: "O que pode acontecer aos titulares e o que já foi constatado." },
  { k: "medidas", l: "Medidas técnicas e de segurança adotadas", ph: "Ex.: Isolamento de endpoints, contenção em sandbox, restauração por backup íntegro com validação de hash SHA-256.", h: "Ações de contenção e recuperação executadas nas etapas 1 a 5." },
  { k: "encarregado", l: "Contato do Encarregado (DPO)", ph: "Ex.: dpo@empresa.com.br", h: "E-mail do DPO_OPERACIONAL cadastrado em Membros." },
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
      <PageHeader eyebrow="Bloco 4 · (V) Ciclo Privacium Semestral · ISO 27037" title="Vigiar a Privacidade e Processar Incidentes" />
      <AjudaTarefa {...AJUDA[4]!} />
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
    doc.setFontSize(14); doc.setFontSize(8); doc.text("Emitido pelo Ecossistema de Governança Privacium", 14, 10); doc.setFontSize(14); doc.text("PI-04: Dossiê de Auditoria de Logs e Resposta de Célula", 14, 18);
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
    <Panel id="lotes" title="Console forense · pgAudit (trilhas mensais)" action={canEdit && <Button size="sm" onClick={extrair} disabled={busy}><Play className="h-4 w-4" /> Extrair lote de {mesAtual()}</Button>}>
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
  const { log, demo, email, roles } = usePriva();
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const [form, setForm] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const dpoEmail = roles.includes("DPO_OPERACIONAL") ? email ?? "" : "";
  useEffect(() => {
    const salvo = (ativo?.comunicacao ?? {}) as Record<string, string>;
    setForm({ ...salvo, encarregado: salvo["encarregado"] || dpoEmail });
  }, [ativo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ref = ativo ? ativo.id.slice(0, 6) : "";
  const passos = ativo?.passos ?? [false, false, false, false, false, false];
  const atual = passos.findIndex((p) => !p);
  const restante = demo ? DEMO_SLA_MS : slaRestante(ativo?.iniciado_em ?? null, now);
  const tom = !ativo ? "neutro" : restante === 0 && !ativo.enviado_anpd_em ? "vencido" : restante < 24 * 3600000 ? "atencao" : "andamento";
  const TOM_SLA = {
    neutro: { caixa: "", texto: "text-primary", rotulo: "Nenhum incidente ativo" },
    andamento: { caixa: "border-andamento-border bg-andamento-bg", texto: "text-andamento", rotulo: "Em andamento · mais de 24h" },
    atencao: { caixa: "border-atencao-border bg-atencao-bg", texto: "text-atencao", rotulo: "Atenção · menos de 24h" },
    vencido: { caixa: "border-vencido-border bg-vencido-bg", texto: "text-vencido", rotulo: "Vencido" },
  }[tom];

  const upd = async (patch: Database["public"]["Tables"]["incidentes_seguranca"]["Update"], detail: string) => {
    if (!ativo) return false;
    const { error } = await supabase.from("incidentes_seguranca").update(patch).eq("id", ativo.id);
    if (error) { toast.error("Falha ao salvar."); return false; }
    log("UPDATE", "incidentes_seguranca", detail);
    refresh();
    qc.invalidateQueries({ queryKey: ["pendencias"] });
    return true;
  };
  const declarar = async () => {
    const { error } = await supabase.from("incidentes_seguranca").insert({ empresa_cnpj: cnpj });
    if (error) { toast.error("Falha ao declarar."); return; }
    log("INSERT", "incidentes_seguranca", "Incidente de ransomware declarado · SLA 72h iniciado");
    refresh();
    qc.invalidateQueries({ queryKey: ["pendencias"] });
  };
  const concluirEtapa = async (i: number) => {
    if (!ativo) return;
    const ok = await upd({ passos: ativo.passos.map((x, j) => (j === i ? true : x)) }, `Passo ${i + 1} (${STEPS[i]!.t}) concluído`);
    if (ok) setTimeout(() => (i + 1 < 5 ? stepsRef.current?.querySelector(`[data-step="${i + 1}"]`) : formRef.current)?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  };

  const faltam = FORM.filter((f) => (form[f.k] ?? "").trim().length <= 2);
  const etapasOk = passos.slice(0, 5).every(Boolean);
  const podeEditarForm = canEdit && !!ativo && !ativo.enviado_anpd_em;

  // Foco automático no primeiro campo obrigatório vazio quando o formulário é liberado.
  useEffect(() => {
    if (!podeEditarForm || !etapasOk) return;
    const k = FORM.find((f) => (form[f.k] ?? "").trim().length <= 2)?.k;
    if (k) document.getElementById(`anpd-${k}`)?.focus({ preventScroll: true });
  }, [podeEditarForm, etapasOk, ativo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const irPara = (k: string) => { const el = document.getElementById(`anpd-${k}`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); el?.focus({ preventScroll: true }); };

  return (
    <Panel id="incidentes" title="Gerenciamento de Crise Cibernética · Ransomware" action={canEdit && (ativo
      ? <Button size="sm" variant="outline" disabled={!ativo.passos.every(Boolean) || !ativo.enviado_anpd_em} onClick={() => upd({ encerrado_em: new Date().toISOString() }, "Incidente encerrado")}>Encerrar incidente</Button>
      : <Button size="sm" variant="outline" onClick={declarar}>Declarar incidente</Button>)}>
      {ativo && <p className="mb-3 text-sm">Incidente ativo: <span className="font-mono font-semibold text-primary">#{ref}</span></p>}

      {/* Barra de etapas */}
      <ol ref={stepsRef} className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Etapas do incidente">
        {STEPS.map((s, i) => {
          const feito = !!passos[i];
          const corrente = !!ativo && i === atual;
          const bloqueado = !ativo || (!feito && !corrente);
          return (
            <li key={s.t} data-step={i} className={cn("relative rounded-md border p-3 text-xs transition-all duration-300",
              feito && "border-concluido-border bg-concluido-bg",
              corrente && "border-2 border-pendencia-border bg-pendencia-bg shadow-md",
              bloqueado && "border-bloqueado-border bg-bloqueado-bg opacity-80")}>
              <div className="flex items-center gap-2">
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
                  feito ? "bg-concluido text-primary-foreground" : corrente ? "bg-pendencia text-primary-foreground" : "bg-muted text-bloqueado")}>
                  {feito ? <Check className="h-3.5 w-3.5" aria-hidden /> : bloqueado ? <Lock className="h-3 w-3" aria-hidden /> : i + 1}
                </span>
                <span className={cn("font-semibold", feito ? "text-concluido" : corrente ? "text-pendencia" : "text-bloqueado")}>{s.t}</span>
              </div>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
                {feito ? <span className="text-concluido">Concluída</span> : corrente ? <span className="text-pendencia">Você está aqui</span> : <span className="text-bloqueado">Bloqueada</span>}
              </p>
              {corrente && (
                <>
                  <p className="mt-1 text-muted-foreground">{s.d}</p>
                  {i === 5 ? <p className="mt-1 text-pendencia">Consome o SLA de 72h · preencha o formulário abaixo.</p>
                    : canEdit && <Button size="sm" variant="outline" className="mt-2 h-7 w-full" onClick={() => concluirEtapa(i)}>Marcar como concluída</Button>}
                </>
              )}
              {feito && canEdit && ativo && !ativo.enviado_anpd_em && i < 5 && passos[i + 1] === false && (
                <button className="mt-1 text-[10px] text-muted-foreground underline" onClick={() => upd({ passos: ativo.passos.map((x, j) => (j === i ? false : x)) }, `Passo ${i + 1} (${s.t}) reaberto`)}>Reabrir</button>
              )}
            </li>
          );
        })}
      </ol>

      {/* SLA com contexto */}
      <div className={cn("grid gap-4 rounded-md border p-4 md:grid-cols-[220px_1fr]", TOM_SLA.caixa)}>
        <div className="text-center">
          <Timer className={cn("mx-auto h-5 w-5", TOM_SLA.texto)} aria-hidden />
          <p className={cn("mt-1 font-mono text-3xl font-semibold", TOM_SLA.texto)}>{fmt(restante)}</p>
          <p className={cn("mt-1 text-xs font-semibold uppercase", TOM_SLA.texto)}>{TOM_SLA.rotulo}</p>
          {ativo?.enviado_anpd_em && <div className="mt-2"><Tag tone="success">ANPD comunicada</Tag></div>}
        </div>
        <ul className="space-y-1 text-xs text-foreground">
          <li><b>O que mede:</b> Prazo de comunicação à ANPD — Res. CD/ANPD nº 15/2024. Vinculado à etapa 6 (Reporte).</li>
          <li><b>Ao zerar:</b> Após o prazo, o incidente é marcado como comunicado em atraso e a trilha registra o descumprimento.</li>
          <li><b>Pausas:</b> nenhuma ação pausa o contador — é prazo legal.</li>
        </ul>
      </div>

      {ativo && (
        <div ref={formRef} id="anpd" className="mt-6 scroll-mt-6 rounded-md border p-4">
          <p className="font-semibold text-primary">Comunicação de Incidente de Segurança à ANPD (simulação)</p>
          {!etapasOk && <p className="mt-1 text-xs text-pendencia">Conclua as etapas 1 a 5 acima para liberar o envio. Você já pode adiantar o preenchimento.</p>}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {FORM.map((f) => {
              const props = {
                id: `anpd-${f.k}`, disabled: !podeEditarForm, placeholder: f.ph, value: form[f.k] ?? "",
                "aria-describedby": `anpd-${f.k}-h`,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [f.k]: e.target.value }),
                onBlur: () => upd({ comunicacao: form as Json }, `Formulário ANPD: ${f.l}`),
              };
              return (
                <div key={f.k} className={f.k === "riscos" || f.k === "medidas" ? "md:col-span-2" : ""}>
                  <label htmlFor={`anpd-${f.k}`} className="text-xs font-medium text-foreground">{f.l} *</label>
                  <div className="mt-1 flex gap-2">
                    {f.k === "riscos" || f.k === "medidas" ? <Textarea rows={2} {...props} /> : <Input {...props} />}
                    {f.k === "incidente" && podeEditarForm && form["incidente"] !== ref && (
                      <Button type="button" size="sm" variant="outline" onClick={() => { const n = { ...form, incidente: ref }; setForm(n); upd({ comunicacao: n as Json }, "Formulário ANPD: número do incidente"); }}>Usar #{ref}</Button>
                    )}
                  </div>
                  <p id={`anpd-${f.k}-h`} className="mt-1 text-[11px] text-muted-foreground">{f.h}</p>
                  {f.k === "encarregado" && !dpoEmail && !(form["encarregado"] ?? "").trim() && (
                    <p className="mt-1 text-[11px] text-atencao">Nenhum DPO identificado nesta sessão. <Link to="/membros" className="underline">Cadastre o DPO em Membros</Link>.</p>
                  )}
                </div>
              );
            })}
          </div>
          {!ativo.enviado_anpd_em && faltam.length > 0 && (
            <p className="mt-3 text-xs text-pendencia">
              Faltam {faltam.length} campo{faltam.length > 1 ? "s" : ""}: {faltam.map((f) => f.l).join(", ")}.{" "}
              <button className="font-semibold underline" onClick={() => irPara(faltam[0]!.k)}>Ir para o primeiro campo vazio</button>
            </p>
          )}
          {!ativo.enviado_anpd_em && faltam.length === 0 && !etapasOk && <p className="mt-3 text-xs text-pendencia">Faltam as etapas {passos.slice(0, 5).map((p, i) => (p ? null : i + 1)).filter(Boolean).join(", ")} do incidente.</p>}
          <Button className="mt-3" variant="outline" disabled={!podeEditarForm || faltam.length > 0 || !etapasOk}
            onClick={async () => {
              const ok = await upd({ comunicacao: form as Json, enviado_anpd_em: new Date().toISOString(), passos: ativo.passos.map((x, j) => (j === 5 ? true : x)) }, "Comunicação enviada à ANPD (simulado)");
              if (ok) toast.success("Comunicação registrada. Próximo passo: encerrar o incidente e assinar o PI-04.");
            }}>
            <Send className="h-4 w-4" /> {ativo.enviado_anpd_em ? `Enviado em ${new Date(ativo.enviado_anpd_em).toLocaleString("pt-BR")}` : "Realizar a comunicação à ANPD (simulação)"}
          </Button>
        </div>
      )}
    </Panel>
  );
}
