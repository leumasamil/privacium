export type CategoriaANPD = { valor: string; fonte_normativa: string; sensivel: boolean };
const pessoal = 'LGPD art. 5º, I';
const sensivel = 'LGPD art. 5º, II';
export const CATEGORIAS_PADRAO: CategoriaANPD[] = [
  { valor: 'Dados de identificação (nome, CPF, RG, data de nascimento)', fonte_normativa: pessoal, sensivel: false },
  { valor: 'Dados de contato (e-mail, telefone, endereço)', fonte_normativa: pessoal, sensivel: false },
  { valor: 'Dados financeiros (conta, cartão, dados bancários)', fonte_normativa: pessoal, sensivel: false },
  ...['Dados de saúde', 'Dados biométricos', 'Dados genéticos', 'Origem racial ou étnica', 'Convicção religiosa', 'Opinião política', 'Filiação sindical', 'Vida sexual'].map(valor => ({ valor, fonte_normativa: sensivel, sensivel: true })),
  { valor: 'Dados de menores de idade', fonte_normativa: 'LGPD art. 5º, I / art. 14', sensivel: false },
  { valor: 'Credenciais de acesso', fonte_normativa: pessoal, sensivel: false },
  { valor: 'Dados de localização', fonte_normativa: pessoal, sensivel: false },
];
export function categoriasDoROT(rot: { dados_pessoais: string[]; dados_sensiveis: string[] } | undefined): CategoriaANPD[] {
  if (!rot) return [];
  const limpar = (valores: string[]) => valores.filter(v => v.trim() && v.trim() !== 'N/A');
  const comuns = limpar(rot.dados_pessoais), especiais = limpar(rot.dados_sensiveis);
  const valores = [...new Set([...comuns, ...especiais])];
  return valores.length ? valores.map(valor => ({ valor, sensivel: especiais.includes(valor), fonte_normativa: especiais.includes(valor) ? sensivel : pessoal })) : CATEGORIAS_PADRAO;
}
export function vincularCategorias(valores: string[], opcoes: CategoriaANPD[]): CategoriaANPD[] {
  return opcoes.filter(c => valores.includes(c.valor));
}
export function linhasCategorias(comunicacao: unknown): string[] {
  if (!comunicacao || typeof comunicacao !== 'object' || Array.isArray(comunicacao)) return [];
  const c = comunicacao as Record<string, unknown>;
  if (!Array.isArray(c['categorias_vinculadas'])) return Array.isArray(c['categorias']) && c['categorias'].length ? [`Categorias de dados pessoais: ${c['categorias'].join('; ')}`] : [];
  return c['categorias_vinculadas'].flatMap(item => item && typeof item === 'object' && typeof item.valor === 'string' && typeof item.fonte_normativa === 'string' ? [`Categoria: ${item.valor} (${item.fonte_normativa})`] : []);
}