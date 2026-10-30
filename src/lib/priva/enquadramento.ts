import { z } from 'zod';
export const FUNDAMENTO_PORTE = 'Res. CD/ANPD nº 2/2022, arts. 2º e 3º (critérios de enquadramento)';
export const criteriosSchema = z.object({
  grupoGrande: z.boolean(), receitaAcimaTeto: z.boolean(), tipo: z.enum(['ME', 'EPP', 'LTDA', 'SA', 'ASSOCIACAO', 'OUTRO']),
  titulares: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), infraLimitada: z.boolean(), descricaoInfra: z.string().trim().max(2000),
  sensivelLargaEscala: z.boolean(), altoRisco: z.boolean(), menoresAltoRisco: z.boolean(),
  papelAgente: z.enum(['CONTROLADOR', 'OPERADOR', 'CONTROLADOR_OPERADOR']).default('CONTROLADOR'),
}).refine(c => !c.infraLimitada || c.descricaoInfra.length >= 10, 'Descreva a infraestrutura limitada (mínimo 10 caracteres).');
export type CriteriosPorte = z.infer<typeof criteriosSchema>;
export type Porte = 'PEQUENO' | 'COMPLETO';
export function calcularPorte(c: CriteriosPorte): Porte {
  criteriosSchema.parse(c);
  return c.grupoGrande || c.receitaAcimaTeto || c.sensivelLargaEscala || c.altoRisco || c.menoresAltoRisco || c.tipo === 'SA' || c.titulares > 10000 ? 'COMPLETO' : 'PEQUENO';
}
/** Motivos do Gatilho Crítico de Migração: S.A., > 10 mil titulares/mês ou gatilho ativado pela empresa. */
export function motivosGatilho(c: Pick<CriteriosPorte, 'tipo' | 'titulares'>, gatilhoEmpresa: boolean): string[] {
  const m: string[] = [];
  if (c.tipo === 'SA') m.push('sociedade anônima (S.A.)');
  if (c.titulares > 10000) m.push(`mais de 10 mil titulares/mês (${c.titulares.toLocaleString('pt-BR')} declarados)`);
  if (gatilhoEmpresa) m.push('Gatilho Crítico de Migração ativado para a empresa');
  return m;
}
/** Trava: com gatilho ativo, o pequeno porte nunca é exibido nem assinado. */
export function travaPorte(c: CriteriosPorte, gatilho: boolean) {
  const m = motivosGatilho(c, gatilho);
  return m.length ? `Os dados declarados não sustentam o enquadramento como agente de pequeno porte. Gatilho de migração ativo: ${m.join('; ')}.` : null;
}
/** Critérios cenográficos coerentes com cada cenário da demonstração. */
export const CRITERIOS_DEMO: Record<Porte, CriteriosPorte> = {
  COMPLETO: { grupoGrande: false, receitaAcimaTeto: false, tipo: 'SA', titulares: 25000, infraLimitada: false, descricaoInfra: '', sensivelLargaEscala: false, altoRisco: false, menoresAltoRisco: false, papelAgente: 'CONTROLADOR' },
  PEQUENO: { grupoGrande: false, receitaAcimaTeto: false, tipo: 'ME', titulares: 800, infraLimitada: false, descricaoInfra: '', sensivelLargaEscala: false, altoRisco: false, menoresAltoRisco: false, papelAgente: 'CONTROLADOR' },
};
export const razaoDemo = (p: Porte) => p === 'PEQUENO' ? 'Empresa Cenográfica ME' : 'Empresa Cenográfica S.A.';
export const prazoPorPorte = (p: Porte | null | undefined): 3 | 6 => p === 'PEQUENO' ? 6 : 3;
export const citacaoSimplificada = (p: Porte | null | undefined): string[] => p === 'PEQUENO' ? ['Res. CD/ANPD nº 2/2022, art. 9º (registro simplificado — agentes de tratamento de pequeno porte)'] : [];
export const rotuloPorte = (p: Porte) => p === 'PEQUENO' ? 'Agente de pequeno porte — Res. 2/2022' : 'Agente de médio/grande porte — regime completo';