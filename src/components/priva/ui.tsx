import { useState, type ReactNode } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { maskCNPJ, maskCPF, maskEmail, maskName } from "@/lib/priva/data";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 border-b pb-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-sm text-muted-foreground">{children}</div>}
    </header>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-md border bg-card p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">{title}</h2>
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

export function PIOutput({ pi, ready, readyHint, children }: { pi: string; ready: boolean; readyHint: string; children: ReactNode }) {
  const { signatures, sign } = usePriva();
  const code = pi.slice(0, 5).replace(" ", "");
  const sig = signatures[code];
  const [open, setOpen] = useState(false);
  return (
    <Panel title="Saída obrigatória" className="border-primary/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-primary">{pi}</p>
          {sig ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-success"><ShieldCheck className="h-3 w-3" /> Chancelado em {new Date(sig.ts).toLocaleString("pt-BR")} · <span className="font-mono">{sig.hash.slice(0, 16)}…</span></p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{ready ? "Pronto para chancela digital." : readyHint}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setOpen(true)} disabled={!ready && !sig}>
          <FileSignature className="h-4 w-4" /> {sig ? "Ver documento" : "Gerar e assinar"}
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{pi}</DialogTitle>
            <DialogDescription>Documento simulado · PRIVA 2EC · ISO/IEC 27701</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-auto rounded-sm border bg-background p-6 text-sm leading-relaxed">{children}</div>
          <DialogFooter>
            {sig ? (
              <span className="font-mono text-xs text-muted-foreground">SHA-256 {sig.hash}</span>
            ) : (
              <Button onClick={async () => { await sign(code); }}>
                <ShieldCheck className="h-4 w-4" /> Assinar com Gov.br (simulado)
              </Button>
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
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-card p-16 text-center">
      <Lock className="h-8 w-8 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold text-primary">Bloco travado</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        O avanço exige que o PI-0{n - 1} do bloco anterior esteja concluído e chancelado digitalmente.
      </p>
      <Button asChild className="mt-6"><Link to={`/bloco-${n - 1}` as "/bloco-1"}>Ir para o Bloco {n - 1}</Link></Button>
    </div>
  );
}
