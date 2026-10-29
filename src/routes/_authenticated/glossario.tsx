import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GLOSSARIO } from "@/lib/priva/glossario";
import { PageHeader } from "@/components/priva/ui";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/glossario")({
  head: () => ({
    meta: [
      { title: "Glossário — Privacium" },
      { name: "description", content: "Todos os termos e siglas da plataforma Privacium explicados em linguagem simples." },
      { property: "og:title", content: "Glossário — Privacium" },
      { property: "og:description", content: "Todos os termos e siglas da plataforma Privacium explicados em linguagem simples." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Glossario,
});

function Glossario() {
  const [q, setQ] = useState("");
  const f = q.trim().toLowerCase();
  const lista = GLOSSARIO.filter((t) => !f || `${t.termo} ${t.nome ?? ""} ${t.definicao}`.toLowerCase().includes(f));
  return (
    <div>
      <PageHeader eyebrow="Transversal · Glossário" title="Glossário da plataforma">
        Cada termo e sigla usado na Privacium, com definição, exemplo prático e onde aparece.
      </PageHeader>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar termo ou sigla…" aria-label="Buscar no glossário" className="mb-6 max-w-md" />
      <dl className="grid gap-3 md:grid-cols-2">
        {lista.map((t) => (
          <div key={t.id} id={t.id} className="scroll-mt-6 rounded-md border bg-card p-4">
            <dt className="font-semibold text-primary">{t.termo}{t.nome && <span className="font-normal text-muted-foreground"> · {t.nome}</span>}</dt>
            <dd className="mt-1 text-sm">{t.definicao}</dd>
            <dd className="mt-2 text-xs text-muted-foreground"><strong>Exemplo:</strong> {t.exemplo}</dd>
            <dd className="mt-1 text-xs text-muted-foreground"><strong>Onde aparece:</strong> {t.onde}</dd>
          </div>
        ))}
        {!lista.length && <p className="text-sm text-muted-foreground">Nenhum termo encontrado.</p>}
      </dl>
    </div>
  );
}
