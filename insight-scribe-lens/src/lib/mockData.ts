// Mock data generator for RAG Monitoring Platform

export interface RequestLog {
  id: string;
  query: string;
  response: string;
  tokens: { input: number; output: number; total: number };
  cost: number;
  latency: number;
  timestamp: string;
  model: string;
  status: "success" | "error";
  traceId: string;
}

export interface EvaluationResult {
  requestId: string;
  query: string;
  relevanceScore: number;
  hallucinationScore: number;
  contextScore: number;
  overallScore: number;
  timestamp: string;
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

const queries = [
  "What is retrieval augmented generation?",
  "Explain vector embeddings in simple terms",
  "How does ChromaDB store documents?",
  "What are the benefits of RAG over fine-tuning?",
  "How to implement semantic search?",
  "What is cosine similarity?",
  "Explain the transformer architecture",
  "How does attention mechanism work?",
  "What are hallucinations in LLMs?",
  "How to evaluate RAG pipeline quality?",
  "What is prompt engineering?",
  "How to chunk documents for RAG?",
  "What embedding models are best for RAG?",
  "Explain the difference between RAG and fine-tuning",
  "How to handle multi-turn conversations in RAG?",
];

const responses = [
  "RAG combines retrieval from a knowledge base with language model generation to produce grounded, accurate responses...",
  "Vector embeddings are numerical representations of text that capture semantic meaning in high-dimensional space...",
  "ChromaDB stores documents as vector embeddings alongside metadata, enabling efficient similarity search...",
  "RAG provides several advantages: no retraining needed, always up-to-date knowledge, lower cost, and better grounding...",
  "Semantic search uses embedding models to convert queries and documents into vectors, then finds nearest neighbors...",
  "Cosine similarity measures the angle between two vectors, ranging from -1 to 1, where 1 means identical direction...",
  "The transformer architecture uses self-attention mechanisms to process input sequences in parallel...",
  "Attention allows the model to weigh the importance of different input tokens when generating each output token...",
  "Hallucinations occur when LLMs generate plausible-sounding but factually incorrect information...",
  "RAG pipeline quality can be evaluated through relevance scoring, hallucination detection, and context utilization metrics...",
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateRequestLog(index: number, daysAgo: number): RequestLog {
  const inputTokens = Math.floor(randomBetween(150, 800));
  const outputTokens = Math.floor(randomBetween(100, 600));
  const isError = Math.random() < 0.03;
  const latency = isError ? randomBetween(5000, 15000) : randomBetween(200, 3500);
  const cost = (inputTokens * 0.000003 + outputTokens * 0.000015);

  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(randomBetween(0, 23)));
  date.setMinutes(Math.floor(randomBetween(0, 59)));

  return {
    id: `req_${String(index).padStart(6, "0")}`,
    query: queries[index % queries.length],
    response: isError ? "Error: Request timed out" : responses[index % responses.length],
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: parseFloat(cost.toFixed(6)),
    latency: Math.round(latency),
    timestamp: date.toISOString(),
    model: Math.random() > 0.3 ? "gpt-4o" : "gpt-4o-mini",
    status: isError ? "error" : "success",
    traceId: `trace_${Math.random().toString(36).substr(2, 12)}`,
  };
}

function generateEvaluation(log: RequestLog): EvaluationResult {
  return {
    requestId: log.id,
    query: log.query,
    relevanceScore: parseFloat(randomBetween(3.2, 5).toFixed(1)),
    hallucinationScore: parseFloat(randomBetween(0, 1.5).toFixed(1)),
    contextScore: parseFloat(randomBetween(3, 5).toFixed(1)),
    overallScore: parseFloat(randomBetween(3.5, 4.8).toFixed(1)),
    timestamp: log.timestamp,
  };
}

// Generate data
export const requestLogs: RequestLog[] = Array.from({ length: 200 }, (_, i) =>
  generateRequestLog(i, Math.floor(i / 15))
).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const evaluations: EvaluationResult[] = requestLogs
  .filter((l) => l.status === "success")
  .slice(0, 100)
  .map(generateEvaluation);

export function getLatencyMetrics(): LatencyMetrics {
  const latencies = requestLogs.map((r) => r.latency).sort((a, b) => a - b);
  const len = latencies.length;
  return {
    avg: Math.round(latencies.reduce((a, b) => a + b, 0) / len),
    p50: latencies[Math.floor(len * 0.5)],
    p95: latencies[Math.floor(len * 0.95)],
    p99: latencies[Math.floor(len * 0.99)],
  };
}

export function getOverviewStats() {
  const totalRequests = requestLogs.length;
  const totalCost = requestLogs.reduce((s, r) => s + r.cost, 0);
  const errorRate = requestLogs.filter((r) => r.status === "error").length / totalRequests;
  const metrics = getLatencyMetrics();
  const totalTokens = requestLogs.reduce((s, r) => s + r.tokens.total, 0);
  const avgEvalScore = evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length;

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

export function getLatencyTimeSeries(): TimeSeriesPoint[] {
  const grouped: Record<string, number[]> = {};
  requestLogs.forEach((r) => {
    const day = r.timestamp.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(r.latency);
  });
  return Object.entries(grouped)
    .map(([time, vals]) => ({
      time,
      value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getRequestsPerDay(): TimeSeriesPoint[] {
  const grouped: Record<string, number> = {};
  requestLogs.forEach((r) => {
    const day = r.timestamp.slice(0, 10);
    grouped[day] = (grouped[day] || 0) + 1;
  });
  return Object.entries(grouped)
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getCostPerDay(): TimeSeriesPoint[] {
  const grouped: Record<string, number> = {};
  requestLogs.forEach((r) => {
    const day = r.timestamp.slice(0, 10);
    grouped[day] = (grouped[day] || 0) + r.cost;
  });
  return Object.entries(grouped)
    .map(([time, value]) => ({ time, value: parseFloat(value.toFixed(4)) }))
    .sort((a, b) => a.time.localeCompare(b.time));
}
