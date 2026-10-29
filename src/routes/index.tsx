import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Acesso à plataforma — Privacium" },
    { name: "description", content: "Acesso à plataforma de governança de privacidade Privacium." },
    { property: "og:title", content: "Acesso à plataforma — Privacium" },
    { property: "og:description", content: "Acesso à plataforma de governança de privacidade Privacium." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
