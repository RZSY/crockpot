# AGENTS.md — AI Agent & Contributor Guidelines for Crockpot

Welcome to the **Crockpot** repository. This document serves as the primary system specification and operating guide for AI coding agents and human contributors interacting with this codebase.

---

## 1. Project Overview & Philosophy

**Crockpot** is an automated, client-side, zero-dependency British English writing assistant and document analysis tool built as a Progressive Web Application (PWA).

### Core Principles
- **Zero External Dependencies / No Build Step**: Crockpot uses pure vanilla HTML5, CSS3, and modern ECMAScript (ES6+). There is no npm package manifest, no bundler (Webpack/Vite/Rollup), and no transpiler (Babel/TypeScript). The repository files serve directly to the browser.
- **Privacy & Local Execution**: All tokenization, spell-checking, grammar parsing, ESL detection, and document scoring occur entirely on the client side in real time (< 15–30ms for standard documents). No text is ever sent over the network.
- **Deterministic, Rule-Based NLP**: There are no machine learning models or remote LLM calls. Crockpot relies on curated frequency lexicons, phonetic indexing (Double Metaphone, Soundex, consonant skeleton), Damerau-Levenshtein edit distances, morphological inflections, and deterministic grammatical/syntactic parsers.
- **High Precision Over Recall**: Every stage is permitted to say "I don't know". Crockpot favors staying silent over firing false positives. Rules only trigger when context is unambiguous.
- **British English Native**: The dictionary and grammar conventions default to British English (e.g., *colour*, *organise*, *theatre*), with built-in American-to-British translation suggestions.

---

## 2. Architecture & Pipeline

### Strict Script Evaluation Sequence
Because scripts run directly in the browser via standard `<script>` tags, top-level definitions share the global window context. **The load order is strict and must be maintained across both browser entry (`index.html`) and Node test harness (`harness.js`)**:

```text
dictionary.js
      |
      v
  lexicon.js
      |
      v
spelling-engine.js
      |
      v
 tokenizer.js
      |
      v
confusables.js
      |
      v
grammar-rules.js
      |
      v
  esl-rules.js
      |
      v
   parser.js
      |
      v
punctuation.js
      |
      v
document-analysis.js
```

### Module Breakdown

| File | Purpose & Architecture | Key Symbols & Exports |
|---|---|---|
| `dictionary.js` | 114,500+ British English words ordered by frequency. | `WORD_LIST`, `DICTIONARY` (`Set`), `RANK` (`Map`). |
| `lexicon.js` | Morphology, irregular verb/noun tables, POS classifiers, set helpers. | `S()`, `isBaseVerb()`, `isPastForm()`, `isThirdPersonVerb()`, `isAdjective()`, `isAdverb()`, `isPluralNoun()`, `isFiniteVerb()`, `BE_FORMS`, `MODALS`, etc. |
| `spelling-engine.js` | Suggestion generator using QWERTY keyboard adjacency, Damerau-Levenshtein, Double Metaphone, consonant skeletons, contractions, texting/rebus de-leeting, and American-to-British mapping. | `suggestFor()`, `spellingKnown()`, `americanSpelling()`, `informalExpansion()`, `rareWordConfusion()`. |
| `tokenizer.js` | Regex-based word tokenizer and abbreviation-aware sentence boundary splitter. | `tokenize(text)`, `splitSentences(text, tokens)`, `ABBREVIATIONS`. |
| `confusables.js` | Tables of homophones and frequently confused word pairs/triplets. | `HOMOPHONE_GROUPS`, `HOMOPHONE_MAP`, `HANDLED_CONTEXTUALLY`. |
| `grammar-rules.js` | Core English grammar checks (a/an sound rules, subject-verb agreement, modal verbs, double comparatives/superlatives, passive forms, comma splices). | `grammarIssues(text, tokens, sentences, add)`. |
| `esl-rules.js` | Second-language (ESL/EFL) specific patterns (embedded questions, stative progressives, gerund vs infinitive complementation, tense/marker clashes, collocations, false prepositions). | `eslIssues(text, tokens, sentences, add)`. |
| `parser.js` | Self-contained POS tagger, chunker (NP/VP/PP), and clause finder (`PARSER` IIFE) for long-distance syntactic agreement and adverbial modifiers. | `PARSER` (`parseDocument()`, `parserIssues()`, `extend()`). |
| `punctuation.js` | Character-level regex checks for spacing before/after punctuation, double punctuation, unbalanced quotes/brackets, repeated words, and whitespace runs. | `punctuationIssues(text, add)`. |
| `document-analysis.js` | Master analysis pipeline, non-prose skipping, syllable counting, Flesch Reading Ease & grade level calculation, issue deduplication, and 0–100 document scoring. | `analyze(rawText, options)`, `computeReadability()`. |
| `ui.js` | DOM binding, transparent textarea overlay on visual highlight backdrop, interactive margin notes, filters, fix-all, undo history stack, and card alignment. | `render()`, `remember()`, `editor`, `highlights`, `notesEl`. |
| `dmode.js` | Dark mode manager with OS system preference listener (`prefers-color-scheme`) and `localStorage` persistence. | Self-executing IIFE managing `data-theme="dark"`. |
| `sw.js` | Service Worker implementing Cache-First / Stale-While-Revalidate for offline PWA operation. | `VERSION`, `CACHE_NAME`, `APP_SHELL`. |
| `harness.js` | Node.js headless environment using `node:vm` to bundle and run the 10 engine scripts in order. | `load(dir)` returning `analyze`. |

---

## 3. Data Structures & Schemas

### Token Schema
```javascript
{
  raw: "Running",          // Original token text preserving casing
  lw: "running",           // Lowercase string (curly apostrophes normalized)
  start: 0,                // Absolute character index start in document
  end: 7,                  // Absolute character index end in document
  s: 0,                    // Sentence index (0-based)
  i: 0                     // Token index within the sentence (0-based)
}
```

### Sentence Schema
```javascript
{
  start: 0,                // Character start in document
  end: 32,                 // Character end in document
  tokStart: 0,             // Index of first token in tokens array
  tokEnd: 6                // Index of last token (exclusive)
}
```

### Issue Schema
All rules report issues via an `add(issue)` callback conforming to:
```javascript
{
  cat: "grammar",          // Category: "spelling" | "grammar" | "punctuation" | "confusable" | "style"
  rule: "a-an",            // Unique rule identifier string
  severity: "critical",    // "critical" (red/urgent) | "advisory" (yellow/clarity)
  start: 8,                // Start character offset in document
  end: 10,                 // End character offset in document
  original: "an",          // Substring being flagged
  suggestions: ["a"],      // Array of suggested replacement strings
  title: "Use 'a' before a consonant sound", // Short header for margin note
  why: "'test' begins with a consonant sound, so it takes 'a'.", // Human-friendly rationale
  key: "grammar|a-an|8|10" // Generated unique deduplication key
}
```

### Category Priority Order for Overlaps
When two issues overlap in document character range, `document-analysis.js` keeps the higher priority issue:
$$\text{spelling (4)} > \text{grammar (3)} > \text{punctuation (2)} > \text{confusable (1)} > \text{style (0)}$$

### `analyze(text, options)` Contract
**Options:**
- `userDictionary`: `Set<string>` — custom words to accept without flagging as spelling errors.
- `ignoreAmerican`: `boolean` — if `true`, skips flagging American spellings (e.g. *color*).
- `flagConfusables`: `boolean` — if `true`, enables advisory checks on general homophone sets.

**Return Object:**
```javascript
{
  tokens: Array<Token>,
  sentences: Array<Sentence>,
  issues: Array<Issue>,
  truncated: boolean,      // true if text exceeded MAX_CHECK_LEN (2,000,000 chars)
  stats: {
    words: number,
    chars: number,
    sentences: number,
    readability: number,   // Flesch Reading Ease (0-100)
    score: number | null,  // Composite writing quality score (0-100)
    readingTime: number,   // Reading time in minutes (~225 wpm)
    ease: number,
    grade: number,         // Approximate school grade
    gradeLabel: string,    // Human-readable stage ("reception", "secondary", etc.)
    wordsPerSentence: number,
    syllablesPerWord: number,
    easeProvisional: boolean
  }
}
```

---

## 4. Execution, Development & Testing

### Headless Verification with Node.js
You can run automated headless tests on the engine using `harness.js` without any external test framework or browser:

```powershell
# One-line test run
node -e "const { load } = require('./harness'); const analyze = load('.'); console.log(analyze('This is an test.'));"
```

To run an automated test assertion script:
```javascript
const { load } = require('./harness');
const analyze = load('.');

function assertRule(text, expectedRule) {
  const { issues } = analyze(text);
  const found = issues.some(i => i.rule === expectedRule);
  if (!found) {
    console.error(`FAIL: "${text}" expected rule "${expectedRule}", got:`, issues.map(i => i.rule));
    process.exit(1);
  }
  console.log(`PASS: "${text}" -> [${expectedRule}]`);
}

assertRule("This is an test.", "a-an");
assertRule("I have seen it yesterday.", "perfect-past-time");
assertRule("She enjoy reading books.", "sv-agree-s");
assertRule("Their going home.", "their-theyre");
```

### Browser Verification
To test UI interactions, PWA behaviors, and stylesheet rendering:
```powershell
# Use any lightweight local web server
npx serve .
# Or via Python
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

---

## 5. Agent Rules of Engagement & Code Conventions

When making changes to this repository, agents must strictly follow these instructions:

### 1. Maintain the Zero-Dependency Policy
- Never create `package.json`, install npm packages, or introduce build tools unless explicitly instructed by the user.
- Keep all algorithms self-contained in standard JavaScript.

### 2. Synchronize Loading Lists
If you add or rename an engine script:
1. Add `<script src="new-file.js"></script>` to `index.html` in the correct dependency position.
2. Add `"new-file"` to the `order` array in `harness.js`.
3. Add `"./new-file.js"` to `APP_SHELL` in `sw.js`.

### 3. Service Worker Cache Busting
Whenever modifying any asset in `APP_SHELL` (`index.html`, `styles.css`, or any `.js` file):
- Increment `VERSION` in `sw.js` (e.g. `const VERSION = "1.4.1";`).
- Update the version string in `index.html` (e.g., `<span class="version-tag">Crockpot Beta 1.4.1</span>`).
- Failing to do this causes the browser to serve stale cached assets from the Service Worker.

### 4. Textarea & Backdrop Alignment
In `styles.css`, `#editor` and `.backdrop .highlights` must have **identical**:
- `font-family`
- `font-size`
- `line-height`
- `padding`
- `letter-spacing`
- `border-width`
- `box-sizing`
Any drift between these elements causes visual desynchronization between the text cursor and the underlying color highlights.

### 5. Skip Non-Prose Ranges
Do not flag spelling or grammar issues inside non-prose regions:
- URLs (`https://...`, `www....`)
- Email addresses
- Domain names
- Markdown code blocks (`` `code` ``)
- File system paths (`/usr/bin`, `C:\...`)
`document-analysis.js` automatically creates `skipRanges`. Custom rules must ensure `inSkipRange(start, end)` is respected.

### 6. Case Preservation in Suggestions
When proposing fixes, always preserve the user's original casing (e.g., TitleCase if the original token was TitleCase). Use the helper functions:
- `matchCase(original, replacement)` in `grammar-rules.js`
- `eslMatchCase(original, replacement)` in `esl-rules.js`

### 7. Global Scope & Set Helper
- Use `const S = str => new Set(str.trim().split(/\s+/));` for fast $O(1)$ set lookups of word lists.
- Avoid polluting the global scope with ambiguous variable names. Encapsulate complex subsystems into an IIFE pattern (like `PARSER` in `parser.js`).

---

## 6. How-To Recipes for Agents

### Recipe A: Adding a New Grammar Rule
Add your rule function inside `grammar-rules.js` and call it within `grammarIssues()`:

```javascript
// In grammar-rules.js
function checkCouldOf(tokens, add) {
  for (let i = 0; i < tokens.length - 1; i++) {
    const t1 = tokens[i], t2 = tokens[i + 1];
    if (S("could should would might must").has(t1.lw) && t2.lw === "of") {
      add({
        cat: "grammar",
        rule: "could-of",
        severity: "critical",
        start: t1.start,
        end: t2.end,
        original: `${t1.raw} ${t2.raw}`,
        suggestions: [`${t1.raw} have`],
        title: `Use "${t1.raw} have"`,
        why: `In speech, "${t1.raw} have" sounds like "${t1.raw} of", but it is written with "have".`
      });
    }
  }
}
```

### Recipe B: Extending the Parser
To add custom vocabulary or irregular forms to the POS tagger without modifying its internal dictionary:
```javascript
PARSER.extend({
  evaluative: "stupendously miraculously wonderfully",
  flatAdverbs: "swift quick tight"
});
```

### Recipe C: Adding a New Confusable Homophone Pair
Add the group to `HOMOPHONE_GROUPS` in `confusables.js`:
```javascript
["compliment", "complement"],
["principal", "principle"],
```
If you also write a contextual rule in `grammar-rules.js` to disambiguate them automatically, add the words to `HANDLED_CONTEXTUALLY` so the general advisory pass does not double-flag them.

---

## 7. Versioning & Author Attribution

- **Application**: Crockpot (Beta 1.4.x)
- **Author**: RZSY (<rizqsyahmi15@gmail.com>)
- **License**: MIT (see `LICENSE`)
- **Repository**: [https://github.com/RZSY/crockpot.git](https://github.com/RZSY/crockpot.git)
