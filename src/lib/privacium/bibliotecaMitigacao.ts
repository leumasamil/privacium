/**
 * Biblioteca estática e versionada do RIPD algorítmico (PI-05).
 * Determinística: mesma entrada → mesmo texto. Nenhuma chamada de IA.
 */

export const VERSAO_BIBLIOTECA = "2026.10-1";

export const NOMES_PI: Record<string, string> = {
  "PI-01": "Dossiê Legal de Alinhamento de Privacidade",
  "PI-02": "Registro de Operações de Tratamento (ROT)",
  "PI-03": "Book de Evidências Tecnológicas e Contratuais",
  "PI-04": "Dossiê de Auditoria de Logs e Resposta de Célula",
  "PI-05": "Escudo Jurídico de Dosimetria",
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

/** Descrição contextual do risco, condicionada ao mesmo PI de origem da mitigação. */
export function sugestaoDescricao(id: RiscoId, sigs: Record<string, unknown>): Sugestao {
  const e = BIBLIOTECA[id];
  const falta = e.pis.find((p) => !concluido(sigs, p));
  if (falta) return { aviso: `Conclua o ${falta} para receber a sugestão.` };
  const origem = e.pis.map((p) => `${p} (${NOMES_PI[p]})`).join(" e do ");
  const rotulo = `Sugerido a partir do ${origem}`;
  return { rotulo, texto: e.descricao };
}

// ---------------------------------------------------------------------------
// A2 · Estruturas de cofre do PI-03 — modelos por cenário do ROT (PI-02).
// Sugerem apenas a ESTRUTURA lógica da pasta; IDs e hashes seguem manuais.
// ---------------------------------------------------------------------------
export const ESTRUTURAS_COFRE: Record<string, { cenario: string; estrutura: string }> = {
  RH: {
    cenario: "RH / folha de pagamento",
    estrutura: "holerites/\ncontratos/\ndocumentos-pessoais/\nafastamentos/",
  },
  Financeiro: {
    cenario: "Financeiro",
    estrutura: "notas-fiscais/\nboletos/\ndados-bancarios/\ncomprovantes/",
  },
  Marketing: {
    cenario: "Marketing",
    estrutura: "bases-consentidas/\ncampanhas/\nrevogacoes/",
  },
  Recepcao: {
    cenario: "Recepção / controle de acesso",
    estrutura: "registros-visitantes/\nbiometria-templates/\nlogs-acesso/",
  },
  Juridico: {
    cenario: "Jurídico",
    estrutura: "contratos/\nprocuracoes/\nprocessos/",
  },
  generico: {
    cenario: "Uso geral",
    estrutura: "documentos/\ncontratos/\nregistros/",
  },
};

export type SugestaoEstrutura = { estrutura: string; rotulo: string; cenarios: string[] };

/** Modelo de estrutura de pasta derivado dos setores presentes no ROT (PI-02). */
export function estruturaSugerida(setores: string[]): SugestaoEstrutura {
  const limpa = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const norm = setores.map(limpa);
  const achados: [string, { cenario: string; estrutura: string }][] = Object.entries(ESTRUTURAS_COFRE).filter(([k]) =>
    k !== "generico" && norm.some((s) => s.includes(limpa(k))),
  );
  const escolhidos: [string, { cenario: string; estrutura: string }][] = achados.length ? achados : [["generico", ESTRUTURAS_COFRE["generico"]!]];
  const blocos = escolhidos.map(([k, v]) => `${k === "generico" ? "" : `/${k}\n`}${v.estrutura.split("\n").map((l) => (k === "generico" ? l : `  ${l}`)).join("\n")}`);
  return {
    estrutura: blocos.join("\n"),
    cenarios: escolhidos.map(([, v]) => v.cenario),
    rotulo: "Sugerido a partir do ROT (PI-02)",
  };
}

// ---------------------------------------------------------------------------
// A3 · Padrão de hostname — apenas placeholder de formato, nunca valor inventado.
// ---------------------------------------------------------------------------
/** Detecta o padrão do primeiro endpoint cadastrado e devolve um placeholder de formato. */
export function padraoHostname(hostnames: string[]): string | null {
  const primeiro = hostnames.find((h) => h.trim());
  if (!primeiro) return null;
  const m = primeiro.trim().match(/^([A-Za-z]+)-([A-Za-z]+)-(\d+)$/);
  if (m) return `${m[1]}-<SETOR>-${"N".repeat(m[3]?.length ?? 2)} (padrão detectado a partir de ${primeiro.trim()})`;
  return `Padrão detectado: ${primeiro.trim()} — mantenha o mesmo formato`;
}

// ---------------------------------------------------------------------------
// A4 · Prompts de exemplo do Escudo Digital — antes/depois fixos, sem IA.
// ---------------------------------------------------------------------------
export type ExemploEscudo = { id: string; rotulo: string; prompt: string; higienizado: string; mascara: string; fonte: string };

export const EXEMPLOS_ESCUDO: ExemploEscudo[] = [
  {
    id: "cpf",
    rotulo: "CPF",
    prompt: "Resuma o cadastro do cliente portador do CPF 123.456.789-00 e informe o status do último atendimento.",
    higienizado: "Resuma o cadastro do cliente portador do CPF [CPF_TOKEN_4821] e informe o status do último atendimento.",
    mascara: "123.456.789-**",
    fonte: "LGPD art. 46 / CIS Control 03",
  },
  {
    id: "email",
    rotulo: "E-mail",
    prompt: "Envie a proposta comercial revisada para maria.souza@cliente.com.br até sexta-feira.",
    higienizado: "Envie a proposta comercial revisada para [EMAIL_TOKEN_7312] até sexta-feira.",
    mascara: "m****@cliente.com.br",
    fonte: "LGPD art. 5º, I / CIS Control 03",
  },
  {
    id: "bancario",
    rotulo: "Dado bancário",
    prompt: "Registre o reembolso do colaborador no banco 341, agência 1234, conta corrente 56789-0.",
    higienizado: "Registre o reembolso do colaborador no banco [BANCO_TOKEN_10], agência [AGENCIA_TOKEN_20], conta corrente [CONTA_TOKEN_30].",
    mascara: "banco 3** · ag. **** · c/c *****-0",
    fonte: "LGPD art. 7º / ISO/IEC 27002",
  },
  {
    id: "titular",
    rotulo: "Nome de titular",
    prompt: "Analise o histórico de atendimento de João da Silva e sugira o próximo contato.",
    higienizado: "Analise o histórico de atendimento de [NOME_TOKEN_01] e sugira o próximo contato.",
    mascara: "J*** da S****",
    fonte: "LGPD art. 5º, I / CIS Control 03",
  },
];

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

