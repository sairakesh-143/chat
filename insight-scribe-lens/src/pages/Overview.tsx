import { Activity, DollarSign, Zap, AlertTriangle, Hash, Brain, Download } from "lucide-react";
import StatCard from "@/components/StatCard";
import AddRequestDialog from "@/components/AddRequestDialog";
import AddEvaluationDialog from "@/components/AddEvaluationDialog";
import EmptyState from "@/components/EmptyState";
import { useRequestLogs } from "@/hooks/useRequestLogs";
import { useEvaluations } from "@/hooks/useEvaluations";
import {
  computeOverviewStats, computeLatencyTimeSeries, computeRequestsPerDay, computeCostPerDay, computeLatencyMetrics,
} from "@/lib/dataStore";
import { exportRequestLogs, exportEvaluations } from "@/lib/csvExport";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-mono font-semibold text-popover-foreground">{payload[0].value}</p>
    </div>
  );
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Overview() {
  const { data: logs = [], isLoading: logsLoading } = useRequestLogs();
  const { data: evals = [], isLoading: evalsLoading } = useEvaluations();

  const isLoading = logsLoading || evalsLoading;

  const stats = computeOverviewStats(logs, evals);
  const metrics = computeLatencyMetrics(logs);
  const latencyData = computeLatencyTimeSeries(logs);
  const requestsData = computeRequestsPerDay(logs);
  const costData = computeCostPerDay(logs);
  const hasData = logs.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hasData ? "Real-time RAG pipeline monitoring" : "Add your first request to get started"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasData && (
            <>
              <Button variant="outline" size="sm" onClick={() => exportRequestLogs(logs)}>
                <Download className="h-4 w-4 mr-1.5" /> Logs CSV
              </Button>
              {evals.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => exportEvaluations(evals)}>
                  <Download className="h-4 w-4 mr-1.5" /> Evals CSV
                </Button>
              )}
            </>
          )}
          <AddEvaluationDialog />
          <AddRequestDialog />
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={Hash}
          title="No data yet"
          description="Start by adding request logs using the button above. Your dashboard will populate with real metrics as you add data."
        />
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item}><StatCard title="Total Requests" value={stats.totalRequests.toLocaleString()} icon={Hash} variant="blue" /></motion.div>
            <motion.div variants={item}><StatCard title="Avg Latency" value={`${stats.avgLatency}ms`} icon={Zap} variant="green" subtitle={`p50: ${metrics.p50}ms`} /></motion.div>
            <motion.div variants={item}><StatCard title="P95 Latency" value={`${stats.p95Latency}ms`} icon={Activity} variant="amber" subtitle={`p99: ${metrics.p99}ms`} /></motion.div>
            <motion.div variants={item}><StatCard title="Total Cost" value={`$${stats.totalCost}`} icon={DollarSign} variant="default" /></motion.div>
            <motion.div variants={item}><StatCard title="Error Rate" value={`${stats.errorRate}%`} icon={AlertTriangle} variant="red" /></motion.div>
            <motion.div variants={item}><StatCard title="Avg Eval Score" value={stats.avgEvalScore || "—"} icon={Brain} variant="green" subtitle="out of 5.0" /></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="chart-card">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Avg Latency Over Time</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-green))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-green))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-green))" fill="url(#latGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="chart-card">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Requests Per Day</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={requestsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-blue))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="chart-card lg:col-span-2">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Cost Per Day ($)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={costData}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-amber))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-amber))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-amber))" fill="url(#costGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
