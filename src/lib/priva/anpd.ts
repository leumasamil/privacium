import { OUTRO, vincularNatureza, VERSAO_NATUREZAS } from "./naturezasIncidente";
import { textoMedidas, vincularMedida, VERSAO_MEDIDAS } from './medidasIncidente';
export type ComunicacaoANPD = {
  natureza: string;
  naturezasSecundarias?: string[];
  naturezaOutro?: string;
  categorias: string[];
  titulares: string;
  riscos: string;
  medidas: string;
  medidasSelecionadas?: string[];
  outrasMedidas?: string;
};
export type MotivoANPD = { campo: string; titulo: string; mensagem: string };
export function validarANPD(form: ComunicacaoANPD, email: string, passos: boolean[]): MotivoANPD[] {
  const motivos: MotivoANPD[] = [];
  if (!vincularNatureza(form.natureza)) motivos.push({ campo: "natureza", titulo: "Natureza", mensagem: "Campo Natureza: selecione uma natureza principal do catálogo" });
  const secundarias = form.naturezasSecundarias ?? [];
  if (secundarias.some(n => !vincularNatureza(n) || n === form.natureza) || new Set(secundarias).size !== secundarias.length) motivos.push({ campo: "natureza", titulo: "Naturezas secundárias", mensagem: "Selecione naturezas secundárias distintas da principal, dentro do catálogo" });
  if ((form.natureza === OUTRO || secundarias.includes(OUTRO)) && !form.naturezaOutro?.trim()) motivos.push({ campo: "natureza-outro", titulo: "Descrição de Outro", mensagem: "Campo Outro: descreva a natureza do incidente" });
  if (!form.categorias.length) motivos.push({ campo: "categorias", titulo: "Categorias", mensagem: "Campo Categorias: selecione ao menos uma opção" });
  if (!/^\d+$/.test(form.titulares) || Number(form.titulares) < 1 || !Number.isSafeInteger(Number(form.titulares))) motivos.push({ campo: "titulares", titulo: "Titulares", mensagem: "Campo Titulares: informe um número inteiro, mínimo 1" });
  for (const campo of ["riscos", "medidas"] as const) {
    const atual = (campo === 'medidas' && form.medidasSelecionadas !== undefined ? textoMedidas(form.medidasSelecionadas, form.outrasMedidas) : form[campo]).trim().length;
    const titulo = campo === "riscos" ? "Riscos" : "Medidas";
    if (atual < 30) motivos.push({ campo, titulo, mensagem: `Campo ${titulo}: informe ao menos 30 caracteres (atual: ${atual})` });
  }
  if (form.medidasSelecionadas?.some(v => !vincularMedida(v)) || (form.medidasSelecionadas && new Set(form.medidasSelecionadas).size !== form.medidasSelecionadas.length)) motivos.push({ campo: 'medidas', titulo: 'Medidas', mensagem: 'Selecione medidas distintas do catálogo' });
  if (!email.trim()) motivos.push({ campo: "encarregado", titulo: "Encarregado", mensagem: "Nenhum DPO cadastrado para este CNPJ" });
  for (let i = 0; i < 5; i++) if (!passos[i]) motivos.push({ campo: `etapa-${i}`, titulo: `Etapa ${i + 1}`, mensagem: `Etapa ${String(i + 1).padStart(2, "0")} não está concluída` });
  return motivos;
}
export function prepararComunicacaoANPD(form: ComunicacaoANPD) {
  const { naturezasSecundarias = [], naturezaOutro = "", medidasSelecionadas, outrasMedidas = '', ...campos } = form;
  return { ...campos, natureza_principal: vincularNatureza(form.natureza),
    ...(medidasSelecionadas !== undefined ? { medidas: textoMedidas(medidasSelecionadas, outrasMedidas), medidas_selecionadas: medidasSelecionadas.map(vincularMedida), outras_medidas: outrasMedidas.trim(), medidas_versao: VERSAO_MEDIDAS } : {}),
    naturezas_secundarias: naturezasSecundarias.map(vincularNatureza),
    natureza_outro: form.natureza === OUTRO || naturezasSecundarias.includes(OUTRO) ? naturezaOutro.trim() : "",
    taxonomia_versao: VERSAO_NATUREZAS };
}
export function restanteANPD(inicio: string, enviado: string | null, agora: number): number {
  return Math.max(0, 72 * 3600000 - ((enviado ? Date.parse(enviado) : agora) - Date.parse(inicio)));
}