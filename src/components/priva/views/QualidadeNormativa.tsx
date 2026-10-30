import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldQuestion, Filter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePriva } from "@/lib/priva/store";
import { avisarAcaoDemo } from "@/lib/priva/demoAction";
import { BIBLIOTECA_NORMATIVA, type EntradaNormativa, type StatusNormativo } from "@/lib/priva/bibliotecaNormativa";
import { PageHeader, Panel, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STATUS: StatusNormativo[] = ["VERIFICADA", "PENDENTE", "DIVERGENTE", "NAO_VERIFICAVEL"];
const ROTULO_STATUS: Record<StatusNormativo, string> = {
  VERIFICADA: "Verificada",
  PENDENTE: "Pendente",
  DIVERGENTE: "Divergente",
  NAO_VERIFICAVEL: "Não verificável",
};
const TOM_STATUS: Record<StatusNormativo, "success" | "warning" | "destructive" | "muted"> = {
  VERIFICADA: "success",
  PENDENTE: "warning",
  DIVERGENTE: "destructive",
  NAO_VERIFICAVEL: "muted",
};

type Linha = EntradaNormativa & { id: string };

/**
 * Painel "Qualidade normativa" (Transversal): lista as citações da biblioteca
 * normativa por status, com filtro, e permite ao DPO marcar como verificada
 * informando URL oficial e texto literal. Toda alteração vai para a trilha
 * com hash (RPC verificar_citacao_normativa).
 */
export function QualidadeNormativa() {
  const { roles, demo, log } = usePriva();
  const qc = useQueryClient();
  const podeVerificar = roles.includes("DPO_OPERACIONAL") || roles.includes("ADMIN_SISTEMA");
  const [filtro, setFiltro] = useState<StatusNormativo | "TODAS">("TODAS");
  const [editando, setEditando] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["biblioteca_normativa"],
    enabled: !demo,
    queryFn: async (): Promise<Linha[]> => {
      const { data, error } = await supabase.from("biblioteca_normativa").select("*").order("norma").order("identificador");
      if (error) throw error;
      return data as Linha[];
    },
  });

  const linhas: Linha[] = useMemo(() => {
    if (demo) return BIBLIOTECA_NORMATIVA.map((e, i) => ({ ...e, id: `demo-${i}` }));
    return q.data ?? [];
  }, [demo, q.data]);

  const filtradas = filtro === "TODAS" ? linhas : linhas.filter((l) => l.status === filtro);
  const contagem = STATUS.map((s) => ({ s, n: linhas.filter((l) => l.status === s).length }));

  const verificar = async (id: string) => {
    if (demo) return avisarAcaoDemo();
    if (!podeVerificar) return;
    if (!url.trim() || texto.trim().length < 20) {
      toast.error("Informe a URL oficial e o texto literal (mínimo 20 caracteres).");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("verificar_citacao_normativa", { _id: id, _url: url.trim(), _texto: texto.trim() });
    setBusy(false);
    if (error) { toast.error(`Falha ao verificar: ${error.message}`); return; }
    log("UPDATE", "biblioteca_normativa", "Citação normativa marcada como verificada no painel Qualidade normativa");
    toast.success("Citação verificada e registrada na trilha com hash.");
    setEditando(null); setUrl(""); setTexto("");
    void qc.invalidateQueries({ queryKey: ["biblioteca_normativa"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Transversal · Biblioteca normativa versionada" title="Qualidade normativa" />
      <p className="text-sm text-muted-foreground">
        Toda citação normativa do produto é lida desta biblioteca. Citações sem status <b>Verificada</b> não renderizam
        o identificador específico na interface — apenas a referência genérica da norma — e a pendência é registrada na trilha.
      </p>

      <Panel title="Citações por status">
        <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="filtro-status">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(["TODAS", ...STATUS] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltro(s)}
              data-testid={`filtro-${s}`}
              className={`rounded-sm border px-3 py-1 text-xs font-semibold ${filtro === s ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              {s === "TODAS" ? `Todas (${linhas.length})` : `${ROTULO_STATUS[s]} (${contagem.find((c) => c.s === s)?.n ?? 0})`}
            </button>
          ))}
        </div>

        <ul className="divide-y text-sm" data-testid="lista-citacoes">
          {filtradas.map((l) => (
            <li key={l.id} className="py-3" data-testid={`citacao-${l.norma}-${l.identificador}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-primary">{l.norma} · {l.identificador}</span>
                <Tag tone={TOM_STATUS[l.status]}>{ROTULO_STATUS[l.status]}</Tag>
              </div>
              {l.status === "VERIFICADA" && l.texto_literal && (
                <p className="mt-1 text-xs text-muted-foreground">{l.texto_literal.length > 220 ? `${l.texto_literal.slice(0, 220)}…` : l.texto_literal}</p>
              )}
              {l.observacao && <p className="mt-1 text-[11px] text-muted-foreground">{l.observacao}</p>}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {l.url_oficial && <a className="underline" href={l.url_oficial} target="_blank" rel="noreferrer">Fonte oficial</a>}
                {l.verificado_em && <span> · verificada em {new Date(`${l.verificado_em}T00:00:00`).toLocaleDateString("pt-BR")} por {l.verificado_por}</span>}
              </p>
              {l.status !== "VERIFICADA" && podeVerificar && !demo && (
                <div className="mt-2">
                  {editando === l.id ? (
                    <div className="space-y-2 rounded-sm border bg-background p-3" data-testid={`form-verificar-${l.id}`}>
                      <Input placeholder="URL oficial da fonte" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL oficial" />
                      <Textarea rows={4} placeholder="Texto literal do dispositivo, transcrito da fonte oficial" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Texto literal" />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy} onClick={() => void verificar(l.id)}><ShieldCheck className="h-4 w-4" /> Marcar como verificada</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setEditando(l.id); setUrl(l.url_oficial ?? ""); setTexto(""); }} data-testid={`abrir-verificar-${l.id}`}>
                      <ShieldQuestion className="h-4 w-4" /> Verificar esta citação
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
          {!filtradas.length && <li className="py-6 text-center text-sm text-muted-foreground">Nenhuma citação com este status.</li>}
        </ul>
      </Panel>
    </div>
  );
}
