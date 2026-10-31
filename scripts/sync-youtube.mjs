import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Public channel statistics only. The key is used by this offline sync, never
// copied to the generated data file or exposed to visitors.
const apiKey = process.env.YOUTUBE_API_KEY;
const channelId = "UCUGxG8ijx2E5-moiZIkdutg";
const outputPath = process.env.YOUTUBE_OUTPUT_PATH || "data/youtube-stats.json";
const apiBase = "https://www.googleapis.com/youtube/v3/";

if (!apiKey) {
  throw new Error("Missing YOUTUBE_API_KEY. The existing YouTube snapshot was not changed.");
}

const getJson = async (resource, parameters) => {
  const url = new URL(resource, apiBase);
  for (const [key, value] of Object.entries({ ...parameters, key: apiKey })) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    // Never print the URL, which includes the API key.
    throw new Error(`YouTube ${resource} request failed with HTTP ${response.status}.`);
  }
  return response.json();
};

const countOrNull = (value) => {
  if (value === undefined || value === null || !/^\d+$/.test(String(value))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

const channelData = await getJson("channels", {
  part: "snippet,contentDetails,statistics",
  id: channelId,
});
const channel = channelData.items?.[0];
const uploadsId = channel?.contentDetails?.relatedPlaylists?.uploads;
if (channel?.id !== channelId || !uploadsId || !channel.snippet?.title || !channel.statistics) {
  throw new Error("YouTube did not return the expected channel and uploads playlist.");
}

// Playlist pagination gives us all available uploads, rather than the
// incomplete search index, and videos.list supplies public view counts.
const ids = new Set();
const pageTokens = new Set();
let pageToken;
do {
  const page = await getJson("playlistItems", {
    part: "contentDetails",
    playlistId: uploadsId,
    maxResults: 50,
    pageToken,
  });
  if (!Array.isArray(page.items)) throw new Error("Invalid YouTube uploads response.");
  for (const item of page.items) {
    if (item.contentDetails?.videoId) ids.add(item.contentDetails.videoId);
  }
  pageToken = page.nextPageToken;
  if (pageToken && pageTokens.has(pageToken)) throw new Error("Repeated YouTube page token.");
  if (pageToken) pageTokens.add(pageToken);
} while (pageToken);

const uploads = [...ids];
const videos = [];
for (let i = 0; i < uploads.length; i += 50) {
  const page = await getJson("videos", {
    part: "snippet,statistics,status",
    id: uploads.slice(i, i + 50).join(","),
  });
  if (!Array.isArray(page.items)) throw new Error("Invalid YouTube videos response.");
  for (const item of page.items) {
    if (item.status?.privacyStatus !== "public" || item.snippet?.channelId !== channelId) continue;
    const viewCount = countOrNull(item.statistics?.viewCount);
    const snippet = item.snippet;
    if (!item.id || !snippet.title || !snippet.publishedAt) continue;
    videos.push({
      id: item.id,
      title: snippet.title,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
      publishedAt: snippet.publishedAt,
      viewCount,
    });
  }
}

// A partial API result must not silently replace a useful previously saved
// snapshot. Deleted/private uploads can legitimately disappear from videos.list.
if (uploads.length > 0 && videos.length === 0) {
  throw new Error("YouTube returned uploads but no public video details; preserving the existing snapshot.");
}

const latestFirst = (a, b) => b.publishedAt.localeCompare(a.publishedAt);
const featuredIds = ["4ec2by8ciRc", "25wubGnEiwI", "QdXf8u3IVRc"];
const videoById = new Map(videos.map((video) => [video.id, video]));
const payload = {
  updatedAt: new Date().toISOString(),
  channel: {
    id: channelId,
    title: channel.snippet.title,
    url: "https://www.youtube.com/@MaterialMatrix",
    subscriberCount: channel.statistics.hiddenSubscriberCount ? null : countOrNull(channel.statistics.subscriberCount),
    viewCount: countOrNull(channel.statistics.viewCount),
    videoCount: countOrNull(channel.statistics.videoCount),
  },
  popularVideos: videos.filter((video) => video.viewCount !== null)
    .sort((a, b) => b.viewCount - a.viewCount || latestFirst(a, b)).slice(0, 12),
  latestVideos: [...videos].sort(latestFirst).slice(0, 6),
  featuredVideos: featuredIds.map((id) => videoById.get(id)).filter(Boolean),
};

await mkdir(path.dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.${process.pid}.tmp`;
try {
  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(temporaryPath, outputPath);
} finally {
  await rm(temporaryPath, { force: true });
}
console.log(`Updated YouTube snapshot with ${videos.length} public upload(s).`);
