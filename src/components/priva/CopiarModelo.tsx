import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePriva } from "@/lib/priva/store";
import { BIBLIOTECA_TEXTOS, enveloparModelo, textoCompleto, type TextoId } from "@/lib/privacium/bibliotecaTextos";

/**
 * Botão "Copiar modelo": entrega o texto com cabeçalho e rodapé obrigatórios e
 * registra a cópia na trilha (memória no demo; trilha_auditoria_sistema no real),
 * evidenciando a intervenção humana sobre o modelo.
 */
export function CopiarModelo({ textoId, texto, pi, fonte, rotulo = "Copiar modelo" }: {
  textoId?: TextoId;
  /** Texto ad hoc (ex.: sugestão do PI-05); exige pi e fonte. */
  texto?: string;
  pi?: string;
  fonte?: string;
  rotulo?: string;
}) {
  const { log, demo, demoRegistrarEvento } = usePriva();
  const entrada = textoId ? BIBLIOTECA_TEXTOS[textoId] : null;
  const copiar = async () => {
    const completo = entrada ? textoCompleto(entrada) : enveloparModelo(texto ?? "", pi ?? "", fonte ?? "");
    try {
      await navigator.clipboard.writeText(completo);
    } catch {
      toast.error("Não foi possível acessar a área de transferência.");
      return;
    }
    const id = entrada?.id ?? "pi05-sugestao";
    const titulo = entrada?.titulo ?? "sugestão do PI-05";
    const detail = `Cópia do modelo ${id} (${titulo})`;
    if (demo) await demoRegistrarEvento("SELECT", "biblioteca_textos", detail);
    else log("SELECT", "biblioteca_textos", detail);
    toast.success("Modelo copiado com cabeçalho de revisão. Revise e adapte antes de assinar.");
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copiar()} data-testid={`copiar-${entrada?.id ?? "pi05"}`}>
      <Copy className="h-3 w-3" /> {rotulo}
    </Button>
  );
}
