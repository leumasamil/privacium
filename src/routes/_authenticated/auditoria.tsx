import { createFileRoute } from "@tanstack/react-router";
import { Auditoria } from "@/components/priva/views/Auditoria";
export { acaoLegivel } from "@/components/priva/views/Auditoria";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria e Evidências Civis — Privacium" },
      { name: "description", content: "Trilha forense por CNPJ e trilha master multi-tenant, encadeadas por SHA-256 (ISO/IEC 27037)." },
      { property: "og:title", content: "Auditoria e Evidências Civis — Privacium" },
      { property: "og:description", content: "Trilha forense por CNPJ e trilha master multi-tenant, encadeadas por SHA-256 (ISO/IEC 27037)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auditoria,
});
