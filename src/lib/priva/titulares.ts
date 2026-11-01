export const DIREITOS = [
  ['I', 'Confirmação da existência de tratamento'], ['II', 'Acesso'], ['III', 'Correção'],
  ['IV', 'Anonimização, bloqueio ou eliminação'], ['V', 'Portabilidade'], ['VI', 'Eliminação mediante consentimento'],
  ['VII', 'Informação sobre destinatários'], ['VIII', 'Informação sobre consentimento'], ['IX', 'Revogação do consentimento'],
] as const;
export const NOTA_PRAZO_METODO = 'A LGPD fixa prazo específico apenas para confirmação e acesso (art. 19, II). Para os demais direitos, o art. 18, § 5º remete a regulamento. O prazo de 15 dias aqui aplicado é regra interna do método, não prazo legal.';
export const tipoPrazo = (direito: string) => ['I', 'II'].includes(direito) ? 'LEGAL' : 'METODO';
export function prazoTitular(recebimento: string) {
  const d = new Date(`${recebimento}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 15); return d.toISOString().slice(0, 10);
}
export function estadoPrazo(prazo: string, hoje = new Date().toISOString().slice(0, 10)) {
  const dias = Math.round((Date.parse(`${prazo}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000);
  return { dias, alerta: dias < 0 ? 'ATRASADA' : dias <= 2 ? 'D-2' : dias <= 5 ? 'D-5' : 'NO_PRAZO' };
}
export const statusInicialTitular = (papel?: string) => papel === 'OPERADOR' ? 'ENCAMINHADA_CONTROLADOR' : 'ABERTA';