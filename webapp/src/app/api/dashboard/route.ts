import { NextResponse } from "next/server";
import { loadVideos, getYearFromDate, getMonthFromDate, parseDuration, SKIP_TAGS } from "@/lib/data";

export async function GET() {
  const videos = loadVideos();

  const totalVideos = videos.length;
  const totalViews = videos.reduce((s, v) => s + v.view_count, 0);
  const totalLikes = videos.reduce((s, v) => s + v.like_count, 0);
  const totalComments = videos.reduce((s, v) => s + v.comment_count, 0);
  const avgViews = Math.round(totalViews / totalVideos);
  const totalHours = Math.round(videos.reduce((s, v) => s + parseDuration(v.duration), 0) / 3600);

  // Date range
  const dates = videos.map((v) => new Date(v.published_at).getTime());
  const firstDate = new Date(Math.min(...dates)).toISOString();
  const lastDate = new Date(Math.max(...dates)).toISOString();

  // Videos per month
  const monthlyMap: Record<string, { count: number; views: number }> = {};
  videos.forEach((v) => {
    const month = getMonthFromDate(v.published_at);
    if (!monthlyMap[month]) monthlyMap[month] = { count: 0, views: 0 };
    monthlyMap[month].count++;
    monthlyMap[month].views += v.view_count;
  });
  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Videos per year (with all metrics)
  const yearlyMap: Record<number, { count: number; views: number; likes: number; comments: number; totalDuration: number }> = {};
  videos.forEach((v) => {
    const year = getYearFromDate(v.published_at);
    if (!yearlyMap[year]) yearlyMap[year] = { count: 0, views: 0, likes: 0, comments: 0, totalDuration: 0 };
    yearlyMap[year].count++;
    yearlyMap[year].views += v.view_count;
    yearlyMap[year].likes += v.like_count;
    yearlyMap[year].comments += v.comment_count;
    yearlyMap[year].totalDuration += parseDuration(v.duration);
  });
  const yearly = Object.entries(yearlyMap)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, data]) => ({
      year: parseInt(year),
      ...data,
      avgViews: Math.round(data.views / data.count),
      engagement: data.views > 0 ? +((data.likes + data.comments) / data.views * 100).toFixed(2) : 0,
      hoursOfContent: Math.round(data.totalDuration / 3600),
    }));

  // Duration distribution
  const durationBuckets: Record<string, number> = {
    "30-45 min": 0, "45-60 min": 0, "60-75 min": 0, "75-90 min": 0, "90+ min": 0,
  };
  videos.forEach((v) => {
    const mins = parseDuration(v.duration) / 60;
    if (mins < 45) durationBuckets["30-45 min"]++;
    else if (mins < 60) durationBuckets["45-60 min"]++;
    else if (mins < 75) durationBuckets["60-75 min"]++;
    else if (mins < 90) durationBuckets["75-90 min"]++;
    else durationBuckets["90+ min"]++;
  });
  const durationDistribution = Object.entries(durationBuckets).map(([range, count]) => ({ range, count }));

  // Top 20 viewed
  const topVideos = [...videos]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 20)
    .map((v) => ({
      title: v.title,
      views: v.view_count,
      likes: v.like_count,
      comments: v.comment_count,
      published_at: v.published_at,
      url: v.url,
    }));

  // Best months (most views)
  const bestMonths = [...monthly].sort((a, b) => b.views - a.views).slice(0, 5);

  // Top tags (quick overview)
  const tagCounts: Record<string, number> = {};
  videos.forEach((v) => {
    v.tags.forEach((t) => {
      const nt = t.toLowerCase().trim();
      if (!nt || SKIP_TAGS.has(nt)) return;
      tagCounts[nt] = (tagCounts[nt] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({
    stats: { totalVideos, totalViews, totalLikes, totalComments, avgViews, totalHours, firstDate, lastDate },
    monthly,
    yearly,
    durationDistribution,
    topVideos,
    bestMonths,
    topTags,
  });
}
