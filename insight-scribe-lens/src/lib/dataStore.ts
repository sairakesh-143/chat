// Supabase-backed data store for RAG monitoring data

import { supabase } from "@/integrations/supabase/client";

export interface RequestLog {
  id: string;
  request_id: string;
  query: string;
  response: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  latency: number;
  created_at: string;
  model: string;
  status: string;
  trace_id: string | null;
  user_id: string;
}

export interface EvaluationResult {
  id: string;
  request_id: string;
  request_log_id: string | null;
  query: string;
  relevance_score: number;
  hallucination_score: number;
  context_score: number;
  overall_score: number;
  created_at: string;
  user_id: string;
}

export interface LatencyMetrics {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

// ---- Fetch functions (async) ----

export async function fetchRequestLogs(): Promise<RequestLog[]> {
  const { data, error } = await supabase
    .from("request_logs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RequestLog[];
}

export async function addRequestLog(log: Omit<RequestLog, "id" | "created_at">) {
  const { error } = await supabase.from("request_logs").insert(log);
  if (error) throw error;
}

export async function deleteRequestLog(id: string) {
  // Delete linked evaluations first
  await supabase.from("evaluations").delete().eq("request_log_id", id);
  const { error } = await supabase.from("request_logs").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchEvaluations(): Promise<EvaluationResult[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EvaluationResult[];
}

export async function addEvaluation(ev: Omit<EvaluationResult, "id" | "created_at">) {
  const { error } = await supabase.from("evaluations").insert(ev);
  if (error) throw error;
}

// ---- Computed helpers (work on fetched data) ----

export function computeLatencyMetrics(logs: RequestLog[]): LatencyMetrics {
  if (logs.length === 0) return { avg: 0, p50: 0, p95: 0, p99: 0 };
  const latencies = logs.map((r) => r.latency).sort((a, b) => a - b);
  const len = latencies.length;
  return {
    avg: Math.round(latencies.reduce((a, b) => a + b, 0) / len),
    p50: latencies[Math.floor(len * 0.5)],
    p95: latencies[Math.floor(len * 0.95)],
    p99: latencies[Math.floor(len * 0.99)],
  };
}

export function computeOverviewStats(logs: RequestLog[], evals: EvaluationResult[]) {
  if (logs.length === 0) {
    return { totalRequests: 0, totalCost: 0, errorRate: 0, avgLatency: 0, p95Latency: 0, totalTokens: 0, avgEvalScore: 0 };
  }
  const totalRequests = logs.length;
  const totalCost = logs.reduce((s, r) => s + Number(r.cost), 0);
  const errorRate = logs.filter((r) => r.status === "error").length / totalRequests;
  const metrics = computeLatencyMetrics(logs);
  const totalTokens = logs.reduce((s, r) => s + r.total_tokens, 0);
  const avgEvalScore = evals.length > 0 ? evals.reduce((s, e) => s + Number(e.overall_score), 0) / evals.length : 0;
  return {
    totalRequests,
    totalCost: parseFloat(totalCost.toFixed(4)),
    errorRate: parseFloat((errorRate * 100).toFixed(1)),
    avgLatency: metrics.avg,
    p95Latency: metrics.p95,
    totalTokens,
    avgEvalScore: parseFloat(avgEvalScore.toFixed(2)),
  };
}

export function computeLatencyTimeSeries(logs: RequestLog[]): TimeSeriesPoint[] {
  const grouped: Record<string, number[]> = {};
  logs.forEach((r) => {
    const day = r.created_at.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(r.latency);
  });
  return Object.entries(grouped)
    .map(([time, vals]) => ({ time, value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function computeRequestsPerDay(logs: RequestLog[]): TimeSeriesPoint[] {
  const grouped: Record<string, number> = {};
  logs.forEach((r) => {
    const day = r.created_at.slice(0, 10);
    grouped[day] = (grouped[day] || 0) + 1;
  });
  return Object.entries(grouped).map(([time, value]) => ({ time, value })).sort((a, b) => a.time.localeCompare(b.time));
}

export function computeCostPerDay(logs: RequestLog[]): TimeSeriesPoint[] {
  const grouped: Record<string, number> = {};
  logs.forEach((r) => {
    const day = r.created_at.slice(0, 10);
    grouped[day] = (grouped[day] || 0) + Number(r.cost);
  });
  return Object.entries(grouped).map(([time, value]) => ({ time, value: parseFloat(value.toFixed(4)) })).sort((a, b) => a.time.localeCompare(b.time));
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

export function generateTraceId(): string {
  return `trace_${Math.random().toString(36).substr(2, 12)}`;
}
