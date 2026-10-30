import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Plus, UserX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AREAS_SETORES, areaSetorCompleto } from "@/lib/priva/areasSetores";
import { maskCPF, maskCNPJ } from "@/lib/priva/data";
import { DEMO_MEMBROS } from "@/lib/priva/demo";
import { usePriva } from "@/lib/priva/store";
import { Panel, Tag } from "./ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type Membro = Database["public"]["Tables"]["membros_empresa"]["Row"];
export const PAPEIS_RAC = { R: "Responsável", A: "Aprovador", C: "Consultado" } as const;

const COLUNAS = "id, empresa_id, nome, tipo_documento, email, area_setor, papel_rac, membro_comite, ativo, criado_em, atualizado_em";

/** Lista os membros da empresa (sem a coluna documento, que só é legível pela RPC auditada). */
export function useMembros() {
  const { cnpj, demo } = usePriva();
  return useQuery({
    queryKey: ["membros_empresa", cnpj, demo],
    enabled: !!cnpj,
    queryFn: async (): Promise<Omit<Membro, "documento">[]> => {
      if (demo) return DEMO_MEMBROS;
      const { data: emp, error: e1 } = await supabase.from("empresas").select("id").eq("cnpj", cnpj ?? "").single();
      if (e1) throw e1;
      const { data, error } = await supabase.from("membros_empresa").select(COLUNAS).eq("empresa_id", emp.id).eq("ativo", true).order("nome");
      if (error) throw error;
      return data as Omit<Membro, "documento">[];
    },
  });
}

/** Responsável (R) vinculado a uma Área › Setor — exibido automaticamente no Bloco 2. */
export function responsavelDaArea(membros: Pick<Membro, "nome" | "area_setor" | "papel_rac">[], areaSetor: string | null | undefined): string | null {
  if (!areaSetor) return null;
  return membros.find((m) => m.papel_rac === "R" && m.area_setor === areaSetor)?.nome ?? null;
}

const vazio = { nome: "", tipo_documento: "CPF" as "CPF" | "CNPJ", documento: "", email: "", area: AREAS_SETORES[0]!.area, setor: "", outroSetor: "", papel_rac: "R" as "R" | "A" | "C", membro_comite: false };

export function MembrosEmpresa() {
  const { cnpj, demo, roles, log } = usePriva();
  const qc = useQueryClient();
  const { data: membros = [] } = useMembros();
  const [edit, setEdit] = useState<typeof vazio | null>(null);
  const [revelado, setRevelado] = useState<Record<string, string>>({});
  const canEdit = roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA");

  const revelar = async (m: Omit<Membro, "documento">) => {
    if (demo) return avisarAcaoDemo();
    if (revelado[m.id]) return setRevelado((r) => { const n = { ...r }; delete n[m.id]; return n; });
    const { data, error } = await supabase.rpc("revelar_documento_membro", { _id: m.id });
    if (error) return toast.error(error.message);
    setRevelado((r) => ({ ...r, [m.id]: data }));
    void qc.invalidateQueries({ queryKey: ["trilha"] });
  };

  const salvar = async () => {
    if (demo) return avisarAcaoDemo();
    if (!edit) return;
    const doc = edit.documento.replace(/\D/g, "");
    if (!edit.nome.trim() || !edit.email.trim()) return toast.error("Preencha nome e e-mail.");
    if (edit.tipo_documento === "CPF" && doc.length !== 11) return toast.error("CPF deve ter 11 dígitos.");
    if (edit.tipo_documento === "CNPJ" && doc.length !== 14) return toast.error("CNPJ deve ter 14 dígitos.");
    const setor = edit.setor === "__outro__" ? edit.outroSetor.trim() : edit.setor;
    const { data: emp, error: e1 } = await supabase.from("empresas").select("id").eq("cnpj", cnpj ?? "").single();
    if (e1) return toast.error("Empresa não encontrada.");
    const { error } = await supabase.from("membros_empresa").insert({
      empresa_id: emp.id, nome: edit.nome.trim(), documento: doc, tipo_documento: edit.tipo_documento,
      email: edit.email.trim(), area_setor: areaSetorCompleto(edit.area, setor), papel_rac: edit.papel_rac, membro_comite: edit.membro_comite,
    });
    if (error) return toast.error(error.message);
    log("INSERT", "membros_empresa", `Cadastro do membro ${edit.nome.trim()} (${edit.papel_rac})`, "documento");
    toast.success("Membro cadastrado. O documento fica mascarado e cada revelação é registrada na trilha.");
    setEdit(null);
    void qc.invalidateQueries({ queryKey: ["membros_empresa", cnpj] });
  };

  const desativar = async (m: Omit<Membro, "documento">) => {
    if (demo) return avisarAcaoDemo();
    if (!confirm(`Desativar ${m.nome}? A exclusão é lógica: o registro e a trilha são preservados.`)) return;
    const { error } = await supabase.from("membros_empresa").update({ ativo: false }).eq("id", m.id);
    if (error) return toast.error("Não foi possível desativar.");
    log("UPDATE", "membros_empresa", `Exclusão lógica do membro ${m.nome}`);
    void qc.invalidateQueries({ queryKey: ["membros_empresa", cnpj] });
  };

  const mascara = (m: Omit<Membro, "documento">) => (m.tipo_documento === "CPF" ? "***.***.***-**" : "**.***.***/****-**");

  return (
    <Panel id="membros" title="Membros e Responsabilidades" action={canEdit && (
      <Button size="sm" onClick={() => (demo ? avisarAcaoDemo() : setEdit(vazio))}><Plus className="h-4 w-4" /> Novo membro</Button>
    )}>
      <p className="mb-4 text-xs text-muted-foreground">
        Matriz RAC (Responsável / Aprovador / Consultado) e Comitê de Governança — instância deliberativa com consulta ampla e participação nas aprovações.
        O documento (CPF/CNPJ) fica mascarado por padrão; toda revelação é registrada na trilha forense. A exclusão é lógica, nunca física.
        Este cadastro é uma operação de tratamento própria e consta no ROT (Bloco 2) com finalidade "governança de privacidade".
      </p>
      {!membros.length && <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>}
      <ul className="space-y-2">
        {membros.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-sm border bg-background p-3 text-sm" data-testid={`membro-${m.id}`}>
            <span className="font-medium">{m.nome}</span>
            {m.papel_rac && <Tag tone="primary">{m.papel_rac} · {PAPEIS_RAC[m.papel_rac]}</Tag>}
            {m.membro_comite && <Tag tone="success">Comitê de Governança</Tag>}
            {m.area_setor && <span className="text-xs text-muted-foreground">{m.area_setor}</span>}
            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
              {revelado[m.id] ?? mascara(m)}
              <button aria-label={revelado[m.id] ? "Ocultar documento" : "Revelar documento"} className="text-muted-foreground hover:text-primary" onClick={() => void revelar(m)}>
                {revelado[m.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </span>
            <span className="text-xs text-muted-foreground">{m.email}</span>
            {canEdit && (
              <button aria-label={`Desativar ${m.nome}`} className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => void desativar(m)}>
                <UserX className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {edit && (
        <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>Novo membro</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1"><Label>Nome</Label><Input value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></div>
              <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Tipo de documento</Label>
                <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={edit.tipo_documento} onChange={(e) => setEdit({ ...edit, tipo_documento: e.target.value as "CPF" | "CNPJ" })}>
                  <option value="CPF">CPF</option><option value="CNPJ">CNPJ</option>
                </select>
              </div>
              <div className="space-y-1"><Label>{edit.tipo_documento} (armazenado com criptografia em repouso)</Label><Input value={edit.documento} onChange={(e) => setEdit({ ...edit, documento: e.target.value })} placeholder={edit.tipo_documento === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} /></div>
              <div className="space-y-1">
                <Label>Área</Label>
                <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={edit.area} onChange={(e) => setEdit({ ...edit, area: e.target.value, setor: "" })}>
                  {AREAS_SETORES.map((a) => <option key={a.area} value={a.area}>{a.area}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Setor</Label>
                <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={edit.setor} onChange={(e) => setEdit({ ...edit, setor: e.target.value })}>
                  <option value="">Selecione…</option>
                  {AREAS_SETORES.find((a) => a.area === edit.area)?.setores.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__outro__">outro (especificar)</option>
                </select>
                {edit.setor === "__outro__" && <Input className="mt-1" value={edit.outroSetor} onChange={(e) => setEdit({ ...edit, outroSetor: e.target.value })} placeholder="Especifique o setor" />}
              </div>
              <div className="space-y-1">
                <Label>Papel na matriz RAC</Label>
                <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={edit.papel_rac} onChange={(e) => setEdit({ ...edit, papel_rac: e.target.value as "R" | "A" | "C" })}>
                  {Object.entries(PAPEIS_RAC).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
                </select>
              </div>
              <Label className={cn("flex items-center gap-3 pt-6")}>
                <Checkbox checked={edit.membro_comite} onCheckedChange={(v) => setEdit({ ...edit, membro_comite: v === true })} />
                Membro do Comitê de Governança
              </Label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
              <Button onClick={() => void salvar()}>Cadastrar membro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Panel>
  );
}
