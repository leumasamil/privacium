export const COOLDOWN_FORNECEDORES_MS = 3600000;
export type FornecedorFonte = { nome: string; processo_rot_id: string | null; ativo_id: string | null; campo: string };
export type VazamentoFornecedor = { Name: string; Title: string; Domain: string; BreachDate: string; PwnCount: number; DataClasses: string[] };
export const normalizarFornecedor = (nome: string) => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(s\.?\s*a\.?|ltda\.?|limitada|inc\.?|llc|corp\.?)\b/g, '').replace(/[^a-z0-9]/g, '');
function dominio(texto: string) {
  const encontrado = texto.toLowerCase().match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/)?.[1];
  return encontrado?.replace(/^www\./, '') ?? '';
}
const genericos = new Set(['servidorlocal','nuvempublica','nuvemprivada','backup','bitlocker','criptografia','mfa','rls','firewall','antivirus','cofre','local','cloud']);
export function correspondenciaForte(fornecedor: string, breach: VazamentoFornecedor): boolean {
  const d = dominio(fornecedor), bd = dominio(breach.Domain);
  if (d) return !!bd && d === bd;
  const nome = normalizarFornecedor(fornecedor);
  return nome.length >= 4 && !genericos.has(nome) && [breach.Name, breach.Title].some(n => normalizarFornecedor(n) === nome);
}
export function extrairFornecedores(rot: { id: string; infraestrutura: string; salvaguardas: string[] }[], ativos: { id: string; responsavel?: string | null; localizacao?: string | null; provedor_nuvem: string | null; descricao: string; estrutura_pasta: string | null }[]): FornecedorFonte[] {
  const fontes: FornecedorFonte[] = [];
  const adicionar = (texto: string | null | undefined, processo_rot_id: string | null, ativo_id: string | null, campo: string) => {
    for (const parte of (texto ?? '').split(/[;\n|]/)) {
      const nome = parte.trim().replace(/^(fornecedor|provedor|responsavel|responsável|localização|localizacao)\s*:\s*/i, '');
      if (nome.length >= 4) fontes.push({ nome, processo_rot_id, ativo_id, campo });
    }
  };
  rot.forEach(r => { adicionar(r.infraestrutura, r.id, null, '12'); r.salvaguardas.forEach(s => adicionar(s, r.id, null, '11')); });
  ativos.forEach(a => { adicionar(a.responsavel, null, a.id, 'responsável'); adicionar(a.localizacao, null, a.id, 'localização'); adicionar(a.provedor_nuvem, null, a.id, 'provedor'); adicionar(a.descricao, null, a.id, 'descrição'); adicionar(a.estrutura_pasta, null, a.id, 'localização'); });
  return fontes;
}
export function cooldownRestante(tentativa: string | null | undefined, agora: number) { return tentativa ? Math.max(0, Date.parse(tentativa) + COOLDOWN_FORNECEDORES_MS - agora) : 0; }
export function decisaoValida(estado: string, justificativa: string, titulares: string) { return estado === 'em_avaliacao' || ((estado === 'descartado' || estado === 'confirmado_impacto') && !!justificativa.trim() && (estado !== 'confirmado_impacto' || titulares === 'sim')); }