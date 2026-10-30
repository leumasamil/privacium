import type { Database } from "@/integrations/supabase/types";
import { cicloDaLinha, temProcessar, validarCiclo } from "./cicloVida";

export type RotRow = Database["public"]["Tables"]["registro_operacoes"]["Row"];
export type RotInput = Omit<RotRow, "id" | "codigo" | "criado_por" | "criado_em" | "atualizado_em" | "assinatura_etapa1" | "assinatura_etapa2" | "excluido_em" | "excluido_por" | "motivo_exclusao">;

/** Papel do agente na linha (LGPD art. 5º, VI e VII); o padrão vem do enquadramento do Bloco 1 e é editável por linha. */
export const PAPEIS_AGENTE = ["CONTROLADOR", "OPERADOR", "CONTROLADOR_OPERADOR"] as const;
export type PapelAgente = (typeof PAPEIS_AGENTE)[number];
export const ROTULO_PAPEL: Record<PapelAgente, string> = {
  CONTROLADOR: "Controlador",
  OPERADOR: "Operador",
  CONTROLADOR_OPERADOR: "Controlador e operador simultaneamente",
};
/** Textos literais — fonte: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm */
export const FONTE_LGPD = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm";
export const LITERAL_ART5_VI = "controlador: pessoa natural ou jurídica, de direito público ou privado, a quem competem as decisões referentes ao tratamento de dados pessoais";
export const LITERAL_ART5_VII = "operador: pessoa natural ou jurídica, de direito público ou privado, que realiza o tratamento de dados pessoais em nome do controlador";
/** Nota exibida quando a linha é OPERADOR: o destino (Etapa 2) é definido pelo controlador. */
export const NOTA_DESTINO_OPERADOR = "Definido pelo controlador — LGPD art. 5º, VII e art. 39";
/** Nota de método do PRT — Produto do Tratamento (LGPD art. 5º, X); distingue dos artefatos PI-01 a PI-05. */
export const NOTA_PRT = "PRT (Produto do Tratamento) é o resultado material das operações de tratamento (LGPD art. 5º, X) e não constitui categoria jurídica autônoma. Não confundir com os artefatos legais PI-01 a PI-05, que são documentos chancelados do método, com hash SHA-256. Agrupamento do método: os 20 verbos do art. 5º, X da LGPD permanecem íntegros.";
export const NOTA_PRODUTO = NOTA_PRT;
export const ROTULO_PRT = "PRT — Produto do Tratamento";
/** Alerta bloqueante de chancela: Processar sem PRT declarado (LGPD art. 6º, I). */
export const ALERTA_PRODUTO_AUSENTE = "Tratamento com processamento sem PRT (Produto do Tratamento) declarado — art. 6º, I não comprovado.";
/** Alerta não bloqueante: operador não declara finalidade própria (LGPD art. 39). */
export const ALERTA_FINALIDADE_OPERADOR = "Operador não declara finalidade própria — a finalidade desta linha é a do contrato com o controlador (LGPD art. 39).";

/** Destino de um PRT (Etapa 2): interno (Área › Setor), externo (terceiro do cadastro) ou eliminação (LGPD art. 16). */
export type DestinoProduto = {
  tipo: "INTERNO" | "EXTERNO" | "ELIMINACAO";
  area_setor_destino?: string | undefined;
  /** Legado: nome livre do terceiro (antes do cadastro). */
  terceiro?: string | undefined;
  terceiro_id?: string | undefined;
  terceiro_nome?: string | undefined;
  linha_receptor_id?: string | undefined;
  linha_receptor_codigo?: string | undefined;
  prazo?: string | undefined;
  fundamento?: string | undefined;
};
export type ProdutoTratamento = { nome: string; destino?: DestinoProduto | null };
/** Linha criada automaticamente no setor receptor (compartilhamento interno), com origem rastreada. */
export type OrigemCompartilhamento = { estado: "insumo recebido"; linha_origem_id: string; codigo_origem: string; area_setor_origem: string };

type ComPRT = Partial<Pick<RotRow, "produtos_tratamento" | "produto_interno" | "destino_produto" | "prazo_produto" | "fundamento_produto">>;

/** Lista de PRT da linha (linhas antigas com produto único viram PRT-1). */
export function produtosDaLinha(r: ComPRT): ProdutoTratamento[] {
  const lista = Array.isArray(r.produtos_tratamento) ? (r.produtos_tratamento as ProdutoTratamento[]) : [];
  if (lista.length) return lista;
  const nome = (r.produto_interno ?? "").trim();
  if (!nome) return [];
  const d = r.destino_produto as DestinoProduto | null | undefined;
  return [{ nome, destino: d ? { ...d, prazo: d.prazo ?? r.prazo_produto ?? undefined, fundamento: d.fundamento ?? r.fundamento_produto ?? undefined } : null }];
}
export const rotuloPRT = (i: number) => `PRT-${i + 1}`;
export const alertaPRTSemDestino = (nome: string) => `PRT '${nome}' sem destino declarado — art. 16 não comprovado.`;

/** Destino individual completo: interno com Área › Setor; externo com terceiro do cadastro; eliminação com prazo e fundamento. */
export function destinoPRTCompleto(d: DestinoProduto | null | undefined): boolean {
  if (!d) return false;
  if (d.tipo === "INTERNO") return !!(d.area_setor_destino ?? "").split("›")[0]?.trim();
  if (d.tipo === "EXTERNO") return !!d.terceiro_id;
  return !!(d.prazo ?? "").trim() && !!(d.fundamento ?? "").trim();
}

/** Alertas por PRT sem destino (bloqueiam a chancela do PI-02). Linhas de operador: destino definido pelo controlador. */
export function alertasPRTSemDestino(r: ComPRT & Pick<RotRow, "papel_agente">): string[] {
  if (r.papel_agente === "OPERADOR") return [];
  return produtosDaLinha(r).filter((p) => !destinoPRTCompleto(p.destino)).map((p) => alertaPRTSemDestino(p.nome || "sem nome"));
}

/** PRT com destino externo para terceiro sem contrato vigente e checklist do art. 39 completo (alerta bloqueante). */
export function prtExternosBloqueados(r: ComPRT, terceiros: { id: string; contrato_vigente: boolean; clausulas_art39: boolean }[]): ProdutoTratamento[] {
  return produtosDaLinha(r).filter((p) => {
    if (p.destino?.tipo !== "EXTERNO" || !p.destino.terceiro_id) return false;
    const t = terceiros.find((x) => x.id === p.destino!.terceiro_id);
    return !t || !t.contrato_vigente || !t.clausulas_art39;
  });
}

/** Texto do destino de um PRT para a planilha e o PI-02. */
export function descreverDestinoPRT(d: DestinoProduto | null | undefined): string {
  if (!d) return "sem destino declarado";
  if (d.tipo === "INTERNO") return `Interno: ${d.area_setor_destino ?? "Área › Setor a definir"}${d.linha_receptor_codigo ? ` (linha ${d.linha_receptor_codigo})` : ""}`;
  if (d.tipo === "EXTERNO") return `Externo: ${d.terceiro_nome ?? d.terceiro ?? "terceiro não cadastrado"}`;
  return `Eliminar em ${d.prazo || "prazo a definir"} (${d.fundamento || "fundamento a definir"})`;
}

export const TITULARES = ["Colaboradores", "Clientes", "Fornecedores", "Visitantes", "Candidatos", "Menores de Idade"];
export const DADOS = ["Nome", "CPF", "RG", "Telefone", "E-mail", "Endereço", "Dados Bancários", "Imagem"];
export const SENSIVEIS = ["N/A", "Biometria", "Prontuário de Saúde", "Origem Racial", "Filiação Sindical", "Convicção Religiosa", "Dado Genético"];
export const SALVAGUARDAS = ["Criptografia", "BitLocker", "Acesso Restrito RBAC", "Proxy de IA", "MFA", "Anonimização"];
export const INFRA = ["Servidor Local", "Nuvem Corporativa", "Arquivo Físico"] as const;

/** Insumo (documento de entrada) — LGPD art. 5º, I / ISO/IEC 27002:2022 (controle em verificação; referência bibliográfica, item 9.6 do blueprint). */
export const INSUMOS = ["currículo", "nota fiscal", "banco de dados", "contrato", "formulário", "prontuário", "e-mail", "imagem/documento digitalizado"];
/** Meio de fornecimento — LGPD art. 37 (registro das operações). */
export const MEIOS = ["site", "e-mail", "presencial/recepção", "telefone", "API/sistema", "documento físico"];

/** Campo 7A — art. 7º da LGPD (dado pessoal), 10 hipóteses. */
export const HIPOTESES_7A: string[] = [
  "Art. 7º, I – Consentimento do titular",
  "Art. 7º, II – Cumprimento de obrigação legal ou regulatória",
  "Art. 7º, III – Execução de políticas públicas (administração pública)",
  "Art. 7º, IV – Estudos por órgão de pesquisa",
  "Art. 7º, V – Execução de contrato ou procedimentos preliminares",
  "Art. 7º, VI – Exercício regular de direitos em processo",
  "Art. 7º, VII – Proteção da vida ou incolumidade física",
  "Art. 7º, VIII – Tutela da saúde",
  "Art. 7º, IX – Legítimo interesse do controlador ou de terceiro",
  "Art. 7º, X – Proteção do crédito",
];

/** Campo 7B — art. 11 da LGPD (dado pessoal sensível). */
export const HIPOTESES_7B: string[] = [
  "Art. 11, I – Consentimento específico e destacado",
  "Art. 11, II, a – Cumprimento de obrigação legal ou regulatória",
  "Art. 11, II, b – Execução de políticas públicas",
  "Art. 11, II, c – Estudos por órgão de pesquisa",
  "Art. 11, II, d – Exercício regular de direitos",
  "Art. 11, II, e – Proteção da vida ou incolumidade física",
  "Art. 11, II, f – Tutela da saúde",
  "Art. 11, II, g – Garantia de prevenção à fraude e segurança do titular",
];

export function hasSensivel(r: Pick<RotRow, "dados_sensiveis">) {
  return r.dados_sensiveis.some((s) => s !== "N/A");
}

/** Linha de risco: menores de idade ou qualquer dado pessoal sensível diferente de N/A. */
export function isRisky(r: Pick<RotRow, "categoria_titulares" | "dados_sensiveis">) {
  return r.categoria_titulares.includes("Menores de Idade") || hasSensivel(r);
}

/** Regra de estado 7A × 7B: sem dado pessoal sensível o 7B é limpo e desabilitado. Linhas antigas com art. 11 no 7A migram para o 7B. */
export function normalizeHipoteses(r: RotInput): RotInput {
  let { hipotese_tratamento: a, hipotese_sensivel: b } = r;
  if (a.startsWith("Art. 11")) { b = b || a; a = ""; }
  if (!hasSensivel(r)) b = null;
  return { ...r, hipotese_tratamento: a, hipotese_sensivel: b };
}

const PROIBIDOS = /(base legal|hip[oó]tese legal)/i;

/** Retorna a mensagem de erro de validação (bloqueante), ou null se a linha pode ser salva. */
export function validateRot(r: RotInput): string | null {
  const texto = [r.finalidade_especifica, r.hipotese_tratamento, r.hipotese_sensivel ?? "", r.tempo_retencao, r.base_prazo, r.compartilhamento, r.justificativa_mitigacao ?? "",
    ...r.categoria_titulares, ...r.dados_pessoais, ...r.dados_sensiveis, ...r.salvaguardas].join(" ");
  if (PROIBIDOS.test(texto)) return 'Termo proibido: use "Hipótese de Tratamento" (terminologia da LGPD).';
  const erroCiclo = validarCiclo(cicloDaLinha(r));
  if (erroCiclo) return erroCiclo;
  if (!r.categoria_titulares.length) return "Preencha o campo 3 (Categoria de Titulares) para salvar — marque ao menos um grupo de pessoas.";
  if (!r.dados_pessoais.length) return "Preencha o campo 4 (Dados Pessoais) para salvar — marque ao menos um dado pessoal tratado.";
  if (!r.dados_sensiveis.length) return 'Preencha o campo 5 (Dado Pessoal Sensível) para salvar — marque o dado ou "N/A" se não houver.';
  if (!r.finalidade_especifica.trim()) return "Preencha o campo 6 (Finalidade Específica) para salvar — descreva para que o dado pessoal é usado.";
  if (!r.hipotese_tratamento.startsWith("Art. 7º")) return "Selecione o campo 7A (hipótese do art. 7º) para salvar — todo processo com dado pessoal precisa de uma.";
  const b = r.hipotese_sensivel ?? "";
  if (hasSensivel(r) && !b.startsWith("Art. 11")) return "Selecione o campo 7B (hipótese do art. 11) para salvar — obrigatório porque o campo 5 tem dado pessoal sensível.";
  if (!hasSensivel(r) && b) return "Limpe o campo 7B para salvar — ele só se aplica quando o campo 5 tem dado pessoal sensível.";
  if (!r.tempo_retencao.trim()) return "Preencha o campo 8 (Tempo de Retenção) para salvar — informe por quanto tempo o dado pessoal é guardado.";
  if (!r.base_prazo.trim()) return "Preencha o campo 9 (Base do Prazo) para salvar — ele é obrigatório quando o campo 8 está preenchido.";
  if (isRisky(r) && (r.justificativa_mitigacao ?? "").trim().length < 20) return "Escreva a justificativa das medidas mitigadoras (mínimo 20 caracteres) para salvar — obrigatória em processos com menores ou dado pessoal sensível. Responsável: DPO.";
  if (r.papel_agente === "OPERADOR" && !(r.contrato_controlador ?? "").trim()) return "Linha de operador exige o contrato com o controlador (campo 6) — a finalidade do operador é a do contrato (LGPD art. 39).";
  return null;
}

/** Processar na Etapa 1 sem produto interno declarado: alerta exibido e chancela do PI-02 bloqueada (LGPD art. 6º, I). */
export function alertaProdutoAusente(r: Pick<RotInput, "ciclo_vida" | "genero_verbo"> & ComPRT): string | null {
  return temProcessar(cicloDaLinha(r)) && !produtosDaLinha(r).some((p) => p.nome.trim()) ? ALERTA_PRODUTO_AUSENTE : null;
}

/** Operador com texto de finalidade que não referencia o contrato com o controlador (alerta não bloqueante, LGPD art. 39). */
export function alertaFinalidadeOperador(r: Pick<RotInput, "papel_agente" | "finalidade_especifica" | "contrato_controlador">): string | null {
  if (r.papel_agente !== "OPERADOR") return null;
  const contrato = (r.contrato_controlador ?? "").trim();
  const esperada = finalidadeDoContrato(contrato);
  return contrato && r.finalidade_especifica.trim() !== esperada ? ALERTA_FINALIDADE_OPERADOR : null;
}

/** Finalidade da linha de operador: sempre vinculada ao contrato com o controlador (LGPD art. 39). */
export function finalidadeDoContrato(contrato: string): string {
  return `Tratamento em nome do controlador, conforme contrato: ${contrato.trim()}`;
}

/**
 * Tabela determinística versionada (v1) de produto interno: Área › Setor + insumo (10A).
 * Nunca pré-seleciona: toda sugestão exibe "Sugerido — confirme" e exige ação do usuário.
 */
const ORIGEM_PRODUTO = "tabela determinística v1 · Área › Setor + insumo";
const SUGESTOES_PRODUTO_V1: Record<string, { insumo: string; produtos: string[] }[]> = {
  "Recursos Humanos": [{ insumo: "currículo", produtos: ["Ficha de candidato", "Parecer de seleção", "Proposta de contratação"] }],
  "Financeiro": [{ insumo: "nota fiscal", produtos: ["Lançamento contábil", "Relatório de despesas"] }],
  "Jurídico": [{ insumo: "contrato", produtos: ["Parecer jurídico", "Minuta revisada"] }],
  "Marketing": [{ insumo: "formulário", produtos: ["Base de leads", "Relatório de campanha"] }],
  "Recepção": [{ insumo: "imagem/documento digitalizado", produtos: ["Registro de visita", "Log de acesso"] }],
};

/** Sugestões de produto interno quando há Processar e o campo está vazio (o usuário confirma ou digita o nome próprio). */
export function sugerirProduto(r: Pick<RotInput, "area_setor" | "insumo" | "ciclo_vida" | "genero_verbo"> & ComPRT): Sugestao[] {
  if (!temProcessar(cicloDaLinha(r)) || produtosDaLinha(r).length) return [];
  const area = (r.area_setor ?? "").split("›")[0]?.trim() ?? "";
  const insumo = r.insumo?.trim().toLowerCase() ?? "";
  const regra = SUGESTOES_PRODUTO_V1[area]?.find((x) => x.insumo === insumo);
  return (regra?.produtos ?? []).map((p) => ({ texto: `PRT: ${p}`, origem: ORIGEM_PRODUTO, patch: { produto_interno: p, produtos_tratamento: [{ nome: p }] } }));
}

/**
 * Linha criada automaticamente no ROT do setor receptor quando o destino do produto é
 * compartilhamento INTERNO: o produto vira insumo (10A) e a origem fica rastreada.
 */
export function montarLinhaReceptora(
  origem: Pick<RotRow, "id" | "codigo" | "empresa_cnpj" | "categoria_titulares" | "dados_pessoais" | "dados_sensiveis" | "hipotese_tratamento" | "hipotese_sensivel" | "salvaguardas" | "infraestrutura" | "justificativa_mitigacao" | "area_setor" | "setor" | "produto_interno" | "papel_agente" | "contrato_controlador">,
  areaSetorDestino: string,
  chaveSetor: string,
  nomePRT: string = origem.produto_interno ?? "",
): RotInput {
  return {
    empresa_cnpj: origem.empresa_cnpj,
    setor: chaveSetor,
    genero_verbo: "Coletar",
    ciclo_vida: { Coletar: ["receber"] },
    categoria_titulares: origem.categoria_titulares,
    dados_pessoais: origem.dados_pessoais,
    dados_sensiveis: origem.dados_sensiveis,
    finalidade_especifica: `Recebimento de "${nomePRT}" de ${origem.area_setor ?? origem.setor} (compartilhamento interno)`,
    hipotese_tratamento: origem.hipotese_tratamento,
    hipotese_sensivel: origem.hipotese_sensivel,
    tempo_retencao: "", base_prazo: "", compartilhamento: "Não Compartilhado",
    salvaguardas: origem.salvaguardas, infraestrutura: origem.infraestrutura,
    justificativa_mitigacao: origem.justificativa_mitigacao,
    area_setor: areaSetorDestino,
    insumo: nomePRT,
    meio_fornecimento: "API/sistema",
    papel_agente: origem.papel_agente,
    contrato_controlador: origem.contrato_controlador,
    produto_interno: null,
    produtos_tratamento: [],
    destino_produto: null,
    prazo_produto: null, fundamento_produto: null,
    origem_compartilhamento: { estado: "insumo recebido", linha_origem_id: origem.id, codigo_origem: origem.codigo, area_setor_origem: origem.area_setor ?? origem.setor },
  };
}

export type Sugestao = { texto: string; origem: string; patch: Partial<RotInput> };

/**
 * Tabela determinística versionada (v1): finalidade conforme Área › Setor + insumo.
 * Nunca pré-seleciona: toda sugestão exibe "Sugerido — confirme" e exige ação do usuário.
 */
export const VERSAO_SUGESTOES = "v1";
const ORIGEM_FINALIDADE = "tabela determinística v2 · Área › Setor + insumo";
const ORIGEM_7A = `tabela determinística ${VERSAO_SUGESTOES} · finalidade/titulares → art. 7º`;
const ORIGEM_7B = `tabela determinística ${VERSAO_SUGESTOES} · dado pessoal sensível → art. 11`;

const SUGESTOES_FINALIDADE_V1: Record<string, { insumo: string; finalidade: string }[]> = {
  "Recursos Humanos": [
    { insumo: "currículo", finalidade: "Seleção e recrutamento de candidatos" },
    { insumo: "contrato", finalidade: "Gestão do contrato de trabalho e obrigações trabalhistas" },
    { insumo: "formulário", finalidade: "Administração de benefícios e folha de pagamento" },
  ],
  "Recepção": [
    { insumo: "formulário", finalidade: "Controle de acesso físico às instalações" },
    { insumo: "imagem/documento digitalizado", finalidade: "Identificação de visitantes para segurança patrimonial" },
  ],
  "Marketing": [
    { insumo: "formulário", finalidade: "Envio de comunicações a titulares que consentiram" },
    { insumo: "site", finalidade: "Gestão de campanhas e relacionamento com clientes" },
  ],
  "Financeiro": [
    { insumo: "nota fiscal", finalidade: "Emissão de documentos fiscais e cumprimento de obrigações tributárias" },
    { insumo: "contrato", finalidade: "Gestão de contas a pagar e a receber" },
  ],
  "Jurídico": [
    { insumo: "contrato", finalidade: "Gestão contratual e exercício regular de direitos em processo" },
    { insumo: "formulário", finalidade: "Governança de privacidade e registro das operações de tratamento" },
  ],
  "Compras": [{ insumo: "contrato", finalidade: "Gestão de fornecedores e cotações" }],
  "Tecnologia da Informação": [{ insumo: "banco de dados", finalidade: "Operação e segurança dos sistemas corporativos" }],
};

/** Sugestões automáticas a partir do que já foi preenchido (o usuário aplica com um clique; nada é pré-selecionado). */
export function sugerir(r: RotInput): Sugestao[] {
  const s: Sugestao[] = [];
  const sens = r.dados_sensiveis;
  const area = (r.area_setor ?? "").split("›")[0]?.trim() ?? "";
  const insumo = r.insumo?.trim().toLowerCase() ?? "";
  if (!r.finalidade_especifica.trim() && area && insumo) {
    const regra = SUGESTOES_FINALIDADE_V1[area]?.find((x) => x.insumo === insumo);
    if (regra) s.push({ texto: `Finalidade: ${regra.finalidade}`, origem: ORIGEM_FINALIDADE, patch: { finalidade_especifica: regra.finalidade } });
  }
  if (!r.hipotese_tratamento) {
    if (r.categoria_titulares.includes("Colaboradores")) s.push({ texto: "Colaboradores: art. 7º, II (obrigações trabalhistas)", origem: ORIGEM_7A, patch: { hipotese_tratamento: HIPOTESES_7A[1]! } });
    else if (r.categoria_titulares.includes("Clientes") || r.categoria_titulares.includes("Fornecedores")) s.push({ texto: "Clientes/fornecedores: art. 7º, V (contrato)", origem: ORIGEM_7A, patch: { hipotese_tratamento: HIPOTESES_7A[4]! } });
    else if ("Compartilhar" in cicloDaLinha(r) && r.categoria_titulares.length) s.push({ texto: "Compartilhamento sem contrato: avalie art. 7º, I (consentimento)", origem: ORIGEM_7A, patch: { hipotese_tratamento: HIPOTESES_7A[0]! } });
  }
  if (hasSensivel(r) && !r.hipotese_sensivel) {
    if (sens.includes("Prontuário de Saúde")) s.push({ texto: "Prontuário de Saúde: art. 11, II, f (tutela da saúde)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[6]! } });
    else if (sens.some((x) => x.startsWith("Biometria"))) s.push({ texto: "Biometria: art. 11, II, g (prevenção à fraude)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[7]! } });
    else if (sens.includes("Filiação Sindical")) s.push({ texto: "Filiação Sindical: art. 11, II, a (obrigação legal)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[1]! } });
    else s.push({ texto: "Sem outra hipótese aplicável: art. 11, I (consentimento específico e destacado)", origem: ORIGEM_7B, patch: { hipotese_sensivel: HIPOTESES_7B[0]! } });
  }
  if (!r.tempo_retencao && r.hipotese_tratamento === HIPOTESES_7A[1]! && r.categoria_titulares.includes("Colaboradores"))
    s.push({ texto: "Prazo de guarda a definir conforme obrigação legal específica (LGPD art. 16, I) — verificar a norma aplicável ao caso.", origem: ORIGEM_7A, patch: { base_prazo: "LGPD art. 16, I — verificar a norma aplicável ao caso" } });
  if (!r.tempo_retencao && r.hipotese_tratamento === HIPOTESES_7A[0]!) s.push({ texto: "Consentimento: reter até a revogação (art. 8º, §5º)", origem: ORIGEM_7A, patch: { tempo_retencao: "Até a revogação", base_prazo: "LGPD, art. 8º, §5º" } });
  if (r.categoria_titulares.includes("Menores de Idade") && !(r.justificativa_mitigacao ?? "").includes("art. 14"))
    s.push({ texto: "Menores de idade: tratamento no melhor interesse (art. 14, caput); se criança, registre o consentimento de um dos pais ou responsável (art. 14, § 1º)", origem: ORIGEM_7B, patch: { justificativa_mitigacao: `${r.justificativa_mitigacao ?? ""} Melhor interesse da criança e do adolescente (art. 14, caput); para criança, consentimento específico e em destaque de pelo menos um dos pais ou do responsável legal (art. 14, § 1º).`.trim() } });
  if (hasSensivel(r) && !r.salvaguardas.includes("Criptografia")) s.push({ texto: "Dado pessoal sensível: adicionar Criptografia às salvaguardas", origem: ORIGEM_7B, patch: { salvaguardas: [...r.salvaguardas, "Criptografia"] } });
  return s;
}

/** Alerta não bloqueante de coerência dado × hipótese (item 6 do método); fica registrado na trilha ao salvar. */
export const ALERTA_COERENCIA = "Hipótese possivelmente inadequada para o dado pessoal sensível declarado — confirme com fundamento.";

/** Casos mínimos determinísticos: filiação sindical × art. 11, II, d; prontuário em recrutamento; biometria × consentimento sem indicação específica. */
export function alertasCoerencia(r: Pick<RotInput, "dados_sensiveis" | "hipotese_sensivel" | "finalidade_especifica" | "justificativa_mitigacao">): string[] {
  const out: string[] = [];
  const sens = r.dados_sensiveis;
  const h7b = r.hipotese_sensivel ?? "";
  const contexto = `${r.finalidade_especifica} ${r.justificativa_mitigacao ?? ""}`.toLowerCase();
  if (sens.includes("Filiação Sindical") && h7b.startsWith("Art. 11, II, d"))
    out.push(`${ALERTA_COERENCIA} (filiação sindical × exercício regular de direitos — art. 11, II, d)`);
  if (sens.includes("Prontuário de Saúde") && /recrut|seleç|contrata/.test(contexto))
    out.push(`${ALERTA_COERENCIA} (prontuário de saúde em finalidade de recrutamento/contratação)`);
  if (sens.some((x) => x.startsWith("Biometria")) && h7b.startsWith("Art. 11, I") && !/consentimento específico/.test(contexto))
    out.push(`${ALERTA_COERENCIA} (biometria × consentimento, sem indicação de consentimento específico)`);
  return out;
}

/** Campo 6 — sugestão determinística (v2) por Área › Setor + insumo; nunca pré-seleciona. */
export function sugestaoFinalidade(r: Pick<RotInput, "area_setor" | "insumo">): { finalidade: string; origem: string } | null {
  const area = (r.area_setor ?? "").split("›")[0]?.trim() ?? "";
  const insumo = r.insumo?.trim().toLowerCase() ?? "";
  const regra = SUGESTOES_FINALIDADE_V1[area]?.find((x) => x.insumo === insumo);
  return regra ? { finalidade: regra.finalidade, origem: ORIGEM_FINALIDADE } : null;
}
const FINALIDADES_PADRAO = [...new Set(Object.values(SUGESTOES_FINALIDADE_V1).flat().map((x) => x.finalidade))];
const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);
export const finalidadePadronizada = (texto: string) => FINALIDADES_PADRAO.includes(texto.trim());
/** Finalidade livre com correspondência aproximada (≥ 50% das palavras da padronizada) — aviso não bloqueante. */
export function finalidadeEquivalente(r: Pick<RotInput, "finalidade_especifica">): string | null {
  const t = r.finalidade_especifica.trim();
  if (!t || finalidadePadronizada(t)) return null;
  const w = new Set(norm(t));
  let melhor: { f: string; s: number } | null = null;
  for (const f of FINALIDADES_PADRAO) {
    const fw = norm(f); if (!fw.length) continue;
    const s = fw.filter((x) => w.has(x)).length / fw.length;
    if (s >= 0.5 && (!melhor || s > melhor.s)) melhor = { f, s };
  }
  return melhor?.f ?? null;
}
/** Contador do cabeçalho da coluna 6: "X de Y finalidades padronizadas". */
export const contadorPadronizadas = (rows: Pick<RotRow, "finalidade_especifica">[]) =>
  `${rows.filter((r) => finalidadePadronizada(r.finalidade_especifica)).length} de ${rows.length} finalidades padronizadas`;
