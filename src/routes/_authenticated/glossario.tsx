import { createFileRoute } from "@tanstack/react-router";
import { Glossario } from "@/components/priva/views/Glossario";

export const Route = createFileRoute("/_authenticated/glossario")({
  head: () => ({
    meta: [
      { title: "Glossário — Privacium" },
      { name: "description", content: "Todos os termos e siglas da plataforma Privacium explicados em linguagem simples." },
      { property: "og:title", content: "Glossário — Privacium" },
      { property: "og:description", content: "Todos os termos e siglas da plataforma Privacium explicados em linguagem simples." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Glossario,
});
