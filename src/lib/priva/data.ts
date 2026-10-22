export type Role = "admin" | "dpo" | "csuite";
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador (SaaS)",
  dpo: "DPO / Encarregado",
  csuite: "C-Suite",
};

export const DEPARTMENTS = ["RH", "TI", "Marketing", "Compras", "Recepção", "Jurídico", "Financeiro"] as const;

export type Question = { id: number; department: string; principle: string; text: string; weight: number };

export const PERFECT_SCORE = 1660;

/**
 * SA = soma dos pesos das respostas SIM. GM = (SA / 1660) * 100.
 * O Score Perfeito do manual é 1660; quando a soma dos pesos do banco difere, o SA é
 * reescalado proporcionalmente para a régua de 1660 pontos.
 */
export function computeGM(answers: Record<number, boolean>, questions: Question[]) {
  const bankMax = questions.reduce((a, q) => a + q.weight, 0) || 1;
  const raw = questions.reduce((a, q) => a + (answers[q.id] ? q.weight : 0), 0);
  const score = Math.round((raw / bankMax) * PERFECT_SCORE);
  return { raw, bankMax, score, gm: (score / PERFECT_SCORE) * 100 };
}

export function riskZone(gm: number) {
  if (gm <= 40) return { label: "Zona de Vulnerabilidade Crítica", tone: "destructive" as const };
  if (gm <= 75) return { label: "Zona de Conformidade Tática", tone: "warning" as const };
  return { label: "Zona de Blindagem Sistêmica", tone: "success" as const };
}

export const BLOCKS = [
  { n: 1, letter: "P", pdca: "Plan", title: "Preparar a Privacidade", pi: "PI-01: Dossiê Legal de Alinhamento de Privacidade" },
  { n: 2, letter: "R", pdca: "Plan", title: "Registrar as Operações de Tratamento", pi: "PI-02: Registro de Operações de Tratamento (ROT)" },
  { n: 3, letter: "I", pdca: "Do", title: "Implementar Salvaguardas Técnicas e Jurídicas", pi: "PI-03: Book de Evidências Tecnológicas e Contratuais" },
  { n: 4, letter: "V", pdca: "Check", title: "Vigiar a Privacidade e Processar Incidentes", pi: "PI-04: Dossiê de Auditoria de Logs e Resposta de Célula" },
  { n: 5, letter: "A", pdca: "Act", title: "Auditar o Sistema e Mitigar Riscos", pi: "PI-05: Escudo Jurídico de Dosimetria (PREG/RIPD)" },
] as const;

export const VERBS = ["Coletar", "Reter", "Processar", "Compartilhar", "Eliminar"] as const;
export const HIPOTESES = [
  "Art. 7º, I – Consentimento",
  "Art. 7º, II – Obrigação legal/regulatória",
  "Art. 7º, III – Políticas públicas",
  "Art. 7º, IV – Estudos por órgão de pesquisa",
  "Art. 7º, V – Execução de contrato",
  "Art. 7º, VI – Exercício regular de direitos",
  "Art. 7º, VII – Proteção da vida",
  "Art. 7º, VIII – Tutela da saúde",
  "Art. 7º, IX – Legítimo interesse",
  "Art. 7º, X – Proteção do crédito",
  "Art. 11, I – Consentimento específico",
  "Art. 11, II, a – Obrigação legal",
  "Art. 11, II, d – Exercício regular de direitos",
  "Art. 11, II, e – Proteção da vida",
  "Art. 11, II, f – Tutela da saúde",
  "Art. 11, II, g – Prevenção à fraude",
];

export type InventoryRow = {
  id: string;
  verbo: string;
  titulares: string;
  dados: string;
  sensiveis: string;
  menores: boolean;
  finalidade: string;
  hipotese: string;
  retencao: string;
  basePrazo: string;
  compartilhamento: string;
  salvaguardas: string;
  infra: string;
};

export type KanbanColumn = "todo" | "doing" | "third" | "review" | "done";
export const KANBAN_COLUMNS: { id: KanbanColumn; label: string; hint: string }[] = [
  { id: "todo", label: "A Fazer", hint: "" },
  { id: "doing", label: "Em Execução", hint: "Máx. 3 cartões" },
  { id: "third", label: "Pendente com Terceiros", hint: "Cronômetro pausado" },
  { id: "review", label: "Revisão do DPO/Compliance", hint: "Exige hash SHA-256" },
  { id: "done", label: "Produto Concluído (PI)", hint: "" },
];
export type KanbanCard = {
  id: string;
  what: string;
  why: string;
  who: string;
  where: string;
  when: string;
  how: string;
  howMuch: string;
  block: number;
  column: KanbanColumn;
  evidenceHash?: string | undefined;
};

export function maskCPF(v: string) {
  const d = v.replace(/\D/g, "");
  return d.length === 11 ? `***.***.${d.slice(6, 9)}-${d.slice(9)}` : "***.***.***-**";
}
export function maskName(v: string) {
  return v.split(" ").map((w) => (w ? w[0] + "•".repeat(Math.max(w.length - 1, 2)) : w)).join(" ");
}
export function maskEmail(v: string) {
  const [u, d] = v.split("@");
  return `${u?.[0] ?? ""}•••@${d ?? "•••"}`;
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function tokenizePrompt(text: string) {
  const map: { token: string; original: string; kind: string }[] = [];
  let counter = { CPF: 0, EMAIL: 0, TITULAR: 0 };
  const repl = (kind: keyof typeof counter) => (m: string) => {
    const existing = map.find((x) => x.original === m);
    if (existing) return existing.token;
    counter[kind]++;
    const token = `[${kind}_TOKEN_${String(counter[kind]).padStart(2, "0")}]`;
    map.push({ token, original: m, kind });
    return token;
  };
  let out = text.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, repl("CPF"));
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, repl("EMAIL"));
  // NER simplificado: sequência de 2+ palavras capitalizadas
  out = out.replace(/\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+(?:d[aeo]s?\s+)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+)+)\b/g, repl("TITULAR"));
  return { out, map };
}
