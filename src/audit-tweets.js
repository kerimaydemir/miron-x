const fs = require('fs');
const path = require('path');

const DEFAULT_POSTED_PATH = path.join(__dirname, '../data/posted.json');
const LIVE_TIMELINE_PATH = path.join(__dirname, '../data/live_timeline.json');
const REPORT_PATH = path.join(__dirname, '../data/tweet_audit_candidates.json');

const RULES = [
  {
    reason: 'named_person_attack_risk',
    pattern: /\b(elon|musk|sama|altman|zuckerberg|bezos)\b/i,
  },
  {
    reason: 'politics_or_state_risk',
    pattern: /\b(devlet|hükümet|cumhurbaşkanı|bakan|belediye|parti|iktidar|muhalefet|government|politician)\b/i,
  },
  {
    reason: 'insult_or_aggressive_language',
    pattern: /\b(amk|aq|siktir|göt|got|stupid|idiot|dumb|scam|fake|clown|aptal|salak|rezil|çöp|hain|beceriksiz)\b/i,
  },
  {
    reason: 'old_global_positioning',
    pattern: /\b(Silicon Valley|SV|YC|London|VC|fundraising|pre-seed)\b/i,
  },
  {
    reason: 'too_generic_motivation',
    pattern: /\b(chaos|pain|wolf|flock|dangerous|excuses|grind)\b/i,
  },
];

function loadPosted() {
  const source = process.env.TWEET_AUDIT_SOURCE === 'live' ? LIVE_TIMELINE_PATH : DEFAULT_POSTED_PATH;
  try {
    const parsed = JSON.parse(fs.readFileSync(source, 'utf8'));
    return Array.isArray(parsed) ? parsed : parsed.tweets || [];
  }
  catch { return []; }
}

function scoreCandidate(tweet) {
  const reasons = RULES
    .filter(rule => rule.pattern.test(tweet.text || ''))
    .map(rule => rule.reason);

  const duplicateTone = /^(AI|The|Most|Founders|Building|Distribution)\b/.test(tweet.text || '');
  if (duplicateTone) reasons.push('repetitive_english_hook');

  return reasons;
}

function actionFor(reasons) {
  if (!reasons.length) return 'keep';
  return 'delete';
}

function main() {
  const posted = loadPosted();
  const candidates = posted
    .map(tweet => ({ tweet, reasons: scoreCandidate(tweet) }))
    .filter(item => item.reasons.length > 0)
    .map(({ tweet, reasons }) => ({
      id: tweet.id,
      ts: tweet.ts,
      type: tweet.type || 'general',
      reasons,
      action: actionFor(reasons),
      text: tweet.text,
      url: tweet.id ? `https://x.com/kerimaydemirco/status/${tweet.id}` : null,
    }));

  const report = {
    updatedAt: new Date().toISOString(),
    totalPosted: posted.length,
    candidateCount: candidates.length,
    source: process.env.TWEET_AUDIT_SOURCE === 'live' ? 'live_timeline' : 'posted',
    note: 'Reviewed cleanup list. The deletion script also requires an exact expected count before it can remove anything from X.',
    candidates,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`Audit candidates: ${candidates.length}/${posted.length}`);
  console.log(`Saved: ${REPORT_PATH}`);
}

if (require.main === module) main();
