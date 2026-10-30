/**
 * Ciclo de vida do dado pessoal (gênero × espécie).
 * Espécies = verbos literais do art. 5º, X da LGPD; gêneros = agrupamento didático do método.
 */
export const VERBOS_ART5_X = [
  "coleta", "produção", "recepção", "classificação", "utilização", "acesso", "reprodução", "transmissão", "distribuição", "processamento",
  "arquivamento", "armazenamento", "eliminação", "avaliação ou controle da informação", "modificação", "comunicação", "transferência", "difusão", "extração",
] as const;

/** Forma verbal (infinitivo) dos verbos do art. 5º, X usados como espécie. */
export const ESPECIES_PERMITIDAS = [
  "coletar", "produzir", "receber", "classificar", "utilizar", "acessar", "reproduzir", "transmitir", "distribuir", "processar",
  "arquivar", "armazenar", "eliminar", "avaliar ou controlar", "modificar", "comunicar", "transferir", "difundir", "extrair",
] as const;

export const GENEROS = ["Coletar", "Reter", "Processar", "Compartilhar", "Eliminar"] as const;
export type Genero = (typeof GENEROS)[number];
export type CicloVida = Partial<Record<Genero, string[]>>;

export const ESPECIES: Record<Genero, string[]> = {
  Coletar: ["receber", "extrair", "produzir", "classificar"],
  Reter: ["arquivar", "armazenar"],
  Processar: ["utilizar", "acessar", "avaliar ou controlar", "modificar", "reproduzir"],
  Compartilhar: ["transmitir", "distribuir", "comunicar", "transferir", "difundir"],
  Eliminar: ["eliminar"],
};

export const AJUDA_CICLO = "Agrupamento didático dos 20 verbos do art. 5º, X da LGPD. As espécies são os verbos literais da lei; os gêneros são agrupamento do método.";
export const DESCRICAO_CICLO = "Coletar → Reter → Processar → Compartilhar → Eliminar";
export const NOTA_CICLO = "Cada gênero corresponde a um estado do dado pessoal; as espécies são os verbos do art. 5º, X da LGPD.";

/** Apresentação em duas etapas (organizacional, sem criar categoria legal). */
export const ETAPA1: readonly Genero[] = ["Coletar", "Reter", "Processar"];
export const ETAPA2: readonly Genero[] = ["Compartilhar", "Eliminar"];
export const ROTULO_ETAPA1 = "Etapa 1 — Tratamento no perímetro do agente";
export const ROTULO_ETAPA2 = "Etapa 2 — Destino do dado";
export const NOTA_ETAPA2_COMPARTILHAR = "o dado sai e continua existindo em outra mão";
export const NOTA_ETAPA2_ELIMINAR = "o dado deixa de existir (LGPD art. 16)";
export const NOTA_METODO_CICLO = "Agrupamento do método. Os 20 verbos do art. 5º, X da LGPD permanecem íntegros; a divisão entre perímetro e destino é organizacional, não cria categoria legal nova.";
export const NOTA_RESPONSAVEL_ETAPAS = "Responsável distinto: a Etapa 1 é assinada pelo gestor da área; a Etapa 2, pelo DPO.";
/** Alerta não bloqueante: retenção sem destino declarado (LGPD art. 16). */
export const ALERTA_RETENCAO = "Dado retido sem destino declarado — art. 16 não comprovado";

export function temEtapa2(c: CicloVida): boolean {
  return generosMarcados(c).some((g) => ETAPA2.includes(g));
}

/** Ciclo agrupado por etapa para exibição na planilha (Etapa 1 = perímetro; Etapa 2 = destino). */
export function formatarCicloEtapas(c: CicloVida): { e1: string; e2: string } {
  const fmt = (gs: readonly Genero[]) =>
    gs.filter((g) => (c[g] ?? []).length > 0).map((g) => `${g} (${(c[g] ?? []).join(", ")})`).join("; ");
  return { e1: fmt(ETAPA1), e2: fmt(ETAPA2) };
}

/** Dispara quando há "Reter" na Etapa 1 e a Etapa 2 está vazia. */
export function alertaRetencao(c: CicloVida): string | null {
  const g = generosMarcados(c);
  return g.includes("Reter") && !temEtapa2(c) ? ALERTA_RETENCAO : null;
}

/**
 * Destino declarado (exigido para chancelar o PI-02): compartilhamento com destinatário
 * identificado OU eliminação com prazo e fundamento (LGPD art. 16).
 */
export function destinoDeclarado(r: { ciclo_vida?: unknown; genero_verbo: string; compartilhamento: string; tempo_retencao: string; base_prazo: string }): boolean {
  const g = generosMarcados(cicloDaLinha(r));
  const compartilha = g.includes("Compartilhar") && !!r.compartilhamento.trim() && !/n[ãa]o compartilhado|n[ãa]o h[áa]/i.test(r.compartilhamento);
  const elimina = g.includes("Eliminar") && !!r.tempo_retencao.trim() && !!r.base_prazo.trim();
  return compartilha || elimina;
}

/** Itens da ISO/IEC 27002:2022 por gênero (determinístico). */
export const ISO_27002: Record<Genero, string[]> = {
  Coletar: ["ISO/IEC 27002 — 5.12 (classificação da informação)"],
  Reter: ["ISO/IEC 27002 — 8.10 (exclusão de informação)"],
  Processar: ["ISO/IEC 27002 — 5.10 (uso aceitável)", "ISO/IEC 27002 — 8.11 (mascaramento)"],
  Compartilhar: ["ISO/IEC 27002 — 5.14 (transferência de informação)"],
  Eliminar: ["ISO/IEC 27002 — 8.10 (exclusão de informação)", "ISO/IEC 27002 — 7.10 (mídias de armazenamento)"],
};

export const CITACOES_LGPD = ["LGPD art. 5º, X (operação de tratamento)", "LGPD art. 37 (registro das operações)"];
/** Resolução da ANPD aplicável ao registro (agentes de pequeno porte podem manter registro simplificado). */
export const CITACAO_ANPD = "Res. CD/ANPD nº 2/2022, art. 9º (registro simplificado — agentes de tratamento de pequeno porte)";

export function generosMarcados(c: CicloVida | null | undefined): Genero[] {
  return GENEROS.filter((g) => (c?.[g] ?? []).length > 0);
}

/** Linhas antigas (só genero_verbo) viram gênero sem espécie marcada. */
export function cicloDaLinha(r: { ciclo_vida?: unknown; genero_verbo: string }): CicloVida {
  const c = (r.ciclo_vida && typeof r.ciclo_vida === "object" ? r.ciclo_vida : {}) as CicloVida;
  if (generosMarcados(c).length) return c;
  return (GENEROS as readonly string[]).includes(r.genero_verbo) ? { [r.genero_verbo as Genero]: [] } : {};
}

/** "Coletar › receber, classificar | Reter › arquivar" */
export function formatarCiclo(c: CicloVida): string {
  return GENEROS.filter((g) => g in c).map((g) => (c[g]!.length ? `${g} › ${c[g]!.join(", ")}` : g)).join(" | ");
}

export function citacoesISO(c: CicloVida): string[] {
  return [...new Set(GENEROS.filter((g) => g in c).flatMap((g) => ISO_27002[g]))];
}

export function alternar(c: CicloVida, g: Genero, especie: string): CicloVida {
  const atual = c[g] ?? [];
  const nova = atual.includes(especie) ? atual.filter((e) => e !== especie) : [...atual, especie];
  const out = { ...c };
  if (nova.length) out[g] = ESPECIES[g].filter((e) => nova.includes(e)); else delete out[g];
  return out;
}

/** Erro se alguma espécie não está no elenco do gênero; null se válido. */
export function validarCiclo(c: CicloVida): string | null {
  const gs = generosMarcados(c);
  if (!gs.length) return "Marque ao menos uma espécie no campo 2 (Ciclo de vida do dado pessoal).";
  for (const g of gs) for (const e of c[g]!) if (!ESPECIES[g].includes(e)) return `Espécie "${e}" fora do elenco do art. 5º, X para o gênero ${g}.`;
  return null;
}
