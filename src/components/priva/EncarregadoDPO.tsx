import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePriva } from "@/lib/priva/store";
import { useEncarregado } from "@/lib/priva/useEncarregado";
import { Panel } from "./ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
const vazio = { nome: "", email: "", telefone: "", endereco: "", publicar_contato: false };
export function EncarregadoDPO() {
  const { cnpj, role, roles, demo } = usePriva();
  const q = useEncarregado();
  const qc = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [busy, setBusy] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const editavel = !demo && role !== "C_SUITE" && (roles.includes("ADMIN_SISTEMA") || roles.includes("DPO_OPERACIONAL"));
  useEffect(() => { setForm(q.data ? { ...q.data, telefone: q.data.telefone ?? "", endereco: q.data.endereco ?? "" } : vazio); setSalvo(false); }, [q.data, cnpj]);
  useEffect(() => { if (!q.isLoading && editavel) document.getElementById(!q.data?.nome ? "dpo-nome" : !q.data?.email ? "dpo-email" : "dpo-nome")?.focus(); }, [q.isLoading, cnpj, editavel]);
  const motivos = [!form.nome.trim() && "Informe o nome do encarregado", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && "Informe um e-mail de contato válido", !cnpj && "Selecione um CNPJ", demo && "Cadastro indisponível no modo demonstração"].filter(Boolean);
  const salvar = async () => {
    if (!editavel || motivos.length || !cnpj || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("encarregado_dpo").upsert({ ...form, empresa_cnpj: cnpj });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["encarregado_dpo", cnpj] }); setSalvo(true);
      toast.success("Contato do encarregado salvo.");
    } catch (error) { console.error('Falha ao salvar contato do encarregado', error); toast.error("Não foi possível salvar o encarregado deste CNPJ."); }
    finally { setBusy(false); }
  };
  return <Panel title="Encarregado (DPO)">
    <section aria-live="polite" className="mb-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-andamento-border bg-andamento-bg p-4">
      <div><p className="text-xs font-semibold uppercase">Próximo passo</p><p className="text-sm">{salvo ? "Contato salvo. Retome a comunicação do incidente." : q.data ? "Revise o contato público do encarregado." : "Cadastre o encarregado deste CNPJ."}</p></div>
      {salvo ? <Button asChild><Link to="/bloco-4" hash="anpd">Comunicar à ANPD</Link></Button> : editavel && <Button onClick={() => document.getElementById(!form.nome ? "dpo-nome" : "dpo-email")?.focus()}>Preencher contato</Button>}
    </section>
    {q.isError && <p role="alert" className="text-atencao">Não foi possível carregar o contato. <Button variant="link" onClick={() => q.refetch()}>Tentar novamente</Button></p>}
    <form onSubmit={e => { e.preventDefault(); void salvar(); }} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">{([ ["nome", "Nome do encarregado", "Ex.: Maria Oliveira"], ["email", "E-mail de contato do encarregado", "Ex.: privacidade@organizacao.com.br"], ["telefone", "Telefone (opcional)", "Ex.: (11) 3333-4444"], ["endereco", "Endereço para correspondência (opcional)", "Ex.: Rua das Flores, 120, São Paulo — SP"] ] as const).map(([campo, titulo, exemplo]) => <div key={campo}><label htmlFor={`dpo-${campo}`} className="text-sm font-medium">{titulo}</label><Input id={`dpo-${campo}`} className="mt-1" type={campo === "email" ? "email" : "text"} value={form[campo]} placeholder={exemplo} readOnly={!editavel} disabled={q.isLoading} onChange={e => {setForm({ ...form, [campo]: e.target.value }); setSalvo(false);}} /></div>)}</div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.publicar_contato} disabled={!editavel} onCheckedChange={v => {setForm({ ...form, publicar_contato: v === true }); setSalvo(false);}} />Publicar o contato do encarregado na política de privacidade</label>
      {editavel && <><ul className="text-sm text-atencao">{motivos.map(m => <li key={String(m)}>{m}</li>)}</ul><Button type="submit" disabled={!!motivos.length || busy || q.isLoading}>{busy ? "Salvando…" : "Salvar dados do encarregado"}</Button></>}
    </form>
  </Panel>;
}