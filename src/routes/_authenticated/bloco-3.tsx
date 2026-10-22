import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, HardDrive, KeyRound } from "lucide-react";
import { tokenizePrompt } from "@/lib/priva/data";
import { usePriva } from "@/lib/priva/store";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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
  const [prompt, setPrompt] = useState("Resuma o histórico do cliente João da Silva, CPF 123.456.789-09, e-mail joao.silva@empresa.com.br, que pediu portabilidade.");
  const { out, map } = tokenizePrompt(prompt);
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

      <Panel title="Simulador do Proxy · Escudo Digital de IA">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">1. Prompt original</p>
            <Textarea rows={7} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <ArrowRight className="hidden self-center text-muted-foreground lg:block" />
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">2. Filtro Regex/NER → API externa</p>
            <div className="min-h-[170px] rounded-sm border bg-primary p-3 font-mono text-xs leading-relaxed text-primary-foreground">{out}</div>
          </div>
          <ArrowRight className="hidden self-center text-muted-foreground lg:block" />
          <div>
            <p className="mb-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><KeyRound className="h-3 w-3" /> 3. Cofre local SQLite (cifrado)</p>
            <table className="w-full rounded-sm border text-xs">
              <thead><tr className="border-b bg-muted text-left"><th className="p-2">Token efêmero</th><th className="p-2">Chave de reversão</th></tr></thead>
              <tbody>
                {map.map((m) => (
                  <tr key={m.token} className="border-b"><td className="p-2 font-mono">{m.token}</td><td className="p-2 font-mono text-muted-foreground">AES-256:{btoa(unescape(encodeURIComponent(m.original))).slice(0, 14)}…</td></tr>
                ))}
                {!map.length && <tr><td colSpan={2} className="p-2 text-muted-foreground">Nenhum dado pessoal detectado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <PIOutput pi="PI-03: Book de Evidências Tecnológicas e Contratuais" ready={coverage === assets.length} readyHint="Ative BitLocker e cofre em todos os endpoints.">
        <p>Evidências de salvaguardas técnicas (art. 46 LGPD; ISO/IEC 27701 cl. 6.9).</p>
        <ul className="mt-3 list-disc pl-5">{assets.map((a) => <li key={a.id}>{a.host}: BitLocker ativo, cofre Cryptomator criado.</li>)}</ul>
        <p className="mt-3">Proxy de IA: pseudonimização por tokens efêmeros com chaves de reversão mantidas localmente.</p>
      </PIOutput>
    </div>
  );
}
