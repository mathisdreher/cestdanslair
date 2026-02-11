import { NextResponse } from "next/server";
import { loadVideos, getYearFromDate, getMonthFromDate, parseDuration } from "@/lib/data";

export async function GET() {
  const videos = loadVideos();

  // Basic stats
  const totalVideos = videos.length;
  const totalViews = videos.reduce((s, v) => s + v.view_count, 0);
  const totalLikes = videos.reduce((s, v) => s + v.like_count, 0);
  const totalComments = videos.reduce((s, v) => s + v.comment_count, 0);
  const avgViews = Math.round(totalViews / totalVideos);

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

  // Videos per year
  const yearlyMap: Record<number, { count: number; views: number; likes: number; comments: number }> = {};
  videos.forEach((v) => {
    const year = getYearFromDate(v.published_at);
    if (!yearlyMap[year]) yearlyMap[year] = { count: 0, views: 0, likes: 0, comments: 0 };
    yearlyMap[year].count++;
    yearlyMap[year].views += v.view_count;
    yearlyMap[year].likes += v.like_count;
    yearlyMap[year].comments += v.comment_count;
  });
  const yearly = Object.entries(yearlyMap)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, data]) => ({ year: parseInt(year), ...data }));

  // Duration distribution
  const durationBuckets: Record<string, number> = {
    "30-45 min": 0,
    "45-60 min": 0,
    "60-75 min": 0,
    "75-90 min": 0,
    "90+ min": 0,
  };
  videos.forEach((v) => {
    const seconds = parseDuration(v.duration);
    const mins = seconds / 60;
    if (mins < 45) durationBuckets["30-45 min"]++;
    else if (mins < 60) durationBuckets["45-60 min"]++;
    else if (mins < 75) durationBuckets["60-75 min"]++;
    else if (mins < 90) durationBuckets["75-90 min"]++;
    else durationBuckets["90+ min"]++;
  });
  const durationDistribution = Object.entries(durationBuckets).map(([range, count]) => ({ range, count }));

  // Top 10 most viewed videos
  const topVideos = [...videos]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 10)
    .map((v) => ({
      title: v.title,
      views: v.view_count,
      likes: v.like_count,
      published_at: v.published_at,
      url: v.url,
      thumbnail_url: v.thumbnail_url,
    }));

  // Engagement rate over time (likes+comments / views)
  const yearlyEngagement = yearly.map((y) => ({
    year: y.year,
    engagement: y.views > 0 ? ((y.likes + y.comments) / y.views * 100) : 0,
  }));

  return NextResponse.json({
    stats: { totalVideos, totalViews, totalLikes, totalComments, avgViews },
    monthly,
    yearly,
    durationDistribution,
    topVideos,
    yearlyEngagement,
  });
}
