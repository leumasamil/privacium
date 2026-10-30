import { useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, FileSignature, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { maskCNPJ, maskCPF, maskEmail, maskName, sha256 } from "@/lib/priva/data";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { TelaBloqueio } from "./TelaBloqueio";
import { useEncarregado } from "@/lib/priva/useEncarregado";

import { avisarAcaoDemo } from '@/lib/priva/demoAction';
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 border-b pb-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-sm text-muted-foreground">{children}</div>}
    </header>
  );
}

export function Panel({ title, children, className, action, id }: { title?: string; children: ReactNode; className?: string; action?: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-6 rounded-md border bg-card p-5", className)}>
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 text-sm font-semibold uppercase tracking-wider text-primary">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tag({ tone = "muted", children }: { tone?: "muted" | "destructive" | "warning" | "success" | "primary"; children: ReactNode }) {
  const map = {
    muted: "bg-muted text-muted-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
    success: "bg-success text-success-foreground",
    primary: "bg-primary text-primary-foreground",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium", map[tone])}>{children}</span>;
}

const ROLE_KEY: Record<string, string> = { ADMIN_SISTEMA: "ADM-2EC", DPO_OPERACIONAL: "DPO-2EC", C_SUITE: "" };

/** Dado pessoal mascarado; revelação exige credencial do cargo (C-Suite não tem need-to-know). */
export function Masked({ value, kind }: { value: string; kind: "cpf" | "cnpj" | "name" | "email" }) {
  const { role, log } = usePriva();
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const masked = kind === "cpf" ? maskCPF(value) : kind === "cnpj" ? maskCNPJ(value) : kind === "name" ? maskName(value) : maskEmail(value);
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs">
      {shown ? value : masked}
      <button
        aria-label={shown ? "Ocultar" : "Revelar"}
        className="text-muted-foreground hover:text-primary"
        onClick={() => {
          if (shown) return setShown(false);
          log("SELECT", "titulares", `Clique em visualizar ${kind} ${masked}`, kind);
          setOpen(true);
        }}
      >
        {shown ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Credencial de descriptografia</DialogTitle>
            <DialogDescription>
              {role === "C_SUITE"
                ? "O perfil C-Suite não possui necessidade de conhecer (need-to-know) dados de titulares."
                : `Informe a chave do perfil para revelar o dado. Demonstração: ${ROLE_KEY[role]}`}
            </DialogDescription>
          </DialogHeader>
          {role !== "C_SUITE" && <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Chave do cargo" />}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <DialogFooter>
            <Button
              disabled={role === "C_SUITE"}
              onClick={() => {
                if (key === ROLE_KEY[role]) {
                  setShown(true); setOpen(false); setKey(""); setErr("");
                  log("SELECT", "titulares", `Revelação de ${kind} ${masked}`, kind);
                } else setErr("Credencial inválida. Tentativa registrada.");
                if (key !== ROLE_KEY[role]) log("SELECT", "titulares", `Tentativa negada de revelar ${kind}`);
              }}
            >Revelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
}

export function PIOutput({ pi, ready, readyHint, children, dual, acoesExtras }: { pi: string; ready: boolean; readyHint: string; children: ReactNode; dual?: boolean; acoesExtras?: ReactNode }) {
  const { signatures, sign, set, email, cnpj, log, demo, demoAssinar } = usePriva();
  const code = pi.slice(0, 5).replace(" ", "");
  const sig = signatures[code];
  const encarregado = useEncarregado();
  const [open, setOpen] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  return (
    <Panel id="assinatura" title="Saída obrigatória" className="border-primary/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-primary">{pi}</p>
          {sig ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-success" data-testid="rodape-chancela"><ShieldCheck className="h-3 w-3 shrink-0" /> Chancelado em {new Date(sig.ts).toLocaleString("pt-BR")} · <span className="break-all font-mono">SHA-256 {sig.hash}</span></p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{ready ? "Pronto para chancela digital." : readyHint}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {acoesExtras}
          <Button variant="outline" onClick={() => setOpen(true)} disabled={!demo && !ready && !sig}>
            <FileSignature className="h-4 w-4" /> {sig ? "Ver documento" : "Gerar e assinar"}
          </Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{pi}</DialogTitle>
            <DialogDescription>Emitido pelo Ecossistema de Governança Privacium · ISO/IEC 27701</DialogDescription>
          </DialogHeader>
          <div ref={docRef} className="max-h-[50vh] overflow-auto rounded-sm border bg-background p-6 text-sm leading-relaxed">{children}{["PI-01", "PI-02", "PI-04"].includes(code) && <p className="mt-4 border-t pt-3"><b>Encarregado (DPO):</b> {encarregado.data ? `${encarregado.data.nome} · ${encarregado.data.email}${encarregado.data.telefone ? ` · ${encarregado.data.telefone}` : ""}${encarregado.data.endereco ? ` · ${encarregado.data.endereco}` : ""}` : "Contato não cadastrado"}</p>}</div>
          <DialogFooter>
            {sig ? (
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <span className="break-all font-mono text-xs text-muted-foreground">SHA-256 {sig.hash}</span>
                <Button variant="outline" onClick={async () => {
                  if (demo) return avisarAcaoDemo();
                  const { gerarPdfPI } = await import("@/lib/priva/pdf");
                  const { data: cpf } = await supabase.rpc("meu_cpf");
                  gerarPdfPI(pi, docRef.current?.innerText ?? "", { hash: sig.hash, ts: sig.ts, assinante: sig.by, cnpj: maskCNPJ(cnpj ?? ""), cpf: cpf ? maskCPF(String(cpf)) : "não cadastrado" }).save(`${code}-${cnpj ?? ""}.pdf`);
                  log("SELECT", "pi_pdf", `Exportação PDF ${code}`);
                }}><Download className="h-4 w-4" /> Baixar PDF</Button>
              </div>
            ) : (
              dual ? (
                <div className="flex flex-wrap items-center gap-2">
                  {(["DPO", "DIR"] as const).map((who) => {
                    const k = `${code}-${who}`;
                    const done = signatures[k];
                    return (
                      <Button key={who} variant={done ? "outline" : "default"} disabled={!demo && !!done} onClick={async () => {
                        if (demo) return void demoAssinar(code, who);
                        const ts = new Date().toISOString();
                        const by = who === "DPO" ? `DPO ${email} · CPF · Gov.br (simulado)` : `Diretoria · CNPJ ${maskCNPJ(cnpj ?? "")} · Gov.br (simulado)`;
                        const hash = await sha256(`${k}|${ts}|${by}`);
                        const next = { ...signatures, [k]: { by, ts, hash } };
                        const other = signatures[`${code}-${who === "DPO" ? "DIR" : "DPO"}`];
                        if (other) next[code] = { by: `${other.by} + ${by}`, ts, hash: await sha256(`${code}|${other.hash}|${hash}`) };
                        set({ signatures: next }, { op: "INSERT", target: "signatures", detail: `${k} assinado${other ? ` · ${code} CHANCELADO` : ""}` });
                      }}>
                        <ShieldCheck className="h-4 w-4" /> {done ? "✓ " : ""}{who === "DPO" ? "Assinatura do DPO (CPF)" : "Assinatura da Diretoria (CNPJ)"}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <Button onClick={async () => { await sign(code); }}>
                  <ShieldCheck className="h-4 w-4" /> Assinar com Gov.br (simulado)
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

export function BlockGate({ n, children }: { n: number; children: ReactNode }) {
  const { signatures } = usePriva();
  if (isUnlocked(signatures, n)) return <>{children}</>;
  return <TelaBloqueio n={n} />;
}
