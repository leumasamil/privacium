import { describe, it, expect } from 'vitest';
import { GRUPOS_MEDIDAS, MEDIDAS, sugerirMedidas, textoMedidas, linhasMedidas } from '@/lib/priva/medidasIncidente';
import { prepararComunicacaoANPD, validarANPD } from '@/lib/priva/anpd';
describe('Medidas ANPD Parte 3', () => {
  it('contém 24 medidas únicas em cinco domínios com fonte por item', () => {
    expect(GRUPOS_MEDIDAS.map(g => g.itens.length)).toEqual([4, 5, 4, 6, 5]);
    expect(new Set(MEDIDAS.map(m => m.valor)).size).toBe(24);
    expect(MEDIDAS.every(m => m.fonte_normativa.length > 0 && m.descricao.length > 0)).toBe(true);
  });
  const casos: [number, string[]][] = [
    [1, ['Isolamento dos endpoints afetados da rede']],
    [2, ['Acionamento da Célula de Resposta']],
    [3, ['Preservação de evidências forenses (ISO/IEC 27037)', 'Análise em ambiente isolado (sandbox)']],
    [4, ['Restauração a partir de backup íntegro']],
    [5, ['Validação de hash dos dados restaurados']],
  ];
  for (const [numero, medidas] of casos) it(`sugere somente as medidas da etapa ${numero} concluída`, () => {
    expect(sugerirMedidas([{ numero, concluida: true }])).toEqual(medidas);
    expect(sugerirMedidas([{ numero, concluida: false }])).toEqual([]);
  });
  it('não presume comunicação à ANPD a partir da etapa 6', () => expect(sugerirMedidas([{ numero: 6, concluida: true }])).toEqual([]));
  it('gera frase separada por ponto e vírgula e inclui complemento opcional', () => {
    expect(textoMedidas(['Isolamento dos endpoints afetados da rede', 'Restauração a partir de backup íntegro'], 'Verificação adicional.')).toBe('Isolamento dos endpoints afetados da rede; Restauração a partir de backup íntegro; Verificação adicional. Fontes: CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação); CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação).');
    expect(textoMedidas([])).toBe('');
  });
  it('salva somente decisão final com fonte e ignora texto adulterado', () => {
    const enviado = prepararComunicacaoANPD({ natureza: 'Ransomware com criptografia de ativos', categorias: ['Nome'], titulares: '1', riscos: 'R'.repeat(30), medidas: 'adulterado', medidasSelecionadas: ['Implementação de MFA'], outrasMedidas: '' });
    expect(enviado.medidas_selecionadas).toEqual([{ valor: 'Implementação de MFA', fonte_normativa: 'CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação)' }]);
    expect(enviado.medidas).toBe('Implementação de MFA. Fontes: CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação).');
    expect(enviado.medidas_selecionadas?.some(m => m?.valor === 'Isolamento dos endpoints afetados da rede')).toBe(false);
  });
  it('mantém limite 30 para texto composto e rejeita medidas fora do catálogo', () => {
    const f = { natureza: 'Ransomware com criptografia de ativos', categorias: ['Nome'], titulares: '1', riscos: 'R'.repeat(30), medidas: 'M'.repeat(100), medidasSelecionadas: [], outrasMedidas: 'A'.repeat(28) };
    expect(validarANPD(f, 'contato@exemplo.org', Array(5).fill(true)).map(m => m.campo)).toContain('medidas');
    expect(validarANPD({ ...f, outrasMedidas: 'A'.repeat(29) }, 'contato@exemplo.org', Array(5).fill(true)).map(m => m.campo)).toContain('medidas');
    expect(validarANPD({ ...f, medidasSelecionadas: ['Inválida'] }, 'contato@exemplo.org', Array(5).fill(true)).map(m => m.campo)).toContain('medidas');
  });
  it('exporta fontes persistidas e não inventa fontes em registros antigos', () => {
    expect(linhasMedidas({ medidas: 'Texto anterior' })).toEqual(['Medidas: Texto anterior']);
    const c = prepararComunicacaoANPD({ natureza: 'Ransomware com criptografia de ativos', categorias: [], titulares: '', riscos: '', medidas: '', medidasSelecionadas: ['Isolamento dos endpoints afetados da rede'] });
    expect(linhasMedidas(c)).toContain('Fonte das medidas: CIS Controls v8 / ISO/IEC 27002:2022 (controles em verificação)');
  });
});