import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PrivaProvider } from "@/lib/priva/store";
import { AppShell } from "@/components/priva/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: () => (
    <PrivaProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </PrivaProvider>
  ),
});
