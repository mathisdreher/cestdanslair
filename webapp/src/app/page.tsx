"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatCard, ChartContainer } from "@/components/Cards";

interface DashboardData {
  stats: {
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgViews: number;
  };
  monthly: { month: string; count: number; views: number }[];
  yearly: { year: number; count: number; views: number; likes: number; comments: number }[];
  durationDistribution: { range: string; count: number }[];
  topVideos: { title: string; views: number; likes: number; published_at: string; url: string; thumbnail_url: string }[];
  yearlyEngagement: { year: number; engagement: number }[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg" style={{ color: "var(--muted)" }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, yearly, durationDistribution, topVideos, yearlyEngagement } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p style={{ color: "var(--muted)" }}>Overview of the C dans l&apos;air YouTube channel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Videos" value={stats.totalVideos} icon="🎬" subtitle="Full episodes (30+ min)" />
        <StatCard title="Total Views" value={stats.totalViews.toLocaleString("fr-FR")} icon="👁️" />
        <StatCard title="Total Likes" value={stats.totalLikes.toLocaleString("fr-FR")} icon="👍" />
        <StatCard title="Avg Views/Video" value={stats.avgViews.toLocaleString("fr-FR")} icon="📈" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Videos per Year" subtitle="Number of full episodes published">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Videos" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Views per Year" subtitle="Total views by year">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#e2e8f0" }}
                formatter={(value) => [Number(value ?? 0).toLocaleString("fr-FR"), "Views"]}
              />
              <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Engagement Rate" subtitle="(Likes + Comments) / Views over time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyEngagement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v.toFixed(1)}%`} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#e2e8f0" }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, "Engagement"]}
              />
              <Line type="monotone" dataKey="engagement" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Duration Distribution" subtitle="Episode length breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={durationDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="count"
                nameKey="range"
                label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
              >
                {durationDistribution.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <ChartContainer title="Top 10 Most Viewed Videos" subtitle="All-time most viewed episodes">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-2">Title</th>
                <th className="text-right py-3 px-2">Views</th>
                <th className="text-right py-3 px-2">Likes</th>
                <th className="text-right py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {topVideos.map((v, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--card-border)" }}>
                  <td className="py-3 px-2 font-bold" style={{ color: "var(--accent-light)" }}>{i + 1}</td>
                  <td className="py-3 px-2">
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--accent-light)" }}>
                      {v.title.length > 70 ? v.title.slice(0, 70) + "..." : v.title}
                    </a>
                  </td>
                  <td className="py-3 px-2 text-right">{v.views.toLocaleString("fr-FR")}</td>
                  <td className="py-3 px-2 text-right">{v.likes.toLocaleString("fr-FR")}</td>
                  <td className="py-3 px-2 text-right" style={{ color: "var(--muted)" }}>
                    {new Date(v.published_at).toLocaleDateString("fr-FR")}
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
