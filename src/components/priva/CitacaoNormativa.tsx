import { useState } from "react";
import { BookOpen } from "lucide-react";
import { buscarNorma } from "@/lib/priva/pedagogia";

/**
 * Citação legal/normativa com pedagogia: ao clicar, expande o resumo fiel do
 * dispositivo e a relevância prática. Se o dispositivo não estiver na
 * biblioteca, exibe só a citação, sem explicação inventada.
 */
export function CitacaoNormativa({ citacao, className }: { citacao: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
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
