/**
 * Cadastro de Terceiros (Bloco 1) — regras puras.
 * Textos literais conferidos em 30/10/2026 na publicação oficial da Câmara dos Deputados
 * (texto atualizado da Lei nº 13.709/2018). Fonte canônica exigida pelo protocolo: Planalto.
 */
export const FONTE_LGPD_PLANALTO = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm";
export const FONTE_LGPD_CAMARA = "https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html";

export const LITERAL_ART5_VII = "operador: pessoa natural ou jurídica, de direito público ou privado, que realiza o tratamento de dados pessoais em nome do controlador";
export const LITERAL_ART5_X = "tratamento: toda operação realizada com dados pessoais, como as que se referem a coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração";
/** Art. 39 da LGPD — texto oficial integral (o artigo não tem parágrafos). */
export const LITERAL_ART39 = "O operador deverá realizar o tratamento segundo as instruções fornecidas pelo controlador, que verificará a observância das próprias instruções e das normas sobre a matéria.";
export const LITERAL_ART42_P1_I = "o operador responde solidariamente pelos danos causados pelo tratamento quando descumprir as obrigações da legislação de proteção de dados ou quando não tiver seguido as instruções lícitas do controlador, hipótese em que o operador equipara-se ao controlador, salvo nos casos de exclusão previstos no art. 43 desta Lei";
export const LITERAL_ART33_CAPUT = "A transferência internacional de dados pessoais somente é permitida nos seguintes casos:";

export const PAPEIS_CADEIA = ["OPERADOR", "CONTROLADOR_INDEPENDENTE", "SUBOPERADOR"] as const;
export type PapelCadeia = (typeof PAPEIS_CADEIA)[number];
export const ROTULO_CADEIA: Record<PapelCadeia, string> = { OPERADOR: "Operador", CONTROLADOR_INDEPENDENTE: "Controlador independente", SUBOPERADOR: "Suboperador" };

/** Checklist de cláusulas contratuais do método — instrumento do método, não transcrição do art. 39. */
export const CHECKLIST_ART39 = [
  ["instrucoes", "Instruções sobre o tratamento"], ["proposito", "Propósito do tratamento"], ["metodos", "Métodos"], ["duracao", "Duração"],
  ["deveres", "Deveres do operador"], ["vigencia", "Prazo de vigência"], ["controle", "Meios de controle pelo controlador"],
  ["responsabilidade", "Responsabilidade pelo tratamento"], ["seguranca", "Mecanismos de segurança"], ["direitos_titular", "Procedimentos para direitos do titular (art. 18)"],
] as const;
export type ChecklistArt39 = Partial<Record<(typeof CHECKLIST_ART39)[number][0], boolean>>;
export const checklistCompleto = (c: ChecklistArt39 | null | undefined) => CHECKLIST_ART39.every(([k]) => c?.[k] === true);

/** Hipóteses do art. 33 da LGPD — texto literal de cada inciso/alínea. */
export const HIPOTESES_ART33: { valor: string; rotulo: string; literal: string }[] = [
  { valor: "I", rotulo: "Art. 33, I — país com proteção adequada", literal: "para países ou organismos internacionais que proporcionem grau de proteção de dados pessoais adequado ao previsto nesta Lei;" },
  { valor: "II-a", rotulo: "Art. 33, II, a — cláusulas contratuais específicas", literal: "quando o controlador oferecer e comprovar garantias de cumprimento dos princípios, dos direitos do titular e do regime de proteção de dados previstos nesta Lei, na forma de: a) cláusulas contratuais específicas para determinada transferência;" },
  { valor: "II-b", rotulo: "Art. 33, II, b — cláusulas-padrão contratuais", literal: "quando o controlador oferecer e comprovar garantias de cumprimento dos princípios, dos direitos do titular e do regime de proteção de dados previstos nesta Lei, na forma de: b) cláusulas-padrão contratuais;" },
  { valor: "II-c", rotulo: "Art. 33, II, c — normas corporativas globais", literal: "quando o controlador oferecer e comprovar garantias de cumprimento dos princípios, dos direitos do titular e do regime de proteção de dados previstos nesta Lei, na forma de: c) normas corporativas globais;" },
  { valor: "II-d", rotulo: "Art. 33, II, d — selos, certificados e códigos de conduta", literal: "quando o controlador oferecer e comprovar garantias de cumprimento dos princípios, dos direitos do titular e do regime de proteção de dados previstos nesta Lei, na forma de: d) selos, certificados e códigos de conduta regularmente emitidos;" },
  { valor: "III", rotulo: "Art. 33, III — cooperação jurídica internacional", literal: "quando a transferência for necessária para a cooperação jurídica internacional entre órgãos públicos de inteligência, de investigação e de persecução, de acordo com os instrumentos de direito internacional;" },
  { valor: "IV", rotulo: "Art. 33, IV — proteção da vida", literal: "quando a transferência for necessária para a proteção da vida ou da incolumidade física do titular ou de terceiro;" },
  { valor: "V", rotulo: "Art. 33, V — autorização da autoridade nacional", literal: "quando a autoridade nacional autorizar a transferência;" },
  { valor: "VI", rotulo: "Art. 33, VI — acordo de cooperação internacional", literal: "quando a transferência resultar em compromisso assumido em acordo de cooperação internacional;" },
  { valor: "VII", rotulo: "Art. 33, VII — política pública ou atribuição legal", literal: "quando a transferência for necessária para a execução de política pública ou atribuição legal do serviço público, sendo dada publicidade nos termos do inciso I do caput do art. 23 desta Lei;" },
  { valor: "VIII", rotulo: "Art. 33, VIII — consentimento específico e em destaque", literal: "quando o titular tiver fornecido o seu consentimento específico e em destaque para a transferência, com informação prévia sobre o caráter internacional da operação, distinguindo claramente esta de outras finalidades;" },
  { valor: "IX", rotulo: "Art. 33, IX — hipóteses do art. 7º, II, V e VI", literal: "quando necessário para atender as hipóteses previstas nos incisos II, V e VI do art. 7º desta Lei." },
];

export const NOTA_SUBOPERADOR = "A LGPD não disciplina expressamente a subcontratação. O suboperador é operador da cadeia e responde nos termos do art. 42, § 1º, I, quando descumprir as instruções lícitas do controlador. O registro do vínculo atende ao art. 37.";
/** Art. 42, § 1º, I — exibido com a nota do suboperador. */
export const CITACAO_ART42_P1_I = `Art. 42, § 1º — "A fim de assegurar a efetiva indenização ao titular dos dados: I - ${LITERAL_ART42_P1_I}."`;
/** Art. 6º, I — finalidade. */
export const LITERAL_ART6_I = "finalidade: realização do tratamento para propósitos legítimos, específicos, explícitos e informados ao titular, sem possibilidade de tratamento posterior de forma incompatível com essas finalidades";
/** Art. 43 — texto oficial integral (prova de excludente). */
export const LITERAL_ART43 = "Os agentes de tratamento só não serão responsabilizados quando provarem: I - que não realizaram o tratamento de dados pessoais que lhes é atribuído; II - que, embora tenham realizado o tratamento de dados pessoais que lhes é atribuído, não houve violação à legislação de proteção de dados; ou III - que o dano é decorrente de culpa exclusiva do titular dos dados ou de terceiro.";
export const TITULO_CHECKLIST = "Checklist de cláusulas contratuais do método (não é transcrição do art. 39)";
export const NOTA_CHECKLIST = "O art. 39 da LGPD estabelece apenas o dever de o operador seguir as instruções do controlador. Este checklist é instrumento do método para verificar se o contrato cobre os pontos necessários à comprovação (LGPD arts. 6º, X; 37; 46) e não reproduz dispositivo legal.";
export const ALERTA_TERCEIRO_SEM_CONTRATO = "Terceiro sem contrato vigente com o checklist de cláusulas contratuais do método completo — compartilhamento externo não pode ser chancelado.";
export const FINALIDADE_GESTAO_FORNECEDORES = "Gestão de fornecedores com acesso a dados pessoais";

export type TerceiroResumo = { id: string; razao_social: string; contrato_vigente: boolean; clausulas_art39: boolean; ativo?: boolean };

/** Bloqueia o destino externo quando o terceiro não tem contrato vigente com o checklist completo. */
export function terceiroBloqueado(t: Pick<TerceiroResumo, "contrato_vigente" | "clausulas_art39"> | null | undefined): boolean {
  return !t || !t.contrato_vigente || !t.clausulas_art39;
}

/** Validação do cadastro (bloqueante); null quando pode salvar. */
export function validarTerceiro(t: { razao_social: string; cnpj: string; papel_cadeia: PapelCadeia; operador_principal_id: string | null; contrato_vigente: boolean; data_contrato: string | null; transferencia_internacional: boolean; hipotese_art33: string | null }): string | null {
  if (!t.razao_social.trim()) return "Informe a razão social do terceiro.";
  if (t.cnpj.replace(/\D/g, "").length !== 14) return "CNPJ deve ter 14 dígitos.";
  if (t.papel_cadeia === "SUBOPERADOR" && !t.operador_principal_id) return "Suboperador exige vínculo com o operador principal.";
  if (t.contrato_vigente && !t.data_contrato) return "Informe a data do contrato vigente.";
  if (t.transferencia_internacional && !t.hipotese_art33) return "Transferência internacional exige a hipótese do art. 33 selecionada.";
  return null;
}
