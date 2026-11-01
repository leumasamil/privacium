export type ContinuacaoReceptor = { tipo: 'NOVO_PRT' | 'ELIMINACAO' | 'USO_EXCLUSIVO' | 'INCORPORACAO'; anonimizados?: boolean; sem_acesso_terceiro?: boolean; linha_id?: string; produto_indice?: number; em?: string; por?: string; hash?: string; fundamento?: string };
export function lerContinuacao(v: unknown): ContinuacaoReceptor | null {
  if (!v || typeof v !== 'object' || !('tipo' in v) || !['NOVO_PRT','ELIMINACAO','USO_EXCLUSIVO','INCORPORACAO'].includes(String(v.tipo))) return null;
  return v as ContinuacaoReceptor;
}
export function continuacaoConforme(c: ContinuacaoReceptor | null, temProduto: boolean) {
  if (!c) return false;
  if (c.tipo==='NOVO_PRT') return temProduto;
  if (c.tipo==='USO_EXCLUSIVO') return c.anonimizados===true && c.sem_acesso_terceiro===true;
  if (c.tipo==='INCORPORACAO') return !!c.linha_id && Number.isInteger(c.produto_indice) && (c.produto_indice ?? -1)>=0;
  return c.tipo==='ELIMINACAO';
}
export function rotuloContinuacao(c: ContinuacaoReceptor | null) {
  if (!c) return 'Aguardando tratamento pelo receptor';
  if (c.tipo==='ELIMINACAO') return 'Conforme: eliminado (art. 16, caput)';
  if (c.tipo==='USO_EXCLUSIVO') return c.anonimizados && c.sem_acesso_terceiro ? 'Conforme: uso exclusivo com anonimização (art. 16, IV)' : 'Declarações de anonimização e ausência de acesso por terceiro pendentes';
  if (c.tipo==='INCORPORACAO') return 'Incorporação ao produto existente';
  return 'Gerar novo PRT';
}