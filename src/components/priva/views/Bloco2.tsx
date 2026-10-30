import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { AJUDA } from "@/lib/priva/ajuda";
import { AppLink as Link } from "@/components/priva/AppLink";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AREAS_SETORES, ROTULO_AREA_SETOR, areaSetorCompleto, chaveDaArea, exibirAreaSetor } from "@/lib/priva/areasSetores";
import { AJUDA_CICLO, CITACOES_LGPD, DESCRICAO_CICLO, ESPECIES, ETAPA1, ETAPA2, NOTA_CICLO, NOTA_ETAPA2_COMPARTILHAR, NOTA_ETAPA2_ELIMINAR, NOTA_METODO_CICLO, NOTA_RESPONSAVEL_ETAPAS, ROTULO_ETAPA1, ROTULO_ETAPA2, alertaRetencao, alternar, cicloDaLinha, citacoesISO, destinoDeclarado, formatarCiclo, generosMarcados, type CicloVida, type Genero } from "@/lib/priva/cicloVida";
import { useEnquadramento } from '@/lib/priva/useEnquadramento';
import { citacaoSimplificada } from '@/lib/priva/enquadramento';
import { DADOS, HIPOTESES_7A, HIPOTESES_7B, INFRA, INSUMOS, MEIOS, SALVAGUARDAS, SENSIVEIS, TITULARES, alertasCoerencia, hasSensivel, isRisky, normalizeHipoteses, sugerir, validateRot, type RotInput, type RotRow } from "@/lib/priva/rot";
import { usePriva } from "@/lib/priva/store";
import { DEMO_ROT } from "@/lib/priva/demo";
import { responsavelDaArea, useMembros } from "@/components/priva/MembrosEmpresa";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BadgeFornecedorROT } from '@/components/priva/AlertaFornecedorVazado';



const HEADS = ["ID Processo", "Área › Setor", "Ciclo de vida (gênero × espécie)", "Categoria de Titulares", "Dado pessoal", "Dado pessoal sensível", "Finalidade Específica",
  "7A. Hipótese art. 7º (dado pessoal)", "7B. Hipótese art. 11 (dado pessoal sensível)", "Tempo de Retenção", "Base do Prazo", "Comunicação e transferência / Destinatários",
  "Insumo (documento de entrada)", "Meio de fornecimento", "Salvaguardas de Segurança", "Infraestrutura / Mídia"];

const empty = (cnpj: string): RotInput => ({
  empresa_cnpj: cnpj, setor: "RH", genero_verbo: "Coletar", ciclo_vida: {}, categoria_titulares: [], dados_pessoais: [], dados_sensiveis: ["N/A"],
  finalidade_especifica: "", hipotese_tratamento: "", hipotese_sensivel: null, tempo_retencao: "", base_prazo: "", compartilhamento: "Não Compartilhado",
  salvaguardas: [], infraestrutura: "Servidor Local", justificativa_mitigacao: null, area_setor: null, insumo: null, meio_fornecimento: null,
});

export function Bloco2() {
  const { cnpj, log, roles, demo } = usePriva();
  const qc = useQueryClient();
  const canEdit = (roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA"));
  const key = ["registro_operacoes", cnpj] as const;
  const { data: rows = [] } = useQuery({
    queryKey: [...key, demo],
    enabled: !!cnpj,
    queryFn: async (): Promise<RotRow[]> => {
      if (demo) return DEMO_ROT;
      const { data, error } = await supabase.from("registro_operacoes").select("*").eq("empresa_cnpj", cnpj ?? "").order("codigo");
      if (error) throw error;
      return data;
    },
  });
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
    const err = validateRot(normalizeHipoteses(edit.form));
    if (err) { toast.error(err); return; }
    const ciclo = cicloDaLinha(edit.form);
    const payload = { ...normalizeHipoteses(edit.form), ciclo_vida: ciclo, genero_verbo: generosMarcados(ciclo)[0] ?? "Coletar", justificativa_mitigacao: isRisky(edit.form) ? edit.form.justificativa_mitigacao : null };
    const { data, error } = edit.id
      ? await supabase.from("registro_operacoes").update(payload).eq("id", edit.id).select("codigo").single()
      : await supabase.from("registro_operacoes").insert(payload).select("codigo").single();
    if (error) { toast.error(error.message); return; }
    log(edit.id ? "UPDATE" : "INSERT", "registro_operacoes", `Processo ${data.codigo}`);
    for (const a of alertasCoerencia(edit.form)) log("INSERT", "registro_operacoes", `Alerta de coerência dado × hipótese em ${data.codigo}: ${a}`);
    toast.success(`${data.codigo} salvo`);
    setEdit(null);
    void qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (r: RotRow) => {
    if (demo) return avisarAcaoDemo();
    if (!confirm(`Excluir ${r.codigo}?`)) return;
    const { error } = await supabase.from("registro_operacoes").delete().eq("id", r.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    log("DELETE", "registro_operacoes", `Processo ${r.codigo}`);
    void qc.invalidateQueries({ queryKey: key });
  };

  const riskyCount = rows.filter(isRisky).length;
  const semDestino = rows.filter((r) => !destinoDeclarado(r)).length;
  const NUMS = ["", "1. ", "2. ", "3. ", "4. ", "5. ", "6. ", "", "", "8. ", "9. ", "10. ", "10A. ", "10B. ", "11. ", "12. "];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 2 · (R) Ciclo Privacium Semestral · Art. 37 LGPD" title="Registrar as Operações de Tratamento">
        Inventário em 12 campos (campo 7 dividido em 7A — art. 7º, dado pessoal — e 7B — art. 11, dado pessoal sensível), com insumo e meio de fornecimento (10A/10B). Linhas com menores de idade ou dado pessoal sensível recebem tarja vermelha e exigem justificativa das medidas mitigadoras.{" "}
        <Link to="/manual" className="inline-flex items-center gap-1 font-medium text-primary underline"><BookOpen className="h-3 w-3" /> Manual de Uso</Link>
      </PageHeader>
      {AJUDA[2] && <AjudaTarefa {...AJUDA[2]} />}
      <CicloResumo />

      <Panel id="rot" title={`Planilha mestre · ${rows.length} processos · ${riskyCount} em alerta`} action={canEdit && (
        <Button size="sm" onClick={() => demo ? avisarAcaoDemo() : setEdit({ id: null, form: empty(cnpj) })}><Plus className="h-4 w-4" /> Novo processo</Button>
      )}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2400px] text-xs">
            <thead>
              <tr className="border-b text-left">
                {HEADS.map((h, i) => <th key={h} className="px-2 py-2 font-mono font-medium uppercase tracking-wider text-muted-foreground">{NUMS[i]}{h}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const risk = isRisky(r);
                const retencao = alertaRetencao(cicloDaLinha(r));
                return (
                  <tr id={`rot-${r.id}`} key={r.id} className={cn("scroll-mt-6 border-b align-top", risk && "border-l-4 border-l-destructive bg-destructive/15")}>
                    <td className="px-2 py-2 font-mono font-semibold text-primary">
                      {r.codigo}
                      {risk && <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-destructive"><AlertTriangle className="h-3 w-3" /> Alerta crítico</p>}
                    </td>
                    <td className="px-2 py-2">{exibirAreaSetor(r)}</td>
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
                    <td className="px-2 py-2">{r.tempo_retencao}</td>
                    <td className="px-2 py-2">{r.base_prazo}</td>
                    <td className="px-2 py-2">{r.compartilhamento}</td>
                    <td className="px-2 py-2">{r.insumo ?? "—"}</td>
                    <td className="px-2 py-2">{r.meio_fornecimento ?? "—"}</td>
                    <td className="px-2 py-2"><Tags items={r.salvaguardas} /></td>
                    <td className="px-2 py-2">{r.infraestrutura}<BadgeFornecedorROT processoId={r.id} /></td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {canEdit && <>
                        <button aria-label="Editar" className="mr-2" onClick={() => {
                          if (demo) return avisarAcaoDemo();
                          const { id, codigo: _c, criado_por: _p, criado_em: _e, atualizado_em: _a, ...form } = r;
                          setEdit({ id, form: normalizeHipoteses(form) });
                        }}><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                        <button aria-label="Excluir" onClick={() => void remove(r)}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                      </>}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={17} className="py-8 text-center text-muted-foreground">Nenhum processo cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {edit && <RotDialog edit={edit} setEdit={setEdit} onSave={save} />}

      <PIOutput dual pi="PI-02: Registro de Operações de Tratamento (ROT)" ready={rows.length > 0 && semDestino === 0} readyHint={rows.length === 0 ? "Cadastre ao menos um processo na planilha mestre." : `${semDestino} processo(s) sem destino declarado: a Etapa 2 (compartilhamento com destinatário identificado ou eliminação com prazo e fundamento — LGPD art. 16) é obrigatória para chancelar o PI-02.`}>
        <p>Registro conforme Art. 37 da LGPD. {rows.length} operações inventariadas, {riskyCount} com tarja de alerta crítico{semDestino > 0 ? `, ${semDestino} sem destino declarado (Etapa 2)` : ""}.</p>
        <p className="mt-2"><b>Ciclo de vida do dado pessoal:</b> {DESCRICAO_CICLO}. {NOTA_CICLO} {NOTA_METODO_CICLO}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {rows.map((r) => (
            <li key={r.id}><b>{r.codigo}</b> — {exibirAreaSetor(r)}. Ciclo de vida: {formatarCiclo(cicloDaLinha(r))}. Dados pessoais: {r.dados_pessoais.join(", ")} de {r.categoria_titulares.join(", ")} para {r.finalidade_especifica}. Hipótese de Tratamento (7A): {r.hipotese_tratamento}.{(r.hipotese_sensivel) && <> Dado pessoal sensível (7B): {r.hipotese_sensivel}.</>} Retenção: {r.tempo_retencao} ({r.base_prazo}).{r.insumo && <> Insumo: {r.insumo}.</>}{r.meio_fornecimento && <> Meio de fornecimento: {r.meio_fornecimento}.</>}{r.justificativa_mitigacao && <> Medidas mitigadoras: {r.justificativa_mitigacao}</>}<CitacoesCiclo ciclo={cicloDaLinha(r)} /></li>
          ))}
        </ul>
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
  const f = edit.form;
  const up = (p: Partial<RotInput>) => setEdit({ ...edit, form: { ...f, ...p } });
  const risk = isRisky(f);
  const sensitive = hasSensivel(f);
  const dicas = sugerir(f);
  const coerencia = alertasCoerencia(f);
  const retencao = alertaRetencao(cicloDaLinha(f));
  const erro = validateRot(f);
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
          <Field label="2. Ciclo de vida do dado pessoal (gênero × espécie)" wide>
            <p className="text-[11px] text-muted-foreground">{AJUDA_CICLO}</p>
            <p className="rounded-sm border border-dashed bg-muted/40 p-2 text-[11px] text-muted-foreground" data-testid="nota-metodo-ciclo">{NOTA_METODO_CICLO} {NOTA_RESPONSAVEL_ETAPAS}</p>
            <div className="space-y-2" data-testid="ciclo-vida">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{ROTULO_ETAPA1}</p>
                <div className="grid gap-2 sm:grid-cols-3">{ETAPA1.map(generoBtns)}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{ROTULO_ETAPA2}</p>
                <div className="grid gap-2 sm:grid-cols-2">{ETAPA2.map(generoBtns)}</div>
              </div>
            </div>
            {retencao && <p role="alert" className="flex items-center gap-1 text-xs font-semibold text-warning-foreground" data-testid="alerta-retencao"><AlertTriangle className="h-3 w-3" /> {retencao}</p>}
          </Field>
          <Field label="3. Categoria de Titulares" wide><Chips options={TITULARES} value={f.categoria_titulares} onChange={(v) => up({ categoria_titulares: v })} /></Field>
          <Field label="4. Dado pessoal" wide><Chips options={DADOS} value={f.dados_pessoais} onChange={(v) => up({ dados_pessoais: v })} /></Field>
          <Field label="5. Dado pessoal sensível" wide><Chips options={SENSIVEIS} value={f.dados_sensiveis} exclusive="N/A" onChange={(v) => up({ dados_sensiveis: v, hipotese_sensivel: v.some((x) => x !== "N/A") ? f.hipotese_sensivel : null })} /></Field>
          <Field label="6. Finalidade Específica" wide><Textarea value={f.finalidade_especifica} onChange={(e) => up({ finalidade_especifica: e.target.value })} /></Field>
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
          <Field label="10A. Insumo (documento de entrada) — LGPD art. 5º, I / ISO/IEC 27002 — 5.12">
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
      <p className="font-semibold text-primary">Ciclo de vida do dado pessoal: {DESCRICAO_CICLO}</p>
      <p className="text-xs text-muted-foreground">{NOTA_CICLO}</p>
    </div>
  );
}

function CicloCelula({ r }: { r: RotRow }) {
  const c: CicloVida = cicloDaLinha(r);
  return (
    <div className="space-y-1" data-testid={`ciclo-${r.codigo}`}>
      <p className="font-medium">{formatarCiclo(c) || "—"}</p>
      <CitacoesCiclo ciclo={c} />
    </div>
  );
}

function CitacoesCiclo({ ciclo }: { ciclo: CicloVida }) {
  const { porte } = useEnquadramento();
  return (
    <ul className="list-disc space-y-1 pl-4 text-[10px] leading-snug text-muted-foreground">
      {[...CITACOES_LGPD, ...citacaoSimplificada(porte), ...citacoesISO(ciclo)].map((texto) => <li key={texto}>{texto}</li>)}
    </ul>
  );
}
