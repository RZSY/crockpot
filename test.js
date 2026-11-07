// ===============================================================
// Crockpot Headless Automated Test Suite
// Run via: node test.js
// ===============================================================

const { load } = require('./harness');
const analyze = load('.');

let passed = 0;
let failed = 0;
const failures = [];

function assertRule(text, expectedRule, options = {}) {
  const res = analyze(text, options);
  const found = res.issues.some(i => i.rule === expectedRule);
  if (!found) {
    failed++;
    const got = res.issues.map(i => i.rule + '(' + i.original + ')').join(', ') || 'none';
    const msg = `FAIL: "${text}" expected [${expectedRule}], got: [${got}]`;
    failures.push(msg);
    console.error('  x ' + msg);
  } else {
    passed++;
    console.log(`  v PASS: "${text}" -> [${expectedRule}]`);
  }
}

function assertClean(text, label = '', options = {}) {
  const res = analyze(text, options);
  if (res.issues.length > 0) {
    failed++;
    const got = res.issues.map(i => i.rule + '(' + i.original + ' -> ' + (i.suggestions || []).join('|') + ')').join(', ');
    const msg = `FAIL (False Positive): "${text}" expected 0 issues${label ? ' (' + label + ')' : ''}, got: [${got}]`;
    failures.push(msg);
    console.error('  x ' + msg);
  } else {
    passed++;
    console.log(`  v PASS (Clean): "${text}"${label ? ' [' + label + ']' : ''}`);
  }
}

function assertSuggestion(text, expectedSuggestion, options = {}) {
  const res = analyze(text, options);
  const match = res.issues.some(i => (i.suggestions || []).includes(expectedSuggestion));
  if (!match) {
    failed++;
    const got = res.issues.flatMap(i => i.suggestions || []).join(', ') || 'none';
    const msg = `FAIL: "${text}" expected suggestion "${expectedSuggestion}", got: [${got}]`;
    failures.push(msg);
    console.error('  x ' + msg);
  } else {
    passed++;
    console.log(`  v PASS: "${text}" -> suggestion "${expectedSuggestion}"`);
  }
}

console.log('\n=== CROCKPOT TEST SUITE ===\n');

// -------------------------------------------------------------
// 1. CORE GRAMMAR RULES
// -------------------------------------------------------------
console.log('--- 1. Core Grammar Rules ---');
assertRule('This is an test.', 'a-an');
assertRule('He ate a apple.', 'a-an');
assertRule('It took a hour to finish.', 'a-an');
assertClean('It was an honest mistake.');
assertClean('She lives in a European country.');
assertRule('The reports was ready on time.', 'sv-agree');
assertRule('The manager were pleased with the result.', 'sv-agree');
assertRule('She enjoy reading books.', 'sv-agree-s');
assertRule('He dance gracefully.', 'sv-agree-s');
assertRule('They dances together.', 'sv-agree-s');
assertRule('I should of known better.', 'idiom');
assertRule('We could of arrived early.', 'idiom');
assertRule('They would of helped us.', 'idiom');
assertRule('This is more better than that.', 'double-comparative');
assertRule('She is the most fastest runner.', 'double-superlative');
assertRule('I do not know nothing.', 'double-negative');
assertRule('We cannot find nobody.', 'double-negative');
assertRule('I finished my work, it was late.', 'comma-splice');
assertRule('Tom and she is attending the conference.', 'compound-subject');
assertRule('One of the reports are missing.', 'quantifier-agree');

// -------------------------------------------------------------
// 2. CROSS-SENTENCE ISOLATION (ZERO BLEED)
// -------------------------------------------------------------
console.log('\n--- 2. Cross-Sentence Context Isolation ---');
assertRule('The work was finished. He go to the gym.', 'sv-agree-s');
assertClean('I want to. The technician inspected the brake lines.', 'Sentence boundary before brake');
assertClean('He had a. Peace of cake was delicious.', 'Sentence boundary before peace');
assertClean('I will call you. Go to the market tomorrow.', 'Sentence boundary before imperative');
assertRule('He was. Discussed about the problem.', 'verb-prep');
assertClean('He was. Able doing that.', 'Sentence boundary before able');
assertClean('He was. Used to study hard.', 'Sentence boundary before used to');
assertClean('I wanted to. Lack of resources is a major issue.', 'Sentence boundary before lack of');
assertClean('He said no. One never knows.', 'Sentence boundary before one never knows');
assertClean('We wanted peace. Piece by piece we rebuilt.', 'Sentence boundary before piece');
assertClean('The project was great. New members joined.', 'Sentence boundary before new');

// -------------------------------------------------------------
// 3. DANGLING MODIFIERS PRECISION
// -------------------------------------------------------------
console.log('\n--- 3. Dangling Modifiers Precision ---');
assertRule('Walking down the street, the trees looked beautiful.', 'dangling-modifier');
assertRule('Having finished the report, the computer crashed.', 'dangling-modifier');
assertClean('During the storm, the trees blew down.', 'Prepositional during');
assertClean('According to the report, the committee agreed.', 'Prepositional according');
assertClean('To be honest, the team achieved great results.', 'Discourse infinitive');
assertClean('To date, the team has found no errors.', 'Discourse infinitive');
assertClean('Written in 1900, the novel remains popular.', 'Inanimate participle');
assertClean('Covered in mud, the truck arrived at the farm.', 'Inanimate participle');
assertClean('Damaged by the storm, the bridge collapsed.', 'Inanimate participle');

// -------------------------------------------------------------
// 4. CONFUSABLES & HOMOPHONES
// -------------------------------------------------------------
console.log('\n--- 4. Confusables & Homophones ---');
assertRule('Their going to the office.', 'their-theyre');
assertRule('They forgot there tickets.', 'there-their');
assertRule('Your welcome to join us.', 'your-youre');
assertRule('You left you\'re keys on the counter.', 'youre-your');
assertRule('Its a great day.', 'its-it-is');
assertRule('The dog wagged it\'s tail.', 'it-is-its');
assertRule('Better then yesterday.', 'then-than');
assertRule('I do not want to loose my phone.', 'loose-lose');
assertRule('He is loosing his patience.', 'loose-lose');
assertRule('The side affect was unexpected.', 'affect-effect');
assertRule('The law will directly effect us.', 'effect-affect');
assertRule('I cannot except this gift.', 'accept-except');
assertRule('Please except my apologies.', 'accept-except');
assertRule('We invited everyone accept John.', 'accept-except');
assertRule('Please be quite during the film.', 'quite-quiet');
assertRule('He kept quite about the incident.', 'quite-quiet');
assertRule('The film was quiet good.', 'quiet-quite');
assertRule('Let us take a brake.', 'brake-break');
assertRule('He took a brake after lunch.', 'brake-break');
assertRule('She ate a peace of cake.', 'peace-piece');
assertRule('May he rest in piece.', 'peace-piece');
assertRule('We hope for world piece.', 'peace-piece');
assertRule('I will see you next weak.', 'weak-week');
assertClean('They met two weeks ago.');
assertRule('He left a weak ago.', 'weak-week');
assertRule('Please right your name here.', 'right-write');
assertRule('Right down the notes carefully.', 'right-write');
assertRule('The dog wagged its tale.', 'tale-tail');
assertRule('She told a fairy tail.', 'tale-tail');
assertRule('He is the school principle.', 'principal-principle');
assertRule('Integrity is our guiding principal.', 'principal-principle');
assertRule('He refused on principal.', 'principal-principle');
assertRule('They set sale for the island.', 'sale-sail');
assertRule('The house is for sail.', 'sail-sale');
assertRule('She past the exam on her first try.', 'past-passed');
assertRule('His grandfather past away peacefully.', 'past-passed');
assertRule('I cannot here you clearly.', 'here-hear');
assertRule('Please come hear immediately.', 'here-hear');
assertRule('He through the ball into the yard.', 'through-threw');
assertRule('I want to by a new car.', 'by-buy');
assertRule('I advice you to be careful.', 'advice-advise');
assertRule('The whether was terrible.', 'whether-weather');
assertRule('I do not know weather to go.', 'whether-weather');
assertRule('Take a deep breathe and relax.', 'breathe-breath');
assertRule('She ate the hole cake herself.', 'hole-whole');
assertRule('There is know reason to worry.', 'know-no');
assertRule('I was board with the lecture.', 'board-bored');

// -------------------------------------------------------------
// 5. LEARNER-ENGLISH (ESL) RULES
// -------------------------------------------------------------
console.log('\n--- 5. Learner-English (ESL) Rules ---');
assertRule('She wondered where did he go.', 'embedded-question');
assertRule('He asked me can I help him.', 'embedded-question');
assertRule('She is knowing the answer.', 'stative-progressive');
assertRule('He is wanting to leave.', 'stative-progressive');
assertRule('She enjoys to read books.', 'gerund-verb');
assertRule('They avoided to answer the question.', 'gerund-verb');
assertRule('I have seen him yesterday.', 'perfect-past-time');
assertRule('We have completed the task last week.', 'perfect-past-time');
assertRule('If she will come tomorrow, we will talk.', 'will-in-clause');
assertRule('When he will arrive, let me know.', 'will-in-clause');
assertRule('He married with her in June.', 'married-with');
assertRule('She is married with an engineer.', 'adj-prep');
assertRule('They prevented him to enter the building.', 'prevent-from');
assertRule('I look forward to meet you next week.', 'forward-to');
assertRule('They entered into the room quietly.', 'verb-prep');
assertRule('He emphasised on the importance of safety.', 'verb-prep');
assertRule('They discussed about the new plan.', 'verb-prep');
assertRule('She is good in mathematics.', 'adj-prep');
assertRule('He told that he was tired.', 'tell-that');
assertRule('She going to the market.', 'missing-be');
assertRule('They will be arrive soon.', 'will-be-bare');
assertRule('We did it by ourself.', 'ourself-ourselves');
assertRule('In spite the rain, we continued.', 'in-spite-of');
assertRule('He is journalist.', 'art-profession');
assertRule('She works as electrician.', 'art-profession');
assertRule('He visited the Japan last summer.', 'article-kind');
assertRule('They climbed the Mount Everest.', 'article-kind');
assertRule('He helped me to carrying it.', 'to-form');
assertRule('She succeeded to watch the performance.', 'succeed-in');
assertRule('They practise to swim every day.', 'gerund-verb');
assertRule('Mei Ling and me left early.', 'subject-pronoun');
assertClean('Bread and butter is my favourite breakfast.');
assertClean('The meeting is at 5 pm as planned.');
assertClean('The fish were swimming in the pond.');
assertClean('John read the whole book yesterday.');
assertClean('They decided to travel tomorrow.');
assertClean('Did they eat a sandwich two days ago?');
assertClean('He suggested that I run in the park.');
assertClean('I wish I had not eaten so much right now.');

// -------------------------------------------------------------
// 6. BRITISH ENGLISH TRANSLATION SUGGESTIONS
// -------------------------------------------------------------
console.log('\n--- 6. British English Translation Suggestions ---');
assertSuggestion('I love the color of the paint.', 'colour');
assertSuggestion('We need to organize the event.', 'organise');
assertSuggestion('Meet me at the city center.', 'centre');
assertSuggestion('We went to the movie theater.', 'theatre');
assertSuggestion('She traveled across Europe.', 'travelled');
assertSuggestion('Check the car defense mechanism.', 'defence');

// -------------------------------------------------------------
// 7. PUNCTUATION & SPACING RULES
// -------------------------------------------------------------
console.log('\n--- 7. Punctuation & Spacing Rules ---');
assertRule('What is happening???', 'repeated-punct');
assertRule('Here is the office , and the desk.', 'spacing');
assertRule('The the manager said so.', 'repeat');
assertRule('He said (this is a test.', 'brackets');

// -------------------------------------------------------------
// 8. NON-PROSE SKIPPING
// -------------------------------------------------------------
console.log('\n--- 8. Non-Prose Skipping ---');
assertClean('Visit https://example.com/color/organize for details.', 'URL with American spellings');
assertClean('Send mail to editor@example.com for help.', 'Email address');
assertClean('Run `const color = "blue";` in your terminal.', 'Code block with color');
assertClean('The path is C:\\Users\\Name\\Documents\\report.txt.', 'Windows file path');

// -------------------------------------------------------------
// 9. FULL SAMPLE TEXT ANALYSIS
// -------------------------------------------------------------
console.log('\n--- 9. Full Sample Text Analysis ---');
const SAMPLE_TEXT =
  "Their going to the meeting tommorow, but they forgot there keys at you're house. " +
  "The the manager said it was a seperate issue, and wich part of the report is wrong is not cler yet.\n\n" +
  "I should of checked the figures myself. Me and the team was working on it since monday, and " +
  "there is less problems now, but the report were still not finished. He go through the numbers " +
  "every evening, and I seen him do it twice. We could of finished early if the data was " +
  "recieved on time.\n\n" +
  "In order to make a decision at this point in time, we will needs a smaller amount of meetings " +
  "and alot less emails. The final outcome was reviewed by the committee, it was approved on " +
  "friday. Its important that your happy with the color of the new office , and I hope it wont " +
  "be to hard to organize the calendar around it.";

const sampleResult = analyze(SAMPLE_TEXT);
console.log(`  Sample text detected ${sampleResult.issues.length} issues.`);
if (sampleResult.issues.length >= 38) {
  passed++;
  console.log(`  v PASS: Sample text caught ${sampleResult.issues.length} issues (>= 38 required).`);
} else {
  failed++;
  console.error(`  x FAIL: Expected >= 38 issues, got ${sampleResult.issues.length}`);
}

// -------------------------------------------------------------
// 10. PERFORMANCE BENCHMARK
// -------------------------------------------------------------
console.log('\n--- 10. Performance Benchmark ---');
const ITERATIONS = 20;
const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
  analyze(SAMPLE_TEXT);
}
const elapsed = (Date.now() - start) / ITERATIONS;
console.log(`  Average execution time over ${ITERATIONS} runs: ${elapsed.toFixed(2)} ms`);
if (elapsed < 35) {
  passed++;
  console.log(`  v PASS: Benchmark under 35ms threshold (${elapsed.toFixed(2)} ms).`);
} else {
  failed++;
  console.error(`  x FAIL: Benchmark exceeded 35ms threshold (${elapsed.toFixed(2)} ms).`);
}

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================');
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('================================\n');

if (failed > 0) {
  console.error('FAILURES SUMMARY:');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
