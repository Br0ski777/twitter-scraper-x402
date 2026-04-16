import type { Hono } from "hono";

// ─── Cache ──────────────────────────────────────────────────────────────────

interface CacheEntry { data: any; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 120_000; // 2 min

function cached<T>(key: string): T | null {
  const e = cache.get(key);
  return e && Date.now() - e.ts < CACHE_TTL ? (e.data as T) : null;
}
function setCache(key: string, data: any) { cache.set(key, { data, ts: Date.now() }); }

// ─── Helpers ────────────────────────────────────────────────────────────────

function cleanUsername(input: string): string {
  let u = input.trim();
  // Handle full URLs
  if (u.includes("twitter.com/") || u.includes("x.com/")) {
    const match = u.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/);
    if (match) u = match[1];
  }
  return u.replace(/^@/, "");
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Nitter Instances (public, no auth needed) ──────────────────────────────

const NITTER_INSTANCES = [
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.cz",
  "https://nitter.net",
];

async function fetchWithFallback(path: string): Promise<string | null> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const resp = await fetch(`${instance}${path}`, {
        headers: HEADERS,
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        return await resp.text();
      }
    } catch { /* try next */ }
  }
  return null;
}

// ─── Twitter Syndication API (public, no auth) ─────────────────────────────

async function fetchSyndication(screenName: string): Promise<any | null> {
  try {
    // Twitter syndication timeline endpoint — public, no auth
    const resp = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${screenName}`,
      {
        headers: {
          ...HEADERS,
          "Referer": "https://platform.twitter.com/",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!resp.ok) return null;
    return await resp.text();
  } catch { return null; }
}

// ─── Profile Scraping ──────────────────────────────────────────────────────

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  tweetCount: number;
  verified: boolean;
  createdAt: string;
  avatarUrl: string;
  bannerUrl: string;
  location: string;
  website: string;
  pinnedTweet: string | null;
}

function parseNumber(text: string): number {
  if (!text) return 0;
  text = text.trim().replace(/,/g, "");
  const multipliers: Record<string, number> = { K: 1000, M: 1000000, B: 1000000000 };
  const match = text.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const mult = match[2] ? multipliers[match[2].toUpperCase()] || 1 : 1;
  return Math.round(num * mult);
}

async function scrapeProfile(username: string): Promise<ProfileData> {
  const cacheKey = `profile_${username}`;
  const c = cached<ProfileData>(cacheKey);
  if (c) return c;

  // Try Nitter first
  const html = await fetchWithFallback(`/${username}`);

  if (html) {
    const getName = (h: string) => {
      const m = h.match(/<a[^>]*class="[^"]*profile-card-fullname[^"]*"[^>]*>([^<]*)</);
      return m?.[1]?.trim() || username;
    };
    const getBio = (h: string) => {
      const m = h.match(/<p[^>]*class="[^"]*profile-bio[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      return m?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
    };
    const getStats = (h: string) => {
      const stats: number[] = [];
      const matches = h.matchAll(/class="[^"]*profile-stat-num[^"]*"[^>]*>([\d,.KMB]+)/gi);
      for (const m of matches) stats.push(parseNumber(m[1]));
      return stats;
    };
    const getAvatar = (h: string) => {
      const m = h.match(/<a[^>]*class="[^"]*profile-card-avatar[^"]*"[^>]*href="([^"]+)"/);
      return m?.[1] || "";
    };
    const getBanner = (h: string) => {
      const m = h.match(/<div[^>]*class="[^"]*profile-banner[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"/);
      return m?.[1] || "";
    };
    const getLocation = (h: string) => {
      const m = h.match(/<span[^>]*class="[^"]*profile-location[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      return m?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
    };
    const getWebsite = (h: string) => {
      const m = h.match(/<a[^>]*class="[^"]*profile-website[^"]*"[^>]*href="([^"]+)"/);
      return m?.[1] || "";
    };
    const getJoined = (h: string) => {
      const m = h.match(/Joined\s*(\w+\s+\d{4})/);
      return m?.[1] || "";
    };
    const getPinnedTweet = (h: string) => {
      const m = h.match(/<div[^>]*class="[^"]*pinned[^"]*"[\s\S]*?<div[^>]*class="[^"]*tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      return m?.[1]?.replace(/<[^>]+>/g, "").trim() || null;
    };

    const stats = getStats(html);
    const result: ProfileData = {
      username,
      displayName: getName(html),
      bio: getBio(html),
      followers: stats[1] || 0,
      following: stats[2] || 0,
      tweetCount: stats[0] || 0,
      verified: html.includes("verified-icon") || html.includes("icon-ok"),
      createdAt: getJoined(html),
      avatarUrl: getAvatar(html),
      bannerUrl: getBanner(html),
      location: getLocation(html),
      website: getWebsite(html),
      pinnedTweet: getPinnedTweet(html),
    };

    setCache(cacheKey, result);
    return result;
  }

  // Fallback: try syndication
  const synHtml = await fetchSyndication(username);
  if (synHtml) {
    // Parse basic info from syndication HTML
    const nameMatch = synHtml.match(/data-screen-name="([^"]+)"/);
    const displayMatch = synHtml.match(/<span[^>]*class="[^"]*TweetAuthor-name[^"]*"[^>]*>([^<]+)/);

    const result: ProfileData = {
      username: nameMatch?.[1] || username,
      displayName: displayMatch?.[1]?.trim() || username,
      bio: "",
      followers: 0,
      following: 0,
      tweetCount: 0,
      verified: synHtml.includes("verified") || synHtml.includes("badge"),
      createdAt: "",
      avatarUrl: "",
      bannerUrl: "",
      location: "",
      website: "",
      pinnedTweet: null,
    };
    setCache(cacheKey, result);
    return result;
  }

  throw new Error(`Could not fetch profile for @${username}. Twitter may be rate-limiting or the account doesn't exist.`);
}

// ─── Tweet Search ──────────────────────────────────────────────────────────

interface TweetData {
  id: string;
  text: string;
  author: { username: string; displayName: string };
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  url: string;
  isRetweet: boolean;
  isReply: boolean;
}

async function searchTweets(query: string, count: number = 10): Promise<{ query: string; resultCount: number; results: TweetData[] }> {
  const cacheKey = `search_${query}_${count}`;
  const c = cached<any>(cacheKey);
  if (c) return c;

  const encodedQuery = encodeURIComponent(query);
  const html = await fetchWithFallback(`/search?f=tweets&q=${encodedQuery}`);

  if (!html) {
    throw new Error(`Search failed for "${query}". Twitter/Nitter may be temporarily unavailable.`);
  }

  const tweets = parseTweetsFromHtml(html).slice(0, Math.min(count, 20));
  const result = { query, resultCount: tweets.length, results: tweets, timestamp: new Date().toISOString(), cachedFor: "2m" };
  setCache(cacheKey, result);
  return result;
}

// ─── User Tweets ───────────────────────────────────────────────────────────

async function getUserTweets(username: string, count: number = 10): Promise<{ username: string; tweetCount: number; tweets: TweetData[] }> {
  const cacheKey = `tweets_${username}_${count}`;
  const c = cached<any>(cacheKey);
  if (c) return c;

  const html = await fetchWithFallback(`/${username}`);

  if (!html) {
    throw new Error(`Could not fetch tweets for @${username}. Account may not exist or Twitter is rate-limiting.`);
  }

  const tweets = parseTweetsFromHtml(html).slice(0, Math.min(count, 20));
  const result = { username, tweetCount: tweets.length, tweets, timestamp: new Date().toISOString(), cachedFor: "2m" };
  setCache(cacheKey, result);
  return result;
}

// ─── HTML Parser ───────────────────────────────────────────────────────────

function parseTweetsFromHtml(html: string): TweetData[] {
  const tweets: TweetData[] = [];
  // Match individual tweet containers
  const tweetBlocks = html.split(/class="[^"]*timeline-item[^"]*"/);

  for (let i = 1; i < tweetBlocks.length && tweets.length < 20; i++) {
    const block = tweetBlocks[i];

    // Extract tweet link/id
    const linkMatch = block.match(/href="\/([^/]+)\/status\/(\d+)/);
    if (!linkMatch) continue;

    const authorUsername = linkMatch[1];
    const tweetId = linkMatch[2];

    // Extract display name
    const nameMatch = block.match(/class="[^"]*fullname[^"]*"[^>]*>([^<]+)/);
    const displayName = nameMatch?.[1]?.trim() || authorUsername;

    // Extract tweet text
    const textMatch = block.match(/class="[^"]*tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text = textMatch?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

    if (!text) continue;

    // Extract date
    const dateMatch = block.match(/title="([^"]+)"/);
    const createdAt = dateMatch?.[1] || "";

    // Extract stats
    const statsMatches = [...block.matchAll(/class="[^"]*icon-(?:comment|retweet|heart|play)[^"]*"[^>]*>[^<]*<\/span>\s*<span[^>]*>([\d,.KMB]*)/gi)];
    const replies = parseNumber(statsMatches[0]?.[1] || "0");
    const retweets = parseNumber(statsMatches[1]?.[1] || "0");
    const likes = parseNumber(statsMatches[2]?.[1] || "0");
    const views = parseNumber(statsMatches[3]?.[1] || "0");

    const isRetweet = block.includes("retweted") || block.includes("retweeted");
    const isReply = block.includes("replying to") || block.includes("reply-to");

    tweets.push({
      id: tweetId,
      text,
      author: { username: authorUsername, displayName },
      createdAt,
      likes,
      retweets,
      replies,
      views,
      url: `https://x.com/${authorUsername}/status/${tweetId}`,
      isRetweet,
      isReply,
    });
  }

  return tweets;
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// ─── Internal Routes (no x402, key-protected) ─────────────────────────────

const INTERNAL_KEY = process.env.INTERNAL_KEY || "x402-internal-7cfE-bot";

export function registerInternalRoutes(app: Hono) {
  app.post("/internal/search", async (c) => {
    if (c.req.header("x-internal-key") !== INTERNAL_KEY) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const body = await c.req.json().catch(() => null);
    if (!body?.query) return c.json({ error: "Missing query" }, 400);
    try {
      return c.json(await searchTweets(body.query.trim(), Math.min(body.count || 10, 20)));
    } catch (e: any) {
      return c.json({ error: e.message }, 502);
    }
  });
}

export function registerRoutes(app: Hono) {
  // Profile scraping
  app.post("/api/profile", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.username) {
      return c.json({ error: "Missing required field: username" }, 400);
    }

    const username = cleanUsername(body.username);
    if (!username || username.length > 30) {
      return c.json({ error: "Invalid username" }, 400);
    }

    try {
      const profile = await scrapeProfile(username);
      return c.json(profile);
    } catch (e: any) {
      return c.json({ error: e.message }, 502);
    }
  });

  // Tweet search
  app.post("/api/search", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.query) {
      return c.json({ error: "Missing required field: query" }, 400);
    }

    const query: string = body.query.trim();
    const count = Math.min(Math.max(body.count || 10, 1), 20);

    if (query.length < 2 || query.length > 200) {
      return c.json({ error: "Query must be 2-200 characters" }, 400);
    }

    try {
      const results = await searchTweets(query, count);
      return c.json(results);
    } catch (e: any) {
      return c.json({ error: e.message }, 502);
    }
  });

  // User tweets
  app.post("/api/tweets", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.username) {
      return c.json({ error: "Missing required field: username" }, 400);
    }

    const username = cleanUsername(body.username);
    const count = Math.min(Math.max(body.count || 10, 1), 20);

    if (!username || username.length > 30) {
      return c.json({ error: "Invalid username" }, 400);
    }

    try {
      const results = await getUserTweets(username, count);
      return c.json(results);
    } catch (e: any) {
      return c.json({ error: e.message }, 502);
    }
  });
}
