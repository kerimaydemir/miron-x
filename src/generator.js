const axios = require('axios');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const MODEL = process.env.NVIDIA_MODEL || 'qwen/qwen3.5-122b-a10b';
const NVIDIA_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function createCompletion(options) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY is missing');
  const { data } = await axios.post(NVIDIA_ENDPOINT, {
    model: MODEL,
    stream: false,
    ...options,
    chat_template_kwargs: { enable_thinking: false },
  }, {
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    timeout: 60000,
  });
  return data;
}

// Data file paths
const POSTED_PATH   = path.join(__dirname, '../data/posted.json');
const TOP_PATH      = path.join(__dirname, '../data/top_tweets.json');
const TOP_TYPE_PATH = path.join(__dirname, '../data/top_tweets_by_type.json');
const BRAIN_PATH    = path.join(__dirname, '../data/brain_report.json');
const DYN_CFG_PATH  = path.join(__dirname, '../data/dynamic_config.json');

const GLOBAL_MAJOR_KEYWORDS = [
  'openai', 'anthropic', 'google', 'deepmind', 'meta', 'microsoft', 'nvidia',
  'apple', 'tesla', 'xai', 'y combinator', 'yc', 'ai', 'gpt', 'claude',
  'llama', 'funding', 'ipo', 'acquisition', 'regulation', 'agent',
];

const BLOCKED_OUTPUT_PATTERNS = [
  /\b(devlet|hükümet|cumhurbaşkanı|bakan|belediye|parti|iktidar|muhalefet)\b/i,
  /\b(aptal|salak|rezil|hain|çöp|dolandırıcı|yalancı|beceriksiz)\b/i,
  /\b(elon|musk)\b/i,
  /\b(siktir|göt|got|orospu|ibne|piç|pic|tehdit|öldür|oldur)\b/i,
];

const SYSTEM = `You are writing content AS ${config.PERSONA.name}.

BACKGROUND: ${config.PERSONA.background}

VOICE: ${config.PERSONA.voice}

RULES:
${config.TWEET_RULES}`;

const WOLF_SYSTEM = `You are writing content AS ${config.PERSONA.name}.
This is a legacy single-post mode. The new account direction is Turkish founder support, not aggressive identity posting.

RAW VOICE:
Turkish, grounded, disciplined, practical.
Short and memorable without sounding like a motivational poster or a character act.
Helpful to entrepreneurs in Turkey.
No politics. No insults. No personal attacks. No hashtags. No emojis.
Use English-keyboard Turkish most of the time. Do not overuse punctuation.
Max 220 chars.

THEMES:
- Discipline when nobody is watching
- Building before talking
- Surviving uncertainty as a founder
- Focus, patience, and execution
- Making Turkish builders feel less alone`;

// ── Data loaders ─────────────────────────────────────────────────────────────
function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
}
function loadRecentTweets(n = 40) {
  return loadJSON(POSTED_PATH, []).slice(-n);
}
function loadTopTweets() {
  return loadJSON(TOP_PATH, []).slice(0, 8);
}
function loadTopTweetsByType(type) {
  const byType = loadJSON(TOP_TYPE_PATH, {});
  return (byType[type] || []).slice(0, 6);
}
function loadBrainReport() {
  return loadJSON(BRAIN_PATH, null);
}
function loadDynamicConfig() {
  return loadJSON(DYN_CFG_PATH, null);
}

// ── Context builders ──────────────────────────────────────────────────────────
function buildDedupContext(recent) {
  if (!recent.length) return '';
  const summaries = recent
    .map(t => t.text.replace(/^"/, '').replace(/"$/, '').substring(0, 80))
    .join('\n- ');
  return `\nAVOID repeating these recent topics/angles:\n- ${summaries}\n\nWrite something different in topic, framing, rhythm, and opening line.`;
}

function buildStyleContext(tweets) {
  const proven = tweets.filter(t => (t.score || t.likes || 0) > 0);
  if (!proven.length) return '';
  const examples = proven
    .map(t => `[${t.score || t.likes || 0}pts] ${t.text.substring(0, 100)}`)
    .join('\n');
  return `\nHIGH-PERFORMING TWEETS — study their structure, tone, hook style:\n${examples}\n\nMatch this energy. Different topic, same sharpness.`;
}

function buildStyleContextForType(type) {
  const typeTweets = loadTopTweetsByType(type);
  const proven = typeTweets.filter(t => (t.score || t.likes || 0) > 0);
  if (proven.length >= 2) {
    const examples = proven
      .map(t => `[${t.score}pts] ${t.text.substring(0, 100)}`)
      .join('\n');
    return `\nTOP ${type.toUpperCase()} TWEETS — match this exact energy:\n${examples}\n\nDifferent topic, same punch.`;
  }
  return buildStyleContext(loadTopTweets());
}

// ── Similarity check ─────────────────────────────────────────────────────────
function isTooSimilar(newTweet, recent) {
  const newWords = new Set(newTweet.toLowerCase().split(/\s+/).filter(w => w.length > 4));
  for (const t of recent) {
    const oldWords = new Set(t.text.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const overlap = [...newWords].filter(w => oldWords.has(w)).length;
    if (overlap / Math.max(newWords.size, 1) > 0.45) return true;
  }
  return false;
}

// ── Human touch ──────────────────────────────────────────────────────────────
function addHumanTouch(text) {
  text = text.trim();
  text = text.replace(/\p{Extended_Pictographic}/gu, '').trim();
  for (let i = 0; i < 3; i++) {
    text = text.replace(/^["""''`]+/, '').replace(/["""''`]+$/, '').trim();
  }
  text = text.replace(/([.!?])["""'']+$/, '$1');
  text = text.replace(/  +/g, ' ').trim();
  return applyKeyboardStyle(text);
}

function applyKeyboardStyle(text) {
  const preserveTurkish = process.env.QUOTE_MODE === 'true' || Math.random() < 0.2;
  if (!preserveTurkish) {
    text = text
      .replaceAll('ç', 'c').replaceAll('Ç', 'C')
      .replaceAll('ğ', 'g').replaceAll('Ğ', 'G')
      .replaceAll('ı', 'i').replaceAll('İ', 'I')
      .replaceAll('ö', 'o').replaceAll('Ö', 'O')
      .replaceAll('ş', 's').replaceAll('Ş', 'S')
      .replaceAll('ü', 'u').replaceAll('Ü', 'U');
  }

  if (process.env.QUOTE_MODE !== 'true') {
    const marks = text.match(/[.!?,;:]/g) || [];
    if (marks.length > 1) {
      let kept = false;
      text = text.replace(/[.!?,;:]/g, mark => {
        if (!kept) { kept = true; return mark; }
        return '';
      });
    }
  }
  return text.replace(/\s{2,}/g, ' ').trim();
}

// ── Format trend context ──────────────────────────────────────────────────────
function formatTrendContext(trends) {
  return [
    ...trends.hackerNews.slice(0, 5).map(s => `HN (${s.score}pts): ${s.title}`),
    ...trends.rssNews.slice(0, 4).map(n => `${n.source}: ${n.title}`),
  ].join('\n');
}

function hasMajorGlobalSignal(trends) {
  const stories = [
    ...((trends?.hackerNews || []).map(s => ({ title: s.title || '', score: s.score || 0 }))),
    ...((trends?.rssNews || []).map(n => ({ title: n.title || '', score: 60 }))),
  ];
  return stories.some(story => {
    const title = story.title.toLowerCase();
    const hasKeyword = GLOBAL_MAJOR_KEYWORDS.some(kw => title.includes(kw));
    const hasEventVerb = /\b(launch|release|raises|acquires|sues|bans|regulation|gpt|claude|agent|model)\b/i.test(title);
    return hasKeyword && (story.score >= 120 || hasEventVerb);
  });
}

function isProbablyTurkish(text) {
  const lower = ` ${text.toLowerCase()} `;
  const trHints = [' bir ', ' ve ', ' için ', ' degil', ' değil', ' girisim', ' girişim', ' musteri', ' müşteri', ' urun', ' ürün', ' yapay', ' zeka', ' satis', ' satış', ' kurucu'];
  return /[çğıöşüİ]/.test(text) || trHints.some(h => lower.includes(h));
}

function passesSafety(text, { allowEnglish = false, allowEdgy = false } = {}) {
  if (!text || text.includes('SKIP_GLOBAL')) return true;
  if (BLOCKED_OUTPUT_PATTERNS.some(pattern => pattern.test(text))) return false;
  if (!allowEdgy && /\bamk\b/i.test(text)) return false;
  if (!allowEnglish && !isProbablyTurkish(text)) return false;
  if (/\p{Extended_Pictographic}/u.test(text)) return false;
  if (/#\w+/.test(text)) return false;
  return text.length <= 275;
}

// ── Topic pools ───────────────────────────────────────────────────────────────
const SV_TOPICS = [
  'Global AI/startup news and what it means for Turkish builders',
  'OpenAI, Anthropic, Google, Meta, Nvidia: product strategy, not personality drama',
  'Major funding, IPO, acquisition, or model launch and the practical founder lesson',
  'Distribution, product velocity, and AI workflow lessons from global startups',
];

const LONDON_TOPICS = [
  'European startup lessons for Turkish founders',
  'Fintech, AI, and B2B SaaS lessons that can translate to Turkey',
  'Bootstrapping and distribution lessons outside Silicon Valley',
];

// ── Length hint from brain/dynamic config ─────────────────────────────────────
function getLengthHint(dynCfg) {
  if (!dynCfg?.optimalLengthRange) return 'Max 270 chars.';
  const [lo, hi] = dynCfg.optimalLengthRange;
  return `Target length: ${lo}–${hi} chars (data shows this range performs best).`;
}

// ── generateTweet — brain-aware ───────────────────────────────────────────────
async function generateTweet(trends, slotNumber) {
  const recent   = loadRecentTweets(40);
  const brain    = loadBrainReport();
  const dynCfg   = loadDynamicConfig();
  const dedupCtx = buildDedupContext(recent);
  const ctx      = formatTrendContext(trends);

  const isSV     = process.env.SV_MODE     === 'true';
  const isLondon = process.env.LONDON_MODE === 'true';
  const isGlobal = process.env.GLOBAL_MODE === 'true';
  const isDirect = process.env.DIRECT_MODE === 'true';
  const type     = isGlobal ? 'global' : isLondon ? 'london' : isSV ? 'sv' : 'general';

  if (isGlobal && !hasMajorGlobalSignal(trends)) {
    return 'SKIP_GLOBAL';
  }

  // Per-type style examples (learns from own top performers)
  const styleCtx = buildStyleContextForType(type);

  // Adjust temperature based on how well this type is performing
  const mult     = brain?.typeMultipliers?.[type] || 1.0;
  const baseTemp = mult > 1.3 ? 0.82 : mult < 0.7 ? 0.95 : 0.88;

  // Length guidance from brain
  const lengthHint = getLengthHint(dynCfg);

  // Topic pool
  const topicPool = isLondon
    ? [...LONDON_TOPICS, ...config.TOPICS.slice(0, 2)]
    : isSV
    ? [...SV_TOPICS, ...config.TOPICS.slice(0, 2)]
    : config.TOPICS;
  const topicList = topicPool.join('\n- ');

  // High-performing keyword signal from brain
  const kwHint = dynCfg?.topKeywords?.length
    ? `\nHigh-engagement keywords (weave in if natural): ${dynCfg.topKeywords.join(', ')}`
    : '';

  const focus = isSV
    ? ' (Global tech lens — write for Turkish builders unless GLOBAL_MODE is true)'
    : isLondon
    ? ' (European startup lens — write for Turkish builders)'
    : isGlobal
    ? ' (Global mode — write in English only because this is major global tech/startup news. Explain what it means for builders.)'
    : isDirect
    ? ' (Direct mode — firm, energetic Turkish founder voice. Push toward a real action, never toward attacking a person or group.)'
    : '';

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await createCompletion({
      max_tokens: 180,
      temperature: baseTemp + attempt * 0.04,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `Today's trending:\n${ctx}\n\nPossible topic areas:\n- ${topicList}\n${styleCtx}${kwHint}${dedupCtx}\n\nSlot #${slotNumber}${focus}. Pick ONE angle.\nDefault task: write in Turkish for Turkish entrepreneurs. Be useful, practical, specific, and human. For everyday posts use English-keyboard Turkish and zero or one punctuation mark. Keep correct Turkish characters only when a saying or careful line earns them. Do not attack the state, politicians, public institutions, named people, companies, or groups. Do not mention Elon/Musk negatively. Vary the hook style from recent tweets.\n${isDirect ? 'Direct mode may use one non-targeted "amk" at most, but only if it feels natural. Never use siktir, sexual insults, slurs, threats, or insults aimed at anyone.\n' : ''}If GLOBAL_MODE is active, write in English only if the news is genuinely major; otherwise return SKIP_GLOBAL.\n${lengthHint}\nReturn ONLY the raw tweet text. No quotes, no emojis.`,
        },
      ],
    });
    const candidate = addHumanTouch(res.choices[0].message.content.trim());
    if (candidate === 'SKIP_GLOBAL') return candidate;
    if (passesSafety(candidate, { allowEnglish: isGlobal, allowEdgy: isDirect }) && !isTooSimilar(candidate, recent)) return candidate;
    console.log(`  Attempt ${attempt + 1}: too similar, retrying...`);
  }

  // Fallback
  const forcedTopic = config.TOPICS[Math.floor(Math.random() * config.TOPICS.length)];
  const res = await createCompletion({
    max_tokens: 180,
    temperature: 0.95,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Write a Turkish tweet for Turkish entrepreneurs about: ${forcedTopic}\nHelpful, specific, English-keyboard Turkish, little or no punctuation, no politics, no named-person or group attacks. Return ONLY the raw tweet text. No quotes.` },
    ],
  });
  const fallback = addHumanTouch(res.choices[0].message.content.trim());
  return passesSafety(fallback, { allowEnglish: false, allowEdgy: isDirect })
    ? fallback
    : 'Girişimcilikte en pahalı hata ürünü geç çıkarmak değil. Yanlış müşteriye fazla uzun süre inanmaktır.';
}

// ── generateWolfTweet — uses wolf-type top performers ────────────────────────
async function generateWolfTweet() {
  const prompts = [
    'Türkçe tweet: kimse izlemiyorken de işi yapmak.',
    'Türkçe tweet: girişimcinin belirsizlik içinde sakin kalması.',
    'Türkçe tweet: konuşmadan önce ürün, müşteri ve satış üretmek.',
    'Türkçe tweet: yalnız çalışan kurucunun odağını koruması.',
    'Türkçe tweet: zor dönemde disiplini kaybetmemek.',
    'Türkçe tweet: sonuç gelmeden önce sabırla sistem kurmak.',
    'Türkçe tweet: Türk girişimcilerin birbirini daha çok desteklemesi.',
    'Türkçe tweet: küçük ama düzenli ilerlemenin değeri.',
  ];
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Use wolf-specific top performers for style — falls back to generic if none yet
  const styleCtx = buildStyleContextForType('wolf');
  const dynCfg   = loadDynamicConfig();
  const lengthHint = dynCfg?.optimalLengthRange
    ? `Target: ${dynCfg.optimalLengthRange[0]}–${Math.min(dynCfg.optimalLengthRange[1], 220)} chars.`
    : 'Max 220 chars.';

  const res = await createCompletion({
    max_tokens: 140,
    temperature: 0.92,
    messages: [
      { role: 'system', content: WOLF_SYSTEM },
      { role: 'user', content: `${prompt}\n${styleCtx}\n${lengthHint} Return ONLY raw tweet text. No quotes.` },
    ],
  });
  return addHumanTouch(res.choices[0].message.content.trim());
}

// ── generateThread ────────────────────────────────────────────────────────────
async function generateThread(trends) {
  const recent   = loadRecentTweets(20);
  const dedupCtx = buildDedupContext(recent);
  const styleCtx = buildStyleContext(loadTopTweets());
  const ctx      = formatTrendContext(trends);

  const res = await createCompletion({
    max_tokens: 1400,
    temperature: 0.82,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
          content: `Today's trending:\n${ctx}\n${styleCtx}${dedupCtx}\n\nWrite a 5-tweet Turkish thread for Turkish entrepreneurs.\n\n- Tweet 1: Useful hook. Strong but respectful.\n- Tweets 2-4: One practical point each.\n- Tweet 5: Ask a real question that invites founders to reply.\n- Number: "1/" ... "5/"\n- Each max 265 chars\n- No quotes around the tweets\n- No politics, no insults, no named-person attacks\n\nReturn ONLY a JSON array: ["tweet1","tweet2","tweet3","tweet4","tweet5"]`,
      },
    ],
  });
  const text = res.choices[0].message.content.trim();
  try {
    const match  = text.match(/\[[\s\S]*\]/);
    const tweets = match ? JSON.parse(match[0]) : [];
    return tweets.map(t => addHumanTouch(t));
  } catch {
    return text
      .split('\n')
      .filter(l => /^\d+\//.test(l.trim()) || l.includes('/'))
      .map(l => addHumanTouch(l.replace(/^["'\d./\s]+/, '').replace(/[",]+$/, '').trim()))
      .filter(l => l.length > 10)
      .slice(0, 5);
  }
}

// ── generateReply ─────────────────────────────────────────────────────────────
async function generateReply(tweetText, targetAccount) {
  const res = await createCompletion({
    max_tokens: 100,
    temperature: 0.92,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `@${targetAccount} tweeted:\n"${tweetText}"\n\nWrite a SHORT Turkish reply (max 160 chars):\n- Helpful founder angle, practical addition, or respectful question\n- No empty praise like "great point"\n- No politics, no insults, no named-person attack\n- Make Turkish entrepreneurs want to reply\n\nIf nothing useful to say, return: SKIP\nReturn ONLY raw reply text or SKIP.`,
      },
    ],
  });
  const text = addHumanTouch(res.choices[0].message.content.trim());
  return text === 'SKIP' || !passesSafety(text, { allowEnglish: false }) ? null : text;
}

// ── generateMentionReply ──────────────────────────────────────────────────────
async function generateMentionReply(mentionText, fromUsername) {
  const res = await createCompletion({
    max_tokens: 120,
    temperature: 0.88,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `@${fromUsername} replied to Kerim:\n"${mentionText}"\n\nWrite a SHORT Turkish reply (max 180 chars):\n- Be genuinely helpful\n- If they ask a question, answer directly\n- If they share an idea, add one practical next step\n- No hollow thanks, no insults, no politics\n\nIf the comment adds no value, return: SKIP\nReturn ONLY raw reply text or SKIP.`,
      },
    ],
  });
  const text = addHumanTouch(res.choices[0].message.content.trim());
  return text === 'SKIP' || !passesSafety(text, { allowEnglish: false }) ? null : text;
}

// ── generateRepostComment ─────────────────────────────────────────────────────
async function generateRepostComment(tweetText, authorHandle) {
  const res = await createCompletion({
    max_tokens: 100,
    temperature: 0.9,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `@${authorHandle} tweeted:\n"${tweetText}"\n\nKerim wants to quote-tweet this in Turkish for Turkish entrepreneurs.\nWrite max 180 chars. Add a practical founder angle. Not a summary.\nNo politics, no insults, no named-person attack. Respectful but not boring.\nReturn ONLY the raw text. No quotes around it.`,
      },
    ],
  });
  const text = addHumanTouch(res.choices[0].message.content.trim());
  return passesSafety(text, { allowEnglish: false })
    ? text
    : 'Bu tip global hamlelerde asıl soru şu: Türkiye’deki girişimci bunu ürün, satış veya dağıtım avantajına nasıl çevirir?';
}

module.exports = {
  generateTweet,
  generateWolfTweet,
  generateThread,
  generateReply,
  generateMentionReply,
  generateRepostComment,
};
