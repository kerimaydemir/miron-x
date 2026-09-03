require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { XClient } = require('./xclient');

const AUDIT_PATH = path.join(__dirname, '../data/tweet_audit_candidates.json');
const RESULT_PATH = path.join(__dirname, '../data/tweet_deletion_results.json');
const apply = process.argv.includes('--apply');

function loadAudit() {
  return JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));
}

async function main() {
  const audit = loadAudit();
  const targets = audit.candidates.filter(item => item.action === 'delete' && item.id);
  console.log(`Reviewed deletion targets: ${targets.length}`);

  if (!apply) {
    console.log('Dry run only. Use --apply with EXPECTED_DELETE_COUNT set to this exact number.');
    return;
  }

  if (String(targets.length) !== process.env.EXPECTED_DELETE_COUNT) {
    throw new Error(`Refusing deletion: EXPECTED_DELETE_COUNT must equal ${targets.length}`);
  }

  const x = new XClient(process.env.XACTIONS_SESSION_COOKIE);
  const results = [];
  for (const target of targets) {
    try {
      await x.deleteTweet(target.id);
      results.push({ id: target.id, status: 'deleted', ts: new Date().toISOString() });
      console.log(`Deleted ${target.id}`);
    } catch (error) {
      results.push({ id: target.id, status: 'failed', error: error.message, ts: new Date().toISOString() });
      console.error(`Failed ${target.id}: ${error.message}`);
    }
    fs.writeFileSync(RESULT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), results }, null, 2));
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
