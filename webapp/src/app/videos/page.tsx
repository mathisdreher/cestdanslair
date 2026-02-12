"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface VideoEntry {
  video_id: string;
  title: string;
  published_at: string;
  duration: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  url: string;
  thumbnail_url: string;
  tags: string[];
}

interface VideosData {
  videos: VideoEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function VideosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Chargement...</div>}>
      <VideosContent />
    </Suspense>
  );
}

function VideosContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [data, setData] = useState<VideosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "20",
      sort,
      order,
      ...(search ? { q: search } : {}),
    });
    const res = await fetch(`/api/videos?${params}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, [page, sort, order, search]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVideos();
  };

  const toggleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sort !== field) return <span style={{ color: "var(--card-border)" }}>↕</span>;
    return <span style={{ color: "var(--accent-light)" }}>{order === "desc" ? "↓" : "↑"}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Explorateur vidéo</h2>
        <p style={{ color: "var(--muted)" }}>
          Parcourir et rechercher tous les épisodes {data ? `(${data.total} résultats)` : ""}
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre ou tags..."
          className="flex-1 px-4 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg font-medium text-sm text-white"
          style={{ background: "var(--accent)" }}
        >
          Rechercher
        </button>
      </form>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                <th className="text-left py-3 px-4" style={{ color: "var(--muted)" }}>Titre</th>
                <th
                  className="text-right py-3 px-4 cursor-pointer select-none"
                  style={{ color: "var(--muted)" }}
                  onClick={() => toggleSort("date")}
                >
                  Date <SortIcon field="date" />
                </th>
                <th className="text-right py-3 px-4" style={{ color: "var(--muted)" }}>Durée</th>
                <th
                  className="text-right py-3 px-4 cursor-pointer select-none"
                  style={{ color: "var(--muted)" }}
                  onClick={() => toggleSort("views")}
                >
                  Vues <SortIcon field="views" />
                </th>
                <th
                  className="text-right py-3 px-4 cursor-pointer select-none"
                  style={{ color: "var(--muted)" }}
                  onClick={() => toggleSort("likes")}
                >
                  Likes <SortIcon field="likes" />
                </th>
                <th
                  className="text-right py-3 px-4 cursor-pointer select-none"
                  style={{ color: "var(--muted)" }}
                  onClick={() => toggleSort("comments")}
                >
                  Commentaires <SortIcon field="comments" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10" style={{ color: "var(--muted)" }}>
                    Loading...
                  </td>
                </tr>
              ) : data?.videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10" style={{ color: "var(--muted)" }}>
                    Aucun résultat trouvé
                  </td>
                </tr>
              ) : (
                data?.videos.map((v) => (
                  <tr
                    key={v.video_id}
                    className="border-t hover:bg-white/5 transition-colors"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <td className="py-3 px-4 max-w-md">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline font-medium"
                        style={{ color: "var(--accent-light)" }}
                      >
                        {v.title.length > 80 ? v.title.slice(0, 80) + "..." : v.title}
                      </a>
                      {v.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {v.tags.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs"
                              style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent-light)" }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" style={{ color: "var(--muted)" }}>
                      {new Date(v.published_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" style={{ color: "var(--muted)" }}>
                      {v.duration}
                    </td>
                    <td className="py-3 px-4 text-right">{v.view_count.toLocaleString("fr-FR")}</td>
                    <td className="py-3 px-4 text-right">{v.like_count.toLocaleString("fr-FR")}</td>
                    <td className="py-3 px-4 text-right">{v.comment_count.toLocaleString("fr-FR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--card-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Page {data.page} sur {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30"
                style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-30"
                style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
