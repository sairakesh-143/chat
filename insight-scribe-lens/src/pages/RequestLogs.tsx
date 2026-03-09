import { useState } from "react";
import { useRequestLogs, useDeleteRequestLog } from "@/hooks/useRequestLogs";
import { cn } from "@/lib/utils";
import { Search, FileText, Trash2, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function RequestLogs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 20;

  const { data: allLogs = [], isLoading } = useRequestLogs();
  const deleteMutation = useDeleteRequestLog();

  const filtered = allLogs.filter(
    (r) => r.query.toLowerCase().includes(search.toLowerCase()) || r.request_id.includes(search)
  );
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Request deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Request Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">{allLogs.length} total requests traced</p>
        </div>
      </div>

      {allLogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No request logs"
          description="Add your first request log to start tracking your RAG pipeline. Each request captures query, response, tokens, cost, and latency."
        />
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search queries or IDs..."
              className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Query</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latency</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tokens</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.request_id}</td>
                      <td className="px-4 py-3 max-w-[240px] truncate text-foreground">{r.query}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{r.model}</span>
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs", r.latency > 2000 ? "text-chart-amber" : "text-chart-green")}>{r.latency}ms</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{r.total_tokens}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-foreground">${Number(r.cost).toFixed(4)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                          r.status === "success" ? "bg-chart-green/10 text-chart-green" : "bg-chart-red/10 text-chart-red"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", r.status === "success" ? "bg-chart-green" : "bg-chart-red")} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(r.id)} disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md disabled:opacity-40 hover:bg-secondary/80 transition-colors">Previous</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md disabled:opacity-40 hover:bg-secondary/80 transition-colors">Next</button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
