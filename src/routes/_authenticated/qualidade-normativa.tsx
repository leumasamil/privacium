import { createFileRoute } from "@tanstack/react-router";
import { QualidadeNormativa } from "@/components/priva/views/QualidadeNormativa";

export const Route = createFileRoute("/_authenticated/qualidade-normativa")({
  head: () => ({
    meta: [
      { title: "Qualidade Normativa — Privacium" },
      { name: "description", content: "Biblioteca normativa versionada: citações por status de verificação, com fonte oficial e trilha auditada." },
      { property: "og:title", content: "Qualidade Normativa — Privacium" },
      { property: "og:description", content: "Biblioteca normativa versionada: citações por status de verificação, com fonte oficial e trilha auditada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QualidadeNormativa,
});
