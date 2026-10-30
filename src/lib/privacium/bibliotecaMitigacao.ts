/**
 * Biblioteca estática e versionada do RIPD algorítmico (PI-05).
 * Determinística: mesma entrada → mesmo texto. Nenhuma chamada de IA.
 */
import { TETO_REDUCAO } from "@/lib/priva/dosimetria";

export const VERSAO_BIBLIOTECA = "2026.10-1";

export const NOMES_PI: Record<string, string> = {
  "PI-01": "Dossiê Legal de Alinhamento de Privacidade",
  "PI-02": "Registro de Operações de Tratamento (ROT)",
  "PI-03": "Book de Evidências Tecnológicas e Contratuais",
  "PI-04": "Dossiê de Auditoria de Logs e Resposta de Célula",
};

export type RiscoId = "vazamento" | "vies" | "injecao";
type Controle = { pi: string; eixo: "prob" | "imp"; delta: number; motivo: string };
type Entrada = { pis: string[]; descricao: string; medida: string; fonte: string; controles: Controle[] };

export const INERENTE = { prob: 5, imp: 5 } as const;

export const BIBLIOTECA: Record<RiscoId, Entrada> = {
  vazamento: {
    pis: ["PI-03"],
    descricao: "Colaboradores colam dados pessoais (currículos, cadastros, e-mails de titulares) em prompts de LLMs externos, fazendo o dado pessoal sair do perímetro do CNPJ sem registro.",
    medida: "Aplicar DLP com mascaramento local de dados pessoais (CPF, e-mail, nome) antes de qualquer envio a LLM externo, bloqueando prompts que contenham dado pessoal sensível em claro",
    fonte: "CIS Control 03 / ISO/IEC 27002 — 8.12 e 8.11",
    controles: [
      { pi: "PI-03", eixo: "prob", delta: 2, motivo: "Escudo Digital tokeniza dados pessoais (PI-03)" },
      { pi: "PI-01", eixo: "prob", delta: 1, motivo: "Política de privacidade assinada (PI-01)" },
      { pi: "PI-04", eixo: "imp", delta: 1, motivo: "Logs selados detectam e contêm o vazamento (PI-04)" },
    ],
  },
  vies: {
    pis: ["PI-02", "PI-01"],
    descricao: "Decisões automatizadas de RH ou crédito reproduzem discriminação histórica do dataset, afetando candidatos e clientes sem revisão humana.",
    medida: "Revisar o dataset de treinamento contra atributos de dado pessoal sensível, executar teste de adversidade por grupo e garantir revisão humana das decisões automatizadas (art. 20 LGPD)",
    fonte: "ISO/IEC 42001 — A.7.4 / ISO/IEC 23894 — 6.4",
    controles: [
      { pi: "PI-02", eixo: "prob", delta: 1, motivo: "ROT mapeia as decisões automatizadas (PI-02)" },
      { pi: "PI-01", eixo: "prob", delta: 1, motivo: "Dossiê Legal define a finalidade (PI-01)" },
      { pi: "PI-04", eixo: "imp", delta: 1, motivo: "Trilha selada permite revisar decisões (PI-04)" },
    ],
  },
  injecao: {
    pis: ["PI-03", "PI-04"],
    descricao: "Documentos recebidos (currículos, anexos) contêm instruções ocultas que forçam o modelo a revelar ou alterar dados pessoais processados.",
    medida: "Validar e sanitizar toda entrada enviada ao modelo, executar o LLM em sandbox sem acesso direto a bases de dado pessoal e manter logs selados de prompts e respostas",
    fonte: "CIS Control 16 / ISO/IEC 27002 — 8.28 e 8.15",
    controles: [
      { pi: "PI-03", eixo: "prob", delta: 2, motivo: "Sandbox e validação de entrada comprovadas (PI-03)" },
      { pi: "PI-04", eixo: "imp", delta: 2, motivo: "Logs selados de prompts e respostas (PI-04)" },
    ],
  },
};

const concluido = (sigs: Record<string, unknown>, pi: string) => !!sigs[pi];

export type Sugestao = { texto: string; rotulo: string } | { aviso: string };

/** Texto pronto da sugestão, ou aviso se algum PI de origem não estiver concluído. */
export function sugestaoMitigacao(id: RiscoId, sigs: Record<string, unknown>): Sugestao {
  const e = BIBLIOTECA[id];
  const falta = e.pis.find((p) => !concluido(sigs, p));
  if (falta) return { aviso: `Conclua o ${falta} para receber a sugestão.` };
  const origem = e.pis.map((p) => `${p} (${NOMES_PI[p]})`).join(" e do ");
  const rotulo = `Sugerido a partir do ${origem}`;
  return { rotulo, texto: `${rotulo}: ${e.medida}. Fonte: ${e.fonte}.` };
}

export type RiscoDerivado = { prob: number; imp: number; reducoes: string[] };

/** Risco residual: parte de 5×5 e reduz pelos controles dos PIs concluídos (mínimo 1). */
export function derivarRisco(id: RiscoId, sigs: Record<string, unknown>): RiscoDerivado {
  let prob: number = INERENTE.prob, imp: number = INERENTE.imp;
  const reducoes: string[] = [];
  for (const c of BIBLIOTECA[id].controles) {
    if (!concluido(sigs, c.pi)) continue;
    if (c.eixo === "prob") prob -= c.delta; else imp -= c.delta;
    reducoes.push(`${c.motivo}: ${c.eixo === "prob" ? "probabilidade" : "impacto"} −${c.delta}`);
  }
  return { prob: Math.max(1, prob), imp: Math.max(1, imp), reducoes };
}

/**
 * Redução da dosimetria derivada dos mesmos riscos exibidos no RIPD:
 * TETO × Σ(inerente − residual) ÷ Σ(inerente − piso). Piso = 1×1; risco no piso equivale ao teto de 75%.
 */
export function reducaoPorRiscos(residuais: { prob: number; imp: number }[]): number {
  if (!residuais.length) return 0;
  const ine = INERENTE.prob * INERENTE.imp;
  const ganho = residuais.reduce((s, r) => s + (ine - r.prob * r.imp), 0);
  const max = residuais.length * (ine - 1);
  return Math.max(0, Math.min(TETO_REDUCAO, Math.round((TETO_REDUCAO * ganho) / max)));
}
