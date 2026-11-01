import { BIBLIOTECA_NORMATIVA, type EntradaNormativa } from './bibliotecaNormativa';
export type PosicaoCitacao = 'FUNDAMENTO' | 'REFERENCIA';
export function podeFundamentar(entrada: EntradaNormativa, posicao: PosicaoCitacao) {
  return entrada.status === 'VERIFICADA' && (posicao !== 'FUNDAMENTO' || ['REGIME_GERAL', 'LEI_ESPECIAL_SETORIAL'].includes(entrada.categoria));
}
export const CATEGORIAS_ROTULO = {
  REGIME_GERAL: 'Regime geral', LEI_ESPECIAL_SETORIAL: 'Lei especial setorial',
  FOMENTO_ECONOMICO: 'Referência de enquadramento econômico, não fundamento de obrigação de proteção de dados',
  REFERENCIA_TECNICA: 'Referência técnica do método',
};
export const citacaoExata = (norma: string, identificador: string) => BIBLIOTECA_NORMATIVA.find(e => e.norma === norma && e.identificador === identificador);