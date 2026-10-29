import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePriva } from "./store";
export function useEncarregado() {
  const { cnpj, demo, log } = usePriva();
  const query = useQuery({
    queryKey: ["encarregado_dpo", cnpj, demo], enabled: !!cnpj && !demo,
    queryFn: async () => {
      const { data, error } = await supabase.from("encarregado_dpo").select("*").eq("empresa_cnpj", cnpj ?? "").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => { if (cnpj && !demo) log("SELECT", "encarregado_dpo", "Leitura do contato do encarregado"); }, [cnpj, demo, log]);
  return query;
}