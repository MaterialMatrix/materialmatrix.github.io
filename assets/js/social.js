const socialNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const socialText = (tag, className, value) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
};
const socialTitle = (value) => String(value || "Watch on YouTube").replace(/(?:\s*#\S+)+\s*$/u, "").trim() || "Watch on YouTube";
const createSocialVideo = (video) => {
  if (!/^[A-Za-z0-9_-]{11}$/.test(video.id || "")) return null;
  const title = socialTitle(video.title);
  const url = `https://www.youtube.com/watch?v=${video.id}`;
  const card = document.createElement("article");
  card.className = "social-video-card";
  const media = document.createElement("a");
  media.className = "social-video-image";
  media.href = url;
  media.target = "_blank";
  media.rel = "noopener noreferrer";
  media.setAttribute("aria-label", `Watch ${title} on YouTube`);
  const image = document.createElement("img");
  image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  image.alt = "";
  image.loading = "lazy";
  const play = socialText("span", "social-play", "▶");
  play.setAttribute("aria-hidden", "true");
  media.append(image, play);
  const body = document.createElement("div");
  body.className = "social-video-body";
  const views = Number.isFinite(video.viewCount) ? ` · ${socialNumber.format(video.viewCount)} VIEWS` : "";
  body.append(socialText("span", "social-video-meta", `YOUTUBE${views}`));
  const heading = document.createElement("h3");
  const titleLink = socialText("a", "", title);
  titleLink.href = url;
  titleLink.target = "_blank";
  titleLink.rel = "noopener noreferrer";
  heading.append(titleLink);
  const watch = socialText("a", "social-watch", "Watch video ↗");
  watch.setAttribute("aria-label", `Watch ${title} on YouTube`);
  watch.href = url;
  watch.target = "_blank";
  watch.rel = "noopener noreferrer";
  body.append(heading, watch);
  card.append(media, body);
  return card;
};
const updateSocialGrid = (selector, items, limit) => {
  const grid = document.querySelector(selector);
  if (!grid || !Array.isArray(items)) return;
  const cards = items.map(createSocialVideo).filter(Boolean).slice(0, limit);
  if (cards.length) grid.replaceChildren(...cards);
};
const loadSocialStats = async () => {
  try {
    const response = await fetch("data/youtube-stats.json", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    const views = document.querySelector("[data-youtube-views]");
    if (views) views.textContent = Number.isFinite(data.channel?.viewCount) ? socialNumber.format(data.channel.viewCount) : "—";
    const subscribers = document.querySelector("[data-youtube-subs]");
    const videos = document.querySelector("[data-youtube-videos]");
    if (subscribers) subscribers.textContent = Number.isFinite(data.channel?.subscriberCount) ? socialNumber.format(data.channel.subscriberCount) : "—";
    if (videos) videos.textContent = Number.isFinite(data.channel?.videoCount) ? socialNumber.format(data.channel.videoCount) : "—";
    const date = new Date(data.updatedAt);
    const updated = document.querySelector("[data-youtube-updated]");
    if (updated && !Number.isNaN(date.getTime())) updated.textContent = `YouTube figures checked ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}`;
    updateSocialGrid("[data-social-popular]", data.popularVideos, 4);
    updateSocialGrid("[data-social-recent]", data.latestVideos, 3);
    updateSocialGrid("[data-social-featured]", data.featuredVideos, 3);
    const feature = document.querySelector("[data-social-feature]");
    const top = data.popularVideos?.[0];
    if (feature && /^[A-Za-z0-9_-]{11}$/.test(top?.id || "")) {
      const title = socialTitle(top.title);
      feature.href = `https://www.youtube.com/watch?v=${top.id}`;
      feature.setAttribute("aria-label", `Watch ${title} on YouTube`);
      feature.querySelector("img").src = `https://i.ytimg.com/vi/${top.id}/hqdefault.jpg`;
      feature.querySelector("strong").textContent = title;
    }
  } catch {
    // Keep the dated page snapshot visible if updated data is unavailable.
  }
};
loadSocialStats();
