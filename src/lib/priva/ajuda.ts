export type Ajuda5W2H = {
  bloco: number;
  titulo: string;
  oQue: string;
  porQue: string;
  quem: string;
  onde: string;
  quando: string;
  como?: string;
  quanto: string;
  passos: string[];
  errosComuns: string[];
};

export const AJUDA: Record<number, Ajuda5W2H> = {
  1: {
    bloco: 1,
    titulo: "Responder ao diagnóstico de maturidade",
    oQue: "Responder às 166 perguntas do diagnóstico, organizadas por setor e por categoria LGPD.",
    porQue: "Medir o Grau de Maturidade (GM) e identificar a zona de risco da empresa.",
    quem: "DPO/Encarregado responde; gestores de cada setor validam suas respostas.",
    onde: "Bloco 1, nas abas por setor. Cada resposta é salva no CNPJ ativo e no CPF do auditor.",
    quando: "No início de cada Ciclo Privacium Semestral. O Delta de Riscos herda as respostas anteriores.",
    quanto: "GM = pontos obtidos ÷ soma dos pesos (1.414). Meta: 76% ou mais (zona verde).",
    passos: [
      "Confirme no topo da tela o CNPJ ativo e o seu papel (DPO/Encarregado).",
      "Abra a aba do primeiro setor listado e leia a categoria LGPD indicada na pergunta.",
      "Responda Sim/Não com base em evidência real — não presuma conformidade sem documento.",
      "Ao finalizar um setor, revise as respostas marcadas como \"não\" e registre a pendência.",
      "Repita para todos os setores e confira o GM atualizado no painel lateral.",
      "Abra o PI-01, revise o dossiê consolidado e assine para chancelar o bloco.",
    ],
    errosComuns: [
      "Responder \"Sim\" sem evidência.",
      "Pular setores.",
      "Assinar o PI-01 antes de revisar todos os setores.",
      "Não conferir se o CNPJ ativo é o correto antes de começar.",
    ],
  },
  2: {
    bloco: 2,
    titulo: "Preencher o Registro de Operações de Tratamento (ROT)",
    oQue: "Inventariar cada operação de tratamento nos 12 campos do ROT (art. 37).",
    porQue: "Comprovar a hipótese de tratamento de cada dado pessoal e de cada dado pessoal sensível.",
    quem: "DPO preenche, gestor do processo fornece as informações, Diretoria assina junto.",
    onde: "Bloco 2, planilha mestre. O ID Processo é gerado automaticamente no padrão PRIVA-<SETOR>-NNN.",
    quando: "Sempre que surgir um novo processo, e revisão obrigatória a cada semestre.",
    quanto: "Nenhuma operação de tratamento pode ficar fora do ROT (art. 37, LGPD).",
    passos: [
      "Clique em \"Novo processo\" e preencha o campo 1 (nome do tratamento) com um nome objetivo e verificável.",
      "Selecione o campo 2 (área responsável). O ID Processo é gerado após salvar.",
      "No campo 3, marque todas as categorias de titulares — inclua \"Menores de Idade\" se houver, pois isso eleva a criticidade.",
      "No campo 4, marque TODOS os dados pessoais coletados. Se houver dúvida, marque — a omissão é mais grave que o excesso.",
      "No campo 5, marque os dados pessoais sensíveis. Se não houver nenhum, mantenha \"N/A\" — o campo 7B ficará automaticamente bloqueado.",
      "Verifique o campo 7A: se houver apenas dado pessoal, selecione a hipótese do art. 7º correspondente à finalidade. Se houver dado pessoal sensível, o 7B será desbloqueado e exigirá uma hipótese do art. 11.",
      "Preencha o campo 6 (finalidade específica) descrevendo o resultado esperado do tratamento, não a operação técnica.",
      "Nos campos 8 e 9, informe o prazo de retenção e o fundamento normativo do prazo — o campo 9 é obrigatório quando o 8 estiver preenchido.",
      "Nos campos 10, 11 e 12, registre destinatários, salvaguardas e infraestrutura.",
      "Revise as sugestões automáticas, ajuste o que for necessário e salve.",
      "Se a linha envolver menores de idade ou dado pessoal sensível, justifique as medidas mitigadoras no campo indicado.",
      "Após revisar todos os processos, abra o PI-02 e colete as duas assinaturas (DPO e Diretoria) para chancelar.",
    ],
    errosComuns: [
      "Usar legítimo interesse (art. 7º, IX) ou proteção do crédito (art. 7º, X) para dado pessoal sensível — essas hipóteses não existem no art. 11.",
      "Deixar o campo 8 sem o campo 9.",
      "Descrever a finalidade com jargão técnico em vez do resultado esperado.",
      "Salvar sem justificar medidas mitigadoras quando há menores ou dado pessoal sensível.",
    ],
  },
  3: {
    bloco: 3,
    titulo: "Cadastrar ativos e cofres de segurança",
    oQue: "Registrar os ativos de segurança (ENDPOINT/COFRE) e as chaves de recuperação.",
    porQue: "Comprovar tecnicamente as salvaguardas declaradas no ROT.",
    quem: "DPO e ADMIN_SISTEMA. As chaves de recuperação são visíveis apenas para DPO e ADMIN.",
    onde: "Bloco 3. Chaves ficam em tabela separada, carregadas sob demanda e com log de auditoria.",
    quando: "Na implantação, e revisão a cada semestre ou a cada novo ativo.",
    quanto: "Hash de integridade da pasta = SHA-256 da raiz + caminhos ordenados.",
    passos: [
      "Liste todos os endpoints e cofres que armazenam dados pessoais da empresa.",
      "Para cada ativo, crie um registro informando tipo, responsável e localização.",
      "Ative o BitLocker nos endpoints e registre a chave de recuperação no cofre correspondente.",
      "Confirme que a chave de recuperação está associada ao ativo correto.",
      "Gere o hash de integridade da pasta e registre-o no ativo.",
      "Revise se cada salvaguarda declarada no ROT tem um ativo correspondente neste bloco.",
      "Abra o PI-03, revise o Book de Evidências e assine para chancelar.",
    ],
    errosComuns: [
      "Declarar salvaguarda no ROT sem ativo correspondente no Bloco 3.",
      "Guardar chave de recuperação fora do cofre.",
      "Não revisar o hash após alteração na pasta.",
    ],
  },
  4: {
    bloco: 4,
    titulo: "Registrar lotes de auditoria e incidentes",
    oQue: "Registrar os lotes mensais de auditoria de logs e os incidentes de segurança.",
    porQue: "Demonstrar vigilância contínua e resposta dentro do prazo legal.",
    quem: "DPO conduz; ADMIN_SISTEMA fornece os logs.",
    onde: "Bloco 4. Cada lote recebe hash SHA-256 próprio.",
    quando: "Lotes mensais; incidentes imediatamente após a detecção.",
    quanto: "SLA de 72 horas para tratamento do incidente, em 6 etapas, com preenchimento do formulário ANPD.",
    passos: [
      "Gere, ao fim de cada mês, o lote de auditoria com os logs do período.",
      "Confira o hash SHA-256 do lote e registre-o.",
      "Abra o registro imediatamente se houver incidente — não aguarde o fechamento do mês.",
      "Classifique a severidade e o volume de titulares afetados.",
      "Percorra as 6 etapas do fluxo de resposta, registrando data e responsável em cada uma.",
      "Comunique a ANPD e os afetados dentro do prazo se houver risco relevante aos titulares.",
      "Anexe as evidências e abra o PI-04 para revisão e assinatura.",
    ],
    errosComuns: [
      "Aguardar o fechamento do mês para registrar incidente.",
      "Deixar etapa sem responsável ou data.",
      "Não anexar evidência da contenção.",
    ],
  },
  5: {
    bloco: 5,
    titulo: "Elaborar o RIPD e calcular a dosimetria",
    oQue: "Elaborar o Relatório de Impacto à Proteção de Dados Pessoais e calcular a dosimetria.",
    porQue: "Reduzir eventual multa (Resolução CD/ANPD nº 4/2023) e comprovar boa-fé.",
    quem: "DPO e Diretoria.",
    onde: "Bloco 5.",
    quando: "Ao final de cada semestre.",
    quanto: "Atenuação máxima de 75% (PI-01+02 = 20%, PI-03 = 20%, PI-04 = 20%, PI-05 = 15%).",
    passos: [
      "Confirme que os blocos 1 a 4 estão chancelados — a dosimetria depende deles.",
      "Identifique os tratamentos com dado pessoal sensível ou alto risco e que exigem RIPD.",
      "Descreva, para cada um, a necessidade e a proporcionalidade do tratamento.",
      "Registre as medidas de mitigação efetivamente implementadas no Bloco 3.",
      "Preencha os campos do RIPD no formulário do Bloco 5.",
      "Revise os atenuantes e confira o cálculo automático da dosimetria.",
      "Abra o PI-05, revise o Escudo Jurídico e assine para encerrar o ciclo.",
      "Finalize o ciclo: as assinaturas são limpas e o Bloco 1 é reaberto.",
    ],
    errosComuns: [
      "Elaborar o RIPD antes de concluir os blocos anteriores.",
      "Citar medida de mitigação que não tem evidência no Bloco 3.",
      "Não revisar o percentual de atenuação antes de assinar.",
    ],
  },
};
