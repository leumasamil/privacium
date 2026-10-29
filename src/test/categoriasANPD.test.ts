import { describe, expect, it } from 'vitest';
import { CATEGORIAS_PADRAO, categoriasDoROT, vincularCategorias, linhasCategorias } from '@/lib/priva/categoriasANPD';
import { prepararComunicacaoANPD, progressoANPD, validarANPD } from '@/lib/priva/anpd';
describe('Parte 4 ANPD', () => {
  it('catálogo contém 14 categorias, oito do art. 5º II e menores com art. 14', () => {
    expect(CATEGORIAS_PADRAO).toHaveLength(14);
    expect(CATEGORIAS_PADRAO.filter(c => c.sensivel)).toHaveLength(8);
    expect(CATEGORIAS_PADRAO.find(c => c.valor === 'Dados de menores de idade')?.fonte_normativa).toBe('LGPD art. 5º, I / art. 14');
  });
  it('usa catálogo somente nos campos vazios de processo vinculado', () => {
    expect(categoriasDoROT(undefined)).toEqual([]);
    expect(categoriasDoROT({ dados_pessoais: ['N/A', ''], dados_sensiveis: [] })).toEqual(CATEGORIAS_PADRAO);
    expect(categoriasDoROT({ dados_pessoais: ['Nome'], dados_sensiveis: ['Saúde'] })).toEqual([{ valor: 'Nome', fonte_normativa: 'LGPD art. 5º, I', sensivel: false }, { valor: 'Saúde', fonte_normativa: 'LGPD art. 5º, II', sensivel: true }]);
  });
  it('não vincula texto livre nem categorias de outro ROT', () => expect(vincularCategorias(['Livre', 'CPF'], categoriasDoROT({ dados_pessoais: ['Nome'], dados_sensiveis: [] }))).toEqual([]));
  const valido = { natureza: 'Ransomware com criptografia de ativos', categorias: ['Nome'], titulares: '1', riscos: 'R'.repeat(30), medidas: 'M'.repeat(30) };
  it('progresso conta seis campos, independente das etapas', () => {
    expect(progressoANPD(valido, 'dpo@exemplo.org')).toEqual({ preenchidos: 6, total: 6 });
    expect(progressoANPD({ ...valido, categorias: [], titulares: '' }, 'dpo@exemplo.org')).toEqual({ preenchidos: 4, total: 6 });
  });
  it('bloqueia etapa concluída sem responsável registrado', () => {
    expect(validarANPD(valido, 'dpo@exemplo.org', [true,true,true,true,true], [{ numero: 3, nome: 'Sandbox', concluida: true, data: '2026-10-29', responsavel: null }])).toContainEqual({ campo: 'etapa-2', titulo: 'Etapa 3', mensagem: 'Etapa 03 (Sandbox) sem responsável registrado' });
  });
  it('bloqueia etapa concluída sem data registrada', () => expect(validarANPD(valido, 'dpo@exemplo.org', [true,true,true,true,true], [{ numero: 3, nome: 'Sandbox', concluida: true, data: null, responsavel: 'uuid' }]).map(m => m.campo)).toContain('etapa-2'));
  it('persiste par e eleva criticidade com dado pessoal sensível', () => {
    const c = prepararComunicacaoANPD({ ...valido, categorias: ['Saúde'], categoriasVinculadas: categoriasDoROT({ dados_pessoais: [], dados_sensiveis: ['Saúde'] }) });
    expect(c.categorias_vinculadas).toEqual([{ valor: 'Saúde', fonte_normativa: 'LGPD art. 5º, II' }]);
    expect(c.criticidade_comunicacao).toBe('ELEVADA');
    expect(linhasCategorias(c)).toEqual(['Categoria: Saúde (LGPD art. 5º, II)']);
    expect(linhasCategorias({ categorias: ['Nome'] })).toEqual(['Categorias de dados pessoais: Nome']);
  });
});