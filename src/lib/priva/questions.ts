import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Question } from "./data";

export const questionsQuery = queryOptions({
  queryKey: ["question_bank"],
  staleTime: Infinity,
  queryFn: async (): Promise<Question[]> => {
    const { data, error } = await supabase.from("question_bank").select("*").order("id");
    if (error) throw error;
    return data;
  },
});

export const useQuestions = () => useQuery(questionsQuery).data ?? [];
