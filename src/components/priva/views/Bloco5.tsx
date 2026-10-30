import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { AjudaTarefa } from "@/components/priva/AjudaTarefa";
import { pendenciasBloco5 } from "@/lib/priva/pendencias";
import { AJUDA } from "@/lib/priva/ajuda";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PartyPopper, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { TETO_REDUCAO, multaComAtenuantes } from "@/lib/priva/dosimetria";
import { BIBLIOTECA, INERENTE, derivarRisco, reducaoPorRiscos, sugestaoDescricao, sugestaoMitigacao, type RiscoId } from "@/lib/privacium/bibliotecaMitigacao";
import { DIMENSOES_AIA, NIVEIS_RISCO_IA, PL_2338_RESSALVA, ROTULO_ESCOPO_IA, classificarRiscoIA, respostasAIA, type NivelRiscoIA } from "@/lib/privacium/bibliotecaTextos";
import { CopiarModelo } from "@/components/priva/CopiarModelo";
import { CitacaoNormativa } from "@/components/priva/CitacaoNormativa";
import { usePriva } from "@/lib/priva/store";
import { useCnpjRows } from "@/lib/priva/useCnpjRows";
import { DEMO_MULTA_BASE } from "@/lib/priva/demo";
import { BlockGate, PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const RISKS: { id: RiscoId; label: string; hint: string }[] = [
  { id: "vazamento", label: "Vazamento por prompts", hint: "Colaboradores colando dados pessoais em LLMs externos." },
  { id: "vies", label: "Vieses discriminatórios (RH/Crédito)", hint: "Decisões automatizadas que discriminam candidatos ou clientes (Art. 20 LGPD)." },
  { id: "injecao", label: "Injeção de prompts", hint: "Instruções maliciosas que forçam o modelo a revelar ou alterar dados." },
];
/** prob/imp só valem quando riscoManual; caso contrário derivam dos PIs concluídos. */
type R = { prob?: number; imp?: number; descricao: string; mitig: string; descManual?: boolean; mitigManual?: boolean; riscoManual?: boolean };
const DEF: R = { descricao: "", mitig: "" };
const ESCUDO_PADRAO = "O Escudo Digital do Bloco 3 tokeniza localmente CPFs, e-mails e nomes ([CPF_TOKEN], [EMAIL_TOKEN], [NOME_TOKEN]) antes do envio a qualquer IA externa e reverte os tokens apenas no navegador do usuário autorizado. Nenhum dado pessoal em claro sai do perímetro do CNPJ.";
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function Bloco5() {
  const { cnpj, roles, signatures, set, log, demo, email, demoRegistrarEvento } = usePriva();
  const navigate = useNavigate();
  const canEdit = (roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA"));
  const ripdRows = useCnpjRows("ripd_ia", cnpj, "atualizado_em");
  const ciclos = useCnpjRows("ciclos_priva", cnpj, "ano_fiscal");
  const rotRows = useCnpjRows("registro_operacoes", cnpj, "criado_em");
  const [overrideIA, setOverrideIA] = useState<NivelRiscoIA | null>(null);
  const salvo = ripdRows.rows[0];
  const [sistema, setSistema] = useState("");
  const [ripd, setRipd] = useState<Record<string, R>>({});
  const [escudo, setEscudo] = useState(ESCUDO_PADRAO);
  const [base, setBase] = useState(demo ? DEMO_MULTA_BASE : 1_000_000);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSistema(salvo?.sistema_avaliado ?? "");
    setRipd((salvo?.riscos ?? {}) as Record<string, R>);
    setEscudo(salvo?.escudo_digital || ESCUDO_PADRAO);
  }, [salvo?.atualizado_em]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setBase(demo ? DEMO_MULTA_BASE : 1_000_000); }, [demo]);
  useEffect(() => { if (cnpj) log("SELECT", "ripd_ia", "Abertura do RIPD algorítmico do Bloco 5"); }, [cnpj, log]);

  if (!cnpj) return <Panel title="Auditoria"><p className="text-sm text-muted-foreground">Selecione um CNPJ no menu lateral.</p></Panel>;

  const salvar = async (next: { sistema?: string; ripd?: Record<string, R>; escudo?: string }, detail: string) => {
    if (demo) return avisarAcaoDemo();
    if (!canEdit) return;
    const { error } = await supabase.from("ripd_ia").upsert({
      empresa_cnpj: cnpj, sistema_avaliado: next.sistema ?? sistema, riscos: (next.ripd ?? ripd) as Json,
      escudo_digital: next.escudo ?? escudo, atualizado_em: new Date().toISOString(),
    });
    if (error) { toast.error("Falha ao salvar o RIPD."); return; }
    log("UPDATE", "ripd_ia", detail);
  };

  const efetivos = RISKS.map((r) => {
    const v = { ...DEF, ...ripd[r.id] };
    const derivado = derivarRisco(r.id, signatures);
    const sug = sugestaoMitigacao(r.id, signatures);
    const sugDesc = sugestaoDescricao(r.id, signatures);
    // Texto legado sem marcação é tratado como escrito pelo DPO.
    const manual = v.mitigManual ?? v.mitig.trim().length > 0;
    const manualDesc = v.descManual ?? v.descricao.trim().length > 0;
    const riscoManual = !!v.riscoManual && typeof v.prob === "number" && typeof v.imp === "number";
    return {
      ...r, derivado, riscoManual,
      prob: riscoManual ? v.prob! : derivado.prob, imp: riscoManual ? v.imp! : derivado.imp,
      descricao: manualDesc ? v.descricao : "texto" in sugDesc ? sugDesc.texto : "",
      rotuloDesc: manualDesc ? "Revisado manualmente pelo DPO" : "texto" in sugDesc ? sugDesc.rotulo : sugDesc.aviso,
      mitig: manual ? v.mitig : "texto" in sug ? sug.texto : "",
      rotuloMitig: manual ? "Revisado manualmente pelo DPO" : "texto" in sug ? sug.rotulo : sug.aviso,
      aviso: "aviso" in sug ? sug.aviso : undefined,
    };
  });
  const INE = INERENTE.prob * INERENTE.imp;
  const ganho = efetivos.reduce((s, e) => s + (INE - e.prob * e.imp), 0);
  const reducao = reducaoPorRiscos(efetivos);
  const anoAtual = ciclos.rows[0] ? ciclos.rows[0].ano_fiscal + 1 : new Date().getFullYear();
  const ready = sistema.trim().length > 2 && escudo.trim().length > 20 && efetivos.every((e) => e.mitig.trim().length > 10);
  const responsaveis = demo
    ? { DPO_OPERACIONAL: "DPO Cenográfico", C_SUITE: "Diretoria Cenográfica" }
    : { DPO_OPERACIONAL: roles.includes("DPO_OPERACIONAL") && email ? email : undefined, C_SUITE: roles.includes("C_SUITE") && email ? email : undefined };
  const pendencias = pendenciasBloco5({ sistema, escudo, riscos: efetivos.map((e) => ({ label: e.label, mitig: e.mitig })) }, signatures, responsaveis);
  const pendSig = pendencias.filter((p) => p.id.startsWith("sig"));
  const tone = (n: number): "destructive" | "warning" | "success" => (n >= 15 ? "destructive" : n >= 8 ? "warning" : "success");

  /* ---- Módulo Lei de IA: classificação determinística a partir do RIPO ---- */
  const sensivelNoRot = (rotRows.rows ?? []).some((r) => !!(r as { hipotese_sensivel?: string | null }).hipotese_sensivel);
  const viesEfetivo = efetivos.find((e) => e.id === "vies")!;
  const decisaoAuto = viesEfetivo.descricao.trim().length > 0 && viesEfetivo.mitig.trim().length > 0;
  const entradaIA = { saud_tracking: sensivelNoRot, sens_ai: sensivelNoRot && decisaoAuto, decisao_automatizada: decisaoAuto, pessoais: sistema.trim().length > 2 };
  const derivadaIA = classificarRiscoIA(entradaIA);
  const nivelIA = overrideIA ?? derivadaIA.nivel;
  const aia = respostasAIA(entradaIA);
  const sobrescreverIA = (n: NivelRiscoIA) => {
    setOverrideIA(n);
    const detalhe = `Classificação de risco de IA sobrescrita pelo DPO: ${derivadaIA.nivel} → ${n}`;
    if (demo) void demoRegistrarEvento("UPDATE", "ripd_ia", detalhe); else log("UPDATE", "ripd_ia", detalhe);
    toast.success("Classificação sobrescrita e registrada na trilha.");
  };
  const PROVEDORES = ["OpenAI", "Anthropic", "Google", "Meta", "Mistral", "Microsoft", "Azure", "AWS"];
  const provedorIA = PROVEDORES.find((p) => `${sistema} ${escudo}`.toLowerCase().includes(p.toLowerCase())) ?? "Não declarado";

  const finalizar = async () => {
    if (demo) return avisarAcaoDemo();
    setBusy(true);
    const { error } = await supabase.from("ciclos_priva").insert({ empresa_cnpj: cnpj, ano_fiscal: anoAtual, reducao_dosimetria: reducao, assinaturas: signatures as unknown as Json });
    setBusy(false);
    if (error) { toast.error("Não foi possível finalizar o ciclo."); return; }
    set({ signatures: {}, incidentStart: null, incidentSteps: [false, false, false, false, false, false] },
      { op: "INSERT", target: "ciclos_priva", detail: `Ciclo Privacium Semestral ${anoAtual} finalizado · Ano Fiscal ${anoAtual + 1} aberto · Bloco 1 reativado` });
    toast.success(`Ano Fiscal ${anoAtual + 1} iniciado. Bloco 1 reativado.`);
    void navigate({ to: "/bloco-1" });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`Bloco 5 · (A) Ciclo Privacium Semestral · Ano Fiscal ${anoAtual}`} title="Auditar o Sistema de Privacidade e Mitigar Riscos" />
      {AJUDA[5] && <AjudaTarefa {...AJUDA[5]} pendencias={pendencias} />}

      <Panel id="classificacao-ia" title="Classificação do Sistema de IA">
        <p className="mb-3 rounded-sm border border-atencao/40 bg-atencao/10 p-2 text-xs text-muted-foreground" data-testid="escopo-ia">
          {ROTULO_ESCOPO_IA} <span className="block mt-1 font-medium">{PL_2338_RESSALVA}</span>
        </p>
        <div className="flex flex-wrap gap-2" role="list" aria-label="Níveis de risco de IA">
          {NIVEIS_RISCO_IA.map((n) => (
            <span key={n} role="listitem" data-testid={`nivel-${n}`}
              className={`rounded-sm border px-3 py-1 text-xs font-semibold ${n === nivelIA ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              {n}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground" data-testid="derivado-ia">
          {overrideIA ? `Sobrescrito manualmente pelo DPO · o nível derivado seria ${derivadaIA.nivel}.` : <>Derivado de: {derivadaIA.derivadoDe.join("; ")}.</>}
        </p>
        {canEdit && (
          <label className="mt-3 block text-xs text-muted-foreground">Sobrescrever classificação (registrado na trilha)
            <select className="mt-1 w-full rounded-sm border bg-background p-2 text-sm" value={overrideIA ?? ""} data-testid="override-ia"
              onChange={(e) => { const v = e.target.value as NivelRiscoIA | ""; if (v) sobrescreverIA(v); else setOverrideIA(null); }}>
              <option value="">Usar nível derivado ({derivadaIA.nivel})</option>
              {NIVEIS_RISCO_IA.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </Panel>

      <Panel id="inventario-ia" title="Inventário de sistemas de IA">
        <p className="mb-3 text-xs text-muted-foreground">Alimentado pelos dados já declarados no PI-03 (Escudo Digital) e no RIPO abaixo — sem digitação duplicada.</p>
        {sistema.trim().length > 2 ? (
          <ul className="divide-y text-sm" data-testid="inventario-ia">
            <li className="grid gap-1 py-2 md:grid-cols-[1fr_160px_200px_140px]">
              <span><b>{sistema}</b><span className="block text-xs text-muted-foreground">Finalidade declarada no RIPO</span></span>
              <span className="text-xs">Provedor do modelo: <b>{provedorIA}</b></span>
              <span className="text-xs">Papel na cadeia: <b>Operador</b> (usa sistema de terceiro)</span>
              <span className="text-xs">Classificação: <b>{nivelIA}</b> · PIs vinculados: PI-03, PI-05</span>
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="inventario-ia-vazio">Nenhum sistema de IA declarado. Preencha “Sistema de IA avaliado” no RIPO abaixo.</p>
        )}
      </Panel>

      <Panel id="aia" title="Avaliação de Impacto Algorítmico (AIA)">
        <p className="mb-3 text-xs text-muted-foreground">Painel distinto do RIPD de LGPD, focado nos impactos algorítmicos. {ROTULO_ESCOPO_IA}</p>
        <div className="grid gap-3 md:grid-cols-2" data-testid="aia-eixos">
          {DIMENSOES_AIA.map((d) => (
            <div key={d.id} className="rounded-sm border bg-background p-3" data-testid={`aia-${d.id}`}>
              <p className="font-semibold text-primary">{d.titulo}</p>
              <p className="text-xs text-muted-foreground">{d.pergunta}</p>
              <p className="mt-2 text-sm">{aia[d.id]!.resposta}</p>
              {aia[d.id]!.sugerida && <p className="mt-1 text-[11px] text-muted-foreground">Sugerido a partir do RIPO</p>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="ripd" title="RIPD algorítmico · IA e LLMs (Art. 38 LGPD / ISO 42001)">
        <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <CitacaoNormativa citacao="LGPD art. 38" />
          <CitacaoNormativa citacao="ISO/IEC 42001" />
        </p>
        <label className="text-xs text-muted-foreground">Sistema de IA avaliado
          <Input disabled={!canEdit} placeholder="Ex.: assistente interno baseado em LLM para atendimento e triagem de currículos" value={sistema}
            onChange={(e) => setSistema(e.target.value)} onBlur={() => salvar({}, "RIPD: sistema avaliado")} />
        </label>
        <div className="mt-4 space-y-4">
          {efetivos.map((e) => {
            const v = { ...DEF, ...ripd[e.id] }; const score = e.prob * e.imp;
            const put = (p: Partial<R>, persist: boolean, detail = `RIPD: ${e.label}`) => { const n = { ...ripd, [e.id]: { ...v, ...p } }; setRipd(n); if (persist) void salvar({ ripd: n }, detail); };
            const sobrescrever = (k: "prob" | "imp", val: number) => {
              put({ prob: e.prob, imp: e.imp, [k]: val, riscoManual: true }, true, `RIPD: ${k === "prob" ? "probabilidade" : "impacto"} de "${e.label}" sobrescrita pelo DPO (${val})`);
            };
            return (
              <div key={e.id} data-testid={`risco-${e.id}`} className="rounded-sm border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="font-semibold text-primary">{e.label}</p><p className="text-xs text-muted-foreground">{e.hint}</p></div>
                  <Tag tone={tone(score)}>Risco {score}</Tag>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[160px_160px_1fr_1fr]">
                  {(["prob", "imp"] as const).map((k) => (
                    <label key={k} className="text-xs text-muted-foreground">{k === "prob" ? "Probabilidade" : "Impacto"} ({e[k]})
                      <input type="range" min={1} max={5} disabled={!canEdit} aria-label={`${k === "prob" ? "Probabilidade" : "Impacto"} · ${e.label}`} value={e[k]} onChange={(ev) => sobrescrever(k, +ev.target.value)} className="w-full accent-primary" />
                    </label>
                  ))}
                  <div>
                    <Textarea rows={3} disabled={!canEdit} aria-label={`Descrição do risco · ${e.label}`} placeholder={e.aviso ?? "Descrição do risco no contexto da empresa…"} value={e.descricao}
                      onChange={(ev) => { if (!v.descManual) log("UPDATE", "ripd_ia", `RIPD: descrição de "${e.label}" revisada manualmente pelo DPO`); put({ descricao: ev.target.value, descManual: true }, false); }}
                      onBlur={() => salvar({}, `RIPD: ${e.label}`)} />
                    <p className="mt-1 text-[11px] text-muted-foreground" data-testid={`rotulo-desc-${e.id}`}>{e.rotuloDesc}</p>
                    {e.rotuloDesc.startsWith("Sugerido") && e.descricao && <div className="mt-1"><CopiarModelo texto={e.descricao} pi="PI-03" fonte="LGPD art. 38 / ISO/IEC 42001" rotulo="Copiar sugestão" /></div>}
                  </div>
                  <div>
                    <Textarea rows={3} disabled={!canEdit} aria-label={`Medidas de mitigação · ${e.label}`} placeholder={e.aviso ?? "Medidas de mitigação…"} value={e.mitig}
                      onChange={(ev) => { if (!v.mitigManual) log("UPDATE", "ripd_ia", `RIPD: mitigação de "${e.label}" revisada manualmente pelo DPO`); put({ mitig: ev.target.value, mitigManual: true }, false); }}
                      onBlur={() => salvar({}, `RIPD: ${e.label}`)} />
                    <p className="mt-1 text-[11px] text-muted-foreground" data-testid={`rotulo-${e.id}`}>{e.rotuloMitig}</p>
                    {e.rotuloMitig.startsWith("Sugerido") && e.mitig && <div className="mt-1"><CopiarModelo texto={e.mitig} pi="PI-03" fonte={BIBLIOTECA[e.id].fonte} rotulo="Copiar sugestão" /></div>}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground" data-testid={`derivado-${e.id}`}>
                  {e.riscoManual
                    ? <>Sobrescrito manualmente pelo DPO · derivado seria {e.derivado.prob}×{e.derivado.imp}. <button type="button" className="underline" disabled={!canEdit} onClick={() => put({ riscoManual: false }, true, `RIPD: risco de "${e.label}" voltou ao valor derivado`)}>Voltar ao derivado</button></>
                    : <>Derivado de: {e.derivado.reducoes.length ? e.derivado.reducoes.join("; ") : "nenhum controle concluído"}. Cálculo: partimos do risco inerente 5×5 = {INE} e cada controle comprovado reduz um eixo; resultado {e.prob}×{e.imp} = {score}.</>}
                </p>
              </div>
            );
          })}
        </div>
        <label className="mt-4 block text-xs text-muted-foreground">Barreira mitigadora principal · Escudo Digital (Bloco 3)
          <Textarea rows={3} disabled={!canEdit} value={escudo} onChange={(e) => setEscudo(e.target.value)} onBlur={() => salvar({}, "RIPD: Escudo Digital")} />
        </label>
        {salvo && <p className="mt-2 text-xs text-muted-foreground">Salvo em {new Date(salvo.atualizado_em).toLocaleString("pt-BR")}</p>}
      </Panel>

      <Panel title="Simulador do Escudo Jurídico de Dosimetria · Res. CD/ANPD nº 4/2023">
        <p className="mb-3 text-xs text-muted-foreground"><CitacaoNormativa citacao="Res. CD/ANPD nº 4/2023" /></p>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">A redução é calculada a partir dos mesmos riscos do RIPD acima: risco inerente 5×5 = {INE} contra o risco residual de cada linha.</p>
            {efetivos.map((e) => (
              <div key={e.id} data-testid={`sim-${e.id}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-xs">{e.label}</span>
                  <span className="font-mono text-xs">{INE} → {e.prob}×{e.imp} = {e.prob * e.imp}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-success" style={{ width: `${((INE - e.prob * e.imp) / (INE - 1)) * 100}%` }} /></div>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground" data-testid="calculo-reducao">Redução = {TETO_REDUCAO}% × ({efetivos.map((e) => `${INE}−${e.prob * e.imp}`).join(" + ")}) ÷ ({efetivos.length} × {INE - 1}) = {TETO_REDUCAO}% × {ganho} ÷ {efetivos.length * (INE - 1)} = {reducao}% (teto {TETO_REDUCAO}%)</p>
              <div className="mt-1 h-4 rounded-full bg-muted"><div className="h-4 rounded-full bg-success transition-all" style={{ width: `${(reducao / TETO_REDUCAO) * 100}%` }} /></div>
            </div>
          </div>
          <div className="space-y-3 rounded-md border p-5">
            <label className="text-xs text-muted-foreground">Valor-base hipotético da multa
              <Input type="number" min={0} value={base} onChange={(e) => setBase(Math.max(0, +e.target.value))} />
            </label>
            <div className="flex items-end gap-3">
              <div className="flex-1 text-center"><div className="mx-auto w-10 rounded-t bg-destructive" style={{ height: 120 }} /><p className="mt-1 text-[10px]">Risco inerente</p><p className="font-mono text-xs">{brl(base)}</p></div>
              <div className="flex-1 text-center"><div className="mx-auto w-10 rounded-t bg-success" style={{ height: 120 * (1 - reducao / 100) }} /><p className="mt-1 text-[10px]">Risco residual</p><p className="font-mono text-xs">{brl(multaComAtenuantes(base, reducao))}</p></div>
            </div>
            <p className="text-center font-mono text-3xl font-semibold text-success" data-testid="reducao">−{reducao}%</p>
            <p className="text-xs text-muted-foreground">Estimativa facultativa; o valor real da sanção depende da análise da ANPD.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Responsáveis pelas assinaturas do PI-05">
        <ul className="space-y-1 text-sm">
          {pendSig.map((p) => <li key={p.id} data-testid={`resp-${p.id}`} className="flex flex-wrap justify-between gap-2"><span>{p.titulo}</span><span className="text-xs text-muted-foreground">{p.estado === "ok" ? "Assinado" : p.exige}</span></li>)}
        </ul>
      </Panel>

      <PIOutput pi="PI-05: Escudo Jurídico de Dosimetria" ready={ready} readyHint="Preencha o sistema avaliado, o Escudo Digital e a mitigação de cada risco de IA." dual>
        <h3 className="font-semibold">RIPD – {sistema}</h3>
        <ul className="list-disc pl-5">{efetivos.map((e) => <li key={e.id}>{e.label}: risco residual {e.prob * e.imp} (inerente {INE}). {e.descricao} Mitigação: {e.mitig}</li>)}</ul>
        <p className="mt-2"><b>Barreira principal:</b> {escudo}</p>
        <h3 className="mt-4 font-semibold">Dosimetria</h3>
        <p>Redução de {reducao}% da multa-base, derivada dos riscos residuais acima (Res. CD/ANPD nº 4/2023). Estimativa facultativa; o valor real da sanção depende da análise da ANPD.</p>
      </PIOutput>

      {signatures["PI-05"] && (
        <Panel title="Ciclo Privacium Semestral concluído" className="border-success">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <PartyPopper className="h-10 w-10 text-success" />
            <p className="text-xl font-semibold text-primary">Conformidade estrutural alcançada · Ano Fiscal {anoAtual}</p>
            <p className="max-w-lg text-sm text-muted-foreground">Os cinco Produtos Internos estão chancelados por DPO e Diretoria. Ao finalizar, o ciclo é arquivado com a redução de {reducao}% e o Ano Fiscal {anoAtual + 1} começa pelo Bloco 1.</p>
            <Button onClick={finalizar} disabled={!demo && (busy || !canEdit)}><RefreshCw className="h-4 w-4" /> Finalizar Ciclo Privacium Semestral</Button>
          </div>
        </Panel>
      )}

      {ciclos.rows.length > 0 && (
        <Panel title="Ciclos arquivados">
          <ul className="divide-y text-sm">{ciclos.rows.map((c) => <li key={c.id} className="flex justify-between py-2"><span>Ano Fiscal {c.ano_fiscal}</span><span className="font-mono text-xs">−{c.reducao_dosimetria}% · {new Date(c.finalizado_em).toLocaleDateString("pt-BR")}</span></li>)}</ul>
        </Panel>
      )}
    </div>
  );
}
