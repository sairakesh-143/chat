import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useRequestLogs } from "@/hooks/useRequestLogs";
import { useAddEvaluation } from "@/hooks/useEvaluations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  onAdded?: () => void;
}

export default function AddEvaluationDialog({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [requestLogId, setRequestLogId] = useState("");
  const [relevance, setRelevance] = useState("");
  const [hallucination, setHallucination] = useState("");
  const [context, setContext] = useState("");
  const { data: logs = [] } = useRequestLogs();
  const mutation = useAddEvaluation();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!requestLogId || !user) {
      toast({ title: "Select a request", variant: "destructive" });
      return;
    }

    const rel = parseFloat(relevance) || 0;
    const hal = parseFloat(hallucination) || 0;
    const ctx = parseFloat(context) || 0;
    const overall = parseFloat(((rel + ctx + (5 - hal)) / 3).toFixed(1));
    const selectedLog = logs.find((l) => l.id === requestLogId);

    try {
      await mutation.mutateAsync({
        user_id: user.id,
        request_id: selectedLog?.request_id || "",
        request_log_id: requestLogId,
        query: selectedLog?.query || "",
        relevance_score: Math.min(5, Math.max(0, rel)),
        hallucination_score: Math.min(5, Math.max(0, hal)),
        context_score: Math.min(5, Math.max(0, ctx)),
        overall_score: Math.min(5, Math.max(0, overall)),
      });
      toast({ title: "Evaluation added" });
      setRequestLogId(""); setRelevance(""); setHallucination(""); setContext("");
      setOpen(false);
      onAdded?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Evaluation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Evaluation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Request</Label>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">No requests yet. Add a request first.</p>
            ) : (
              <Select value={requestLogId} onValueChange={setRequestLogId}>
                <SelectTrigger><SelectValue placeholder="Select a request..." /></SelectTrigger>
                <SelectContent>
                  {logs.slice(0, 50).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.request_id} — {l.query.slice(0, 40)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Relevance (0-5)</Label>
              <Input type="number" step="0.1" min="0" max="5" value={relevance} onChange={(e) => setRelevance(e.target.value)} placeholder="4.0" />
            </div>
            <div>
              <Label>Hallucination (0-5)</Label>
              <Input type="number" step="0.1" min="0" max="5" value={hallucination} onChange={(e) => setHallucination(e.target.value)} placeholder="0.5" />
            </div>
            <div>
              <Label>Context (0-5)</Label>
              <Input type="number" step="0.1" min="0" max="5" value={context} onChange={(e) => setContext(e.target.value)} placeholder="4.0" />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={logs.length === 0 || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Evaluation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
