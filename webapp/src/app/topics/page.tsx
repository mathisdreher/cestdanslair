"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartContainer } from "@/components/Cards";

interface TopicsData {
  years: number[];
  selectedYear: number | null;
  totalVideos: number;
  topTags: { tag: string; count: number; views: number }[];
  evolution: Record<string, number | string>[];
  topTagNames: string[];
}

const TAG_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e",
  "#06b6d4", "#f43f5e", "#a855f7", "#14b8a6", "#fb923c",
  "#84cc16", "#e879f9", "#38bdf8", "#fbbf24", "#4ade80",
];

export default function TopicsPage() {
  const [data, setData] = useState<TopicsData | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = selectedYear ? `?year=${selectedYear}` : "";
    setLoading(true);
    fetch(`/api/topics${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedYear]);

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
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Topics by Year</h2>
          <p style={{ color: "var(--muted)" }}>
            Most frequent tags{selectedYear ? ` in ${selectedYear}` : " across all years"} ({data.totalVideos} videos)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm" style={{ color: "var(--muted)" }}>Filter by year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
          >
            <option value="">All years</option>
            {data.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top tags bar chart */}
      <ChartContainer title="Top 30 Tags" subtitle="Most used tags by number of episodes">
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={data.topTags} layout="vertical" margin={{ left: 150 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
            <YAxis type="category" dataKey="tag" stroke="#94a3b8" fontSize={11} width={140} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value, name) => [
                name === "count" ? value : Number(value ?? 0).toLocaleString("fr-FR"),
                name === "count" ? "Episodes" : "Views",
              ]}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="count" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Tag evolution over time */}
      <ChartContainer title="Topic Evolution" subtitle="How the top 15 tags evolved over the years">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.evolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
            />
            {data.topTagNames.map((tag, idx) => (
              <Line
                key={tag}
                type="monotone"
                dataKey={tag}
                stroke={TAG_COLORS[idx % TAG_COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={tag}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Tags table */}
      <ChartContainer title="Tag Details" subtitle="Complete breakdown with view counts">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ background: "var(--card-bg)" }}>
              <tr style={{ color: "var(--muted)" }}>
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-2">Tag</th>
                <th className="text-right py-3 px-2">Episodes</th>
                <th className="text-right py-3 px-2">Total Views</th>
                <th className="text-right py-3 px-2">Avg Views</th>
              </tr>
            </thead>
            <tbody>
              {data.topTags.map((t, i) => (
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
