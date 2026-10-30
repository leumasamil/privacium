/** Passo operacional: o que clicar, o que deve aparecer e o que verificar se não aparecer. */
export type Passo = { titulo: string; acao: string; resultado: string; seNao: string };

export type Ajuda5W2H = {
  bloco: number;
  titulo: string;
  oQue: string;
  porQue: string;
  quem: string;
  onde: string;
  quando: string;
  /** Resumo acionável (2–3 linhas) da sequência — nunca um índice. */
  como: string;
  quanto: string;
  passos: Passo[];
  errosComuns: string[];
};

const p = (titulo: string, acao: string, resultado: string, seNao: string): Passo => ({ titulo, acao, resultado, seNao });

export const AJUDA: Record<number, Ajuda5W2H> = {
  1: {
    bloco: 1,
    titulo: "Responder ao diagnóstico de maturidade",
    oQue: "Responder às 166 perguntas do diagnóstico, organizadas por setor e por categoria LGPD.",
    porQue: "Medir o Grau de Maturidade (GM) e identificar a zona de risco da empresa.",
    quem: "DPO_OPERACIONAL responde; gestores de cada setor validam as respostas do próprio setor.",
    onde: "Bloco 1, na lista de setores à esquerda. Cada resposta é salva no CNPJ ativo e no CPF do auditor.",
    quando: "No início de cada Ciclo Privacium Semestral. O Delta de Riscos herda as respostas anteriores.",
    como: "Confira o CNPJ ativo, abra um setor por vez na lista à esquerda e clique em SIM ou NÃO em cada pergunta — cada clique já é salvo. Revise os \"não\", conclua todos os setores, confira o GM e assine o PI-01 em \"Gerar e assinar\". O detalhe de cada clique está nos 7 passos abaixo.",
    quanto: "GM = pontos obtidos ÷ soma dos pesos (1.414). Meta: 76% ou mais (zona verde).",
    passos: [
      p("Confirmar o contexto", "Leia o CNPJ ativo e o seu perfil no menu lateral. Troque o CNPJ no seletor se estiver errado.", "O nome da empresa correta aparece no menu lateral.", "Se o CNPJ estiver errado, as respostas serão gravadas na empresa errada — troque antes de responder."),
      p("Abrir o setor", "Clique no nome do setor na lista à esquerda (ex.: Financeiro). O contador ao lado mostra respondidas/total.", "O quadro à direita passa a mostrar as perguntas daquele setor, com a categoria LGPD de cada uma.", "Se a lista estiver vazia, confira se você tem o perfil DPO_OPERACIONAL ou ADMIN_SISTEMA."),
      p("Responder com evidência", "Clique em SIM ou NÃO em cada pergunta. Só clique em SIM se houver documento ou prática comprovável.", "O botão escolhido fica destacado e o contador do setor aumenta — não há botão de salvar.", "Se o contador não mudar, verifique a conexão; a resposta só conta depois de gravada."),
      p("Tratar as negativas", "Ao fechar o setor, releia as perguntas marcadas como NÃO e crie um cartão para cada uma no Kanban 5W2H.", "Cada \"não\" vira um cartão em \"A Fazer\" no Kanban.", "Se não conseguir criar o cartão, confira se o campo \"O quê?\" do Kanban foi preenchido."),
      p("Repetir nos demais setores", "Clique no próximo setor da lista e repita até todos mostrarem contador completo.", "Todos os setores exibem respondidas = total.", "Setor com contador incompleto mantém o bloco aberto — volte a ele."),
      p("Conferir o GM", "Leia o Grau de Maturidade no painel do Bloco 1.", "O GM aparece em percentual com a zona (verde a partir de 76%).", "Se o GM não mudar, confira se as respostas foram gravadas no CNPJ correto."),
      p("Assinar o PI-01", "Na seção \"Saída obrigatória\", clique em [Gerar e assinar], revise o dossiê e clique em [Assinar com Gov.br (simulado)].", "Aparece \"Chancelado em…\" com o hash SHA-256 e o Bloco 2 é liberado.", "Se o botão estiver desativado, ainda há perguntas sem resposta."),
    ],
    errosComuns: ["Marcar \"Sim\" sem evidência documental.", "Pular setores ou deixar perguntas em branco.", "Assinar o PI-01 antes de revisar todas as respostas.", "Não conferir se o CNPJ ativo é o correto."],
  },
  2: {
    bloco: 2,
    titulo: "Registrar as operações de tratamento (ROT)",
    oQue: "Inventariar cada operação de tratamento nos 12 campos do ROT (art. 37).",
    porQue: "Comprovar a hipótese de tratamento de cada dado pessoal e de cada dado pessoal sensível.",
    quem: "DPO_OPERACIONAL preenche; o gestor do processo fornece as informações; a Diretoria (C_SUITE) assina junto.",
    onde: "Bloco 2, planilha mestre. O ID é gerado no padrão PRIVA-<SETOR>-NNN.",
    quando: "Ao surgir um novo processo e na revisão semestral obrigatória.",
    como: "Clique em [Novo processo], preencha os 12 campos (o 7A sempre; o 7B só quando houver dado pessoal sensível), aplique as sugestões automáticas e clique em [Salvar processo]. Com todos os processos registrados, colete as assinaturas do DPO e da Diretoria no PI-02. O detalhe de cada clique está nos 12 passos abaixo.",
    quanto: "Nenhuma operação pode ficar fora do ROT (art. 37).",
    passos: [
      p("Criar o processo", "Clique em [Novo processo] e preencha o campo 1 com um nome objetivo.", "O formulário dos 12 campos abre abaixo da planilha.", "Se o botão não aparecer, seu perfil não tem permissão de edição — peça ao DPO_OPERACIONAL."),
      p("Selecionar a área", "Escolha o setor em \"Área › Setor (gera o ID Processo)\".", "Ao salvar pela primeira vez, o processo recebe o ID PRIVA-<SETOR>-NNN.", "Sem setor, o ID não é gerado e o salvamento é recusado."),
      p("Marcar titulares", "No campo 3, marque todas as categorias de titulares, incluindo \"Menores de Idade\" quando houver.", "As categorias ficam marcadas; com menores, aparece o aviso de criticidade e o pedido de justificativa.", "Se não aparecer o aviso com menores, confira se a opção foi realmente marcada."),
      p("Marcar dados pessoais", "No campo 4, marque todos os dados pessoais coletados. Em dúvida, marque.", "Os dados ficam listados no processo.", "Omissão é mais grave que excesso no ROT — revise com o gestor do processo."),
      p("Marcar dado pessoal sensível", "No campo 5, marque cada categoria de dado pessoal sensível ou mantenha \"N/A\".", "Com \"N/A\", o campo 7B fica desativado; com dado pessoal sensível, o 7B é liberado e passa a ser obrigatório.", "Se o 7B continuar desativado, retire o \"N/A\" do campo 5."),
      p("Definir a hipótese do art. 7º (7A)", "No campo 7A, selecione a hipótese do art. 7º compatível com a finalidade.", "A hipótese aparece selecionada e o aviso de pendência do 7A some.", "O 7A é sempre obrigatório — sem ele, [Salvar processo] fica desativado."),
      p("Definir a hipótese do art. 11 (7B)", "Se houver dado pessoal sensível, selecione no 7B a hipótese do art. 11.", "O aviso vermelho do 7B some.", "Legítimo interesse e proteção do crédito não existem no art. 11 e não aparecem na lista."),
      p("Descrever a finalidade", "No campo 6, descreva o resultado esperado. Ex.: \"Calcular a folha e emitir holerites\".", "O texto fica salvo no processo.", "Jargão técnico (\"acessar a base de RH\") não descreve finalidade — reescreva."),
      p("Definir retenção e fundamento", "Preencha os campos 8 (prazo) e 9 (fundamento do prazo).", "Os dois campos aparecem preenchidos.", "O campo 9 é exigido sempre que o 8 estiver preenchido."),
      p("Completar o restante", "Preencha os campos 10 (destinatários), 11 (salvaguardas) e 12 (infraestrutura).", "Todos os 12 campos ficam preenchidos.", "Campo vazio aparece na mensagem de pendência acima do botão de salvar."),
      p("Justificar a mitigação", "Havendo menores ou dado pessoal sensível, escreva a justificativa das medidas mitigadoras (mínimo 20 caracteres).", "O aviso de justificativa some.", "Sem justificativa, o sistema bloqueia o salvamento."),
      p("Salvar e assinar", "Clique em [Salvar processo]. Depois, em \"Saída obrigatória\", clique em [Gerar e assinar] e colete a assinatura do DPO e a da Diretoria.", "O processo entra na planilha; com as duas assinaturas, o PI-02 fica CHANCELADO.", "Com só uma assinatura o bloco não é chancelado — solicite a outra."),
    ],
    errosComuns: ["Usar art. 7º, IX (legítimo interesse) ou art. 7º, X (proteção do crédito) para dado pessoal sensível.", "Preencher o campo 8 sem o campo 9.", "Descrever a finalidade com jargão técnico.", "Salvar sem justificar as medidas mitigadoras."],
  },
  3: {
    bloco: 3,
    titulo: "Implementar salvaguardas técnicas",
    oQue: "Registrar os ativos de segurança (computadores e cofres) e as chaves de recuperação.",
    porQue: "Comprovar tecnicamente as salvaguardas declaradas no ROT (art. 46).",
    quem: "DPO_OPERACIONAL e ADMIN_SISTEMA; as chaves são visíveis só a DPO/ADMIN, com registro na trilha.",
    onde: "Bloco 3: quadro BitLocker (computadores) e quadro Cryptomator (cofres).",
    quando: "Na implantação, na revisão semestral e a cada novo ativo.",
    como: "Cadastre cada computador pelo ID do hardware e hostname, marque-o como protegido e registre a chave de recuperação. Catalogue cada cofre com diretório e estrutura para gerar o hash. Cruze com as salvaguardas do ROT e assine o PI-03. O detalhe de cada clique está nos 7 passos abaixo.",
    quanto: "Hash da pasta = SHA-256 da raiz + caminhos ordenados; 100% dos ativos com dado pessoal sensível cobertos.",
    passos: [
      p("Inventariar os computadores", "No quadro BitLocker, preencha \"ID do hardware\" e \"Hostname\" e clique no botão [+].", "O computador aparece na lista do quadro.", "Sem ID do hardware o cadastro é recusado."),
      p("Confirmar a proteção", "Ative o BitLocker no equipamento e marque o computador como protegido na lista.", "O computador passa a contar como protegido no checklist.", "Se não puder marcar, seu perfil não tem permissão de edição."),
      p("Registrar a chave de recuperação", "No computador, cole a chave no campo \"000000-000000-…\" e salve.", "A chave fica registrada e oculta; só DPO/ADMIN a veem com [Revelar].", "Cada visualização gera registro na trilha — isso é esperado."),
      p("Conferir o vínculo da chave", "Clique em [Revelar] e confira se a chave corresponde ao equipamento.", "A chave aparece e um registro de acesso é gravado.", "Se a chave não bater, substitua-a antes de seguir."),
      p("Catalogar o cofre", "No quadro Cryptomator, preencha o diretório lógico e a estrutura (um caminho por linha) e clique em [Catalogar cofre].", "O cofre aparece com o hash SHA-256 de integridade.", "Sem estrutura de pasta o hash não é calculado."),
      p("Cruzar com o ROT", "Compare as salvaguardas do campo 11 do Bloco 2 com os ativos cadastrados aqui.", "Cada salvaguarda declarada tem um ativo correspondente.", "Salvaguarda sem ativo é evidência fraca — cadastre o ativo."),
      p("Assinar o PI-03", "Em \"Saída obrigatória\", clique em [Gerar e assinar] e colete as assinaturas do DPO e da Diretoria.", "O PI-03 fica CHANCELADO e o Bloco 4 é liberado.", "Se o botão estiver desativado, ainda há computador sem proteção ou cofre sem hash."),
    ],
    errosComuns: ["Declarar salvaguarda no ROT sem ativo correspondente.", "Guardar a chave de recuperação fora do cofre.", "Não regerar o hash após alterar a pasta."],
  },
  4: {
    bloco: 4,
    titulo: "Registrar lotes de auditoria e incidentes",
    oQue: "Registrar os lotes mensais de auditoria de logs e tratar incidentes de segurança.",
    porQue: "Demonstrar vigilância contínua e resposta dentro do prazo do art. 48.",
    quem: "DPO_OPERACIONAL conduz; ADMIN_SISTEMA fornece os logs.",
    onde: "Bloco 4: Console forense (lotes) e Gerenciamento de Crise (incidentes).",
    quando: "Lote a cada mês; incidente imediatamente após a detecção.",
    como: "Todo mês, clique em [Extrair lote] e, ao fechar o mês, em [SHA-256] para selar. Havendo incidente, clique em [Declarar incidente] no mesmo dia — o contador de 3 dias úteis começa na hora — marque as 6 etapas em ordem e envie o formulário à ANPD. Ao final, assine o PI-04. O detalhe de cada clique está nos 8 passos abaixo.",
    quanto: "Prazo de 3 dias úteis (Res. CD/ANPD nº 15/2024, art. 6º), 6 etapas de resposta e formulário ANPD quando houver risco relevante.",
    passos: [
      p("Extrair o lote do mês", "No Console forense, clique em [Extrair lote de <mês atual>].", "O lote aparece na lista com o número de linhas e sem hash.", "Sem registros na trilha do período, o lote sai vazio — confira a trilha de auditoria."),
      p("Selar o lote", "Ao fechar o mês, clique em [SHA-256] na linha do lote.", "O hash SHA-256 aparece ao lado do lote e ele passa a contar como selado.", "Lote do mês corrente sem hash não bloqueia; só o de mês já fechado."),
      p("Declarar o incidente de imediato", "Havendo incidente, clique em [Declarar incidente] no mesmo dia.", "O contador de 3 dias úteis começa a correr no painel do incidente.", "Se o botão não aparecer, já existe um incidente aberto — conclua-o primeiro."),
      p("Avaliar a gravidade", "Registre na etapa 01 a extensão do incidente e o volume de titulares afetados.", "A etapa 01 fica marcada.", "Esses dados definem se a comunicação à ANPD é obrigatória."),
      p("Percorrer as 6 etapas", "Marque as caixas das etapas 01 a 06 em ordem, conforme forem executadas.", "Cada etapa marcada libera a seguinte.", "A caixa fica desativada enquanto a etapa anterior não estiver marcada."),
      p("Comunicar a ANPD", "Preencha o formulário ANPD (simulação) e clique em [Enviar à ANPD (simulado)].", "Aparece \"ANPD comunicada\" no contador.", "Com o prazo vencido aparece \"Prazo vencido\" — envie mesmo assim e registre o motivo."),
      p("Encerrar o incidente", "Com as 6 etapas marcadas e a ANPD comunicada, clique em [Encerrar incidente].", "O incidente sai da lista de abertos.", "Se não puder encerrar, falta etapa ou comunicação."),
      p("Assinar o PI-04", "Em \"Saída obrigatória\", clique em [Gerar e assinar] e colete as assinaturas do DPO e da Diretoria.", "O PI-04 fica CHANCELADO e o Bloco 5 é liberado.", "O PI-04 exige ao menos um incidente (real ou simulado) encerrado."),
    ],
    errosComuns: ["Aguardar o fechamento do mês para declarar o incidente.", "Marcar etapa sem ter executado a ação.", "Deixar lote de mês fechado sem hash.", "Não comunicar a ANPD dentro de 3 dias úteis."],
  },
  5: {
    bloco: 5,
    titulo: "Elaborar o RIPD e calcular a dosimetria",
    oQue: "Elaborar o RIPD dos sistemas de IA e conferir a dosimetria.",
    porQue: "Reduzir eventual multa (Resolução CD/ANPD nº 4/2023) e comprovar boa-fé.",
    quem: "DPO_OPERACIONAL elabora; a Diretoria (C_SUITE) assina junto.",
    onde: "Bloco 5.",
    quando: "Ao final de cada semestre.",
    como: "Descreva o sistema avaliado, escreva o Escudo Digital e preencha a mitigação de cada risco — cada campo é salvo ao sair dele. Confira a dosimetria, colete as duas assinaturas do PI-05 e clique em [Finalizar Ciclo Privacium Semestral]. O detalhe de cada clique está nos 8 passos abaixo.",
    quanto: "Atenuação máxima de 75% (PI-01+02 = 20%, PI-03 = 20%, PI-04 = 20%, PI-05 = 15%).",
    passos: [
      p("Conferir o pré-requisito", "Verifique na esteira do menu lateral se os Blocos 1 a 4 estão chancelados.", "Os quatro blocos aparecem como concluídos.", "Sem eles, a dosimetria não conta os atenuantes correspondentes."),
      p("Identificar o que entra no RIPD", "No Bloco 2, localize os processos com dado pessoal sensível ou alto risco.", "Você tem a lista de tratamentos que exigem RIPD.", "Processo de risco fora do RIPD enfraquece o Escudo Jurídico."),
      p("Descrever o sistema avaliado", "Preencha o campo do sistema avaliado (ex.: assistente interno baseado em LLM).", "O texto fica salvo ao sair do campo.", "Mínimo de 3 caracteres para contar como preenchido."),
      p("Escrever o Escudo Digital", "Explique por que o tratamento é necessário e por que não há alternativa menos invasiva.", "O texto fica salvo.", "Exige mais de 20 caracteres para liberar a assinatura."),
      p("Mitigar cada risco", "Em cada risco listado, descreva o risco e as \"Medidas de mitigação…\", vinculando a ativos do Bloco 3.", "Cada risco mostra a mitigação preenchida.", "Mitigação com 10 caracteres ou menos não conta."),
      p("Conferir a dosimetria", "Revise o percentual de atenuação calculado automaticamente.", "O percentual aparece com o teto de 75%.", "Percentual baixo indica PI anterior não chancelado."),
      p("Assinar o PI-05", "Em \"Saída obrigatória\", clique em [Gerar e assinar] e colete as assinaturas do DPO e da Diretoria.", "O PI-05 fica CHANCELADO.", "Se o botão estiver desativado, falta algum campo do RIPD."),
      p("Encerrar o ciclo", "Clique em [Finalizar Ciclo Privacium Semestral].", "As assinaturas são limpas, o ciclo fica registrado no histórico e o Bloco 1 reabre.", "Só finalize depois de baixar os PDFs dos PIs do semestre."),
    ],
    errosComuns: ["Elaborar o RIPD antes de concluir os blocos anteriores.", "Citar mitigação sem evidência no Bloco 3.", "Assinar sem revisar o percentual de atenuação."],
  },
};

/** Ajuda do quadro transversal (bloco 0 = Kanban). */
export const AJUDA_KANBAN: Ajuda5W2H = {
  bloco: 0,
  titulo: "Usar o quadro transversal",
  oQue: "Organizar as ações de conformidade em quadro 5W2H vinculado aos blocos.",
  porQue: "Transformar pendências em ações com responsável e prazo.",
  quem: "DPO_OPERACIONAL cria e distribui; gestores executam.",
  onde: "Kanban 5W2H, no menu lateral.",
  quando: "Continuamente, com revisão semanal.",
  como: "Escreva a ação em \"O quê?\" e clique em [Adicionar]; complete responsável e prazo no cartão. Mova o cartão com [Avançar →] conforme a execução e feche com evidência em \"Produto Concluído (PI)\". O detalhe de cada clique está nos 6 passos abaixo.",
  quanto: "Toda ação aberta deve ter responsável e prazo definidos.",
  passos: [
    p("Criar o cartão", "Digite a ação no campo \"O quê? (nova ação)\" e clique em [Adicionar].", "O cartão aparece na coluna \"A Fazer\".", "Com o campo vazio, o cartão não é criado."),
    p("Preencher os 7 campos", "Complete no cartão: por quê, quem, onde, quando, como e quanto.", "O cartão mostra responsável e prazo.", "Cartão sem responsável ou prazo aparece como pendência nesta ajuda."),
    p("Vincular ao bloco", "Indique o bloco de origem da ação.", "O cartão mostra o número do bloco.", "Sem vínculo, a ação perde rastreabilidade."),
    p("Mover conforme executa", "Clique em [Avançar →] ou [←] para mudar o cartão de coluna.", "O cartão muda de coluna e a mudança fica na trilha.", "\"Em Execução\" aceita no máximo 3 cartões."),
    p("Fechar com evidência", "Clique em [Avançar →] até \"Revisão do DPO/Compliance\" — o hash SHA-256 da evidência é gerado nesse momento — e avance para \"Produto Concluído (PI)\".", "O cartão fica em \"Produto Concluído (PI)\" com o hash da evidência.", "Sem passar pela revisão, o cartão não recebe hash."),
    p("Revisar semanalmente", "Toda semana, percorra as colunas e redistribua os cartões parados.", "Nenhum cartão fica parado mais de 7 dias.", "Cartão parado indica responsável sobrecarregado — redistribua."),
  ],
  errosComuns: ["Criar cartão sem responsável.", "Duplicar ação já existente.", "Fechar cartão sem evidência."],
};
