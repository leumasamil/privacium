import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sha256, type InventoryRow, type KanbanCard, type Role } from "./data";

export type AuditEntry = {
  seq: number;
  ts: string;
  role: Role;
  cnpj: string | null;
  user_email: string | null;
  op: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  target: string;
  detail: string;
  prev_hash: string;
  hash: string;
};
export type Empresa = { cnpj: string; razao_social: string };
export type Signature = { by: string; ts: string; hash: string };

/** Dados compartilhados por toda a equipe (salvos no backend). */
type Shared = {
  enterprise: boolean;
  answers: Record<number, boolean>;
  signatures: Record<string, Signature>;
  inventory: InventoryRow[];
  kanban: KanbanCard[];
  assets: { id: string; host: string; bitlocker: boolean; vault: boolean }[];
  incidentStart: string | null;
  incidentSteps: boolean[];
};

const initialShared: Shared = {
  enterprise: false,
  answers: {},
  signatures: {},
  inventory: [
    {
      id: "PRC-001", verbo: "Coletar", titulares: "Clientes", dados: "Nome, CPF, e-mail", sensiveis: "",
      menores: false, finalidade: "Emissão de nota fiscal", hipotese: "Art. 7º, II – Obrigação legal/regulatória",
      retencao: "5 anos", basePrazo: "CTN art. 173", compartilhamento: "Contabilidade", salvaguardas: "Criptografia em repouso", infra: "ERP em nuvem",
    },
  ],
  kanban: [
    { id: "k1", what: "Nomear Encarregado", why: "Art. 41 LGPD", who: "Diretoria", where: "Sede", when: "30 dias", how: "Ato formal", howMuch: "R$ 0", block: 1, column: "todo" },
    { id: "k2", what: "Ativar BitLocker nos notebooks", why: "Salvaguarda técnica", who: "TI", where: "Endpoints", when: "15 dias", how: "GPO", howMuch: "Interno", block: 3, column: "doing" },
    { id: "k3", what: "Aditivo contratual com operador de folha", why: "Art. 39 LGPD", who: "Jurídico", where: "Fornecedor X", when: "45 dias", how: "DPA", howMuch: "R$ 2.000", block: 3, column: "third" },
  ],
  assets: [
    { id: "a1", host: "NB-FIN-01", bitlocker: true, vault: false },
    { id: "a2", host: "NB-RH-02", bitlocker: false, vault: false },
    { id: "a3", host: "WS-DIR-01", bitlocker: false, vault: true },
  ],
  incidentStart: null,
  incidentSteps: [false, false, false, false, false, false],
};

type Ctx = Shared & {
  ready: boolean;
  userId: string | null;
  email: string | null;
  roles: Role[];
  role: Role;
  audit: AuditEntry[];
  cnpj: string | null;
  empresas: Empresa[];
  selectEmpresa: (cnpj: string) => void;
  createEmpresa: (cnpj: string, razao: string) => Promise<string | null>;
  setRole: (r: Role) => void;
  set: (patch: Partial<Shared>, log?: { op: AuditEntry["op"]; target: string; detail: string }) => void;
  log: (op: AuditEntry["op"], target: string, detail: string, campo?: string) => void;
  sign: (pi: string) => Promise<void>;
  reset: () => void;
  refreshAudit: () => Promise<void>;
};

// Contexto estável entre recargas de módulo (HMR): evita que o provedor e as páginas
// usem instâncias diferentes do mesmo contexto.
const g = globalThis as unknown as { __privaCtx?: React.Context<Ctx | null> };
const C = (g.__privaCtx ??= createContext<Ctx | null>(null));
const ROLE_PREF = "priva2ec-active-role";
const CNPJ_PREF = "priva2ec-active-cnpj";
const ORDER: Role[] = ["DPO_OPERACIONAL", "ADMIN_SISTEMA", "C_SUITE"];

export function PrivaProvider({ children }: { children: ReactNode }) {
  const [shared, setShared] = useState<Shared>(initialShared);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [role, setRoleState] = useState<Role>("DPO_OPERACIONAL");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [cnpj, setCnpj] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const cnpjRef = useRef<string | null>(null);
  cnpjRef.current = cnpj;
  const roleRef = useRef(role);
  roleRef.current = role;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Shared | null>(null);

  const canReadAudit = roles.includes("ADMIN_SISTEMA") || roles.includes("DPO_OPERACIONAL");

  const refreshAudit = useCallback(async () => {
    const { data } = await supabase.from("trilha_auditoria_sistema").select("*").order("seq", { ascending: false }).limit(500);
    if (data) setAudit(data.reverse() as AuditEntry[]);
  }, []);

  const loadEmpresa = async (c: string) => {
    const { data: ws } = await supabase.from("workspace_empresa").select("data").eq("cnpj", c).maybeSingle();
    pending.current = null;
    setShared({ ...initialShared, ...((ws?.data ?? {}) as Partial<Shared>) });
    setCnpj(c);
    cnpjRef.current = c;
    localStorage.setItem(CNPJ_PREF, c);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      setUserId(u.user.id);
      setEmail(u.user.email ?? null);
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const granted = (r ?? []).map((x) => x.role as Role).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
      setRoles(granted);
      const pref = localStorage.getItem(ROLE_PREF) as Role | null;
      if (granted.length) setRoleState(pref && granted.includes(pref) ? pref : granted[0]!);
      if (granted.length) {
        const { data: list } = await supabase.from("workspace_empresa").select("cnpj, razao_social").order("created_at");
        setEmpresas(list ?? []);
        const prefC = localStorage.getItem(CNPJ_PREF);
        const pick = list?.find((e) => e.cnpj === prefC)?.cnpj ?? list?.[0]?.cnpj ?? null;
        if (pick) await loadEmpresa(pick);
      }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (ready && canReadAudit) void refreshAudit();
  }, [ready, canReadAudit, refreshAudit]);

  // Atualizações em tempo real feitas por outros membros
  useEffect(() => {
    if (!ready || !roles.length || !cnpj) return;
    const ch = supabase
      .channel(`workspace_empresa_${cnpj}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "workspace_empresa", filter: `cnpj=eq.${cnpj}` }, (payload) => {
        const row = payload.new as { data: Partial<Shared>; updated_by: string | null };
        if (row.updated_by && row.updated_by !== userId && !pending.current) setShared({ ...initialShared, ...row.data });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [ready, roles.length, userId, cnpj]);

  const persist = (next: Shared) => {
    pending.current = next;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const target = cnpjRef.current;
    if (!target) return;
    saveTimer.current = setTimeout(async () => {
      const data = pending.current;
      if (!data) return;
      await supabase.from("workspace_empresa").update({ data: data as never, updated_at: new Date().toISOString(), updated_by: userId }).eq("cnpj", target);
      if (pending.current === data) pending.current = null;
    }, 600);
  };

  const log = useCallback((op: AuditEntry["op"], target: string, detail: string, campo?: string) => {
    void (async () => {
      const { data, error } = await supabase.rpc("registrar_acesso", { _role: roleRef.current, _op: op, _target: target, _detail: detail, _cnpj: cnpjRef.current ?? "", _campo: campo ?? "" });
      if (!error && data && (roles.includes("ADMIN_SISTEMA") || roles.includes("DPO_OPERACIONAL"))) setAudit((a) => [...a, data as AuditEntry]);
    })();
  }, [roles]);

  const set: Ctx["set"] = (patch, l) => {
    setShared((s) => {
      const next = { ...s, ...patch };
      if (Object.keys(patch).length) persist(next);
      return next;
    });
    if (l) log(l.op, l.target, l.detail);
  };

  const setRole = (r: Role) => {
    if (!roles.includes(r)) return;
    localStorage.setItem(ROLE_PREF, r);
    setRoleState(r);
    roleRef.current = r;
    log("SELECT", "session", `Troca de painel para ${r}`);
  };

  const sign = async (pi: string) => {
    const ts = new Date().toISOString();
    const hash = await sha256(`${pi}|${ts}|${email}|gov.br`);
    set({ signatures: { ...shared.signatures, [pi]: { by: `${email} · Gov.br (simulado)`, ts, hash } } }, { op: "INSERT", target: "signatures", detail: `${pi} chancelado` });
  };

  const selectEmpresa = (c: string) => {
    if (c === cnpjRef.current) return;
    void loadEmpresa(c).then(() => log("SELECT", "workspace_empresa", `Abertura da esteira do CNPJ ${c}`));
  };

  const createEmpresa = async (raw: string, razao: string) => {
    const c = raw.replace(/\D/g, "");
    const { error } = await supabase.from("workspace_empresa").insert({ cnpj: c, razao_social: razao.trim(), data: initialShared as never, updated_by: userId });
    if (error) return error.code === "23505" ? "CNPJ já cadastrado." : "Não foi possível cadastrar (verifique seu cargo).";
    setEmpresas((e) => [...e, { cnpj: c, razao_social: razao.trim() }]);
    await loadEmpresa(c);
    log("INSERT", "workspace_empresa", `Cadastro do CNPJ ${c}`);
    return null;
  };

  const reset = () => set({ ...initialShared }, { op: "DELETE", target: "workspace", detail: "Reinício da esteira" });

  return (
    <C.Provider value={{ ...shared, ready, userId, email, roles, role, audit, cnpj, empresas, selectEmpresa, createEmpresa, setRole, set, log, sign, reset, refreshAudit }}>
      {children}
    </C.Provider>
  );
}

export function usePriva() {
  const c = useContext(C);
  if (!c) throw new Error("PrivaProvider ausente");
  return c;
}

/** Bloco n liberado se o PI do bloco anterior estiver assinado */
export function isUnlocked(signatures: Record<string, Signature>, n: number) {
  return n === 1 || !!signatures[`PI-0${n - 1}`];
}
