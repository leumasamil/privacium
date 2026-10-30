import { useEffect, useRef, useState } from "react";
import { BookOpen, ShieldQuestion } from "lucide-react";
import { buscarNorma } from "@/lib/priva/pedagogia";
import { citacaoVerificada, referenciaGenerica } from "@/lib/priva/bibliotecaNormativa";
import { usePriva } from "@/lib/priva/store";

/**
 * Citação legal/normativa com pedagogia: ao clicar, expande o resumo fiel do
 * dispositivo e a relevância prática.
 *
 * Regra de renderização (biblioteca normativa versionada, item B.3): se o
 * dispositivo não estiver com status VERIFICADA na biblioteca, a citação NÃO
 * renderiza o identificador específico — exibe apenas a referência genérica da
 * norma com a marca "em verificação" — e a pendência é registrada na trilha.
 */
export function CitacaoNormativa({ citacao, className }: { citacao: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const { log, demo } = usePriva();
  const pendenciaRegistrada = useRef(false);
  const verificada = citacaoVerificada(citacao);

  useEffect(() => {
    if (verificada || pendenciaRegistrada.current || demo) return;
    pendenciaRegistrada.current = true;
    log("SELECT", "biblioteca_normativa", `Pendência normativa: citação não verificada suprimida na interface (${citacao})`);
  }, [verificada, demo, citacao, log]);

  if (!verificada) {
    return (
      <span className={className} data-testid={`citacao-pendente-${referenciaGenerica(citacao)}`}>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <ShieldQuestion className="h-3 w-3" /> {referenciaGenerica(citacao)}
          <span className="rounded-sm border border-warning px-1 text-[10px] font-medium text-warning">em verificação</span>
        </span>
      </span>
    );
  }

  const norma = buscarNorma(citacao);
  if (!norma) return <span className={className}>{citacao}</span>;
  return (
    <span className={className}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-primary"
      >
        <BookOpen className="h-3 w-3" /> {norma.citacao}
      </button>
      {aberto && (
        <span className="mt-1 block rounded-sm border bg-muted/40 p-2 text-xs leading-relaxed">
          <span className="block">{norma.resumo}</span>
          <span className="mt-1 block font-medium text-primary">Por que importa para você: {norma.porque}</span>
        </span>
      )}
    </span>
  );
}
