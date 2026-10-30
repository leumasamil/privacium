import { describe, it, expect } from 'vitest';
import { carregarEstadoIncidente, type FonteIncidente } from '@/lib/priva/estadoIncidente';
import { montarChecklist } from '@/lib/priva/pendencias';
import { calcularProximoPasso } from '@/lib/priva/proximoPasso';
const fonte = (): FonteIncidente => ({ incidentes: [{ id: 'a54ac7', passos: [true,true,true,true,true,true], iniciado_em: '2026-10-29T12:00:00Z', enviado_anpd_em: null, encerrado_em: null }], lotes: [{ mes_referencia: '2026-10', hash_sha256: 'hash' }], assinaturas: {}, agora: Date.parse('2026-10-29T15:00:00Z') });
describe('fonte única do incidente', () => {
  it('seis booleanos sem envio são cinco etapas e não autorizam encerramento', () => {
    const f = fonte();
    const e = carregarEstadoIncidente('a54ac7', f);
    expect(e.etapas.concluidas).toBe(5);
    expect(e.anpd.enviado).toBe(false);
    expect(e.podeEncerrar).toBe(false);
    const c = montarChecklist({ n: 4, ...f }, {});
    expect(c.find(i => i.id === 'inc-a54ac7')?.estado).toBe('andamento');
    expect(c.find(i => i.id === 'anpd-a54ac7')?.estado).toBe('pendente');
    expect(calcularProximoPasso({ blocoTela:4, blocoBase:4, itens:c, roles:['DPO_OPERACIONAL'] }).pendencia?.id).toBe('inc-a54ac7');
  });
  it('envio com seis evidências libera encerramento antes das assinaturas PI04', () => {
    const f = fonte(); const i = f.incidentes[0]; if (!i) throw new Error('fixture');
    i.enviado_anpd_em = '2026-10-29T14:00:00Z';
    i.etapas_registro = Object.fromEntries(Array.from({ length:6 }, (_, j) => [String(j+1), { data: '2026-10-29T14:00:00Z', responsavel:'usuario' }]));
    const e = carregarEstadoIncidente(i.id, f);
    expect(e.etapas.concluidas).toBe(6);
    expect(e.podeEncerrar).toBe(true);
    expect(e.assinaturas.dpo).toBe(false);
    const c = montarChecklist({ n:4, ...f }, {});
    expect(c.find(p => p.id === 'inc-a54ac7')?.estado).toBe('ok');
    expect(c.find(p => p.id === 'anpd-a54ac7')?.estado).toBe('ok');
    expect(c.find(p => p.id === 'encerrar-a54ac7')?.estado).toBe('andamento');
  });
  it('etapa sem responsável bloqueia encerramento mesmo após envio', () => {
    const f = fonte(); const i = f.incidentes[0]; if (!i) throw new Error('fixture');
    i.enviado_anpd_em = '2026-10-29T14:00:00Z';
    expect(carregarEstadoIncidente(i.id,f).podeEncerrar).toBe(false);
    expect(carregarEstadoIncidente(i.id,f).correcoes.some(c => c.ancora === 'incidente-etapa-5')).toBe(true);
  });
  it('prazo de 3 dias úteis congela no envio', () => {
    const f = fonte(); const i = f.incidentes[0]; if (!i) throw new Error('fixture');
    i.enviado_anpd_em = '2026-10-30T12:00:00Z'; f.agora = Date.parse('2026-11-10T12:00:00Z');
    expect(carregarEstadoIncidente(i.id,f).anpd.prazo_vencido).toBe(false);
  });
});
