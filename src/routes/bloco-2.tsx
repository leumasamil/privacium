import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { HIPOTESES, VERBS, type InventoryRow } from "@/lib/priva/data";
import { usePriva } from "@/lib/priva/store";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bloco-2")({
  head: () => ({
    meta: [
      { title: "Bloco 2 · Registrar Operações — PRIVA 2EC" },
      { name: "description", content: "Inventário verbo-operacional com as 12 colunas mandatórias." },
      { property: "og:title", content: "Bloco 2 · Registrar Operações — PRIVA 2EC" },
      { property: "og:description", content: "Inventário verbo-operacional com as 12 colunas mandatórias." },
    ],
  }),
  component: () => <BlockGate n={2}><Bloco2 /></BlockGate>,
});

const COLS: { key: keyof InventoryRow; label: string }[] = [
  { key: "id", label: "ID Processo" }, { key: "verbo", label: "Gênero Verbo" }, { key: "titulares", label: "Categoria Titulares" },
  { key: "dados", label: "Dados Pessoais" }, { key: "sensiveis", label: "Dados Sensíveis" }, { key: "finalidade", label: "Finalidade" },
  { key: "hipotese", label: "Hipótese Legal" }, { key: "retencao", label: "Tempo Retenção" }, { key: "basePrazo", label: "Base do Prazo" },
  { key: "compartilhamento", label: "Compartilhamento" }, { key: "salvaguardas", label: "Salvaguardas" }, { key: "infra", label: "Infraestrutura/Mídia" },
];

function Bloco2() {
  const { inventory, set } = usePriva();
  const update = (i: number, k: keyof InventoryRow, v: string | boolean) => {
    const next = inventory.map((r, j) => (j === i ? { ...r, [k]: v } : r));
    set({ inventory: next }, { op: "UPDATE", target: "inventario", detail: `${inventory[i].id}.${k}` });
  };
  const risky = (r: InventoryRow) => !!r.sensiveis.trim() || r.menores;
  const reinforced = (r: InventoryRow) => /criptograf|mfa|segrega|anonimiz/i.test(r.salvaguardas);
  const complete = inventory.length > 0 && inventory.every((r) => COLS.every((c) => c.key === "sensiveis" || c.key === "compartilhamento" || String(r[c.key]).trim()) && (!risky(r) || reinforced(r)));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 2 · (R) Plan" title="Registrar as Operações de Tratamento">
        Inventário verbo-operacional. A coluna "Hipótese Legal" aceita apenas os incisos dos artigos 7º e 11 da LGPD. Dados sensíveis ou de menores exigem salvaguardas reforçadas (criptografia, MFA, segregação ou anonimização).
      </PageHeader>
      <Panel title={`Inventário · ${inventory.length} processos`} action={
        <Button size="sm" onClick={() => set({ inventory: [...inventory, { id: `PRC-${String(inventory.length + 1).padStart(3, "0")}`, verbo: "Coletar", titulares: "", dados: "", sensiveis: "", menores: false, finalidade: "", hipotese: "", retencao: "", basePrazo: "", compartilhamento: "", salvaguardas: "", infra: "" }] }, { op: "INSERT", target: "inventario", detail: "Novo processo" })}>
          <Plus className="h-4 w-4" /> Processo
        </Button>
      }>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1600px] text-xs">
            <thead>
              <tr className="border-b text-left">
                {COLS.map((c) => <th key={c.key} className="px-2 py-2 font-mono font-medium uppercase tracking-wider text-muted-foreground">{c.label}</th>)}
                <th className="px-2 py-2 font-mono uppercase text-muted-foreground">Menores</th><th />
              </tr>
            </thead>
            <tbody>
              {inventory.map((r, i) => (
                <tr key={i} className={cn("border-b align-top", risky(r) && "bg-destructive/5")}>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      {c.key === "verbo" ? (
                        <select value={r.verbo} onChange={(e) => update(i, "verbo", e.target.value)} className="w-full rounded-sm border bg-background px-1 py-1">
                          {VERBS.map((v) => <option key={v}>{v}</option>)}
                        </select>
                      ) : c.key === "hipotese" ? (
                        <select value={r.hipotese} onChange={(e) => update(i, "hipotese", e.target.value)} className="w-48 rounded-sm border bg-background px-1 py-1">
                          <option value="">Selecione…</option>
                          {HIPOTESES.filter((h) => r.sensiveis ? h.startsWith("Art. 11") : h.startsWith("Art. 7")).map((h) => <option key={h}>{h}</option>)}
                        </select>
                      ) : (
                        <input value={String(r[c.key])} onChange={(e) => update(i, c.key, e.target.value)} className="w-full rounded-sm border bg-background px-1 py-1" />
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center"><input type="checkbox" checked={r.menores} onChange={(e) => update(i, "menores", e.target.checked)} /></td>
                  <td className="px-1 py-1">
                    <button aria-label="Excluir" onClick={() => set({ inventory: inventory.filter((_, j) => j !== i) }, { op: "DELETE", target: "inventario", detail: r.id })}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inventory.filter(risky).map((r) => (
          <div key={r.id} className="mt-3 flex items-center gap-2 rounded-sm border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-xs">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <b>{r.id}</b> trata {r.menores ? "dados de menores" : "dados sensíveis"}.
            {reinforced(r) ? <Tag tone="success">Trava reforçada registrada</Tag> : <Tag tone="destructive">Exige salvaguarda reforçada</Tag>}
          </div>
        ))}
      </Panel>

      <PIOutput pi="PI-02: Registro de Operações de Tratamento (ROT)" ready={complete} readyHint="Preencha todas as colunas obrigatórias e as travas reforçadas.">
        <p>Registro conforme art. 37 da LGPD. {inventory.length} operações inventariadas.</p>
        <ul className="mt-3 list-disc pl-5">
          {inventory.map((r) => <li key={r.id}><b>{r.id}</b> — {r.verbo} {r.dados} de {r.titulares} para {r.finalidade}. Hipótese: {r.hipotese}. Retenção: {r.retencao} ({r.basePrazo}).</li>)}
        </ul>
      </PIOutput>
    </div>
  );
}
