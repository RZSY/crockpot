const fs = require('fs');
const path = require('path');
const { load } = require('./harness');

const analyze = load('.');

const data = JSON.parse(fs.readFileSync('C:/Users/User/Downloads/crockpot-failures.json', 'utf8'));

console.log(`Loaded ${data.length} entries from failures dataset.`);

let detectedWrong = 0;
let totalWrong = data.length;

let correctEvaluated = 0;
let cleanCorrect = 0;
let fpByRule = {};

let categoryStats = {};

const t0 = Date.now();

for (let idx = 0; idx < data.length; idx++) {
  const item = data[idx];
  const cat = item.category || 'Uncategorized';
  if (!categoryStats[cat]) {
    categoryStats[cat] = {
      total: 0,
      detectedWrong: 0,
      missedWrong: 0,
      correctEvaluated: 0,
      cleanCorrect: 0,
      fpCount: 0,
      rulesFlaggedOnWrong: {},
      rulesFlaggedOnCorrect: {},
      sampleMisses: []
    };
  }
  const cs = categoryStats[cat];
  cs.total++;

  // Test wrong
  const wrongRes = analyze(item.wrong);
  const isWrongDetected = wrongRes.issues && wrongRes.issues.length > 0;
  if (isWrongDetected) {
    detectedWrong++;
    cs.detectedWrong++;
    for (const iss of wrongRes.issues) {
      cs.rulesFlaggedOnWrong[iss.rule] = (cs.rulesFlaggedOnWrong[iss.rule] || 0) + 1;
    }
  } else {
    cs.missedWrong++;
    if (cs.sampleMisses.length < 5) {
      cs.sampleMisses.push({
        id: item.id,
        wrong: item.wrong,
        correct: item.correct
      });
    }
  }

  // Test correct (if non-null string)
  if (typeof item.correct === 'string' && item.correct.trim().length > 0) {
    correctEvaluated++;
    cs.correctEvaluated++;
    const corrRes = analyze(item.correct);
    if (!corrRes.issues || corrRes.issues.length === 0) {
      cleanCorrect++;
      cs.cleanCorrect++;
    } else {
      cs.fpCount++;
      for (const iss of corrRes.issues) {
        fpByRule[iss.rule] = (fpByRule[iss.rule] || 0) + 1;
        cs.rulesFlaggedOnCorrect[iss.rule] = (cs.rulesFlaggedOnCorrect[iss.rule] || 0) + 1;
      }
    }
  }
}

const elapsed = Date.now() - t0;
console.log(`\nExecution time: ${elapsed}ms (${(elapsed / data.length).toFixed(2)}ms per item)`);
console.log(`\n--- OVERALL RESULTS ---`);
console.log(`Total Wrong Sentences: ${totalWrong}`);
console.log(`Detected: ${detectedWrong} (${((detectedWrong / totalWrong) * 100).toFixed(2)}%)`);
console.log(`Missed: ${totalWrong - detectedWrong} (${(((totalWrong - detectedWrong) / totalWrong) * 100).toFixed(2)}%)`);

console.log(`\nTotal Correct Sentences Evaluated: ${correctEvaluated}`);
console.log(`Clean (Zero Issues): ${cleanCorrect} (${((cleanCorrect / correctEvaluated) * 100).toFixed(2)}%)`);
console.log(`Flagged (Potential FP): ${correctEvaluated - cleanCorrect} (${(((correctEvaluated - cleanCorrect) / correctEvaluated) * 100).toFixed(2)}%)`);

console.log(`\n--- TOP RULES FLAGGING ON CORRECT SENTENCES (FP ANALYSIS) ---`);
const topFpRules = Object.entries(fpByRule).sort((a, b) => b[1] - a[1]);
for (const [r, cnt] of topFpRules.slice(0, 15)) {
  console.log(`  ${r}: ${cnt}`);
}

console.log(`\n--- CATEGORY BREAKDOWN (Sorted by Total Items) ---`);
const sortedCats = Object.entries(categoryStats).sort((a, b) => b[1].total - a[1].total);
for (const [catName, c] of sortedCats.slice(0, 25)) {
  const detRate = ((c.detectedWrong / c.total) * 100).toFixed(1);
  const fpRate = c.correctEvaluated > 0 ? (((c.correctEvaluated - c.cleanCorrect) / c.correctEvaluated) * 100).toFixed(1) : 'N/A';
  console.log(`\nCategory: "${catName}" (n=${c.total})`);
  console.log(`  Wrong Detected: ${c.detectedWrong}/${c.total} (${detRate}%)`);
  console.log(`  Correct Clean: ${c.cleanCorrect}/${c.correctEvaluated} (FP rate: ${fpRate}%)`);
  if (c.sampleMisses.length > 0) {
    console.log(`  Sample Misses:`);
    for (const sm of c.sampleMisses.slice(0, 3)) {
      console.log(`    - ID ${sm.id}: "${sm.wrong}" -> "${sm.correct}"`);
    }
  }
}
