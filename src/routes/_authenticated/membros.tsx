import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, type Role } from "@/lib/priva/data";
import { usePriva } from "@/lib/priva/store";
import { PageHeader, Panel, Tag } from "@/components/priva/ui";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/membros")({
  head: () => ({
    meta: [
      { title: "Membros e cargos — PRIVA 2EC" },
      { name: "description", content: "Atribuição de cargos com privilégio mínimo (RBAC)." },
      { property: "og:title", content: "Membros e cargos — PRIVA 2EC" },
      { property: "og:description", content: "Atribuição de cargos com privilégio mínimo (RBAC)." },
    ],
  }),
  component: Membros,
});

type Member = { id: string; email: string | null; display_name: string | null; roles: Role[] };
const ALL: Role[] = ["ADMIN_SISTEMA", "DPO_OPERACIONAL", "C_SUITE"];

function Membros() {
  const { userId, log } = usePriva();
  const [members, setMembers] = useState<Member[]>([]);
  const [emps, setEmps] = useState<{ id: string; razao_social: string }[]>([]);
  const [vinc, setVinc] = useState<Record<string, string | null>>({});
  const load = useCallback(async () => {
    const [{ data }, { data: e }, { data: u }] = await Promise.all([
      supabase.rpc("list_members"),
      supabase.from("empresas").select("id,razao_social").order("razao_social"),
      supabase.from("usuarios").select("id,empresa_id"),
    ]);
    setMembers((data ?? []) as Member[]);
    setEmps(e ?? []);
    setVinc(Object.fromEntries((u ?? []).map((x) => [x.id, x.empresa_id])));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const toggle = async (m: Member, r: Role, on: boolean) => {
    if (m.id === userId && r === "ADMIN_SISTEMA" && !on) return;
    const res = on
      ? await supabase.from("user_roles").insert({ user_id: m.id, role: r })
      : await supabase.from("user_roles").delete().eq("user_id", m.id).eq("role", r);
    if (!res.error) {
      log(on ? "INSERT" : "DELETE", "user_roles", `${m.email}: ${on ? "concedido" : "revogado"} ${r}`);
      void load();
    }
  };

  const vincular = async (m: Member, empresaId: string) => {
    const { error } = await supabase.from("usuarios").update({ empresa_id: empresaId || null }).eq("id", m.id);
    if (!error) { log("UPDATE", "usuarios", `${m.email}: vinculado à empresa ${empresaId || "nenhuma"}`); void load(); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Painel do Administrador" title="Membros e cargos">
        Novas contas entram sem acesso. Conceda apenas os cargos necessários (need-to-know). Toda concessão é registrada na trilha de auditoria.
      </PageHeader>
      <Panel title={`${members.length} membros`}>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left font-mono text-xs uppercase text-muted-foreground"><th className="py-2">Membro</th>{ALL.map((r) => <th key={r}>{ROLE_LABEL[r]}</th>)}<th>Empresa</th><th>Status</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-2"><p className="font-medium">{m.display_name}</p><p className="text-xs text-muted-foreground">{m.email}</p></td>
                {ALL.map((r) => (
                  <td key={r}><Checkbox checked={m.roles.includes(r)} disabled={m.id === userId && r === "ADMIN_SISTEMA"} onCheckedChange={(v) => toggle(m, r, !!v)} /></td>
                ))}
                <td><select className="rounded-sm border bg-background px-2 py-1 text-xs" value={vinc[m.id] ?? ""} onChange={(e) => void vincular(m, e.target.value)}><option value="">— nenhuma —</option>{emps.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select></td>
                <td>{m.roles.length ? <Tag tone="success">Ativo</Tag> : <Tag tone="warning">Aguardando</Tag>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
