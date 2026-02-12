"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { StatCard, ChartContainer } from "@/components/Cards";
import dynamic from "next/dynamic";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

interface DashboardData {
  stats: {
    totalVideos: number; totalViews: number; totalLikes: number;
    totalComments: number; avgViews: number; totalHours: number;
    firstDate: string; lastDate: string;
  };
  monthly: { month: string; count: number; views: number }[];
  yearly: {
    year: number; count: number; views: number; likes: number;
    comments: number; avgViews: number; engagement: number; hoursOfContent: number;
  }[];
  durationDistribution: { range: string; count: number }[];
  topVideos: { title: string; views: number; likes: number; comments: number; published_at: string; url: string }[];
  bestMonths: { month: string; views: number; count: number }[];
  topTags: { tag: string; count: number }[];
  geoData: { region: string; count: number; iso: string; searchTerm: string; percentage: string }[];
}

const COLORS = ["#6366f1", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#22d3ee", "#f87171", "#a3e635"];
const PIE_COLORS = ["#6366f1", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];
const formatNum = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n.toString();

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [hiddenYearly, setHiddenYearly] = useState<Set<string>>(new Set());
  const [hiddenMonthly, setHiddenMonthly] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const toggleSeries = useCallback((set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setFn(next);
  }, []);

  if (!data) return <div className="p-8 text-muted">Chargement...</div>;

  const { stats, monthly, yearly, durationDistribution, topVideos, bestMonths, topTags, geoData } = data;
  const firstYear = new Date(stats.firstDate).getFullYear();
  const lastYear = new Date(stats.lastDate).getFullYear();

  const yearlySeries = [
    { key: "avgViews", name: "Vues moyennes", color: COLORS[1] },
    { key: "engagement", name: "Engagement %", color: COLORS[2] },
  ];

  const monthlySeries = [
    { key: "views", name: "Vues totales", color: COLORS[3] },
  ];

  const CustomLegend = ({ series, hidden, toggle }: { series: typeof yearlySeries; hidden: Set<string>; toggle: (k: string) => void }) => (
    <div className="flex flex-wrap gap-3 justify-center mt-2">
      {series.map((s) => (
        <button
          key={s.key}
          onClick={() => toggle(s.key)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-all"
          style={{ opacity: hidden.has(s.key) ? 0.35 : 1 }}
        >
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
          <span className={hidden.has(s.key) ? "line-through text-muted" : "text-white"}>{s.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">C dans l&apos;air — Tableau de bord</h1>
        <p className="text-muted mt-1">{firstYear} – 2025 · {stats.totalVideos.toLocaleString("fr")} épisodes analysés</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Épisodes" value={stats.totalVideos.toLocaleString("fr")} />
        <StatCard title="Vues totales" value={formatNum(stats.totalViews)} />
        <StatCard title="Vues moyennes" value={formatNum(stats.avgViews)} />
        <StatCard title="Heures de contenu" value={stats.totalHours.toLocaleString("fr") + "h"} />
        <StatCard title="Likes totaux" value={formatNum(stats.totalLikes)} />
        <StatCard title="Commentaires" value={formatNum(stats.totalComments)} />
        <StatCard title="Premier épisode" value={new Date(stats.firstDate).toLocaleDateString("fr")} />
        <StatCard title="Dernier épisode" value={new Date(stats.lastDate).toLocaleDateString("fr")} />
      </div>

      {/* Yearly evolution chart (multi-axis) */}
      <ChartContainer title="Évolution annuelle">
        <CustomLegend series={yearlySeries} hidden={hiddenYearly} toggle={(k) => toggleSeries(hiddenYearly, setHiddenYearly, k)} />
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={yearly}>
            <defs>
              {yearlySeries.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" />
            <XAxis dataKey="year" stroke="#8896b3" />
            <YAxis stroke="#8896b3" tickFormatter={(v) => formatNum(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: "#141d2f", border: "1px solid #1e3050", borderRadius: 8 }}
              labelStyle={{ color: "#f8fafc" }}
              formatter={(value, name) => [formatNum(Number(value ?? 0)), String(name)]}
            />
            {yearlySeries.map((s) => (
              !hiddenYearly.has(s.key) && (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
                  stroke={s.color} fill={`url(#grad-${s.key})`} strokeWidth={2} dot={{ r: 3 }} />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Monthly timeline */}
      <ChartContainer title="Timeline mensuelle">
        <CustomLegend series={monthlySeries} hidden={hiddenMonthly} toggle={(k) => toggleSeries(hiddenMonthly, setHiddenMonthly, k)} />
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={monthly}>
            <defs>
              {monthlySeries.map((s) => (
                <linearGradient key={s.key} id={`gradm-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" />
            <XAxis dataKey="month" stroke="#8896b3" tickFormatter={(v) => v.slice(0, 7)} interval={11} />
            <YAxis stroke="#8896b3" tickFormatter={(v) => formatNum(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: "#141d2f", border: "1px solid #1e3050", borderRadius: 8 }}
              labelStyle={{ color: "#f8fafc" }}
              formatter={(value, name) => [formatNum(Number(value ?? 0)), String(name)]}
            />
            {monthlySeries.map((s) => (
              !hiddenMonthly.has(s.key) && (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
                  stroke={s.color} fill={`url(#gradm-${s.key})`} strokeWidth={1.5} dot={false} />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Duration distribution */}
        <ChartContainer title="Durée des épisodes">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={durationDistribution} dataKey="count" nameKey="range" cx="50%" cy="50%"
                innerRadius={60} outerRadius={100} paddingAngle={4}
                label={({ name, percent }: { name?: string; percent?: number }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {durationDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#141d2f", border: "1px solid #1e3050", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top tags */}
        <ChartContainer title="Tags les plus fréquents">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topTags} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" />
              <XAxis type="number" stroke="#8896b3" />
              <YAxis dataKey="tag" type="category" width={120} stroke="#8896b3" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "#141d2f", border: "1px solid #1e3050", borderRadius: 8 }} />
              <Bar dataKey="count" name="Occurrences" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Engagement overview - hybrid table & chart */}
      <ChartContainer title="📊 Engagement par année" subtitle="Ratio likes + commentaires / vues">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mini chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" />
              <XAxis dataKey="year" stroke="#8896b3" fontSize={12} />
              <YAxis stroke="#8896b3" fontSize={12} tickFormatter={(v) => v.toFixed(2) + "%"} />
              <Tooltip
                contentStyle={{ backgroundColor: "#141d2f", border: "1px solid #1e3050", borderRadius: 8 }}
                formatter={(value) => [Number(value ?? 0).toFixed(2) + "%", "Engagement"]}
              />
              <Bar dataKey="engagement" fill="#f472b6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Table */}
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--card-bg)]">
                <tr className="text-left text-muted border-b border-[var(--card-border)]">
                  <th className="py-2 px-2">Année</th>
                  <th className="py-2 px-2 text-right">Épisodes</th>
                  <th className="py-2 px-2 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {yearly.map((y) => (
                  <tr key={y.year} className="border-b border-[var(--card-border)]">
                    <td className="py-2 px-2 font-medium">{y.year}</td>
                    <td className="py-2 px-2 text-right text-muted">{y.count}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="font-bold" style={{ color: "#f472b6" }}>{y.engagement.toFixed(2)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartContainer>

      {/* Interactive world map */}
      <ChartContainer title="🌍 Couverture géographique" subtitle="Pays et régions les plus mentionnés — cliquez pour explorer">
        <WorldMap geoData={geoData} />
      </ChartContainer>

      {/* Best months */}
      <ChartContainer title="🏆 Mois les plus vus">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {bestMonths.map((m, i) => (
            <div key={m.month} className="rounded-lg border p-4 text-center" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <div className="text-xs" style={{ color: "var(--muted)" }}>#{i + 1}</div>
              <div className="text-lg font-semibold mt-1">{m.month}</div>
              <div className="font-bold" style={{ color: "var(--accent-light)" }}>{formatNum(m.views)} vues</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>{m.count} épisodes</div>
            </div>
          ))}
        </div>
      </ChartContainer>

      {/* Top 20 videos */}
      <ChartContainer title="Top 20 — Épisodes les plus vus">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-[var(--card-border)]">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Titre</th>
                <th className="py-2 pr-3 text-right">Vues</th>
                <th className="py-2 pr-3 text-right">Likes</th>
                <th className="py-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {topVideos.map((v, i) => (
                <tr key={i} className="border-b border-[var(--card-border)] hover:bg-white/[0.03] transition">
                  <td className="py-2 pr-3 text-muted">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline line-clamp-1">{v.title}</a>
                  </td>
                  <td className="py-2 pr-3 text-right font-medium">{formatNum(v.views)}</td>
                  <td className="py-2 pr-3 text-right">{formatNum(v.likes)}</td>
                  <td className="py-2 text-right text-muted">{new Date(v.published_at).toLocaleDateString("fr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
}
