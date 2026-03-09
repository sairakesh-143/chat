import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { generateRequestId, generateTraceId } from "@/lib/dataStore";
import { useAddRequestLog } from "@/hooks/useRequestLogs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  onAdded?: () => void;
}

const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.000003, output: 0.000015 },
  "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
  "gpt-3.5-turbo": { input: 0.0000005, output: 0.0000015 },
  "claude-3-sonnet": { input: 0.000003, output: 0.000015 },
  "claude-3-haiku": { input: 0.00000025, output: 0.00000125 },
};

export default function AddRequestDialog({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [inputTokens, setInputTokens] = useState("");
  const [outputTokens, setOutputTokens] = useState("");
  const [latency, setLatency] = useState("");
  const [status, setStatus] = useState<"success" | "error">("success");
  const mutation = useAddRequestLog();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!query.trim()) {
      toast({ title: "Query is required", variant: "destructive" });
      return;
    }
    if (!user) return;

    const inTok = parseInt(inputTokens) || 0;
    const outTok = parseInt(outputTokens) || 0;
    const prices = MODEL_PRICES[model] || MODEL_PRICES["gpt-4o"];
    const cost = inTok * prices.input + outTok * prices.output;

    try {
      await mutation.mutateAsync({
        user_id: user.id,
        request_id: generateRequestId(),
        query: query.trim(),
        response: response.trim() || (status === "error" ? "Error: Request failed" : "No response recorded"),
        input_tokens: inTok,
        output_tokens: outTok,
        total_tokens: inTok + outTok,
        cost: parseFloat(cost.toFixed(6)),
        latency: parseInt(latency) || 0,
        model,
        status,
        trace_id: generateTraceId(),
      });
      toast({ title: "Request log added" });
      setQuery(""); setResponse(""); setInputTokens(""); setOutputTokens(""); setLatency(""); setStatus("success");
      setOpen(false);
      onAdded?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Query *</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What was the user query?" />
          </div>
          <div>
            <Label>Response</Label>
            <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="LLM response text..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(MODEL_PRICES).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "success" | "error")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Input Tokens</Label>
              <Input type="number" value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Output Tokens</Label>
              <Input type="number" value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Latency (ms)</Label>
              <Input type="number" value={latency} onChange={(e) => setLatency(e.target.value)} placeholder="0" />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Request Log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
