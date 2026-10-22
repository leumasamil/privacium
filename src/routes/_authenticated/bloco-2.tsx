import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEPARTMENTS, HIPOTESES, VERBS } from "@/lib/priva/data";
import { DADOS, INFRA, SALVAGUARDAS, SENSIVEIS, TITULARES, isRisky, validateRot, type RotInput, type RotRow } from "@/lib/priva/rot";
import { usePriva } from "@/lib/priva/store";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/bloco-2")({
  head: () => ({
    meta: [
      { title: "Bloco 2 · Registro de Operações de Tratamento — PRIVA 2EC" },
      { name: "description", content: "Planilha mestre do ROT (Art. 37 da LGPD) com 12 colunas operacionais e travas de risco." },
      { property: "og:title", content: "Bloco 2 · Registro de Operações de Tratamento — PRIVA 2EC" },
      { property: "og:description", content: "Planilha mestre do ROT (Art. 37 da LGPD) com 12 colunas operacionais e travas de risco." },
    ],
  }),
  component: () => <BlockGate n={2}><Bloco2 /></BlockGate>,
});

const HEADS = ["ID Processo", "Gênero Verbo", "Categoria de Titulares", "Dados Pessoais", "Dados Pessoais Sensíveis", "Finalidade Específica",
  "Hipótese de Tratamento", "Tempo de Retenção", "Base do Prazo", "Compartilhamento / Destinatários", "Salvaguardas de Segurança", "Infraestrutura / Mídia"];

const empty = (cnpj: string): RotInput => ({
  empresa_cnpj: cnpj, setor: "RH", genero_verbo: "Coletar", categoria_titulares: [], dados_pessoais: [], dados_sensiveis: ["N/A"],
  finalidade_especifica: "", hipotese_tratamento: "", tempo_retencao: "", base_prazo: "", compartilhamento: "Não Compartilhado",
  salvaguardas: [], infraestrutura: "Servidor Local", justificativa_mitigacao: null,
});

function Bloco2() {
  const { cnpj, log, roles } = usePriva();
  const qc = useQueryClient();
  const canEdit = roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA");
  const key = ["registro_operacoes", cnpj] as const;
  const { data: rows = [] } = useQuery({
    queryKey: key,
    enabled: !!cnpj,
    queryFn: async (): Promise<RotRow[]> => {
      const { data, error } = await supabase.from("registro_operacoes").select("*").eq("empresa_cnpj", cnpj ?? "").order("codigo");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!cnpj) return;
    const ch = supabase.channel(`rot_${cnpj}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "registro_operacoes", filter: `empresa_cnpj=eq.${cnpj}` }, () => void qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnpj, qc]);

  const [edit, setEdit] = useState<{ id: string | null; form: RotInput } | null>(null);

  if (!cnpj) return <Panel title="Registro de Operações"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;

  const save = async () => {
    if (!edit) return;
    const err = validateRot(edit.form);
    if (err) return toast.error(err);
    const payload = { ...edit.form, justificativa_mitigacao: isRisky(edit.form) ? edit.form.justificativa_mitigacao : null };
    const { data, error } = edit.id
      ? await supabase.from("registro_operacoes").update(payload).eq("id", edit.id).select("codigo").single()
      : await supabase.from("registro_operacoes").insert(payload).select("codigo").single();
    if (error) return toast.error(error.message);
    log(edit.id ? "UPDATE" : "INSERT", "registro_operacoes", `Processo ${data.codigo}`);
    toast.success(`${data.codigo} salvo`);
    setEdit(null);
    void qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (r: RotRow) => {
    if (!confirm(`Excluir ${r.codigo}?`)) return;
    const { error } = await supabase.from("registro_operacoes").delete().eq("id", r.id);
    if (error) return toast.error("Não foi possível excluir.");
    log("DELETE", "registro_operacoes", `Processo ${r.codigo}`);
    void qc.invalidateQueries({ queryKey: key });
  };

  const riskyCount = rows.filter(isRisky).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 2 · (R) Plan · Art. 37 LGPD" title="Registrar as Operações de Tratamento">
        Planilha mestre do ROT. Linhas com menores de idade ou dados pessoais sensíveis recebem tarja vermelha e exigem justificativa das medidas mitigadoras.
      </PageHeader>

      <Panel title={`Planilha mestre · ${rows.length} processos · ${riskyCount} em alerta`} action={canEdit && (
        <Button size="sm" onClick={() => setEdit({ id: null, form: empty(cnpj) })}><Plus className="h-4 w-4" /> Novo processo</Button>
      )}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1800px] text-xs">
            <thead>
              <tr className="border-b text-left">
                {HEADS.map((h, i) => <th key={h} className="px-2 py-2 font-mono font-medium uppercase tracking-wider text-muted-foreground">{i + 1}. {h}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const risk = isRisky(r);
                return (
                  <tr key={r.id} className={cn("border-b align-top", risk && "border-l-4 border-l-destructive bg-destructive/15")}>
                    <td className="px-2 py-2 font-mono font-semibold text-primary">
                      {r.codigo}
                      {risk && <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-destructive"><AlertTriangle className="h-3 w-3" /> Alerta crítico</p>}
                    </td>
                    <td className="px-2 py-2">{r.genero_verbo}</td>
                    <td className="px-2 py-2"><Tags items={r.categoria_titulares} danger="Menores de Idade" /></td>
                    <td className="px-2 py-2"><Tags items={r.dados_pessoais} /></td>
                    <td className="px-2 py-2"><Tags items={r.dados_sensiveis} safe="N/A" /></td>
                    <td className="max-w-64 px-2 py-2">{r.finalidade_especifica}</td>
                    <td className="px-2 py-2">{r.hipotese_tratamento}</td>
                    <td className="px-2 py-2">{r.tempo_retencao}</td>
                    <td className="px-2 py-2">{r.base_prazo}</td>
                    <td className="px-2 py-2">{r.compartilhamento}</td>
                    <td className="px-2 py-2"><Tags items={r.salvaguardas} /></td>
                    <td className="px-2 py-2">{r.infraestrutura}</td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {canEdit && <>
                        <button aria-label="Editar" className="mr-2" onClick={() => {
                          const { id, codigo: _c, criado_por: _p, criado_em: _e, atualizado_em: _a, ...form } = r;
                          setEdit({ id, form });
                        }}><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                        <button aria-label="Excluir" onClick={() => void remove(r)}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                      </>}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={13} className="py-8 text-center text-muted-foreground">Nenhum processo cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {edit && <RotDialog edit={edit} setEdit={setEdit} onSave={save} />}

      <PIOutput dual pi="PI-02: Registro de Operações de Tratamento (ROT)" ready={rows.length > 0} readyHint="Cadastre ao menos um processo na planilha mestre.">
        <p>Registro conforme Art. 37 da LGPD. {rows.length} operações inventariadas, {riskyCount} com tarja de alerta crítico.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {rows.map((r) => (
            <li key={r.id}><b>{r.codigo}</b> — {r.genero_verbo} {r.dados_pessoais.join(", ")} de {r.categoria_titulares.join(", ")} para {r.finalidade_especifica}. Hipótese de Tratamento: {r.hipotese_tratamento}. Retenção: {r.tempo_retencao} ({r.base_prazo}).{r.justificativa_mitigacao && <> Medidas mitigadoras: {r.justificativa_mitigacao}</>}</li>
          ))}
        </ul>
      </PIOutput>
    </div>
  );
}

function Tags({ items, danger, safe }: { items: string[]; danger?: string; safe?: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((t) => <Tag key={t} tone={t === danger || (safe && t !== safe) ? "destructive" : "muted"}>{t}</Tag>)}
    </div>
  );
}

function Chips({ options, value, onChange, exclusive }: { options: string[]; value: string[]; onChange: (v: string[]) => void; exclusive?: string }) {
  const [extra, setExtra] = useState("");
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (o: string) => {
    if (value.includes(o)) return onChange(value.filter((v) => v !== o));
    if (exclusive && o === exclusive) return onChange([o]);
    onChange([...value.filter((v) => v !== exclusive), o]);
  };
  return (
    <div className="flex flex-wrap items-center gap-1">
      {all.map((o) => (
        <button type="button" key={o} onClick={() => toggle(o)} className={cn("rounded-sm border px-2 py-0.5 text-xs", value.includes(o) ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>{o}</button>
      ))}
      <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="+ outro" className="w-24 rounded-sm border bg-background px-1 py-0.5 text-xs"
        onKeyDown={(e) => { if (e.key === "Enter" && extra.trim()) { e.preventDefault(); toggle(extra.trim()); setExtra(""); } }} />
    </div>
  );
}

function RotDialog({ edit, setEdit, onSave }: { edit: { id: string | null; form: RotInput }; setEdit: (e: { id: string | null; form: RotInput } | null) => void; onSave: () => void }) {
  const f = edit.form;
  const up = (p: Partial<RotInput>) => setEdit({ ...edit, form: { ...f, ...p } });
  const risk = isRisky(f);
  const sensitive = f.dados_sensiveis.some((s) => s !== "N/A");
  return (
    <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{edit.id ? "Editar processo" : "Novo processo de tratamento"}</DialogTitle></DialogHeader>
        <div className={cn("grid gap-4 md:grid-cols-2", risk && "rounded-sm border-l-4 border-destructive pl-3")}>
          {!edit.id && (
            <Field label="Setor (gera o ID Processo)">
              <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.setor} onChange={(e) => up({ setor: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
          )}
          <Field label="2. Gênero Verbo">
            <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.genero_verbo} onChange={(e) => up({ genero_verbo: e.target.value })}>
              {VERBS.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="3. Categoria de Titulares" wide><Chips options={TITULARES} value={f.categoria_titulares} onChange={(v) => up({ categoria_titulares: v })} /></Field>
          <Field label="4. Dados Pessoais" wide><Chips options={DADOS} value={f.dados_pessoais} onChange={(v) => up({ dados_pessoais: v })} /></Field>
          <Field label="5. Dados Pessoais Sensíveis" wide><Chips options={SENSIVEIS} value={f.dados_sensiveis} exclusive="N/A" onChange={(v) => up({ dados_sensiveis: v, hipotese_tratamento: "" })} /></Field>
          <Field label="6. Finalidade Específica" wide><Textarea value={f.finalidade_especifica} onChange={(e) => up({ finalidade_especifica: e.target.value })} /></Field>
          <Field label="7. Hipótese de Tratamento" wide>
            <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.hipotese_tratamento} onChange={(e) => up({ hipotese_tratamento: e.target.value })}>
              <option value="">Selecione…</option>
              {HIPOTESES.filter((h) => (sensitive ? h.startsWith("Art. 11") : h.startsWith("Art. 7"))).map((h) => <option key={h}>{h}</option>)}
            </select>
          </Field>
          <Field label="8. Tempo de Retenção"><Input value={f.tempo_retencao} placeholder="5 anos pós-rescisão" onChange={(e) => up({ tempo_retencao: e.target.value })} /></Field>
          <Field label="9. Base do Prazo"><Input value={f.base_prazo} placeholder="Art. 206 do Código Civil" onChange={(e) => up({ base_prazo: e.target.value })} /></Field>
          <Field label="10. Compartilhamento / Destinatários"><Input value={f.compartilhamento} onChange={(e) => up({ compartilhamento: e.target.value })} /></Field>
          <Field label="12. Infraestrutura / Mídia">
            <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.infraestrutura} onChange={(e) => up({ infraestrutura: e.target.value })}>
              {INFRA.map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="11. Salvaguardas de Segurança" wide><Chips options={SALVAGUARDAS} value={f.salvaguardas} onChange={(v) => up({ salvaguardas: v })} /></Field>
          {risk && (
            <div className="rounded-sm border border-destructive bg-destructive/10 p-3 md:col-span-2">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Trava reforçada obrigatória</p>
              <Label className="text-xs">Justifique as medidas técnicas mitigadoras e o controle de acesso físico ou lógico desta linha</Label>
              <Textarea className="mt-1" value={f.justificativa_mitigacao ?? ""} onChange={(e) => up({ justificativa_mitigacao: e.target.value })} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar processo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={cn("space-y-1", wide && "md:col-span-2")}><Label className="text-xs">{label}</Label>{children}</div>;
}
