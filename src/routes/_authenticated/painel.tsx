import { createFileRoute } from "@tanstack/react-router";
import { Painel } from "@/components/priva/views/Painel";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Esteira BLLOCO — Privacium" },
      { name: "description", content: "Linha de montagem da conformidade: 5 blocos sequenciais sob o Ciclo Privacium Semestral." },
      { property: "og:title", content: "Esteira BLLOCO — Privacium" },
      { property: "og:description", content: "Linha de montagem da conformidade: 5 blocos sequenciais sob o Ciclo Privacium Semestral." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Painel,
});
