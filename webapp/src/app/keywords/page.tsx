"use client";

import { useState, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "@/components/Cards";

interface KeywordData {
  keyword: string;
  totalMatches: number;
  totalVideos: number;
  monthly: { month: string; count: number; views: number }[];
  yearly: { year: number; count: number; views: number }[];
  recentMatches: { title: string; published_at: string; views: number; url: string; thumbnail_url: string }[];
}

export default function KeywordsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<KeywordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/keywords?q=${encodeURIComponent(keyword.trim())}`);
      const result = await res.json();
      setData(result);
      setHistory((prev) => {
        const next = [keyword.trim(), ...prev.filter((h) => h !== keyword.trim())];
        return next.slice(0, 10);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Keyword Search</h2>
        <p style={{ color: "var(--muted)" }}>Track keywords over time in titles, tags and descriptions</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a keyword (e.g. Trump, Ukraine, climat, retraites...)"
          className="flex-1 px-4 py-3 rounded-lg border text-sm outline-none focus:ring-2"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)",
            color: "var(--foreground)",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg font-medium text-sm text-white transition-opacity"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Search history */}
      {history.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm" style={{ color: "var(--muted)" }}>Recent:</span>
          {history.map((h) => (
            <button
              key={h}
              onClick={() => { setQuery(h); search(h); }}
              className="px-3 py-1 rounded-full text-xs border transition-colors hover:text-white"
              style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Stats summary */}
          <div
            className="rounded-xl p-6 border flex items-center gap-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Results for</p>
              <p className="text-xl font-bold" style={{ color: "var(--accent-light)" }}>
                &quot;{data.keyword}&quot;
              </p>
            </div>
            <div className="h-10 w-px" style={{ background: "var(--card-border)" }} />
            <div>
              <p className="text-2xl font-bold">{data.totalMatches}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                videos ({((data.totalMatches / data.totalVideos) * 100).toFixed(1)}% of all)
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer title="Occurrences by Year" subtitle={`Videos mentioning "${data.keyword}" per year`}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.yearly}>
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

            <ChartContainer title="Views by Year" subtitle={`Total views for matching videos`}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.yearly}>
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

          {/* Monthly timeline */}
          <ChartContainer title="Monthly Timeline" subtitle={`Monthly occurrences of "${data.keyword}"`}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  interval={Math.max(Math.floor(data.monthly.length / 12), 0)}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} name="Videos" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Matching videos list */}
          <ChartContainer title="Recent Matching Videos" subtitle="Latest 20 matching episodes">
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {data.recentMatches.map((v, i) => (
                <a
                  key={i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-lg border transition-colors hover:border-blue-500"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--accent-light)" }}>
                      {v.title}
                    </p>
                    <div className="flex gap-4 text-xs mt-1" style={{ color: "var(--muted)" }}>
                      <span>{new Date(v.published_at).toLocaleDateString("fr-FR")}</span>
                      <span>{v.views.toLocaleString("fr-FR")} views</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </ChartContainer>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-20" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">Enter a keyword to start searching</p>
          <p className="text-sm mt-2">Try: Trump, Ukraine, climat, retraites, immigration, Macron...</p>
        </div>
      )}
    </div>
  );
}
