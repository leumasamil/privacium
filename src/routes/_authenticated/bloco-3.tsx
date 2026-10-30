import { createFileRoute } from "@tanstack/react-router";
import { Bloco3 } from "@/components/priva/views/Bloco3";
import { BlockGate } from "@/components/priva/ui";
export { hashEstrutura } from "@/components/priva/views/Bloco3";

export const Route = createFileRoute("/_authenticated/bloco-3")({
  head: () => ({
    meta: [
      { title: "Bloco 3 · Implementar Salvaguardas — Privacium" },
      { name: "description", content: "Ativos de segurança (BitLocker, Cryptomator) e simulador do Escudo Digital de IA (Art. 46 LGPD)." },
      { property: "og:title", content: "Bloco 3 · Implementar Salvaguardas — Privacium" },
      { property: "og:description", content: "Ativos de segurança (BitLocker, Cryptomator) e simulador do Escudo Digital de IA (Art. 46 LGPD)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <BlockGate n={3}><Bloco3 /></BlockGate>,
});
