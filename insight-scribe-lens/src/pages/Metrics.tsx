import { useRequestLogs } from "@/hooks/useRequestLogs";
import { computeLatencyMetrics, computeLatencyTimeSeries, computeRequestsPerDay } from "@/lib/dataStore";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import AddRequestDialog from "@/components/AddRequestDialog";
import { Timer, TrendingUp, Gauge, Clock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
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

export default function Metrics() {
  const { data: logs = [], isLoading } = useRequestLogs();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  const metrics = computeLatencyMetrics(logs);
  const latencyData = computeLatencyTimeSeries(logs);
  const reqData = computeRequestsPerDay(logs);

  if (logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Latency Metrics</h1>
            <p className="text-sm text-muted-foreground mt-1">Performance percentiles and trends</p>
          </div>
          <AddRequestDialog />
        </div>
        <EmptyState icon={Activity} title="No metrics yet" description="Add request logs to see latency metrics, token distribution, and model usage breakdowns." />
      </div>
    );
  }

  const tokenData = [
    { name: "Input Tokens", value: logs.reduce((s, r) => s + r.input_tokens, 0) },
    { name: "Output Tokens", value: logs.reduce((s, r) => s + r.output_tokens, 0) },
  ];
  const pieColors = ["hsl(var(--chart-blue))", "hsl(var(--chart-purple))"];

  const modelCounts: Record<string, number> = {};
  logs.forEach((r) => { modelCounts[r.model] = (modelCounts[r.model] || 0) + 1; });
  const modelData = Object.entries(modelCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Latency Metrics</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance percentiles and trends</p>
        </div>
        <AddRequestDialog />
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {[
          { title: "Average", value: `${metrics.avg}ms`, icon: Timer, variant: "blue" as const },
          { title: "P50", value: `${metrics.p50}ms`, icon: Gauge, variant: "green" as const },
          { title: "P95", value: `${metrics.p95}ms`, icon: TrendingUp, variant: "amber" as const },
          { title: "P99", value: `${metrics.p99}ms`, icon: Clock, variant: "red" as const },
        ].map((s) => (
          <motion.div key={s.title} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Latency Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-green))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Daily Request Volume</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reqData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="hsl(var(--chart-blue))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Token Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={tokenData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" stroke="none">
                {tokenData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {tokenData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[i] }} />
                {d.name}: {d.value.toLocaleString()}
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Model Usage</h3>
          <div className="space-y-4 mt-8">
            {modelData.map((m) => {
              const pct = Math.round((m.value / logs.length) * 100);
              return (
                <div key={m.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-mono text-foreground">{m.name}</span>
                    <span className="text-muted-foreground">{m.value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
