require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { XClient } = require('./xclient');

const OUTPUT_PATH = path.join(__dirname, '../data/live_timeline.json');
const limit = Math.min(Math.max(Number(process.env.TIMELINE_LIMIT || 800), 20), 1200);

async function main() {
  const x = new XClient();
  const tweets = [];
  for await (const tweet of x.getTweets(config.HANDLE, limit)) {
    tweets.push({
      id: tweet.id,
      text: tweet.text,
      ts: tweet.timeParsed.toISOString(),
      likes: tweet.likeCount,
      retweets: tweet.retweetCount,
      replies: tweet.replyCount,
      url: `https://x.com/${config.HANDLE}/status/${tweet.id}`,
    });
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    updatedAt: new Date().toISOString(),
    handle: config.HANDLE,
    count: tweets.length,
    tweets,
  }, null, 2));
  console.log(`Synced ${tweets.length} live tweets to ${OUTPUT_PATH}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
