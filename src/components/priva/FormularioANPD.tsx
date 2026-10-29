import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { usePriva } from "@/lib/priva/store";
import { useEncarregado } from "@/lib/priva/useEncarregado";
import { validarANPD, type ComunicacaoANPD } from "@/lib/priva/anpd";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
type Incidente = Database["public"]["Tables"]["incidentes_seguranca"]["Row"];
export function FormularioANPD({ incidente, canEdit, refresh }: { incidente: Incidente; canEdit: boolean; refresh: () => void }) {
  const { demo } = usePriva();
  const dpo = useEncarregado();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [falha, setFalha] = useState("");
  const [processo, setProcesso] = useState(incidente.processo_id ?? "");
  const [form, setForm] = useState<ComunicacaoANPD>({ natureza: "Ransomware", categorias: [], titulares: "", riscos: "", medidas: "" });
  useEffect(() => {
    const s = incidente.comunicacao as Record<string, Json> | null;
    setForm({ natureza: String(s?.["natureza"] ?? "Ransomware"), categorias: Array.isArray(s?.["categorias"]) ? s["categorias"].map(String) : [], titulares: String(s?.["titulares"] ?? ""), riscos: String(s?.["riscos"] ?? ""), medidas: String(s?.["medidas"] ?? "") });
    setProcesso(incidente.processo_id ?? "");
  }, [incidente.id, incidente.enviado_anpd_em]);
  const rot = useQuery({ queryKey: ["anpd_rot", incidente.empresa_cnpj, demo], enabled: !demo, queryFn: async () => {
    const { data, error } = await supabase.from("registro_operacoes").select("id,codigo,finalidade_especifica,dados_pessoais,dados_sensiveis").eq("empresa_cnpj", incidente.empresa_cnpj).order("codigo");
    if (error) throw error; return data;
  }});
  const escolhido = rot.data?.find(r => r.id === processo);
  const categorias = [...new Set([...(escolhido?.dados_pessoais ?? []), ...(escolhido?.dados_sensiveis ?? [])])].filter(x => x !== "N/A");
  const email = incidente.enviado_anpd_em ? String((incidente.comunicacao as Record<string, Json>)?.["encarregado"] ?? "") : dpo.data?.email ?? "";
  const motivos = validarANPD(form, email, incidente.passos);
  if (!escolhido && !incidente.enviado_anpd_em) motivos.push({ campo: "processo", titulo: "Processo", mensagem: "Selecione o processo ROT afetado para carregar suas categorias" });
  const editavel = canEdit && !incidente.enviado_anpd_em && !demo;
  const ir = (campo: string) => { const el = document.getElementById(campo.startsWith("etapa-") ? "incidentes" : `anpd-${campo}`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); el?.focus({ preventScroll: true }); };
  useEffect(() => { if (editavel && !rot.isLoading && !dpo.isLoading) ir(!processo ? "processo" : "categorias"); }, [incidente.id, editavel, rot.isLoading, dpo.isLoading]);
  const enviar = async () => {
    if (!editavel || motivos.length || busy) return;
    setBusy(true); setFalha("");
    const { error } = await supabase.rpc("enviar_comunicacao_anpd", { _incidente: incidente.id, _form: form as unknown as Json, _processo: processo });
    setBusy(false);
    if (error) { setFalha(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["pendencias"] }); refresh();
    toast.success("Comunicação simulada registrada. Encerre o incidente e assine o PI-04.");
  };
  return <section id="anpd" className="mt-6 scroll-mt-6 border-t pt-6">
    <h2 className="font-semibold">Comunicação de Incidente de Segurança à ANPD (simulação)</h2>
    <div aria-live="polite" className="my-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-andamento-border bg-andamento-bg p-4"><div><p className="text-xs font-semibold uppercase">Próximo passo</p><p className="text-sm">{incidente.enviado_anpd_em ? "Comunicação registrada. Encerre o incidente para assinar o PI-04." : motivos[0]?.mensagem ?? "Envie a comunicação simulada à ANPD."}</p></div>{incidente.enviado_anpd_em ? <Button onClick={() => ir("etapa-0")}>Encerrar incidente</Button> : <Button onClick={() => ir(motivos[0]?.campo ?? "envio")}>{motivos.length ? "Resolver pendência" : "Ir para envio"}</Button>}</div>
    {incidente.enviado_anpd_em && <p role="status" className="mb-4 text-success">Enviado em {new Date(incidente.enviado_anpd_em).toLocaleString("pt-BR")} · {incidente.comunicacao_atrasada ? "Comunicação em atraso registrada na trilha." : "Prazo de envio cumprido."}</p>}
    <form onSubmit={e => { e.preventDefault(); void enviar(); }} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2"><div><label htmlFor="anpd-incidente">Número do incidente</label><Input id="anpd-incidente" value={incidente.id} readOnly /></div><div><label htmlFor="anpd-natureza">Natureza do incidente</label><Input id="anpd-natureza" value={form.natureza} readOnly={!editavel} placeholder="Ex.: Ransomware no servidor de arquivos" onChange={e => setForm({ ...form, natureza: e.target.value })} /></div></div>
      <div><label htmlFor="anpd-processo">Processo ROT afetado</label><select id="anpd-processo" className="mt-1 w-full rounded-sm border bg-background p-2 text-sm focus:ring-2 focus:ring-ring" disabled={!editavel || !!incidente.processo_id} value={processo} onChange={e => { setProcesso(e.target.value); setForm({ ...form, categorias: [] }); }}><option value="">Selecione o processo afetado</option>{rot.data?.map(r => <option key={r.id} value={r.id}>{r.codigo} · {r.finalidade_especifica}</option>)}</select>{rot.isError && <p className="text-atencao">Falha ao carregar o ROT. <Button variant="link" onClick={() => rot.refetch()}>Tentar novamente</Button></p>}{!rot.isLoading && !rot.data?.length && <p className="text-atencao">Nenhum processo disponível. <Link to="/bloco-2" hash="rot" className="underline">Cadastrar processo no ROT</Link></p>}</div>
      <fieldset id="anpd-categorias" tabIndex={-1} className="rounded-sm border p-3 focus:ring-2 focus:ring-ring"><legend className="px-1 text-sm">Categorias de dados pessoais afetados</legend><div className="grid gap-2 md:grid-cols-2">{categorias.map(c => <label key={c} className="flex items-center gap-2 text-sm"><Checkbox checked={form.categorias.includes(c)} disabled={!editavel} onCheckedChange={v => setForm({ ...form, categorias: v === true ? [...form.categorias, c] : form.categorias.filter(x => x !== c) })} />{c}</label>)}</div>{!categorias.length && <p className="text-sm text-atencao">Selecione um processo para carregar as categorias do ROT.</p>}</fieldset>
      <div><label htmlFor="anpd-titulares">Número aproximado de titulares afetados</label><Input id="anpd-titulares" type="number" min={1} step={1} value={form.titulares} readOnly={!editavel} placeholder="Ex.: 1240" onChange={e => setForm({ ...form, titulares: e.target.value })} /></div>
      {([ ["riscos", "Riscos e consequências aos titulares", "Ex.: Risco de acesso não autorizado a dados pessoais e indisponibilidade temporária. Dados restaurados de backup íntegro, sem indício de exfiltração."], ["medidas", "Medidas técnicas e de segurança adotadas", "Ex.: Isolamento de endpoints, contenção em sandbox, restauração por backup íntegro com validação de hash SHA-256."] ] as const).map(([campo,titulo,exemplo]) => <div key={campo}><label htmlFor={`anpd-${campo}`}>{titulo}</label><Textarea id={`anpd-${campo}`} rows={3} value={form[campo]} readOnly={!editavel} placeholder={exemplo} aria-describedby={`anpd-${campo}-contador`} onChange={e => setForm({ ...form, [campo]: e.target.value })} /><p id={`anpd-${campo}-contador`} className="text-xs text-muted-foreground">{form[campo].trim().length} caracteres · mínimo 30</p></div>)}
      <div><label htmlFor="anpd-encarregado">Contato do Encarregado (DPO)</label><Input id="anpd-encarregado" value={email} readOnly placeholder="Contato ainda não cadastrado" />{!email && <p className="mt-1 text-sm text-atencao">Nenhum DPO cadastrado para este CNPJ. <Link to="/membros" className="underline">Cadastrar DPO →</Link></p>}</div>
      {!incidente.enviado_anpd_em && <><ul aria-live="polite" className="space-y-1 text-sm text-atencao">{motivos.map(m => <li key={m.campo}>{m.mensagem} <Button type="button" variant="link" className="h-auto p-0 text-atencao" onClick={() => ir(m.campo)}>Ir para {m.campo.startsWith("etapa") ? "a etapa" : "o campo"} →</Button></li>)}</ul>{falha && <p role="alert" className="text-destructive">{falha}</p>}{!canEdit && <p className="text-atencao">Envio disponível apenas para DPO e Administrador, fora do modo demonstração.</p>}<Button id="anpd-envio" type="submit" disabled={!editavel || !!motivos.length || busy} className={!motivos.length ? "bg-success text-success-foreground hover:bg-success/90" : ""}>{busy ? "Enviando…" : motivos.length ? `Faltam ${motivos.length} itens: ${motivos.map(m => m.titulo).join(", ")}` : "Enviar à ANPD (simulado)"}</Button></>}
    </form>
  </section>;
}