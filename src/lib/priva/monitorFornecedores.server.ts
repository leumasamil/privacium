import { comCache } from './referenciasExternas.server';
import { CACHE_CASOS_MS } from './referenciasExternas';
import type { VazamentoFornecedor } from './monitorFornecedores';
export async function carregarVazamentosFornecedores() {
  return comCache('hibp:fornecedores:v1', CACHE_CASOS_MS, async () => {
    const r = await fetch('https://haveibeenpwned.com/api/v3/breaches', { headers: { 'user-agent': 'Privacium/1.0 (+https://privacium.com.br)', accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error('Fonte pública indisponível');
    const data = await r.json() as VazamentoFornecedor[];
    if (!Array.isArray(data)) throw new Error('Fonte inválida');
    return { itens: data.map(b => ({ Name: b.Name, Title: b.Title, Domain: b.Domain, BreachDate: b.BreachDate, PwnCount: b.PwnCount, DataClasses: b.DataClasses })), consultadoEm: new Date().toISOString() };
  });
}