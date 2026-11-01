import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, GitBranch, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { CitacaoNormativa } from "@/components/priva/CitacaoNormativa";
import { usePriva } from "@/lib/priva/store";
import { supabase } from "@/integrations/supabase/client";
import { BIBLIOTECA_NORMATIVA } from "@/lib/priva/bibliotecaNormativa";
import { AVISO_EXCLUDENTE, NOTA_HASH_ASSINATURA, descreverRemocao, linhasAtivas, rotuloEtapa1Receptor, incisoSustentado, montarCadeia, receptoraExistente, relatorioProvaCadeia, rotuloNo, rotuloStatus, trilhasDoNo, type NoCadeia, type TrilhaPRT } from "@/lib/priva/cadeiaCustodia";
import type { RotRow } from "@/lib/priva/rot";

function Chip({ n }: { n: NoCadeia }) {
  return (
    <span className={`rounded-sm border px-2 py-1 text-[11px] font-medium ${n.removido ? "border-destructive text-destructive" : "bg-muted/40"}`} data-testid={`no-${n.codigo}`}>
      <span className={n.removido ? "line-through" : ""}>{n.rotulo}</span>
      {n.removido && <span className="ml-1 font-normal" data-testid={`remocao-${n.codigo}`}>(removida — {descreverRemocao(n)})</span>}
    </span>
  );
}

function LinhaTrilha({ t }: { t: TrilhaPRT }) {
  return (
    <li className="rounded-sm border p-2" data-testid={`trilha-${t.chave}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold">{t.prt} · {t.nomePRT}</span>
        <Tag tone={t.status.tipo === "COMPLETA" ? "success" : t.status.tipo === "PENDENTE" ? "warning" : "destructive"}>{rotuloStatus(t.status)}</Tag>
        {t.status.tipo === "ROMPE" && <span className="text-[11px] text-muted-foreground">({t.status.motivo})</span>}
      </div>
      {t.arestas.map((a, i) => (
        <div key={i} className="mt-1 flex flex-wrap items-center gap-1">
          <Chip n={a.de} />
          <span className="inline-flex flex-col items-center px-1 text-[10px] text-muted-foreground">
            <ArrowRight className="h-3 w-3" />
            {a.hash ? `hash ${a.hash.slice(0, 8)}…` : "sem hash"}
          </span>
          {a.para ? <Chip n={a.para} /> : <span className="rounded-sm border border-dashed px-2 py-1 text-[11px]">{a.destino}</span>}
        </div>
      ))}
      {t.novoTratamento.length > 0 && <p className="mt-2 text-[11px]">Continuidade: {t.novoTratamento.join("; ")}</p>}
      {t.arestas.map((a, i) => (
        <p key={`s${i}`} className="mt-1 text-[10px] text-muted-foreground">
          Data: {a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "não registrada"} · Etapa 2 origem: {a.assinaturaOrigem ? `✓ ${a.assinaturaOrigem.assinante}` : "ausente"} · Etapa 1 receptor: {rotuloEtapa1Receptor(a)}
        </p>
      ))}
    </li>
  );
}

/** B.1–B.5 — visão "Cadeia de custódia" no Bloco 2. */
export function GrafoCadeiaCustodia({ rows }: { rows: RotRow[] }) {
  const { demo } = usePriva();
  const trilhas = useMemo(() => montarCadeia(rows), [rows]);
  const [simulacao, setSimulacao] = useState<string | null>(null);
  const completas = trilhas.filter((t) => t.status.tipo === "COMPLETA").length;
  const pendentes = trilhas.filter((t) => t.status.tipo === "PENDENTE").length;
  const rompidas = trilhas.filter((t) => t.status.tipo === "ROMPE").length;
  const simular = () => {
    // Demonstração de B.4: recompartilha um PRT já vinculado com o mesmo setor.
    const base = rows.find((r) => (r.produtos_tratamento as { destino?: { linha_receptor_id?: string } }[] | null)?.some((p) => p.destino?.linha_receptor_id));
    const prt = (base?.produtos_tratamento as { nome: string; destino?: { area_setor_destino?: string; linha_receptor_id?: string } }[] | null)?.find((p) => p.destino?.linha_receptor_id);
    if (!base || !prt?.destino?.area_setor_destino) return setSimulacao("Nenhum compartilhamento interno vinculado para simular.");
    const antes = rows.length;
    const existente = receptoraExistente(rows, base.id, prt.destino.area_setor_destino, prt.nome);
    setSimulacao(existente
      ? `Recompartilhamento de "${prt.nome}" (${base.codigo}) com ${prt.destino.area_setor_destino}: vinculado à linha existente ${existente.codigo}. Linhas no ROT: ${antes} antes → ${antes} depois (nenhuma linha receptora duplicada).`
      : "Nenhuma linha receptora existente: uma nova seria criada.");
  };
  return (
    <Panel id="cadeia-custodia" title={`Cadeia de custódia · ${trilhas.length} trilhas de PRT · ${completas} completas · ${pendentes} pendentes · ${rompidas} rompidas`}>
      <p className="mb-2 text-[11px] text-muted-foreground">
        Nó = linha do ROT (Área › Setor + código). Aresta = compartilhamento do PRT, com data, assinaturas e hash. Registro das operações: <CitacaoNormativa citacao="LGPD art. 37" />. Prova documental para fins de <CitacaoNormativa citacao="LGPD art. 43" />.
      </p>
      <p className="mb-2 rounded-sm border border-dashed p-2 text-[11px]" data-testid="nota-hash">{NOTA_HASH_ASSINATURA}</p>
      <ul className="space-y-2" data-testid="grafo-cadeia">{trilhas.map((t) => <LinhaTrilha key={t.chave} t={t} />)}</ul>
      {demo && (
        <div className="mt-3 rounded-sm border border-dashed p-2">
          <Button size="sm" variant="outline" onClick={simular}><Link2 className="h-4 w-4" /> Compartilhar de novo o mesmo PRT com o mesmo setor</Button>
          {simulacao && <p className="mt-2 text-xs font-medium" data-testid="resultado-sem-duplicacao">{simulacao}</p>}
        </div>
      )}
    </Panel>
  );
}

/** C.1–C.3 — seleção do nó do incidente e relatório "Prova de cadeia de custódia". */
export function ProvaCadeiaCustodia({ rows, incidenteId, processoId }: { rows: RotRow[]; incidenteId: string; processoId: string | null }) {
  const { demo, role, cnpj, demoRegistrarEvento } = usePriva();
  const ativas = useMemo(() => linhasAtivas(rows), [rows]);
  const [noId, setNoId] = useState<string>(processoId ?? ativas[0]?.id ?? "");
  const [registro, setRegistro] = useState<{ ts: string; hash: string; simulado: boolean } | null>(null);
  // B.3 — toda seleção do nó do incidente entra na trilha (hash + timestamp), para o relatório ser reproduzível.
  useEffect(() => {
    if (!noId) return;
    const codigo = rows.find((r) => r.id === noId)?.codigo ?? noId;
    const detalhe = `Seleção do nó do incidente · incidente ${incidenteId} · nó ${codigo}`;
    let vivo = true;
    void (async () => {
      if (demo) {
        const r = await demoRegistrarEvento("SELECT", "registro_operacoes", `${detalhe} (simulação)`);
        if (vivo) setRegistro({ ...r, simulado: true });
        return;
      }
      const { data } = await supabase.rpc("registrar_acesso", { _role: role, _op: "SELECT", _target: "registro_operacoes", _detail: detalhe, _cnpj: cnpj ?? "", _campo: "" });
      const t = data as { ts: string; hash: string } | null;
      if (vivo && t) setRegistro({ ts: t.ts, hash: t.hash, simulado: false });
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noId, incidenteId]);
  const trilhas = useMemo(() => montarCadeia(rows), [rows]);
  const sel = rows.find((r) => r.id === noId);
  const doNo = sel ? trilhasDoNo(trilhas, sel.id) : [];
  const art43 = BIBLIOTECA_NORMATIVA.find((e) => e.norma === "LGPD" && e.identificador === "art. 43");
  const relatorio = sel && art43?.status === "VERIFICADA" && art43.texto_literal
    ? relatorioProvaCadeia({ noSelecionado: sel, trilhas: doNo, linhas: rows, incidenteId, art43Literal: art43.texto_literal, art43Url: art43.url_oficial, geradoEm: registro?.ts ?? new Date().toISOString(), selecao: registro })
    : null;
  const baixar = () => {
    if (!relatorio || !sel) return;
    const url = URL.createObjectURL(new Blob([relatorio], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `prova-cadeia-custodia-${sel.codigo}.txt`; a.click(); URL.revokeObjectURL(url);
    toast.success("Relatório gerado para anexar ao dossiê");
  };
  return (
    <Panel id="prova-cadeia" title="Prova de cadeia de custódia (art. 43)">
      <label className="text-xs font-semibold" htmlFor="no-incidente">Nó da cadeia onde o incidente ocorreu</label>
      <select id="no-incidente" className="mt-1 block w-full rounded-sm border bg-background p-2 text-sm" value={noId} onChange={(e) => setNoId(e.target.value)}>
        {ativas.map((r) => <option key={r.id} value={r.id}>{rotuloNo(r)}</option>)}
      </select>
      {registro && <p className="mt-1 text-[11px] text-muted-foreground" data-testid="selecao-registrada">Seleção registrada na trilha{registro.simulado ? " (simulação, sem gravação)" : ""} em {new Date(registro.ts).toLocaleString("pt-BR")} · SHA-256 {registro.hash}</p>}
      <p className="mt-2 rounded-sm border border-dashed p-2 text-[11px]">{NOTA_HASH_ASSINATURA}</p>
      {sel && (
        <>
          <ul className="mt-3 space-y-2">{doNo.map((t) => <LinhaTrilha key={t.chave} t={t} />)}</ul>
          {!doNo.length && <p className="mt-2 text-xs text-muted-foreground">Nenhum PRT passa por este nó.</p>}
          <p className="mt-3 text-xs"><GitBranch className="mr-1 inline h-3 w-3" /><strong>Inciso que a prova sustenta:</strong> {incisoSustentado(doNo)} <CitacaoNormativa citacao="LGPD art. 43" /></p>
          <p className="mt-1 text-[11px] text-muted-foreground">{AVISO_EXCLUDENTE}</p>
          {relatorio && (
            <>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-sm border bg-muted/40 p-2 text-[11px]" data-testid="relatorio-prova-cadeia">{relatorio}</pre>
              <Button size="sm" className="mt-2" onClick={baixar}><Download className="h-4 w-4" /> Baixar relatório para o dossiê</Button>
            </>
          )}
        </>
      )}
    </Panel>
  );
}
