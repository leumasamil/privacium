/**
 * Fixtures cenográficas da aba "Solicitações de titulares" na demonstração pública.
 *
 * Regras da demo pública: dados fictícios, nenhuma gravação, nenhum identificador
 * real. Os prazos são calculados em relação ao dia de acesso para que os alertas
 * D-5, D-2 e atraso sejam sempre visíveis. Nenhum valor aqui é dado pessoal.
 */
import type { Database } from '@/integrations/supabase/types';

type Pedido = Database['public']['Tables']['solicitacoes_titular']['Row'];
type Resultado = Database['public']['Functions']['localizar_titular']['Returns'][number];

const dia = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Cinco atendimentos cenográficos cobrindo D-5, D-2, atraso, roteamento a controlador e respondida. */
export function solicitacoesDemo(): Pedido[] {
  const base = {
    empresa_id: 'demo', responsavel_id: 'demo', identificador_hash: 'sha256:cenografico',
    produto_id: null, fundamento_negativa: null, fundamento_normativo_id: null, respondido_em: null,
    descricao: 'Solicitação cenográfica, sem identificador do titular.', canal: 'E-mail',
    criado_em: new Date().toISOString(),
  };
  return [
    { ...base, id: 'demo-tit-1', protocolo: 'TIT-2026-0001', direito_solicitado: 'II', tipo_prazo: 'LEGAL', data_recebimento: dia(-10), prazo_resposta: dia(5), status: 'EM_ANALISE' },
    { ...base, id: 'demo-tit-2', protocolo: 'TIT-2026-0002', direito_solicitado: 'III', tipo_prazo: 'METODO', data_recebimento: dia(-13), prazo_resposta: dia(2), status: 'ABERTA' },
    { ...base, id: 'demo-tit-3', protocolo: 'TIT-2026-0003', direito_solicitado: 'VI', tipo_prazo: 'METODO', data_recebimento: dia(-20), prazo_resposta: dia(-5), status: 'EM_ANALISE' },
    { ...base, id: 'demo-tit-4', protocolo: 'TIT-2026-0004', direito_solicitado: 'I', tipo_prazo: 'LEGAL', data_recebimento: dia(-1), prazo_resposta: dia(14), status: 'ENCAMINHADA_CONTROLADOR' },
    { ...base, id: 'demo-tit-5', protocolo: 'TIT-2026-0005', direito_solicitado: 'IX', tipo_prazo: 'METODO', data_recebimento: dia(-30), prazo_resposta: dia(-15), status: 'RESPONDIDA', respondido_em: dia(-16) },
  ];
}

/** Resultado cenográfico da busca protegida: PRTs e localização técnica, sem identificador em claro. */
export const RESULTADO_BUSCA_DEMO: Resultado[] = [
  { indice_id: 'demo-ind-1', codigo: 'PRIVA-RH-001', prt: 'PRT-1 · Relatório de folha consolidado', localizacao_tecnica: 'Sistema de folha · tabela funcionarios (cenográfico)', papel_agente: 'CONTROLADOR', produto_id: 'demo-rot-1' },
  { indice_id: 'demo-ind-2', codigo: 'PRIVA-FIN-001', prt: 'PRT-1 · Relatório de folha consolidado', localizacao_tecnica: 'Sistema financeiro · contas a pagar (cenográfico)', papel_agente: 'CONTROLADOR', produto_id: 'demo-rot-4' },
];

export const OPCOES_PRT_DEMO = [
  { valor: 'demo-rot-1:0', texto: 'PRIVA-RH-001 · PRT-1 · Relatório de folha consolidado · CONTROLADOR' },
  { valor: 'demo-rot-4:0', texto: 'PRIVA-FIN-001 · PRT-1 · Relatório de folha consolidado · CONTROLADOR' },
];
