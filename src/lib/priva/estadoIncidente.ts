import type { Signature } from './store';

export const ETAPAS_INCIDENTE = ['Isolamento', 'Invocação', 'Sandbox', 'Descriptografia', 'Validação', 'Comunicação à ANPD'] as const;
export type IncidenteFonte = {
  id: string; passos: boolean[]; iniciado_em: string; enviado_anpd_em: string | null; encerrado_em: string | null;
  etapas_registro?: unknown;
};
export type FonteIncidente = {
  incidentes: IncidenteFonte[];
  lotes: { mes_referencia: string; hash_sha256: string | null }[];
  assinaturas: Record<string, Signature>;
  agora: number;
};

/** Única derivação de estado. A fonte é o snapshot compartilhado do CNPJ lido do banco. */
export function carregarEstadoIncidente(incidenteId: string, fonte: FonteIncidente) {
  const incidente = fonte.incidentes.find(i => i.id === incidenteId);
  if (!incidente) throw new Error('Incidente não encontrado');
  const registro = (incidente.etapas_registro ?? {}) as Record<string, { data?: string; responsavel?: string }>;
  const enviado = !!incidente.enviado_anpd_em;
  const itens = ETAPAS_INCIDENTE.map((nome, index) => {
    const evidencia = registro[String(index + 1)];
    // Um booleano legado não comprova o envio da comunicação.
    const concluida = index === 5 ? enviado : incidente.passos[index] === true;
    return { numero: index + 1, nome, concluida, data: evidencia?.data ?? null, responsavel: evidencia?.responsavel ?? null };
  });
  const correcoes = itens.filter(i => !i.concluida || !i.data || !i.responsavel).map(i => ({
    mensagem: i.numero === 6 && !enviado ? 'Formulário ANPD não enviado' : !i.concluida ? `Etapa ${String(i.numero).padStart(2, '0')} (${i.nome}) pendente` : `Etapa ${String(i.numero).padStart(2, '0')} (${i.nome}) sem data ou responsável registrado`,
    ancora: i.numero === 6 ? 'anpd' : `incidente-etapa-${i.numero}`,
    acao: i.numero === 6 ? 'Abrir formulário ANPD' : 'Completar etapa',
  }));
  if (incidente.encerrado_em) correcoes.push({ mensagem: 'Incidente já encerrado', ancora: 'incidentes', acao: 'Ver incidente' });
  const atual = new Date(fonte.agora).toISOString().slice(0, 7);
  return {
    incidente,
    etapas: { total: 6 as const, concluidas: itens.filter(i => i.concluida).length, itens },
    anpd: { enviado, enviado_em: incidente.enviado_anpd_em, prazo_vencido: (incidente.enviado_anpd_em ? Date.parse(incidente.enviado_anpd_em) : fonte.agora) > Date.parse(incidente.iniciado_em) + 72 * 3600000 },
    assinaturas: { dpo: !!(fonte.assinaturas['PI-04-DPO'] || fonte.assinaturas['PI-04']), diretoria: !!(fonte.assinaturas['PI-04-DIR'] || fonte.assinaturas['PI-04']) },
    lotes: { total: fonte.lotes.length, abertos: fonte.lotes.filter(l => !l.hash_sha256 && l.mes_referencia < atual) },
    podeEncerrar: correcoes.length === 0,
    motivos_bloqueio: correcoes.map(c => c.mensagem),
    correcoes,
  };
}
export type EstadoIncidente = ReturnType<typeof carregarEstadoIncidente>;