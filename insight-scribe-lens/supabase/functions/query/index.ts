import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aiApiKey = Deno.env.get("AI_API_KEY")!;

    // Optional auth - get user if logged in, otherwise use nil UUID for anonymous
    let userId = "00000000-0000-0000-0000-000000000000";
    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader) {
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) userId = user.id;
    }

    const { question, history } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "Missing question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();

    const messages = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. You help users with questions, analysis, writing, coding, and more. Be concise, helpful, and friendly.",
      },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: question },
    ];

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
    const tokensUsed = aiData.usage?.total_tokens ?? 0;
    const inputTokens = aiData.usage?.prompt_tokens ?? 0;
    const outputTokens = aiData.usage?.completion_tokens ?? 0;

    const latency = Date.now() - startTime;
    const cost = parseFloat((tokensUsed * 0.000002).toFixed(6));

    // Log request using service role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;

    await adminClient.from("request_logs").insert({
      request_id: requestId,
      query: question,
      response: answer,
      model: "gemini-2.5-flash",
      status: "success",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: tokensUsed,
      cost,
      latency,
      user_id: userId,
    });

    return new Response(
      JSON.stringify({ answer, latency, tokens_used: tokensUsed, cost, request_id: requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
