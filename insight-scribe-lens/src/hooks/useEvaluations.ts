import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchEvaluations, addEvaluation, type EvaluationResult } from "@/lib/dataStore";

export function useEvaluations() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("evaluations_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "evaluations" }, () => {
        qc.invalidateQueries({ queryKey: ["evaluations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["evaluations"],
    queryFn: fetchEvaluations,
  });
}

export function useAddEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ev: Omit<EvaluationResult, "id" | "created_at">) => addEvaluation(ev),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluations"] }),
  });
}
