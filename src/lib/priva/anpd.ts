export type ComunicacaoANPD = {
  natureza: string;
  categorias: string[];
  titulares: string;
  riscos: string;
  medidas: string;
};
export type MotivoANPD = { campo: string; titulo: string; mensagem: string };
export function validarANPD(form: ComunicacaoANPD, email: string, passos: boolean[]): MotivoANPD[] {
  const motivos: MotivoANPD[] = [];
  if (!form.natureza.trim()) motivos.push({ campo: "natureza", titulo: "Natureza", mensagem: "Campo Natureza: informe o tipo do incidente" });
  if (!form.categorias.length) motivos.push({ campo: "categorias", titulo: "Categorias", mensagem: "Campo Categorias: selecione ao menos uma opção" });
  if (!/^\d+$/.test(form.titulares) || Number(form.titulares) < 1 || !Number.isSafeInteger(Number(form.titulares))) motivos.push({ campo: "titulares", titulo: "Titulares", mensagem: "Campo Titulares: informe um número inteiro, mínimo 1" });
  for (const campo of ["riscos", "medidas"] as const) {
    const atual = form[campo].trim().length;
    const titulo = campo === "riscos" ? "Riscos" : "Medidas";
    if (atual < 30) motivos.push({ campo, titulo, mensagem: `Campo ${titulo}: informe ao menos 30 caracteres (atual: ${atual})` });
  }
  if (!email.trim()) motivos.push({ campo: "encarregado", titulo: "Encarregado", mensagem: "Nenhum DPO cadastrado para este CNPJ" });
  for (let i = 0; i < 5; i++) if (!passos[i]) motivos.push({ campo: `etapa-${i}`, titulo: `Etapa ${i + 1}`, mensagem: `Etapa ${String(i + 1).padStart(2, "0")} não está concluída` });
  return motivos;
}
export function restanteANPD(inicio: string, enviado: string | null, agora: number): number {
  return Math.max(0, 72 * 3600000 - ((enviado ? Date.parse(enviado) : agora) - Date.parse(inicio)));
}