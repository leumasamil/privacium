import { describe, expect, it } from 'vitest';
import { calcularPorte, citacaoSimplificada, criteriosSchema, prazoPorPorte, travaPorte, type CriteriosPorte } from '@/lib/priva/enquadramento';
import { limiteANPD, restanteANPD } from '@/lib/priva/anpd';
import { carregarEstadoIncidente } from '@/lib/priva/estadoIncidente';
const c: CriteriosPorte = { grupoGrande:false, receitaAcimaTeto:false, tipo:'ME', titulares:100, infraLimitada:false, descricaoInfra:'', sensivelLargaEscala:false, altoRisco:false, menoresAltoRisco:false };
describe('Enquadramento calculado', () => {
  it('ME sem exclusões é pequeno porte', () => expect(calcularPorte(c)).toBe('PEQUENO'));
  it.each(['grupoGrande','receitaAcimaTeto','sensivelLargaEscala','altoRisco','menoresAltoRisco'] as const)('%s afasta pequeno porte', k => expect(calcularPorte({...c,[k]:true})).toBe('COMPLETO'));
  it('S.A. exige regime completo pelo método', () => expect(calcularPorte({...c,tipo:'SA'})).toBe('COMPLETO'));
  it('mais de 10 mil titulares exige regime completo', () => { expect(calcularPorte({...c,titulares:10000})).toBe('PEQUENO'); expect(calcularPorte({...c,titulares:10001})).toBe('COMPLETO'); });
  it('gatilho ativo recusa declaração contraditória', () => { expect(travaPorte(c,true)).toContain('Os dados declarados não sustentam'); expect(travaPorte(c,false)).toBeNull(); expect(travaPorte({...c,tipo:'SA'},true)).toBeNull(); });
  it('infraestrutura limitada exige descrição', () => expect(criteriosSchema.safeParse({...c,infraLimitada:true}).success).toBe(false));
  it('registro simplificado só para pequeno porte', () => { expect(citacaoSimplificada('PEQUENO')).toHaveLength(1); expect(citacaoSimplificada('COMPLETO')).toEqual([]); expect(citacaoSimplificada(null)).toEqual([]); });
  it('prazo geral 3 e pequeno porte 6 dias úteis', () => { expect(prazoPorPorte('COMPLETO')).toBe(3); expect(prazoPorPorte('PEQUENO')).toBe(6); expect(prazoPorPorte(null)).toBe(3); });
  it('sexta-feira soma 3 ou 6 dias úteis sem contar fim de semana', () => { expect(limiteANPD('2026-10-30T12:00:00Z',3)).toBe(Date.parse('2026-11-04T12:00:00Z')); expect(limiteANPD('2026-10-30T12:00:00Z',6)).toBe(Date.parse('2026-11-09T12:00:00Z')); });
  it('contador de pequeno porte congela no envio', () => expect(restanteANPD('2026-10-30T12:00:00Z','2026-11-02T12:00:00Z',Date.parse('2026-12-01'),6)).toBe(120*3600000));
  it('envio preserva prazo de 6 apesar do reenquadramento', () => { const estado=carregarEstadoIncidente('i',{incidentes:[{id:'i',passos:[],iniciado_em:'2026-10-30T12:00:00Z',enviado_anpd_em:'2026-11-06T12:00:00Z',encerrado_em:null,prazo_dias_uteis:6}],lotes:[],assinaturas:{},agora:Date.parse('2026-12-01'),prazoDias:3}); expect(estado.anpd.prazoDias).toBe(6); expect(estado.anpd.prazo_vencido).toBe(false); });
});