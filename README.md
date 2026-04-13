# Twitter Scraper API

**Scrape Twitter/X profiles, tweets, and search results. No API key needed. Structured JSON for AI agents. Powered by x402 micropayments.**

The social intelligence layer AI agents need to monitor Twitter, analyze accounts, and track trends -- all without needing a Twitter API key or OAuth.

## Endpoints

| Endpoint | Price | What it does |
|----------|-------|-------------|
| `POST /api/profile` | $0.005 | Scrape user profile -- bio, stats, avatar, verification |
| `POST /api/search` | $0.005 | Search tweets by keyword, hashtag, or mention |
| `POST /api/tweets` | $0.005 | Get recent tweets from a specific user |

## Example: Profile Lookup

```json
// Request
{ "username": "elonmusk" }

// Response
{
  "username": "elonmusk",
  "displayName": "Elon Musk",
  "bio": "Mars & Cars, Chips & Dips",
  "followers": 195000000,
  "following": 850,
  "tweetCount": 45000,
  "verified": true,
  "createdAt": "June 2009",
  "location": "Austin, TX",
  "website": "https://x.com",
  "pinnedTweet": "..."
}
```

## Example: Tweet Search

```json
// Request
{ "query": "x402 protocol", "count": 5 }

// Response
{
  "query": "x402 protocol",
  "resultCount": 5,
  "results": [
    {
      "id": "1234567890",
      "text": "x402 is changing how agents pay for APIs...",
      "author": { "username": "web3builder", "displayName": "Web3 Builder" },
      "likes": 42,
      "retweets": 12,
      "views": 1200,
      "createdAt": "2026-04-13T09:30:00Z",
      "url": "https://x.com/web3builder/status/1234567890"
    }
  ]
}
```

## Use Cases

- **Brand monitoring**: Track what people say about your brand or product
- **Influencer research**: Analyze follower counts, engagement, posting patterns
- **Market sentiment**: Search for reactions to news, earnings, launches
- **Competitor tracking**: Monitor competitor accounts and their content
- **Due diligence**: Verify social media presence before partnerships
- **Trend detection**: Find emerging topics and viral content

## MCP Integration

```json
{
  "mcpServers": {
    "twitter-scraper": {
      "url": "https://twitter-scraper-production.up.railway.app/mcp",
      "transport": "sse"
    }
  }
}
```

## Payment

Uses x402 protocol. No API keys, no OAuth, no Twitter developer account needed. Your agent pays $0.005 per request in USDC on Base.

## Related APIs

- [Trust Score](https://trust-score-production-ff18.up.railway.app) -- Verify domain/wallet trustworthiness
- [Sentiment Analyzer](https://sentiment-analyzer-production-b1f6.up.railway.app) -- Analyze sentiment of tweet text
- [Social Profile](https://social-profile-x402-production.up.railway.app) -- Multi-platform social lookup
- [Web Search](https://web-search-production-7393.up.railway.app) -- Search the broader web (not just Twitter)
- [Crypto News](https://crypto-news-production-b0f2.up.railway.app) -- Crypto-specific news aggregation
