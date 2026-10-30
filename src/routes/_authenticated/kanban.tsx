import { createFileRoute } from "@tanstack/react-router";
import { Kanban } from "@/components/priva/views/Kanban";

export const Route = createFileRoute("/_authenticated/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban 5W2H — Privacium" },
      { name: "description", content: "Quadro Kanban transversal para as ações 5W2H do Método BLLOCO." },
      { property: "og:title", content: "Kanban 5W2H — Privacium" },
      { property: "og:description", content: "Quadro Kanban transversal para as ações 5W2H do Método BLLOCO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Kanban,
});
