import { PrivaciumLogo } from "@/components/priva/Logo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => (typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
  head: () => ({
    meta: [
      { title: "Entrar — Privacium" },
      { name: "description", content: "Acesso seguro à plataforma Privacium de governança de privacidade." },
      { property: "og:title", content: "Entrar — Privacium" },
      { property: "og:description", content: "Acesso seguro à plataforma Privacium de governança de privacidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  return p && p.startsWith("/") && !p.startsWith("//") ? p : "/painel";
}

function AuthPage() {
  const { redirect: next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safePath(next) as "/painel" });
    });
  }, [navigate, next]);

  const google = async () => {
    setBusy(true); setMsg(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) { setMsg({ tone: "err", text: "Não foi possível entrar com o Google. Tente novamente." }); setBusy(false); return; }
    if (result.redirected) return;
    navigate({ to: safePath(next) as "/painel" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        void supabase.rpc("registrar_falha_login", { _email: email });
        setMsg({ tone: "err", text: "E-mail ou senha inválidos, ou e-mail ainda não confirmado." });
      }
      else navigate({ to: safePath(next) as "/painel" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMsg({ tone: "err", text: error.message });
      else setMsg({ tone: "ok", text: "Conta criada. Confirme pelo link enviado ao seu e-mail para entrar." });
    }
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <PrivaciumLogo size="lg" className="text-sidebar-accent-foreground" />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em]">Privacy by Design · ISO/IEC 27701 · 27037</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sidebar-accent-foreground">Governança de privacidade como ciclo contínuo.</h1>
          <p className="mt-4 max-w-md text-sm">Método BLLOCO sob a lógica do Ciclo Privacium Semestral: preparar, registrar, implementar, vigiar e auditar.</p>
        </div>
        <p className="flex items-center gap-2 text-xs"><ShieldCheck className="h-4 w-4 text-sidebar-primary" /> Toda ação é registrada em trilha de auditoria imutável.</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <PrivaciumLogo size="sm" className="mb-6 text-primary lg:hidden" />
          <h2 className="text-2xl font-semibold text-primary">{mode === "in" ? "Entrar" : "Criar conta"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "in" ? "Acesse o painel do seu cargo." : "Novas contas aguardam liberação de um administrador."}
          </p>
          <Button type="button" variant="outline" className="mt-6 h-11 w-full gap-2 border-primary text-base font-semibold" disabled={busy} onClick={google}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.72 14.56 2.8 12 2.8 6.92 2.8 2.8 6.92 2.8 12s4.12 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51z" /></svg>
            Entrar com Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou com e-mail<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-4">
            <div><Label htmlFor="email">E-mail corporativo</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="password">Senha corporativa</Label><Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {msg && <p className={msg.tone === "ok" ? "text-sm text-success" : "text-sm text-destructive"}>{msg.text}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
          </form>
          <button className="mt-4 text-sm text-primary hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
            {mode === "in" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
