import { createFileRoute } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import { AIShield } from "@/components/priva/AIShield";
import { usePriva } from "@/lib/priva/store";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/bloco-3")({
  head: () => ({
    meta: [
      { title: "Bloco 3 · Implementar Salvaguardas — PRIVA 2EC" },
      { name: "description", content: "Gestão de ativos (BitLocker, Cryptomator) e simulador do Escudo Digital de IA." },
      { property: "og:title", content: "Bloco 3 · Implementar Salvaguardas — PRIVA 2EC" },
      { property: "og:description", content: "Gestão de ativos (BitLocker, Cryptomator) e simulador do Escudo Digital de IA." },
    ],
  }),
  component: () => <BlockGate n={3}><Bloco3 /></BlockGate>,
});

function Bloco3() {
  const { assets, set } = usePriva();
  const toggle = (id: string, k: "bitlocker" | "vault", v: boolean) =>
    set({ assets: assets.map((a) => (a.id === id ? { ...a, [k]: v } : a)) }, { op: "UPDATE", target: "ativos", detail: `${id}.${k}=${v}` });
  const coverage = assets.filter((a) => a.bitlocker && a.vault).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 3 · (I) Do" title="Implementar Salvaguardas Técnicas e Jurídicas" />

      <Panel title={`Ativos tecnológicos · ${coverage}/${assets.length} blindados`}>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left font-mono text-xs uppercase text-muted-foreground"><th className="py-2">Endpoint</th><th>BitLocker</th><th>Cofre Cryptomator</th><th>Status</th></tr></thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="py-2 font-mono"><HardDrive className="mr-2 inline h-4 w-4" />{a.host}</td>
                <td><Switch checked={a.bitlocker} onCheckedChange={(v) => toggle(a.id, "bitlocker", v)} /></td>
                <td><Switch checked={a.vault} onCheckedChange={(v) => toggle(a.id, "vault", v)} /></td>
                <td>{a.bitlocker && a.vault ? <Tag tone="success">Conforme</Tag> : <Tag tone="warning">Pendente</Tag>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <AIShield />

      <PIOutput pi="PI-03: Book de Evidências Tecnológicas e Contratuais" ready={coverage === assets.length} readyHint="Ative BitLocker e cofre em todos os endpoints.">
        <p>Evidências de salvaguardas técnicas (art. 46 LGPD; ISO/IEC 27701 cl. 6.9).</p>
        <ul className="mt-3 list-disc pl-5">{assets.map((a) => <li key={a.id}>{a.host}: BitLocker ativo, cofre Cryptomator criado.</li>)}</ul>
        <p className="mt-3">Proxy de IA: pseudonimização por tokens efêmeros com chaves de reversão mantidas localmente.</p>
      </PIOutput>
    </div>
  );
}
