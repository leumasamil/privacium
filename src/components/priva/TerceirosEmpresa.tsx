import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_TERCEIROS } from "@/lib/priva/demo";
import { usePriva } from "@/lib/priva/store";
import {
  ALERTA_TERCEIRO_SEM_CONTRATO, CHECKLIST_ART39, FONTE_LGPD_PLANALTO, HIPOTESES_ART33, LITERAL_ART33_CAPUT, LITERAL_ART39, LITERAL_ART5_VII, LITERAL_ART5_X,
  NOTA_SUBOPERADOR, PAPEIS_CADEIA, ROTULO_CADEIA, checklistCompleto, terceiroBloqueado, validarTerceiro, type ChecklistArt39, type PapelCadeia,
} from "@/lib/priva/terceiros";
import { Panel, Tag } from "./ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export type Terceiro = Omit<Database["public"]["Tables"]["terceiros_empresa"]["Row"], "cnpj">;
const COLUNAS = "id, empresa_id, razao_social, papel_cadeia, operador_principal_id, contrato_vigente, data_contrato, clausulas_art39, checklist_art39, transferencia_internacional, hipotese_art33, encarregado_contato, ativo, criado_em, atualizado_em";

/** Terceiros ativos da empresa (sem o CNPJ, que só sai pela função auditada). */
export function useTerceiros() {
  const { cnpj, demo } = usePriva();
  return useQuery({
    queryKey: ["terceiros_empresa", cnpj, demo],
    enabled: !!cnpj,
    queryFn: async (): Promise<Terceiro[]> => {
      if (demo) return DEMO_TERCEIROS;
      const { data: emp, error: e1 } = await supabase.from("empresas").select("id").eq("cnpj", cnpj ?? "").single();
      if (e1) throw e1;
      const { data, error } = await supabase.from("terceiros_empresa").select(COLUNAS).eq("empresa_id", emp.id).eq("ativo", true).order("razao_social");
      if (error) throw error;
      return data as Terceiro[];
    },
  });
}

const vazio = {
  razao_social: "", cnpj: "", papel_cadeia: "OPERADOR" as PapelCadeia, operador_principal_id: null as string | null, contrato_vigente: false, data_contrato: null as string | null,
  checklist_art39: {} as ChecklistArt39, transferencia_internacional: false, hipotese_art33: null as string | null, encarregado_contato: "",
};

export function TerceirosEmpresa() {
  const { cnpj, demo, roles, log } = usePriva();
  const qc = useQueryClient();
  const { data: terceiros = [] } = useTerceiros();
  const [edit, setEdit] = useState<typeof vazio | null>(null);
  const [revelado, setRevelado] = useState<Record<string, string>>({});
  const canEdit = roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA");
  const operadores = terceiros.filter((t) => t.papel_cadeia === "OPERADOR");

  const revelar = async (t: Terceiro) => {
    if (demo) return avisarAcaoDemo();
    if (revelado[t.id]) return setRevelado((r) => { const n = { ...r }; delete n[t.id]; return n; });
    const { data, error } = await supabase.rpc("revelar_cnpj_terceiro", { _id: t.id });
    if (error) return toast.error(error.message);
    setRevelado((r) => ({ ...r, [t.id]: data }));
    void qc.invalidateQueries({ queryKey: ["trilha"] });
  };

  const salvar = async () => {
    if (demo) return avisarAcaoDemo();
    if (!edit) return;
    const err = validarTerceiro(edit);
    if (err) return toast.error(err);
    const { data: emp, error: e1 } = await supabase.from("empresas").select("id").eq("cnpj", cnpj ?? "").single();
    if (e1) return toast.error("Empresa não encontrada.");
    const { error } = await supabase.from("terceiros_empresa").insert({
      empresa_id: emp.id, razao_social: edit.razao_social.trim(), cnpj: edit.cnpj.replace(/\D/g, ""), papel_cadeia: edit.papel_cadeia,
      operador_principal_id: edit.papel_cadeia === "SUBOPERADOR" ? edit.operador_principal_id : null, contrato_vigente: edit.contrato_vigente,
      data_contrato: edit.data_contrato, checklist_art39: edit.checklist_art39, transferencia_internacional: edit.transferencia_internacional,
      hipotese_art33: edit.transferencia_internacional ? edit.hipotese_art33 : null, encarregado_contato: edit.encarregado_contato.trim() || null,
    });
    if (error) return toast.error(error.message);
    log("INSERT", "terceiros_empresa", `Cadastro do terceiro ${edit.razao_social.trim()} (${ROTULO_CADEIA[edit.papel_cadeia]})`, "cnpj");
    toast.success("Terceiro cadastrado. O CNPJ fica mascarado e cada revelação é registrada na trilha.");
    setEdit(null);
    void qc.invalidateQueries({ queryKey: ["terceiros_empresa", cnpj] });
  };

  const desativar = async (t: Terceiro) => {
    if (demo) return avisarAcaoDemo();
    if (!confirm(`Desativar ${t.razao_social}? A exclusão é lógica: o registro e a trilha são preservados.`)) return;
    const { error } = await supabase.from("terceiros_empresa").update({ ativo: false }).eq("id", t.id);
    if (error) return toast.error("Não foi possível desativar.");
    log("UPDATE", "terceiros_empresa", `Exclusão lógica do terceiro ${t.razao_social}`);
    void qc.invalidateQueries({ queryKey: ["terceiros_empresa", cnpj] });
  };

  const hip = HIPOTESES_ART33.find((h) => h.valor === edit?.hipotese_art33);

  return (
    <Panel id="terceiros" title="Terceiros (operadores, controladores independentes e suboperadores)" action={canEdit && (
      <Button size="sm" onClick={() => (demo ? avisarAcaoDemo() : setEdit(vazio))}><Plus className="h-4 w-4" /> Novo terceiro</Button>
    )}>
      <div className="mb-4 space-y-1 text-xs text-muted-foreground" data-testid="fundamentos-terceiros">
        <p>Destinatários externos dos PRT (Bloco 2, Etapa 2). O CNPJ fica mascarado; a leitura é restrita ao DPO e ao Comitê de Governança, e toda revelação é registrada na trilha. A exclusão é lógica. Este cadastro consta no ROT como operação própria: "gestão de fornecedores com acesso a dados pessoais".</p>
        <p>LGPD art. 5º, VII: "{LITERAL_ART5_VII}". Art. 5º, X: "{LITERAL_ART5_X}". Art. 39: "{LITERAL_ART39}" Fonte: <a className="underline" href={FONTE_LGPD_PLANALTO} target="_blank" rel="noreferrer">{FONTE_LGPD_PLANALTO}</a></p>
      </div>
      {!terceiros.length && <p className="text-sm text-muted-foreground">Nenhum terceiro cadastrado.</p>}
      <ul className="space-y-2">
        {terceiros.map((t) => {
          const principal = terceiros.find((x) => x.id === t.operador_principal_id);
          return (
            <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-sm border bg-background p-3 text-sm" data-testid={`terceiro-${t.id}`}>
              <span className="font-medium">{t.razao_social}</span>
              <Tag tone="primary">{ROTULO_CADEIA[t.papel_cadeia as PapelCadeia]}</Tag>
              {principal && <span className="text-xs text-muted-foreground">sob {principal.razao_social}</span>}
              {t.transferencia_internacional && <Tag tone="muted">Transf. internacional · art. 33, {t.hipotese_art33}</Tag>}
              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                {revelado[t.id] ?? "**.***.***/****-**"}
                <button aria-label={revelado[t.id] ? "Ocultar CNPJ" : "Revelar CNPJ"} className="hover:text-primary" onClick={() => void revelar(t)}>
                  {revelado[t.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </span>
              {terceiroBloqueado(t)
                ? <span className="flex items-center gap-1 text-xs font-semibold text-destructive"><AlertTriangle className="h-3 w-3" /> {ALERTA_TERCEIRO_SEM_CONTRATO}</span>
                : <Tag tone="success">Contrato vigente · checklist art. 39 completo</Tag>}
              {canEdit && <button aria-label={`Desativar ${t.razao_social}`} className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => void desativar(t)}><Trash2 className="h-4 w-4" /></button>}
            </li>
          );
        })}
      </ul>

      {edit && (
        <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>Novo terceiro</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1"><Label>Razão social</Label><Input value={edit.razao_social} onChange={(e) => setEdit({ ...edit, razao_social: e.target.value })} /></div>
              <div className="space-y-1"><Label>CNPJ (mascarado após o cadastro)</Label><Input value={edit.cnpj} placeholder="00.000.000/0000-00" onChange={(e) => setEdit({ ...edit, cnpj: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Papel na cadeia</Label>
                <select aria-label="Papel na cadeia" className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={edit.papel_cadeia} onChange={(e) => setEdit({ ...edit, papel_cadeia: e.target.value as PapelCadeia })}>
                  {PAPEIS_CADEIA.map((p) => <option key={p} value={p}>{ROTULO_CADEIA[p]}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label>Contato do encarregado do terceiro</Label><Input value={edit.encarregado_contato} onChange={(e) => setEdit({ ...edit, encarregado_contato: e.target.value })} /></div>
              {edit.papel_cadeia === "SUBOPERADOR" && (
                <div className="space-y-1 md:col-span-2" data-testid="suboperador-vinculo">
                  <Label>Operador principal (obrigatório)</Label>
                  <select aria-label="Operador principal" className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={edit.operador_principal_id ?? ""} onChange={(e) => setEdit({ ...edit, operador_principal_id: e.target.value || null })}>
                    <option value="">Selecione…</option>
                    {operadores.map((o) => <option key={o.id} value={o.id}>{o.razao_social}</option>)}
                  </select>
                  <p className="text-[11px] text-muted-foreground">{NOTA_SUBOPERADOR}</p>
                </div>
              )}
              <Label className="flex items-center gap-3"><Checkbox checked={edit.contrato_vigente} onCheckedChange={(v) => setEdit({ ...edit, contrato_vigente: v === true })} /> Contrato vigente</Label>
              <div className="space-y-1"><Label>Data do contrato</Label><Input type="date" value={edit.data_contrato ?? ""} onChange={(e) => setEdit({ ...edit, data_contrato: e.target.value || null })} /></div>
              <fieldset className="rounded-sm border p-3 md:col-span-2" data-testid="checklist-art39">
                <legend className="px-1 text-xs font-semibold">Checklist do instrumento escrito — art. 39 (instruções do controlador) · {checklistCompleto(edit.checklist_art39) ? "completo" : "incompleto"}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CHECKLIST_ART39.map(([k, rot]) => (
                    <Label key={k} className="flex items-center gap-2 text-xs font-normal">
                      <Checkbox checked={edit.checklist_art39[k] === true} onCheckedChange={(v) => setEdit({ ...edit, checklist_art39: { ...edit.checklist_art39, [k]: v === true } })} /> {rot}
                    </Label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Itens do método. O texto legal do art. 39 é: "{LITERAL_ART39}"</p>
              </fieldset>
              <Label className="flex items-center gap-3 md:col-span-2"><Checkbox checked={edit.transferencia_internacional} onCheckedChange={(v) => setEdit({ ...edit, transferencia_internacional: v === true, hipotese_art33: v === true ? edit.hipotese_art33 : null })} /> Há transferência internacional de dados pessoais</Label>
              {edit.transferencia_internacional && (
                <div className="space-y-1 md:col-span-2" data-testid="hipotese-art33">
                  <Label>Hipótese do art. 33 (obrigatória)</Label>
                  <select aria-label="Hipótese do art. 33" className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={edit.hipotese_art33 ?? ""} onChange={(e) => setEdit({ ...edit, hipotese_art33: e.target.value || null })}>
                    <option value="">Selecione…</option>
                    {HIPOTESES_ART33.map((h) => <option key={h.valor} value={h.valor}>{h.rotulo}</option>)}
                  </select>
                  {hip ? <p className="text-[11px] text-muted-foreground">Art. 33: "{LITERAL_ART33_CAPUT} … {hip.literal}"</p>
                    : <p role="alert" className="text-xs font-semibold text-destructive">Selecione a hipótese do art. 33 para salvar.</p>}
                </div>
              )}
            </div>
            {validarTerceiro(edit) && <p className="text-xs text-destructive">Pendência para salvar: {validarTerceiro(edit)}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
              <Button disabled={!!validarTerceiro(edit)} onClick={() => void salvar()}>Cadastrar terceiro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Panel>
  );
}
