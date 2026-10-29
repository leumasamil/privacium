/** Catálogo fixo do briefing ANPD Parte 2; não consulta fontes externas. */
export const VERSAO_NATUREZAS = "2026-10-29.1";
export type NaturezaVinculada = { valor: string; fonte_normativa: string };
export const OUTRO = "Outro";
const grupo = (titulo: string, fonte: string, itens: [string, string, string][]) => ({
  titulo,
  itens: itens.map(([valor, resumo, detalhe]) => ({ valor, fonte_normativa: fonte, descricao: [resumo, detalhe] })),
});
export const GRUPOS_NATUREZAS = [
  grupo("Ransomware e Extorsão", "NIST SP 800-61r3", [
    ["Ransomware com criptografia de ativos", "Arquivos ou sistemas foram criptografados por um agente malicioso.", "Pode haver cobrança de resgate e indisponibilidade dos ativos afetados."],
    ["Ransomware sem criptografia (dupla extorsão / exfiltração prévia)", "O incidente envolve subtração de dados ou ameaça de divulgação.", "A extorsão pode ocorrer antes ou independentemente da criptografia."],
    ["Extorsão sem criptografia", "Há exigência de vantagem mediante ameaça envolvendo os dados.", "Os ativos não precisam estar criptografados para caracterizar esta natureza."],
    ["Ataque à cadeia de suprimentos com impacto em terceiros", "Um fornecedor, software ou serviço foi utilizado como vetor de ataque.", "O comprometimento alcança organizações ou pessoas dependentes dessa cadeia."],
  ]),
  grupo("Acesso não autorizado", "NIST SP 800-61r3 / MITRE ATT&CK", [
    ["Credential stuffing / uso de credenciais vazadas", "Credenciais obtidas em vazamentos foram usadas para tentar acessar contas.", "O acesso pode explorar a reutilização de senhas em diferentes serviços."],
    ["Acesso indevido com elevação de privilégio", "Um agente obteve acesso além das permissões que lhe eram atribuídas.", "Verifique quais funções e dados ficaram acessíveis com esse privilégio."],
    ["Conta comprometida por phishing", "Uma abordagem fraudulenta levou ao comprometimento de uma conta.", "Avalie o uso indevido de credenciais, sessões e recursos associados."],
    ["Insider threat (colaborador ou ex-colaborador)", "O incidente envolve uso indevido de acesso por colaborador ou ex-colaborador.", "Considere as permissões existentes e as ações praticadas sobre os dados."],
    ["Acesso indevido a base de dados", "Uma base de dados foi acessada sem autorização adequada.", "Identifique as consultas, alterações ou extrações que puderam ocorrer."],
  ]),
  grupo("Vazamento e exposição de dados", "NIST SP 800-61r3 / ENISA", [
    ["Exposição acidental (má configuração, bucket público, envio equivocado)", "Dados ficaram acessíveis por configuração ou compartilhamento acidental.", "Verifique o alcance da exposição e se houve acesso por terceiros."],
    ["Exfiltração por agente externo", "Dados foram transferidos indevidamente para fora do ambiente controlado.", "Identifique o conteúdo extraído e os possíveis destinatários."],
    ["Perda ou roubo de dispositivo com dados", "Um dispositivo que contém dados foi perdido ou subtraído.", "Avalie criptografia, bloqueio e possibilidade de acesso ao conteúdo."],
    ["Publicação indevida em canal aberto", "Dados foram divulgados em canal acessível a público não autorizado.", "Verifique duração, alcance e possibilidade de remoção da publicação."],
  ]),
  grupo("Disponibilidade", "NIST SP 800-61r3", [
    ["DDoS", "Uma sobrecarga distribuída comprometeu o acesso ao serviço.", "Avalie duração e impacto sobre operações que tratam dados pessoais."],
    ["Indisponibilidade de fornecedor crítico", "Um serviço de fornecedor essencial tornou-se indisponível.", "Verifique o impacto no acesso aos dados e na continuidade das operações."],
    ["Falha de infraestrutura com perda de dado", "Uma falha de infraestrutura resultou em perda de dado.", "Avalie a extensão da perda e a possibilidade de recuperação íntegra."],
  ]),
  grupo("Vulnerabilidade e exploração", "MITRE ATT&CK / CISA KEV", [
    ["Exploração de vulnerabilidade conhecida sem patch", "Uma vulnerabilidade conhecida e não corrigida foi explorada.", "Identifique os ativos afetados e os acessos decorrentes da exploração."],
    ["Zero-day", "O ataque explorou uma vulnerabilidade sem correção disponível ou ainda desconhecida.", "Registre as evidências técnicas e as medidas de contenção adotadas."],
    ["Injeção / RCE", "Entradas maliciosas permitiram injeção ou execução remota de código.", "Verifique comandos executados e os dados alcançados pelo ataque."],
  ]),
  grupo("Outros", "Descrição própria do DPO", [
    ["Fraude de identidade (deepfake, synthetic identity)", "Uma identidade manipulada ou sintética foi utilizada em ação fraudulenta.", "Avalie os dados pessoais envolvidos e os efeitos para os titulares."],
    ["Incidente físico com impacto em dados", "Um evento físico afetou dados ou seus meios de armazenamento.", "Verifique exposição, perda, integridade e disponibilidade dos registros."],
    [OUTRO, "A natureza identificada não se enquadra nas demais opções do catálogo.", "Descreva o ocorrido; a ausência de encaixe taxonômico será registrada."],
  ]),
];
export const NATUREZAS = GRUPOS_NATUREZAS.flatMap(g => g.itens);
export const PADRAO_RANSOMWARE = "Ransomware com criptografia de ativos";
export function vincularNatureza(valor: string): NaturezaVinculada | undefined {
  const item = NATUREZAS.find(n => n.valor === valor);
  return item ? { valor: item.valor, fonte_normativa: item.fonte_normativa } : undefined;
}
export function naturezaInicial(valor: unknown, enviado: boolean): string {
  if (typeof valor !== "string" || !valor.trim()) return enviado ? "" : PADRAO_RANSOMWARE;
  return !enviado && valor === "Ransomware" ? PADRAO_RANSOMWARE : valor;
}
export function linhasNaturezas(comunicacao: unknown): string[] {
  if (!comunicacao || typeof comunicacao !== "object") return [];
  const c = comunicacao as Record<string, unknown>;
  const linhas: string[] = [];
  const principal = c.natureza_principal as Partial<NaturezaVinculada> | undefined;
  // Comunicações anteriores não recebem fonte retroativa nem são reclassificadas.
  if (principal?.valor) linhas.push(`Natureza: ${principal.valor} (${principal.fonte_normativa || "Fonte não registrada"})`);
  else if (typeof c.natureza === "string" && c.natureza) linhas.push(`Natureza: ${c.natureza} (Fonte não registrada na comunicação original)`);
  if (Array.isArray(c.naturezas_secundarias)) for (const n of c.naturezas_secundarias) {
    if (n && typeof n === "object" && typeof n.valor === "string") linhas.push(`Natureza secundária: ${n.valor} (${n.fonte_normativa || "Fonte não registrada"})`);
  }
  if (typeof c.natureza_outro === "string" && c.natureza_outro.trim()) linhas.push(`Descrição própria do DPO: ${c.natureza_outro.trim()}`);
  return linhas;
}