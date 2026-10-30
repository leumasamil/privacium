import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_ROWS, aplicarSessaoDemo } from "./demo";
import { usePriva } from "./store";

type T = "lotes_pgaudit" | "incidentes_seguranca" | "ripd_ia" | "ciclos_priva" | "registro_operacoes";
type Row<K extends T> = Database["public"]["Tables"][K]["Row"];

/** Lê as linhas de uma tabela vinculadas ao CNPJ ativo, com atualização em tempo real. */
export function useCnpjRows<K extends T>(table: K, cnpj: string | null, order: string) {
  const qc = useQueryClient();
  const { demo, demoSessao } = usePriva();
  const key = [table, cnpj] as const;
  const q = useQuery({
    queryKey: key,
    enabled: !!cnpj && !demo,
    queryFn: async (): Promise<Row<K>[]> => {
      const t = table as string as "ripd_ia";
      const { data, error } = await supabase.from(t).select("*").eq("empresa_cnpj", cnpj ?? "").order(order, { ascending: false });
      if (error) throw error;
      return data as unknown as Row<K>[];
    },
  });
  useEffect(() => {
    if (!cnpj || demo) return;
    const ch = supabase.channel(`${table}_${cnpj}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: `empresa_cnpj=eq.${cnpj}` }, () => void qc.invalidateQueries({ queryKey: [table, cnpj] }))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [table, cnpj, qc, demo]);
  if (demo) {
    // O Dashboard lê a mesma fonte do Bloco 4: seed cenográfico + sessão simulada em memória.
    const rows = table === "incidentes_seguranca" ? DEMO_ROWS.incidentes_seguranca.map(i => aplicarSessaoDemo(i, demoSessao)) : DEMO_ROWS[table];
    return { rows: rows as unknown as Row<K>[], refresh: () => undefined };
  }
  return { rows: q.data ?? [], refresh: () => void qc.invalidateQueries({ queryKey: key }) };
}
