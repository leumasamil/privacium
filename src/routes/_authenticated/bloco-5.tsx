import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { usePriva } from "@/lib/priva/store";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/bloco-5")({
  head: () => ({
    meta: [
      { title: "Bloco 5 · Auditar e Mitigar — PRIVA 2EC" },
      { name: "description", content: "RIPD para IA generativa e Escudo Jurídico de Dosimetria (Res. CD/ANPD nº 4/2023)." },
      { property: "og:title", content: "Bloco 5 · Auditar e Mitigar — PRIVA 2EC" },
      { property: "og:description", content: "RIPD para IA generativa e Escudo Jurídico de Dosimetria (Res. CD/ANPD nº 4/2023)." },
    ],
  }),
  component: () => <BlockGate n={5}><Bloco5 /></BlockGate>,
});

const RISKS = [
  { id: "vies", label: "Viés discriminatório" },
  { id: "aluc", label: "Alucinação / informação falsa" },
  { id: "inj", label: "Injeção de prompt" },
];

// Atenuantes do art. 13 da Resolução CD/ANPD nº 4/2023 correlacionadas aos PIs
const DOSIMETRIA = [
  { pi: "PI-01", rule: "Art. 13, IV – Comprovação de política de boas práticas e governança", pct: 20 },
  { pi: "PI-02", rule: "Art. 13, IV – Registro das operações (art. 37 LGPD) como mecanismo de governança", pct: 10 },
  { pi: "PI-03", rule: "Art. 13, IV – Adoção de medidas técnicas de segurança (art. 46 LGPD)", pct: 10 },
  { pi: "PI-04", rule: "Art. 13, II/III – Cessação da infração e medidas para reverter efeitos do dano", pct: 20 },
];

type R = { prob: number; imp: number; mitig: string };
const DEF: R = { prob: 3, imp: 3, mitig: "" };

function Bloco5() {
  const { signatures } = usePriva();
  const [ripd, setRipd] = useState<Record<string, R>>(
    Object.fromEntries(RISKS.map((r) => [r.id, { prob: 3, imp: 3, mitig: "" }])),
  );
  const reduction = DOSIMETRIA.reduce((a, d) => a + (signatures[d.pi] ? d.pct : 0), 0);
  const ready = RISKS.every((r) => (ripd[r.id] ?? DEF).mitig.trim().length > 10);
  const tone = (n: number): "destructive" | "warning" | "success" => (n >= 15 ? "destructive" : n >= 8 ? "warning" : "success");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 5 · (A) Act" title="Auditar o Sistema de Privacidade e Mitigar Riscos" />

      <Panel title="RIPD · IA generativa corporativa">
        <div className="space-y-4">
          {RISKS.map((r) => {
            const v = ripd[r.id] ?? DEF; const score = v.prob * v.imp;
            return (
              <div key={r.id} className="grid gap-3 rounded-sm border bg-background p-4 md:grid-cols-[200px_120px_120px_1fr_80px] md:items-center">
                <p className="font-semibold text-primary">{r.label}</p>
                {(["prob", "imp"] as const).map((k) => (
                  <label key={k} className="text-xs text-muted-foreground">{k === "prob" ? "Probabilidade" : "Impacto"}
                    <input type="range" min={1} max={5} value={v[k]} onChange={(e) => setRipd({ ...ripd, [r.id]: { ...v, [k]: +e.target.value } })} className="w-full accent-primary" />
                  </label>
                ))}
                <Textarea rows={2} placeholder="Medidas de mitigação…" value={v.mitig} onChange={(e) => setRipd({ ...ripd, [r.id]: { ...v, mitig: e.target.value } })} />
                <Tag tone={tone(score)}>Risco {score}</Tag>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Escudo Jurídico de Dosimetria · Res. CD/ANPD nº 4/2023">
        <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
          <ul className="divide-y">
            {DOSIMETRIA.map((d) => (
              <li key={d.pi} className="flex items-center gap-3 py-3 text-sm">
                {signatures[d.pi] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className="w-14 font-mono text-xs">{d.pi}</span>
                <span className="flex-1">{d.rule}</span>
                <span className="font-mono text-xs">−{d.pct}%</span>
              </li>
            ))}
          </ul>
          <div className="rounded-md border p-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Redução estimada da multa-base</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-success">−{reduction}%</p>
            <p className="mt-2 text-xs text-muted-foreground">Estimativa ilustrativa; a aplicação concreta depende da análise da ANPD.</p>
          </div>
        </div>
      </Panel>

      <PIOutput pi="PI-05: Escudo Jurídico de Dosimetria (PREG/RIPD)" ready={ready} readyHint="Descreva a mitigação de cada risco de IA.">
        <h3 className="font-semibold">RIPD – IA generativa</h3>
        <ul className="list-disc pl-5">{RISKS.map((r) => <li key={r.id}>{r.label}: risco {(ripd[r.id] ?? DEF).prob * (ripd[r.id] ?? DEF).imp}. Mitigação: {ripd[r.id]?.mitig}</li>)}</ul>
        <h3 className="mt-4 font-semibold">Dosimetria</h3>
        <p>Atenuantes comprovadas: redução estimada de {reduction}% conforme art. 13 da Res. CD/ANPD nº 4/2023.</p>
        <p className="mt-3 text-muted-foreground">Ao concluir, o ciclo PDCA retorna ao Bloco 1 para novo diagnóstico.</p>
      </PIOutput>
    </div>
  );
}
