import { NextRequest, NextResponse } from "next/server";
import { loadVideos } from "@/lib/data";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20");
  const sort = request.nextUrl.searchParams.get("sort") || "date";
  const order = request.nextUrl.searchParams.get("order") || "desc";
  const search = request.nextUrl.searchParams.get("q")?.toLowerCase() || "";

  let videos = loadVideos();

  // Filter
  if (search) {
    videos = videos.filter(
      (v) =>
        v.title.toLowerCase().includes(search) ||
        v.tags.some((t) => t.toLowerCase().includes(search))
    );
  }

  // Sort
  videos.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "views":
        cmp = a.view_count - b.view_count;
        break;
      case "likes":
        cmp = a.like_count - b.like_count;
        break;
      case "comments":
        cmp = a.comment_count - b.comment_count;
        break;
      default:
        cmp = new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
    }
    return order === "desc" ? -cmp : cmp;
  });

  const total = videos.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paged = videos.slice(start, start + pageSize).map((v) => ({
    video_id: v.video_id,
    title: v.title,
    published_at: v.published_at,
    duration: v.duration,
    view_count: v.view_count,
    like_count: v.like_count,
    comment_count: v.comment_count,
    url: v.url,
    thumbnail_url: v.thumbnail_url,
    tags: v.tags.slice(0, 5),
  }));

  return NextResponse.json({
    videos: paged,
    total,
    page,
    pageSize,
    totalPages,
  });
}
