import { Loader2, TrendingUp, Award, BarChart3, PieChart as PieChartIcon, BookOpen } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useOverviewAnalytics } from "../hooks/useAnalytics";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#6366f1"];

export function AnalyticsView() {
  const { data, isLoading, isError } = useOverviewAnalytics();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-sm font-medium text-muted-foreground">Generating institutional analytics...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
        Failed to load analytics data. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Institutional Analytics Engine</h2>
        <p className="text-xs text-muted-foreground">PostgreSQL aggregate research metrics, publication trends, department comparisons, and citation statistics.</p>
      </div>

      {/* Grid Charts Section 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Publication & Citation Trend over Years */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Publication & Citation Trend</h3>
                <p className="text-[10px] text-muted-foreground">Year-over-year institutional research output</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.publicationTrend}>
                <defs>
                  <linearGradient id="colorPubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="publications" stroke="#2563eb" fillOpacity={1} fill="url(#colorPubs)" name="Publications" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Publications Breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Department Research Output</h3>
                <p className="text-[10px] text-muted-foreground">Total papers published per academic department</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="publicationsCount" fill="#2563eb" radius={[6, 6, 0, 0]} name="Publications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Section 2 */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Journal vs Conference Pie */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <PieChartIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Venue Distribution</h3>
              <p className="text-[10px] text-muted-foreground">Journal vs Conference publications</p>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.typeDistribution}
                  dataKey="count"
                  nameKey="venue_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label
                >
                  {data.typeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Research Areas */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Top Research Areas</h3>
              <p className="text-[10px] text-muted-foreground">Most active institutional domains</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.topResearchAreas.slice(0, 5).map((ra, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                <span className="font-medium text-foreground truncate max-w-[180px]">{ra.area}</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {ra.count} Papers
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty Productivity Leaderboard */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Award className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Faculty Leaderboard</h3>
              <p className="text-[10px] text-muted-foreground">Top publishing researchers</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.facultyLeaderboard.slice(0, 5).map((fac, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                <div>
                  <p className="font-medium text-foreground">{fac.name}</p>
                  <p className="text-[10px] text-muted-foreground">{fac.departmentCode} • {fac.designation}</p>
                </div>
                <Badge className="bg-primary/10 text-primary font-mono text-[10px]">
                  {fac.totalPublications} Papers
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
