import { GRUPOS_NATUREZAS } from './naturezasIncidente';
export type VetorANPD = 'ransomware' | 'acesso' | 'vazamento' | 'disponibilidade' | 'vulnerabilidade' | 'outros';
export const VETORES: VetorANPD[] = ['ransomware', 'acesso', 'vazamento', 'disponibilidade', 'vulnerabilidade', 'outros'];
export function vetorDaNatureza(natureza: string): VetorANPD {
  const indice = GRUPOS_NATUREZAS.findIndex(g => g.itens.some(i => i.valor === natureza));
  return VETORES[indice] ?? 'outros';
}
export const ROTULOS_VETORES: Record<VetorANPD, string> = { ransomware: 'Ransomware', acesso: 'Acesso indevido', vazamento: 'Exposição', disponibilidade: 'Indisponibilidade', vulnerabilidade: 'Vulnerabilidade', outros: 'Outros' };
const MEDIDAS_VETOR: Record<VetorANPD, string[]> = {
  ransomware: ['Isolamento dos endpoints afetados da rede', 'Revogação de credenciais e sessões ativas', 'Restauração a partir de backup íntegro', 'Validação de hash dos dados restaurados', 'Preservação de evidências forenses (ISO/IEC 27037)', 'Acionamento da Célula de Resposta', 'Registro do incidente na trilha de auditoria', 'Comunicação à ANPD'],
  acesso: ['Revogação de credenciais e sessões ativas', 'Revisão de logs de acesso do período', 'Implementação de MFA', 'Revisão de permissões e RLS', 'Notificação aos titulares afetados'],
  vazamento: ['Desativação temporária de serviço comprometido', 'Preservação de evidências forenses (ISO/IEC 27037)', 'Revisão de permissões e RLS', 'Notificação aos titulares afetados', 'Comunicação à ANPD'],
  disponibilidade: ['Desativação temporária de serviço comprometido', 'Restauração a partir de backup íntegro', 'Ativação de monitoramento reforçado', 'Acionamento do fornecedor ou seguradora'],
  vulnerabilidade: ['Aplicação de patch de correção', 'Isolamento dos endpoints afetados da rede', 'Preservação de evidências forenses (ISO/IEC 27037)', 'Revisão de permissões e RLS'],
  outros: [],
};
export function medidasDoVetor(natureza: string) { return MEDIDAS_VETOR[vetorDaNatureza(natureza)]; }
export function melhorMedida(natureza: string) {
  const vetor = vetorDaNatureza(natureza);
  const itens: Partial<Record<VetorANPD, { valor: string; fonte_normativa: string }>> = {
    ransomware: { valor: 'Restauração a partir de backup íntegro com validação de hash', fonte_normativa: 'CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação)' },
    acesso: { valor: 'Revogação de credenciais e sessões ativas', fonte_normativa: 'CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação)' },
    vazamento: { valor: 'Contenção da exposição com desativação do acesso público', fonte_normativa: 'CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação)' },
    disponibilidade: { valor: 'Restauração a partir de backup íntegro', fonte_normativa: 'CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação)' },
    vulnerabilidade: { valor: 'Aplicação de patch de correção', fonte_normativa: 'CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação)' },
  };
  const item = itens[vetor]; return item ? { ...item, vetor: ROTULOS_VETORES[vetor] } : null;
}