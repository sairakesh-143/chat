import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRequestLogs, addRequestLog, deleteRequestLog, type RequestLog } from "@/lib/dataStore";

export function useRequestLogs() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("request_logs_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "request_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["request_logs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["request_logs"],
    queryFn: fetchRequestLogs,
  });
}

export function useAddRequestLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (log: Omit<RequestLog, "id" | "created_at">) => addRequestLog(log),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["request_logs"] }),
  });
}

export function useDeleteRequestLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRequestLog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["request_logs"] });
      qc.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}
