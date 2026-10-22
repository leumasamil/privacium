import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { sha256, type InventoryRow, type KanbanCard, type Role } from "./data";

export type AuditEntry = {
  seq: number;
  ts: string;
  role: Role;
  op: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  target: string;
  detail: string;
  prevHash: string;
  hash: string;
};
export type Signature = { by: string; ts: string; hash: string };

type State = {
  role: Role;
  enterprise: boolean;
  answers: Record<number, boolean>;
  signatures: Record<string, Signature>; // "PI-01".."PI-06"
  inventory: InventoryRow[];
  kanban: KanbanCard[];
  assets: { id: string; host: string; bitlocker: boolean; vault: boolean }[];
  incidentStart: string | null;
  incidentSteps: boolean[];
  audit: AuditEntry[];
};

const initial: State = {
  role: "dpo",
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
  audit: [],
};

type Ctx = State & {
  set: (patch: Partial<State>, log?: { op: AuditEntry["op"]; target: string; detail: string }) => void;
  log: (op: AuditEntry["op"], target: string, detail: string) => void;
  sign: (pi: string) => Promise<void>;
  reset: () => void;
};

const C = createContext<Ctx | null>(null);
const KEY = "priva2ec-state-v1";

export function PrivaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const loaded = useRef(false);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastAudit = useRef<AuditEntry | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const log = useCallback((op: AuditEntry["op"], target: string, detail: string) => {
    chain.current = chain.current.then(async () => {
      const snapshot = stateRef.current;
      const prev = lastAudit.current ?? snapshot.audit[snapshot.audit.length - 1];
      const prevHash = prev?.hash ?? "0".repeat(64);
      const seq = (prev?.seq ?? 0) + 1;
      const ts = new Date().toISOString();
      const hash = await sha256(`${seq}|${ts}|${snapshot.role}|${op}|${target}|${detail}|${prevHash}`);
      const entry: AuditEntry = { seq, ts, role: snapshot.role, op, target, detail, prevHash, hash };
      lastAudit.current = entry;
      setState((s) => ({ ...s, audit: [...s.audit, entry] }));
    });
  }, []);

  const set: Ctx["set"] = (patch, l) => {
    setState((s) => ({ ...s, ...patch }));
    if (l) log(l.op, l.target, l.detail);
  };

  const sign = async (pi: string) => {
    const ts = new Date().toISOString();
    const hash = await sha256(`${pi}|${ts}|gov.br`);
    setState((s) => ({ ...s, signatures: { ...s.signatures, [pi]: { by: "Assinatura Gov.br (simulada)", ts, hash } } }));
    log("INSERT", "signatures", `${pi} chancelado`);
  };

  const reset = () => {
    lastAudit.current = null;
    setState({ ...initial, audit: [] });
  };

  return <C.Provider value={{ ...state, set, log, sign, reset }}>{children}</C.Provider>;
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
