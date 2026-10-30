import { createFileRoute } from "@tanstack/react-router";
import { Bloco4 } from "@/components/priva/views/Bloco4";
import { BlockGate } from "@/components/priva/ui";

export const Route = createFileRoute("/_authenticated/bloco-4")({
  head: () => ({
    meta: [
      { title: "Bloco 4 · Vigiar e Responder — Privacium" },
      { name: "description", content: "Console forense Privacium e gestão de incidentes com prazo ANPD de 3 ou 6 dias úteis conforme enquadramento (Res. 15/2024, art. 6º, § 8º)." },
      { property: "og:title", content: "Bloco 4 · Vigiar e Responder — Privacium" },
      { property: "og:description", content: "Console forense Privacium e gestão de incidentes com prazo ANPD de 3 ou 6 dias úteis conforme enquadramento (Res. 15/2024, art. 6º, § 8º)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <BlockGate n={4}><Bloco4 /></BlockGate>,
});
