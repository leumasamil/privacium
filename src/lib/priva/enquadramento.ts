import { z } from 'zod';
export const FUNDAMENTO_PORTE = 'Res. CD/ANPD nº 2/2022, arts. 2º e 3º (critérios de enquadramento)';
export const criteriosSchema = z.object({
  grupoGrande: z.boolean(), receitaAcimaTeto: z.boolean(), tipo: z.enum(['ME', 'EPP', 'LTDA', 'SA', 'ASSOCIACAO', 'OUTRO']),
  titulares: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), infraLimitada: z.boolean(), descricaoInfra: z.string().trim().max(2000),
  sensivelLargaEscala: z.boolean(), altoRisco: z.boolean(), menoresAltoRisco: z.boolean(),
}).refine(c => !c.infraLimitada || c.descricaoInfra.length >= 10, 'Descreva a infraestrutura limitada (mínimo 10 caracteres).');
export type CriteriosPorte = z.infer<typeof criteriosSchema>;
export type Porte = 'PEQUENO' | 'COMPLETO';
export function calcularPorte(c: CriteriosPorte): Porte {
  criteriosSchema.parse(c);
  return c.grupoGrande || c.receitaAcimaTeto || c.sensivelLargaEscala || c.altoRisco || c.menoresAltoRisco || c.tipo === 'SA' || c.titulares > 10000 ? 'COMPLETO' : 'PEQUENO';
}
export function travaPorte(c: CriteriosPorte, gatilho: boolean) {
  return calcularPorte(c) === 'PEQUENO' && gatilho ? 'Os dados declarados não sustentam o enquadramento como agente de pequeno porte. Gatilho de migração ativo: S.A. ou > 10 mil titulares/mês (gatilho registrado no método).' : null;
}
export const prazoPorPorte = (p: Porte | null | undefined): 3 | 6 => p === 'PEQUENO' ? 6 : 3;
export const citacaoSimplificada = (p: Porte | null | undefined): string[] => p === 'PEQUENO' ? ['Res. CD/ANPD nº 2/2022, art. 9º (registro simplificado — agentes de tratamento de pequeno porte)'] : [];
export const rotuloPorte = (p: Porte) => p === 'PEQUENO' ? 'Agente de pequeno porte — Res. 2/2022' : 'Agente de médio/grande porte — regime completo';