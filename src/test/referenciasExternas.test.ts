import { describe, expect, it, vi, afterEach } from 'vitest';
import { CACHE_CASOS_MS, CACHE_NOTICIAS_MS, casosSemelhantes, cincoNoticias, type CasoPublico } from '@/lib/priva/referenciasExternas';
import { comCache, lerFeed } from '@/lib/priva/referenciasExternas.server';
import { readFileSync } from 'node:fs';

afterEach(() => vi.useRealTimers());
describe('Referências externas isoladas', () => {
  it('limita sugestões a três casos realmente semelhantes', () => {
    const casos: CasoPublico[] = Array.from({ length: 6 }, (_, i) => ({ nome: `Serviço ${i}`, data: '2026-10-29', contas: 1000, categorias: ['Email addresses'], descricao: 'ransomware', url: `https://example.org/${i}` }));
    expect(casosSemelhantes(casos, 'Ransomware', ['E-mail'])).toHaveLength(3);
    expect(casosSemelhantes(casos, 'Ataque físico', ['Biometria'])).toHaveLength(0);
  });
  it('seleciona exatamente cinco notícias únicas em ordem decrescente', () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ titulo: 'N'.repeat(120), veiculo: 'Fonte', data: `2026-10-${20 + i}T12:00:00Z`, url: `https://example.org/${i}` }));
    const primeiro = items[0];
    if (!primeiro) throw new Error('Fixture ausente');
    const resultado = cincoNoticias([...items, primeiro, { ...primeiro, url: 'javascript:alert(1)' }]);
    expect(resultado).toHaveLength(5);
    expect(resultado[0]?.data).toBe('2026-10-26T12:00:00Z');
    expect(resultado.every(n => n.titulo.length <= 90)).toBe(true);
  });
  it('cacheia HIBP por 24 horas', async () => {
    expect(CACHE_CASOS_MS).toBe(86400000);
    vi.useFakeTimers();
    const obter = vi.fn(async () => ['caso']);
    await comCache('teste:casos', CACHE_CASOS_MS, obter);
    vi.advanceTimersByTime(86399999);
    await comCache('teste:casos', CACHE_CASOS_MS, obter);
    expect(obter).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await comCache('teste:casos', CACHE_CASOS_MS, obter);
    expect(obter).toHaveBeenCalledTimes(2);
  });
  it('isola cache por CNPJ por 30 minutos e não mascara falha como sucesso', async () => {
    expect(CACHE_NOTICIAS_MS).toBe(1800000);
    vi.useFakeTimers();
    const obter = vi.fn(async () => ['noticia']);
    await comCache('teste:noticias:empresa-a', CACHE_NOTICIAS_MS, obter);
    await comCache('teste:noticias:empresa-b', CACHE_NOTICIAS_MS, obter);
    expect(obter).toHaveBeenCalledTimes(2);
    await comCache('teste:noticias:empresa-a', CACHE_NOTICIAS_MS, obter);
    expect(obter).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1800000);
    await comCache('teste:noticias:empresa-a', CACHE_NOTICIAS_MS, obter);
    expect(obter).toHaveBeenCalledTimes(3);
    const falha = vi.fn(async () => { throw new Error('offline'); });
    await expect(comCache('teste:falha', CACHE_NOTICIAS_MS, falha)).rejects.toThrow('offline');
    await expect(comCache('teste:falha', CACHE_NOTICIAS_MS, falha)).rejects.toThrow('offline');
    expect(falha).toHaveBeenCalledTimes(2);
  });
  it('lê RSS público sem executar HTML', () => {
    const result = lerFeed('<rss><channel><item><title>Incidente público</title><link>https://example.org/fonte</link><pubDate>Thu, 29 Oct 2026 17:00:00 GMT</pubDate><source>Veículo</source></item></channel></rss>', 'CERT.br');
    expect(result[0]?.url).toBe('https://example.org/fonte');
    expect(result[0]?.data).toBe('2026-10-29T17:00:00.000Z');
    expect(result[0]?.veiculo).toBe('Veículo');
  });
  it('não conecta referências a auditoria, documentos, assinaturas ou progresso', () => {
    const raiz = process.cwd();
    const contexto = ['src/lib/priva/referenciasExternas.server.ts', 'src/lib/priva/referenciasExternas.functions.ts', 'src/components/priva/ReferenciasExternas.tsx', 'src/components/priva/PainelNoticiasIncidentes.tsx'].map(p => readFileSync(`${raiz}/${p}`, 'utf8')).join('\n');
    // Map.delete limpa requisições em memória, não é escrita no banco.
    expect(contexto).not.toMatch(/\.(insert|update|upsert|rpc)\s*\(/);
    expect(contexto).not.toMatch(/\.from\([^\n]+\.delete\s*\(/);
    expect(contexto).not.toMatch(/\blog\s*\(|gerarPdfPI\s*\(|\.sign\s*\(/);
    for (const p of ['src/lib/priva/pdf.ts', 'src/lib/priva/pendencias.ts', 'src/lib/priva/proximoPasso.ts', 'src/lib/priva/store.tsx', 'src/components/priva/ui.tsx']) {
      expect(readFileSync(`${raiz}/${p}`, 'utf8')).not.toMatch(/import.*(?:referenciasExternas|ReferenciasExternas|PainelNoticiasIncidentes)/);
    }
  });
});