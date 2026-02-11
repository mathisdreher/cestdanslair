import { NextRequest, NextResponse } from "next/server";
import { loadVideos, getYearFromDate } from "@/lib/data";

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const topN = parseInt(request.nextUrl.searchParams.get("top") || "30");

  const videos = loadVideos();

  // Get available years
  const yearsSet = new Set<number>();
  videos.forEach((v) => yearsSet.add(getYearFromDate(v.published_at)));
  const years = Array.from(yearsSet).sort();

  // If specific year requested, filter
  const filtered = yearParam
    ? videos.filter((v) => getYearFromDate(v.published_at) === parseInt(yearParam))
    : videos;

  // Count all tags
  const tagCounts: Record<string, { count: number; views: number }> = {};
  filtered.forEach((v) => {
    v.tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      if (!normalizedTag) return;
      // Skip generic tags
      const skip = ["c dans l'air", "cdanslair", "cdl", "caroline roux", "aurélie casse",
        "salhia brakhlia", "axel tarlé", "politique", "économie", "société", "débat",
        "france 5", "#cdanslair"];
      if (skip.includes(normalizedTag)) return;
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
  const topTagNames = topTags.slice(0, 15).map((t) => t.tag);
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

  return NextResponse.json({
    years,
    selectedYear: yearParam ? parseInt(yearParam) : null,
    totalVideos: filtered.length,
    topTags,
    evolution,
    topTagNames,
  });
}
