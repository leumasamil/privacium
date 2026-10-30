import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { AJUDA } from "@/lib/priva/ajuda";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Cloud, Eye, EyeOff, HardDrive, KeyRound, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AIShield } from "@/components/priva/AIShield";
import { sha256 } from "@/lib/priva/data";
import { usePriva } from "@/lib/priva/store";
import { DEMO_ATIVOS } from "@/lib/priva/demo";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Ativo = Database["public"]["Tables"]["ativos_seguranca"]["Row"];



/** Hash SHA-256 da estrutura lógica da pasta: caminhos normalizados e ordenados. */
export async function hashEstrutura(raiz: string, estrutura: string) {
  const linhas = estrutura.split("\n").map((l) => l.trim()).filter(Boolean).sort();
  return sha256(`${raiz.trim()}\n${linhas.join("\n")}`);
}

export function Bloco3() {
  const { cnpj, roles, log, demo } = usePriva();
  const qc = useQueryClient();
  const canEdit = (roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA"));
  const key = ["ativos_seguranca", cnpj] as const;
  const { data: ativos = [] } = useQuery({
    queryKey: [...key, demo],
    enabled: !!cnpj,
    queryFn: async (): Promise<Ativo[]> => {
      if (demo) return DEMO_ATIVOS;
      const { data, error } = await supabase.from("ativos_seguranca").select("*").eq("empresa_cnpj", cnpj ?? "").order("criado_em");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!cnpj || demo) return;
    const ch = supabase.channel(`ativos_${cnpj}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ativos_seguranca", filter: `empresa_cnpj=eq.${cnpj}` }, () => void qc.invalidateQueries({ queryKey: ["ativos_seguranca", cnpj] }))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [cnpj, qc, demo]);

  if (!cnpj) return <Panel title="Salvaguardas"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;

  const refresh = () => void qc.invalidateQueries({ queryKey: key });
  const endpoints = ativos.filter((a) => a.tipo === "ENDPOINT");
  const cofres = ativos.filter((a) => a.tipo === "COFRE");
  const prot = endpoints.filter((a) => a.protegido).length;

  const remove = async (a: Ativo) => {
    if (demo) return avisarAcaoDemo();
    if (!confirm(`Excluir ${a.identificador}?`)) return;
    const { error } = await supabase.from("ativos_seguranca").delete().eq("id", a.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    log("DELETE", "ativos_seguranca", `${a.tipo} ${a.identificador}`);
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 3 · (I) Ciclo Privacium Semestral · Art. 46 LGPD" title="Implementar Salvaguardas Técnicas e Jurídicas" />
      <AjudaTarefa {...AJUDA[3]} />

      <div id="ativos" className="grid scroll-mt-6 gap-6 xl:grid-cols-2">
        <BitLockerCard endpoints={endpoints} prot={prot} cnpj={cnpj} canEdit={canEdit} refresh={refresh} remove={remove} />
        <CryptomatorCard cofres={cofres} cnpj={cnpj} canEdit={canEdit} refresh={refresh} remove={remove} />
      </div>

      <AIShield />

      <PIOutput dual pi="PI-03: Book de Evidências Tecnológicas e Contratuais" ready={endpoints.length > 0 && prot === endpoints.length && cofres.length > 0}
        readyHint="Proteja todos os endpoints com BitLocker e catalogue ao menos um cofre Cryptomator.">
        <h3 className="font-semibold">Laudo técnico · Art. 46 da LGPD · ISO/IEC 27701 cl. 6.9</h3>
        <p className="mt-2"><b>1. Criptografia de endpoint (BitLocker):</b> {prot}/{endpoints.length} máquinas protegidas, com chaves de recuperação custodiadas offline pelo DPO.</p>
        <ul className="list-disc pl-5">{endpoints.map((a) => <li key={a.id}>{a.identificador} {a.descricao && `· ${a.descricao}`} — {a.protegido ? "protegido" : "pendente"}</li>)}</ul>
        <p className="mt-2"><b>2. Cofres em nuvem (Cryptomator, criptografia client-side):</b></p>
        <ul className="list-disc pl-5">{cofres.map((a) => <li key={a.id}>{a.identificador} ({a.provedor_nuvem}) — SHA-256 <span className="font-mono text-xs">{a.hash_integridade}</span></li>)}</ul>
        <p className="mt-2"><b>3. Escudo Digital de IA:</b> pseudonimização de nomes, CPFs e e-mails por tokens sintéticos antes do envio a provedores externos; tabela de reversão mantida apenas no endpoint.</p>
      </PIOutput>
    </div>
  );
}

function BitLockerCard({ endpoints, prot, cnpj, canEdit, refresh, remove }: { endpoints: Ativo[]; prot: number; cnpj: string; canEdit: boolean; refresh: () => void; remove: (a: Ativo) => void }) {
  const { log, demo } = usePriva();
  const [hw, setHw] = useState("");
  const [host, setHost] = useState("");
  const [responsavel, setResponsavel] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const pct = endpoints.length ? (prot / endpoints.length) * 100 : 0;

  const add = async () => {
    if (demo) return avisarAcaoDemo();
    if (!hw.trim()) return;
    const { error } = await supabase.from("ativos_seguranca").insert({ empresa_cnpj: cnpj, tipo: "ENDPOINT", identificador: hw.trim(), descricao: host.trim(), responsavel: responsavel.trim() || null, localizacao: localizacao.trim() || null });
    if (error) { toast.error(error.code === "23505" ? "ID de hardware já cadastrado." : "Não foi possível cadastrar."); return; }
    log("INSERT", "ativos_seguranca", `Endpoint ${hw.trim()}`);
    setHw(""); setHost(""); setResponsavel(''); setLocalizacao(''); refresh();
  };
  const toggle = async (a: Ativo, v: boolean) => {
    if (demo) return avisarAcaoDemo();
    const { error } = await supabase.from("ativos_seguranca").update({ protegido: v, atualizado_em: new Date().toISOString() }).eq("id", a.id);
    if (!error) { log("UPDATE", "ativos_seguranca", `BitLocker ${a.identificador}=${v}`); refresh(); }
  };

  return (
    <Panel id="endpoints" title="BitLocker · Criptografia de endpoint">
      <div className="flex items-end gap-4">
        <p className={cn("font-mono text-4xl font-semibold", pct === 100 ? "text-success" : pct >= 50 ? "text-warning-foreground" : "text-destructive")}>{prot}/{endpoints.length}</p>
        <p className="pb-1 text-sm text-muted-foreground">máquinas protegidas</p>
      </div>
      <div className="mt-2 h-2 rounded-sm bg-muted"><div className={cn("h-2 rounded-sm transition-all", pct === 100 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive")} style={{ width: `${pct}%` }} /></div>
      <ul className="mt-4 divide-y text-sm">
        {endpoints.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs">{a.identificador}</span>
            <span className="text-xs text-muted-foreground">{a.descricao}</span>
            {(a.responsavel || a.localizacao) && <span className="text-xs text-muted-foreground">{a.responsavel} · {a.localizacao}</span>}
            <span className="ml-auto flex items-center gap-2">
              {a.protegido ? <Tag tone="success">Protegido</Tag> : <Tag tone="warning">Pendente</Tag>}
              {canEdit && <Switch checked={a.protegido} onCheckedChange={(v) => void toggle(a, v)} />}
              {canEdit && <ChaveRecuperacao ativo={a} />}
              {canEdit && <button aria-label="Excluir" onClick={() => remove(a)}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>}
            </span>
          </li>
        ))}
        {!endpoints.length && <li className="py-3 text-sm text-muted-foreground">Nenhum endpoint cadastrado.</li>}
      </ul>
      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Input placeholder="ID do hardware (ex: SN-5CG1234XYZ)" value={hw} onChange={(e) => setHw(e.target.value)} />
          <Input placeholder="Hostname" value={host} onChange={(e) => setHost(e.target.value)} />
          <Input aria-label="Responsável pelo endpoint" placeholder="Responsável / fornecedor (opcional)" value={responsavel} onChange={e=>setResponsavel(e.target.value)} />
          <Input aria-label="Localização do endpoint" placeholder="Localização / domínio (opcional)" value={localizacao} onChange={e=>setLocalizacao(e.target.value)} />
          <Button onClick={() => void add()}><Plus className="h-4 w-4" /></Button>
        </div>
      )}
    </Panel>
  );
}

/** Campo seguro: a chave só é lida sob demanda (registrando na trilha) e nunca aparece na listagem. */
function ChaveRecuperacao({ ativo }: { ativo: Ativo }) {
  const { log, demo } = usePriva();
  const [open, setOpen] = useState(false);
  const [chave, setChave] = useState<string | null>(null);
  const [nova, setNova] = useState("");
  const [shown, setShown] = useState(false);

  const abrir = async () => {
    if (demo) return avisarAcaoDemo();
    setOpen(!open);
    if (open) return;
    const { data } = await supabase.from("chaves_recuperacao").select("chave").eq("ativo_id", ativo.id).maybeSingle();
    setChave(data?.chave ?? null);
    setShown(false);
  };
  const salvar = async () => {
    if (demo) return avisarAcaoDemo();
    const v = nova.trim();
    if (!/^[\d-]{20,}$/.test(v)) { toast.error("Chave inválida (48 dígitos em grupos de 6)."); return; }
    const { error } = await supabase.from("chaves_recuperacao").upsert({ ativo_id: ativo.id, chave: v });
    if (error) { toast.error("Não foi possível salvar a chave."); return; }
    log("INSERT", "chaves_recuperacao", `Chave de recuperação de ${ativo.identificador}`, "chave_recuperacao");
    setChave(v); setNova("");
  };

  return (
    <span className="relative">
      <button aria-label="Chave de recuperação" onClick={() => void abrir()}><KeyRound className="h-4 w-4 text-muted-foreground hover:text-primary" /></button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border bg-popover p-3 text-xs shadow-md">
          <p className="font-semibold">Chave de recuperação offline · {ativo.identificador}</p>
          {chave ? (
            <p className="mt-2 flex items-center gap-2 font-mono">
              {shown ? chave : `${"•".repeat(12)}${chave.slice(-6)}`}
              <button aria-label={shown ? "Ocultar" : "Revelar"} onClick={() => {
                if (!shown) log("SELECT", "chaves_recuperacao", `Consulta da chave de ${ativo.identificador}`, "chave_recuperacao");
                setShown(!shown);
              }}>{shown ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</button>
            </p>
          ) : <p className="mt-2 text-muted-foreground">Nenhuma chave registrada.</p>}
          <div className="mt-2 flex gap-1">
            <Input className="h-8 font-mono text-xs" placeholder="000000-000000-…" value={nova} onChange={(e) => setNova(e.target.value)} />
            <Button size="sm" onClick={() => void salvar()}>Salvar</Button>
          </div>
        </div>
      )}
    </span>
  );
}

function CryptomatorCard({ cofres, cnpj, canEdit, refresh, remove }: { cofres: Ativo[]; cnpj: string; canEdit: boolean; refresh: () => void; remove: (a: Ativo) => void }) {
  const { log, demo } = usePriva();
  const [raiz, setRaiz] = useState("");
  const [provedor, setProvedor] = useState("Google Drive");
  const [estrutura, setEstrutura] = useState("");
  const [preview, setPreview] = useState("");
  const [responsavel, setResponsavel] = useState('');
  const [localizacao, setLocalizacao] = useState('');

  useEffect(() => {
    let alive = true;
    if (!raiz.trim()) { setPreview(""); return; }
    void hashEstrutura(raiz, estrutura).then((h) => alive && setPreview(h));
    return () => { alive = false; };
  }, [raiz, estrutura]);

  const add = async () => {
    if (demo) return avisarAcaoDemo();
    if (!raiz.trim()) return;
    const hash = await hashEstrutura(raiz, estrutura);
    const { error } = await supabase.from("ativos_seguranca").insert({
      empresa_cnpj: cnpj, tipo: "COFRE", identificador: raiz.trim(), provedor_nuvem: provedor, estrutura_pasta: estrutura, hash_integridade: hash, protegido: true, responsavel: responsavel.trim() || null, localizacao: localizacao.trim() || null,
    });
    if (error) { toast.error(error.code === "23505" ? "Cofre já catalogado." : "Não foi possível catalogar."); return; }
    log("INSERT", "ativos_seguranca", `Cofre ${raiz.trim()} · SHA-256 ${hash.slice(0, 16)}`);
    setRaiz(""); setEstrutura(""); setResponsavel(''); setLocalizacao(''); refresh();
  };

  return (
    <Panel id="cofres" title="Cryptomator · Cofres em nuvem (client-side)">
      <ul className="divide-y text-sm">
        {cofres.map((a) => (
          <li key={a.id} className="py-2">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{a.identificador}</span>
              <Tag tone="primary">{a.provedor_nuvem}</Tag>
              {canEdit && <button aria-label="Excluir" className="ml-auto" onClick={() => remove(a)}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
            <p className="mt-1 break-all font-mono text-[10px] text-success">SHA-256 {a.hash_integridade}</p>
            {(a.responsavel || a.localizacao) && <p className="text-xs text-muted-foreground">{a.responsavel} · {a.localizacao}</p>}
          </li>
        ))}
        {!cofres.length && <li className="py-3 text-sm text-muted-foreground">Nenhum cofre catalogado.</li>}
      </ul>
      {canEdit && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Diretório lógico (ex: /Financeiro/Folha)" value={raiz} onChange={(e) => setRaiz(e.target.value)} />
            <select className="rounded-sm border bg-background px-2 text-sm" value={provedor} onChange={(e) => setProvedor(e.target.value)}>
              {["Google Drive", "OneDrive", "Dropbox", "Amazon S3"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <Textarea rows={3} placeholder={"Estrutura da pasta (um caminho por linha)\nholerites/2026-01.pdf\ncontratos/"} value={estrutura} onChange={(e) => setEstrutura(e.target.value)} />
          <Input aria-label="Responsável pelo cofre" placeholder="Responsável / fornecedor (opcional)" value={responsavel} onChange={e=>setResponsavel(e.target.value)} />
          <Input aria-label="Localização do cofre" placeholder="Localização / domínio (opcional)" value={localizacao} onChange={e=>setLocalizacao(e.target.value)} />
          {preview && <p className="break-all font-mono text-[10px] text-muted-foreground">Hash calculado: {preview}</p>}
          <Button onClick={() => void add()} className="w-full"><Plus className="h-4 w-4" /> Catalogar cofre</Button>
        </div>
      )}
    </Panel>
  );
}
