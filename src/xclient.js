// Official X API v2 client using OAuth 1.0a user context.
// Credentials are supplied through environment variables, never browser sessions.

const { TwitterApi } = require('twitter-api-v2');

const USER_FIELDS = ['description', 'public_metrics'];
const TWEET_FIELDS = ['created_at', 'public_metrics', 'author_id', 'referenced_tweets'];

function pageData(page) {
  return page?.data?.data || page?.data || [];
}

function pageMeta(page) {
  return page?.data?.meta || page?.meta || {};
}

function toTweet(tweet) {
  const metrics = tweet.public_metrics || {};
  return {
    id: tweet.id,
    text: tweet.text || '',
    likeCount: metrics.like_count || 0,
    retweetCount: metrics.retweet_count || 0,
    replyCount: metrics.reply_count || 0,
    username: tweet.username,
    timeParsed: tweet.created_at ? new Date(tweet.created_at) : null,
  };
}

class XClient {
  constructor() {
    const required = ['X_API_KEY', 'X_API_KEY_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET'];
    const credentials = Object.fromEntries(required.map((name) => [name, process.env[name]?.trim()]));
    const missing = required.filter((name) => !credentials[name]);
    if (missing.length) throw new Error(`Missing X OAuth secrets: ${missing.join(', ')}`);

    this.client = new TwitterApi({
      appKey: credentials.X_API_KEY,
      appSecret: credentials.X_API_KEY_SECRET,
      accessToken: credentials.X_ACCESS_TOKEN,
      accessSecret: credentials.X_ACCESS_TOKEN_SECRET,
    });
    this.v2 = this.client.v2;
    this._profileCache = new Map();
    this._ownProfile = null;
  }

  async getProfile(username) {
    const clean = username.replace('@', '').toLowerCase();
    if (this._profileCache.has(clean)) return this._profileCache.get(clean);
    const response = await this.v2.userByUsername(clean, { 'user.fields': USER_FIELDS });
    const data = response?.data || response;
    if (!data?.id) throw new Error(`User unavailable: @${clean}`);
    const profile = {
      id: data.id,
      name: data.name || clean,
      username: data.username || clean,
      followersCount: data.public_metrics?.followers_count || 0,
      biography: data.description || '',
    };
    this._profileCache.set(clean, profile);
    return profile;
  }

  async _getOwnProfile() {
    if (this._ownProfile) return this._ownProfile;
    const response = await this.v2.me({ 'user.fields': USER_FIELDS });
    const data = response?.data || response;
    if (!data?.id) throw new Error('Could not resolve the authenticated X account');
    this._ownProfile = {
      id: data.id,
      name: data.name || '',
      username: data.username || '',
      followersCount: data.public_metrics?.followers_count || 0,
      biography: data.description || '',
    };
    this._profileCache.set(this._ownProfile.username.toLowerCase(), this._ownProfile);
    return this._ownProfile;
  }

  async sendTweet(text, options = {}) {
    const payload = { text };
    if (options.replyTo) payload.reply = { in_reply_to_tweet_id: String(options.replyTo) };
    if (options.quoteTweetId) payload.quote_tweet_id = String(options.quoteTweetId);
    const response = await this.v2.tweet(payload);
    const data = response?.data || response;
    if (!data?.id) throw new Error('X API did not return a post ID');
    console.log(`  -> Posted ID: ${data.id}`);
    return { id: data.id };
  }

  async *getTweets(username, limit = 10) {
    const profile = await this.getProfile(username);
    let paginationToken;
    let yielded = 0;
    while (yielded < limit) {
      const page = await this.v2.userTimeline(profile.id, {
        max_results: Math.max(5, Math.min(100, limit - yielded)),
        'tweet.fields': TWEET_FIELDS,
        exclude: ['retweets'],
        ...(paginationToken ? { pagination_token: paginationToken } : {}),
      });
      for (const tweet of pageData(page)) {
        yield toTweet(tweet);
        yielded += 1;
        if (yielded >= limit) return;
      }
      paginationToken = pageMeta(page).next_token;
      if (!paginationToken) return;
    }
  }

  async deleteTweet(tweetId) {
    const id = String(tweetId || '');
    if (!/^\d+$/.test(id)) throw new Error('deleteTweet requires a numeric post ID');
    const response = await this.v2.deleteTweet(id);
    const data = response?.data || response;
    if (data?.deleted === false) throw new Error(`X API did not delete post ${id}`);
    return data || { id, deleted: true };
  }

  async getTweetById(tweetId) {
    const response = await this.v2.singleTweet(String(tweetId), { 'tweet.fields': TWEET_FIELDS });
    const data = response?.data || response;
    return data?.id ? {
      id: data.id,
      text: data.text || '',
      likes: data.public_metrics?.like_count || 0,
      retweets: data.public_metrics?.retweet_count || 0,
      replies: data.public_metrics?.reply_count || 0,
    } : null;
  }

  async *searchTweets(query, limit = 20) {
    let paginationToken;
    let yielded = 0;
    while (yielded < limit) {
      const page = await this.v2.search(query, {
        max_results: Math.max(10, Math.min(100, limit - yielded)),
        'tweet.fields': TWEET_FIELDS,
        expansions: ['author_id'],
        'user.fields': ['username'],
        ...(paginationToken ? { next_token: paginationToken } : {}),
      });
      const users = new Map((page?.includes?.users || []).map((user) => [user.id, user.username]));
      for (const tweet of pageData(page)) {
        const result = toTweet(tweet);
        result.username = users.get(tweet.author_id) || '';
        yield result;
        yielded += 1;
        if (yielded >= limit) return;
      }
      paginationToken = pageMeta(page).next_token;
      if (!paginationToken) return;
    }
  }

  async *getMentions(handle, limit = 30) {
    const profile = await this.getProfile(handle);
    let paginationToken;
    let yielded = 0;
    while (yielded < limit) {
      const page = await this.v2.userMentionTimeline(profile.id, {
        max_results: Math.max(5, Math.min(100, limit - yielded)),
        'tweet.fields': TWEET_FIELDS,
        expansions: ['author_id'],
        'user.fields': ['username'],
        ...(paginationToken ? { pagination_token: paginationToken } : {}),
      });
      const users = new Map((page?.includes?.users || []).map((user) => [user.id, user.username]));
      for (const tweet of pageData(page)) {
        const result = toTweet(tweet);
        result.username = users.get(tweet.author_id) || '';
        if (result.username.toLowerCase() !== profile.username.toLowerCase()) {
          yield result;
          yielded += 1;
          if (yielded >= limit) return;
        }
      }
      paginationToken = pageMeta(page).next_token;
      if (!paginationToken) return;
    }
  }

  async likeTweet(tweetId) {
    const own = await this._getOwnProfile();
    return this.v2.like(own.id, String(tweetId));
  }

  async retweet(tweetId) {
    const own = await this._getOwnProfile();
    return this.v2.retweet(own.id, String(tweetId));
  }

  async followUser(username) {
    const [own, target] = await Promise.all([this._getOwnProfile(), this.getProfile(username)]);
    return this.v2.follow(own.id, target.id);
  }
}

module.exports = { XClient };
