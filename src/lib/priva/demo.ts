import type { Database } from "@/integrations/supabase/types";
import type { Question } from "./data";

/** Modo Demonstração Comercial: dados cenográficos que vivem só no estado do navegador. Nada aqui é gravado no banco. */
export const DEMO_CNPJ = "99999999000199";
export const DEMO_RAZAO = "Empresa Cenográfica S.A.";
export const DEMO_CPF = "00000000000";
export const DEMO_SCORE = 1075;
export const DEMO_SLA_MS = 58 * 3600 * 1000;
export const DEMO_MULTA_BASE = 100_000;

const ts = "2026-10-01T12:00:00.000Z";
export const DEMO_SIGNATURES = Object.fromEntries(
  ["PI-01", "PI-02", "PI-02-DPO", "PI-02-DIR", "PI-03", "PI-03-DPO", "PI-03-DIR", "PI-04", "PI-04-DPO", "PI-04-DIR", "PI-05", "PI-05-DPO", "PI-05-DIR"].map((k, i) => [
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

type Ativo = Database["public"]["Tables"]["ativos_seguranca"]["Row"];
export const DEMO_ATIVOS: Ativo[] = [
  ...Array.from({ length: 20 }, (_, i): Ativo => ({
    id: `demo-ep-${i}`, empresa_cnpj: DEMO_CNPJ, tipo: "ENDPOINT", identificador: `NB-${["FIN", "RH", "TI", "DIR", "COM"][i % 5]}-${String(i + 1).padStart(2, "0")}`,
    descricao: "Notebook corporativo", protegido: true, provedor_nuvem: null, estrutura_pasta: null, hash_integridade: null,
    criado_por: null, criado_em: ts, atualizado_em: ts,
  })),
  { id: "demo-cofre-1", empresa_cnpj: DEMO_CNPJ, tipo: "COFRE", identificador: "Cofre-RH", descricao: "Cofre Cryptomator do RH", protegido: true, provedor_nuvem: "Google Drive", estrutura_pasta: "/RH/folha\n/RH/contratos", hash_integridade: "c0ffee".padEnd(64, "0"), criado_por: null, criado_em: ts, atualizado_em: ts },
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
    id: "demo-inc", empresa_cnpj: DEMO_CNPJ, iniciado_em: ts, passos: [true, true, true, false, false, false],
    comunicacao: { natureza: "Ransomware no servidor de arquivos", categorias: "Nome, CPF", titulares: "1.250", riscos: "Fraude de identidade", medidas: "Isolamento e restauração de backup", encarregado: "dpo@cenografica.com.br" },
    enviado_anpd_em: null, encerrado_em: null, criado_por: null, processo_id: null, comunicacao_atrasada: false, etapas_registro: {},
  }],
  ripd_ia: [{
    empresa_cnpj: DEMO_CNPJ, sistema_avaliado: "Assistente LLM de triagem de currículos e atendimento", atualizado_por: null, atualizado_em: ts,
    escudo_digital: "O Escudo Digital do Bloco 3 tokeniza localmente CPFs, e-mails e nomes antes do envio a qualquer IA externa e reverte os tokens apenas no navegador do usuário autorizado.",
    riscos: {
      vazamento: { prob: 2, imp: 4, descricao: "Colaboradores colando currículos no chat.", mitig: "Tokenização obrigatória via Escudo Digital e bloqueio de IAs não homologadas." },
      vies: { prob: 2, imp: 5, descricao: "Ranqueamento de candidatos por gênero ou idade.", mitig: "Revisão humana obrigatória (Art. 20 LGPD) e auditoria trimestral de vieses." },
      injecao: { prob: 3, imp: 3, descricao: "Currículos com instruções ocultas.", mitig: "Filtro de instruções e isolamento do contexto do sistema." },
    },
  }],
  ciclos_priva: [],
};
