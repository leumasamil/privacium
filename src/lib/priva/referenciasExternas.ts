// Terceiros fornecem contexto, não evidência própria: este DTO nunca é persistido,
// auditado, assinado ou enviado aos geradores de PDF/hash dos PI-01 a PI-05.
export const CACHE_CASOS_MS = 24 * 60 * 60 * 1000;
export const CACHE_NOTICIAS_MS = 30 * 60 * 1000;
export type CasoPublico = { nome: string; data: string; contas: number; categorias: string[]; descricao: string; url: string };
export type NoticiaPublica = { titulo: string; veiculo: string; data: string; url: string };
export type ReferenciasPublicas = { casos: CasoPublico[]; noticias: NoticiaPublica[]; atualizadoEm: string; erroCasos: boolean; erroNoticias: boolean };

export const BASES_PUBLICAS = [
  { nome: 'Have I Been Pwned', descricao: 'Histórico de vazamentos por serviço', url: 'https://haveibeenpwned.com/PwnedWebsites' },
  { nome: 'Privacy Rights Clearinghouse', descricao: 'Cronologia pública de notificações de vazamento', url: 'https://privacyrights.org/data-breaches' },
  { nome: 'ANPD', descricao: 'Informações sobre incidentes notificados no Brasil', url: 'https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca' },
  { nome: 'CERT.br', descricao: 'Alertas técnicos e estatísticas de incidentes', url: 'https://www.cert.br/' },
] as const;

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const grupos = [
  ['ransomware', 'ransom'], ['credential stuffing', 'credential'],
  ['senha', 'password'], ['email', 'e-mail', 'email addresses'],
  ['telefone', 'phone'], ['nome', 'names'], ['endereco', 'addresses'],
  ['cpf', 'government issued'], ['saude', 'health', 'medical'],
  ['financeiro', 'financial', 'bank', 'credit card'],
];

/** Comparação local: não envia natureza, categorias, setor ou CNPJ à fonte pública. */
export function casosSemelhantes(casos: CasoPublico[], natureza: string, categorias: string[], setor = ''): CasoPublico[] {
  const termos = normalizar([natureza, ...categorias].join(' '));
  return casos.map(caso => {
    const texto = normalizar([caso.descricao, ...caso.categorias].join(' '));
    const vetor = grupos.slice(0, 2).filter(g => g.some(t => normalizar(natureza).includes(t)));
    if (!vetor.length || !vetor.some(g => g.some(t => texto.includes(t)))) return { caso, score: 0 };
    const dados = normalizar(categorias.join(' '));
    if (!grupos.slice(2).some(g => g.some(t => dados.includes(t)) && g.some(t => normalizar(caso.categorias.join(' ')).includes(t)))) return { caso, score: 0 };
    let score = grupos.reduce((n, grupo) => n + (grupo.some(t => termos.includes(t)) && grupo.some(t => texto.includes(t)) ? 1 : 0), 0);
    if (setor && texto.includes(normalizar(setor))) score += 1;
    return { caso, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || Date.parse(b.caso.data) - Date.parse(a.caso.data)).slice(0, 3).map(x => x.caso);
}

export function cincoNoticias(items: NoticiaPublica[]): NoticiaPublica[] {
  const unicos = new Map<string, NoticiaPublica>();
  for (const item of items) {
    if (!Number.isFinite(Date.parse(item.data))) continue;
    try { if (new URL(item.url).protocol !== 'https:') continue; } catch { continue; }
    if (!unicos.has(item.url)) unicos.set(item.url, { ...item, titulo: item.titulo.length > 90 ? `${item.titulo.slice(0, 89)}…` : item.titulo });
  }
  return [...unicos.values()].sort((a, b) => Date.parse(b.data) - Date.parse(a.data)).slice(0, 5);
}