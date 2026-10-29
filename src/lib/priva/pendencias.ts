import type { Signature } from "./store";
import { hasSensivel, isRisky, type RotInput } from "./rot";

export type Estado = "ok" | "andamento" | "pendente" | "atencao" | "critico" | "bloqueado";
export type Responsavel = "DPO_OPERACIONAL" | "C_SUITE" | "ADMIN_SISTEMA";
export type Pendencia = {
  id: string;
  titulo: string;
  exige: string;
  responsavel: Responsavel;
  estado: Estado;
  /** Bloco anterior onde a pendência se resolve + âncora na tela. */
  bloco: number;
  ancora: string;
  acao: string;
  /** Linha "Próxima ação sugerida" explicando por que e, se houver, a sequência de passos. */
  sugestao?: string | undefined;
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
/** "2026-09" → "setembro/2026" */
export const mesExtenso = (m: string) => { const [a, mm] = m.split("-"); return `${MESES[Number(mm) - 1] ?? mm}/${a}`; };

export const PI_INFO: Record<number, { codigo: string; nome: string; explica: string }> = {
  1: { codigo: "PI-01", nome: "Dossiê Legal de Alinhamento de Privacidade", explica: "É o resultado do diagnóstico de entrada: mostra o Grau de Maturidade da empresa frente à LGPD. Só com esse dossiê assinado o Bloco 2 é liberado." },
  2: { codigo: "PI-02", nome: "Registro de Operações de Tratamento (ROT)", explica: "É o inventário exigido pelo art. 37 da LGPD: cada processo que trata dado pessoal, com sua hipótese de tratamento. Só com o ROT assinado pelo DPO e pela Diretoria o Bloco 3 é liberado." },
  3: { codigo: "PI-03", nome: "Book de Evidências Tecnológicas e Contratuais", explica: "Comprova as salvaguardas do art. 46: computadores criptografados e cofres em nuvem com integridade verificada. Só com esse book assinado o Bloco 4 é liberado." },
  4: { codigo: "PI-04", nome: "Dossiê de Auditoria de Logs e Resposta de Célula", explica: "Comprova que a empresa vigiou acessos e tratou incidentes. Só com esse dossiê assinado o Bloco 5 é liberado." },
};

/** PI-01 tem assinatura única do DPO; PI-02 a PI-04 exigem DPO + Diretoria. */
export const PI_DUPLO: Record<number, boolean> = { 1: false, 2: true, 3: true, 4: true, 5: true };

export type DadosBloco =
  | { n: 1; perguntas: number; respondidas: number; naos: number }
  | { n: 2; rot: RotInput[] }
  | { n: 3; endpoints: { protegido: boolean }[]; cofres: { hash_integridade: string | null }[]; chaves: number | null }
  | { n: 4; lotes: { mes_referencia: string; hash_sha256: string | null }[]; incidentes: { id: string; passos: boolean[]; iniciado_em: string; enviado_anpd_em: string | null; encerrado_em: string | null }[]; agora: number };

const est = (feitos: number, total: number): Estado => (total > 0 && feitos >= total ? "ok" : feitos > 0 ? "andamento" : "pendente");

function assinaturas(n: number, sigs: Record<string, Signature>, base: boolean): Pendencia[] {
  const code = `PI-0${n}`;
  const estadoBase: Estado = base ? "pendente" : "bloqueado";
  const exigeBase = base ? "Gerar o documento e assinar com Gov.br na seção \"Saída obrigatória\"." : "Disponível depois que as etapas acima estiverem concluídas.";
  if (!PI_DUPLO[n]) {
    return [{ id: "sig-dpo", titulo: `Assinatura do DPO no ${code}`, exige: exigeBase, responsavel: "DPO_OPERACIONAL", estado: sigs[code] ? "ok" : estadoBase, bloco: n, ancora: "assinatura", acao: `Assinar o ${code}` }];
  }
  return [
    { id: "sig-dpo", titulo: `Assinatura do DPO no ${code}`, exige: exigeBase, responsavel: "DPO_OPERACIONAL", estado: sigs[`${code}-DPO`] || sigs[code] ? "ok" : estadoBase, bloco: n, ancora: "assinatura", acao: `Assinar o ${code} como DPO` },
    { id: "sig-dir", titulo: `Assinatura da Diretoria no ${code}`, exige: exigeBase, responsavel: "C_SUITE", estado: sigs[`${code}-DIR`] || sigs[code] ? "ok" : estadoBase, bloco: n, ancora: "assinatura", acao: `Assinar o ${code} como Diretoria` },
  ];
}

/** Monta o checklist do bloco anterior (n) a partir do estado real do CNPJ. Itens sem pendência aplicável são omitidos. */
export function montarChecklist(d: DadosBloco, sigs: Record<string, Signature>): Pendencia[] {
  const it: Pendencia[] = [];
  const n = d.n;
  if (d.n === 1) {
    const falta = d.perguntas - d.respondidas;
    it.push({ id: "diag", titulo: `Responder às ${d.perguntas} perguntas do diagnóstico por setor`, exige: falta > 0 ? `Faltam ${falta} de ${d.perguntas} respostas.` : `${d.perguntas} de ${d.perguntas} respondidas.`, responsavel: "DPO_OPERACIONAL", estado: est(d.respondidas, d.perguntas), bloco: 1, ancora: "diagnostico", acao: `Responder as ${falta} perguntas pendentes`, sugestao: "Responda setor por setor; cada clique já fica salvo no CNPJ ativo." });
    if (d.naos > 0) it.push({ id: "naos", titulo: `Revisar as ${d.naos} respostas marcadas como "não"`, exige: "Confirme cada \"não\" com o gestor do setor antes de assinar — elas reduzem o Grau de Maturidade.", responsavel: "DPO_OPERACIONAL", estado: falta > 0 ? "andamento" : "ok", bloco: 1, ancora: "diagnostico", acao: `Revisar as respostas "não"` });
    if (d.perguntas > 0) it.push({ id: "gm", titulo: "Registrar formalmente o Grau de Maturidade", exige: "O Grau de Maturidade é registrado no PI-01 quando todas as perguntas estiverem respondidas.", responsavel: "DPO_OPERACIONAL", estado: falta === 0 ? "ok" : "bloqueado", bloco: 1, ancora: "diagnostico", acao: "Ver o Grau de Maturidade" });
  }
  if (d.n === 2) {
    const r = d.rot;
    it.push({ id: "proc", titulo: "Ter ao menos um processo registrado nos 12 campos", exige: r.length ? `${r.length} processo(s) registrado(s).` : "Nenhum processo cadastrado na planilha mestre.", responsavel: "DPO_OPERACIONAL", estado: r.length ? "ok" : "pendente", bloco: 2, ancora: "rot", acao: "Cadastrar o primeiro processo" });
    if (r.length) {
      const sem7a = r.filter((x) => !x.hipotese_tratamento.startsWith("Art. 7º")).length;
      it.push({ id: "7a", titulo: "Campo 7A preenchido em todos os processos", exige: sem7a ? `${sem7a} processo(s) sem hipótese do art. 7º.` : "Todos os processos têm 7A.", responsavel: "DPO_OPERACIONAL", estado: sem7a ? "andamento" : "ok", bloco: 2, ancora: "rot", acao: `Preencher o campo 7A em ${sem7a} processo(s)` });
      const sens = r.filter(hasSensivel);
      if (sens.length) {
        const sem7b = sens.filter((x) => !(x.hipotese_sensivel ?? "").startsWith("Art. 11")).length;
        it.push({ id: "7b", titulo: "Campo 7B preenchido quando há dado pessoal sensível", exige: sem7b ? `${sem7b} processo(s) com dado pessoal sensível sem hipótese do art. 11.` : "Todos os processos com dado pessoal sensível têm 7B.", responsavel: "DPO_OPERACIONAL", estado: sem7b ? "critico" : "ok", bloco: 2, ancora: "rot", acao: `Preencher o campo 7B em ${sem7b} processo(s)` });
      }
      const risco = r.filter(isRisky);
      if (risco.length) {
        const semJ = risco.filter((x) => (x.justificativa_mitigacao ?? "").trim().length < 20).length;
        it.push({ id: "mit", titulo: "Justificativa de medidas mitigadoras nos processos de risco", exige: semJ ? `${semJ} processo(s) com menores ou dado pessoal sensível sem justificativa (mínimo 20 caracteres).` : "Todos os processos de risco estão justificados.", responsavel: "DPO_OPERACIONAL", estado: semJ ? "andamento" : "ok", bloco: 2, ancora: "rot", acao: `Justificar ${semJ} processo(s) de risco` });
      }
    }
  }
  if (d.n === 3) {
    const prot = d.endpoints.filter((e) => e.protegido).length;
    it.push({ id: "end", titulo: "Cadastrar e proteger todos os endpoints", exige: d.endpoints.length ? `${prot} de ${d.endpoints.length} computadores com BitLocker ativo.` : "Nenhum computador cadastrado.", responsavel: "DPO_OPERACIONAL", estado: d.endpoints.length ? est(prot, d.endpoints.length) : "pendente", bloco: 3, ancora: "endpoints", acao: d.endpoints.length ? `Proteger ${d.endpoints.length - prot} computador(es)` : "Cadastrar o primeiro computador" });
    if (d.endpoints.length && d.chaves !== null) {
      it.push({ id: "chv", titulo: "Registrar as chaves de recuperação no cofre", exige: `${Math.min(d.chaves, d.endpoints.length)} de ${d.endpoints.length} chaves registradas.`, responsavel: "DPO_OPERACIONAL", estado: est(d.chaves, d.endpoints.length), bloco: 3, ancora: "endpoints", acao: "Registrar as chaves de recuperação" });
    }
    const comHash = d.cofres.filter((c) => c.hash_integridade).length;
    it.push({ id: "cof", titulo: "Cadastrar cofre e gerar o hash de integridade da pasta", exige: d.cofres.length ? `${comHash} de ${d.cofres.length} cofres com SHA-256.` : "Nenhum cofre Cryptomator catalogado.", responsavel: "DPO_OPERACIONAL", estado: d.cofres.length ? est(comHash, d.cofres.length) : "pendente", bloco: 3, ancora: "cofres", acao: d.cofres.length ? "Gerar o hash dos cofres" : "Catalogar o primeiro cofre" });
  }
  if (d.n === 4) {
    // Só bloqueia lote de mês anterior ao corrente sem hash; o mês corrente não bloqueia.
    const atual = new Date(d.agora).toISOString().slice(0, 7);
    const semHash = d.lotes.filter((l) => !l.hash_sha256 && l.mes_referencia < atual).sort((a, b) => a.mes_referencia.localeCompare(b.mes_referencia));
    if (!d.lotes.length) it.push({ id: "lote", titulo: "Registrar o lote mensal de auditoria", exige: "Nenhum lote pgAudit extraído.", responsavel: "DPO_OPERACIONAL", estado: "pendente", bloco: 4, ancora: "lotes", acao: `Extrair o lote de ${mesExtenso(atual)}`, sugestao: `São 2 passos: (1) extrair o lote de ${mesExtenso(atual)}, (2) gerar o hash SHA-256 ao fechar o mês.` });
    else it.push({ id: "lote", titulo: "Selar os lotes mensais de auditoria com hash", exige: semHash.length ? `Lotes de meses fechados sem hash: ${semHash.map((l) => mesExtenso(l.mes_referencia)).join(", ")}.` : "Todos os lotes de meses fechados estão selados.", responsavel: "DPO_OPERACIONAL", estado: semHash.length ? "atencao" : "ok", bloco: 4, ancora: "lotes", acao: semHash.length ? `Selar o lote de ${mesExtenso(semHash[0]!.mes_referencia)}` : "Ver lotes", sugestao: semHash.length ? `São 3 passos: (1) abrir o lote de ${mesExtenso(semHash[0]!.mes_referencia)}, (2) conferir as linhas, (3) gerar o hash e selar.` : undefined });
    const abertos = d.incidentes.filter((i) => !i.encerrado_em);
    const encerrado = d.incidentes.some((i) => i.encerrado_em && i.passos.every(Boolean) && i.enviado_anpd_em);
    for (const i of abertos) {
      const feitos = i.passos.filter(Boolean).length;
      const ref = `#${i.id.slice(0, 6)}`;
      it.push({ id: `inc-${i.id}`, titulo: `Concluir as 6 etapas do incidente ${ref}`, exige: `${feitos} de 6 etapas concluídas.`, responsavel: "DPO_OPERACIONAL", estado: feitos ? "andamento" : "pendente", bloco: 4, ancora: "incidentes", acao: `Concluir a etapa ${Math.min(feitos + 1, 6)} de 6 do incidente ${ref}`, sugestao: `Faltam ${6 - feitos} etapa(s); registre data e responsável em cada uma.` });
      const decorrido = d.agora - new Date(i.iniciado_em).getTime();
      const vencido = decorrido > 72 * 3600_000;
      const proximo = !vencido && decorrido > 48 * 3600_000;
      if (!i.enviado_anpd_em) it.push({ id: `anpd-${i.id}`, titulo: `Formulário ANPD do incidente ${ref}`, exige: vencido ? "SLA de 72 horas vencido — comunique a ANPD imediatamente." : "Preencher e enviar dentro do SLA de 72 horas.", responsavel: "DPO_OPERACIONAL", estado: vencido ? "critico" : proximo ? "atencao" : "pendente", bloco: 4, ancora: "incidentes", acao: `Preencher o formulário ANPD do incidente ${ref}`, sugestao: vencido ? "SLA de 72 horas estourado: é a pendência mais urgente deste CNPJ." : proximo ? "Menos de 24 horas para o fim do SLA de 72 horas." : undefined });
    }
    if (!abertos.length && !encerrado) it.push({ id: "inc", titulo: "Concluir um incidente com as 6 etapas e comunicação à ANPD", exige: "O PI-04 exige ao menos um incidente (real ou simulado) encerrado.", responsavel: "DPO_OPERACIONAL", estado: "pendente", bloco: 4, ancora: "incidentes", acao: "Declarar e conduzir um incidente" });
  }
  const base = it.every((x) => x.estado === "ok");
  return [...it, ...assinaturas(n, sigs, base)];
}

/** A pendência mais prioritária: primeira não concluída, preferindo a do papel do usuário. */
export function proximoPasso(itens: Pendencia[], roles: string[]): Pendencia | null {
  const abertos = itens.filter((i) => i.estado !== "ok" && i.estado !== "bloqueado" || (i.estado === "bloqueado" && !i.id.startsWith("sig")));
  return abertos.find((i) => roles.includes(i.responsavel) || roles.includes("ADMIN_SISTEMA") && i.responsavel !== "C_SUITE") ?? abertos[0] ?? null;
}

const ORDEM: Record<Estado, number> = { critico: 0, atencao: 1, andamento: 2, pendente: 3, bloqueado: 4, ok: 5 };
/** Vencidas primeiro, depois atenção, em andamento, não iniciadas, aguardando; concluídas por último. */
export const ordenar = (itens: Pendencia[]) => [...itens].sort((a, b) => ORDEM[a.estado] - ORDEM[b.estado]);

/** Bloco 5: RIPD (sistema, Escudo Digital, mitigação por risco) + duas assinaturas do PI-05. */
export function pendenciasBloco5(d: { sistema: string; escudo: string; riscos: { label: string; mitig: string }[] }, sigs: Record<string, Signature>): Pendencia[] {
  const it: Pendencia[] = [];
  it.push({ id: "sis", titulo: "Descrever o sistema avaliado", exige: d.sistema.trim().length > 2 ? "Sistema descrito." : "Campo do sistema avaliado vazio.", responsavel: "DPO_OPERACIONAL", estado: d.sistema.trim().length > 2 ? "ok" : "pendente", bloco: 5, ancora: "ripd", acao: "Descrever o sistema avaliado", sugestao: "Preencha o campo do sistema avaliado no topo do RIPD; ele é salvo ao sair do campo." });
  const esc = d.escudo.trim().length;
  it.push({ id: "esc", titulo: "Escrever o Escudo Digital", exige: esc > 20 ? "Escudo Digital escrito." : `${esc} de 21 caracteres mínimos.`, responsavel: "DPO_OPERACIONAL", estado: esc > 20 ? "ok" : esc ? "andamento" : "pendente", bloco: 5, ancora: "ripd", acao: "Escrever o Escudo Digital", sugestao: "Explique no Escudo Digital por que o tratamento é necessário e por que não há alternativa menos invasiva." });
  const sem = d.riscos.filter((r) => r.mitig.trim().length <= 10);
  it.push({ id: "mitig", titulo: "Mitigar cada risco de IA", exige: sem.length ? `Faltam ${sem.length} de ${d.riscos.length} riscos: ${sem.map((r) => r.label).join(", ")}.` : `${d.riscos.length} de ${d.riscos.length} riscos mitigados.`, responsavel: "DPO_OPERACIONAL", estado: sem.length === 0 ? "ok" : sem.length < d.riscos.length ? "andamento" : "pendente", bloco: 5, ancora: "ripd", acao: sem.length ? `Mitigar o risco "${sem[0]!.label}"` : "Ver riscos", sugestao: sem.length ? `Abra o risco "${sem[0]!.label}" e preencha "Medidas de mitigação…" com mais de 10 caracteres.` : undefined });
  const base = it.every((x) => x.estado === "ok");
  return [...it, ...assinaturas(5, sigs, base)];
}

/** Kanban: cartão aberto sem responsável ou sem prazo é pendência. */
export function pendenciasKanban(cards: { id: string; what: string; who: string; when: string; column: string }[]): Pendencia[] {
  const abertos = cards.filter((c) => c.column !== "done");
  const incompletos = abertos.filter((c) => !c.who.trim() || !c.when.trim());
  const it: Pendencia[] = incompletos.map((c) => ({ id: `card-${c.id}`, titulo: `Completar o cartão "${c.what}"`, exige: [!c.who.trim() && "sem responsável", !c.when.trim() && "sem prazo"].filter(Boolean).join(" e ") + ".", responsavel: "DPO_OPERACIONAL", estado: "pendente", bloco: 0, ancora: "quadro", acao: `Completar o cartão "${c.what}"`, sugestao: `Abra o cartão "${c.what}" e preencha quem executa e até quando.` }));
  if (abertos.length && !incompletos.length) it.push({ id: "cards-ok", titulo: "Cartões abertos com responsável e prazo", exige: `${abertos.length} cartão(ões) em execução completos.`, responsavel: "DPO_OPERACIONAL", estado: "ok", bloco: 0, ancora: "quadro", acao: "Ver quadro" });
  return it;
}
