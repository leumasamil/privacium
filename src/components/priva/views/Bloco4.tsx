import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { FormularioANPD } from "@/components/priva/FormularioANPD";
import { restanteANPD } from "@/lib/priva/anpd";
import { SLA_MS } from "@/lib/priva/dosimetria";
import { linhasNaturezas } from "@/lib/priva/naturezasIncidente";
import { linhasRiscos } from '@/lib/priva/riscosIncidente';
import { linhasMedidas } from '@/lib/priva/medidasIncidente';
import { linhasCategorias } from '@/lib/priva/categoriasANPD';
import { useEncarregado } from "@/lib/priva/useEncarregado";
import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { Sigla } from "@/components/priva/Sigla";
import { AJUDA } from "@/lib/priva/ajuda";
import { AppLink as Link } from "@/components/priva/AppLink";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, AlertTriangle, OctagonAlert, FileDown, Hash, Lock, Play, Timer } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { maskCNPJ, sha256 } from "@/lib/priva/data";
import { cn } from "@/lib/utils";
import { usePriva } from "@/lib/priva/store";
import { DEMO_SLA_MS } from "@/lib/priva/demo";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { useEstadoBloco4 } from '@/lib/priva/useEstadoBloco4';
import { montarChecklist } from '@/lib/priva/pendencias';
import type { EstadoIncidente } from '@/lib/priva/estadoIncidente';
import { EncerrarIncidente } from '@/components/priva/EncerrarIncidente';
import { ConsultarBasesPublicas } from '@/components/priva/ConsultarBasesPublicas';
import { PainelNoticiasIncidentes } from '@/components/priva/PainelNoticiasIncidentes';
import { AlertaFornecedorVazado } from '@/components/priva/AlertaFornecedorVazado';

type Lote = Database["public"]["Tables"]["lotes_pgaudit"]["Row"];
type Incidente = Database["public"]["Tables"]["incidentes_seguranca"]["Row"];



const STEPS = [
  { t: "Isolamento", d: "Desconectar da rede os endpoints e segmentos afetados, sem desligar as máquinas." },
  { t: "Invocação", d: "Acionar a Célula de Resposta (DPO, TI, Jurídico e Diretoria) e abrir o registro do incidente." },
  { t: "Sandbox", d: "Analisar a amostra do ransomware em ambiente isolado e preservar evidências (ISO 27037)." },
  { t: "Descriptografia", d: "Restaurar a partir de backups íntegros ou ferramentas de descriptografia validadas." },
  { t: "Validação", d: "Conferir hashes de integridade dos dados restaurados e encerrar a contenção." },
  { t: "Reporte", d: "Comunicar a ANPD e os titulares em até 3 dias úteis (Res. CD/ANPD nº 15/2024, art. 6º)." },
];

const mesAtual = () => new Date().toISOString().slice(0, 7);
const fmt = (ms: number) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

export function Bloco4() {
  const { cnpj, roles, log, demo, signatures } = usePriva();
  const canEdit = (roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA"));
  const consulta = useEstadoBloco4(cnpj);
  const lotes = { rows: consulta.data?.lotes ?? [], refresh: consulta.refresh };
  const incs = { rows: consulta.data?.incidentes ?? [], refresh: consulta.refresh };
  const ativo = incs.rows.find((i) => !i.encerrado_em) ?? null;
  const estado = consulta.data?.estados.find(e => e.incidente.id === ativo?.id) ?? null;
  const encerradoId = consulta.data?.estados.find(e => e.incidente.encerrado_em && e.etapas.concluidas === 6 && e.anpd.enviado)?.incidente.id;
  const encerrado = incs.rows.find(i => i.id === encerradoId);

  useEffect(() => { if (cnpj) log("SELECT", "lotes_pgaudit", "Abertura do console forense do Bloco 4"); }, [cnpj, log]);

  if (!cnpj) return <Panel title="Vigilância"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;
  if (consulta.isError) return <Panel title="Vigilância"><p role="alert">Não foi possível ler o estado dos incidentes.</p><Button onClick={() => demo ? avisarAcaoDemo() : void consulta.refetch()}>Tentar novamente</Button></Panel>;
  if (!consulta.data) return <p role="status">Lendo o estado dos incidentes…</p>;

  const lotesComHash = lotes.rows.filter((l) => l.hash_sha256);
  const pronto = lotesComHash.length > 0 && !!encerrado;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 4 · (V) Ciclo Privacium Semestral · ISO 27037" title="Vigiar a Privacidade e Processar Incidentes" />
      <AlertaFornecedorVazado />
      {AJUDA[4] && <AjudaTarefa {...AJUDA[4]} pendencias={montarChecklist(consulta.data, signatures)} />}
      <ConsolePgAudit cnpj={cnpj} lotes={lotes.rows} incidentes={incs.rows} canEdit={canEdit} refresh={lotes.refresh} />
      <CriseRansomware cnpj={cnpj} ativo={ativo} estado={estado} canEdit={canEdit} refresh={incs.refresh} />
      <PIOutput pi="PI-04: Dossiê de Auditoria de Logs e Resposta de Célula" ready={pronto} readyHint="Gere ao menos um lote pgAudit com hash e conclua um incidente com os 6 passos e comunicação à ANPD." dual>
        <p><b>CNPJ:</b> {maskCNPJ(cnpj)}</p>
        <p className="mt-2"><b>Lotes com cadeia de custódia:</b></p>
        <ul className="list-disc pl-5 font-mono text-xs">{lotesComHash.map((l) => <li key={l.id}>{l.mes_referencia} · {l.linhas} linhas · {l.hash_sha256}</li>)}</ul>
        {encerrado && <p className="mt-2"><b>Incidente encerrado:</b> declarado em {new Date(encerrado.iniciado_em).toLocaleString("pt-BR")}, comunicado à ANPD em {new Date(encerrado.enviado_anpd_em ?? "").toLocaleString("pt-BR")}.</p>}
        {encerrado && linhasNaturezas(encerrado.comunicacao).map(linha => <p key={linha} className="mt-2">{linha}</p>)}
        {encerrado && linhasRiscos(encerrado.comunicacao).map(linha => <p key={linha} className="mt-2">{linha}</p>)}
        {encerrado && linhasMedidas(encerrado.comunicacao).map(linha => <p key={linha} className="mt-2">{linha}</p>)}
        {encerrado && linhasCategorias(encerrado.comunicacao).map(linha => <p key={linha} className="mt-2">{linha}</p>)}
      </PIOutput>
      {/* Dado de terceiro não é evidência própria: referências ficam fora do
          PIOutput, docRef, PDFs, dossiê, trilha e hashes de todas as chancelas. */}
      <PainelNoticiasIncidentes />
    </div>
  );
}

function ConsolePgAudit({ cnpj, lotes, incidentes, canEdit, refresh }: { cnpj: string; lotes: Lote[]; incidentes: Incidente[]; canEdit: boolean; refresh: () => void }) {
  const { log, demo } = usePriva();
  const encarregado = useEncarregado();
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const atual = lotes.find((l) => l.id === sel) ?? lotes[0];

  const extrair = async () => {
    if (demo) return avisarAcaoDemo();
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
    if (demo) return avisarAcaoDemo();
    const h = await sha256(l.conteudo);
    const { error } = await supabase.from("lotes_pgaudit").update({ hash_sha256: h }).eq("id", l.id);
    if (error) { toast.error("Falha ao gravar o hash."); return; }
    log("UPDATE", "lotes_pgaudit", `Hash SHA-256 do lote ${l.mes_referencia}: ${h.slice(0, 16)}…`);
    refresh();
  };

  const gerarPdf = (l: Lote) => {
    if (demo) return avisarAcaoDemo();
    // Apenas atos da empresa e contato DPO; referências externas nunca entram
    // neste dossiê, no PDF ou em seu hash encadeado.
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
    for (const incidente of incidentes.filter(i => i.enviado_anpd_em?.slice(0, 7) === l.mes_referencia)) {
      const linhas = doc.splitTextToSize([`Incidente: ${incidente.id}`, ...linhasNaturezas(incidente.comunicacao), ...linhasRiscos(incidente.comunicacao), ...linhasMedidas(incidente.comunicacao), ...linhasCategorias(incidente.comunicacao)].join("\n"), 180) as string[];
      for (const linha of linhas) { if (y > 260) { doc.addPage(); y = 20; } doc.text(linha, 14, y); y += 4; }
      y += 4;
    }
    const contato = encarregado.data;
    const contatoLinhas = doc.splitTextToSize(contato ? `Encarregado (DPO): ${contato.nome} · ${contato.email}${contato.telefone ? ` · ${contato.telefone}` : ""}${contato.endereco ? ` · ${contato.endereco}` : ""}` : "Encarregado (DPO): Contato não cadastrado", 180) as string[];
    if (y + contatoLinhas.length * 4 > 240) { doc.addPage(); y = 20; }
    doc.text(contatoLinhas, 14, y + 4); y += contatoLinhas.length * 4 + 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text(["", "Assinatura do DPO (Gov.br): ______________________________", "", "Assinatura da Diretoria (Gov.br): ______________________________"], 14, y + 8);
    doc.save(`PI-04_${l.mes_referencia}.pdf`);
    log("SELECT", "lotes_pgaudit", `PDF do dossiê ${l.mes_referencia} gerado`);
  };

  return (
    <Panel id="lotes" title="Console forense · pgAudit (trilhas mensais)" action={canEdit && <Button size="sm" onClick={extrair} disabled={!demo && busy}><Play className="h-4 w-4" /> Extrair lote de {mesAtual()}</Button>}>
      <p className="mb-3 text-xs text-muted-foreground" data-testid="mci-art15">
        <Sigla termo="MCI art. 15" /> — guarda de registros de acesso a aplicações, sob sigilo, em ambiente controlado, pelo prazo de 6 meses.
      </p>
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
                <Button size="sm" variant="outline" disabled={!demo && !l.hash_sha256} onClick={() => gerarPdf(l)}><FileDown className="h-3 w-3" /> PDF PI-04</Button>
              </div>
            </li>
          ))}
        </ul>
        <pre className="max-h-[320px] min-h-[200px] overflow-auto rounded-sm bg-primary p-4 font-mono text-xs text-primary-foreground">{atual?.conteudo || "$ aguardando extração…"}</pre>
      </div>
    </Panel>
  );
}

function CriseRansomware({ cnpj, ativo, estado, canEdit, refresh }: { cnpj: string; ativo: Incidente | null; estado: EstadoIncidente | null; canEdit: boolean; refresh: () => Promise<unknown> }) {
  const { log, demo } = usePriva();
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [bloqueios, setBloqueios] = useState<string[]>([]);
  const stepsRef = useRef<HTMLOListElement>(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const ref = ativo ? ativo.id.slice(0, 6) : "";
  const passos = estado?.etapas.itens.map(i => i.concluida) ?? [false, false, false, false, false, false];
  const atual = passos.findIndex((p) => !p);
  const restante = demo ? DEMO_SLA_MS : (ativo ? restanteANPD(ativo.iniciado_em, ativo.enviado_anpd_em, now) : SLA_MS);
  const tom = !ativo ? "neutro" : restante === 0 ? "vencido" : restante < 24 * 3600000 ? "atencao" : "andamento";
  const TOM_SLA = {
    neutro: { caixa: "", texto: "text-primary", rotulo: "Nenhum incidente ativo" },
    andamento: { caixa: "border-l-4 border-l-andamento-border", texto: "text-andamento", rotulo: "Em andamento · mais de 24h úteis" },
    atencao: { caixa: "border-l-4 border-l-atencao-border", texto: "text-atencao", rotulo: "Atenção · menos de 24h úteis" },
    vencido: { caixa: "border-l-4 border-l-vencido-border", texto: "text-vencido", rotulo: "Vencido" },
  }[tom];

  const registrarEtapa = async (i: number, concluida: boolean) => {
    if (demo) { avisarAcaoDemo(); return false; }
    if (!ativo || busy || !canEdit) return false;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('registrar_etapa_incidente', { _incidente: ativo.id, _etapa: i + 1, _concluida: concluida });
      if (error) throw error;
      await refresh();
      toast.success(concluida ? 'Etapa registrada com data e responsável.' : 'Etapa reaberta.');
      return true;
    } catch (error) { console.error('Falha ao registrar etapa', error); toast.error('Não foi possível salvar a etapa. Tente novamente.'); return false; }
    finally { setBusy(false); }
  };
  const encerrar = async () => {
    if (demo) return avisarAcaoDemo();
    if (!ativo || !estado || busy || !canEdit) return;
    if (!estado.podeEncerrar) { setBloqueios(estado.motivos_bloqueio); return; }
    setBusy(true); setBloqueios([]);
    try {
      const { data, error } = await supabase.rpc('encerrar_incidente', { _incidente: ativo.id });
      if (error) throw error;
      const resultado = data as { encerrado?: boolean; motivos_bloqueio?: string[] } | null;
      if (!resultado?.encerrado) { setBloqueios(resultado?.motivos_bloqueio ?? ['Confira as pendências do incidente.']); await refresh(); return; }
      await refresh();
      toast.success('Incidente encerrado. Trilha de auditoria registrada.');
    } catch (error) { console.error('Falha ao encerrar incidente', error); toast.error('Não foi possível encerrar. Tente novamente.'); }
    finally { setBusy(false); }
  };
  const encerramento = estado && canEdit ? <EncerrarIncidente estado={estado} busy={busy} onClick={() => void encerrar()} /> : null;
  const declarar = async () => {
    if (demo) return avisarAcaoDemo();
    if (!canEdit || busy) return;
    const { error } = await supabase.from("incidentes_seguranca").insert({ empresa_cnpj: cnpj });
    if (error) { toast.error("Falha ao declarar."); return; }
    log("INSERT", "incidentes_seguranca", "Incidente de ransomware declarado · prazo de 3 dias úteis iniciado");
    refresh();
    qc.invalidateQueries({ queryKey: ["pendencias"] });
  };
  const concluirEtapa = async (i: number) => {
    const etapa = STEPS[i];
    if (!ativo || !etapa) return;
    const ok = await registrarEtapa(i, true);
    if (ok) setTimeout(() => (i + 1 < 5 ? stepsRef.current?.querySelector(`[data-step="${i + 1}"]`) : document.getElementById("anpd"))?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  };

  return (
    <Panel id="incidentes" title="Gerenciamento de Crise Cibernética · Ransomware" action={canEdit && (ativo
      ? encerramento
      : <Button size="sm" variant="outline" onClick={declarar}>Declarar incidente</Button>)}>
      {ativo && <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Incidente ativo: <span className="font-mono font-semibold text-primary">#{ref}</span></p>{!ativo.enviado_anpd_em && <div><Button variant="outline" asChild><Link to={demo ? "/demo" : "/bloco-4/anpd/$incidenteId"} search={demo ? { aba: "anpd" } : {}} params={{ incidenteId: ativo.id }}>Abrir formulário ANPD</Link></Button>{!passos.slice(0, 5).every(Boolean) && <p className="mt-1 text-xs text-atencao">Conclua as etapas {passos.slice(0, 5).map((p, i) => p ? null : i + 1).filter(Boolean).join(", ")} para comunicar.</p>}</div>}</div>}

      {estado && <div id="encerramento" aria-live="polite" className="mb-4 space-y-2">
        <p className="text-sm">Etapas concluídas: {estado.etapas.concluidas} de {estado.etapas.total}</p>
        {demo && <p className="text-sm text-concluido">{estado.etapas.concluidas} de {estado.etapas.total} concluídas</p>}
        {(estado.motivos_bloqueio.length > 0 || bloqueios.length > 0) && <><p className="font-semibold text-atencao">Não é possível encerrar. Pendências:</p><ul className="space-y-1 text-sm text-atencao">{estado.correcoes.map(c => <li key={c.mensagem}>{c.mensagem} <a className="underline" href={`#${c.ancora}`}>{c.acao} →</a></li>)}{bloqueios.map(m => <li key={m}>{m}</li>)}</ul></>}
      </div>}
      <div className="mb-4 flex justify-end print:hidden" data-referencia-externa><ConsultarBasesPublicas /></div>
      {/* Barra de etapas */}
      <ol ref={stepsRef} className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Etapas do incidente">
        {STEPS.map((s, i) => {
          const feito = !!passos[i];
          const corrente = !!ativo && i === atual;
          const bloqueado = !ativo || (!feito && !corrente);
          return (
            <li id={`incidente-etapa-${i + 1}`} key={s.t} data-step={i} className={cn("relative scroll-mt-6 rounded-md border p-3 text-xs transition-all duration-300",
              feito && "border-l-4 border-l-concluido-border",
              corrente && "border-l-4 border-l-pendencia-border",
              bloqueado && "border-l-4 border-l-bloqueado-border")}>
              <div className="flex items-center gap-2">
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
                  feito ? "bg-concluido-bg text-concluido" : corrente ? "bg-pendencia-bg text-pendencia" : "bg-bloqueado-bg text-bloqueado")}>
                  {feito ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : bloqueado ? <Lock className="h-3 w-3" aria-hidden /> : <Circle className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <span className={cn("font-semibold", feito ? "text-concluido" : corrente ? "text-pendencia" : "text-bloqueado")}>{s.t}</span>
              </div>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
                {feito ? <span className="text-concluido">Concluída</span> : corrente ? <span className="text-pendencia">Você está aqui</span> : <span className="text-bloqueado">Bloqueada</span>}
              </p>
              {corrente && (
                <>
                  <p className="mt-1 text-muted-foreground">{s.d}</p>
                   {i === 5 ? <p className="mt-1 text-pendencia">Consome o prazo de 3 dias úteis · preencha o formulário abaixo.</p>
                    : canEdit && <Button size="sm" variant="outline" disabled={!demo && busy} className="mt-2 h-auto min-h-7 w-full whitespace-normal" onClick={() => concluirEtapa(i)}>Marcar como concluída</Button>}
                </>
              )}
              {feito && (demo || i < 5) && estado && <p className="mt-1 text-muted-foreground">{estado.etapas.itens[i]?.responsavel && estado.etapas.itens[i]?.data ? `${demo ? `Responsável: ${estado.etapas.itens[i]?.responsavel}` : 'Responsável registrado'} · ${new Date(estado.etapas.itens[i]?.data ?? '').toLocaleString('pt-BR')}` : 'Data e responsável não registrados'}</p>}
              {feito && canEdit && i < 5 && (!estado?.etapas.itens[i]?.responsavel || !estado?.etapas.itens[i]?.data) && <Button size="sm" variant="outline" disabled={!demo && busy} className="mt-2 h-auto whitespace-normal" onClick={() => registrarEtapa(i, true)}>Confirmar conclusão</Button>}
              {feito && canEdit && ativo && !ativo.enviado_anpd_em && i < 5 && passos[i + 1] === false && <Button variant="link" disabled={!demo && busy} className="h-auto p-0 text-xs" onClick={() => registrarEtapa(i, false)}>Reabrir</Button>}
            </li>
          );
        })}
      </ol>

      {/* SLA com contexto */}
      <div className={cn("grid gap-4 rounded-md border p-4 md:grid-cols-[220px_1fr]", TOM_SLA.caixa)}>
        <div className="text-center">
          {tom === 'vencido' ? <OctagonAlert className="mx-auto h-5 w-5 text-vencido" aria-hidden /> : tom === 'atencao' ? <AlertTriangle className="mx-auto h-5 w-5 text-atencao" aria-hidden /> : tom === 'andamento' ? <Clock className="mx-auto h-5 w-5 text-andamento" aria-hidden /> : <Timer className="mx-auto h-5 w-5" aria-hidden />}
          <p className={cn("mt-1 font-mono text-3xl font-semibold", TOM_SLA.texto)}>{fmt(restante)}</p>
          <p className={cn("mt-1 text-xs font-semibold uppercase", TOM_SLA.texto)}>{ativo?.enviado_anpd_em ? (ativo.comunicacao_atrasada ? "Comunicado em atraso" : "Prazo de envio cumprido") : TOM_SLA.rotulo}</p>
          {ativo?.enviado_anpd_em && <div className="mt-2"><Tag tone="success">ANPD comunicada</Tag></div>}
        </div>
        <ul className="space-y-1 text-xs text-foreground">
          <li><b>O que mede:</b> Prazo de comunicação à ANPD — 3 dias úteis (Res. CD/ANPD nº 15/2024, art. 6º), contados do conhecimento do incidente; não inclui fins de semana e feriados. Vinculado à etapa 6 (Reporte).</li>
          <li><b>Ao zerar:</b> Após o prazo, o incidente é marcado como comunicado em atraso e a trilha registra o descumprimento.</li>
          <li><b>Contador:</b> conta apenas horas úteis (segunda a sexta) e não pausa durante a resposta; após a comunicação simulada, congela no instante de envio.</li>
        </ul>
      </div>

      {ativo && estado && <FormularioANPD key={ativo.id} incidente={ativo} estado={estado} encerramento={encerramento} canEdit={canEdit} refresh={refresh} />}
    </Panel>
  );
}
