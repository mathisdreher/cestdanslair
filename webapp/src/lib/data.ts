import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export interface Video {
  video_id: string;
  title: string;
  published_at: string;
  duration: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  tags: string[];
  category_id: number;
  description: string;
  url: string;
  thumbnail_url: string;
}

export function loadVideos(): Video[] {
  const csvPath = path.join(process.cwd(), "src", "data", "cdanslair_videos.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  return records.map((record: Record<string, string>) => ({
    video_id: record.video_id,
    title: record.title,
    published_at: record.published_at,
    duration: record.duration,
    view_count: parseInt(record.view_count) || 0,
    like_count: parseInt(record.like_count) || 0,
    comment_count: parseInt(record.comment_count) || 0,
    tags: record.tags ? record.tags.split("|").map((t: string) => t.trim()).filter(Boolean) : [],
    category_id: parseInt(record.category_id) || 0,
    description: record.description || "",
    url: record.url,
    thumbnail_url: record.thumbnail_url,
  }));
}

export function getYearFromDate(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

export function getMonthFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function parseDuration(duration: string): number {
  const parts = duration.split(":");
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}
