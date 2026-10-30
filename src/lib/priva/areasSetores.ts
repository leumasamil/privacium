/**
 * Hierarquia "Área › Setor" (LGPD art. 37 — registro das operações).
 * Lista fechada de áreas; cada área sugere setores e aceita "outro (especificar)".
 * A chave curta da área alimenta a coluna `setor`, que gera o ID do processo (PRIVA-<SETOR>-NNN).
 */
export type AreaSetor = { area: string; chave: string; setores: string[] };

export const AREAS_SETORES: AreaSetor[] = [
  { area: "Recursos Humanos", chave: "RH", setores: ["Seleção e Recrutamento", "Folha de Pagamento", "Benefícios", "Desligamento"] },
  { area: "Tecnologia da Informação", chave: "TI", setores: ["Suporte", "Infraestrutura", "Desenvolvimento"] },
  { area: "Marketing", chave: "Marketing", setores: ["Campanhas", "Relacionamento"] },
  { area: "Compras", chave: "Compras", setores: ["Cotações", "Contratos"] },
  { area: "Recepção", chave: "Recepção", setores: ["Controle de Acesso", "Cadastro de Visitantes"] },
  { area: "Jurídico", chave: "Jurídico", setores: ["Contratos", "Governança de Privacidade", "Contencioso"] },
  { area: "Financeiro", chave: "Financeiro", setores: ["Contas a Pagar", "Faturamento", "Tesouraria"] },
];

export const ROTULO_AREA_SETOR = "Área › Setor — LGPD art. 37";

/** "Recursos Humanos › Seleção e Recrutamento" */
export function areaSetorCompleto(area: string, setor: string): string {
  return setor.trim() ? `${area} › ${setor.trim()}` : area;
}

/** Chave curta da área (coluna `setor`, geradora do ID). */
export function chaveDaArea(area: string): string {
  return AREAS_SETORES.find((a) => a.area === area)?.chave ?? area;
}

/** Área correspondente à chave curta armazenada (linhas antigas). */
export function areaDaChave(chave: string): string {
  return AREAS_SETORES.find((a) => a.chave === chave)?.area ?? chave;
}

/** Valor exibido: prefere a hierarquia gravada; linhas antigas mostram a área derivada da chave. */
export function exibirAreaSetor(r: { area_setor?: string | null; setor: string }): string {
  return r.area_setor?.trim() ? r.area_setor : areaDaChave(r.setor);
}
