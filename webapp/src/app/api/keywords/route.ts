import { NextRequest, NextResponse } from "next/server";
import { loadVideos, getMonthFromDate, getYearFromDate } from "@/lib/data";

export async function GET(request: NextRequest) {
  // Support multiple keywords via comma separation
  const qParam = request.nextUrl.searchParams.get("q") || "";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "50");
  const sort = request.nextUrl.searchParams.get("sort") || "date"; // date | views
  const order = request.nextUrl.searchParams.get("order") || "desc";
  const yearsParam = request.nextUrl.searchParams.get("years") || ""; // comma-separated years

  const keywords = qParam
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  if (keywords.length === 0) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const allVideos = loadVideos();

  // Get all years for UI
  const allYearsSet = new Set<number>();
  allVideos.forEach((v) => allYearsSet.add(getYearFromDate(v.published_at)));
  const availableYears = Array.from(allYearsSet).sort();

  // Filter by selected years if provided
  const selectedYears = yearsParam
    ? yearsParam.split(",").map((y) => parseInt(y.trim())).filter(Boolean)
    : [];
  const videos = selectedYears.length > 0
    ? allVideos.filter((v) => selectedYears.includes(getYearFromDate(v.published_at)))
    : allVideos;

  // Get all years for consistent x-axis
  const allYears = new Set<number>();
  const allMonths = new Set<string>();
  videos.forEach((v) => {
    allYears.add(getYearFromDate(v.published_at));
    allMonths.add(getMonthFromDate(v.published_at));
  });
  const sortedYears = Array.from(allYears).sort();
  const sortedMonths = Array.from(allMonths).sort();

  // Process each keyword
  const keywordResults: Record<string, {
    totalMatches: number;
    monthlyMap: Record<string, number>;
    yearlyMap: Record<number, { count: number; views: number }>;
    matchedIds: Set<string>;
  }> = {};

  keywords.forEach((keyword) => {
    const monthlyMap: Record<string, number> = {};
    const yearlyMap: Record<number, { count: number; views: number }> = {};
    const matchedIds = new Set<string>();

    videos.forEach((v) => {
      const inTitle = v.title.toLowerCase().includes(keyword);
      const inTags = v.tags.some((t) => t.toLowerCase().includes(keyword));
      const inDescription = v.description.toLowerCase().includes(keyword);

      if (inTitle || inTags || inDescription) {
        matchedIds.add(v.video_id);
        const month = getMonthFromDate(v.published_at);
        const year = getYearFromDate(v.published_at);
        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
        if (!yearlyMap[year]) yearlyMap[year] = { count: 0, views: 0 };
        yearlyMap[year].count++;
        yearlyMap[year].views += v.view_count;
      }
    });

    keywordResults[keyword] = {
      totalMatches: matchedIds.size,
      monthlyMap,
      yearlyMap,
      matchedIds,
    };
  });

  // Build unified monthly timeline data
  const monthlyTimeline = sortedMonths.map((month) => {
    const entry: Record<string, string | number> = { month };
    keywords.forEach((kw) => {
      entry[kw] = keywordResults[kw].monthlyMap[month] || 0;
    });
    return entry;
  });

  // Build unified yearly data
  const yearlyData = sortedYears.map((year) => {
    const entry: Record<string, string | number> = { year };
    keywords.forEach((kw) => {
      entry[`${kw}_count`] = keywordResults[kw].yearlyMap[year]?.count || 0;
      entry[`${kw}_views`] = keywordResults[kw].yearlyMap[year]?.views || 0;
    });
    return entry;
  });

  // Summary per keyword
  const summaries = keywords.map((kw) => {
    const res = keywordResults[kw];
    // Trend: compare last 2 years
    const lastYear = sortedYears[sortedYears.length - 1];
    const prevYear = sortedYears[sortedYears.length - 2];
    const lastCount = res.yearlyMap[lastYear]?.count || 0;
    const prevCount = res.yearlyMap[prevYear]?.count || 0;
    const trend = prevCount > 0 ? ((lastCount - prevCount) / prevCount) * 100 : 0;

    return {
      keyword: kw,
      totalMatches: res.totalMatches,
      percentage: ((res.totalMatches / videos.length) * 100).toFixed(1),
      trend: Math.round(trend),
    };
  });

  // All matching videos (union of all keywords)
  const allMatchedIds = new Set<string>();
  keywords.forEach((kw) => {
    keywordResults[kw].matchedIds.forEach((id) => allMatchedIds.add(id));
  });

  let allMatches = videos
    .filter((v) => allMatchedIds.has(v.video_id))
    .map((v) => {
      // Tag which keywords matched
      const matchedKeywords = keywords.filter((kw) => {
        const inTitle = v.title.toLowerCase().includes(kw);
        const inTags = v.tags.some((t) => t.toLowerCase().includes(kw));
        const inDescription = v.description.toLowerCase().includes(kw);
        return inTitle || inTags || inDescription;
      });
      return {
        video_id: v.video_id,
        title: v.title,
        published_at: v.published_at,
        views: v.view_count,
        likes: v.like_count,
        url: v.url,
        matchedKeywords,
      };
    });

  // Sort
  allMatches.sort((a, b) => {
    const cmp = sort === "views"
      ? a.views - b.views
      : new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
    return order === "desc" ? -cmp : cmp;
  });

  const total = allMatches.length;
  const totalPages = Math.ceil(total / pageSize);
  const paged = allMatches.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    keywords,
    summaries,
    totalVideos: videos.length,
    monthlyTimeline,
    yearlyData,
    matchingVideos: paged,
    pagination: { total, page, pageSize, totalPages },
    availableYears,
    selectedYears,
  });
}
