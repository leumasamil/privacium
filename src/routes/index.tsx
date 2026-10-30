import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from '@/integrations/supabase/client';
import { safeAuthPath } from '@/lib/priva/authNavigation';

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({ redirect: safeAuthPath(typeof search['redirect'] === 'string' ? search['redirect'] : undefined) }),
  head: () => ({ meta: [
    { title: "Acesso à plataforma — Privacium" },
    { name: "description", content: "Acesso à plataforma de governança de privacidade Privacium." },
    { property: "og:title", content: "Acesso à plataforma — Privacium" },
    { property: "og:description", content: "Acesso à plataforma de governança de privacidade Privacium." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: safeAuthPath(search.redirect) });
    throw redirect({ to: "/auth", search: { redirect: safeAuthPath(search.redirect) } });
  },
});
