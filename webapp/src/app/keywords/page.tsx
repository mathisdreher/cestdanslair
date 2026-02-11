"use client";

import { useState, useCallback } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartContainer } from "@/components/Cards";

const KEYWORD_COLORS = [
  "#3b82f6", "#ec4899", "#22c55e", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#f43f5e", "#14b8a6",
];

interface Summary {
  keyword: string;
  totalMatches: number;
  percentage: string;
  trend: number;
}

interface MatchingVideo {
  video_id: string;
  title: string;
  published_at: string;
  views: number;
  likes: number;
  url: string;
  matchedKeywords: string[];
}

interface KeywordData {
  keywords: string[];
  summaries: Summary[];
  totalVideos: number;
  monthlyTimeline: Record<string, string | number>[];
  yearlyData: Record<string, string | number>[];
  matchingVideos: MatchingVideo[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
  availableYears: number[];
  selectedYears: number[];
}

export default function KeywordsPage() {
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState<KeywordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [chartMode, setChartMode] = useState<"monthly" | "yearly">("monthly");
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [suggestions] = useState([
    "Trump", "Ukraine", "Macron", "climat", "retraites",
    "immigration", "Gaza", "Russie", "Poutine", "Epstein",
    "élection", "terrorisme", "Covid", "Europe", "Chine",
  ]);

  const fetchData = useCallback(async (keywords: string, pg: number, s: string, o: string, years?: Set<number>) => {
    if (!keywords.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: keywords,
        page: pg.toString(),
        pageSize: "50",
        sort: s,
        order: o,
      });
      const yrs = years ?? selectedYears;
      if (yrs.size > 0) {
        params.set("years", Array.from(yrs).join(","));
      }
      const res = await fetch(`/api/keywords?${params}`);
      const result = await res.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [selectedYears]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setHiddenSeries(new Set());
    fetchData(inputValue, 1, sort, order);
  };

  const addKeyword = (kw: string) => {
    const current = inputValue.split(",").map((k) => k.trim()).filter(Boolean);
    if (!current.includes(kw)) {
      const newValue = [...current, kw].join(", ");
      setInputValue(newValue);
      setPage(1);
      setHiddenSeries(new Set());
      fetchData(newValue, 1, sort, order);
    }
  };

  const removeKeyword = (kw: string) => {
    const current = inputValue.split(",").map((k) => k.trim()).filter(Boolean);
    const newValue = current.filter((k) => k.toLowerCase() !== kw.toLowerCase()).join(", ");
    setInputValue(newValue);
    setPage(1);
    if (newValue.trim()) {
      fetchData(newValue, 1, sort, order);
    } else {
      setData(null);
    }
  };

  const toggleSeries = (keyword: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(inputValue, newPage, sort, order);
  };

  const handleSortChange = (field: string) => {
    const newOrder = sort === field && order === "desc" ? "asc" : "desc";
    setSort(field);
    setOrder(newOrder);
    setPage(1);
    fetchData(inputValue, 1, field, newOrder);
  };

  const toggleYear = (year: number) => {
    const next = new Set(selectedYears);
    if (next.has(year)) next.delete(year);
    else next.add(year);
    setSelectedYears(next);
    if (inputValue.trim()) {
      setPage(1);
      fetchData(inputValue, 1, sort, order, next);
    }
  };

  const clearYears = () => {
    setSelectedYears(new Set());
    if (inputValue.trim()) {
      setPage(1);
      fetchData(inputValue, 1, sort, order, new Set());
    }
  };

  const visibleKeywords = data?.keywords.filter((kw) => !hiddenSeries.has(kw)) || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Keyword Tracker</h2>
        <p style={{ color: "var(--muted)" }}>
          Compare up to 5 keywords over time. Separate with commas (e.g. &quot;Trump, Macron, Ukraine&quot;)
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter keywords separated by commas..."
          className="flex-1 px-4 py-3 rounded-lg border text-sm outline-none focus:ring-2"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg font-medium text-sm text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "..." : "Compare"}
        </button>
      </form>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs py-1" style={{ color: "var(--muted)" }}>Suggestions:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => addKeyword(s)}
            className="px-3 py-1 rounded-full text-xs border transition-all hover:border-blue-500 hover:text-white"
            style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            + {s}
          </button>
        ))}
      </div>

      {/* Year filter */}
      {data?.availableYears && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs py-1" style={{ color: "var(--muted)" }}>Years:</span>
          <button
            onClick={clearYears}
            className="px-3 py-1 rounded text-xs border transition-all"
            style={{
              background: selectedYears.size === 0 ? "var(--accent)" : "transparent",
              borderColor: selectedYears.size === 0 ? "var(--accent)" : "var(--card-border)",
              color: selectedYears.size === 0 ? "white" : "var(--muted)",
            }}
          >
            All
          </button>
          {data.availableYears.map((y) => (
            <button
              key={y}
              onClick={() => toggleYear(y)}
              className="px-3 py-1 rounded text-xs border transition-all"
              style={{
                background: selectedYears.has(y) ? "var(--accent)" : "transparent",
                borderColor: selectedYears.has(y) ? "var(--accent)" : "var(--card-border)",
                color: selectedYears.has(y) ? "white" : "var(--muted)",
              }}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Keyword summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {data.summaries.map((s, idx) => (
              <div
                key={s.keyword}
                className="rounded-xl p-4 border cursor-pointer transition-all"
                style={{
                  background: hiddenSeries.has(s.keyword) ? "transparent" : "var(--card-bg)",
                  borderColor: hiddenSeries.has(s.keyword) ? "var(--card-border)" : KEYWORD_COLORS[idx % KEYWORD_COLORS.length],
                  opacity: hiddenSeries.has(s.keyword) ? 0.4 : 1,
                }}
                onClick={() => toggleSeries(s.keyword)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: KEYWORD_COLORS[idx % KEYWORD_COLORS.length] }}
                    />
                    <span className="text-sm font-bold">{s.keyword}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeKeyword(s.keyword); }}
                    className="text-xs opacity-50 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-2xl font-bold">{s.totalMatches}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{s.percentage}% of all</span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: s.trend > 0 ? "#22c55e" : s.trend < 0 ? "#ef4444" : "var(--muted)" }}
                  >
                    {s.trend > 0 ? "↑" : s.trend < 0 ? "↓" : "→"} {Math.abs(s.trend)}% vs prev year
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartMode("monthly")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: chartMode === "monthly" ? "var(--accent)" : "var(--card-bg)",
                color: chartMode === "monthly" ? "white" : "var(--muted)",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setChartMode("yearly")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: chartMode === "yearly" ? "var(--accent)" : "var(--card-bg)",
                color: chartMode === "yearly" ? "white" : "var(--muted)",
              }}
            >
              Yearly
            </button>
            <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>
              Click on a keyword card above to show/hide its curve
            </span>
          </div>

          {/* Main timeline chart */}
          <ChartContainer
            title={chartMode === "monthly" ? "Monthly Occurrences" : "Yearly Occurrences"}
            subtitle="Number of episodes mentioning each keyword"
          >
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartMode === "monthly" ? data.monthlyTimeline : data.yearlyData}>
                <defs>
                  {data.keywords.map((kw, idx) => (
                    <linearGradient key={kw} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={KEYWORD_COLORS[idx % KEYWORD_COLORS.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={KEYWORD_COLORS[idx % KEYWORD_COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey={chartMode === "monthly" ? "month" : "year"}
                  stroke="#94a3b8"
                  fontSize={11}
                  interval={chartMode === "monthly" ? Math.max(Math.floor(data.monthlyTimeline.length / 15), 0) : 0}
                  angle={chartMode === "monthly" ? -45 : 0}
                  textAnchor={chartMode === "monthly" ? "end" : "middle"}
                  height={chartMode === "monthly" ? 60 : 30}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend
                  onClick={(e) => {
                    if (typeof e.value === "string") toggleSeries(e.value);
                  }}
                  wrapperStyle={{ cursor: "pointer", fontSize: "12px" }}
                />
                {data.keywords.map((kw, idx) => (
                  <Area
                    key={kw}
                    type="monotone"
                    dataKey={chartMode === "monthly" ? kw : `${kw}_count`}
                    name={kw}
                    stroke={KEYWORD_COLORS[idx % KEYWORD_COLORS.length]}
                    fill={`url(#gradient-${idx})`}
                    strokeWidth={2}
                    dot={false}
                    hide={hiddenSeries.has(kw)}
                    connectNulls
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Views comparison */}
          <ChartContainer title="Views Comparison" subtitle="Total views attracted by each keyword per year">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(value) => [Number(value ?? 0).toLocaleString("fr-FR"), "Views"]}
                />
                <Legend
                  onClick={(e) => {
                    if (typeof e.value === "string") toggleSeries(e.value);
                  }}
                  wrapperStyle={{ cursor: "pointer", fontSize: "12px" }}
                />
                {data.keywords.map((kw, idx) => (
                  <Bar
                    key={kw}
                    dataKey={`${kw}_views`}
                    name={kw}
                    fill={KEYWORD_COLORS[idx % KEYWORD_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    hide={hiddenSeries.has(kw)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* All matching videos */}
          <ChartContainer
            title={`All Matching Videos (${data.pagination.total})`}
            subtitle="Every episode mentioning any searched keyword"
          >
            {/* Sort controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleSortChange("date")}
                className="px-3 py-1.5 rounded text-xs font-medium border"
                style={{
                  background: sort === "date" ? "var(--accent)" : "transparent",
                  borderColor: sort === "date" ? "var(--accent)" : "var(--card-border)",
                  color: sort === "date" ? "white" : "var(--muted)",
                }}
              >
                Date {sort === "date" && (order === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortChange("views")}
                className="px-3 py-1.5 rounded text-xs font-medium border"
                style={{
                  background: sort === "views" ? "var(--accent)" : "transparent",
                  borderColor: sort === "views" ? "var(--accent)" : "var(--card-border)",
                  color: sort === "views" ? "white" : "var(--muted)",
                }}
              >
                Views {sort === "views" && (order === "desc" ? "↓" : "↑")}
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {data.matchingVideos.map((v) => (
                <a
                  key={v.video_id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-lg border transition-all hover:border-blue-500"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--accent-light)" }}>
                      {v.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {new Date(v.published_at).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {v.views.toLocaleString("fr-FR")} views
                      </span>
                      {v.matchedKeywords.map((kw) => {
                        const idx = data.keywords.indexOf(kw);
                        return (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              background: `${KEYWORD_COLORS[idx % KEYWORD_COLORS.length]}22`,
                              color: KEYWORD_COLORS[idx % KEYWORD_COLORS.length],
                            }}
                          >
                            {kw}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{v.views.toLocaleString("fr-FR")}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>views</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "var(--card-border)" }}>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} videos)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-30"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    ← Previous
                  </button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, Math.min(page - 2, data.pagination.totalPages - 4));
                    const p = startPage + i;
                    if (p > data.pagination.totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className="px-3 py-1 rounded border text-sm"
                        style={{
                          borderColor: p === page ? "var(--accent)" : "var(--card-border)",
                          background: p === page ? "var(--accent)" : "transparent",
                          color: p === page ? "white" : "var(--foreground)",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === data.pagination.totalPages}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-30"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </ChartContainer>
        </>
      )}

      {!data && !loading && (
        <div
          className="rounded-xl p-12 border text-center"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-2">Search and compare keywords</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Enter one or more keywords separated by commas to see how media coverage evolved over time.
            <br />
            Try: <button onClick={() => { setInputValue("Trump, Macron"); fetchData("Trump, Macron", 1, sort, order); }} className="underline" style={{ color: "var(--accent-light)" }}>Trump, Macron</button>
            {" · "}
            <button onClick={() => { setInputValue("Ukraine, Russie, Gaza"); fetchData("Ukraine, Russie, Gaza", 1, sort, order); }} className="underline" style={{ color: "var(--accent-light)" }}>Ukraine, Russie, Gaza</button>
            {" · "}
            <button onClick={() => { setInputValue("climat, écologie"); fetchData("climat, écologie", 1, sort, order); }} className="underline" style={{ color: "var(--accent-light)" }}>climat, écologie</button>
          </p>
        </div>
      )}
    </div>
  );
}
