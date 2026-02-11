import { NextRequest, NextResponse } from "next/server";
import { loadVideos, getYearFromDate, SKIP_TAGS } from "@/lib/data";

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const yearsParam = request.nextUrl.searchParams.get("years"); // comma-separated years for comparison
  const topN = parseInt(request.nextUrl.searchParams.get("top") || "30");

  const videos = loadVideos();

  // Get available years
  const yearsSet = new Set<number>();
  videos.forEach((v) => yearsSet.add(getYearFromDate(v.published_at)));
  const years = Array.from(yearsSet).sort();

  // Parse selected years for comparison
  const selectedYears = yearsParam
    ? yearsParam.split(",").map((y) => parseInt(y.trim())).filter(Boolean)
    : [];

  // If specific year requested, filter; if years comparison, filter to those years
  const filtered = yearParam
    ? videos.filter((v) => getYearFromDate(v.published_at) === parseInt(yearParam))
    : selectedYears.length > 0
      ? videos.filter((v) => selectedYears.includes(getYearFromDate(v.published_at)))
      : videos;

  // Count all tags
  const tagCounts: Record<string, { count: number; views: number }> = {};
  filtered.forEach((v) => {
    v.tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      if (!normalizedTag || SKIP_TAGS.has(normalizedTag)) return;
      if (!tagCounts[normalizedTag]) tagCounts[normalizedTag] = { count: 0, views: 0 };
      tagCounts[normalizedTag].count++;
      tagCounts[normalizedTag].views += v.view_count;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, topN)
    .map(([tag, data]) => ({ tag, ...data }));

  // Tags evolution: for each top tag, count per year
  const topTagNames = topTags.slice(0, 20).map((t) => t.tag);
  const tagEvolution: Record<string, Record<number, number>> = {};
  topTagNames.forEach((tag) => {
    tagEvolution[tag] = {};
    years.forEach((y) => (tagEvolution[tag][y] = 0));
  });

  videos.forEach((v) => {
    const year = getYearFromDate(v.published_at);
    v.tags.forEach((t) => {
      const nt = t.toLowerCase().trim();
      if (tagEvolution[nt] !== undefined) {
        tagEvolution[nt][year]++;
      }
    });
  });

  const evolution = years.map((year) => {
    const entry: Record<string, number | string> = { year };
    topTagNames.forEach((tag) => {
      entry[tag] = tagEvolution[tag][year] || 0;
    });
    return entry;
  });

  // Heatmap data: top 20 tags x years
  const heatmap = topTagNames.map((tag) => ({
    tag,
    values: years.map((year) => ({
      year,
      count: tagEvolution[tag][year] || 0,
    })),
  }));

  // Trending: compare last 2 full years
  const lastFullYear = years[years.length - 2]; // current year may be partial
  const prevFullYear = years[years.length - 3];
  const trending = topTags.map((t) => {
    const lastCount = tagEvolution[t.tag]?.[lastFullYear] || 0;
    const prevCount = tagEvolution[t.tag]?.[prevFullYear] || 0;
    const change = prevCount > 0 ? Math.round(((lastCount - prevCount) / prevCount) * 100) : (lastCount > 0 ? 100 : 0);
    return { tag: t.tag, lastCount, prevCount, change, totalCount: t.count };
  });

  const rising = trending.filter((t) => t.change > 20 && t.lastCount >= 3).sort((a, b) => b.change - a.change).slice(0, 10);
  const falling = trending.filter((t) => t.change < -20 && t.prevCount >= 3).sort((a, b) => a.change - b.change).slice(0, 10);

  return NextResponse.json({
    years,
    selectedYear: yearParam ? parseInt(yearParam) : null,
    selectedYears,
    totalVideos: filtered.length,
    topTags,
    evolution,
    topTagNames,
    heatmap,
    trending: { rising, falling, comparedYears: [prevFullYear, lastFullYear] },
  });
}
