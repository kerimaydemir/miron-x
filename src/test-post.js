require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { XClient } = require('./xclient');

const DATA_PATH = path.join(__dirname, '../data/posted.json');
const text = process.env.TEST_TWEET || 'naber';

function save(id) {
  let posts = [];
  try { posts = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch {}
  posts = posts.slice(-200);
  posts.push({ text, id, ts: new Date().toISOString(), type: 'manual-test' });
  fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2));
}

async function main() {
  const x = new XClient(process.env.XACTIONS_SESSION_COOKIE);
  const result = await x.sendTweet(text);
  save(result.id);
  console.log(`Posted test tweet: ${result.id}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
