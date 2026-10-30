import { createFileRoute } from "@tanstack/react-router";
import { Manual } from "@/components/priva/views/Manual";
const T = "Manual de Uso — Privacium";
const D = "Guias 5W2H por bloco do Método BLLOCO, quadro art. 7º × art. 11, classificação de dados, glossário LGPD e FAQ.";

export const Route = createFileRoute("/_authenticated/manual")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { aba?: string } => (typeof s["aba"] === "string" ? { aba: s["aba"] } : {}),
  component: () => <Manual aba={Route.useSearch().aba} />,
});
