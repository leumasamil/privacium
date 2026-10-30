import { vetorDaNatureza, type VetorANPD } from './vetoresANPD';
export const VERSAO_RISCOS = '2026-10-29.1';
const risco = (grupo: string, valor: string, descricao: string, fonte_normativa: string, vetores: VetorANPD[], condicao?: 'sensivel' | 'menores') => ({ grupo, valor, descricao, fonte_normativa, vetores, condicao });
export const RISCOS_ANPD = [
  risco('Impacto direto ao titular', 'Fraude por uso indevido de identidade', 'Possibilidade de abertura de crédito ou movimentação financeira em nome do titular.', 'LGPD art. 5º, I / NIST SP 800-61r3', ['ransomware', 'acesso', 'vazamento', 'vulnerabilidade']),
  risco('Impacto direto ao titular', 'Danos financeiros diretos', 'Uso fraudulento de dados bancários e de cartão.', 'LGPD art. 5º, I / Res. CMN nº 4.658/2018 (referência histórica)', ['acesso', 'vazamento']),
  risco('Impacto direto ao titular', 'Phishing e engenharia social direcionados', 'Comunicações fraudulentas personalizadas com os dados do titular.', 'LGPD art. 5º, I / NIST SP 800-61r3', ['ransomware', 'acesso', 'vazamento']),
  risco('Impacto direto ao titular', 'Discriminação e tratamento desigual', 'Uso indevido de dado pessoal sensível com tratamento discriminatório.', 'LGPD art. 5º, II e art. 6º, IX', ['vazamento'], 'sensivel'),
  risco('Impacto direto ao titular', 'Exposição de dado pessoal sensível', 'Divulgação de dado pessoal de saúde, biométrico, genético, origem racial ou étnica, convicção religiosa, opinião política, filiação sindical ou vida sexual.', 'LGPD art. 5º, II', ['vazamento', 'acesso'], 'sensivel'),
  risco('Impacto direto ao titular', 'Constrangimento ou dano à imagem', 'Exposição pública que afete reputação ou privacidade.', 'LGPD art. 5º, I e art. 6º, IX', ['vazamento']),
  risco('Impacto direto ao titular', 'Comprometimento de conta com histórico', 'Acesso à conta do titular com histórico de dados.', 'LGPD art. 5º, I / NIST SP 800-61r3', ['acesso']),
  risco('Impacto à disponibilidade e integridade', 'Indisponibilidade de serviços essenciais', 'Interrupção de serviço usado pelo titular.', 'LGPD art. 6º, VII', ['disponibilidade', 'ransomware']),
  risco('Impacto à disponibilidade e integridade', 'Perda ou alteração indevida de dados', 'Corrupção, exclusão ou modificação não autorizada.', 'LGPD art. 6º, VII / Res. CD/ANPD nº 15/2024', ['ransomware', 'disponibilidade', 'vulnerabilidade']),
  risco('Impacto à disponibilidade e integridade', 'Extorsão para recuperação de dados', 'Tomada de refém dos dados para exigência de pagamento.', 'LGPD art. 6º / NIST SP 800-61r3', ['ransomware']),
  risco('Agravante', 'Risco a menores de idade', 'Exposição ou tratamento de dados de menores sem hipótese de tratamento adequada.', 'LGPD art. 14 e art. 6º, IX', ['ransomware', 'acesso', 'vazamento', 'disponibilidade', 'vulnerabilidade', 'outros'], 'menores'),
];
export function vincularRisco(valor: string) { const r = RISCOS_ANPD.find(r => r.valor === valor); return r ? { valor: r.valor, fonte_normativa: r.fonte_normativa } : null; }
export function sugerirRiscos(natureza: string, sensivel: boolean, menores: boolean) {
  return RISCOS_ANPD.filter(r => r.vetores.includes(vetorDaNatureza(natureza)) && (r.condicao !== 'sensivel' || sensivel) && (r.condicao !== 'menores' || menores)).map(r => r.valor);
}
export function textoRiscos(valores: string[], detalhes: string) {
  const itens = RISCOS_ANPD.filter(r => valores.includes(r.valor));
  return [itens.map(r => `${r.valor}: ${r.descricao}`).join('; '), detalhes.trim() ? `Detalhes específicos: ${detalhes.trim()}` : '', itens.length ? `Fontes: ${[...new Set(itens.map(r => r.fonte_normativa))].join('; ')}.` : ''].filter(Boolean).join('\n');
}
export function linhasRiscos(comunicacao: unknown): string[] {
  if (!comunicacao || typeof comunicacao !== 'object' || Array.isArray(comunicacao)) return [];
  const c = comunicacao as Record<string, unknown>;
  if (!Array.isArray(c['riscos_selecionados'])) return typeof c['riscos'] === 'string' && c['riscos'] ? [`Riscos: ${c['riscos']}`] : [];
  return [...c['riscos_selecionados'].flatMap(r => r && typeof r === 'object' && typeof r.valor === 'string' ? [`Risco: ${r.valor} (${r.fonte_normativa ?? 'Fonte não registrada'})`] : []), ...(typeof c['riscos_detalhes'] === 'string' ? [`Detalhes específicos: ${c['riscos_detalhes']}`] : [])];
}