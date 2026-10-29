export type MedidaVinculada = { valor: string; fonte_normativa: string };
const grupo = (titulo: string, fonte_normativa: string, itens: [string, string][]) => ({ titulo, fonte_normativa, itens: itens.map(([valor, descricao]) => ({ valor, descricao, fonte_normativa })) });
export const GRUPOS_MEDIDAS = [
  grupo('Contenção', 'CIS Control 04 / ISO/IEC 27002:2022 — 8.5 e 8.7', [
    ['Isolamento dos endpoints afetados da rede', 'Desconectar os equipamentos afetados para conter a propagação.'],
    ['Bloqueio de indicadores de comprometimento no firewall', 'Bloquear endereços, domínios e outros indicadores identificados.'],
    ['Revogação de credenciais e sessões ativas', 'Invalidar credenciais comprometidas e encerrar sessões.'],
    ['Desativação temporária de serviço comprometido', 'Suspender o serviço afetado durante a contenção.'],
  ]),
  grupo('Erradicação e recuperação', 'CIS Control 11 / ISO/IEC 27002 — 8.13', [
    ['Restauração a partir de backup íntegro', 'Recuperar os dados de uma cópia íntegra e confiável.'],
    ['Validação de hash dos dados restaurados', 'Comparar hashes para verificar a integridade da restauração.'],
    ['Reinstalação de sistemas afetados', 'Reinstalar os sistemas a partir de fontes confiáveis.'],
    ['Uso de ferramenta de descriptografia validada', 'Utilizar ferramenta previamente validada para recuperação.'],
    ['Aplicação de patch de correção', 'Aplicar a atualização que corrige a vulnerabilidade identificada.'],
  ]),
  grupo('Monitoramento e detecção', 'CIS Control 08 / ISO/IEC 27002 — 8.15 e 8.16', [
    ['Preservação de evidências forenses (ISO/IEC 27037)', 'Preservar evidências e sua cadeia de custódia conforme ISO/IEC 27037.'],
    ['Análise em ambiente isolado (sandbox)', 'Analisar amostras sem expor o ambiente de produção.'],
    ['Ativação de monitoramento reforçado', 'Ampliar alertas e acompanhamento dos ativos afetados.'],
    ['Revisão de logs de acesso do período', 'Examinar registros de acesso no intervalo do incidente.'],
  ]),
  grupo('Governança e resposta', 'ISO/IEC 27002 — 5.24 a 5.28 / Res. CD/ANPD nº 15/2024', [
    ['Acionamento da Célula de Resposta', 'Mobilizar DPO, TI, Jurídico e Diretoria para a resposta.'],
    ['Comunicação à Diretoria', 'Informar a Diretoria sobre impactos e ações de resposta.'],
    ['Registro do incidente na trilha de auditoria', 'Registrar os atos de resposta na trilha forense.'],
    ['Notificação aos titulares afetados', 'Comunicar os titulares afetados quando aplicável.'],
    ['Comunicação à ANPD', 'Registrar a comunicação à autoridade quando aplicável.'],
    ['Acionamento do fornecedor ou seguradora', 'Acionar os responsáveis contratuais pelo apoio à resposta.'],
  ]),
  grupo('Medidas preventivas posteriores', 'CIS Controls v8 / ISO/IEC 27002 — 5.15 e 8.2', [
    ['Implementação de MFA', 'Exigir autenticação com múltiplos fatores.'],
    ['Revisão de permissões e RLS', 'Reavaliar privilégios e isolamento de acesso por empresa.'],
    ['Treinamento da equipe', 'Capacitar a equipe sobre prevenção e resposta a incidentes.'],
    ['Revisão de contratos com fornecedores', 'Revisar obrigações de segurança e comunicação dos fornecedores.'],
    ['Teste de restauração de backup', 'Testar a recuperação e verificar os resultados.'],
  ]),
];
export const MEDIDAS = GRUPOS_MEDIDAS.flatMap(g => g.itens);
export const VERSAO_MEDIDAS = '2026-10-29.1';
export function vincularMedida(valor: string): MedidaVinculada | null {
  const medida = MEDIDAS.find(m => m.valor === valor);
  return medida ? { valor, fonte_normativa: medida.fonte_normativa } : null;
}
export function sugerirMedidas(etapas: { numero: number; concluida: boolean }[]): string[] {
  const mapa: Record<number, string[]> = {
    1: [MEDIDAS[0]?.valor ?? ''], 2: ['Acionamento da Célula de Resposta'],
    3: ['Análise em ambiente isolado (sandbox)', 'Preservação de evidências forenses (ISO/IEC 27037)'],
    4: ['Restauração a partir de backup íntegro'], 5: ['Validação de hash dos dados restaurados'],
  };
  return MEDIDAS.filter(m => etapas.some(e => e.concluida && mapa[e.numero]?.includes(m.valor))).map(m => m.valor);
}
export function textoMedidas(valores: string[], outras = ''): string {
  const partes = MEDIDAS.filter(m => valores.includes(m.valor)).map(m => m.valor);
  if (outras.trim()) partes.push(outras.trim().replace(/[.;]+$/, ''));
  return partes.length ? partes.join('; ') + '.' : '';
}
export function linhasMedidas(comunicacao: unknown): string[] {
  if (!comunicacao || typeof comunicacao !== 'object' || Array.isArray(comunicacao)) return [];
  const c = comunicacao as Record<string, unknown>;
  const texto = typeof c['medidas'] === 'string' ? c['medidas'] : '';
  if (!texto) return [];
  if (!Array.isArray(c['medidas_selecionadas'])) return [`Medidas: ${texto}`];
  const fontes = [...new Set(c['medidas_selecionadas'].flatMap(m => m && typeof m === 'object' && typeof m.fonte_normativa === 'string' ? [m.fonte_normativa] : []))];
  return [`Medidas: ${texto}${fontes.length ? ' (CIS Controls v8 / ISO/IEC 27002:2022)' : ''}`, ...fontes.map(f => `Fonte das medidas: ${f}`)];
}