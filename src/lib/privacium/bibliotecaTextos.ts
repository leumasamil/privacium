/**
 * Biblioteca estática e versionada de modelos de texto do Ecossistema Privacium.
 * Determinística: mesma entrada → mesmo texto, sempre. Nenhuma chamada de IA.
 * Nenhum fato verificável é pré-preenchido: IDs, hostnames e hashes usam placeholders.
 */
import { NOMES_PI } from "./bibliotecaMitigacao";

export const VERSAO_TEXTOS = "2026.10-1";

export type TextoId =
  | "politica-ia"
  | "clausula-llm"
  | "rot-llm"
  | "convencao-hostname"
  | "inventario-cofre"
  | "estrutura-pasta-rot"
  | "dossie-pi03";

export type TextoModelo = { id: TextoId; titulo: string; corpo: string; fonte: string; pi: string };

export const BIBLIOTECA_TEXTOS: Record<TextoId, TextoModelo> = {
  "politica-ia": {
    id: "politica-ia",
    titulo: "Política de uso de IA com dado pessoal",
    pi: "PI-03",
    fonte: "LGPD art. 46 / CIS Control 03",
    corpo: `POLÍTICA DE USO DE INTELIGÊNCIA ARTIFICIAL COM DADO PESSOAL

1. É proibido colar dado pessoal (nome, CPF, e-mail, dado bancário) em prompts de serviços de IA externos sem higienização prévia pelo Escudo Digital.
2. Todo prompt destinado a provedor externo passa pelo proxy de tokenização: o dado pessoal é substituído por tokens sintéticos e a tabela de reversão permanece no endpoint do colaborador.
3. Dado pessoal sensível (art. 5º, II da LGPD) nunca é enviado a IA externa, mesmo tokenizado, sem autorização escrita do Encarregado (DPO).
4. O uso de IA em decisões que afetem titulares deve assegurar ao titular o direito de solicitar a revisão das decisões tomadas unicamente com base em tratamento automatizado (art. 20 da LGPD).
5. Violões desta política são registrados na trilha de auditoria e tratados como incidente pelo Bloco 4.`,
  },
  "clausula-llm": {
    id: "clausula-llm",
    titulo: "Cláusula contratual de proteção de dados para fornecedor de LLM",
    pi: "PI-03",
    fonte: "LGPD arts. 39 e 42 / ISO/IEC 27002",
    corpo: `CLÁUSULA DE PROTEÇÃO DE DADOS — FORNECEDOR DE MODELO DE LINGUAGEM (LLM)

1. O FORNECEDOR trata dados pessoais exclusivamente como operador, conforme instruções documentadas do CONTROLADOR (art. 39 da LGPD).
2. É vedado ao FORNECEDOR usar os prompts e respostas para treinamento de modelos, retenção além do necessário à execução ou compartilhamento com terceiros.
3. O FORNECEDOR deve manter medidas técnicas de segurança equivalentes às do art. 46 da LGPD e notificar o CONTROLADOR sobre incidentes em até 24 horas.
4. Os dados pessoais recebidos já chegam pseudonimizados por tokens; o FORNECEDOR não deve tentar reidentificá-los.
5. Ao término do contrato, o FORNECEDOR elimina todos os registros e apresenta declaração de exclusão.`,
  },
  "rot-llm": {
    id: "rot-llm",
    titulo: "Registro de operação no ROT para uso de LLM externo com higienização",
    pi: "PI-02",
    fonte: "LGPD art. 37",
    corpo: `ENTRADA DE ROT — USO DE LLM EXTERNO COM HIGIENIZAÇÃO

Setor: <SETOR>
Ciclo de vida (gênero × espécie): Processar › utilizar
Categoria de titulares: <CATEGORIA DOS TITULARES>
Dados pessoais: <DADOS PESSOAIS TRATADOS> (sempre tokenizados antes do envio)
Finalidade específica: <FINALIDADE>
Hipótese de tratamento (7A): Art. 7º, IX – Legítimo interesse do controlador ou de terceiro
Tempo de retenção: <PRAZO> · Base do prazo: <BASE>
Compartilhamento: Provedor de LLM externo (operador), com cláusula de proteção de dados
Salvaguardas: Escudo Digital (tokenização local), cláusula contratual, trilha de auditoria com SHA-256
Infraestrutura: Nuvem externa (somente tokens) + endpoint local (tabela de reversão)`,
  },
  "convencao-hostname": {
    id: "convencao-hostname",
    titulo: "Convenção de nomenclatura de hostname e domínio",
    pi: "PI-03",
    fonte: "ISO/IEC 27002 — 8.9 / CIS Control 01",
    corpo: `CONVENÇÃO DE NOMENCLATURA DE ATIVOS

Formato de hostname: <TIPO>-<SETOR>-<NN>
  TIPO: NB (notebook), WS (workstation), SR (servidor)
  SETOR: FIN, RH, TI, DIR, COM, JUR, REC
  NN: número sequencial de dois dígitos
Exemplo de formato: NB-FIN-01

Domínio/Localização: usar sempre o domínio corporativo registrado no primeiro ativo cadastrado, no formato <dominio.corporativo>.

Observação: o ID de hardware (número de série) e o hash de integridade são fatos verificáveis e devem ser copiados do equipamento real — nunca preenchidos por sugestão.`,
  },
  "inventario-cofre": {
    id: "inventario-cofre",
    titulo: "Inventário de cofre criptográfico",
    pi: "PI-03",
    fonte: "LGPD art. 46 / ISO/IEC 27002 — 8.24",
    corpo: `INVENTÁRIO DE COFRE CRIPTOGRÁFICO (CRYPTOMATOR)

Cofre: <DIRETÓRIO LÓGICO>
Provedor de nuvem: <PROVEDOR>
Criptografia: client-side (o provedor armazena apenas conteúdo cifrado)
Responsável: <RESPONSÁVEL>
Localização/domínio: <LOCALIZAÇÃO>
Estrutura de pastas: conforme modelo do cenário do ROT
Hash SHA-256 da estrutura: calculado pela plataforma no ato do cadastro e recalculado a cada alteração
Chave de recuperação: custodiada offline pelo Encarregado (DPO), fora da nuvem`,
  },
  "estrutura-pasta-rot": {
    id: "estrutura-pasta-rot",
    titulo: "Estrutura de pasta por cenário do ROT",
    pi: "PI-02",
    fonte: "LGPD art. 37 / ISO/IEC 27002 — 5.9",
    corpo: `ESTRUTURA DE PASTA POR CENÁRIO DO ROT

Cada cofre espelha os setores registrados no ROT (PI-02), com uma subpasta por categoria de documento:
  /RH — holerites/, contratos/, documentos-pessoais/, afastamentos/
  /Financeiro — notas-fiscais/, boletos/, dados-bancarios/, comprovantes/
  /Marketing — bases-consentidas/, campanhas/, revogacoes/
  /Recepção — registros-visitantes/, biometria-templates/, logs-acesso/
  /Jurídico — contratos/, procuracoes/, processos/

Regra: nenhum documento fora da pasta do seu cenário; a estrutura é selada por hash SHA-256 e qualquer alteração muda o hash.`,
  },
  "dossie-pi03": {
    id: "dossie-pi03",
    titulo: "Dossiê textual consolidado do PI-03",
    pi: "PI-03",
    fonte: "LGPD art. 46 / ISO/IEC 27701",
    corpo: `PI-03: BOOK DE EVIDÊNCIAS TECNOLÓGICAS E CONTRATUAIS (MODELO)

1. Criptografia de endpoint (BitLocker): <N>/<TOTAL> máquinas protegidas, chaves de recuperação custodiadas offline pelo Encarregado (DPO).
2. Cofres em nuvem (Cryptomator, criptografia client-side): <N> cofre(s) catalogado(s), estrutura selada por hash SHA-256.
3. Escudo Digital de IA: pseudonimização de nomes, CPFs e e-mails por tokens sintéticos antes do envio a provedores externos; tabela de reversão mantida apenas no endpoint.
4. Contratos: cláusula de proteção de dados aplicada a todo fornecedor que trata dado pessoal.

Assinatura do DPO (Gov.br): ______________________________
Assinatura da Diretoria (Gov.br): ______________________________`,
  },
};

export const CABECALHO_MODELO = (t: TextoModelo) =>
  `MODELO SUGERIDO PELO PRIVACIUM · Origem: ${t.pi} (${NOMES_PI[t.pi] ?? t.pi}) · Fonte: ${t.fonte} · Revise e adapte antes de assinar.`;
export const RODAPE_MODELO = "Este é um modelo, não um parecer. A responsabilidade pela adequação é do controlador.";

/** Texto completo para a área de transferência: cabeçalho obrigatório + corpo + rodapé. */
export function textoCompleto(t: TextoModelo): string {
  return `${CABECALHO_MODELO(t)}\n\n${t.corpo}\n\n${RODAPE_MODELO}`;
}

/** Mesmo envelope para textos sugeridos fora da biblioteca (ex.: campos do PI-05). */
export function enveloparModelo(corpo: string, pi: string, fonte: string): string {
  return textoCompleto({ id: "politica-ia", titulo: "", corpo, fonte, pi });
}

/* ------------------------------------------------------------------ */
/* Módulo Lei de IA — ressalva de escopo e classificação determinística */
/* ------------------------------------------------------------------ */

/** Ressalva obrigatória do módulo de IA: o regime legal brasileiro está em consolidação. */
export const ROTULO_ESCOPO_IA =
  "Avaliação preventiva de conformidade. O regime legal de IA no Brasil está em consolidação — este módulo não substitui parecer jurídico.";

/** O PL 2338 é projeto em tramitação, nunca obrigação vigente. */
export const PL_2338_RESSALVA =
  "PL 2338/2023 — projeto de lei em tramitação no Congresso Nacional; ainda não é lei vigente.";

export type NivelRiscoIA = "Risco Excessivo" | "Alto Risco" | "Risco Limitado" | "Risco Mínimo";
export const NIVEIS_RISCO_IA: NivelRiscoIA[] = ["Risco Excessivo", "Alto Risco", "Risco Limitado", "Risco Mínimo"];

export interface ClassificacaoIA {
  nivel: NivelRiscoIA;
  /** Critérios que geraram o nível, exibidos em "Derivado de:". */
  derivadoDe: string[];
}

/**
 * Classificação determinística a partir das respostas do RIPO:
 * - Risco Excessivo: uso de IA sobre dado pessoal sensível (saúde/rastreamento ativos);
 * - Alto Risco: decisão exclusivamente automatizada sobre pessoa natural (LGPD art. 20);
 * - Risco Limitado: dados pessoais tratados com apoio de IA, sem decisão automatizada;
 * - Risco Mínimo: nenhuma das condições acima.
 */
export function classificarRiscoIA(r: {
  saud_tracking: boolean;
  sens_ai: boolean;
  decisao_automatizada: boolean;
  pessoais: boolean;
}): ClassificacaoIA {
  if (r.sens_ai) {
    return {
      nivel: "Risco Excessivo",
      derivadoDe: [
        "RIPO: uso de IA sobre dado pessoal sensível (saúde / rastreamento)",
        "Setor declarado com categorias de dado pessoal sensível ativas",
      ],
    };
  }
  if (r.decisao_automatizada) {
    return {
      nivel: "Alto Risco",
      derivadoDe: ["RIPO: decisão exclusivamente automatizada sobre pessoa natural (LGPD art. 20)"],
    };
  }
  if (r.pessoais) {
    return {
      nivel: "Risco Limitado",
      derivadoDe: ["RIPO: tratamento de dados pessoais com apoio de IA, sem decisão automatizada"],
    };
  }
  return { nivel: "Risco Mínimo", derivadoDe: ["RIPO: nenhuma categoria de risco de IA ativa"] };
}

/* ---------------- Avaliação de Impacto Algorítmico (AIA) ---------------- */

export interface DimensaoAIA { id: string; titulo: string; pergunta: string; }
export const DIMENSOES_AIA: DimensaoAIA[] = [
  { id: "autonomia", titulo: "Autonomia da decisão", pergunta: "O sistema decide sozinho ou apenas apoia uma decisão humana?" },
  { id: "afetados", titulo: "Categorias de afetados", pergunta: "Quais grupos de titulares são afetados pelas decisões do sistema?" },
  { id: "revisao", titulo: "Revisão humana (LGPD art. 20)", pergunta: "Existe canal para o titular pedir revisão de decisão automatizada?" },
  { id: "mitigacao", titulo: "Medidas de mitigação específicas de IA", pergunta: "Quais controles reduzem vieses, erros e usos indevidos do modelo?" },
];

/** Respostas determinísticas da AIA, sugeridas a partir do RIPO quando os dados existem. */
export function respostasAIA(r: {
  decisao_automatizada: boolean;
  sens_ai: boolean;
  pessoais: boolean;
}): Record<string, { resposta: string; sugerida: boolean }> {
  const sugerida = r.pessoais || r.sens_ai || r.decisao_automatizada;
  return {
    autonomia: {
      resposta: r.decisao_automatizada
        ? "Decisão exclusivamente automatizada identificada no RIPO — o titular tem direito de solicitar a revisão; mantenha canal para o pedido (LGPD art. 20)."
        : "Sistema de apoio à decisão humana; nenhuma decisão exclusivamente automatizada declarada no RIPO.",
      sugerida,
    },
    afetados: {
      resposta: r.sens_ai
        ? "Titulares de dado pessoal sensível (saúde / rastreamento), conforme categorias ativas no RIPO."
        : r.pessoais
          ? "Titulares de dados pessoais comuns declarados no RIPO."
          : "Nenhuma categoria de afetados declarada no RIPO.",
      sugerida,
    },
    revisao: {
      resposta: r.decisao_automatizada
        ? "Canal para o titular solicitar a revisão (LGPD art. 20): registrar no ROT e no canal de titulares."
        : "Revisão humana recomendada como boa prática, mesmo sem decisão automatizada.",
      sugerida,
    },
    mitigacao: {
      resposta: r.sens_ai
        ? "Mitigações reforçadas: testes de viés, minimização de dado pessoal sensível e supervisão humana contínua."
        : "Mitigações padrão: validação periódica do modelo, registro de versões e higienização de entradas (Escudo Digital).",
      sugerida,
    },
  };
}
