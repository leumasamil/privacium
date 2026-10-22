import { useState } from "react";
import { Send, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Panel, Tag } from "./ui";
import { usePriva } from "@/lib/priva/store";

const PROVIDERS = ["OpenAI - GPT-4o-mini", "Google Gemini - Pro"] as const;
const URL_KEY = "priva2ec-shield-url";

type Vault = { token: string; original: string }[];

/** Tokeniza CPFs e e-mails via Regex; o cofre (mapa de reversão) nunca sai do navegador. */
export function sanitize(text: string) {
  const vault: Vault = [];
  const used = new Set<string>();
  const make = (kind: string, original: string) => {
    const hit = vault.find((v) => v.original === original);
    if (hit) return hit.token;
    let n: string;
    do n = String(1000 + Math.floor(Math.random() * 9000)); while (used.has(n));
    used.add(n);
    const token = `[${kind}_TOKEN_${n}]`;
    vault.push({ token, original });
    return token;
  };
  let out = text.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, (m) => make("CPF", m));
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => make("EMAIL", m));
  return { out, vault };
}

function restore(text: string, vault: Vault) {
  return vault.reduce((acc, v) => acc.split(v.token).join(v.original), text);
}

function mockAI(sanitized: string, provider: string, vault: Vault) {
  const tokens = vault.map((v) => v.token);
  return `[${provider}] Análise concluída sobre a solicitação recebida.\n\n` +
    (tokens.length
      ? `Identifiquei ${tokens.length} referência(s) a titulares: ${tokens.join(", ")}. Recomendo registrar o atendimento no ROT e responder ao titular em até 15 dias, utilizando o contato ${tokens.find((t) => t.startsWith("[EMAIL")) ?? "cadastrado"}.`
      : `Nenhum dado pessoal identificado. Resumo: "${sanitized.slice(0, 120)}".`);
}

export function AIShield() {
  const { log } = usePriva();
  const [provider, setProvider] = useState<string>(PROVIDERS[0]);
  const [prompt, setPrompt] = useState("Redija uma resposta para Maria Souza, CPF 123.456.789-09, e-mail maria.souza@cliente.com.br, que pediu a exclusão dos seus dados.");
  const [url, setUrl] = useState(() => (typeof window !== "undefined" && localStorage.getItem(URL_KEY)) || "http://localhost:8000/api/v1/shield/execute");
  const [result, setResult] = useState<{ packet: string; answer: string; vault: Vault; source: "api" | "mock" } | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    localStorage.setItem(URL_KEY, url);
    const { out, vault } = sanitize(prompt);
    let answer: string | null = null;
    let source: "api" | "mock" = "mock";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_prompt: out, provider }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const j = await res.json();
        answer = String(j.response ?? j.answer ?? j.output ?? JSON.stringify(j));
        source = "api";
      }
    } catch {
      /* API indisponível: usa resposta simulada */
    }
    if (!answer) answer = mockAI(out, provider, vault);
    setResult({ packet: out, answer: restore(answer, vault), vault, source });
    log("INSERT", "escudo_ia", `Prompt higienizado (${vault.length} tokens) enviado a ${provider} via ${source}`);
    setBusy(false);
  };

  return (
    <Panel title="Escudo Digital Proxy de IA">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Entrada do colaborador</p>
          <label className="block text-sm">Provedor externo
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1 w-full rounded-sm border bg-background px-3 py-2 text-sm">
              {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-sm">Prompt
            <Textarea rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mt-1" />
          </label>
          <Button size="lg" className="w-full" onClick={send} disabled={busy || !prompt.trim()}>
            <Send className="h-4 w-4" /> {busy ? "Enviando…" : "Enviar com Segurança"}
          </Button>
          <label className="block text-xs text-muted-foreground">Endpoint do proxy (POST)
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 font-mono text-xs" />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Visão do perímetro blindado</p>
            {result && (result.source === "api"
              ? <Tag tone="success"><Wifi className="h-3 w-3" /> API externa</Tag>
              : <Tag tone="warning"><WifiOff className="h-3 w-3" /> Resposta simulada</Tag>)}
          </div>
          <div className="rounded-sm border-2 border-dashed border-destructive/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">1 · Pacote de rede higienizado (o que sai da empresa)</p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{result?.packet ?? "Aguardando envio…"}</pre>
          </div>
          <div className="rounded-sm border-2 border-success/60 bg-success/5 p-4">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-success"><ShieldCheck className="h-3 w-3" /> 2 · Resposta da IA (ambiente seguro)</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{result?.answer ?? "—"}</pre>
          </div>
          {result && result.vault.length > 0 && (
            <table className="w-full rounded-sm border text-xs">
              <thead><tr className="border-b bg-muted text-left"><th className="p-2">Token (saiu)</th><th className="p-2">Dado real (ficou no cofre local)</th></tr></thead>
              <tbody>{result.vault.map((v) => <tr key={v.token} className="border-b"><td className="p-2 font-mono">{v.token}</td><td className="p-2 font-mono">{v.original}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>
    </Panel>
  );
}
