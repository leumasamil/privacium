import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KANBAN_COLUMNS, sha256, type KanbanCard, type KanbanColumn } from "@/lib/priva/data";
import { usePriva } from "@/lib/priva/store";
import { PageHeader, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban 5W2H — PRIVA 2EC" },
      { name: "description", content: "Quadro Kanban transversal para as ações 5W2H do Método BLLOCO." },
      { property: "og:title", content: "Kanban 5W2H — PRIVA 2EC" },
      { property: "og:description", content: "Quadro Kanban transversal para as ações 5W2H do Método BLLOCO." },
    ],
  }),
  component: Kanban,
});

function Kanban() {
  const { kanban, set } = usePriva();
  const [what, setWhat] = useState("");

  const move = async (card: KanbanCard, to: KanbanColumn) => {
    if (to === "doing" && kanban.filter((k) => k.column === "doing").length >= 3) {
      toast.error("Limite de 3 cartões em execução para evitar dispersão.");
      return;
    }
    let evidenceHash = card.evidenceHash;
    if (to === "review" && !evidenceHash) {
      evidenceHash = await sha256(`${card.id}|${card.what}|${Date.now()}`);
      toast.success("Evidência forense anexada com hash SHA-256.");
    }
    if (to === "done" && !evidenceHash) {
      toast.error("Passe pela Revisão do DPO com evidência antes de concluir.");
      return;
    }
    set({ kanban: kanban.map((k) => (k.id === card.id ? { ...k, column: to, evidenceHash } : k)) }, { op: "UPDATE", target: "kanban", detail: `${card.what} → ${to}` });
  };

  return (
    <div>
      <PageHeader eyebrow="Gestão transversal" title="Kanban 5W2H">
        Em Execução aceita no máximo 3 cartões. "Pendente com Terceiros" pausa o cronômetro de conformidade. A revisão exige evidência com hash SHA-256.
      </PageHeader>
      <form className="mb-6 flex max-w-xl gap-2" onSubmit={(e) => {
        e.preventDefault(); if (!what.trim()) return;
        set({ kanban: [...kanban, { id: crypto.randomUUID(), what, why: "—", who: "—", where: "—", when: "—", how: "—", howMuch: "—", block: 1, column: "todo" }] }, { op: "INSERT", target: "kanban", detail: what });
        setWhat("");
      }}>
        <Input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="O quê? (nova ação)" />
        <Button type="submit">Adicionar</Button>
      </form>
      <div className="grid gap-4 xl:grid-cols-5">
        {KANBAN_COLUMNS.map((col, ci) => {
          const cards = kanban.filter((k) => k.column === col.id);
          return (
            <div key={col.id} className="rounded-md border bg-muted/50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">{col.label}</p>
                <span className="font-mono text-xs text-muted-foreground">{cards.length}{col.id === "doing" ? "/3" : ""}</span>
              </div>
              {col.hint && <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">{col.hint}</p>}
              <div className="space-y-2">
                {cards.map((c) => (
                  <div key={c.id} className="rounded-sm border bg-card p-3 text-xs">
                    <p className="font-semibold text-foreground">{c.what}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-2 text-muted-foreground">
                      <dt>Por quê</dt><dd>{c.why}</dd><dt>Quem</dt><dd>{c.who}</dd><dt>Onde</dt><dd>{c.where}</dd>
                      <dt>Quando</dt><dd>{c.when}</dd><dt>Como</dt><dd>{c.how}</dd><dt>Quanto</dt><dd>{c.howMuch}</dd>
                    </dl>
                    <div className="mt-2 flex items-center justify-between">
                      <Tag>Bloco {c.block}</Tag>
                      {c.evidenceHash && <span className="font-mono text-[10px] text-success">#{c.evidenceHash.slice(0, 8)}</span>}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {ci > 0 && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => move(c, KANBAN_COLUMNS[ci - 1].id)}>←</Button>}
                      {ci < 4 && <Button size="sm" variant="outline" className="h-6 flex-1 px-2" onClick={() => move(c, KANBAN_COLUMNS[ci + 1].id)}>Avançar →</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
