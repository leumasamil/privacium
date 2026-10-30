/**
 * Pedagogia normativa: textos fixos e determinísticos que explicam cada citação
 * legal/normativa exibida nas telas. Nenhum conteúdo é gerado por IA; se o
 * dispositivo não estiver aqui, a tela exibe só a citação, sem explicação.
 */
export type Norma = { citacao: string; resumo: string; porque: string };

export const NORMAS: Record<string, Norma> = {
  "LGPD art. 5º, I": {
    citacao: "LGPD art. 5º, I",
    resumo: "Dado pessoal: qualquer informação relacionada a pessoa natural identificada ou identificável.",
    porque: "Define o alcance de tudo que o seu ROT deve registrar.",
  },
  "LGPD art. 5º, II": {
    citacao: "LGPD art. 5º, II",
    resumo: "Dado pessoal sensível: informação sobre origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, saúde, vida sexual, dado genético ou biométrico vinculado a pessoa natural.",
    porque: "Esses dados exigem hipótese de tratamento mais restrita (art. 11) e proteção reforçada.",
  },
  "LGPD art. 5º, III": {
    citacao: "LGPD art. 5º, III",
    resumo: "Dado anonimizado: dado que, por meios técnicos razoáveis, não pode mais ser associado a um indivíduo.",
    porque: "Dado verdadeiramente anonimizado sai do escopo da LGPD — mas a anonimização precisa ser comprovável.",
  },
  "LGPD art. 7º": {
    citacao: "LGPD art. 7º",
    resumo: "Lista as dez hipóteses que autorizam o tratamento de dado pessoal (consentimento, obrigação legal, legítimo interesse, entre outras).",
    porque: "Nenhum processo do seu ROT é válido sem uma dessas hipóteses preenchida no campo 7A.",
  },
  "LGPD art. 11": {
    citacao: "LGPD art. 11",
    resumo: "Lista as hipóteses específicas que autorizam o tratamento de dado pessoal sensível.",
    porque: "Quando o processo trata dado pessoal sensível, o campo 7B precisa de uma hipótese deste artigo.",
  },
  "LGPD art. 20": {
    citacao: "LGPD art. 20",
    resumo: "Garante ao titular a revisão de decisões tomadas unicamente com base em tratamento automatizado que afetem seus interesses.",
    porque: "Se a sua IA ranqueia currículos ou crédito, você precisa de revisão humana documentada.",
  },
  "LGPD art. 37": {
    citacao: "LGPD art. 37",
    resumo: "Obriga o controlador e o operador a manter registro das operações de tratamento de dados pessoais.",
    porque: "É a base legal do seu ROT (PI-02): sem registro, não há como prestar contas à ANPD.",
  },
  "LGPD art. 38": {
    citacao: "LGPD art. 38",
    resumo: "Autoriza a ANPD a exigir relatório de impacto à proteção de dados pessoais (RIPD) do controlador.",
    porque: "O RIPD algorítmico do Bloco 5 é a sua resposta pronta caso a ANPD solicite.",
  },
  "LGPD art. 41": {
    citacao: "LGPD art. 41",
    resumo: "Obriga o controlador a indicar um encarregado pelo tratamento de dados pessoais (DPO) e a divulgar sua identidade publicamente.",
    porque: "O cadastro do Encarregado nesta plataforma cumpre essa exigência de publicidade.",
  },
  "LGPD art. 46": {
    citacao: "LGPD art. 46",
    resumo: "Exige medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.",
    porque: "É a base legal das salvaguardas do Bloco 3: criptografia de endpoint, cofres e o Escudo Digital.",
  },
  "LGPD art. 48": {
    citacao: "LGPD art. 48",
    resumo: "Obriga o controlador a comunicar à ANPD e aos titulares qualquer incidente de segurança que possa acarretar risco ou dano relevante.",
    porque: "É a obrigação que o formulário assistido do Bloco 4 cumpre dentro do prazo regulamentar.",
  },
  "Res. CD/ANPD nº 15/2024": {
    citacao: "Res. CD/ANPD nº 15/2024",
    resumo: "Regulamenta a comunicação de incidente de segurança à ANPD: prazo de 3 dias úteis, conteúdo mínimo da comunicação e obrigações de registro.",
    porque: "Define o SLA de 72 horas e os campos obrigatórios que o formulário ANPD desta plataforma valida.",
  },
  "Res. CD/ANPD nº 4/2023": {
    citacao: "Res. CD/ANPD nº 4/2023",
    resumo: "Regulamenta a dosimetria das sanções administrativas da LGPD, incluindo atenuantes por boas práticas e governança comprovadas.",
    porque: "É a base do simulador do Bloco 5: evidências de governança reduzem a multa estimada.",
  },
  "ISO/IEC 27002": {
    citacao: "ISO/IEC 27002",
    resumo: "Catálogo internacional de controles de segurança da informação (criptografia, gestão de acessos, proteção contra vazamento).",
    porque: "As medidas de mitigação sugeridas citam o controle exato que você pode auditar depois.",
  },
  "ISO/IEC 27037": {
    citacao: "ISO/IEC 27037",
    resumo: "Diretrizes para identificação, coleta e preservação de evidência digital com cadeia de custódia.",
    porque: "É a norma que justifica a trilha de auditoria com hash SHA-256 encadeado desta plataforma.",
  },
  "ISO/IEC 42001": {
    citacao: "ISO/IEC 42001",
    resumo: "Sistema de gestão de inteligência artificial: governança, avaliação de risco e controles para sistemas de IA.",
    porque: "Estrutura o RIPD algorítmico do Bloco 5 e as medidas contra viés e injeção de prompts.",
  },
  "ISO/IEC 27701": {
    citacao: "ISO/IEC 27701",
    resumo: "Extensão da ISO 27001 para gestão de privacidade da informação (PIMS).",
    porque: "Referência do laudo técnico do PI-03 sobre salvaguardas do art. 46.",
  },
  "CIS Control 03": {
    citacao: "CIS Control 03",
    resumo: "Proteção de dados: inventariar, classificar e proteger dados sensíveis contra exfiltração (inclui DLP e mascaramento).",
    porque: "É o controle que o Escudo Digital implementa ao tokenizar dado pessoal antes de enviar a uma IA externa.",
  },
  "CIS Control 16": {
    citacao: "CIS Control 16",
    resumo: "Segurança de aplicações: validar entradas, isolar execução e registrar atividade das aplicações.",
    porque: "Base da mitigação contra injeção de prompts: sanitização de entrada e sandbox do modelo.",
  },
};

/** Busca tolerante: aceita a citação exata ou um trecho contido nela. */
export function buscarNorma(citacao: string): Norma | null {
  const direta = NORMAS[citacao];
  if (direta) return direta;
  const chave = Object.keys(NORMAS).find((k) => citacao.includes(k) || k.includes(citacao.trim()));
  return (chave ? NORMAS[chave] : undefined) ?? null;
}
