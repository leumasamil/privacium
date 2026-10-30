import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldAlert, Fingerprint, Globe2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePriva } from "@/lib/priva/store";
import { maskCNPJ, maskCPF, maskEmail } from "@/lib/priva/data";
import { PageHeader, Panel, Tag } from "@/components/priva/ui";
import { Sigla } from "@/components/priva/Sigla";
import { Button } from "@/components/ui/button";



type Linha = {
  seq: number; ts: string; user_email: string | null; usuario_id: string | null; role: string; cnpj: string | null;
  op: string; target: string; detail: string; ip_origem: string | null; hash: string; hash_integridade_sha256: string | null;
};

// Tradução Visual Law: operação técnica -> ação compreensível
export function acaoLegivel(l: Pick<Linha, "op" | "target" | "detail">): string {
  const t = l.target.toLowerCase(); const d = l.detail.toLowerCase();
  if (t.includes("chave") || d.includes("bitlocker")) return "Acessou Chave BitLocker";
  if (t.includes("registro_operacoes") || t.includes("rot")) return l.op === "DELETE" ? "Excluiu Linha do ROT" : l.op === "INSERT" ? "Criou Linha do ROT" : "Alterou Linha do ROT";
  if (t.includes("escudo") || t.includes("ia") || d.includes("prompt")) return "Prompt Filtrado no Escudo de IA";
  if (t.includes("role") || d.includes("painel") || d.includes("cargo")) return "Transição de Cargo Switcher";
  if (t.includes("plano") || d.includes("plano")) return "Alteração de Plano de Faturamento";
  if (d.includes("inativ") || d.includes("suspen")) return "Suspensão de Acesso de CNPJ";
  if (d.includes("login") && d.includes("falh")) return "Falha de Login";
  if (t.includes("faturamento") || d.includes("cobran")) return "Alteração de Cobrança";
  if (t.startsWith("pi-") || d.includes("assin")) return "Assinatura de Ponto de Integração";
  if (l.op === "SELECT") return "Leitura de dados pessoais";
  return l.op === "DELETE" ? "Exclusão de registro" : l.op === "INSERT" ? "Criação de registro" : "Alteração de registro";
}

export function Auditoria() {
  const { role, cnpj, empresas, demo, audit } = usePriva();
  const master = role === "ADMIN_SISTEMA" && !demo;
  const [rowsDb, setRows] = useState<Linha[]>([]);
  // No demo, a trilha cenográfica (seed + ações da sessão) vem da memória, com hash encadeado.
  const rows: Linha[] = demo ? audit.map((a) => ({ ...a, usuario_id: null, ip_origem: null, hash_integridade_sha256: null })) : rowsDb;
  const [cpfs, setCpfs] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<null | boolean>(null);

  const load = useCallback(async () => {
    if (demo) return;
    let q = supabase.from("trilha_auditoria_sistema")
      .select("seq,ts,user_email,usuario_id,role,cnpj,op,target,detail,ip_origem,hash,hash_integridade_sha256")
      .order("seq", { ascending: false }).limit(500);
    if (!master && cnpj) q = q.eq("cnpj", cnpj);
    const [{ data }, { data: us }] = await Promise.all([q, supabase.from("usuarios").select("id,cpf")]);
    setRows((data ?? []) as Linha[]);
    setCpfs(Object.fromEntries((us ?? []).filter((u) => u.cpf).map((u) => [u.id, u.cpf as string])));
  }, [master, cnpj, demo]);
  useEffect(() => { void load(); }, [load]);

  const razao = useMemo(() => Object.fromEntries(empresas.map((e) => [e.cnpj, e.razao_social])), [empresas]);
  const usuario = (l: Linha) => { const c = l.usuario_id ? cpfs[l.usuario_id] : undefined; return c ? maskCPF(c) : l.user_email ? maskEmail(l.user_email) : "—"; };
  const hash = (l: Linha) => (l.hash_integridade_sha256 ?? l.hash);

  const verify = async () => { if (demo) return avisarAcaoDemo(); await load(); const { data } = await supabase.rpc("verificar_trilha"); setVerified(!!data?.[0]?.ok); };

  const action = (
    <div className="flex items-center gap-2">
      {verified === true && <Tag tone="success"><ShieldCheck className="h-3 w-3" /> Íntegra</Tag>}
      {verified === false && <Tag tone="destructive"><ShieldAlert className="h-3 w-3" /> Violada</Tag>}
      <Button size="sm" variant="ghost" onClick={() => demo ? avisarAcaoDemo() : void load()}><RefreshCw className="h-3 w-3" /></Button>
      <Button size="sm" variant="outline" onClick={verify}>Verificar integridade</Button>
    </div>
  );
  const vazio = <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Nenhum evento registrado ainda.</td></tr>;

  if (master) return (
    <div className="space-y-6">
      <PageHeader eyebrow="ADMIN_SISTEMA · Visão multi-tenant" title="Trilha Forense Master de Infraestrutura">
        Tráfego de todo o ecossistema Privacium, de todas as empresas, encadeado por hash SHA-256 (ISO/IEC 27037).
      </PageHeader>
      <Volumetria />
      <Panel title={`${rows.length} eventos globais`} action={action}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left font-mono uppercase text-muted-foreground"><th className="py-2">Data/Hora</th><th>Empresa</th><th>Usuário responsável</th><th>Ação geral de sistema</th><th>IP de origem</th><th>Hash de integridade</th></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.seq} className="border-b align-top">
                  <td className="py-1.5 font-mono whitespace-nowrap">{new Date(l.ts).toLocaleString("pt-BR")}</td>
                  <td>{l.cnpj ? <><p className="font-medium">{razao[l.cnpj] ?? "—"}</p><p className="font-mono text-muted-foreground">{maskCNPJ(l.cnpj)}</p></> : <span className="text-muted-foreground">Infraestrutura</span>}</td>
                  <td className="max-w-44 truncate">{l.user_email ?? "—"}<p className="text-muted-foreground">{l.role}</p></td>
                  <td><Tag tone={l.op === "DELETE" ? "destructive" : l.op === "SELECT" ? "muted" : "primary"}>{acaoLegivel(l)}</Tag><p className="mt-0.5 text-muted-foreground">{l.detail}</p></td>
                  <td className="font-mono"><Globe2 className="mr-1 inline h-3 w-3" />{l.ip_origem ?? "—"}</td>
                  <td className="font-mono text-muted-foreground" title={hash(l)}>{hash(l).slice(0, 20)}…</td>
                </tr>
              ))}
              {!rows.length && vazio}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`Visual Law · CNPJ ${cnpj ? maskCNPJ(cnpj) : ""}`} title="Painel de Auditoria e Evidências Civis">
        Cada ação feita dentro da sua empresa fica registrada com horário, responsável e uma assinatura digital (hash SHA-256) que comprova que o registro não foi alterado. Logs de outras empresas são bloqueados pelo servidor.
      </PageHeader>
      <p className="text-xs text-muted-foreground" data-testid="mci-art10">
        <Sigla termo="MCI art. 10" /> — guarda e disponibilização de registros de acesso, em ambiente controlado e de segurança. Prazo de retenção vigente: <strong>6 meses</strong>.
      </p>
      <Panel title={`Linha do tempo de evidências · ${rows.length} eventos`} action={action}>
        <ol className="relative space-y-3 border-l-2 border-primary/30 pl-6">
          {rows.map((l) => (
            <li key={l.seq} className="relative rounded-sm border bg-card p-3">
              <span className="absolute -left-[31px] top-4 flex h-4 w-4 items-center justify-center rounded-full bg-primary"><Fingerprint className="h-2.5 w-2.5 text-primary-foreground" /></span>
              <div className="grid gap-2 text-sm md:grid-cols-[150px_150px_1fr]">
                <div><p className="font-mono text-[10px] uppercase text-muted-foreground">Horário</p><p className="font-mono text-xs">{new Date(l.ts).toLocaleString("pt-BR")}</p></div>
                <div><p className="font-mono text-[10px] uppercase text-muted-foreground">Usuário</p><p className="font-mono text-xs">{usuario(l)}</p></div>
                <div><p className="font-mono text-[10px] uppercase text-muted-foreground">Ação executada</p><p className="font-semibold text-primary">{acaoLegivel(l)}</p><p className="text-xs text-muted-foreground">{l.detail}</p></div>
              </div>
              <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">SHA-256 · {hash(l)}</p>
            </li>
          ))}
          {!rows.length && <li className="py-6 text-center text-sm text-muted-foreground">Nenhum evento registrado para este CNPJ.</li>}
        </ol>
      </Panel>
    </div>
  );
}

function Volumetria() {
  const [v, setV] = useState<{ empresas: number; ativas: number; usuarios: number; registros_trilha: number } | null>(null);
  useEffect(() => { void supabase.rpc("volumetria").then(({ data }) => { const r = data?.[0]; if (r) setV({ empresas: Number(r.empresas), ativas: Number(r.ativas), usuarios: Number(r.usuarios), registros_trilha: Number(r.registros_trilha) }); }); }, []);
  const items = [["Empresas", v?.empresas], ["Empresas ativas", v?.ativas], ["Usuários", v?.usuarios], ["Eventos na trilha", v?.registros_trilha]] as const;
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map(([k, n]) => (
        <div key={k} className="rounded-md border bg-card p-4"><p className="font-mono text-[10px] uppercase text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-semibold text-primary">{n ?? "—"}</p></div>
      ))}
    </div>
  );
}
