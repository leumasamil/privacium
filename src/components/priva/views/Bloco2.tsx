import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { AJUDA } from "@/lib/priva/ajuda";
import { AppLink as Link } from "@/components/priva/AppLink";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CitacaoNormativa } from "@/components/priva/CitacaoNormativa";
import { AlertTriangle, BookOpen, Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AREAS_SETORES, ROTULO_AREA_SETOR, areaSetorCompleto, chaveDaArea, exibirAreaSetor } from "@/lib/priva/areasSetores";
import { AJUDA_CICLO, CITACOES_LGPD, DESCRICAO_CICLO, ESPECIES, ETAPA1, ETAPA2, NOTA_CICLO, NOTA_ETAPA2_COMPARTILHAR, NOTA_ETAPA2_ELIMINAR, NOTA_METODO_CICLO, NOTA_RESPONSAVEL_ETAPAS, ROTULO_ETAPA1, ROTULO_ETAPA2, alertaRetencao, alternar, cicloDaLinha, citacoesISO, destinoDeclarado, formatarCiclo, formatarCicloEtapas, generosMarcados, temEtapa2, type CicloVida, type Genero } from "@/lib/priva/cicloVida";
import { GrafoCadeiaCustodia } from "@/components/priva/CadeiaCustodia";
import { ContinuacaoReceptor } from '@/components/priva/ContinuacaoReceptor';
import { continuacaoConforme, lerContinuacao } from '@/lib/priva/continuacaoReceptor';
import { linhasAtivas, linhasExcluidas, receptoraExistente } from "@/lib/priva/cadeiaCustodia";
import { useEnquadramento } from '@/lib/priva/useEnquadramento';
import { citacaoSimplificada } from '@/lib/priva/enquadramento';
import { ALERTA_FINALIDADE_OPERADOR, ALERTA_PRODUTO_AUSENTE, DADOS, HIPOTESES_7A, HIPOTESES_7B, INFRA, INSUMOS, LITERAL_ART5_VI, LITERAL_ART5_VII, MEIOS, NOTA_DESTINO_OPERADOR, NOTA_PRT, PAPEIS_AGENTE, ROTULO_PRT, alertasPRTSemDestino, descreverDestinoPRT, prtExternosBloqueados, produtosDaLinha, rotuloPRT, alertaPRTSemDestino, destinoPRTCompleto, type ProdutoTratamento, ROTULO_PAPEL, SALVAGUARDAS, SENSIVEIS, TITULARES, alertaFinalidadeOperador, alertaProdutoAusente, alertasCoerencia, finalidadeDoContrato, hasSensivel, isRisky, montarLinhaReceptora, normalizeHipoteses, sugerir, sugerirProduto, sugestaoFinalidade, finalidadeEquivalente, contadorPadronizadas, FONTE_LGPD, DESTINO_RECEPTOR_PENDENTE, receptorSemEscolha, alertaProduzirSemPRT, alertaOrigemExcluida, validateRot, type DestinoProduto, type OrigemCompartilhamento, type PapelAgente, type RotInput, type RotRow } from "@/lib/priva/rot";
import { usePriva } from "@/lib/priva/store";
import { DEMO_ROT } from "@/lib/priva/demo";
import { alertaRetencaoLinha, pendenciasPI02 } from "@/lib/priva/rot";
import { responsavelDaArea, useMembros } from "@/components/priva/MembrosEmpresa";
import { useTerceiros, type Terceiro } from "@/components/priva/TerceirosEmpresa";
import { ALERTA_TERCEIRO_SEM_CONTRATO, LITERAL_ART6_I, terceiroBloqueado } from "@/lib/priva/terceiros";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BadgeFornecedorROT } from '@/components/priva/AlertaFornecedorVazado';



const HEADS = ["ID Processo", "Área › Setor", "Papel do agente", "Ciclo do dado pessoal (tipo de tratamento)", "Categoria de Titulares", "Dado pessoal", "Dado pessoal sensível", "Finalidade Específica",
  "7A. Hipótese art. 7º (dado pessoal)", "7B. Hipótese art. 11 (dado pessoal sensível)", "Tempo de Retenção", "Base do Prazo", "Comunicação e transferência / Destinatários",
  "Insumo (documento de entrada)", ROTULO_PRT, "Meio de fornecimento", "Salvaguardas de Segurança", "Infraestrutura / Mídia"];

const empty = (cnpj: string, papel: PapelAgente = "CONTROLADOR"): RotInput => ({
  empresa_cnpj: cnpj, setor: "RH", genero_verbo: "Coletar", ciclo_vida: {}, categoria_titulares: [], dados_pessoais: [], dados_sensiveis: ["N/A"],
  finalidade_especifica: "", hipotese_tratamento: "", hipotese_sensivel: null, tempo_retencao: "", base_prazo: "", compartilhamento: "Não Compartilhado",
  salvaguardas: [], infraestrutura: "Servidor Local", justificativa_mitigacao: null, area_setor: null, insumo: null, meio_fornecimento: null,
  papel_agente: papel, contrato_controlador: null, produto_interno: null, destino_produto: null, prazo_produto: null, fundamento_produto: null, origem_compartilhamento: null, produtos_tratamento: [],
});

export function Bloco2({ origemAusente = false }: { origemAusente?: boolean } = {}) {
  const { cnpj, log, roles, demo } = usePriva();
  const enq = useEnquadramento();
  const papelPadrao = ((enq.declaracao?.criterios as { papelAgente?: PapelAgente } | null)?.papelAgente) ?? "CONTROLADOR";
  const qc = useQueryClient();
  const { data: terceiros = [] } = useTerceiros();
  const canEdit = (roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA"));
  const key = ["registro_operacoes", cnpj] as const;
  const { data: todas = [] } = useQuery({
    queryKey: [...key, demo, origemAusente],
    enabled: !!cnpj,
    queryFn: async (): Promise<RotRow[]> => {
      if (demo) return origemAusente ? DEMO_ROT.filter(r => r.id !== "demo-rot-removida") : DEMO_ROT;
      const { data, error } = await supabase.from("registro_operacoes").select("*").eq("empresa_cnpj", cnpj ?? "").order("codigo");
      if (error) throw error;
      return data;
    },
  });
  // Planilha mestre e gates do PI-02 só com linhas ativas; o grafo e a seção histórica do PI-02 recebem todas.
  const rows = useMemo(() => linhasAtivas(todas), [todas]);
  const excluidas = useMemo(() => linhasExcluidas(todas), [todas]);
  useEffect(() => {
    if (!cnpj || demo) return;
    const ch = supabase.channel(`rot_${cnpj}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "registro_operacoes", filter: `empresa_cnpj=eq.${cnpj}` }, () => void qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnpj, qc, demo]);

  const [edit, setEdit] = useState<{ id: string | null; form: RotInput } | null>(null);

  if (!cnpj) return <Panel title="Registro de Operações"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;

  const save = async () => {
    if (demo) return avisarAcaoDemo();
    if (!edit) return;
    // Operador: a finalidade é sempre a do contrato com o controlador (LGPD art. 39), nunca própria.
    const form = edit.form.papel_agente === "OPERADOR" ? { ...edit.form, finalidade_especifica: finalidadeDoContrato(edit.form.contrato_controlador ?? "") } : edit.form;
    const err = validateRot({ ...normalizeHipoteses(form), continuacao_receptor: todas.find(r => r.id === edit.id)?.continuacao_receptor });
    if (err) { toast.error(err); return; }
    const ciclo = cicloDaLinha(form);
    const prts = produtosDaLinha(form).filter((p) => p.nome.trim());
    const payload = { ...normalizeHipoteses(form), produtos_tratamento: prts, produto_interno: prts[0]?.nome ?? null, ciclo_vida: ciclo, genero_verbo: generosMarcados(ciclo)[0] ?? "Coletar", justificativa_mitigacao: isRisky(form) ? form.justificativa_mitigacao : null };
    const { data, error } = edit.id
      ? await supabase.from("registro_operacoes").update(payload).eq("id", edit.id).select("id, codigo").single()
      : await supabase.from("registro_operacoes").insert(payload).select("id, codigo").single();
    if (error) { toast.error(error.message); return; }
    const rotId = edit.id ?? data.id;
    log(edit.id ? "UPDATE" : "INSERT", "registro_operacoes", `Processo ${data.codigo}`);
    for (const a of alertasCoerencia(form)) log("INSERT", "registro_operacoes", `Alerta de coerência dado × hipótese em ${data.codigo}: ${a}`);
    if (alertaFinalidadeOperador(edit.form)) log("INSERT", "registro_operacoes", `Alerta em ${data.codigo}: ${ALERTA_FINALIDADE_OPERADOR}`);
    // Destino INTERNO de cada PRT: cria a linha receptora no ROT do setor de destino, com origem rastreada.
    let mudou = false;
    const atualizados: ProdutoTratamento[] = [];
    for (const [i, p] of prts.entries()) {
      const d = p.destino;
      if (d?.tipo === "INTERNO" && d.area_setor_destino && !d.linha_receptor_id) {
        // B.4: mesmo PRT, mesma origem e mesmo setor → vincula à linha receptora existente (nunca duplica).
        const existente = receptoraExistente(rows, rotId, d.area_setor_destino, p.nome);
        if (existente) {
          atualizados.push({ ...p, destino: { ...d, linha_receptor_id: existente.id, linha_receptor_codigo: existente.codigo } });
          mudou = true;
          log("UPDATE", "registro_operacoes", `Compartilhamento interno vinculado à linha existente: ${data.codigo} ${rotuloPRT(i)} → ${existente.codigo}`);
          continue;
        }
        const areaDestino = d.area_setor_destino.split("›")[0]?.trim() ?? "";
        const receptor = montarLinhaReceptora({ ...payload, id: rotId, codigo: data.codigo }, d.area_setor_destino, chaveDaArea(areaDestino), p.nome);
        const ins = await supabase.from("registro_operacoes").insert(receptor).select("id, codigo").single();
        if (ins.error) { toast.error(`Linha receptora de ${rotuloPRT(i)} não criada: ${ins.error.message}`); atualizados.push(p); continue; }
        atualizados.push({ ...p, destino: { ...d, linha_receptor_id: ins.data.id, linha_receptor_codigo: ins.data.codigo } });
        mudou = true;
        log("INSERT", "registro_operacoes", `Compartilhamento interno: ${data.codigo} ${rotuloPRT(i)} → ${ins.data.codigo} (${d.area_setor_destino})`);
        toast.success(`Linha ${ins.data.codigo} criada no setor receptor (${d.area_setor_destino})`);
      } else atualizados.push(p);
    }
    if (mudou) await supabase.from("registro_operacoes").update({ produtos_tratamento: atualizados }).eq("id", rotId);
    toast.success(`${data.codigo} salvo`);
    setEdit(null);
    void qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (r: RotRow) => {
    if (demo) return avisarAcaoDemo();
    // Exclusão lógica (LGPD art. 37): a linha permanece no banco com data, autor e motivo; a RPC grava a trilha.
    const motivo = prompt(`Motivo da exclusão de ${r.codigo} (mínimo 10 caracteres). A linha sai da planilha, mas permanece no registro histórico (LGPD art. 37).`);
    if (motivo === null) return;
    if (motivo.trim().length < 10) { toast.error("Informe o motivo da exclusão (mínimo 10 caracteres)."); return; }
    const { error } = await supabase.rpc("excluir_linha_rot", { _rot_id: r.id, _motivo: motivo.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success(`${r.codigo} excluída logicamente — permanece no registro histórico`);
    void qc.invalidateQueries({ queryKey: key });
  };

  const assinar = async (r: RotRow, etapa: 1 | 2) => {
    if (demo) return avisarAcaoDemo();
    const { data, error } = await supabase.rpc("assinar_etapa_rot", { _rot_id: r.id, _etapa: etapa });
    if (error) { toast.error(error.message); return; }
    const a = data as { assinante: string };
    toast.success(`Etapa ${etapa} assinada por ${a.assinante} — hash registrado na trilha`);
    void qc.invalidateQueries({ queryKey: key });
  };

  const riskyCount = rows.filter(isRisky).length;
  const { semDestino, semProduto, receptoresPendentes, semDestinoPRT, externosBloqueados, ready } = pendenciasPI02(rows, terceiros);
  const NUMS = ["", "1. ", "1A. ", "2. ", "3. ", "4. ", "5. ", "6. ", "", "", "8. ", "9. ", "10. ", "10A. ", "10C. ", "10B. ", "11. ", "12. "];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 2 · (R) Ciclo Privacium Semestral · Art. 37 LGPD" title="Registrar as Operações de Tratamento">
        Inventário em 12 campos (campo 7 dividido em 7A — art. 7º, dado pessoal — e 7B — art. 11, dado pessoal sensível), com insumo e meio de fornecimento (10A/10B). Linhas com menores de idade ou dado pessoal sensível recebem tarja vermelha e exigem justificativa das medidas mitigadoras.{" "}
        <Link to="/manual" className="inline-flex items-center gap-1 font-medium text-primary underline"><BookOpen className="h-3 w-3" /> Manual de Uso</Link>
      </PageHeader>
      {AJUDA[2] && <AjudaTarefa {...AJUDA[2]} />}
      <CicloResumo />
      <p data-testid="pi02-contagens" className="text-xs text-muted-foreground">Sem produto: {semProduto} · Sem destino de PRT: {semDestinoPRT} · Aguardando receptor: {receptoresPendentes} · Chancela PI-02: {ready ? "liberada para assinatura" : "bloqueada por pendências impeditivas"}</p>

      <GrafoCadeiaCustodia rows={todas} />

      <Panel id="rot" title={`Planilha mestre · ${rows.length} processos · ${riskyCount} em alerta`} action={canEdit && (
        <Button size="sm" onClick={() => setEdit({ id: null, form: empty(cnpj, papelPadrao) })}><Plus className="h-4 w-4" /> Novo processo</Button>
      )}>
        <p className="mb-2 rounded-sm border border-dashed bg-muted/40 p-2 text-[11px] text-muted-foreground" data-testid="nota-metodo-planilha">{NOTA_METODO_CICLO} {NOTA_RESPONSAVEL_ETAPAS}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2400px] text-xs">
            <thead>
              <tr className="border-b text-left">
                {HEADS.map((h, i) => <th key={h} className={cn("px-2 py-2 font-mono font-medium uppercase tracking-wider text-muted-foreground", h === ROTULO_PRT && "min-w-80")}>{NUMS[i]}{h}{h === ROTULO_PRT && <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal" data-testid="nota-prt-coluna">{NOTA_PRT}</span>}{h === "Finalidade Específica" && <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal" data-testid="contador-finalidades">{contadorPadronizadas(rows)}</span>}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const risk = isRisky(r);
                const retencao = alertaRetencaoLinha(r);
                const origemExcluida = alertaOrigemExcluida(r, todas);
                const origemNaoLocalizada = origemExcluida?.includes("não localizada");
                return (
                  <tr id={`rot-${r.id}`} key={r.id} className={cn("scroll-mt-6 border-b align-top", risk && "border-l-4 border-l-destructive bg-destructive/15")}>
                    <td className="px-2 py-2 font-mono font-semibold text-primary">
                      {r.codigo}
                      {origemExcluida && <Button variant="ghost" size="sm" className="mt-2 h-auto whitespace-normal text-warning-foreground" onClick={() => document.querySelector(`[data-testid="origem-${origemNaoLocalizada ? "nao-localizada" : "excluida"}-${r.codigo}"]`)?.scrollIntoView({ block: "center", inline: "center" })}><AlertTriangle className="h-3 w-3" />Ver alerta do insumo</Button>}
                      {risk && <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-destructive"><AlertTriangle className="h-3 w-3" /> Alerta crítico</p>}
                    </td>
                    <td className="px-2 py-2">{exibirAreaSetor(r)}</td>
                    <td className="px-2 py-2" data-testid={`papel-${r.codigo}`}>
                      {ROTULO_PAPEL[(r.papel_agente as PapelAgente) ?? "CONTROLADOR"]}
                      {r.papel_agente === "OPERADOR" && <p className="mt-1 text-[10px] text-muted-foreground">{NOTA_DESTINO_OPERADOR}</p>}
                    </td>
                    <td className="max-w-72 px-2 py-2">
                      <CicloCelula r={r} />
                      {retencao && <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-warning-foreground" data-testid={`retencao-${r.codigo}`}><AlertTriangle className="h-3 w-3" /> {retencao}</p>}
                    </td>
                    <td className="px-2 py-2"><Tags items={r.categoria_titulares} danger="Menores de Idade" /></td>
                    <td className="px-2 py-2"><Tags items={r.dados_pessoais} /></td>
                    <td className="px-2 py-2"><Tags items={r.dados_sensiveis} safe="N/A" /></td>
                    <td className="max-w-64 px-2 py-2">{r.finalidade_especifica}</td>
                    <td className="px-2 py-2">{r.hipotese_tratamento.startsWith("Art. 7") ? r.hipotese_tratamento : "—"}</td>
                    <td className="px-2 py-2">{r.hipotese_sensivel ?? (r.hipotese_tratamento.startsWith("Art. 11") ? r.hipotese_tratamento : "N/A")}</td>
                    <td className="px-2 py-2">{r.tempo_retencao}{r.prazo_produto && <p className="mt-1 text-[10px] text-muted-foreground" data-testid={`prazo-produto-${r.codigo}`}>Produto: {r.prazo_produto}</p>}</td>
                    <td className="px-2 py-2">{r.base_prazo}{r.fundamento_produto && <p className="mt-1 text-[10px] text-muted-foreground">Produto: {r.fundamento_produto}</p>}</td>
                    <td className="px-2 py-2">{r.compartilhamento}</td>
                    <td className="px-2 py-2">
                      {r.insumo ?? "—"}
                      {(r.origem_compartilhamento as OrigemCompartilhamento | null) && <p className="mt-1 rounded-sm border border-dashed px-1 py-0.5 text-[10px] text-muted-foreground" data-testid={`origem-${r.codigo}`} data-linha-origem-id={(r.origem_compartilhamento as OrigemCompartilhamento).linha_origem_id} data-codigo-origem={(r.origem_compartilhamento as OrigemCompartilhamento).codigo_origem}>Insumo recebido de {(r.origem_compartilhamento as OrigemCompartilhamento).codigo_origem} ({(r.origem_compartilhamento as OrigemCompartilhamento).area_setor_origem})</p>}
                      {origemExcluida && <p role="alert" data-testid={`origem-${origemNaoLocalizada ? "nao-localizada" : "excluida"}-${r.codigo}`} className={cn("mt-2 border-warning bg-warning/10 p-2 text-xs font-semibold text-warning-foreground", origemNaoLocalizada ? "border-2 border-dashed" : "border-l-4")}><AlertTriangle className="mb-1 h-4 w-4" />{origemExcluida}</p>}
                      {r.origem_compartilhamento && canEdit && <ContinuacaoReceptor row={r} rows={rows} onSaved={()=>void qc.invalidateQueries({queryKey:key})} />}
                    </td>
                    <td className="max-w-80 px-2 py-2" data-testid={`produto-${r.codigo}`}>
                      <PRTCelula r={r} terceiros={terceiros} />
                    </td>
                    <td className="px-2 py-2">{r.meio_fornecimento ?? "—"}</td>
                    <td className="px-2 py-2"><Tags items={r.salvaguardas} /></td>
                    <td className="px-2 py-2">{r.infraestrutura}<BadgeFornecedorROT processoId={r.id} /></td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {canEdit && <>
                        <button aria-label="Editar" className="mr-2" onClick={() => {
                          const { id, codigo: _c, criado_por: _p, criado_em: _e, atualizado_em: _a, excluido_em: _x, excluido_por: _xp, motivo_exclusao: _xm, ...form } = r;
                          setEdit({ id, form: normalizeHipoteses(form) });
                        }}><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                        <button aria-label="Excluir" onClick={() => void remove(r)}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                      </>}
                      <AssinaturasRot r={r} onAssinar={(etapa) => void assinar(r, etapa)} />
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={19} className="py-8 text-center text-muted-foreground">Nenhum processo cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {edit && <RotDialog edit={edit} setEdit={setEdit} onSave={save} />}

      <PIOutput dual pi="PI-02: Registro de Operações de Tratamento (ROT)" ready={ready} readyHint={rows.length === 0 ? "Cadastre ao menos um processo na planilha mestre." : [
        semDestino > 0 ? `${semDestino} processo(s) sem destino declarado: a Etapa 2 (compartilhamento com destinatário identificado ou eliminação com prazo e fundamento — LGPD art. 16) é obrigatória para chancelar o PI-02.` : "",
        semProduto > 0 ? `${semProduto} processo(s) com Processar sem PRT declarado — art. 6º, I não comprovado; a chancela do PI-02 fica bloqueada neste estado.` : "",
        semDestinoPRT > 0 ? `${semDestinoPRT} processo(s) com PRT sem destino declarado — art. 16 não comprovado; todo PRT precisa de destino individual na Etapa 2.` : "",
        externosBloqueados > 0 ? `${externosBloqueados} processo(s) com PRT destinado a terceiro sem contrato vigente com o checklist de cláusulas contratuais do método — compartilhamento externo não pode ser chancelado.` : "",
      ].filter(Boolean).join(" ")}>
        <p>Registro conforme Art. 37 da LGPD. {rows.length} operações inventariadas, {riskyCount} com tarja de alerta crítico{semDestino > 0 ? `, ${semDestino} sem destino declarado (Etapa 2)` : ""}{semProduto > 0 ? `, ${semProduto} sem PRT declarado (art. 6º, I)` : ""}{semDestinoPRT > 0 ? `, ${semDestinoPRT} com PRT sem destino` : ""}.</p>
        <p className="mt-2"><b>Ciclo do dado pessoal:</b> {DESCRICAO_CICLO}. {NOTA_CICLO} {NOTA_METODO_CICLO}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {rows.map((r) => (
            <li key={r.id}><b>{r.codigo}</b> — {exibirAreaSetor(r)}. Papel do agente: {ROTULO_PAPEL[(r.papel_agente as PapelAgente) ?? "CONTROLADOR"]}. Ciclo do dado pessoal: {receptorSemEscolha(r) ? `${formatarCicloEtapas(cicloDaLinha(r)).e1}; Etapa 2: ${DESTINO_RECEPTOR_PENDENTE}` : formatarCiclo(cicloDaLinha(r))}. Dados pessoais: {r.dados_pessoais.join(", ")} de {r.categoria_titulares.join(", ")} para {r.finalidade_especifica}. Hipótese de Tratamento (7A): {r.hipotese_tratamento}.{(r.hipotese_sensivel) && <> Dado pessoal sensível (7B): {r.hipotese_sensivel}.</>} Retenção do insumo: {r.tempo_retencao} ({r.base_prazo}).{r.insumo && <> Insumo: {r.insumo}.</>}{alertaOrigemExcluida(r, todas) && <p className="text-warning-foreground">{alertaOrigemExcluida(r, todas)}</p>}{produtosDaLinha(r).map((p, i) => <span key={i}> {rotuloPRT(i)} · {p.nome} → {receptorSemEscolha(r) ? DESTINO_RECEPTOR_PENDENTE : descreverDestinoPRT(p.destino)}.</span>)}{r.meio_fornecimento && <> Meio de fornecimento: {r.meio_fornecimento}.</>}{r.justificativa_mitigacao && <> Medidas mitigadoras: {r.justificativa_mitigacao}</>}<CitacoesCiclo ciclo={cicloDaLinha(r)} /></li>
          ))}
        </ul>
        <section className="mt-4 border-t pt-3" data-testid="pi02-excluidas">
          <p><b>Linhas excluídas logicamente</b> — registro histórico mantido conforme <CitacaoNormativa citacao="LGPD art. 37" />. Linhas excluídas antes da migração 0044 não são recuperáveis — o histórico anterior tem lacunas.</p>
          {excluidas.length === 0 ? <p className="mt-1 text-muted-foreground">Nenhuma linha excluída logicamente.</p> : (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {excluidas.map((r) => (
                <li key={r.id}><b>{r.codigo}</b> — {exibirAreaSetor(r)}. Finalidade: {r.finalidade_especifica}. Excluída em {new Date(r.excluido_em ?? "").toLocaleString("pt-BR")}{r.excluido_por && <> por {r.excluido_por}</>}. Motivo: {r.motivo_exclusao}.</li>
              ))}
            </ul>
          )}
        </section>
      </PIOutput>
    </div>
  );
}

function Tags({ items, danger, safe }: { items: string[]; danger?: string; safe?: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((t) => <Tag key={t} tone={t === danger || (safe && t !== safe) ? "destructive" : "muted"}>{t}</Tag>)}
    </div>
  );
}

function Chips({ options, value, onChange, exclusive }: { options: string[]; value: string[]; onChange: (v: string[]) => void; exclusive?: string }) {
  const [extra, setExtra] = useState("");
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (o: string) => {
    if (value.includes(o)) return onChange(value.filter((v) => v !== o));
    if (exclusive && o === exclusive) return onChange([o]);
    onChange([...value.filter((v) => v !== exclusive), o]);
  };
  return (
    <div className="flex flex-wrap items-center gap-1">
      {all.map((o) => (
        <button type="button" key={o} onClick={() => toggle(o)} className={cn("rounded-sm border px-2 py-0.5 text-xs", value.includes(o) ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>{o}</button>
      ))}
      <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="+ outro" className="w-24 rounded-sm border bg-background px-1 py-0.5 text-xs"
        onKeyDown={(e) => { if (e.key === "Enter" && extra.trim()) { e.preventDefault(); toggle(extra.trim()); setExtra(""); } }} />
    </div>
  );
}

function RotDialog({ edit, setEdit, onSave }: { edit: { id: string | null; form: RotInput }; setEdit: (e: { id: string | null; form: RotInput } | null) => void; onSave: () => void }) {
  const { demo } = usePriva();
  const { data: membros = [] } = useMembros();
  const { data: terceiros = [] } = useTerceiros();
  const f = edit.form;
  const up = (p: Partial<RotInput>) => setEdit({ ...edit, form: { ...f, ...p } });
  const risk = isRisky(f);
  const sensitive = hasSensivel(f);
  const operador = f.papel_agente === "OPERADOR";
  const pendente = receptorSemEscolha(f);
  const dicas = [...sugerir(f), ...sugerirProduto(f)].filter((d) => !d.patch.finalidade_especifica);
  const coerencia = alertasCoerencia(f);
  const retencao = alertaRetencaoLinha(f);
  const erro = validateRot(f);
  const prts = produtosDaLinha(f);
  const setPrts = (l: ProdutoTratamento[]) => up({ produtos_tratamento: l, produto_interno: l[0]?.nome || null });
  const upPrt = (i: number, p: Partial<ProdutoTratamento>) => setPrts(prts.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const areaAtual = (f.area_setor ?? "").split("›")[0]?.trim() || AREAS_SETORES[0]!.area;
  const setorAtual = (f.area_setor ?? "").split("›")[1]?.trim() ?? "";
  const setoresDaArea = AREAS_SETORES.find((a) => a.area === areaAtual)?.setores ?? [];
  const responsavel = responsavelDaArea(membros, f.area_setor);
  const escolherArea = (area: string, setor: string) => up({ area_setor: areaSetorCompleto(area, setor), setor: chaveDaArea(area) });
  const generoBtns = (g: Genero) => {
    const c = cicloDaLinha(f);
    return (
      <fieldset key={g} className="rounded-sm border p-2">
        <legend className="px-1 text-xs font-semibold">{g}{g === "Compartilhar" ? <span className="font-normal text-muted-foreground"> — {NOTA_ETAPA2_COMPARTILHAR}</span> : g === "Eliminar" ? <span className="font-normal text-muted-foreground"> — {NOTA_ETAPA2_ELIMINAR}</span> : null}</legend>
        <div className="flex flex-wrap gap-1">
          {ESPECIES[g].map((e) => {
            const on = (c[g] ?? []).includes(e);
            return <button type="button" key={e} aria-pressed={on} onClick={() => { const n = alternar(c, g, e); up({ ciclo_vida: n, genero_verbo: generosMarcados(n)[0] ?? "Coletar" }); }} className={cn("rounded-sm border px-2 py-0.5 text-xs", on ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>{e}</button>;
          })}
        </div>
      </fieldset>
    );
  };
  return (
    <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{edit.id ? "Editar processo" : "Novo processo de tratamento"}</DialogTitle></DialogHeader>
        <div className={cn("grid gap-4 md:grid-cols-2", risk && "rounded-sm border-l-4 border-destructive pl-3")}>
          {!edit.id && (
            <Field label={`1. ${ROTULO_AREA_SETOR} (a área gera o ID Processo)`} wide>
              <div className="grid gap-2 sm:grid-cols-2">
                <select aria-label="Área" className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={areaAtual} onChange={(e) => escolherArea(e.target.value, "")}>
                  {AREAS_SETORES.map((a) => <option key={a.area} value={a.area}>{a.area}</option>)}
                </select>
                <select aria-label="Setor" className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={setoresDaArea.includes(setorAtual) ? setorAtual : setorAtual ? "__outro__" : ""} onChange={(e) => escolherArea(areaAtual, e.target.value === "__outro__" ? "" : e.target.value)}>
                  <option value="">Setor…</option>
                  {setoresDaArea.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__outro__">outro (especificar)</option>
                </select>
              </div>
              {(setorAtual && !setoresDaArea.includes(setorAtual)) && <Input className="mt-1" value={setorAtual} onChange={(e) => escolherArea(areaAtual, e.target.value)} placeholder="Especifique o setor" />}
              {responsavel && <p className="text-[11px] text-muted-foreground" data-testid="responsavel-area">Responsável (R) vinculado: <b>{responsavel}</b> — cadastro de membros do Bloco 1.</p>}
            </Field>
          )}
          <Field label="1A. Papel do agente neste tratamento — LGPD art. 5º, VI e VII" wide>
            <select aria-label="Papel do agente" className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.papel_agente} onChange={(e) => up({ papel_agente: e.target.value as PapelAgente })}>
              {PAPEIS_AGENTE.map((p) => <option key={p} value={p}>{ROTULO_PAPEL[p]}</option>)}
            </select>
            <p className="text-[11px] text-muted-foreground">Padrão herdado do enquadramento (Bloco 1), editável por linha. Art. 5º, VI: "{LITERAL_ART5_VI}". Art. 5º, VII: "{LITERAL_ART5_VII}".</p>
          </Field>
          <Field label="2. Ciclo do dado pessoal (tipo de tratamento)" wide>
            <p className="text-[11px] text-muted-foreground">{AJUDA_CICLO}</p>
            <p className="rounded-sm border border-dashed bg-muted/40 p-2 text-[11px] text-muted-foreground" data-testid="nota-prt-campo2">{NOTA_PRT}</p>
            <p className="rounded-sm border border-dashed bg-muted/40 p-2 text-[11px] text-muted-foreground" data-testid="nota-metodo-ciclo">{NOTA_METODO_CICLO} {NOTA_RESPONSAVEL_ETAPAS}</p>
            <div className="space-y-2" data-testid="ciclo-vida">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{ROTULO_ETAPA1}</p>
                <div className="grid gap-2 sm:grid-cols-3">{ETAPA1.map(generoBtns)}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{ROTULO_ETAPA2}</p>
                {pendente ? <p className="text-xs font-semibold text-warning-foreground">{DESTINO_RECEPTOR_PENDENTE}</p> : operador ? (
                  <p className="rounded-sm border border-dashed bg-muted/40 p-2 text-[11px] text-muted-foreground" data-testid="destino-operador">{NOTA_DESTINO_OPERADOR} — o destino (Etapa 2) é definido pelo controlador e exibido como somente leitura.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">{ETAPA2.map(generoBtns)}</div>
                )}
              </div>
            </div>
            {retencao && <p role="alert" className="flex items-center gap-1 text-xs font-semibold text-warning-foreground" data-testid="alerta-retencao"><AlertTriangle className="h-3 w-3" /> {retencao}</p>}
          </Field>
          <Field label={`10C. ${ROTULO_PRT} — obrigatório quando houver Processar (Etapa 1)`} wide>
            <p className="text-[11px] text-muted-foreground">{NOTA_PRT}</p>
            <div className="space-y-1" data-testid="lista-prt">
              {prts.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-14 font-mono text-xs font-semibold text-primary">{rotuloPRT(i)}</span>
                  <Input value={p.nome} placeholder="Ex.: Ficha cadastral" onChange={(e) => upPrt(i, { nome: e.target.value })} />
                  <button type="button" aria-label={`Remover ${rotuloPRT(i)}`} onClick={() => setPrts(prts.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={() => setPrts([...prts, { nome: "" }])}><Plus className="h-3 w-3" /> Adicionar PRT</Button>
            </div>
            {alertaProduzirSemPRT(f) && <p role="alert" data-testid="alerta-produzir-sem-prt" className="text-xs font-semibold text-warning-foreground">{alertaProduzirSemPRT(f)}</p>}
            {alertaProdutoAusente(f) && <p role="alert" data-testid="alerta-produto" className="flex items-center gap-1 text-xs font-semibold text-warning-foreground"><AlertTriangle className="h-3 w-3" /> {ALERTA_PRODUTO_AUSENTE} A chancela do PI-02 fica bloqueada neste estado.</p>}
          </Field>
          {!pendente && !operador && (prts.length > 0 || temEtapa2(cicloDaLinha(f))) && (
            <Field label={ROTULO_ETAPA2} wide>
              <div className="space-y-2" data-testid="etapa2-lista">
                {prts.map((p, i) => <DestinoPRTEditor key={i} indice={i} prt={p} linha={f} terceiros={terceiros} onChange={(d) => upPrt(i, { destino: d })} />)}
                <div className="rounded-sm border border-dashed p-2 text-xs" data-testid="insumo-residual">
                  <b>(insumo residual)</b> → {f.tempo_retencao.trim() ? `Eliminar em ${f.tempo_retencao} (${f.base_prazo || "fundamento a definir"})` : "preencha os campos 8 e 9 (prazo e fundamento do insumo original — LGPD art. 16)"}
                </div>
              </div>
            </Field>
          )}
          <Field label="3. Categoria de Titulares" wide><Chips options={TITULARES} value={f.categoria_titulares} onChange={(v) => up({ categoria_titulares: v })} /></Field>
          <Field label="4. Dado pessoal" wide><Chips options={DADOS} value={f.dados_pessoais} onChange={(v) => up({ dados_pessoais: v })} /></Field>
          <Field label="5. Dado pessoal sensível" wide><Chips options={SENSIVEIS} value={f.dados_sensiveis} exclusive="N/A" onChange={(v) => up({ dados_sensiveis: v, hipotese_sensivel: v.some((x) => x !== "N/A") ? f.hipotese_sensivel : null })} /></Field>
          {operador ? (
            <Field label="6. Finalidade vinculada ao contrato com o controlador — LGPD art. 39" wide>
              <Input value={f.contrato_controlador ?? ""} placeholder="Contrato de prestação de serviços nº …" onChange={(e) => up({ contrato_controlador: e.target.value || null })} />
              <p className="text-[11px] text-muted-foreground">Finalidade da linha (somente leitura): {(f.contrato_controlador ?? "").trim() ? finalidadeDoContrato(f.contrato_controlador ?? "") : "informe o contrato com o controlador"}.</p>
              {alertaFinalidadeOperador(f) && <p role="alert" data-testid="alerta-finalidade-operador" className="flex items-center gap-1 text-xs font-semibold text-warning-foreground"><AlertTriangle className="h-3 w-3" /> {ALERTA_FINALIDADE_OPERADOR}</p>}
            </Field>
          ) : (
            <Field label="6. Finalidade Específica" wide>
              <Textarea value={f.finalidade_especifica} onChange={(e) => up({ finalidade_especifica: e.target.value })} />
              {(() => { const sug = sugestaoFinalidade(f); return sug && f.finalidade_especifica.trim() !== sug.finalidade && !f.finalidade_especifica.trim() ? (
                <Button type="button" size="sm" variant="outline" data-testid="sugestao-finalidade" className="h-auto whitespace-normal py-1 text-left text-xs" onClick={() => up({ finalidade_especifica: sug.finalidade })}><span><b>Sugerido — confirme:</b> {sug.finalidade}<span className="block text-[10px] text-muted-foreground">Origem: {sug.origem}</span></span></Button>) : null; })()}
              {(() => { const eq = finalidadeEquivalente(f); return eq ? (
                <p data-testid="finalidade-equivalente" className="flex flex-wrap items-center gap-2 text-xs text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Existe finalidade padronizada equivalente: '{eq}'. Usar a padronizada? <Button type="button" size="sm" variant="outline" className="h-6 text-xs" onClick={() => up({ finalidade_especifica: eq })}>Usar a padronizada</Button></p>) : null; })()}
              <p className="text-[10px] text-muted-foreground">LGPD art. 6º, I: "{LITERAL_ART6_I}". Fonte: {FONTE_LGPD}</p>
            </Field>
          )}
          <Field label="7A. Hipótese de Tratamento — art. 7º (dado pessoal, art. 5º, I)" wide>
            <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.hipotese_tratamento} onChange={(e) => up({ hipotese_tratamento: e.target.value })}>
              <option value="">Selecione…</option>
              {HIPOTESES_7A.map((h) => <option key={h}>{h}</option>)}
            </select>
          </Field>
          <Field label="7B. Hipótese de Tratamento — art. 11 (dado pessoal sensível, art. 5º, II)" wide>
            <select disabled={!sensitive} className="w-full rounded-sm border bg-background px-2 py-2 text-sm disabled:opacity-50" value={f.hipotese_sensivel ?? ""} onChange={(e) => up({ hipotese_sensivel: e.target.value || null })}>
              <option value="">{sensitive ? "Selecione…" : "Não se aplica — nenhum dado pessoal sensível no campo 5"}</option>
              {HIPOTESES_7B.map((h) => <option key={h}>{h}</option>)}
            </select>
            {sensitive && <p className="text-[11px] text-muted-foreground">Obrigatório: o campo 7A cobre os dados pessoais e o 7B cobre o dado pessoal sensível.</p>}
          </Field>
          <Field label="8. Tempo de Retenção"><Input value={f.tempo_retencao} placeholder="5 anos pós-rescisão" onChange={(e) => up({ tempo_retencao: e.target.value })} /></Field>
          <Field label="9. Base do Prazo"><Input value={f.base_prazo} placeholder="Art. 206 do Código Civil" onChange={(e) => up({ base_prazo: e.target.value })} /></Field>
          <Field label="10. Comunicação e transferência / Destinatários"><Input value={f.compartilhamento} onChange={(e) => up({ compartilhamento: e.target.value })} /></Field>
          <Field label="10A. Insumo (documento de entrada) — LGPD art. 5º, I / ISO/IEC 27002:2022 (controle em verificação)">
            <Chips options={INSUMOS} value={f.insumo ? [f.insumo] : []} onChange={(v) => up({ insumo: v[v.length - 1] ?? null })} />
          </Field>
          <Field label="10B. Meio de fornecimento — LGPD art. 37">
            <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.meio_fornecimento ?? ""} onChange={(e) => up({ meio_fornecimento: e.target.value || null })}>
              <option value="">Selecione…</option>
              {MEIOS.map((m) => <option key={m}>{m}</option>)}
              {f.meio_fornecimento && !MEIOS.includes(f.meio_fornecimento) && <option>{f.meio_fornecimento}</option>}
            </select>
          </Field>
          <Field label="12. Infraestrutura / Mídia">
            {edit.id && <BadgeFornecedorROT processoId={edit.id} />}
            <select className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={f.infraestrutura} onChange={(e) => up({ infraestrutura: e.target.value })}>
              {INFRA.map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="11. Salvaguardas de Segurança" wide><Chips options={SALVAGUARDAS} value={f.salvaguardas} onChange={(v) => up({ salvaguardas: v })} /></Field>
          {risk && (
            <div className="rounded-sm border border-destructive bg-destructive/10 p-3 md:col-span-2">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Trava reforçada obrigatória</p>
              <Label className="text-xs">Justifique as medidas técnicas mitigadoras e o controle de acesso físico ou lógico desta linha</Label>
              <Textarea className="mt-1" value={f.justificativa_mitigacao ?? ""} onChange={(e) => up({ justificativa_mitigacao: e.target.value })} />
            </div>
          )}
        </div>
        {coerencia.length > 0 && (
          <div className="rounded-sm border border-warning bg-warning/10 p-3" data-testid="alerta-coerencia">
            {coerencia.map((a) => <p key={a} className="flex items-start gap-2 text-xs font-medium text-warning-foreground"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {a} O alerta é informativo: não impede salvar, mas fica registrado na trilha.</p>)}
          </div>
        )}
        {dicas.length > 0 && (
          <div className="rounded-sm border bg-muted/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Lightbulb className="h-3 w-3" /> Sugestões automáticas — nunca pré-selecionadas</p>
            <div className="flex flex-wrap gap-2">
              {dicas.map((d) => <Button key={d.texto} type="button" size="sm" variant="outline" className="h-auto whitespace-normal py-1 text-left text-xs" title={`Origem: ${d.origem}`} onClick={() => up(d.patch)}><span><b>Sugerido — confirme:</b> {d.texto}<span className="block text-[10px] text-muted-foreground">Origem: {d.origem}</span></span></Button>)}
            </div>
          </div>
        )}
        {erro && <p className="text-xs text-destructive">Pendência para salvar: {erro}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
          <Button disabled={!demo && !!erro} onClick={() => demo ? avisarAcaoDemo() : onSave()}>Salvar processo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={cn("space-y-1", wide && "md:col-span-2")}><Label className="text-xs">{label}</Label>{children}</div>;
}

function CicloResumo() {
  return (
    <div className="rounded-sm border bg-muted/40 p-3 text-sm" data-testid="ciclo-resumo">
      <p className="font-semibold text-primary">Ciclo do dado pessoal: {DESCRICAO_CICLO}</p>
      <p className="text-xs text-muted-foreground">{NOTA_CICLO}</p>
    </div>
  );
}

function CicloCelula({ r }: { r: RotRow }) {
  const c: CicloVida = cicloDaLinha(r);
  const { e1, e2: destino } = formatarCicloEtapas(c);
  const e2 = receptorSemEscolha(r) ? DESTINO_RECEPTOR_PENDENTE : destino;
  if (!e1 && !e2) return <p className="px-2 py-2">—</p>;
  return (
    <div className="space-y-1" data-testid={`ciclo-${r.codigo}`}>
      {e1 && <p><span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">Etapa 1 · Perímetro: </span><span className="font-medium">{e1}</span></p>}
      {e2 && <p><span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">Etapa 2 · Destino dos produtos gerados: </span><span className="font-medium">{e2}</span></p>}
      {!e2 && <p className="text-[10px] italic text-muted-foreground">Etapa 2 · Destino dos produtos gerados: não declarado</p>}
      <CitacoesCiclo ciclo={c} />
    </div>
  );
}

/** Lista de PRT na planilha: cada um com seu destino individual (Etapa 2) e o insumo residual. */
function PRTCelula({ r, terceiros }: { r: RotRow; terceiros: Terceiro[] }) {
  const prts = produtosDaLinha(r);
  const bloqueados = prtExternosBloqueados(r, terceiros);
  return (
    <div className="space-y-1">
      {!prts.length && <p>—</p>}
      {prts.map((p, i) => {
        const semDestino = prtSemDestino(r, p);
        return (
          <div key={i} data-testid={`prt-${r.codigo}-${i + 1}`}>
            <p><span className="font-mono font-semibold text-primary">{rotuloPRT(i)}</span> · {p.nome} <span className="text-muted-foreground">→ {r.papel_agente === "OPERADOR" ? NOTA_DESTINO_OPERADOR : receptorSemEscolha(r) ? DESTINO_RECEPTOR_PENDENTE : descreverDestinoPRT(p.destino)}</span></p>
            {semDestino && <p className="flex items-center gap-1 text-[10px] font-semibold text-warning-foreground"><AlertTriangle className="h-3 w-3" /> {alertaPRTSemDestino(p.nome)}</p>}
            {bloqueados.includes(p) && <p className="flex items-center gap-1 text-[10px] font-semibold text-destructive"><AlertTriangle className="h-3 w-3" /> {ALERTA_TERCEIRO_SEM_CONTRATO}</p>}
          </div>
        );
      })}
      {prts.length > 0 && !receptorSemEscolha(r) && <p className="text-muted-foreground">(insumo residual) → {r.tempo_retencao ? `Eliminar em ${r.tempo_retencao} (${r.base_prazo})` : "prazo a definir"}</p>}
      {alertaProduzirSemPRT(r) && <p role="alert" data-testid={`produzir-sem-prt-${r.codigo}`} className="text-xs font-semibold text-warning-foreground">{alertaProduzirSemPRT(r)}</p>}
      {alertaProdutoAusente(r) && <p className="flex items-center gap-1 text-[10px] font-semibold text-warning-foreground"><AlertTriangle className="h-3 w-3" /> {ALERTA_PRODUTO_AUSENTE}</p>}
    </div>
  );
}

/** Destino individual de um PRT (Etapa 2): interno, externo (terceiro do cadastro) ou eliminação. */
function DestinoPRTEditor({ indice, prt, linha, terceiros, onChange }: { indice: number; prt: ProdutoTratamento; linha: RotInput & { papel_agente?: RotRow["papel_agente"] }; terceiros: Terceiro[]; onChange: (d: DestinoProduto | null) => void }) {
  const linhaRef = { ...linha, papel_agente: linha.papel_agente ?? "CONTROLADOR" } as RotRow;
  const d = prt.destino ?? null;
  const area = (d?.area_setor_destino ?? "").split("›")[0]?.trim() ?? "";
  const setor = (d?.area_setor_destino ?? "").split("›")[1]?.trim() ?? "";
  const setores = AREAS_SETORES.find((a) => a.area === area)?.setores ?? [];
  const t = terceiros.find((x) => x.id === d?.terceiro_id);
  return (
    <fieldset className="rounded-sm border p-2" data-testid={`destino-prt-${indice + 1}`}>
      <legend className="px-1 text-xs font-semibold"><span className="font-mono text-primary">{rotuloPRT(indice)}</span> · {prt.nome || "sem nome"}</legend>
      <select aria-label={`Destino do ${rotuloPRT(indice)}`} className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={d?.tipo ?? ""} onChange={(e) => onChange(e.target.value ? { tipo: e.target.value as DestinoProduto["tipo"] } : null)}>
        <option value="">Selecione o destino…</option>
        <option value="INTERNO">Interno — Área › Setor de destino</option>
        <option value="EXTERNO">Externo — terceiro do cadastro</option>
        <option value="ELIMINACAO">Eliminação — prazo e fundamento (LGPD art. 16)</option>
      </select>
      {d?.tipo === "INTERNO" && (
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <select aria-label={`Área de destino do ${rotuloPRT(indice)}`} className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={area} onChange={(e) => onChange({ tipo: "INTERNO", area_setor_destino: areaSetorCompleto(e.target.value, "") })}>
            <option value="">Área…</option>
            {AREAS_SETORES.map((a) => <option key={a.area} value={a.area}>{a.area}</option>)}
          </select>
          <select aria-label={`Setor de destino do ${rotuloPRT(indice)}`} className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={setores.includes(setor) ? setor : setor ? "__outro__" : ""} onChange={(e) => onChange({ tipo: "INTERNO", area_setor_destino: areaSetorCompleto(area, e.target.value === "__outro__" ? "" : e.target.value) })}>
            <option value="">Setor…</option>
            {setores.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="__outro__">outro (especificar)</option>
          </select>
          {(setor && !setores.includes(setor)) && <Input value={setor} onChange={(e) => onChange({ tipo: "INTERNO", area_setor_destino: areaSetorCompleto(area, e.target.value) })} placeholder="Especifique o setor" />}
          <p className="text-[11px] text-muted-foreground sm:col-span-2">Ao salvar, uma linha em estado "insumo recebido" é criada no ROT do setor receptor, com este PRT como insumo e origem rastreada.</p>
        </div>
      )}
      {d?.tipo === "EXTERNO" && (
        <div className="mt-1">
          <select aria-label={`Terceiro do ${rotuloPRT(indice)}`} className="w-full rounded-sm border bg-background px-2 py-2 text-sm" value={d.terceiro_id ?? ""} onChange={(e) => { const x = terceiros.find((y) => y.id === e.target.value); onChange({ tipo: "EXTERNO", terceiro_id: x?.id, terceiro_nome: x?.razao_social }); }}>
            <option value="">Não cadastrado</option>
            {terceiros.map((x) => <option key={x.id} value={x.id}>{x.razao_social}</option>)}
          </select>
          {!d.terceiro_id && <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Terceiro não cadastrado — cadastre-o na seção Terceiros (Bloco 1) antes de chancelar o PI-02.</p>}
          {t && terceiroBloqueado(t) && <p role="alert" data-testid="alerta-terceiro-bloqueante" className="mt-1 flex items-center gap-1 text-xs font-semibold text-destructive"><AlertTriangle className="h-3 w-3" /> {ALERTA_TERCEIRO_SEM_CONTRATO}</p>}
        </div>
      )}
      {d?.tipo === "ELIMINACAO" && (
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <Input value={d.prazo ?? ""} placeholder="Prazo (ex.: 6 meses)" onChange={(e) => onChange({ ...d, prazo: e.target.value })} />
          <Input value={d.fundamento ?? ""} placeholder="Fundamento (LGPD art. 16)" onChange={(e) => onChange({ ...d, fundamento: e.target.value })} />
        </div>
      )}
      {prtSemDestino(linhaRef, prt) && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-warning-foreground" data-testid={`alerta-prt-${indice + 1}`}><AlertTriangle className="h-3 w-3" /> {alertaPRTSemDestino(prt.nome || "sem nome")}</p>}
    </fieldset>
  );
}

type Assinatura = { assinante: string; email: string; etapa: number; em: string; sha256: string };

function AssinaturasRot({ r, onAssinar }: { r: RotRow; onAssinar: (etapa: 1 | 2) => void }) {
  const a1 = r.assinatura_etapa1 as Assinatura | null;
  const a2 = r.assinatura_etapa2 as Assinatura | null;
  const chip = (a: Assinatura | null, etapa: 1 | 2, rotulo: string) => (
    <div className="mt-1" data-testid={`assinatura-e${etapa}-${r.codigo}`}>
      {a ? (
        <p className="text-[10px] text-muted-foreground" title={`SHA-256: ${a.sha256}`}>
          <span className="font-semibold text-success">✓ {rotulo}</span> — {a.assinante} · {new Date(a.em).toLocaleDateString("pt-BR")} · hash {a.sha256.slice(0, 10)}…
        </p>
      ) : (
        <button type="button" className="text-[10px] font-semibold text-primary underline" onClick={() => onAssinar(etapa)}>Assinar {rotulo}</button>
      )}
    </div>
  );
  return <>{chip(a1, 1, "Etapa 1 (gestor da área)")}{chip(a2, 2, "Etapa 2 (DPO)")}</>;
}

function CitacoesCiclo({ ciclo }: { ciclo: CicloVida }) {
  const { porte } = useEnquadramento();
  return (
    <ul className="list-disc space-y-1 pl-4 text-[10px] leading-snug text-muted-foreground">
      {[...CITACOES_LGPD, ...citacaoSimplificada(porte), ...citacoesISO(ciclo)].map((texto) => <li key={texto}>{texto}</li>)}
    </ul>
  );
}
