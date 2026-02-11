import { NextRequest, NextResponse } from "next/server";
import { loadVideos, getMonthFromDate, getYearFromDate } from "@/lib/data";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("q")?.toLowerCase() || "";

  if (!keyword) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const videos = loadVideos();

  // Search in title, tags, and description
  const matches = videos.filter((v) => {
    const inTitle = v.title.toLowerCase().includes(keyword);
    const inTags = v.tags.some((t) => t.toLowerCase().includes(keyword));
    const inDescription = v.description.toLowerCase().includes(keyword);
    return inTitle || inTags || inDescription;
  });

  // Group by month
  const monthlyMap: Record<string, { count: number; views: number }> = {};
  matches.forEach((v) => {
    const month = getMonthFromDate(v.published_at);
    if (!monthlyMap[month]) monthlyMap[month] = { count: 0, views: 0 };
    monthlyMap[month].count++;
    monthlyMap[month].views += v.view_count;
  });
  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Group by year
  const yearlyMap: Record<number, { count: number; views: number }> = {};
  matches.forEach((v) => {
    const year = getYearFromDate(v.published_at);
    if (!yearlyMap[year]) yearlyMap[year] = { count: 0, views: 0 };
    yearlyMap[year].count++;
    yearlyMap[year].views += v.view_count;
  });
  const yearly = Object.entries(yearlyMap)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, data]) => ({ year: parseInt(year), ...data }));

  // Recent matching videos
  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 20)
    .map((v) => ({
      title: v.title,
      published_at: v.published_at,
      views: v.view_count,
      url: v.url,
      thumbnail_url: v.thumbnail_url,
    }));

  return NextResponse.json({
    keyword,
    totalMatches: matches.length,
    totalVideos: videos.length,
    monthly,
    yearly,
    recentMatches,
  });
}
