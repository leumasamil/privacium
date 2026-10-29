import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { usePriva } from "@/lib/priva/store";
import { PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/enterprise")({
  head: () => ({
    meta: [
      { title: "Privacium Enterprise" },
      { name: "description", content: "Módulos C-Suite, DRP, SDLC seguro, higiene de dados, RH e BCR." },
      { property: "og:title", content: "Privacium Enterprise" },
      { property: "og:description", content: "Módulos C-Suite, DRP, SDLC seguro, higiene de dados, RH e BCR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Enterprise,
});

const KPI = [{ m: "Mai", sla: 92, passivo: 120 }, { m: "Jun", sla: 94, passivo: 210 }, { m: "Jul", sla: 96, passivo: 340 }, { m: "Ago", sla: 97, passivo: 410 }, { m: "Set", sla: 98, passivo: 560 }];
const QUALITY = [["Exatidão", 91], ["Consistência", 84], ["Completude", 77], ["Atualidade", 69], ["Unicidade", 88], ["Validade", 93], ["Integridade", 86]] as const;
const FAKE = ["Luana Ferreira Pires · 048.***.***-17 · luana.p@example.org", "Rafael Monteiro · 731.***.***-02 · rmonteiro@example.net", "Patrícia Gomes Neto · 264.***.***-55 · pgneto@example.com"];

function Enterprise() {
  const { enterprise, set } = usePriva();
  const [purged, setPurged] = useState<number | null>(null);
  const [pipeline, setPipeline] = useState(0);

  if (!enterprise) return (
    <div className="rounded-md border border-dashed bg-card p-16 text-center">
      <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-4 font-semibold text-primary">Trilho Enterprise inativo</p>
      <p className="mt-1 text-sm text-muted-foreground">Ative o Gatilho Crítico de Migração (&gt;10 mil titulares/mês, complexidade regulatória ou S.A.).</p>
      <Button className="mt-6" onClick={() => set({ enterprise: true }, { op: "UPDATE", target: "tenant", detail: "Trilho Enterprise" })}>Ativar agora</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Extensão avançada" title="Privacium Enterprise" />
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A · C-Suite</TabsTrigger><TabsTrigger value="b">B · Resiliência TI</TabsTrigger>
          <TabsTrigger value="c">C · SDLC Seguro</TabsTrigger><TabsTrigger value="d">D · Higiene de Dados</TabsTrigger>
          <TabsTrigger value="e">E · RH e BCR</TabsTrigger>
        </TabsList>

        <TabsContent value="a" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Panel title="Risco global (ERM)"><p className="font-mono text-3xl font-semibold text-primary">Moderado</p><Tag tone="warning">Apetite: baixo</Tag></Panel>
            <Panel title="SLA titulares"><p className="font-mono text-3xl font-semibold text-primary">98%</p><p className="text-xs text-muted-foreground">respostas em até 15 dias</p></Panel>
            <Panel title="Passivo limpo"><p className="font-mono text-3xl font-semibold text-primary">560 GB</p><p className="text-xs text-muted-foreground">acumulado em 5 meses</p></Panel>
          </div>
          <Panel title="KPIs sênior">
            <div className="h-56"><ResponsiveContainer><BarChart data={KPI}><XAxis dataKey="m" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="passivo" fill="var(--chart-1)" /><Bar dataKey="sla" fill="var(--chart-4)" /></BarChart></ResponsiveContainer></div>
          </Panel>
          <Panel title="Ata · Comitê Multidisciplinar de Privacidade">
            <p className="text-sm"><b>12ª reunião · 15/10/2026.</b> Pauta: RIPD de IA generativa; aprovação do DRP; orçamento do Cryptomator. Deliberação: aprovado por unanimidade. Próxima: 15/11/2026.</p>
          </Panel>
        </TabsContent>

        <TabsContent value="b">
          <Panel title="Plano de Recuperação de Desastres">
            <div className="grid gap-4 md:grid-cols-3">
              {[["Site primário", "Produção", "success"], ["Hot Site", "RTO 1h · RPO 15min", "success"], ["Warm Site", "RTO 24h · RPO 4h", "warning"]].map(([t, d, tone]) => (
                <div key={t} className="rounded-sm border bg-background p-4 text-center"><p className="font-semibold text-primary">{t}</p><p className="mt-1 font-mono text-xs">{d}</p><div className="mt-2"><Tag tone={tone as "success"}>Operacional</Tag></div></div>
              ))}
            </div>
            <pre className="mt-4 rounded-sm bg-muted p-3 font-mono text-xs">{`2026-10-21 02:00 backup-vol-01 AES-256-XTS ✓ réplica SP/RJ\n2026-10-21 02:14 backup-vol-02 AES-256-XTS ✓ réplica Hot Site\n2026-10-22 02:00 backup-vol-01 AES-256-XTS ✓ teste de restauração OK`}</pre>
          </Panel>
        </TabsContent>

        <TabsContent value="c">
          <Panel title="Pipeline CI/CD · Privacy by Design" action={<Button size="sm" onClick={() => { setPipeline(0); [1, 2, 3, 4].forEach((i) => setTimeout(() => setPipeline(i), i * 500)); }}>Rodar pipeline</Button>}>
            <div className="flex flex-wrap gap-2">
              {["build", "scan PII", "faker seed", "testes", "deploy homolog"].map((s, i) => <Tag key={s} tone={pipeline >= i ? "success" : "muted"}>{s}</Tag>)}
            </div>
            <pre className="mt-4 rounded-sm bg-primary p-3 font-mono text-xs text-primary-foreground">{`from faker import Faker\nfake = Faker("pt_BR")\nrows = [(fake.name(), fake.cpf(), fake.email()) for _ in range(10_000)]\n# Dados reais de clientes: BLOQUEADOS em homologação`}</pre>
            {pipeline >= 2 && <ul className="mt-3 space-y-1 font-mono text-xs">{FAKE.map((f) => <li key={f}>{f}</li>)}</ul>}
          </Panel>
        </TabsContent>

        <TabsContent value="d">
          <Panel title="Data Profiling · 7 características">
            <div className="space-y-2">{QUALITY.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-sm"><span className="w-28">{k}</span><div className="h-2 flex-1 rounded-sm bg-muted"><div className="h-2 rounded-sm bg-primary" style={{ width: `${v}%` }} /></div><span className="w-10 font-mono text-xs">{v}%</span></div>
            ))}</div>
            <div className="mt-6 flex items-center gap-4">
              <Button variant="destructive" onClick={() => { setPurged(18432); set({}, { op: "DELETE", target: "passivo_obsoleto", detail: "BEGIN; DELETE 18.432 registros; COMMIT;" }); }}>Purgar "Amianto Digital"</Button>
              {purged && <span className="font-mono text-xs">BEGIN; DELETE {purged.toLocaleString("pt-BR")}; COMMIT; ✓ transação atômica registrada</span>}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="e" className="grid gap-4 md:grid-cols-2">
          <Panel title="RH · Mesa e Tela Limpa">
            <table className="w-full text-sm"><tbody>
              {[["Equipe Financeiro", 96], ["Equipe RH", 88], ["Equipe Comercial", 71]].map(([n, v]) => (
                <tr key={n} className="border-b"><td className="py-2">{n}</td><td className="font-mono">{v}%</td><td><Tag tone={(v as number) > 80 ? "success" : "warning"}>{(v as number) > 80 ? "Bônus elegível" : "Plano de ação"}</Tag></td></tr>
              ))}
            </tbody></table>
          </Panel>
          <Panel title="BCR · Fluxos transfronteiriços">
            <ul className="space-y-2 text-sm">
              <li>Brasil → Portugal · <Tag tone="success">Adequação UE</Tag></li>
              <li>Brasil → EUA · <Tag tone="warning">Cláusulas-padrão (Res. CD/ANPD nº 19/2024)</Tag></li>
              <li>Brasil → Índia · <Tag tone="destructive">BCR em elaboração</Tag></li>
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>

      <PIOutput pi="PI-06 Enterprise: Macro-Framework de Sustentabilidade e Resiliência Corporativa" ready readyHint="">
        <p>Consolidação dos módulos A–E: ERM, DRP (RTO/RPO), SDLC com dados sintéticos, higiene de dados e BCR.</p>
      </PIOutput>
    </div>
  );
}
