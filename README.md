# Twitter Scraper API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://twitter-scraper.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Scrape Twitter/X profiles, tweets, and search results. No API key needed. Returns structured JSON with bio, stats, tweets, engagement metrics. The social intelligence layer for AI agents. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "twitter-scraper": {
      "url": "https://twitter-scraper.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl -X POST "https://twitter-scraper.api.klymax402.com/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"username":"..."}'
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `twitter_scrape_profile` | POST | `/api/profile` | $0.005 | Scrape a Twitter/X user profile -- bio, stats, avatar, banner, pinned tweet, verification status. |
| `twitter_search_tweets` | POST | `/api/search` | $0.005 | Search Twitter/X for tweets matching a query -- returns up to 20 results with text, engagement, author, and timestamps. |
| `twitter_get_user_tweets` | POST | `/api/tweets` | $0.005 | Get recent tweets from a specific Twitter/X user -- returns their latest posts with engagement metrics. |

### `twitter_scrape_profile`

Use this when you need to look up a Twitter/X user profile by username or URL. Returns structured profile data including bio, follower/following counts, tweet count, verification status, and recent activity.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `username` | string | yes | Twitter/X username without @ (e.g. 'elonmusk') or full URL (e.g. 'https://x.com/elonmusk') |

**Returns**

- `username` -- the @handle
- `displayName` -- full name
- `bio` -- profile description text
- `followers` -- follower count
- `following` -- following count
- `tweetCount` -- total tweets posted
- `verified` -- blue checkmark status
- `createdAt` -- account creation date
- `avatarUrl` -- profile picture URL
- `bannerUrl` -- header image URL
- `location` -- stated location
- `website` -- linked URL
- `pinnedTweet` -- text of pinned tweet if any

Example response:

```json
{ "username": "elonmusk", "displayName": "Elon Musk", "bio": "...", "followers": 195000000, "following": 850, "tweetCount": 45000, "verified": true, "createdAt": "2009-06-02" }
```

**When to use**: social media due diligence, influencer research, competitor monitoring, or verifying the legitimacy of an account before trusting its content.

**Not for**: tweet search (use `twitter_search_tweets`), trust/security scoring (use `trust_score_evaluate`), email lookup from social (use `email_find_by_name`).

### `twitter_search_tweets`

Use this when you need to find tweets about a topic, brand, event, or keyword. Returns up to 20 recent tweets matching the query with full text, engagement metrics, author info, and timestamps.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | Search query -- supports keywords, phrases, hashtags (#), mentions (@), and operators (from:user, since:2026-01-01) |
| `count` | number | no | Number of tweets to return (1-20, default 10) |

**Returns**

- `query` -- the search term used
- `results` -- array of tweet objects
- `resultCount` -- number of tweets found

Example response:

```json
{ "query": "x402 protocol", "resultCount": 15, "results": [{ "id": "1234567890", "text": "x402 is the future of agent payments...", "author": { "username": "web3dev", "displayName": "Web3 Dev" }, "likes": 42, "retweets": 12, "replies": 5, "views": 1200, "createdAt": "2026-04-13T09:30:00Z" }] }
```

**When to use**: market sentiment analysis, brand monitoring, competitor tracking, news discovery, trend detection, or finding what people say about a topic in real-time.

**Not for**: profile data (use `twitter_scrape_profile`), sentiment analysis of text (use `text_analyze_sentiment`), crypto news (use `crypto_get_news`).

### `twitter_get_user_tweets`

Use this when you need to see what a specific Twitter/X user has been posting recently. Returns their latest tweets with full text, engagement metrics, and timestamps.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `username` | string | yes | Twitter/X username without @ (e.g. 'VitalikButerin') |
| `count` | number | no | Number of tweets to return (1-20, default 10) |

**Returns**

- `username` -- the @handle queried
- `tweets` -- array of tweet objects with id, text, createdAt, likes, retweets, replies, views, isRetweet, isReply
- `tweetCount` -- number of tweets returned

Example response:

```json
{ "username": "VitalikButerin", "tweetCount": 10, "tweets": [{ "id": "...", "text": "Excited about the new EIP proposal...", "likes": 5200, "retweets": 890, "views": 250000, "createdAt": "2026-04-12T14:00:00Z", "isRetweet": false }] }
```

**When to use**: monitoring specific accounts, tracking influencer activity, analyzing posting patterns, or gathering content from thought leaders.

**Not for**: profile bio/stats (use `twitter_scrape_profile`), topic search (use `twitter_search_tweets`), social profile lookup across platforms (use `social_lookup_profile`).

## Example agent prompts

- "Look up a Twitter/X user profile by username or URL"
- "Find tweets about a topic, brand, event, or keyword"
- "See what a specific Twitter/X user has been posting recently"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
