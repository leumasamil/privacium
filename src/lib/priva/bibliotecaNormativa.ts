/**
 * Biblioteca normativa versionada (item B da tarefa de dosimetria/biblioteca).
 *
 * Fonte única das citações normativas do produto. O banco (`biblioteca_normativa`)
 * é a verdade canônica; este módulo espelha o seed para renderização síncrona e
 * para o teste B.5 (nenhuma citação com status diferente de VERIFICADA pode ser
 * renderizada com identificador específico).
 *
 * Regra de renderização (B.3): citação com status ≠ VERIFICADA não renderiza o
 * identificador específico — apenas a referência genérica da norma — e a
 * pendência é registrada na trilha.
 */

export type CategoriaNormativa = "REGIME_GERAL" | "LEI_ESPECIAL_SETORIAL" | "FOMENTO_ECONOMICO" | "REFERENCIA_TECNICA";
export type StatusNormativo = "VERIFICADA" | "PENDENTE" | "DIVERGENTE" | "NAO_VERIFICAVEL";

export type EntradaNormativa = {
  norma: string;
  identificador: string;
  texto_literal: string | null;
  url_oficial: string;
  categoria: CategoriaNormativa;
  status: StatusNormativo;
  verificado_em: string | null;
  verificado_por: string | null;
  observacao: string | null;
};

const LGPD_URL = "https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html";
const RES2_URL = "https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-2-de-27-de-janeiro-de-2022-376562019";
const RES15_URL = "https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-15-de-24-de-abril-de-2024-556243024";
const RES4_URL = "https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-4-de-24-de-fevereiro-de-2023-466146077";
const RES19_URL = "https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-19-de-23-de-agosto-de-2024-580095396";
const LC123_URL = "https://www2.camara.leg.br/legin/fed/leicom/2006/leicomplementar-123-14-dezembro-2006-548099-normaatualizada-pl.html";
const LC182_URL = "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp182.htm";
const CTN_URL = "https://www2.camara.leg.br/legin/fed/lei/1960-1969/lei-5172-25-outubro-1966-358971-normaatualizada-pl.html";
const CF_URL = "https://www2.camara.leg.br/legin/fed/consti/1988/constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.html";
const MCI_URL = "https://www2.camara.leg.br/legin/fed/lei/2014/lei-12965-23-abril-2014-778630-normaatualizada-pl.html";

const D_AUDITORIA = "2026-10-30";
const AUDITOR = "Auditoria normativa Privacium (30/10/2026)";

const v = (
  norma: string,
  identificador: string,
  texto_literal: string,
  url_oficial: string,
  categoria: CategoriaNormativa = "REGIME_GERAL",
  observacao: string | null = null,
): EntradaNormativa => ({
  norma, identificador, texto_literal, url_oficial, categoria,
  status: "VERIFICADA", verificado_em: D_AUDITORIA, verificado_por: AUDITOR, observacao,
});

const nv = (
  norma: string,
  identificador: string,
  url_oficial: string,
  observacao: string,
  categoria: CategoriaNormativa = "REFERENCIA_TECNICA",
): EntradaNormativa => ({
  norma, identificador, texto_literal: null, url_oficial,
  categoria, status: "NAO_VERIFICAVEL",
  verificado_em: null, verificado_por: null, observacao,
});

/** Seed canônico: 42 verificadas da auditoria + 10 corrigidas (D1–D10) + LC 182/2021 + 8 não verificáveis. */
export const BIBLIOTECA_NORMATIVA: EntradaNormativa[] = [
  // ---- LGPD (Lei 13.709/2018) ----
  { ...v("LGPD", "art. 18, caput e incisos I a IX", "Art. 18. O titular dos dados pessoais tem direito a obter do controlador, em relação aos dados do titular por ele tratados, a qualquer momento e mediante requisição: I - confirmação da existência de tratamento; II - acesso aos dados; III - correção de dados incompletos, inexatos ou desatualizados; IV - anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com o disposto nesta Lei; V - portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa, de acordo com a regulamentação da autoridade nacional, observados os segredos comercial e industrial; (https://www2.camara.leg.br/legin/fed/lei/2019/lei-13853-8-julho-2019-788785-publicacaooriginal-158684-pl.html) VI - eliminação dos dados pessoais tratados com o consentimento do titular, exceto nas hipóteses previstas no art. 16 desta Lei; VII - informação das entidades públicas e privadas com as quais o controlador realizou uso compartilhado de dados; VIII - informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa; IX - revogação do consentimento, nos termos do § 5º do art. 8º desta Lei.", LGPD_URL), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },
  { ...v("LGPD", "art. 18, § 3º", "§ 3º Os direitos previstos neste artigo serão exercidos mediante requerimento expresso do titular ou de representante legalmente constituído, a agente de tratamento.", LGPD_URL), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },
  { ...v("LGPD", "art. 18, § 5º", "§ 5º do art. 8º desta Lei. § 1º O titular dos dados pessoais tem o direito de peticionar em relação aos seus dados contra o controlador perante a autoridade nacional. § 2º O titular pode opor-se a tratamento realizado com fundamento em uma das hipóteses de dispensa de consentimento, em caso de descumprimento ao disposto nesta Lei. § 3º Os direitos previstos neste artigo serão exercidos mediante requerimento expresso do titular ou de representante legalmente constituído, a agente de tratamento. § 4º Em caso de impossibilidade de adoção imediata da providência de que trata o § 3º deste artigo, o controlador enviará ao titular resposta em que poderá: I - comunicar que não é agente de tratamento dos dados e indicar, sempre que possível, o agente; ou II - indicar as razões de fato ou de direito que impedem a adoção imediata da providência. § 5º O requerimento referido no § 3º deste artigo será atendido sem custos para o titular, nos prazos e nos termos previstos em regulamento.", LGPD_URL), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },
  { ...v("LGPD", "art. 19, I", "I - em formato simplificado, imediatamente; ou", LGPD_URL), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },
  { ...v("LGPD", "art. 19, II", "II - por meio de declaração clara e completa, que indique a origem dos dados, a inexistência de registro, os critérios utilizados e a finalidade do tratamento, observados os segredos comercial e industrial, fornecida no prazo de até 15 (quinze) dias, contado da data do requerimento do titular.", LGPD_URL), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },
  { ...v("LGPD", "art. 16, caput", "Art. 16. Os dados pessoais serão eliminados após o término de seu tratamento, no âmbito e nos limites técnicos das atividades, autorizada a conservação para as seguintes finalidades:", LGPD_URL), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },
  { ...v("LGPD", "art. 16, IV", "IV - uso exclusivo do controlador, vedado seu acesso por terceiro, e desde que anonimizados os dados.", LGPD_URL), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },
  v("LGPD", "art. 5º, I", "I - dado pessoal: informação relacionada a pessoa natural identificada ou identificável;", LGPD_URL),
  v("LGPD", "art. 5º, II", "II - dado pessoal sensível: dado pessoal sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico, quando vinculado a uma pessoa natural;", LGPD_URL),
  v("LGPD", "art. 5º, III", "III - dado anonimizado: dado relativo a titular que não possa ser identificado, considerando a utilização de meios técnicos razoáveis e disponíveis na ocasião de seu tratamento;", LGPD_URL),
  v("LGPD", "art. 5º, V", "V - titular: pessoa natural a quem se referem os dados pessoais que são objeto de tratamento;", LGPD_URL),
  v("LGPD", "art. 5º, VI", "VI - controlador: pessoa natural ou jurídica, de direito público ou privado, a quem competem as decisões referentes ao tratamento de dados pessoais;", LGPD_URL),
  v("LGPD", "art. 5º, VII", "VII - operador: pessoa natural ou jurídica, de direito público ou privado, que realiza o tratamento de dados pessoais em nome do controlador;", LGPD_URL),
  v("LGPD", "art. 5º, VIII", "VIII - encarregado: pessoa indicada pelo controlador e operador para atuar como canal de comunicação entre o controlador, os titulares dos dados e a Agência Nacional de Proteção de Dados (ANPD);", LGPD_URL),
  v("LGPD", "art. 5º, X", "X - tratamento: toda operação realizada com dados pessoais, como as que se referem a coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração;", LGPD_URL),
  v("LGPD", "art. 5º, XVII", "XVII - relatório de impacto à proteção de dados pessoais: documentação do controlador que contém a descrição dos processos de tratamento de dados pessoais que podem gerar riscos às liberdades civis e aos direitos fundamentais, bem como medidas, salvaguardas e mecanismos de mitigação de risco;", LGPD_URL),
  v("LGPD", "art. 6º, I", "I - finalidade: realização do tratamento para propósitos legítimos, específicos, explícitos e informados ao titular, sem possibilidade de tratamento posterior de forma incompatível com essas finalidades;", LGPD_URL),
  v("LGPD", "art. 6º, IV", "IV - livre acesso: garantia, aos titulares, de consulta facilitada e gratuita sobre a forma e a duração do tratamento, bem como sobre a integralidade de seus dados pessoais;", LGPD_URL, "REGIME_GERAL", "Corrigida na rodada D1: o IV é livre acesso (não discriminação é o IX)."),
  v("LGPD", "art. 6º, V", "V - qualidade dos dados: garantia, aos titulares, de exatidão, clareza, relevância e atualização dos dados, de acordo com a necessidade e para o cumprimento da finalidade de seu tratamento;", LGPD_URL, "REGIME_GERAL", "Corrigida na rodada D1: o V é qualidade dos dados (transparência é o VI)."),
  v("LGPD", "art. 6º, VI", "VI - transparência: garantia, aos titulares, de informações claras, precisas e facilmente acessíveis sobre a realização do tratamento e os respectivos agentes de tratamento, observados os segredos comercial e industrial;", LGPD_URL, "REGIME_GERAL", "Corrigida na rodada D1."),
  v("LGPD", "art. 6º, VII", "VII - segurança: utilização de medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão;", LGPD_URL, "REGIME_GERAL", "Corrigida na rodada D2/D3: indisponibilidade e perda/alteração citam o VII."),
  v("LGPD", "art. 6º, IX", "IX - não discriminação: impossibilidade de realização do tratamento para fins discriminatórios ilícitos ou abusivos;", LGPD_URL),
  v("LGPD", "art. 7º, I a X", "Art. 7º O tratamento de dados pessoais somente poderá ser realizado nas seguintes hipóteses: I - mediante o fornecimento de consentimento pelo titular; II - para o cumprimento de obrigação legal ou regulatória pelo controlador; III - pela administração pública, para o tratamento e uso compartilhado de dados necessários à execução de políticas públicas previstas em leis e regulamentos ou respaldadas em contratos, convênios ou instrumentos congêneres, observadas as disposições do art. 4º desta Lei; IV - para a realização de estudos por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais; V - quando necessário para a execução de contrato ou de procedimentos preliminares relacionados a contrato do qual seja parte o titular, a pedido do titular dos dados; VI - para o exercício regular de direitos em processo judicial, administrativo ou arbitral, esse último nos termos da Lei nº 9.307, de 23 de setembro de 1996 (Lei de Arbitragem); VII - para a proteção da vida ou da incolumidade física do titular ou de terceiro; VIII - para a tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária; IX - quando necessário para atender aos interesses legítimos do controlador ou de terceiro, exceto no caso de prevalecerem direitos e liberdades fundamentais do titular que exijam a proteção dos dados pessoais; ou X - para a proteção do crédito, incluído o disposto na legislação pertinente.", LGPD_URL),
  v("LGPD", "art. 8º, § 5º", "§ 5º O consentimento pode ser revogado a qualquer momento mediante manifestação expressa do titular, por procedimento gratuito e facilitado, ratificados os tratamentos realizados sob amparo do consentimento anteriormente manifestado enquanto não houver requerimento de eliminação, nos termos do inciso VI do caput do art. 18 desta Lei.", LGPD_URL),
  v("LGPD", "art. 11, I e II, a–g", "Art. 11. O tratamento de dados pessoais sensíveis somente poderá ocorrer nas seguintes hipóteses: I - quando o titular ou seu responsável legal consentir, de forma específica e destacada, para finalidades específicas; II - sem fornecimento de consentimento do titular, nas hipóteses em que for indispensável para: a) cumprimento de obrigação legal ou regulatória pelo controlador; b) tratamento compartilhado de dados necessários à execução, pela administração pública, de políticas públicas previstas em leis ou regulamentos; c) realização de estudos por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais sensíveis; d) exercício regular de direitos, inclusive em contrato e em processo judicial, administrativo e arbitral, este último nos termos da Lei nº 9.307, de 23 de setembro de 1996 (Lei de Arbitragem); e) proteção da vida ou da incolumidade física do titular ou de terceiro; f) tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária; ou g) garantia da prevenção à fraude e à segurança do titular, nos processos de identificação e autenticação de cadastro em sistemas eletrônicos, resguardados os direitos mencionados no art. 9º desta Lei e exceto no caso de prevalecerem direitos e liberdades fundamentais do titular que exijam a proteção dos dados pessoais.", LGPD_URL),
  v("LGPD", "art. 12", "Art. 12. Os dados anonimizados não serão considerados dados pessoais para os fins desta Lei, salvo quando o processo de anonimização ao qual foram submetidos for revertido, utilizando exclusivamente meios próprios, ou quando, com esforços razoáveis, puder ser revertido.", LGPD_URL),
  v("LGPD", "art. 13, § 4º", "§ 4º Para os efeitos deste artigo, a pseudonimização é o tratamento por meio do qual um dado perde a possibilidade de associação, direta ou indireta, a um indivíduo, senão pelo uso de informação adicional mantida separadamente pelo controlador em ambiente controlado e seguro.", LGPD_URL),
  v("LGPD", "art. 14, caput e § 1º", "Art. 14. O tratamento de dados pessoais de crianças e de adolescentes deverá ser realizado em seu melhor interesse, nos termos deste artigo e da legislação pertinente. § 1º O tratamento de dados pessoais de crianças deverá ser realizado com o consentimento específico e em destaque dado por pelo menos um dos pais ou pelo responsável legal.", LGPD_URL, "REGIME_GERAL", "Corrigida na rodada D4: consentimento parental só para crianças (§ 1º)."),
  v("LGPD", "art. 16, caput e I–IV", "Art. 16. Os dados pessoais serão eliminados após o término de seu tratamento, no âmbito e nos limites técnicos das atividades, autorizada a conservação para as seguintes finalidades: I - cumprimento de obrigação legal ou regulatória pelo controlador; II - estudo por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais; III - transferência a terceiro, desde que respeitados os requisitos de tratamento de dados dispostos nesta Lei; ou IV - uso exclusivo do controlador, vedado seu acesso por terceiro, e desde que anonimizados os dados.", LGPD_URL),
  v("LGPD", "art. 18, caput", "Art. 18. O titular dos dados pessoais tem direito a obter do controlador, em relação aos dados do titular por ele tratados, a qualquer momento e mediante requisição: I - confirmação da existência de tratamento; II - acesso aos dados; III - correção de dados incompletos, inexatos ou desatualizados; IV - anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com o disposto nesta Lei; V - portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa, de acordo com a regulamentação da autoridade nacional, observados os segredos comercial e industrial; VI - eliminação dos dados pessoais tratados com o consentimento do titular, exceto nas hipóteses previstas no art. 16 desta Lei; VII - informação das entidades públicas e privadas com as quais o controlador realizou uso compartilhado de dados; VIII - informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa; IX - revogação do consentimento, nos termos do § 5º do art. 8º desta Lei.", LGPD_URL),
  v("LGPD", "art. 20, caput e §§ 1º–2º", "Art. 20. O titular dos dados tem direito a solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais que afetem seus interesses, incluídas as decisões destinadas a definir o seu perfil pessoal, profissional, de consumo e de crédito ou os aspectos de sua personalidade. § 1º O controlador deverá fornecer, sempre que solicitadas, informações claras e adequadas a respeito dos critérios e dos procedimentos utilizados para a decisão automatizada, observados os segredos comercial e industrial. § 2º Em caso de não oferecimento de informações de que trata o § 1º deste artigo baseado na observância de segredo comercial e industrial, a autoridade nacional poderá realizar auditoria para verificação de aspectos discriminatórios em tratamento automatizado de dados pessoais.", LGPD_URL, "REGIME_GERAL", "Corrigida na rodada D5: a redação vigente não exige revisão por pessoa natural."),
  v("LGPD", "art. 33, caput e I–IX", "Art. 33. A transferência internacional de dados pessoais somente é permitida nos seguintes casos: I - para países ou organismos internacionais que proporcionem grau de proteção de dados pessoais adequado ao previsto nesta Lei; II - quando o controlador oferecer e comprovar garantias de cumprimento dos princípios, dos direitos do titular e do regime de proteção de dados previstos nesta Lei, na forma de: a) cláusulas contratuais específicas para determinada transferência; b) cláusulas-padrão contratuais; c) normas corporativas globais; d) selos, certificados e códigos de conduta regularmente emitidos; III - quando a transferência for necessária para a cooperação jurídica internacional entre órgãos públicos de inteligência, de investigação e de persecução, de acordo com os instrumentos de direito internacional; IV - quando a transferência for necessária para a proteção da vida ou da incolumidade física do titular ou de terceiro; V - quando a autoridade nacional autorizar a transferência; VI - quando a transferência resultar em compromisso assumido em acordo de cooperação internacional; VII - quando a transferência for necessária para a execução de política pública ou atribuição legal do serviço público, sendo dada publicidade nos termos do inciso I do caput do art. 23 desta Lei; VIII - quando o titular tiver fornecido o seu consentimento específico e em destaque para a transferência, com informação prévia sobre o caráter internacional da operação, distinguindo claramente esta de outras finalidades; ou IX - quando necessário para atender as hipóteses previstas nos incisos II, V e VI do art. 7º desta Lei.", LGPD_URL),
  v("LGPD", "art. 37", "Art. 37. O controlador e o operador devem manter registro das operações de tratamento de dados pessoais que realizarem, especialmente quando baseado no legítimo interesse.", LGPD_URL),
  v("LGPD", "art. 38", "Art. 38. A autoridade nacional poderá determinar ao controlador que elabore relatório de impacto à proteção de dados pessoais, inclusive de dados sensíveis, referente a suas operações de tratamento de dados, nos termos de regulamento, observados os segredos comercial e industrial.", LGPD_URL),
  v("LGPD", "art. 39", "Art. 39. O operador deverá realizar o tratamento segundo as instruções fornecidas pelo controlador, que verificará a observância das próprias instruções e das normas sobre a matéria.", LGPD_URL),
  v("LGPD", "art. 41, caput e § 1º", "Art. 41. O controlador deverá indicar encarregado pelo tratamento de dados pessoais. § 1º A identidade e as informações de contato do encarregado deverão ser divulgadas publicamente, de forma clara e objetiva, preferencialmente no sítio eletrônico do controlador.", LGPD_URL),
  v("LGPD", "art. 42, § 1º, I", "§ 1º A fim de assegurar a efetiva indenização ao titular dos dados: I - o operador responde solidariamente pelos danos causados pelo tratamento quando descumprir as obrigações da legislação de proteção de dados ou quando não tiver seguido as instruções lícitas do controlador, hipótese em que o operador equipara-se ao controlador, salvo nos casos de exclusão previstos no art. 43 desta Lei;", LGPD_URL),
  v("LGPD", "art. 43", "Art. 43. Os agentes de tratamento só não serão responsabilizados quando provarem: I - que não realizaram o tratamento de dados pessoais que lhes é atribuído; II - que, embora tenham realizado o tratamento de dados pessoais que lhes é atribuído, não houve violação à legislação de proteção de dados; ou III - que o dano é decorrente de culpa exclusiva do titular dos dados ou de terceiro.", LGPD_URL),
  v("LGPD", "art. 46", "Art. 46. Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.", LGPD_URL),
  v("LGPD", "art. 48", "Art. 48. O controlador deverá comunicar à autoridade nacional e ao titular a ocorrência de incidente de segurança que possa acarretar risco ou dano relevante aos titulares.", LGPD_URL),

  // ---- Res. CD/ANPD nº 2/2022 ----
  v("Res. CD/ANPD nº 2/2022", "arts. 2º e 3º", "Art. 3º Não poderão se beneficiar do tratamento jurídico diferenciado previsto neste Regulamento os agentes de tratamento de pequeno porte que: I - realizem tratamento de alto risco nos termos do art. 4º deste Regulamento; II - aufiram receita bruta superior ao limite estabelecido no art. 3º, II, da Lei Complementar nº 123, de 14 de dezembro de 2006, ou, no caso de startups, no art. 4º, § 1º, I, da Lei Complementar nº 182, de 1º de junho de 2021; ou III - pertençam a grupo econômico de fato ou de direito, apurado na forma da legislação trabalhista, cujo faturamento global ultrapasse os limites a que se refere o inciso II do caput deste artigo.", RES2_URL),
  v("Res. CD/ANPD nº 2/2022", "art. 4º", "Art. 4º Para fins deste regulamento, observados outros critérios estabelecidos pela ANPD, será considerado de alto risco o tratamento de dados pessoais que atender cumulativamente a pelo menos um critério geral e um critério específico.", RES2_URL),
  v("Res. CD/ANPD nº 2/2022", "art. 9º", "Art. 9º Os agentes de tratamento de pequeno porte podem cumprir a obrigação de elaboração e manutenção de registro das operações de tratamento de dados pessoais, constante do art. 37 da LGPD, de forma simplificada.", RES2_URL),
  v("Res. CD/ANPD nº 2/2022", "art. 12", "Art. 12. Os agentes de tratamento de pequeno porte devem adotar medidas administrativas e técnicas essenciais e necessárias, com base em requisitos mínimos de segurança da informação, observadas as especificidades do tratamento realizado.", RES2_URL, "REGIME_GERAL", "A resolução não contém dispositivo que dispense o RIPD."),
  v("Res. CD/ANPD nº 2/2022", "ementa", "Aprova o Regulamento de aplicação da Lei nº 13.709/2018 (LGPD) para agentes de tratamento de pequeno porte.", RES2_URL),

  // ---- Res. CD/ANPD nº 15/2024 ----
  v("Res. CD/ANPD nº 15/2024", "art. 6º, caput", "Art. 6º A comunicação de incidente de segurança à ANPD deverá ser realizada pelo controlador no prazo de três dias úteis, ressalvada a existência de prazo para comunicação previsto em legislação específica.", RES15_URL),
  v("Res. CD/ANPD nº 15/2024", "art. 6º, § 8º", "§ 8º Os prazos constantes no caput e no § 3º deste artigo são contados em dobro para os agentes de pequeno porte, nos termos do disposto no Regulamento de aplicação da Lei nº 13.709/2018 para agentes de tratamento de pequeno porte, aprovado pela Resolução CD/ANPD nº 2, de 27 de janeiro de 2022.", RES15_URL),
  v("Res. CD/ANPD nº 15/2024", "art. 3º, XII", "XII - incidente de segurança: qualquer evento adverso confirmado, relacionado à violação das propriedades de confidencialidade, integridade, disponibilidade e autenticidade da segurança de dados pessoais;", RES15_URL, "REGIME_GERAL", "Corrigida na rodada D6: incluída a propriedade autenticidade."),
  v("Res. CD/ANPD nº 15/2024", "ementa", "Aprova o Regulamento de Comunicação de Incidente de Segurança.", RES15_URL),

  // ---- Res. CD/ANPD nº 4/2023 ----
  v("Res. CD/ANPD nº 4/2023", "art. 13", "Art. 13. O valor da multa simples será reduzido, nos percentuais abaixo, caso incidam as seguintes circunstâncias atenuantes: I - nos casos de cessação da infração: a) 75% (setenta e cinco por cento), se previamente à instauração de procedimento preparatório pela ANPD; b) 50% (cinquenta por cento), se após a instauração de procedimento preparatório e até a instauração de processo administrativo sancionador; ou c) 30% (trinta por cento), se após a instauração de processo administrativo sancionador e até a prolação da decisão de primeira instância no âmbito do processo administrativo sancionador; II - 20% (vinte por cento), nos casos de implementação de política de boas práticas e de governança ou de adoção reiterada e demonstrada de mecanismos e procedimentos internos capazes de minimizar os danos aos titulares, voltados ao tratamento seguro e adequado de dados, até a prolação da decisão de primeira instância no âmbito do processo administrativo sancionador; III - nos casos em que o infrator tenha comprovado a implementação de medidas capazes de reverter ou mitigar os efeitos da infração sobre os titulares de dados pessoais afetados: a) 20% (vinte por cento), previamente à instauração de procedimento preparatório ou processo administrativo sancionador pela ANPD; ou b) 10% (dez por cento), se após a instauração de procedimento preparatório e até a instauração de processo administrativo sancionador; e IV - 5% (cinco por cento), nos casos em que se verifique a cooperação ou boa-fé por parte do infrator.", RES4_URL, "REGIME_GERAL", "Corrigida na rodada D8: a resolução não prevê os pesos 20/20/20/15 nem teto de 75% do simulador antigo; simulador desabilitado."),

  // ---- Res. CD/ANPD nº 19/2024 ----
  v("Res. CD/ANPD nº 19/2024", "ementa", "Aprova o Regulamento de Transferência Internacional de Dados e o conteúdo das cláusulas-padrão contratuais.", RES19_URL),

  // ---- LC 123/2006 e LC 182/2021 ----
  v("LC 123/2006", "art. 3º, II", "II - no caso de empresa de pequeno porte, aufira, em cada ano-calendário, receita bruta superior a R$ 360.000,00 (trezentos e sessenta mil reais) e igual ou inferior a R$ 4.800.000,00 (quatro milhões e oitocentos mil reais).", LC123_URL, "FOMENTO_ECONOMICO"),
  { ...v("LC 182/2021", "art. 4º, § 1º, I", "I - com receita bruta de até R$ 16.000.000,00 (dezesseis milhões de reais) no ano-calendário anterior ou de R$ 1.333.334,00 (um milhão, trezentos e trinta e três mil trezentos e trinta e quatro reais) multiplicado pelo número de meses de atividade no anocalendário anterior, quando inferior a 12 (doze) meses, independentemente da forma societária adotada;", "https://www2.camara.leg.br/legin/fed/leicom/2021/leicomplementar-182-1-junho-2021-791408-publicacaooriginal-162919-pl.html", "FOMENTO_ECONOMICO", "Limite econômico incorporado por remissão expressa da Res. CD/ANPD nº 2/2022, art. 3º, II."), verificado_em: "2026-11-01", verificado_por: "verificação na Câmara dos Deputados" },

  // ---- CTN e CF ----
  v("CTN", "art. 173", "Art. 173. O direito de a Fazenda Pública constituir o crédito tributário extingue-se após 5 (cinco) anos, contados: I - do primeiro dia do exercício seguinte àquele em que o lançamento poderia ter sido efetuado; II - da data em que se tornar definitiva a decisão que houver anulado, sem sujeição a nova liquidação, o lançamento anteriormente efetuado.", CTN_URL, "LEI_ESPECIAL_SETORIAL"),
  v("CF/1988", "art. 7º, XXIX", "XXIX - ação, quanto aos créditos resultantes das relações de trabalho, com prazo prescricional de cinco anos para os trabalhadores urbanos e rurais, até o limite de dois anos após a extinção do contrato de trabalho;", CF_URL, "REGIME_GERAL", "Corrigida na rodada D9: prescrição de 5 anos limitada a 2 anos após a extinção do contrato."),

  // ---- Marco Civil da Internet (Lei 12.965/2014) ----
  v("Lei 12.965/2014", "art. 15", "Art. 15. O provedor de aplicações de internet constituído na forma de pessoa jurídica e que exerça essa atividade de forma organizada, profissionalmente e com fins econômicos deverá manter os respectivos registros de acesso a aplicações de internet, sob sigilo, em ambiente controlado e de segurança, pelo prazo de 6 (seis) meses, nos termos do regulamento.", MCI_URL),
  v("Lei 12.965/2014", "art. 10, caput", "Art. 10. A guarda e a disponibilização dos registros de conexão e de acesso a aplicações de internet de que trata esta Lei, bem como de dados pessoais e do conteúdo de comunicações privadas, devem atender à preservação da intimidade, da vida privada, da honra e da imagem das partes direta ou indiretamente envolvidas.", MCI_URL, "REGIME_GERAL", "Corrigida na rodada D10: 'em ambiente controlado e de segurança' é do art. 15."),
  v("Lei 12.965/2014", "art. 7º, VIII", "VIII - informações claras e completas sobre coleta, uso, armazenamento, tratamento e proteção de seus dados pessoais, que somente poderão ser utilizados para finalidades que: a) justifiquem sua coleta; b) não sejam vedadas pela legislação; e c) estejam especificadas nos contratos de prestação de serviços e nos termos de uso de aplicações de internet.", MCI_URL),

  // ---- Não verificáveis (item 9.6 do blueprint: normas pagas / fontes não abertas) ----
  nv("Res. CMN nº 4.658/2018", "ementa", "https://www.bcb.gov.br/estabilidadefinanceira/buscanormas", "Fonte não aberta na varredura de 30/10/2026; referência histórica do setor financeiro.", "LEI_ESPECIAL_SETORIAL"),
  nv("ISO/IEC 27002:2022", "controles 5.9, 5.10, 5.12, 5.14, 5.24–5.28, 7.10, 8.x", "https://www.iso.org/standard/75652.html", "Norma paga (item 9.6): títulos dos controles não confirmados em fonte pública na varredura de 30/10/2026."),
  nv("ISO/IEC 27701:2019", "cl. 6.9", "https://www.iso.org/standard/71670.html", "Norma paga (item 9.6): título da cláusula não confirmado em fonte pública."),
  nv("ISO/IEC 27037:2012", "ementa", "https://www.iso.org/standard/44381.html", "Norma paga (item 9.6): não aberta na varredura de 30/10/2026."),
  nv("ISO/IEC 42001:2023", "A.7.4", "https://www.iso.org/standard/81230.html", "Norma paga (item 9.6): controle não confirmado em fonte pública."),
  nv("ISO/IEC 23894:2023", "6.4", "https://www.iso.org/standard/77304.html", "Norma paga (item 9.6): controle não confirmado em fonte pública."),
  nv("NIST SP 800-61r3", "ementa", "https://csrc.nist.gov/pubs/sp/800/61/r3/final", "Não aberta na varredura de 30/10/2026."),
  nv("CIS Controls v8", "controles 01, 03, 04, 07, 08, 11, 16", "https://www.cisecurity.org/controls", "Não abertos na varredura de 30/10/2026."),
];

/** Extrai o nome da norma de uma citação livre ("LGPD art. 20" → "LGPD"). */
export function normaDaCitacao(citacao: string): string | null {
  const c = citacao.trim();
  const res = c.match(/Res\.\s*CD\/ANPD\s*n[ºo°]*\s*(\d+)\s*\/\s*(\d{4})/i);
  if (res) return `Res. CD/ANPD nº ${res[1]}/${res[2]}`;
  if (/LGPD|Lei\s*n?[ºo°]*\s*13\.?709/i.test(c)) return "LGPD";
  if (/Lei\s*12\.?965|Marco Civil|\bMCI\b/i.test(c)) return "Lei 12.965/2014";
  if (/LC\s*123|Lei\s*Complementar\s*n?[ºo°]*\s*123/i.test(c)) return "LC 123/2006";
  if (/LC\s*182|Lei\s*Complementar\s*n?[ºo°]*\s*182/i.test(c)) return "LC 182/2021";
  if (/CTN|Código Tributário/i.test(c)) return "CTN";
  if (/CF\/1988|Constitui/i.test(c)) return "CF/1988";
  if (/CMN\s*n?[ºo°]*\s*4\.?658/i.test(c)) return "Res. CMN nº 4.658/2018";
  if (/27002/i.test(c)) return "ISO/IEC 27002:2022";
  if (/27701/i.test(c)) return "ISO/IEC 27701:2019";
  if (/27037/i.test(c)) return "ISO/IEC 27037:2012";
  if (/42001/i.test(c)) return "ISO/IEC 42001:2023";
  if (/23894/i.test(c)) return "ISO/IEC 23894:2023";
  if (/NIST/i.test(c)) return "NIST SP 800-61r3";
  if (/CIS\s*Controls?/i.test(c)) return "CIS Controls v8";
  return null;
}

/** Entradas da biblioteca para a norma da citação. */
export function entradasDaCitacao(citacao: string): EntradaNormativa[] {
  const norma = normaDaCitacao(citacao);
  if (!norma) return [];
  return BIBLIOTECA_NORMATIVA.filter((e) => e.norma === norma);
}

/**
 * Regra B.3: a citação só pode ser renderizada com identificador específico se
 * houver entrada VERIFICADA que a cubra. Norma sem entrada verificada, ou
 * citação cujo identificador não consta de nenhuma entrada verificada da norma,
 * rende apenas a referência genérica.
 */
export function citacaoVerificada(citacao: string): boolean {
  const entradas = entradasDaCitacao(citacao);
  if (!entradas.length) return false;
  const verificadas = entradas.filter((e) => e.status === "VERIFICADA");
  if (!verificadas.length) return false;
  // Citação genérica (só o nome da norma) de norma com entradas verificadas: permitida.
  const art = citacao.match(/art\.?\s*\d+/i);
  if (!art) return true;
  const numero = art[0].replace(/\s/g, " ").toLowerCase();
  return verificadas.some((e) => e.identificador.toLowerCase().includes(numero));
}

/** Referência genérica permitida quando a citação não está verificada (B.3). */
export function referenciaGenerica(citacao: string): string {
  return normaDaCitacao(citacao) ?? citacao;
}

/**
 * Padrões proibidos no código do produto (teste B.5): identificadores
 * específicos de entradas cujo status não é VERIFICADA.
 */
export const PADROES_NAO_VERIFICADOS: { rotulo: string; padrao: RegExp }[] = [
  { rotulo: "ISO/IEC 27002 com número de controle", padrao: /27002[^\n"'`]*(?:—|-|\()\s*(?:5|7|8)\.\d+/ },
  { rotulo: "ISO/IEC 27701 com cláusula", padrao: /27701[^\n"'`]*(?:cl\.|cláusula)\s*\d/i },
  { rotulo: "ISO/IEC 42001 com controle", padrao: /42001[^\n"'`]*A\.\d/i },
  { rotulo: "ISO/IEC 23894 com cláusula", padrao: /23894[^\n"'`]*\d\.\d/ },
  { rotulo: "CIS Controls com número de controle", padrao: /CIS\s*Controls?\s*(?:v8\s*)?(?:—|-)?\s*\d{2}\b/i },
];
