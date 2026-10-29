import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { termo } from "@/lib/priva/glossario";

/** Sigla com nome completo acessível por clique (funciona em mobile). */
export function Sigla({ id, children }: { id: string; children?: ReactNode }) {
  const t = termo(id);
  if (!t) return <>{children}</>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="underline decoration-dotted underline-offset-2" aria-label={`${t.termo}${t.nome ? ` — ${t.nome}` : ""}: ver definição`}>
          {children ?? t.termo}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs">
        <p className="font-semibold text-primary">{t.termo}{t.nome ? ` · ${t.nome}` : ""}</p>
        <p className="mt-1 text-muted-foreground">{t.definicao}</p>
        <Link to="/glossario" hash={t.id} className="mt-2 inline-block font-medium text-primary hover:underline">Abrir no Glossário →</Link>
      </PopoverContent>
    </Popover>
  );
}

/** Ícone (i) que abre a fórmula / explicação de um indicador. */
export function InfoFormula({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Como é calculado: ${titulo}`} className="rounded-full text-muted-foreground hover:text-primary">
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs">
        <p className="font-semibold text-primary">Como é calculado</p>
        <div className="mt-1 text-muted-foreground">{children}</div>
        <Link to="/glossario" className="mt-2 inline-block font-medium text-primary hover:underline">Ver Glossário →</Link>
      </PopoverContent>
    </Popover>
  );
}
