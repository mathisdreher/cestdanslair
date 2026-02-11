"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartContainer } from "@/components/Cards";

const TAG_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e",
  "#06b6d4", "#f43f5e", "#a855f7", "#14b8a6", "#fb923c",
  "#84cc16", "#e879f9", "#38bdf8", "#fbbf24", "#4ade80",
  "#f97316", "#6366f1", "#d946ef", "#0ea5e9", "#10b981",
];

interface TrendItem {
  tag: string;
  lastCount: number;
  prevCount: number;
  change: number;
  totalCount: number;
}

interface HeatmapRow {
  tag: string;
  values: { year: number; count: number }[];
}

interface TopicsData {
  years: number[];
  selectedYear: number | null;
  totalVideos: number;
  topTags: { tag: string; count: number; views: number }[];
  evolution: Record<string, number | string>[];
  topTagNames: string[];
  heatmap: HeatmapRow[];
  trending: { rising: TrendItem[]; falling: TrendItem[]; comparedYears: number[] };
}

export default function TopicsPage() {
  const [data, setData] = useState<TopicsData | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hiddenTags, setHiddenTags] = useState<Set<string>>(new Set());
  const [tagSortBy, setTagSortBy] = useState<"count" | "views" | "avg">("count");

  useEffect(() => {
    let params = "";
    if (selectedYear) {
      params = `?year=${selectedYear}`;
    } else if (selectedYears.size > 0) {
      params = `?years=${Array.from(selectedYears).join(",")}`;
    }
    setLoading(true);
    fetch(`/api/topics${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedYear, selectedYears]);

  const toggleTag = (tag: string) => {
    setHiddenTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const showOnlyTag = (tag: string) => {
    if (!data) return;
    const allOthers = new Set(data.topTagNames.filter((t) => t !== tag));
    setHiddenTags(allOthers);
  };

  const showAllTags = () => setHiddenTags(new Set());

  const sortedTopTags = useMemo(() => {
    if (!data) return [];
    return [...data.topTags].sort((a, b) => {
      if (tagSortBy === "views") return b.views - a.views;
      if (tagSortBy === "avg") return (b.views / b.count) - (a.views / a.count);
      return b.count - a.count;
    });
  }, [data, tagSortBy]);

  // Heatmap helpers
  const maxHeatmapValue = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.heatmap.flatMap((r) => r.values.map((v) => v.count)), 1);
  }, [data]);

  const heatColor = (count: number) => {
    if (count === 0) return "rgba(59, 130, 246, 0.05)";
    const intensity = Math.min(count / maxHeatmapValue, 1);
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(59, 130, 246, ${alpha})`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg" style={{ color: "var(--muted)" }}>Loading topics...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Topic Analysis</h2>
          <p style={{ color: "var(--muted)" }}>
            {selectedYear
              ? `Topics in ${selectedYear}`
              : selectedYears.size > 0
                ? `Comparing ${Array.from(selectedYears).sort().join(", ")}`
                : "All-time topic analysis"} — {data.totalVideos} episodes
          </p>
        </div>
      </div>

      {/* Year selection pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs py-1" style={{ color: "var(--muted)" }}>Years:</span>
        <button
          onClick={() => { setSelectedYear(""); setSelectedYears(new Set()); }}
          className="px-3 py-1.5 rounded text-xs font-medium border transition-all"
          style={{
            background: selectedYear === "" && selectedYears.size === 0 ? "var(--accent)" : "transparent",
            borderColor: selectedYear === "" && selectedYears.size === 0 ? "var(--accent)" : "var(--card-border)",
            color: selectedYear === "" && selectedYears.size === 0 ? "white" : "var(--muted)",
          }}
        >
          All
        </button>
        {data.years.map((y) => (
          <button
            key={y}
            onClick={() => {
              setSelectedYear("");
              setSelectedYears((prev) => {
                const next = new Set(prev);
                if (next.has(y)) next.delete(y);
                else next.add(y);
                return next;
              });
            }}
            className="px-3 py-1.5 rounded text-xs font-medium border transition-all"
            style={{
              background: selectedYears.has(y) || selectedYear === String(y) ? "var(--accent)" : "transparent",
              borderColor: selectedYears.has(y) || selectedYear === String(y) ? "var(--accent)" : "var(--card-border)",
              color: selectedYears.has(y) || selectedYear === String(y) ? "white" : "var(--muted)",
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Trending topics */}
      {data.trending.comparedYears[0] && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="📈 Rising Topics"
            subtitle={`Growing from ${data.trending.comparedYears[0]} to ${data.trending.comparedYears[1]}`}
          >
            {data.trending.rising.length === 0 ? (
              <p className="text-sm py-4" style={{ color: "var(--muted)" }}>No significantly rising topics</p>
            ) : (
              <div className="space-y-2">
                {data.trending.rising.map((t) => (
                  <div key={t.tag} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-40 truncate">{t.tag}</span>
                    <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
                      <div
                        className="h-full rounded-full flex items-center px-2"
                        style={{
                          width: `${Math.min(100, Math.abs(t.change))}%`,
                          background: "rgba(34, 197, 94, 0.3)",
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: "#22c55e" }}>
                          +{t.change}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
                      {t.prevCount} → {t.lastCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ChartContainer>

          <ChartContainer
            title="📉 Declining Topics"
            subtitle={`Falling from ${data.trending.comparedYears[0]} to ${data.trending.comparedYears[1]}`}
          >
            {data.trending.falling.length === 0 ? (
              <p className="text-sm py-4" style={{ color: "var(--muted)" }}>No significantly declining topics</p>
            ) : (
              <div className="space-y-2">
                {data.trending.falling.map((t) => (
                  <div key={t.tag} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-40 truncate">{t.tag}</span>
                    <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                      <div
                        className="h-full rounded-full flex items-center px-2"
                        style={{
                          width: `${Math.min(100, Math.abs(t.change))}%`,
                          background: "rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: "#ef4444" }}>
                          {t.change}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
                      {t.prevCount} → {t.lastCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ChartContainer>
        </div>
      )}

      {/* Topic evolution chart with interactive legend */}
      <ChartContainer title="Topic Evolution" subtitle="Click legend items to show/hide. Double-click to isolate a single topic.">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            onClick={showAllTags}
            className="px-3 py-1 rounded text-xs border transition-all hover:text-white"
            style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            Show all
          </button>
          {data.topTagNames.map((tag, idx) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              onDoubleClick={() => showOnlyTag(tag)}
              className="px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
              style={{
                background: hiddenTags.has(tag) ? "transparent" : `${TAG_COLORS[idx % TAG_COLORS.length]}22`,
                color: hiddenTags.has(tag) ? "var(--card-border)" : TAG_COLORS[idx % TAG_COLORS.length],
                borderWidth: 1,
                borderColor: hiddenTags.has(tag) ? "var(--card-border)" : TAG_COLORS[idx % TAG_COLORS.length],
                opacity: hiddenTags.has(tag) ? 0.4 : 1,
                textDecoration: hiddenTags.has(tag) ? "line-through" : "none",
              }}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: TAG_COLORS[idx % TAG_COLORS.length] }} />
              {tag}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={450}>
          <AreaChart data={data.evolution}>
            <defs>
              {data.topTagNames.map((tag, idx) => (
                <linearGradient key={tag} id={`topic-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TAG_COLORS[idx % TAG_COLORS.length]} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={TAG_COLORS[idx % TAG_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            {data.topTagNames.map((tag, idx) => (
              <Area
                key={tag}
                type="monotone"
                dataKey={tag}
                name={tag}
                stroke={TAG_COLORS[idx % TAG_COLORS.length]}
                fill={`url(#topic-grad-${idx})`}
                strokeWidth={2}
                dot={false}
                hide={hiddenTags.has(tag)}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Heatmap */}
      <ChartContainer title="Topic Heatmap" subtitle="Intensity of each topic per year — darker = more episodes">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 sticky left-0" style={{ background: "var(--card-bg)", color: "var(--muted)" }}>
                  Topic
                </th>
                {data.years.map((y) => (
                  <th key={y} className="text-center py-2 px-1 min-w-[50px]" style={{ color: "var(--muted)" }}>
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.heatmap.map((row) => (
                <tr key={row.tag} className="border-t" style={{ borderColor: "var(--card-border)" }}>
                  <td className="py-1.5 px-2 font-medium sticky left-0 whitespace-nowrap" style={{ background: "var(--card-bg)" }}>
                    {row.tag}
                  </td>
                  {row.values.map((cell) => (
                    <td key={cell.year} className="py-1.5 px-1 text-center">
                      <div
                        className="rounded px-1 py-0.5 text-xs font-medium mx-auto"
                        style={{
                          background: heatColor(cell.count),
                          color: cell.count > maxHeatmapValue * 0.5 ? "white" : cell.count > 0 ? "var(--accent-light)" : "var(--card-border)",
                          minWidth: "32px",
                        }}
                      >
                        {cell.count || "·"}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Top tags bar chart */}
      <ChartContainer title="Top Tags Ranking" subtitle="Most frequently used tags">
        <div className="flex gap-2 mb-4">
          {(["count", "views", "avg"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTagSortBy(mode)}
              className="px-3 py-1.5 rounded text-xs font-medium border"
              style={{
                background: tagSortBy === mode ? "var(--accent)" : "transparent",
                borderColor: tagSortBy === mode ? "var(--accent)" : "var(--card-border)",
                color: tagSortBy === mode ? "white" : "var(--muted)",
              }}
            >
              {mode === "count" ? "By Episodes" : mode === "views" ? "By Total Views" : "By Avg Views"}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={600}>
          <BarChart data={sortedTopTags} layout="vertical" margin={{ left: 160 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={tagSortBy !== "count" ? (v) => `${(v / 1e3).toFixed(0)}k` : undefined}
            />
            <YAxis type="category" dataKey="tag" stroke="#94a3b8" fontSize={11} width={150} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value) => [Number(value ?? 0).toLocaleString("fr-FR")]}
            />
            <Bar
              dataKey={tagSortBy === "count" ? "count" : tagSortBy === "views" ? "views" : "count"}
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              name={tagSortBy === "count" ? "Episodes" : tagSortBy === "views" ? "Views" : "Avg Views"}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Tags table */}
      <ChartContainer title="Full Tag Details" subtitle="Complete breakdown with all metrics">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ background: "var(--card-bg)" }}>
              <tr style={{ color: "var(--muted)" }}>
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-2">Tag</th>
                <th className="text-right py-3 px-2 cursor-pointer" onClick={() => setTagSortBy("count")}>
                  Episodes {tagSortBy === "count" && "↓"}
                </th>
                <th className="text-right py-3 px-2 cursor-pointer" onClick={() => setTagSortBy("views")}>
                  Total Views {tagSortBy === "views" && "↓"}
                </th>
                <th className="text-right py-3 px-2 cursor-pointer" onClick={() => setTagSortBy("avg")}>
                  Avg Views {tagSortBy === "avg" && "↓"}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTopTags.map((t, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--card-border)" }}>
                  <td className="py-2 px-2" style={{ color: "var(--muted)" }}>{i + 1}</td>
                  <td className="py-2 px-2 font-medium">{t.tag}</td>
                  <td className="py-2 px-2 text-right">{t.count}</td>
                  <td className="py-2 px-2 text-right">{t.views.toLocaleString("fr-FR")}</td>
                  <td className="py-2 px-2 text-right" style={{ color: "var(--accent-light)" }}>
                    {Math.round(t.views / t.count).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
}
