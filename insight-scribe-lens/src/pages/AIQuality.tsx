import { useEvaluations } from "@/hooks/useEvaluations";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-mono font-semibold text-popover-foreground">{payload[0].value}</p>
    </div>
  );
};

function scoreColor(score: number, max: number, inverted = false) {
  const ratio = score / max;
  if (inverted) return ratio < 0.3 ? "text-chart-green" : ratio < 0.6 ? "text-chart-amber" : "text-chart-red";
  return ratio > 0.8 ? "text-chart-green" : ratio > 0.6 ? "text-chart-amber" : "text-chart-red";
}

export default function AIQuality() {
  const { data: evaluations = [], isLoading } = useEvaluations();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  if (evaluations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Quality & Evaluation</h1>
            <p className="text-sm text-muted-foreground mt-1">Automated LLM evaluation scores</p>
          </div>
        </div>
        <EmptyState icon={Brain} title="No evaluations yet" description="Add request logs first, then create evaluations to track relevance, hallucination, and context usage scores." />
      </div>
    );
  }

  const avgRelevance = evaluations.reduce((s, e) => s + Number(e.relevance_score), 0) / evaluations.length;
  const avgHallucination = evaluations.reduce((s, e) => s + Number(e.hallucination_score), 0) / evaluations.length;
  const avgContext = evaluations.reduce((s, e) => s + Number(e.context_score), 0) / evaluations.length;
  const avgOverall = evaluations.reduce((s, e) => s + Number(e.overall_score), 0) / evaluations.length;

  const radarData = [
    { metric: "Relevance", value: avgRelevance, fullMark: 5 },
    { metric: "Context Usage", value: avgContext, fullMark: 5 },
    { metric: "Overall", value: avgOverall, fullMark: 5 },
    { metric: "Low Hallucination", value: 5 - avgHallucination, fullMark: 5 },
  ];

  const buckets = [0, 0, 0, 0, 0];
  evaluations.forEach((e) => { buckets[Math.min(Math.floor(Number(e.overall_score)) - 1, 4)]++; });
  const distData = buckets.map((count, i) => ({ range: `${i + 1}.0-${i + 1}.9`, count }));
  const distColors = ["hsl(var(--chart-red))", "hsl(var(--chart-amber))", "hsl(var(--chart-amber))", "hsl(var(--chart-green))", "hsl(var(--chart-green))"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Quality & Evaluation</h1>
          <p className="text-sm text-muted-foreground mt-1">Scores across {evaluations.length} evaluations</p>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {[
          { label: "Relevance", value: avgRelevance.toFixed(2), max: 5, desc: "Answer relevance to query" },
          { label: "Hallucination", value: avgHallucination.toFixed(2), max: 5, desc: "Lower is better", inverted: true },
          { label: "Context Usage", value: avgContext.toFixed(2), max: 5, desc: "Use of retrieved docs" },
          { label: "Overall Score", value: avgOverall.toFixed(2), max: 5, desc: "Composite quality score" },
        ].map((m) => (
          <motion.div key={m.label} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{m.label}</p>
              <p className={cn("text-3xl font-bold font-mono mt-1", scoreColor(parseFloat(m.value), m.max, m.inverted))}>
                {m.value}
                <span className="text-sm text-muted-foreground font-normal"> / {m.max}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Quality Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Radar dataKey="value" stroke="hsl(var(--chart-green))" fill="hsl(var(--chart-green))" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distData.map((_, i) => <Cell key={i} fill={distColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground">Recent Evaluations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Query</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Relevance</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hallucination</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Context</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.slice(0, 15).map((e, i) => (
                <tr key={`${e.request_id}-${i}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.request_id}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-foreground">{e.query}</td>
                  <td className={cn("px-4 py-3 text-center font-mono text-xs", scoreColor(Number(e.relevance_score), 5))}>{Number(e.relevance_score).toFixed(1)}</td>
                  <td className={cn("px-4 py-3 text-center font-mono text-xs", scoreColor(Number(e.hallucination_score), 5, true))}>{Number(e.hallucination_score).toFixed(1)}</td>
                  <td className={cn("px-4 py-3 text-center font-mono text-xs", scoreColor(Number(e.context_score), 5))}>{Number(e.context_score).toFixed(1)}</td>
                  <td className={cn("px-4 py-3 text-center font-mono text-xs font-semibold", scoreColor(Number(e.overall_score), 5))}>{Number(e.overall_score).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
