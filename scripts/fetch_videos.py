"""
fetch_videos.py — Fetch YouTube video metadata for the C dans l'air channel.

Usage:
    cp .env.example .env          # then fill in your API key
    python scripts/fetch_videos.py

The script writes (or updates) cdanslair_videos.csv at the repository root.

Required environment variable (set in scripts/.env or in the shell):
    YOUTUBE_API_KEY   — A valid YouTube Data API v3 key
                        (https://console.cloud.google.com/apis/library/youtube.googleapis.com)
"""

import csv
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass  # python-dotenv is optional; you can export YOUTUBE_API_KEY manually

try:
    from googleapiclient.discovery import build
except ImportError:
    sys.exit(
        "Missing dependency: run  pip install google-api-python-client python-dotenv"
    )

CHANNEL_ID = "UCPl-xKH5JwMHvQv7VrgUJ0A"  # C dans l'air official channel
OUTPUT_CSV = Path(__file__).parent.parent / "cdanslair_videos.csv"

FIELDNAMES = [
    "video_id",
    "title",
    "published_at",
    "duration",
    "view_count",
    "like_count",
    "comment_count",
    "tags",
    "category_id",
    "description",
    "url",
    "thumbnail_url",
]


def get_api_key() -> str:
    key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not key:
        sys.exit(
            "Error: YOUTUBE_API_KEY environment variable is not set.\n"
            "Copy scripts/.env.example to scripts/.env and fill in your key."
        )
    return key


def fetch_channel_videos(youtube, channel_id: str) -> list[dict]:
    """Retrieve all video IDs from a channel's uploads playlist."""
    # Get the uploads playlist ID
    ch_resp = (
        youtube.channels()
        .list(part="contentDetails", id=channel_id)
        .execute()
    )
    if not ch_resp.get("items"):
        sys.exit(f"Error: channel '{channel_id}' not found or API key has no access.")
    uploads_id = ch_resp["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    video_ids: list[str] = []
    next_page_token = None
    while True:
        pl_resp = (
            youtube.playlistItems()
            .list(
                part="contentDetails",
                playlistId=uploads_id,
                maxResults=50,
                pageToken=next_page_token,
            )
            .execute()
        )
        video_ids.extend(
            item["contentDetails"]["videoId"] for item in pl_resp["items"]
        )
        next_page_token = pl_resp.get("nextPageToken")
        if not next_page_token:
            break

    return video_ids


def fetch_video_details(youtube, video_ids: list[str]) -> list[dict]:
    """Fetch detailed metadata for a list of video IDs (in batches of 50)."""
    videos = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = (
            youtube.videos()
            .list(
                part="snippet,contentDetails,statistics",
                id=",".join(batch),
            )
            .execute()
        )
        for item in resp.get("items", []):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            details = item.get("contentDetails", {})
            vid_id = item["id"]
            videos.append(
                {
                    "video_id": vid_id,
                    "title": snippet.get("title", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "duration": details.get("duration", ""),
                    "view_count": stats.get("viewCount", "0"),
                    "like_count": stats.get("likeCount", "0"),
                    "comment_count": stats.get("commentCount", "0"),
                    "tags": "|".join(snippet.get("tags", [])),
                    "category_id": snippet.get("categoryId", ""),
                    "description": snippet.get("description", ""),
                    "url": f"https://www.youtube.com/watch?v={vid_id}",
                    "thumbnail_url": snippet.get("thumbnails", {})
                    .get("hqdefault", {})
                    .get("url", "")
                    or snippet.get("thumbnails", {})
                    .get("high", {})
                    .get("url", ""),
                }
            )
    return videos


def main() -> None:
    api_key = get_api_key()
    youtube = build("youtube", "v3", developerKey=api_key)

    print("Fetching video IDs from channel…")
    video_ids = fetch_channel_videos(youtube, CHANNEL_ID)
    print(f"Found {len(video_ids)} videos.")

    print("Fetching video details…")
    videos = fetch_video_details(youtube, video_ids)
    print(f"Retrieved details for {len(videos)} videos.")

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(videos)

    print(f"Saved to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
