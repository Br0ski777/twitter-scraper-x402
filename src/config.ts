import type { ApiConfig } from "./shared.ts";

export const API_CONFIG: ApiConfig = {
  name: "Twitter Scraper API",
  slug: "twitter-scraper",
  description: "Scrape Twitter/X profiles, tweets, and search results. No API key needed. Returns structured JSON with bio, stats, tweets, engagement metrics. The social intelligence layer for AI agents.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/profile",
      price: "$0.005",
      description: "Scrape a Twitter/X user profile -- bio, stats, avatar, banner, pinned tweet, verification status.",
      toolName: "twitter_scrape_profile",
      toolDescription:
        `Use this when you need to look up a Twitter/X user profile by username or URL. Returns structured profile data including bio, follower/following counts, tweet count, verification status, and recent activity.

1. username: the @handle
2. displayName: full name
3. bio: profile description text
4. followers: follower count
5. following: following count
6. tweetCount: total tweets posted
7. verified: blue checkmark status
8. createdAt: account creation date
9. avatarUrl: profile picture URL
10. bannerUrl: header image URL
11. location: stated location
12. website: linked URL
13. pinnedTweet: text of pinned tweet if any

Example output: { "username": "elonmusk", "displayName": "Elon Musk", "bio": "...", "followers": 195000000, "following": 850, "tweetCount": 45000, "verified": true, "createdAt": "2009-06-02" }

Use this FOR social media due diligence, influencer research, competitor monitoring, or verifying the legitimacy of an account before trusting its content.

Do NOT use for tweet search -- use twitter_search_tweets instead. Do NOT use for trust/security scoring -- use trust_score_evaluate instead. Do NOT use for email lookup from social -- use email_find_by_name instead.`,
      inputSchema: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "Twitter/X username without @ (e.g. 'elonmusk') or full URL (e.g. 'https://x.com/elonmusk')",
          },
        },
        required: ["username"],
      },
    },
    {
      method: "POST",
      path: "/api/search",
      price: "$0.005",
      description: "Search Twitter/X for tweets matching a query -- returns up to 20 results with text, engagement, author, and timestamps.",
      toolName: "twitter_search_tweets",
      toolDescription:
        `Use this when you need to find tweets about a topic, brand, event, or keyword. Returns up to 20 recent tweets matching the query with full text, engagement metrics, author info, and timestamps.

1. query: the search term used
2. results: array of tweet objects
3. Each tweet contains: id, text, author (username + displayName), createdAt, likes, retweets, replies, views, url
4. resultCount: number of tweets found

Example output: { "query": "x402 protocol", "resultCount": 15, "results": [{ "id": "1234567890", "text": "x402 is the future of agent payments...", "author": { "username": "web3dev", "displayName": "Web3 Dev" }, "likes": 42, "retweets": 12, "replies": 5, "views": 1200, "createdAt": "2026-04-13T09:30:00Z" }] }

Use this FOR market sentiment analysis, brand monitoring, competitor tracking, news discovery, trend detection, or finding what people say about a topic in real-time.

Do NOT use for profile data -- use twitter_scrape_profile instead. Do NOT use for web search (non-Twitter) -- use web_search_query instead. Do NOT use for sentiment analysis of text -- use text_analyze_sentiment instead. Do NOT use for crypto news -- use crypto_get_news instead.`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query -- supports keywords, phrases, hashtags (#), mentions (@), and operators (from:user, since:2026-01-01)",
          },
          count: {
            type: "number",
            description: "Number of tweets to return (1-20, default 10)",
          },
        },
        required: ["query"],
      },
    },
    {
      method: "POST",
      path: "/api/tweets",
      price: "$0.005",
      description: "Get recent tweets from a specific Twitter/X user -- returns their latest posts with engagement metrics.",
      toolName: "twitter_get_user_tweets",
      toolDescription:
        `Use this when you need to see what a specific Twitter/X user has been posting recently. Returns their latest tweets with full text, engagement metrics, and timestamps.

1. username: the @handle queried
2. tweets: array of tweet objects with id, text, createdAt, likes, retweets, replies, views, isRetweet, isReply
3. tweetCount: number of tweets returned

Example output: { "username": "VitalikButerin", "tweetCount": 10, "tweets": [{ "id": "...", "text": "Excited about the new EIP proposal...", "likes": 5200, "retweets": 890, "views": 250000, "createdAt": "2026-04-12T14:00:00Z", "isRetweet": false }] }

Use this FOR monitoring specific accounts, tracking influencer activity, analyzing posting patterns, or gathering content from thought leaders.

Do NOT use for profile bio/stats -- use twitter_scrape_profile instead. Do NOT use for topic search -- use twitter_search_tweets instead. Do NOT use for social profile lookup across platforms -- use social_lookup_profile instead.`,
      inputSchema: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "Twitter/X username without @ (e.g. 'VitalikButerin')",
          },
          count: {
            type: "number",
            description: "Number of tweets to return (1-20, default 10)",
          },
        },
        required: ["username"],
      },
    },
  ],
};
