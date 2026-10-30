import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock, Copy } from 'lucide-react';
import { useNavigate } from "@tanstack/react-router";
import { AppLink as Link } from "@/components/priva/AppLink";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { usePriva } from "@/lib/priva/store";
import { useEncarregado } from "@/lib/priva/useEncarregado";
import { prepararComunicacaoANPD, progressoANPD, validarANPD, type ComunicacaoANPD } from "@/lib/priva/anpd";
import { categoriasDoROT, vincularCategorias } from '@/lib/priva/categoriasANPD';
import { SeletorCategoriasANPD } from './SeletorCategoriasANPD';
import { naturezaInicial, PADRAO_RANSOMWARE } from "@/lib/priva/naturezasIncidente";
import { SeletorNatureza } from "./SeletorNatureza";
import { SeletorMedidas } from './SeletorMedidas';
import { sugerirMedidas, textoMedidas } from '@/lib/priva/medidasIncidente';
import { Button } from "@/components/ui/button";
import { Progress } from '@/components/ui/progress';
import { Input } from "@/components/ui/input";
import { SeletorRiscos } from './SeletorRiscos';
import { sugerirRiscos, textoRiscos } from '@/lib/priva/riscosIncidente';
import { medidasDoVetor } from '@/lib/priva/vetoresANPD';
import type { EstadoIncidente } from '@/lib/priva/estadoIncidente';
import { CasosPublicosSemelhantes } from './ReferenciasExternas';
import { DEMO_ROT } from '@/lib/priva/demo';
import { avisarAcaoDemo } from '@/lib/priva/demoAction';
type Incidente = Database["public"]["Tables"]["incidentes_seguranca"]["Row"];
export function FormularioANPD({ incidente, estado, encerramento, canEdit, refresh }: { incidente: Incidente; estado: EstadoIncidente; encerramento: React.ReactNode; canEdit: boolean; refresh: () => void | Promise<unknown> }) {
  const { demo } = usePriva();
  const navigate = useNavigate();
  const dpo = useEncarregado();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [falha, setFalha] = useState("");
  const categoriasInicializadas = useRef('');
  const focoInicial = useRef(false);
  const [processo, setProcesso] = useState(incidente.processo_id ?? "");
  const [form, setForm] = useState<ComunicacaoANPD>({ natureza: PADRAO_RANSOMWARE, categorias: [], titulares: "", riscos: "", medidas: "" });
  useEffect(() => {
    const s = incidente.comunicacao as Record<string, Json> | null;
    setForm({ natureza: naturezaInicial(demo ? (s?.["natureza_principal"] as { valor?: string } | undefined)?.valor : s?.["natureza"], !!incidente.enviado_anpd_em), naturezasSecundarias: Array.isArray(s?.["naturezas_secundarias"]) ? s["naturezas_secundarias"].flatMap(n => n && typeof n === "object" && !Array.isArray(n) && typeof n["valor"] === "string" ? [n["valor"]] : []) : [], naturezaOutro: String(s?.["natureza_outro"] ?? ""), categorias: Array.isArray(s?.["categorias"]) ? s["categorias"].map(String) : [], titulares: String(s?.["titulares"] ?? ""), riscos: String(s?.["riscos"] ?? ""), medidas: String(s?.["medidas"] ?? "") });
    const selecionadas = Array.isArray(s?.['medidas_selecionadas']) ? s['medidas_selecionadas'].flatMap(m => m && typeof m === 'object' && !Array.isArray(m) && typeof m['valor'] === 'string' ? [m['valor']] : []) : undefined;
    if (!incidente.enviado_anpd_em || selecionadas !== undefined) {
      const medidasSelecionadas = selecionadas ?? [...new Set([...sugerirMedidas(estado.etapas.itens), ...medidasDoVetor(naturezaInicial(s?.["natureza"], false))])];
      const outrasMedidas = String(s?.['outras_medidas'] ?? (selecionadas === undefined ? s?.['medidas'] ?? '' : ''));
      setForm(atual => ({ ...atual, medidasSelecionadas, outrasMedidas, medidas: incidente.enviado_anpd_em ? String(s?.['medidas'] ?? '') : textoMedidas(medidasSelecionadas, outrasMedidas) }));
    }
    const riscosSalvos = Array.isArray(s?.['riscos_selecionados']) ? s['riscos_selecionados'].flatMap(r => r && typeof r === 'object' && !Array.isArray(r) && typeof r['valor'] === 'string' ? [r['valor']] : []) : undefined;
    if (!incidente.enviado_anpd_em || riscosSalvos !== undefined) {
      const riscosSelecionados = riscosSalvos ?? sugerirRiscos(naturezaInicial(s?.['natureza'], false), false, false);
      const riscosDetalhes = String(s?.['riscos_detalhes'] ?? (riscosSalvos === undefined ? s?.['riscos'] ?? '' : ''));
      setForm(atual => ({ ...atual, riscosSelecionados, riscosDetalhes, riscos: incidente.enviado_anpd_em ? String(s?.['riscos'] ?? '') : textoRiscos(riscosSelecionados, riscosDetalhes) }));
    }
    setProcesso(incidente.processo_id ?? "");
  }, [incidente.id, incidente.enviado_anpd_em]);
  const rot = useQuery({ queryKey: ["anpd_rot", incidente.empresa_cnpj, demo], enabled: !demo, queryFn: async () => {
    const { data, error } = await supabase.from("registro_operacoes").select("id,codigo,finalidade_especifica,dados_pessoais,dados_sensiveis").eq("empresa_cnpj", incidente.empresa_cnpj).order("codigo");
    if (error) throw error; return data;
  }});
  const rotRows = demo ? DEMO_ROT : rot.data;
  const escolhido = rotRows?.find(r => r.id === processo);
  const categorias = categoriasDoROT(escolhido);
  const email = incidente.enviado_anpd_em ? String((incidente.comunicacao as Record<string, Json>)?.["encarregado"] ?? "") : dpo.data?.email ?? "";
  const motivos = validarANPD(form, email, estado.etapas.itens.map(i => i.concluida), estado.etapas.itens);
  if (!escolhido && !incidente.enviado_anpd_em) motivos.push({ campo: "processo", titulo: "Processo", mensagem: "Selecione o processo ROT afetado para carregar suas categorias" });
  const editavel = (demo || canEdit) && !incidente.enviado_anpd_em;
  const progresso = progressoANPD(form, email);
  const camposPendentes = [...new Set(motivos.filter(m => !m.campo.startsWith('etapa-')).map(m => m.titulo))];
  const etapasPendentes = motivos.filter(m => m.campo.startsWith('etapa-'));
  const ir = (campo: string) => {
    const el = document.getElementById(campo.startsWith('etapa-') ? `incidente-etapa-${Number(campo.slice(6)) + 1}` : `anpd-${campo}`);
    if (!el && campo.startsWith('etapa-')) { void navigate({ to: demo ? '/demo' : '/bloco-4', search: demo ? { aba: 'bloco-4' } : {}, hash: `incidente-etapa-${Number(campo.slice(6)) + 1}` }); return; }
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus({ preventScroll: true });
    el?.classList.remove('anpd-destaque'); requestAnimationFrame(() => el?.classList.add('anpd-destaque')); setTimeout(() => el?.classList.remove('anpd-destaque'), 2000);
  };
  useEffect(() => {
    if (!editavel || !escolhido || categoriasInicializadas.current === processo) return;
    categoriasInicializadas.current = processo;
    setForm(atual => ({ ...atual, categorias: categoriasDoROT(escolhido).map(c => c.valor) }));
  }, [editavel, processo, escolhido]);
  useEffect(() => {
    if (demo || !editavel || rot.isLoading || dpo.isLoading || focoInicial.current) return;
    const timer = setTimeout(() => {
      focoInicial.current = true;
      const campo = !processo ? 'processo' : motivos.find(m => !m.campo.startsWith('etapa-'))?.campo;
      if (campo) ir(campo);
    }, 300);
    return () => clearTimeout(timer);
  }, [editavel, rot.isLoading, dpo.isLoading, processo, form.categorias.length]);
  const copiarNumero = async () => { try { await navigator.clipboard.writeText(incidente.id); toast.success('Número do incidente copiado.'); } catch { toast.error('Não foi possível copiar o número.'); } };
  const enviar = async () => {
    if (demo) return avisarAcaoDemo();
    if (!editavel || motivos.length || busy) return;
    setBusy(true); setFalha("");
    try {
      const { error } = await supabase.rpc("enviar_comunicacao_anpd", { _incidente: incidente.id, _form: prepararComunicacaoANPD({ ...form, categoriasVinculadas: vincularCategorias(form.categorias, categorias) }) as unknown as Json, _processo: processo });
      if (error) throw error;
      await refresh();
      await qc.invalidateQueries({ queryKey: ["pendencias"] });
      toast.success("Comunicação simulada registrada. Confira as pendências de encerramento e assine o PI-04 após encerrar.");
    } catch (error) {
      console.error('Falha no envio ANPD', error);
      setFalha('Não foi possível enviar a comunicação. Nenhuma alteração parcial foi salva. Tente novamente.');
      toast.error('Não foi possível enviar a comunicação. Tente novamente.');
    } finally { setBusy(false); }
  };
  return <section id="anpd" className="mt-6 scroll-mt-6 border-t pt-6">
    <h2 className="font-semibold">Comunicação de Incidente de Segurança à ANPD (simulação)</h2>
    <div aria-live="polite" className="my-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-andamento-border p-4"><div><p className="flex items-center gap-1 text-xs font-semibold uppercase text-andamento"><Clock className="h-4 w-4" aria-hidden />Próximo passo</p><p className="text-sm">{estado.anpd.enviado ? estado.podeEncerrar ? 'Comunicação registrada. Encerre o incidente para assinar o PI-04.' : estado.motivos_bloqueio[0] : motivos[0]?.mensagem ?? "Envie a comunicação simulada à ANPD."}</p></div>{estado.anpd.enviado ? encerramento : <Button onClick={() => ir(motivos[0]?.campo ?? "envio")}>{motivos.length ? "Resolver pendência" : "Ir para envio"}</Button>}</div>
    {incidente.enviado_anpd_em && <p role="status" className="mb-4 flex items-start gap-2 border-l-4 border-l-concluido-border pl-3 text-concluido"><CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /><span>Comunicação registrada. Próximo passo: encerrar o incidente e assinar o PI-04.<span className="block text-xs">Enviado em {new Date(incidente.enviado_anpd_em).toLocaleString("pt-BR")} · {incidente.comunicacao_atrasada ? "Comunicação em atraso registrada na trilha." : "Prazo de envio cumprido."}</span></span></p>}
    {!incidente.enviado_anpd_em && <div className="mb-4" aria-live="polite"><p className="mb-2 text-sm">{progresso.preenchidos} de {progresso.total} campos obrigatórios preenchidos</p><Progress value={progresso.preenchidos / progresso.total * 100} aria-label="Campos obrigatórios preenchidos" className="[&>div]:bg-andamento" /></div>}
    <form onSubmit={e => { e.preventDefault(); void enviar(); }} className="space-y-4">
      <div><label htmlFor="anpd-incidente">Número do incidente</label><div className="flex gap-2"><Input id="anpd-incidente" value={incidente.id} readOnly className="min-w-0" /><Button type="button" variant="outline" aria-label="Copiar número do incidente" title="Copiar número do incidente" onClick={() => void copiarNumero()}><Copy className="h-4 w-4" /></Button></div></div>
      <SeletorNatureza form={form} onChange={setForm} editavel={editavel} sugerida={!incidente.comunicacao || (incidente.comunicacao as Record<string, Json>)?.["natureza"] === "Ransomware"} />
      <div><label htmlFor="anpd-processo">Processo ROT afetado</label><select id="anpd-processo" className="mt-1 w-full rounded-sm border bg-background p-2 text-sm focus:ring-2 focus:ring-ring" disabled={!editavel || !!incidente.processo_id} value={processo} onChange={e => { setProcesso(e.target.value); setForm({ ...form, categorias: [] }); }}><option value="">Selecione o processo afetado</option>{rotRows?.map(r => <option key={r.id} value={r.id}>{r.codigo} · {r.finalidade_especifica}</option>)}</select>{rot.isError && <p className="text-atencao">Falha ao carregar o ROT. <Button variant="link" onClick={() => rot.refetch()}>Tentar novamente</Button></p>}{!rot.isLoading && !rotRows?.length && <p className="text-atencao">Nenhum processo disponível. <Link to="/bloco-2" hash="rot" className="underline">Cadastrar processo no ROT</Link></p>}</div>
      <SeletorCategoriasANPD opcoes={incidente.enviado_anpd_em ? form.categorias.map(valor => { const item = ((incidente.comunicacao as Record<string, Json>)?.['categorias_vinculadas'] as Json[] | undefined)?.find(c => c && typeof c === 'object' && !Array.isArray(c) && c['valor'] === valor); const fonte = item && typeof item === 'object' && !Array.isArray(item) ? String(item['fonte_normativa'] ?? '') : ''; return { valor, fonte_normativa: fonte, sensivel: fonte.includes('art. 5º, II') }; }) : categorias} valores={form.categorias} editavel={editavel} padrao={!!escolhido && ![...escolhido.dados_pessoais, ...escolhido.dados_sensiveis].some(v => v.trim() && v !== 'N/A')} onChange={valores => setForm(atual => ({ ...atual, categorias: valores }))} />
      <div><label htmlFor="anpd-titulares">Número aproximado de titulares afetados</label><Input id="anpd-titulares" type="number" min={1} step={1} value={form.titulares} readOnly={!editavel} placeholder="Ex.: 1240" onChange={e => setForm({ ...form, titulares: e.target.value })} /></div>
      <SeletorRiscos form={form} onChange={setForm} editavel={editavel} sensivel={categorias.some(c => form.categorias.includes(c.valor) && c.sensivel)} menores={form.categorias.some(c => /menor|criança|adolescente/i.test(c))} />
      <SeletorMedidas form={form} onChange={setForm} editavel={editavel} estado={estado} />
      <div><label htmlFor="anpd-encarregado">Contato do Encarregado (DPO)</label><Input id="anpd-encarregado" value={email} readOnly placeholder="Contato ainda não cadastrado" />{!email && <p className="mt-1 text-sm text-atencao">Nenhum DPO cadastrado para este CNPJ. <Link to="/membros" className="underline">Cadastrar DPO →</Link></p>}</div>
      {!incidente.enviado_anpd_em && <><ul id="anpd-motivos" aria-live="polite" className="space-y-2 text-sm text-pendencia">{motivos.map((m, i) => <li key={`${m.campo}-${i}`} className="flex flex-wrap items-start gap-2 border-l-4 border-l-pendencia-border pl-2"><Circle className="mt-1 h-3 w-3 shrink-0" aria-hidden /><span>{m.mensagem} {m.campo === 'encarregado' ? <Link to="/membros" className="font-medium underline">Cadastrar DPO →</Link> : <Button type="button" variant="link" className="h-auto p-0 text-pendencia" onClick={() => ir(m.campo)}>{m.campo.startsWith('etapa-') ? 'Ir para a etapa →' : 'Corrigir →'}</Button>}</span></li>)}</ul>{falha && <p role="alert" className="text-destructive">{falha}</p>}{!editavel && <p className="flex items-center gap-1 text-pendencia"><AlertTriangle className="h-4 w-4" aria-hidden />Envio disponível apenas para DPO e Administrador, fora do modo demonstração.</p>}<Button id="anpd-envio" type="submit" aria-describedby={motivos.length ? 'anpd-motivos' : undefined} disabled={!demo && (!editavel || !!motivos.length || busy)} className={`h-auto min-h-9 max-w-full whitespace-normal text-left ${!motivos.length ? 'bg-concluido text-primary-foreground hover:bg-concluido/90' : 'border border-pendencia-border bg-pendencia-bg text-pendencia disabled:opacity-100'}`}>{demo ? 'Enviar à ANPD (simulado)' : busy ? 'Enviando…' : motivos.length ? `Faltam ${camposPendentes.length ? `${camposPendentes.length} campos: ${camposPendentes.join(', ')}` : ''}${camposPendentes.length && etapasPendentes.length ? ' · ' : ''}${etapasPendentes.length ? `${etapasPendentes.length} etapas` : ''}` : 'Enviar à ANPD (simulado)'}</Button></>}
    </form>
    {/* Contexto isolado: nunca faz parte do formulário salvo, da trilha ou do PI-04. */}
    <CasosPublicosSemelhantes natureza={form.natureza} categorias={form.categorias} />
  </section>;
}