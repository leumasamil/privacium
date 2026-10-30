import type { Database } from "@/integrations/supabase/types";
import type { Question } from "./data";
import { PADRAO_RANSOMWARE, vincularNatureza } from './naturezasIncidente';
import { sugerirRiscos, textoRiscos, vincularRisco } from './riscosIncidente';
import { sugerirMedidas, textoMedidas, vincularMedida } from './medidasIncidente';
import { categoriasDoROT, vincularCategorias } from './categoriasANPD';
import { carregarEstadoIncidente, type FonteIncidente } from './estadoIncidente';
import { restanteANPD } from './anpd';

/** Modo Demonstração Comercial: dados cenográficos que vivem só no estado do navegador. Nada aqui é gravado no banco. */
export const DEMO_CNPJ = "99999999000199";
export const DEMO_RAZAO = "Empresa Cenográfica S.A.";
export const DEMO_CPF = "00000000000";
export const DEMO_SCORE = 1075;
export const DEMO_MULTA_BASE = 100_000;
const DEMO_INICIO_INCIDENTE = "2026-10-01T12:00:00.000Z";
/** Relógio cenográfico fixo: 14h após o conhecimento do incidente, dentro do prazo de 3 dias úteis. */
export const DEMO_AGORA = Date.parse(DEMO_INICIO_INCIDENTE) + 14 * 3600000;
export const DEMO_AGORA_ISO = new Date(DEMO_AGORA).toISOString();
export const DEMO_SLA_MS = restanteANPD(DEMO_INICIO_INCIDENTE, null, DEMO_AGORA);

/** Static public scenario mirrors the diagnostic catalog, never queries tenant data. */
const departamentosDemo = ['RH', 'TI', 'Marketing', 'Compras', 'Recepção', 'Jurídico', 'Financeiro'];
const principiosDemo = ['Segurança da Informação (Art. 46)', 'Hipótese de Tratamento (Arts. 7º e 11)', 'Dados Pessoais Sensíveis (Art. 5º, II)', 'Compartilhamento com Terceiros (Arts. 26 e 39)', 'Especificação da Finalidade (Art. 6º, I)', 'Responsabilização e Prestação de Contas (Art. 6º, X)', 'Limitação e Minimização de Dados (Art. 6º, III)', 'Qualidade e Precisão de Dados (Art. 6º, V)'];
const pesosDemo = [10, 10, 9, 9, 8, 8, 7, 7];
export const DEMO_QUESTIONS: Question[] = Array.from({ length: 166 }, (_, index) => {
  const department = departamentosDemo[index % 7] ?? 'RH';
  const principle = principiosDemo[Math.floor(index / 7) % 8] ?? '';
  return { id: `demo-question-${index + 1}`, department, principle, weight: pesosDemo[Math.floor(index / 7) % 8] ?? 7,
    text: `No departamento ${department}, ${index < 56 ? 'existem salvaguardas técnicas, barreiras lógicas ou rotinas ativas' : index < 112 ? 'há evidência documental (política, registro ou contrato)' : 'há monitoramento periódico com responsável e plano de correção'} para garantir a conformidade com a Questão Crítica de ${principle}?` };
});

const ts = "2026-10-01T12:00:00.000Z";
/** PI-01 a PI-04 chancelados; PI-05 aguarda as assinaturas atribuídas por papel. */
export const DEMO_SIGNATURES = Object.fromEntries(
  ["PI-01", "PI-02", "PI-02-DPO", "PI-02-DIR", "PI-03", "PI-03-DPO", "PI-03-DIR", "PI-04", "PI-04-DPO", "PI-04-DIR"].map((k, i) => [
    k,
    { by: `Assinatura digital Gov.br · ${k} · CHANCELADO (demonstração)`, ts, hash: `d3m0${String(i).padStart(2, "0")}`.padEnd(64, "a") },
  ]),
);

/** TI e RH ~85% atendidos; demais setores completam até exatamente DEMO_SCORE pontos. */
export function demoAnswers(questions: Question[], target = DEMO_SCORE): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  let total = 0;
  for (const dep of ["TI", "RH"]) {
    const qs = questions.filter((q) => q.department === dep);
    const max = qs.reduce((s, q) => s + q.weight, 0);
    let got = 0;
    for (const q of qs) {
      if (got < max * 0.85 && total + q.weight <= target) { out[q.id] = true; got += q.weight; total += q.weight; }
      else out[q.id] = false;
    }
  }
  const rest = questions.filter((q) => !(q.id in out)).sort((a, b) => b.weight - a.weight);
  for (const q of rest) {
    if (total + q.weight <= target) { out[q.id] = true; total += q.weight; } else out[q.id] = false;
  }
  // Ajuste fino: troca uma pergunta marcada por outra não marcada com peso maior para fechar o alvo exato
  for (let guard = 0; total < target && guard < 20; guard++) {
    const on = questions.filter((q) => out[q.id]);
    const off = questions.filter((q) => !out[q.id]);
    let swapped = false;
    for (let d = target - total; d > 0 && !swapped; d--) {
      for (const a of on) {
        const b = off.find((x) => x.weight === a.weight + d);
        if (b) { out[a.id] = false; out[b.id] = true; total += d; swapped = true; break; }
      }
    }
    if (!swapped) break;
  }
  return out;
}

type Rot = Database["public"]["Tables"]["registro_operacoes"]["Row"];
const rot = (p: Partial<Rot> & Pick<Rot, "id" | "setor" | "codigo">): Rot => ({
  empresa_cnpj: DEMO_CNPJ, genero_verbo: "Coletar", categoria_titulares: [], dados_pessoais: [], dados_sensiveis: [],
  finalidade_especifica: "", hipotese_tratamento: "Art. 7º, II – Cumprimento de obrigação legal ou regulatória",
  tempo_retencao: "5 anos", base_prazo: "CTN art. 173", compartilhamento: "Não há", salvaguardas: ["Criptografia em repouso"],
  infraestrutura: "Nuvem", justificativa_mitigacao: null, hipotese_sensivel: null, criado_por: null, criado_em: ts, atualizado_em: ts, ...p,
});
export const DEMO_ROT: Rot[] = [
  rot({ id: "demo-rot-1", setor: "RH", codigo: "PRIVA-RH-001", categoria_titulares: ["Colaboradores"], dados_pessoais: ["Nome", "CPF", "Dados bancários"], finalidade_especifica: "Processamento da folha de pagamento mensal", compartilhamento: "Contabilidade terceirizada" }),
  rot({ id: "demo-rot-2", setor: "Marketing", codigo: "PRIVA-MARKETING-001", genero_verbo: "Utilizar", categoria_titulares: ["Clientes"], dados_pessoais: ["Nome", "E-mail"], finalidade_especifica: "Envio de newsletter a clientes que consentiram", hipotese_tratamento: "Art. 7º, I – Consentimento do titular", tempo_retencao: "Até a revogação", base_prazo: "Art. 8º, §5º LGPD" }),
  rot({ id: "demo-rot-3", setor: "Recepção", codigo: "PRIVA-RECEPCAO-001", categoria_titulares: ["Menores de Idade", "Visitantes"], dados_pessoais: ["Nome", "Foto"], dados_sensiveis: ["Biometria Facial"], finalidade_especifica: "Controle de acesso físico às instalações", hipotese_tratamento: "Art. 7º, IX – Legítimo interesse do controlador ou de terceiro", hipotese_sensivel: "Art. 11, II, g – Garantia de prevenção à fraude e segurança do titular", tempo_retencao: "6 meses", base_prazo: "Política interna de segurança", infraestrutura: "Servidor local", salvaguardas: ["Criptografia em repouso", "Acesso restrito por perfil"], justificativa_mitigacao: "Templates biométricos cifrados com AES-256, sem armazenamento da imagem bruta, consentimento específico do responsável legal (Art. 14 LGPD) e exclusão automática após 6 meses." }),
];

export const DEMO_PUBLIC_SIGNATURES = Object.fromEntries(Object.entries(DEMO_SIGNATURES).filter(([key]) => !key.startsWith('PI-04') && !key.startsWith('PI-05')));
export const DEMO_DPO: Database['public']['Tables']['encarregado_dpo']['Row'] = {
  empresa_cnpj: DEMO_CNPJ, nome: 'Encarregado Cenográfico', email: 'dpo@cenografica.com.br',
  telefone: null, endereco: null, publicar_contato: false, atualizado_em: ts,
};
const etapasDemo = [1, 2, 3, 4, 5, 6].map(numero => ({ numero, concluida: true }));
const evidenciasDemo = [
  'Servidores desconectados da VLAN corporativa.',
  'Célula de resposta acionada; papéis de crise atribuídos.',
  'Coleta forense de logs de firewall e dump de memória.',
  'Restauração a partir de backup íntegro com validação de hash.',
  'Integridade dos dados restaurados validada por SHA-256.',
  'Comunicação à ANPD preparada no formulário assistido.',
];
const riscosDemo = sugerirRiscos(PADRAO_RANSOMWARE, false, false);
const medidasDemo = sugerirMedidas(etapasDemo.slice(0, 3));
const detalhesDemo = 'Incidente cenográfico: ransomware criptografou o servidor de arquivos da folha de pagamento, interrompendo o acesso a Nome, CPF e Dados bancários de 1250 colaboradores. Não representa uma ocorrência real.';

type Ativo = Database["public"]["Tables"]["ativos_seguranca"]["Row"];
export const DEMO_ATIVOS: Ativo[] = [
  ...Array.from({ length: 20 }, (_, i): Ativo => ({
    id: `demo-ep-${i}`, empresa_cnpj: DEMO_CNPJ, tipo: "ENDPOINT", identificador: `NB-${["FIN", "RH", "TI", "DIR", "COM"][i % 5]}-${String(i + 1).padStart(2, "0")}`,
    descricao: "Notebook corporativo", protegido: true, provedor_nuvem: null, estrutura_pasta: null, hash_integridade: null,
    criado_por: null, criado_em: ts, atualizado_em: ts, responsavel: null, localizacao: null,
  })),
  { id: "demo-cofre-1", empresa_cnpj: DEMO_CNPJ, tipo: "COFRE", identificador: "Cofre-RH", descricao: "Cofre Cryptomator do RH", protegido: true, provedor_nuvem: "Google Drive", estrutura_pasta: "/RH/folha\n/RH/contratos", hash_integridade: "c0ffee".padEnd(64, "0"), criado_por: null, criado_em: ts, atualizado_em: ts, responsavel: null, localizacao: null },
];

type Tables = Database["public"]["Tables"];
export const DEMO_ROWS: {
  lotes_pgaudit: Tables["lotes_pgaudit"]["Row"][];
  incidentes_seguranca: Tables["incidentes_seguranca"]["Row"][];
  ripd_ia: Tables["ripd_ia"]["Row"][];
  ciclos_priva: Tables["ciclos_priva"]["Row"][];
} = {
  lotes_pgaudit: [{
    id: "demo-lote", empresa_cnpj: DEMO_CNPJ, mes_referencia: "2026-10", linhas: 3, gerado_por: null, gerado_em: ts,
    conteudo: "-- pgAudit · extração mensal 2026-10 · CNPJ 99.999.999/0001-99\n2026-10-01 09:12 | dpo@cenografica.com.br | SELECT registro_operacoes | Leitura do ROT\n2026-10-02 14:03 | rh@cenografica.com.br | UPDATE respostas_diagnostico | Resposta RH-04\n2026-10-03 08:47 | ti@cenografica.com.br | SELECT chaves_recuperacao | Consulta de chave BitLocker",
    hash_sha256: "5e1f".padEnd(64, "b"),
  }],
  incidentes_seguranca: [{
    id: "demo-inc", empresa_cnpj: DEMO_CNPJ, iniciado_em: ts, passos: [true, true, true, true, true, true],
    comunicacao: { natureza: 'Ransomware no servidor de arquivos', natureza_principal: vincularNatureza(PADRAO_RANSOMWARE) ?? null,
      naturezas_secundarias: [], categorias: ['Nome', 'CPF', 'Dados bancários'],
      categorias_vinculadas: vincularCategorias(['Nome', 'CPF', 'Dados bancários'], categoriasDoROT(DEMO_ROT[0])),
      titulares: '1250', riscos_selecionados: riscosDemo.map(vincularRisco), riscos_detalhes: detalhesDemo,
      riscos: textoRiscos(riscosDemo, detalhesDemo), medidas_selecionadas: medidasDemo.map(vincularMedida),
      medidas: textoMedidas(medidasDemo), encarregado: 'dpo@cenografica.com.br' },
    enviado_anpd_em: null, encerrado_em: null, criado_por: null, processo_id: 'demo-rot-1', comunicacao_atrasada: false,
    etapas_registro: Object.fromEntries(etapasDemo.map(({ numero }) => [String(numero), { data: ts, responsavel: 'DPO Cenográfico', evidencia: evidenciasDemo[numero - 1] ?? '' }])),
  }],
  ripd_ia: [{
    empresa_cnpj: DEMO_CNPJ, sistema_avaliado: "Assistente LLM de triagem de currículos e atendimento", atualizado_por: null, atualizado_em: ts,
    escudo_digital: "O Escudo Digital do Bloco 3 tokeniza localmente CPFs, e-mails e nomes antes do envio a qualquer IA externa e reverte os tokens apenas no navegador do usuário autorizado.",
    riscos: {
      // Descrição, mitigação, probabilidade e impacto nascem da biblioteca estática (PI-05); o seed fica vazio.
      vazamento: { descricao: "", mitig: "" },
      vies: { descricao: "", mitig: "" },
      injecao: { descricao: "", mitig: "" },
    },
  }],
  ciclos_priva: [],
};

/** Estado da sessão de demonstração: vive só na memória do navegador, nunca no banco. */
export type DemoSessao = { enviadoEm: string | null; encerradoEm: string | null };
export const DEMO_SESSAO_INICIAL: DemoSessao = { enviadoEm: null, encerradoEm: null };

/** A etapa 06 (Comunicação à ANPD) é CONSEQUÊNCIA do envio, nunca pré-requisito: a derivação canônica já a lê de enviado_anpd_em. */
export function carregarEstadoIncidenteDemo(incidenteId: string, fonte: FonteIncidente) {
  return carregarEstadoIncidente(incidenteId, fonte);
}

type IncidenteRow = Database["public"]["Tables"]["incidentes_seguranca"]["Row"];
/** Sobrepõe o envio/encerramento simulados na linha cenográfica, sem gravar nada. */
export function aplicarSessaoDemo(i: IncidenteRow, s: DemoSessao): IncidenteRow {
  if (!s.enviadoEm && !s.encerradoEm) return i;
  const registro = { ...(i.etapas_registro as Record<string, unknown>) };
  if (s.enviadoEm) registro['6'] = { data: s.enviadoEm, responsavel: 'DPO Cenográfico', evidencia: 'Comunicação à ANPD enviada pelo formulário assistido (simulação).' };
  return { ...i, enviado_anpd_em: s.enviadoEm, encerrado_em: s.encerradoEm, etapas_registro: registro };
}

/** Evento da trilha cenográfica (mesma forma do AuditEntry, sem importar o store para evitar ciclo). */
export type DemoEvento = {
  seq: number; ts: string; role: string; cnpj: string | null; user_email: string | null;
  op: "SELECT" | "INSERT" | "UPDATE" | "DELETE"; target: string; detail: string; prev_hash: string; hash: string;
};
const hex = (s: string) => s.toLowerCase().replace(/[^0-9a-f]/g, '').padEnd(64, '0').slice(0, 64);
const seed = (seq: number, ts: string, op: DemoEvento['op'], target: string, detail: string, prev: string): DemoEvento =>
  ({ seq, ts, role: 'DPO_OPERACIONAL', cnpj: DEMO_CNPJ, user_email: 'dpo@cenografica.com.br', op, target, detail, prev_hash: prev, hash: hex(`de${seq}${target}${detail}`) });

/** Trilho Core cenográfico: declaração, 5 etapas, lote pgAudit selado e chancelas PI-01 a PI-03. */
export const DEMO_TRILHA_SEED: DemoEvento[] = (() => {
  const eventos: [string, DemoEvento['op'], string, string][] = [
    ["2026-10-01T12:00:00.000Z", "INSERT", "incidentes_seguranca", "Incidente de ransomware declarado · prazo de 3 dias úteis iniciado"],
    ["2026-10-01T12:20:00.000Z", "UPDATE", "incidentes_seguranca", "Etapa 01 (Isolamento) concluída · DPO Cenográfico"],
    ["2026-10-01T12:40:00.000Z", "UPDATE", "incidentes_seguranca", "Etapa 02 (Invocação) concluída · DPO Cenográfico"],
    ["2026-10-01T13:10:00.000Z", "UPDATE", "incidentes_seguranca", "Etapa 03 (Sandbox) concluída · DPO Cenográfico"],
    ["2026-10-01T15:30:00.000Z", "UPDATE", "incidentes_seguranca", "Etapa 04 (Descriptografia) concluída · DPO Cenográfico"],
    ["2026-10-01T18:00:00.000Z", "UPDATE", "incidentes_seguranca", "Etapa 05 (Validação) concluída · DPO Cenográfico"],
    ["2026-10-01T09:12:00.000Z", "INSERT", "lotes_pgaudit", "Extração mensal 2026-10 (3 linhas)"],
    ["2026-10-01T09:15:00.000Z", "UPDATE", "lotes_pgaudit", "Hash SHA-256 do lote 2026-10 selado"],
    ["2026-09-20T10:00:00.000Z", "INSERT", "signatures", "PI-01 chancelado · DPO Cenográfico"],
    ["2026-09-25T10:00:00.000Z", "INSERT", "signatures", "PI-02 chancelado · DPO + Diretoria"],
    ["2026-09-28T10:00:00.000Z", "INSERT", "signatures", "PI-03 chancelado · DPO + Diretoria"],
  ];
  let prev = hex('genesistrilha');
  return eventos.map(([ts, op, target, detail], i) => { const e = seed(i + 1, ts, op, target, detail, prev); prev = e.hash; return e; });
})();
