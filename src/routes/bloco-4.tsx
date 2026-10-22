import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Timer } from "lucide-react";
import { sha256 } from "@/lib/priva/data";
import { usePriva } from "@/lib/priva/store";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/bloco-4")({
  head: () => ({
    meta: [
      { title: "Bloco 4 · Vigiar e Responder — PRIVA 2EC" },
      { name: "description", content: "Console pgAudit e Plano de Resposta a Incidentes com SLA de 72h." },
      { property: "og:title", content: "Bloco 4 · Vigiar e Responder — PRIVA 2EC" },
      { property: "og:description", content: "Console pgAudit e Plano de Resposta a Incidentes com SLA de 72h." },
    ],
  }),
  component: () => <BlockGate n={4}><Bloco4 /></BlockGate>,
});

const STEPS = [
  "Identificação e acionamento da Célula de Resposta",
  "Contenção: isolar segmentos e endpoints afetados",
  "Preservação forense (ISO 27037): imagens e hashes",
  "Erradicação do ransomware e análise de causa-raiz",
  "Comunicação à ANPD e aos titulares (Res. CD/ANPD nº 15/2024)",
  "Recuperação a partir de backups íntegros e lições aprendidas",
];

const SQL = `-- pgaudit_export_mensal.sql
SET pgaudit.log = 'read, write';
COPY (
  SELECT log_time, user_name, command_tag, object_name, statement
  FROM pgaudit_log
  WHERE log_time >= date_trunc('month', now()) - interval '1 month'
    AND object_schema IN ('titulares','rh','clientes')
) TO '/secure/audit/{MES}.json' WITH (FORMAT json);
DELETE FROM pgaudit_log WHERE log_time < now() - interval '13 months';`;

function Bloco4() {
  const { incidentStart, incidentSteps, set } = usePriva();
  const [console_, setConsole] = useState<string[]>([]);
  const [exported, setExported] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const remaining = incidentStart ? 72 * 3600 * 1000 - (now - new Date(incidentStart).getTime()) : 72 * 3600 * 1000;
  const fmt = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

  const run = async () => {
    const lines = ["$ psql -f pgaudit_export_mensal.sql", "SET", "COPY 4.812 linhas → /secure/audit/2026-09.json", "DELETE 1.203 (retenção > 13 meses)"];
    const h = await sha256(lines.join("\n") + Date.now());
    lines.push(`SHA-256 do lote: ${h}`, "Não repúdio: lote assinado e encadeado à trilha forense ✓");
    setConsole([]);
    lines.forEach((l, i) => setTimeout(() => setConsole((c) => [...c, l]), i * 350));
    setExported(true);
    set({}, { op: "SELECT", target: "pgaudit_log", detail: "Exportação mensal de trilhas" });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 4 · (V) Check" title="Vigiar a Privacidade e Processar Incidentes" />

      <Panel title="Console de extração de logs · pgAudit" action={<Button size="sm" onClick={run}><Play className="h-4 w-4" /> Executar rotina mensal</Button>}>
        <div className="grid gap-4 lg:grid-cols-2">
          <pre className="overflow-auto rounded-sm bg-muted p-4 font-mono text-xs">{SQL}</pre>
          <pre className="min-h-[200px] overflow-auto rounded-sm bg-primary p-4 font-mono text-xs text-primary-foreground">{console_.join("\n") || "Aguardando execução…"}</pre>
        </div>
      </Panel>

      <Panel title="Plano de Resposta a Incidentes · Ransomware" action={
        incidentStart ? <Button size="sm" variant="outline" onClick={() => set({ incidentStart: null, incidentSteps: STEPS.map(() => false) })}>Encerrar simulação</Button>
          : <Button size="sm" variant="destructive" onClick={() => set({ incidentStart: new Date().toISOString() }, { op: "INSERT", target: "incidentes", detail: "Incidente de ransomware declarado" })}>Declarar incidente</Button>
      }>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className={`rounded-md border p-5 text-center ${incidentStart ? (remaining < 24 * 3600000 ? "border-destructive" : "border-warning") : ""}`}>
            <Timer className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 font-mono text-3xl font-semibold text-primary">{fmt(remaining)}</p>
            <p className="mt-1 text-xs text-muted-foreground">SLA regulatório de 72h para comunicação à ANPD</p>
            {incidentStart && incidentSteps[4] && <div className="mt-2"><Tag tone="success">ANPD comunicada</Tag></div>}
          </div>
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-sm border bg-background px-3 py-2 text-sm">
                <Checkbox disabled={!incidentStart || (i > 0 && !incidentSteps[i - 1])} checked={!!incidentSteps[i]}
                  onCheckedChange={(v) => set({ incidentSteps: incidentSteps.map((x, j) => (j === i ? !!v : x)) }, { op: "UPDATE", target: "incidentes", detail: `Passo ${i + 1} ${v ? "concluído" : "reaberto"}` })} />
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span> {s}
              </li>
            ))}
          </ol>
        </div>
      </Panel>

      <PIOutput pi="PI-04: Dossiê de Auditoria de Logs e Resposta de Célula" ready={exported && incidentSteps.every(Boolean)} readyHint="Execute a rotina pgAudit e conclua os 6 passos do PRI.">
        <p>Exportação mensal de trilhas pgAudit concluída com hash de não repúdio.</p>
        <p className="mt-2">Simulação de resposta a ransomware: 6 passos concluídos, comunicação dentro do SLA de 72h.</p>
      </PIOutput>
    </div>
  );
}
