import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePriva } from "@/lib/priva/store";
import { Masked, PageHeader, Panel, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({
    meta: [
      { title: "Trilha de Auditoria — PRIVA 2EC" },
      { name: "description", content: "Logs imutáveis encadeados por SHA-256 conforme ISO/IEC 27037." },
      { property: "og:title", content: "Trilha de Auditoria — PRIVA 2EC" },
      { property: "og:description", content: "Logs imutáveis encadeados por SHA-256 conforme ISO/IEC 27037." },
    ],
  }),
  component: Auditoria,
});

const TITULARES = [
  { nome: "Maria Aparecida Souza", cpf: "123.456.789-09", email: "maria.souza@cliente.com.br" },
  { nome: "Carlos Eduardo Lima", cpf: "987.654.321-00", email: "carlos.lima@cliente.com.br" },
  { nome: "Ana Beatriz Rocha", cpf: "111.222.333-44", email: "ana.rocha@cliente.com.br" },
];

function Auditoria() {
  const { audit, refreshAudit } = usePriva();
  const [verified, setVerified] = useState<null | boolean>(null);

  // Verificação recalculada no servidor sobre a cadeia completa
  const verify = async () => {
    await refreshAudit();
    const { data } = await supabase.rpc("verify_audit_chain");
    setVerified(!!data?.[0]?.ok);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ISO/IEC 27037 · Não repúdio" title="Trilha de Auditoria Interna">
        Toda leitura, escrita ou exclusão gera um bloco de log encadeado ao anterior por hash SHA-256. Qualquer alteração quebra a cadeia.
      </PageHeader>

      <Panel title="Titulares · mascaramento ativo">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left font-mono text-xs uppercase text-muted-foreground"><th className="py-2">Nome</th><th>CPF</th><th>E-mail</th></tr></thead>
          <tbody>
            {TITULARES.map((t) => (
              <tr key={t.cpf} className="border-b">
                <td className="py-2"><Masked kind="name" value={t.nome} /></td>
                <td><Masked kind="cpf" value={t.cpf} /></td>
                <td><Masked kind="email" value={t.email} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title={`Cadeia de logs · ${audit.length} blocos`} action={
        <div className="flex items-center gap-2">
          {verified === true && <Tag tone="success"><ShieldCheck className="h-3 w-3" /> Íntegra</Tag>}
          {verified === false && <Tag tone="destructive"><ShieldAlert className="h-3 w-3" /> Violada</Tag>}
          <Button size="sm" variant="outline" onClick={verify}>Verificar integridade</Button>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left font-mono uppercase text-muted-foreground"><th className="py-2">#</th><th>Data/hora</th><th>Usuário</th><th>Perfil</th><th>Operação</th><th>Alvo</th><th>Detalhe</th><th>Hash SHA-256</th></tr></thead>
            <tbody>
              {[...audit].reverse().map((e) => (
                <tr key={e.seq} className="border-b">
                  <td className="py-1.5 font-mono">{e.seq}</td>
                  <td className="font-mono">{new Date(e.ts).toLocaleString("pt-BR")}</td>
                  <td className="max-w-40 truncate">{e.user_email}</td>
                  <td>{e.role}</td>
                  <td><Tag tone={e.op === "DELETE" ? "destructive" : e.op === "SELECT" ? "muted" : "primary"}>{e.op}</Tag></td>
                  <td className="font-mono">{e.target}</td>
                  <td>{e.detail}</td>
                  <td className="font-mono text-muted-foreground">{e.hash.slice(0, 20)}…</td>
                </tr>
              ))}
              {!audit.length && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Nenhum evento registrado ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
