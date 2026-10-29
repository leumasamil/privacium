import { Link } from "@tanstack/react-router";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Ajuda5W2H } from "@/lib/priva/ajuda";

/** Ajuda contextual 5W2H expansível (fechada por padrão). Radix cuida de aria-expanded/aria-controls e teclado. */
export function AjudaTarefa(props: Ajuda5W2H) {
  const { bloco, titulo, passos, errosComuns } = props;
  if (import.meta.env.DEV && passos.length < 5) {
    console.warn(`[AjudaTarefa] Bloco ${bloco}: "Como" precisa de no mínimo 5 passos (recebeu ${passos.length}).`);
  }
  const linhas: [string, string][] = [
    ["O quê", props.oQue], ["Por quê", props.porQue], ["Quem", props.quem], ["Onde", props.onde],
    ["Quando", props.quando], ["Como", props.como ?? `Conforme o passo a passo abaixo (${passos.length} etapas).`], ["Quanto", props.quanto],
  ];
  return (
    <Accordion type="single" collapsible className="rounded-sm border bg-card">
      <AccordionItem value="ajuda" className="border-0">
        <AccordionTrigger className="px-3 py-2 text-xs font-medium text-muted-foreground hover:no-underline focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" aria-hidden />
            Como executar esta tarefa
            <span className="font-normal">· Bloco {bloco} — {titulo}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-3 pb-4 text-xs">
          <table className="w-full border-collapse">
            <caption className="sr-only">Quadro 5W2H — {titulo}</caption>
            <tbody>
              {linhas.map(([k, v]) => (
                <tr key={k} className="border-t align-top">
                  <th scope="row" className="w-24 py-1.5 pr-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</th>
                  <td className="py-1.5 text-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <section>
            <h4 className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Passo a passo</h4>
            <ol className="list-decimal space-y-1 pl-5 text-foreground">
              {passos.map((p) => <li key={p}>{p}</li>)}
            </ol>
          </section>
          <section className="border-l-2 border-foreground/40 bg-muted/50 p-2">
            <h4 className="mb-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-foreground">
              <AlertTriangle className="h-3 w-3" aria-hidden /> Erros comuns
            </h4>
            <ul className="list-disc space-y-0.5 pl-5">
              {errosComuns.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </section>
          <Link to="/manual" search={{ aba: "guias" }} className="inline-block font-medium text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2">
            Ver no Manual →
          </Link>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
