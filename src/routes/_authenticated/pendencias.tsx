import { createFileRoute } from "@tanstack/react-router";
import { Pendencias } from "@/components/priva/views/Pendencias";

export const Route = createFileRoute("/_authenticated/pendencias")({
  head: () => ({
    meta: [
      { title: "Dashboard de Pendências — Privacium" },
      { name: "description", content: "Lista transversal de tudo que falta no Ciclo Privacium Semestral, com atalho direto para cada pendência." },
      { property: "og:title", content: "Dashboard de Pendências — Privacium" },
      { property: "og:description", content: "Lista transversal de tudo que falta no Ciclo Privacium Semestral, com atalho direto para cada pendência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pendencias,
});
