import type { RequestLog, EvaluationResult } from "./dataStore";

function escapeCsv(value: any): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRequestLogs(logs: RequestLog[]) {
  const headers = ["request_id", "query", "response", "model", "status", "input_tokens", "output_tokens", "total_tokens", "cost", "latency", "trace_id", "created_at"];
  const rows = logs.map((log) =>
    headers.map((h) => escapeCsv(log[h as keyof RequestLog])).join(",")
  );
  downloadCsv(`request_logs_${new Date().toISOString().slice(0, 10)}.csv`, [headers.join(","), ...rows].join("\n"));
}

export function exportEvaluations(evals: EvaluationResult[]) {
  const headers = ["request_id", "query", "relevance_score", "hallucination_score", "context_score", "overall_score", "created_at"];
  const rows = evals.map((ev) =>
    headers.map((h) => escapeCsv(ev[h as keyof EvaluationResult])).join(",")
  );
  downloadCsv(`evaluations_${new Date().toISOString().slice(0, 10)}.csv`, [headers.join(","), ...rows].join("\n"));
}
