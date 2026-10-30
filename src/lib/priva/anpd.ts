import { OUTRO, vincularNatureza, VERSAO_NATUREZAS } from "./naturezasIncidente";
import { textoMedidas, vincularMedida, VERSAO_MEDIDAS } from './medidasIncidente';
import type { CategoriaANPD } from './categoriasANPD';
import { textoRiscos, vincularRisco, VERSAO_RISCOS } from './riscosIncidente';
export type ComunicacaoANPD = {
  natureza: string;
  naturezasSecundarias?: string[];
  naturezaOutro?: string;
  categorias: string[];
  categoriasVinculadas?: CategoriaANPD[];
  titulares: string;
  riscos: string;
  riscosSelecionados?: string[];
  riscosDetalhes?: string;
  medidas: string;
  medidasSelecionadas?: string[];
  outrasMedidas?: string;
};
export type MotivoANPD = { campo: string; titulo: string; mensagem: string };
export function validarANPD(form: ComunicacaoANPD, email: string, passos: boolean[], evidencias?: { numero: number; nome: string; concluida: boolean; data: string | null; responsavel: string | null }[]): MotivoANPD[] {
  const motivos: MotivoANPD[] = [];
  if (!vincularNatureza(form.natureza)) motivos.push({ campo: "natureza", titulo: "Natureza", mensagem: "Campo Natureza: selecione uma natureza principal do catálogo" });
  const secundarias = form.naturezasSecundarias ?? [];
  if (secundarias.some(n => !vincularNatureza(n) || n === form.natureza) || new Set(secundarias).size !== secundarias.length) motivos.push({ campo: "natureza", titulo: "Naturezas secundárias", mensagem: "Selecione naturezas secundárias distintas da principal, dentro do catálogo" });
  if ((form.natureza === OUTRO || secundarias.includes(OUTRO)) && !form.naturezaOutro?.trim()) motivos.push({ campo: "natureza-outro", titulo: "Descrição de Outro", mensagem: "Campo Outro: descreva a natureza do incidente" });
  if (!form.categorias.length) motivos.push({ campo: "categorias", titulo: "Categorias", mensagem: "Campo Categorias de dados: selecione ao menos uma opção" });
  if (!/^\d+$/.test(form.titulares) || Number(form.titulares) < 1 || !Number.isSafeInteger(Number(form.titulares))) motivos.push({ campo: "titulares", titulo: "Titulares", mensagem: "Campo Titulares: informe um número inteiro, mínimo 1" });
  if (form.riscosSelecionados !== undefined) {
    if (!form.riscosSelecionados.length || (form.riscosDetalhes ?? '').trim().length < 50) motivos.push({ campo: 'riscos', titulo: 'Riscos', mensagem: 'Riscos: marque ao menos 1 risco e descreva o detalhe (50 caracteres)' });
    if (form.riscosSelecionados.some(v => !vincularRisco(v)) || new Set(form.riscosSelecionados).size !== form.riscosSelecionados.length) motivos.push({ campo: 'riscos', titulo: 'Riscos', mensagem: 'Selecione riscos distintos do catálogo' });
  }
  if (form.medidasSelecionadas !== undefined && !form.medidasSelecionadas.length) motivos.push({ campo: 'medidas', titulo: 'Medidas', mensagem: 'Medidas: marque ao menos uma medida adotada' });
  for (const campo of (form.riscosSelecionados !== undefined ? ["medidas"] : ["riscos", "medidas"]) as ("riscos" | "medidas")[]) {
    const atual = (campo === 'medidas' && form.medidasSelecionadas !== undefined ? textoMedidas(form.medidasSelecionadas, form.outrasMedidas) : form[campo]).trim().length;
    const titulo = campo === "riscos" ? "Riscos" : "Medidas";
    if (atual < 30) motivos.push({ campo, titulo, mensagem: `Campo ${campo === 'riscos' ? 'Riscos e consequências' : titulo}: informe ao menos 30 caracteres (atual: ${atual})` });
  }
  if (form.medidasSelecionadas?.some(v => !vincularMedida(v)) || (form.medidasSelecionadas && new Set(form.medidasSelecionadas).size !== form.medidasSelecionadas.length)) motivos.push({ campo: 'medidas', titulo: 'Medidas', mensagem: 'Selecione medidas distintas do catálogo' });
  if (!email.trim()) motivos.push({ campo: "encarregado", titulo: "Encarregado", mensagem: "Nenhum DPO cadastrado para este CNPJ" });
  for (let i = 0; i < 5; i++) if (!passos[i]) motivos.push({ campo: `etapa-${i}`, titulo: `Etapa ${i + 1}`, mensagem: `Etapa ${String(i + 1).padStart(2, "0")} não está concluída` });
  for (const e of evidencias ?? []) if (e.numero <= 5 && e.concluida && (!e.data || !e.responsavel)) motivos.push({ campo: `etapa-${e.numero - 1}`, titulo: `Etapa ${e.numero}`, mensagem: `Etapa ${String(e.numero).padStart(2, '0')} (${e.nome}) ${!e.responsavel ? 'sem responsável registrado' : 'sem data registrada'}` });
  return motivos;
}
export function progressoANPD(form: ComunicacaoANPD, email: string) {
  const motivos = validarANPD(form, email, [true, true, true, true, true]);
  const grupos = [['natureza', 'natureza-outro'], ['categorias'], ['titulares'], ['riscos'], ['medidas'], ['encarregado']];
  return { preenchidos: grupos.filter(g => !motivos.some(m => g.includes(m.campo))).length, total: 6 };
}
export function prepararComunicacaoANPD(form: ComunicacaoANPD) {
  const { naturezasSecundarias = [], naturezaOutro = "", medidasSelecionadas, outrasMedidas = '', categoriasVinculadas, riscosSelecionados, riscosDetalhes = '', ...campos } = form;
  return { ...campos, natureza_principal: vincularNatureza(form.natureza),
    ...(riscosSelecionados !== undefined ? { riscos: textoRiscos(riscosSelecionados, riscosDetalhes), riscos_selecionados: riscosSelecionados.map(vincularRisco), riscos_detalhes: riscosDetalhes.trim(), riscos_versao: VERSAO_RISCOS } : {}),
    ...(categoriasVinculadas ? { categorias_vinculadas: categoriasVinculadas.map(({ valor, fonte_normativa }) => ({ valor, fonte_normativa })), criticidade_comunicacao: categoriasVinculadas.some(c => c.sensivel) ? 'ELEVADA' : 'PADRAO' } : {}),
    ...(medidasSelecionadas !== undefined ? { medidas: textoMedidas(medidasSelecionadas, outrasMedidas), medidas_selecionadas: medidasSelecionadas.map(vincularMedida), outras_medidas: outrasMedidas.trim(), medidas_versao: VERSAO_MEDIDAS } : {}),
    naturezas_secundarias: naturezasSecundarias.map(vincularNatureza),
    natureza_outro: form.natureza === OUTRO || naturezasSecundarias.includes(OUTRO) ? naturezaOutro.trim() : "",
    taxonomia_versao: VERSAO_NATUREZAS };
}
/** Res. CD/ANPD nº 15/2024, art. 6º: 3 dias úteis contados do conhecimento do incidente. */
export const PRAZO_ANPD_DIAS_UTEIS = 3;
export const PRAZO_ANPD_REGRA = "3 dias úteis (Res. CD/ANPD nº 15/2024, art. 6º)";
export const PRAZO_ANPD_DETALHE = "contados do conhecimento do incidente; não inclui fins de semana e feriados";
const DIA_MS = 24 * 3600000;
const HORA_MS = 3600000;
/** Dia útil = segunda a sexta (UTC). Feriados não constam de calendário local; a regra exibida os menciona. */
const diaUtil = (t: number) => { const d = new Date(t).getUTCDay(); return d !== 0 && d !== 6; };

/** Instantâneo limite: conhecimento + 3 dias úteis, preservando o horário do conhecimento. */
export function limiteANPD(inicio: string): number {
  let t = Date.parse(inicio);
  let restantes = PRAZO_ANPD_DIAS_UTEIS;
  while (restantes > 0) { t += DIA_MS; if (diaUtil(t)) restantes--; }
  return t;
}

/** Tempo útil restante até o limite: só soma horas de segunda a sexta; congela no instante de envio. */
export function restanteANPD(inicio: string, enviado: string | null, agora: number): number {
  const limite = limiteANPD(inicio);
  let t = enviado ? Date.parse(enviado) : agora;
  if (t >= limite) return 0;
  let restante = 0;
  while (t < limite) { const passo = Math.min(HORA_MS, limite - t); if (diaUtil(t)) restante += passo; t += passo; }
  return restante;
}
