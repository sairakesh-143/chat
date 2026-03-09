import { supabase } from "@/integrations/supabase/client";

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
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function seedSampleData(userId: string) {
  // Generate 50 request logs
  const logs = Array.from({ length: 50 }, (_, i) => {
    const inputTokens = Math.floor(rand(150, 800));
    const outputTokens = Math.floor(rand(100, 600));
    const isError = Math.random() < 0.04;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i / 4));
    date.setHours(Math.floor(rand(0, 23)), Math.floor(rand(0, 59)));

    return {
      request_id: `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`,
      query: queries[i % queries.length],
      response: isError ? "Error: Request timed out" : responses[i % responses.length],
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      cost: parseFloat((inputTokens * 0.000003 + outputTokens * 0.000015).toFixed(6)),
      latency: Math.round(isError ? rand(5000, 15000) : rand(200, 3500)),
      model: Math.random() > 0.3 ? "gpt-4o" : "gpt-4o-mini",
      status: isError ? "error" : "success",
      trace_id: `trace_${Math.random().toString(36).substr(2, 12)}`,
      user_id: userId,
      created_at: date.toISOString(),
    };
  });

  const { data: insertedLogs, error: logErr } = await supabase
    .from("request_logs")
    .insert(logs)
    .select("id, request_id, query, created_at, status");

  if (logErr) throw logErr;

  // Generate evaluations for successful logs
  const successLogs = (insertedLogs ?? []).filter((l) => l.status === "success").slice(0, 25);
  const evals = successLogs.map((log) => ({
    request_id: log.request_id,
    request_log_id: log.id,
    query: log.query,
    relevance_score: parseFloat(rand(3.2, 5).toFixed(1)),
    hallucination_score: parseFloat(rand(0, 1.5).toFixed(1)),
    context_score: parseFloat(rand(3, 5).toFixed(1)),
    overall_score: parseFloat(rand(3.5, 4.8).toFixed(1)),
    user_id: userId,
    created_at: log.created_at,
  }));

  if (evals.length > 0) {
    const { error: evalErr } = await supabase.from("evaluations").insert(evals);
    if (evalErr) throw evalErr;
  }

  return { logsCount: logs.length, evalsCount: evals.length };
}
