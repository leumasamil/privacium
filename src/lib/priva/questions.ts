import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Question } from "./data";

export const questionsQuery = queryOptions({
  queryKey: ["perguntas_diagnostico"],
  staleTime: Infinity,
  queryFn: async (): Promise<Question[]> => {
    const { data, error } = await supabase
      .from("perguntas_diagnostico")
      .select("id, setor, questao_critica, enunciado, peso_criticidade")
      .order("ordem");
    if (error) throw error;
    return data.map((r) => ({ id: r.id, department: r.setor, principle: r.questao_critica, text: r.enunciado, weight: r.peso_criticidade }));
  },
});

export const useQuestions = () => useQuery(questionsQuery).data ?? [];

export type Resposta = "SIM" | "NÃO";

const respostasKey = (cnpj: string | null) => ["respostas_diagnostico", cnpj] as const;

/** Respostas do diagnóstico do CNPJ ativo, com atualização em tempo real. Retorna id da pergunta → SIM (true) / NÃO (false). */
export function useRespostas(cnpj: string | null) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: respostasKey(cnpj),
    enabled: !!cnpj,
    queryFn: async (): Promise<Record<string, boolean>> => {
      const { data, error } = await supabase.from("respostas_diagnostico").select("pergunta_id, resposta_binaria").eq("empresa_cnpj", cnpj ?? "");
      if (error) throw error;
      return Object.fromEntries(data.map((r) => [r.pergunta_id, r.resposta_binaria === "SIM"]));
    },
  });
  useEffect(() => {
    if (!cnpj) return;
    const ch = supabase
      .channel(`respostas_${cnpj}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "respostas_diagnostico", filter: `empresa_cnpj=eq.${cnpj}` }, () => {
        void qc.invalidateQueries({ queryKey: respostasKey(cnpj) });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [cnpj, qc]);
  return q.data ?? {};
}

/** Grava respostas no backend amarradas ao CNPJ ativo e ao CPF do auditor. */
export function useResponder(cnpj: string | null, cpf: string | null) {
  const qc = useQueryClient();
  return async (items: { pergunta_id: string; resposta: Resposta }[]) => {
    if (!cnpj || !cpf) return "Informe o CNPJ e o CPF do auditor.";
    qc.setQueryData<Record<string, boolean>>(respostasKey(cnpj), (old) => {
      const next = { ...(old ?? {}) };
      items.forEach((i) => (next[i.pergunta_id] = i.resposta === "SIM"));
      return next;
    });
    const { error } = await supabase.from("respostas_diagnostico").upsert(
      items.map((i) => ({ empresa_cnpj: cnpj, pergunta_id: i.pergunta_id, usuario_cpf: cpf, resposta_binaria: i.resposta })),
      { onConflict: "empresa_cnpj,pergunta_id" },
    );
    if (error) {
      void qc.invalidateQueries({ queryKey: respostasKey(cnpj) });
      return "Não foi possível salvar a resposta.";
    }
    return null;
  };
}

/** CPF do usuário logado (tabela usuarios). */
export function useMeuCpf(userId: string | null) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["meu_cpf", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("usuarios").select("cpf").eq("id", userId ?? "").maybeSingle();
      return data?.cpf ?? null;
    },
  });
  const salvar = async (cpf: string) => {
    const d = cpf.replace(/\D/g, "");
    const { error } = await supabase.from("usuarios").update({ cpf: d }).eq("id", userId ?? "");
    if (error) return error.code === "23505" ? "CPF já cadastrado para outro usuário." : "CPF inválido.";
    qc.setQueryData(["meu_cpf", userId], d);
    return null;
  };
  return { cpf: q.data ?? null, loading: q.isLoading, salvar };
}
