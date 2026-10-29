import { XMLParser } from 'fast-xml-parser';
import { CACHE_CASOS_MS, CACHE_NOTICIAS_MS, cincoNoticias, type CasoPublico, type NoticiaPublica, type ReferenciasPublicas } from './referenciasExternas';

const USER_AGENT = 'Privacium/1.0 (+https://privacium.com.br)';
type CacheEntry = { expira: number; valor: unknown };
const memoria = new Map<string, CacheEntry>();
const emVoo = new Map<string, Promise<unknown>>();
type EdgeCache = { match: (r: Request) => Promise<Response | undefined>; put: (r: Request, v: Response) => Promise<void> };

/** Cache edge quando disponível; fallback limitado em memória no desenvolvimento.
 * Chaves de CNPJ são digeridas e internas. Nenhuma fonte externa recebe essa chave.
 * Não há escrita no banco, trilha, workspace, chancela ou documentos. */
export async function comCache<T>(chave: string, ttl: number, obter: () => Promise<T>): Promise<T> {
  const agora = Date.now();
  const local = memoria.get(chave);
  if (local && local.expira > agora) return local.valor as T;
  const pendente = emVoo.get(chave);
  if (pendente) return pendente as Promise<T>;
  const tarefa = (async () => {
    const edge = (globalThis as typeof globalThis & { caches?: { default?: EdgeCache } }).caches?.default;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chave));
    const id = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const request = new Request(`https://privacium.com.br/__informativo_cache_v1/${id}`);
    if (edge) {
      try { const hit = await edge.match(request); if (hit) return await hit.json() as T; } catch { /* Cache indisponível não bloqueia a consulta. */ }
    }
    const valor = await obter();
    if (memoria.size >= 100) memoria.clear();
    memoria.set(chave, { expira: agora + ttl, valor });
    if (edge) {
      try { await edge.put(request, new Response(JSON.stringify(valor), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${Math.floor(ttl / 1000)}` } })); } catch { /* Fallback em memória. */ }
    }
    return valor;
  })();
  emVoo.set(chave, tarefa);
  try { return await tarefa; } finally { emVoo.delete(chave); }
}

async function ler(url: string): Promise<Response> {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: 'application/json, application/rss+xml, application/atom+xml, application/xml' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Fonte pública indisponível');
  return response;
}

type Breach = { Name: string; Title: string; BreachDate: string; AddedDate: string; PwnCount: number; DataClasses: string[]; Description: string };
function caso(b: Breach): CasoPublico {
  return { nome: b.Title, data: b.BreachDate, contas: b.PwnCount, categorias: b.DataClasses, descricao: b.Description.replace(/<[^>]*>/g, ' '), url: `https://haveibeenpwned.com/PwnedWebsites#${encodeURIComponent(b.Name)}` };
}

export function lerFeed(xml: string, veiculo: string): NoticiaPublica[] {
  const doc = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(xml);
  const raw = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
  const items = Array.isArray(raw) ? raw : [raw];
  return items.map((i: Record<string, unknown>) => {
    const link = i['link'];
    const url = typeof link === 'string' ? link : String((Array.isArray(link) ? link[0] : link)?.['@_href'] ?? '');
    const source = i['source'];
    return { titulo: String(i['title'] ?? ''), veiculo: typeof source === 'string' ? source : typeof source === 'object' && source ? String((source as Record<string, unknown>)['#text'] ?? veiculo) : veiculo, data: String(i['pubDate'] ?? i['published'] ?? i['updated'] ?? ''), url };
  }).filter(i => i.titulo && i.url).map(i => ({ ...i, data: Number.isFinite(Date.parse(i.data)) ? new Date(i.data).toISOString() : '' }));
}

async function noticias(): Promise<NoticiaPublica[]> {
  const fontes = await Promise.allSettled([
    ler('https://haveibeenpwned.com/api/v3/latestbreach').then(r => r.json()).then((b: Breach) => [{ titulo: `Vazamento público: ${b.Title}`, veiculo: 'Have I Been Pwned', data: b.AddedDate, url: caso(b).url }]),
    ler('https://cert.br/rss/certbr-rss.xml').then(r => r.text()).then(xml => lerFeed(xml, 'CERT.br')),
  ]);
  let itens = fontes.flatMap(f => f.status === 'fulfilled' ? f.value : []);
  // Busca pública server-side, sem chave e sem dados da empresa, somente quando
  // as fontes primárias não oferecem cinco itens recentes.
  if (cincoNoticias(itens.filter(i => Date.parse(i.data) >= Date.now() - 72 * 3600000)).length < 5) {
    const busca = 'https://news.google.com/rss/search?q=' + encodeURIComponent('("vazamento de dados" OR "incidente de segurança") when:3d') + '&hl=pt-BR&gl=BR&ceid=BR:pt-419';
    try { itens = [...itens, ...lerFeed(await (await ler(busca)).text(), 'Google Notícias').filter(i => Date.parse(i.data) >= Date.now() - 72 * 3600000 && Date.parse(i.data) <= Date.now())]; } catch { /* Mantém as fontes primárias. */ }
  }
  const resultado = cincoNoticias(itens);
  if (resultado.length !== 5) throw new Error('Não há cinco notícias disponíveis');
  return resultado;
}

export async function carregarReferencias(cnpj: string): Promise<ReferenciasPublicas> {
  const [casos, news] = await Promise.allSettled([
    comCache('hibp:breaches', CACHE_CASOS_MS, async () => ((await (await ler('https://haveibeenpwned.com/api/v3/breaches')).json()) as Breach[]).map(caso)),
    comCache(`noticias:${cnpj}`, CACHE_NOTICIAS_MS, async () => ({ itens: await noticias(), atualizadoEm: new Date().toISOString() })),
  ]);
  return { casos: casos.status === 'fulfilled' ? casos.value : [], noticias: news.status === 'fulfilled' ? news.value.itens : [], atualizadoEm: news.status === 'fulfilled' ? news.value.atualizadoEm : '', erroCasos: casos.status === 'rejected', erroNoticias: news.status === 'rejected' };
}