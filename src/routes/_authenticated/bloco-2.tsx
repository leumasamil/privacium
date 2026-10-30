import { createFileRoute } from "@tanstack/react-router";
import { Bloco2 } from "@/components/priva/views/Bloco2";
import { BlockGate } from "@/components/priva/ui";

export const Route = createFileRoute("/_authenticated/bloco-2")({
  head: () => ({
    meta: [
      { title: "Bloco 2 · Registro de Operações de Tratamento — Privacium" },
      { name: "description", content: "Planilha mestre do ROT (Art. 37 da LGPD) com 12 colunas operacionais e travas de risco." },
      { property: "og:title", content: "Bloco 2 · Registro de Operações de Tratamento — Privacium" },
      { property: "og:description", content: "Planilha mestre do ROT (Art. 37 da LGPD) com 12 colunas operacionais e travas de risco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <BlockGate n={2}><Bloco2 /></BlockGate>,
});
