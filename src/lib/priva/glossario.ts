// Glossário central do produto: cada sigla exibida na interface tem aqui nome, definição,
// exemplo e onde aparece. Fonte única para tooltips (<Sigla>) e para a página /glossario.

export type Termo = { id: string; termo: string; nome?: string; definicao: string; exemplo: string; onde: string };

export const PIS: Record<number, { codigo: string; nome: string }> = {
  1: { codigo: "PI-01", nome: "Dossiê Legal de Alinhamento de Privacidade" },
  2: { codigo: "PI-02", nome: "Registro de Operações de Tratamento (ROT)" },
  3: { codigo: "PI-03", nome: "Book de Evidências Tecnológicas e Contratuais" },
  4: { codigo: "PI-04", nome: "Dossiê de Auditoria de Logs e Resposta de Célula" },
  5: { codigo: "PI-05", nome: "Escudo Jurídico de Dosimetria (RIPD)" },
};

export const GLOSSARIO: Termo[] = [
  { id: "blloco", termo: "Método BLLOCO", definicao: "Sequência de 5 blocos (Preparar, Registrar, Implementar, Vigiar, Auditar) que leva a empresa à conformidade com a LGPD.", exemplo: "O Bloco 2 só abre depois que o PI-01 do Bloco 1 é chancelado.", onde: "Esteira BLLOCO e menu lateral." },
  { id: "ciclo", termo: "Ciclo Privacium Semestral", definicao: "Repetição contínua dos 5 blocos: ao concluir o Bloco 5, um novo diagnóstico reabre o Bloco 1.", exemplo: "Ao finalizar o ciclo no Bloco 5, as assinaturas são limpas para um novo semestre.", onde: "Menu lateral e Bloco 5." },
  { id: "pi", termo: "PI", nome: "Procedimento Interno", definicao: "Documento chancelado que comprova a execução de uma etapa do Método BLLOCO.", exemplo: "PI-01 Dossiê Legal · PI-02 ROT · PI-03 Book de Evidências · PI-04 Dossiê de Auditoria · PI-05 Escudo Jurídico (RIPD).", onde: "Seção “Saída obrigatória” de cada bloco e card de PIs chancelados." },
  ...Object.values(PIS).map((p) => ({ id: p.codigo.toLowerCase(), termo: p.codigo, nome: p.nome, definicao: `Procedimento Interno: ${p.nome}.`, exemplo: `Gerado e assinado na saída obrigatória do Bloco ${p.codigo.slice(-1)}.`, onde: `Bloco ${p.codigo.slice(-1)} e painel.` })),
  { id: "5w2h", termo: "5W2H", nome: "Plano de ação", definicao: "Ferramenta de plano de ação: What (o que), Why (por quê), Who (quem), Where (onde), When (quando), How (como), How much (quanto custa).", exemplo: "“Criptografar notebooks do RH (o quê), por exigência do art. 46 (por quê), TI (quem)…”", onde: "Kanban 5W2H e card de ações abertas." },
  { id: "trilho-core", termo: "Trilho Core", nome: "Registrador central de eventos", definicao: "Registrador central do Método BLLOCO: toda ação relevante gera um evento imutável com hash SHA-256 encadeado.", exemplo: "Assinar um PI grava um evento na trilha.", onde: "Painel e Trilha de Auditoria." },
  { id: "chancela", termo: "Chancela Gov.br", nome: "Chancelado", definicao: "Documento assinado com chancela Gov.br e registrado na trilha imutável.", exemplo: "“Chancelado em 29/10/2026” aparece após a assinatura do PI.", onde: "Saída obrigatória de cada bloco." },
  { id: "score", termo: "Score", nome: "Pontuação ponderada", definicao: "Pontuação ponderada de conformidade, somando os pesos dos itens do Método BLLOCO atendidos.", exemplo: "848 / 1414 significa 848 pontos obtidos de 1414 possíveis.", onde: "Painel e Bloco 1." },
  { id: "eventos", termo: "Evento auditado", definicao: "Cada registro gravado na trilha de auditoria do CNPJ ativo.", exemplo: "Abrir uma tela com dado pessoal gera um evento de leitura.", onde: "Painel e Trilha de Auditoria." },
  { id: "rot", termo: "ROT", nome: "Registro de Operações de Tratamento", definicao: "Inventário exigido pelo art. 37 da LGPD com cada processo que trata dado pessoal.", exemplo: "“Folha de pagamento — RH — hipótese: obrigação legal”.", onde: "Bloco 2." },
  { id: "ripd", termo: "RIPD", nome: "Relatório de Impacto à Proteção de Dados Pessoais", definicao: "Documento que descreve riscos de um tratamento e as medidas para mitigá-los (art. 5º, XVII).", exemplo: "RIPD do sistema de IA usado no atendimento.", onde: "Bloco 5." },
  { id: "dpo", termo: "DPO", nome: "Encarregado pelo tratamento de dados pessoais", definicao: "Pessoa indicada para ser o canal entre empresa, titulares e ANPD (art. 41).", exemplo: "O DPO assina os PIs e comunica incidentes à ANPD.", onde: "Membros e Bloco 4." },
  { id: "encarregado", termo: "Encarregado", definicao: "Nome legal do DPO na LGPD; seu contato público fica cadastrado por CNPJ.", exemplo: "Nome, e-mail e telefone publicados no aviso de privacidade.", onde: "Membros e formulário ANPD." },
  { id: "anpd", termo: "ANPD", nome: "Autoridade Nacional de Proteção de Dados", definicao: "Órgão federal que fiscaliza a LGPD e recebe comunicações de incidentes.", exemplo: "Comunicação em até 3 dias úteis para incidente de impacto relevante.", onde: "Bloco 4." },
  { id: "lgpd", termo: "LGPD", nome: "Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018)", definicao: "Lei brasileira que regula o tratamento de dados pessoais.", exemplo: "Art. 37 exige o ROT.", onde: "Toda a plataforma." },
  { id: "dado-pessoal", termo: "Dado pessoal", definicao: "Informação relacionada a pessoa natural identificada ou identificável (art. 5º, I).", exemplo: "Nome, CPF, e-mail.", onde: "Bloco 2 (ROT)." },
  { id: "dado-sensivel", termo: "Dado pessoal sensível", definicao: "Dado pessoal sobre origem racial, saúde, religião, biometria, entre outros (art. 5º, II).", exemplo: "Atestado médico de um colaborador.", onde: "Bloco 2 (campo 7B) e formulário ANPD." },
  { id: "dado-anonimizado", termo: "Dado anonimizado", definicao: "Dado que não permite identificar o titular por meios razoáveis (art. 5º, III).", exemplo: "Estatística de faixa etária sem nomes.", onde: "Manual e Bloco 2." },
  { id: "incidente", termo: "Incidente de impacto relevante", definicao: "Incidente de segurança que pode causar risco ou dano relevante aos titulares e exige comunicação à ANPD.", exemplo: "Vazamento de base de clientes com CPF.", onde: "Bloco 4." },
  { id: "anonimizacao", termo: "Anonimização", definicao: "Técnica que torna irreversível a associação do dado ao titular.", exemplo: "Remover nome e CPF e agregar por região.", onde: "Manual." },
  { id: "pseudonimizacao", termo: "Pseudonimização", definicao: "Substituição do identificador por código, reversível apenas com informação mantida em separado (art. 13, §4º).", exemplo: "Trocar CPF por “PAC-0042”.", onde: "Manual e Bloco 3." },
  { id: "privacy-default", termo: "Privacy by Default", nome: "Privacidade por padrão", definicao: "Configuração em que o sistema coleta e expõe o mínimo de dado pessoal sem ação do usuário.", exemplo: "CPF aparece mascarado até clicar no olho.", onde: "Toda a plataforma." },
  { id: "rls", termo: "RLS", nome: "Segurança em nível de linha", definicao: "Regra do banco que só entrega a cada usuário as linhas da empresa a que ele pertence.", exemplo: "Um DPO não enxerga dados de outro CNPJ.", onde: "Proteção interna da plataforma." },
  { id: "sha256", termo: "Hash SHA-256", nome: "Impressão digital criptográfica", definicao: "Código de 64 caracteres que muda totalmente se um único bit do conteúdo for alterado.", exemplo: "Rodapé do PDF do PI com o hash do documento.", onde: "PDFs, trilha e cofres do Bloco 3." },
  { id: "rbac", termo: "RBAC", nome: "Controle de acesso por cargo", definicao: "Cada cargo (Administrador, DPO, C-Suite) vê apenas as telas que lhe cabem.", exemplo: "C-Suite não vê dado pessoal bruto.", onde: "Menu lateral e Membros." },
];

export const termo = (id: string) => GLOSSARIO.find((t) => t.id === id);

/** Faixas visuais do Grau de Maturidade. */
export const FAIXAS_GM = [
  { ate: 25, nome: "Inicial" },
  { ate: 50, nome: "Em desenvolvimento" },
  { ate: 75, nome: "Tática" },
  { ate: 100, nome: "Otimizada" },
] as const;

export function faixaGM(gm: number) {
  const i = FAIXAS_GM.findIndex((f) => gm <= f.ate);
  const idx = i < 0 ? 3 : i;
  return { indice: idx, nome: FAIXAS_GM[idx].nome, proxima: FAIXAS_GM[idx + 1]?.nome ?? null };
}
