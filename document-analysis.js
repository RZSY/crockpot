// ===============================================================
// 8. DOCUMENT ANALYSIS
// ===============================================================
const MAX_CHECK_LEN = 2000000;
const CAT_PRIORITY = { spelling:4, grammar:3, punctuation:2, confusable:1, style:0 };

// ===============================================================
// 8b. READABILITY
//     Flesch weights syllables-per-word at 84.6, so the whole measure
//     rests on the syllable count being right. The previous counter was
//     a single vowel-group regex, which got a little under six words in
//     ten correct — enough to move the published score by ten points or
//     more on ordinary prose.
//
//     Sentence counting matters almost as much. Headings, bullets and
//     list items rarely end in a full stop, so a document full of them
//     reads as one enormous sentence. Readability therefore does its own
//     splitting, breaking at line ends as well as at terminal
//     punctuation; the grammar rules keep the sentence boundaries they
//     have always had, because changing those would change their
//     verdicts.
// ===============================================================

// Words the rules below get wrong, and common enough to be worth stating.
const SYLLABLE_EXCEPTIONS = {
  // -ea and friends that the hiatus rules would over-split
  sea:1, tea:1, pea:1, plea:1, flea:1, yea:1, lea:1, quay:1,
  people:2, peoples:2, jeopardy:3, leopard:2, friend:1, friends:1, friendly:2,
  does:1, doesnt:2, goes:1, shoes:1, toes:1, foes:1, woes:1, hoes:1,
  // silent and near-silent endings
  queue:1, queues:1, choir:2, choirs:2, business:2, businesses:3,
  beautiful:3, beauty:2, beauties:2, aisle:1, isle:1, suite:1,
  // -ism / -thm
  rhythm:2, rhythms:2, rhythmic:3, prism:2, schism:2, chasm:2, spasm:2,
  // hiatus the rules miss
  idea:3, ideas:3, area:3, areas:3, urea:3, nausea:3, cornea:3, trachea:3,
  create:2, creates:2, created:3, creating:3, creation:3, creative:3,
  creature:2, creatures:2, react:2, reacts:2, reaction:3, really:2,
  real:1, realise:3, realised:3, realises:3, realising:4, realism:3,
  reality:4, realities:4, idealism:5, theatre:2, theatres:2,
  science:2, sciences:2, scientific:4, scientist:3, conscience:2,
  ancient:2, patient:2, patients:2, efficient:3, sufficient:3,
  // -le and -tle endings the final-e rule can trip on
  cooperate:4, cooperates:4, cooperated:5, cooperation:5, cooperative:5,
  coordinate:4, coordinates:4, coordinated:5, coordination:5, coordinator:5,
  coexist:3, coincide:3, coincidence:4, coincidental:5, coauthor:3,
  little:2, middle:2, simple:2, subtle:2, castle:2, whistle:2, muscle:2,
  // common polysyllables worth pinning down
  every:2, everyone:3, everything:3, everybody:4, family:3, families:3,
  camera:3, cameras:3, chocolate:3, different:3, difference:3, interest:3,
  interesting:4, comfortable:4, vegetable:4, restaurant:3, temperature:4,
  library:3, February:4, Wednesday:2, average:3, evening:2, several:3,
  general:3, natural:3, federal:3, literature:4, favourite:3, favourites:3,
  machine:2, machines:2, routine:2, ballet:2, buffet:2, cafe:2, resume:3,
  recipe:3, recipes:3, simile:3, apostrophe:4, catastrophe:4, hyperbole:4,
  epitome:4, sesame:3, finale:3, karate:3, adobe:3, anemone:4,
  // short words the length shortcut would mishandle
  ion:2, ions:2, eon:2, aeon:2, oil:1, our:1, hour:1, hours:1, fire:1,
  fires:1, hire:1, wire:1, tire:1, tired:1, hired:1, iron:2, irons:2,
  lion:2, lions:2, diet:2, quiet:2, riot:2, poem:2, poems:2, poet:2,
  giant:2, client:2, via:2, prior:2, trial:1,
  dial:1, vial:1, being:2, doing:2, going:2, seeing:2, saying:2
};

// Syllables added by an ending, used when the stem is a listed exception:
// "creating" is not in the table but "create" is.
const SUFFIX_SYLLABLES = { s:0, es:1, ed:0, d:0, ing:1, ly:1, ness:1, ment:1, ful:1, less:1 };

function vowelGroups(s){
  const m = s.match(/[aeiouy]+/g);
  return m ? m.length : 0;
}

function countSyllables(word){
  let w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  if(!w) return 0;
  if(SYLLABLE_EXCEPTIONS[w] != null) return SYLLABLE_EXCEPTIONS[w];

  // an inflected form of a word that is in the table
  for(const suf in SUFFIX_SYLLABLES){
    if(!w.endsWith(suf) || w.length <= suf.length + 1) continue;
    const stem = w.slice(0, -suf.length);
    let base = SYLLABLE_EXCEPTIONS[stem];
    if(base == null && suf !== "s" && suf !== "d") base = SYLLABLE_EXCEPTIONS[stem + "e"];
    if(base != null){
      let n = base + SUFFIX_SYLLABLES[suf];
      // "-es" only adds a beat after a sibilant: "boxes" does, "makes" does not
      if(suf === "es" && !/(s|x|z|ch|sh|ce|ge)$/.test(stem)) n -= 1;
      // a stem ending in silent "e" loses it before "-ing": create -> creating
      if(suf === "ing" && SYLLABLE_EXCEPTIONS[stem + "e"] != null) n = base + 1;
      return Math.max(1, n);
    }
  }

  let extra = 0;

  // "-ed" is only a beat after t or d: "wanted" has one, "jumped" does not
  if(/ed$/.test(w) && !/[td]ed$/.test(w) && /[^aeiouy]ed$/.test(w)) w = w.slice(0, -2);

  // A final "e" is usually silent, but "-le" after a consonant carries the
  // syllable ("table"), and so does a final "-ee", "-oe" or "-ye".
  if(/[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w) && w.length > 3) w = w.slice(0, -1);
  else if(/[^aeiouy]es$/.test(w) && !/(s|x|z|ch|sh|c|g)es$/.test(w) && w.length > 4) w = w.slice(0, -2);

  // Syllabic consonant endings with no vowel of their own: rhythm, prism.
  if(/(sm|thm|sms|thms)$/.test(w) && !/[aeiouy][^aeiouy]*$/.test(w.slice(-3, -2))) extra += 1;
  else if(/(sm|thm)$/.test(w) && vowelGroups(w) === 1 && /y/.test(w)) extra += 1;

  // Vowel pairs pronounced as two beats. Each is blocked after the letters
  // that fuse it back into one: "-tion" and "-cial" are single syllables,
  // "radio" and "actual" are not.
  const HIATUS = [
    [/[^ctsx]ia/g, 0], [/^ia/g, 0],
    [/[^ctsxln]io/g, 0], [/^io/g, 0],
    [/[^gq]ua/g, 0], [/[^gq]uo/g, 0],
    [/[^p]eo/g, 0], [/ii/g, 0], [/[^q]ui[aeo]/g, 0],
    [/[^ctsx]ie[tn]/g, 0], [/oe[mtn]/g, 0], [/[^aeiouy]ism$/g, 0]
  ];
  for(const [re] of HIATUS){ const m = w.match(re); if(m) extra += m.length; }
  if(/[^aeiouys]ea$/.test(w)) extra += 1;          // idea, area, nausea

  return Math.max(1, vowelGroups(w) + extra);
}

// Readability counts a run of digits as a word, and reads it at roughly a
// syllable a digit, because "2024" is spoken and Flesch is a model of speech.
function readabilityUnits(text){
  const units = [];
  const re = /[A-Za-z]+(?:['\u2019][A-Za-z]+)*|\d+(?:[.,]\d+)*/g;
  let m;
  while((m = re.exec(text))){
    const raw = m[0];
    units.push({ raw, start: m.index, end: m.index + raw.length,
      syllables: /^\d/.test(raw)
        ? Math.max(1, raw.replace(/[^0-9]/g, "").length)
        : countSyllables(raw) });
  }
  return units;
}

// Sentence boundaries for readability only. Terminal punctuation as usual,
// plus the end of any line that does not have it — a heading or a bullet is
// a unit a reader finishes, whatever the punctuation says.
function readabilitySentenceCount(text, units){
  if(!units.length) return 0;
  const cuts = [];
  const boundary = /([.!?]+)(["'\u201d\u2019)\]]*)(\s|$)/g;
  let m;
  while((m = boundary.exec(text))){
    const before = text.slice(0, m.index);
    const lastWord = (before.match(/([A-Za-z]+)$/) || [])[1];
    if(lastWord && ABBREVIATIONS.has(lastWord.toLowerCase()) && m[1] === ".") continue;
    if(lastWord && lastWord.length === 1 && m[1] === ".") continue;
    cuts.push(m.index + m[1].length + m[2].length);
  }
  const lineEnd = /\n+/g;
  while((m = lineEnd.exec(text))) cuts.push(m.index);
  cuts.push(text.length);

  const sorted = Array.from(new Set(cuts)).sort((a,b)=>a-b);
  let count = 0, cursor = 0, ui = 0;
  for(const cut of sorted){
    if(cut <= cursor) continue;
    let any = false;
    while(ui < units.length && units[ui].start < cut){ ui++; any = true; }
    if(any) count++;
    cursor = cut;
  }
  return Math.max(1, count);
}

const GRADE_NAMES = [
  [1,"reception"], [6,"primary school"], [9,"lower secondary"],
  [11,"GCSE"], [13,"A level"], [16,"undergraduate"], [99,"postgraduate"]
];
function describeGrade(g){
  for(const [max,name] of GRADE_NAMES) if(g <= max) return name;
  return "postgraduate";
}

function computeReadability(text){
  const units = readabilityUnits(text);
  const words = units.length;
  if(words < 3) return { ease:null, grade:null, words, provisional:true };
  const syllables = units.reduce((s,u)=> s + u.syllables, 0);
  const sentences = Math.max(1, readabilitySentenceCount(text, units));
  const wps = words / sentences;
  const spw = syllables / words;
  const ease  = Math.max(0, Math.min(100, Math.round(206.835 - 1.015*wps - 84.6*spw)));
  const grade = Math.max(0, Math.round((0.39*wps + 11.8*spw - 15.59) * 10) / 10);
  return {
    ease, grade, words, sentences, syllables,
    wordsPerSentence: Math.round(wps*10)/10,
    syllablesPerWord: Math.round(spw*100)/100,
    gradeLabel: describeGrade(grade),
    // Flesch is a regression fitted to passages, not to sentences. Under
    // about thirty words the number swings wildly on a single long word, so
    // it is reported as a rough reading rather than a measurement.
    provisional: words < 30
  };
}

function analyze(rawText, options){
  const opts = options || {};
  const truncated = rawText.length > MAX_CHECK_LEN;
  const text = truncated ? rawText.slice(0, MAX_CHECK_LEN) : rawText;
  const tokens = tokenize(text);
  const sentences = splitSentences(text, tokens);
  const issues = [];
  const seen = new Set();

  function add(issue){
    if(issue.start == null || issue.end == null || issue.end <= issue.start) return;
    const id = issue.cat + "|" + issue.rule + "|" + issue.start + "|" + issue.end;
    if(seen.has(id)) return;
    seen.add(id);
    issue.key = id;
    issue.suggestions = (issue.suggestions || []).filter(s => s !== issue.original);
    issues.push(issue);
  }

  // ---- spelling pass ----
  // Regions that aren't prose: URLs, emails, file paths and code-ish tokens.
  // Nothing inside them is checked, spelled or otherwise.
  const skipRanges = [];
  const NON_PROSE = /(https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w-]+\.[\w.]+|\b[\w-]+\.(?:com|org|net|io|gov|edu|uk|dev|app|co)\b|`[^`]*`|\/[\w.\/-]{3,})/gi;
  let nm;
  while((nm = NON_PROSE.exec(text))) skipRanges.push([nm.index, nm.index + nm[0].length]);
  const inSkipRange = (a,b) => skipRanges.some(r => a < r[1] && b > r[0]);

  // Tokens mixing letters and digits ("b4", "l8r", "gr8", "2day") never reach
  // the tokeniser, which matches letters only so the grammar rules are not fed
  // version numbers and model names. They get their own narrow scan, and are
  // only ever reported when the informal lexicon or a digit-sound expansion
  // actually recognises them — so "mp3", "H2O", "1st" and "iphone15" pass
  // through untouched.
  const REBUS_RE = /(?<![\w'])(?=[A-Za-z0-9]*[0-9])(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{2,9}(?![\w'])/g;
  let rb;
  while((rb = REBUS_RE.exec(text))){
    const raw = rb[0], lw = raw.toLowerCase();
    const st = rb.index, en = st + raw.length;
    if(inSkipRange(st, en)) continue;
    if(opts.userDictionary && opts.userDictionary.has(lw)) continue;
    if(raw.length > 1 && raw === raw.toUpperCase()) continue;   // H2O, MP3, 3D
    if(/^[a-z]?[0-9]{2,}/.test(lw)) continue;                    // years, 1990s
    if(/^[0-9]+(st|nd|rd|th|s)$/.test(lw)) continue;             // 1st, 2nd, 90s
    if(/^[A-Z]/.test(raw) && st > 0) continue;                   // model names mid-sentence
    const exp = informalExpansion(lw);
    if(!exp || (exp.kind !== "informal" && exp.kind !== "rebus")) continue;
    add({ cat:"spelling", rule:"informal", severity:"advisory",
      start:st, end:en, original:raw, suggestions: exp.words.slice(0,3),
      title:"Texting shorthand",
      why: exp.kind === "rebus"
        ? 'A digit standing in for the sound of its name.'
        : 'Texting shorthand.' });
  }

  const misspelledAt = new Set();
  const capitalisedCounts = {};
  tokens.forEach(t => { if(/^[A-Z]/.test(t.raw)) capitalisedCounts[t.lw] = (capitalisedCounts[t.lw]||0)+1; });
  const TITLES = S("mr mrs ms miss dr prof sir lady lord rev st");
  tokens.forEach((t, idx) => {
    const lw = t.lw;
    if(inSkipRange(t.start, t.end)) return;
    const charBefore = t.start > 0 ? text[t.start-1] : " ";
    const charAfter = text[t.end] || " ";
    if(charBefore === "." || charBefore === "/" || charBefore === "_" ||
       charAfter === "(" || charAfter === "_" || charAfter === "=") return;
    // A letter run welded to a digit is part of something the tokeniser has
    // split in half — "mp3", "iPhone14", "H2O", "3D". Checking the letters on
    // their own only ever produces nonsense.
    if(/[0-9]/.test(charBefore) || /[0-9]/.test(charAfter)) return;
    // The words on either side, used to judge how informal the passage is.
    const around = [];
    for(let k = Math.max(0, idx-4); k <= Math.min(tokens.length-1, idx+4); k++){
      if(k === idx) continue;
      const n = tokens[k];
      // A capitalised single letter is a label — "Vitamin C", "plan B" — and
      // says nothing about how informal the passage is.
      around.push(n.raw.length === 1 && n.raw !== n.raw.toLowerCase() ? "" : n.lw);
    }

    // Single letters are labels far more often than they are words: "plan B",
    // "vitamin C", "the x axis", "(a)". Only a lowercase letter whose *name*
    // is a word, in a passage already reading as informal, is worth raising —
    // and never "a", "i" or "o", which are words in their own right.
    if(lw.length === 1){
      if(!/^[a-z]$/.test(t.raw)) return;
      if(lw === "a" || lw === "i" || lw === "o") return;
      if(!LETTER_NAME_WORDS[lw]) return;
      if(charAfter === ")" || charAfter === "." || charAfter === ":") return;
      if(/[0-9]/.test(charBefore) || /[0-9]/.test(charAfter)) return;
      if(informalSignal(around) < 2) return;
      add({ cat:"spelling", rule:"informal", severity:"advisory",
        start:t.start, end:t.end, original:t.raw,
        suggestions: LETTER_NAME_WORDS[lw].slice(0,3),
        title:"Texting shorthand",
        why:'The letter is standing in for the word it sounds like.' });
      return;
    }
    if(opts.userDictionary && opts.userDictionary.has(lw)) return;
    if(spellingKnown(lw)){
      // Real words that double as chat spellings ("wont", "cant", "im", "wat").
      // Only raised when the surrounding text is informal too, so ordinary
      // prose that happens to use "cant" or "wont" is left alone.
      const rare = rareWordConfusion(lw);
      // If the word it might be confused with is already in the sentence, the
      // writer plainly knows the difference and is using both on purpose.
      if(rare && around.indexOf(rare) === -1){
        add({ cat:"spelling", rule:"confusable", severity:"advisory",
          start:t.start, end:t.end, original:t.raw, suggestions:[rare],
          title:"Easily confused",
          why:'"'+lw+'" is a word, but a rare one. If you meant "'+rare+'", this is a keystroke away.' });
        return;
      }
      const ctx = informalInContext(lw, around);
      if(ctx){
        add({ cat:"spelling", rule:"informal", severity:"advisory",
          start:t.start, end:t.end, original:t.raw, suggestions:[ctx],
          title:"Texting shorthand",
          why:'On its own this reads as the ordinary word "'+lw+'". "'+ctx+'" is what the sentence seems to mean.' });
      }
      return;
    }
    // American spellings are absent from a British dictionary, so they arrive
    // here looking like misspellings. Naming them for what they are is more
    // use than a guess, and it is what lets the option wave them through.
    const british = americanSpelling(lw);
    if(british){
      if(opts.ignoreAmerican) return;
      add({ cat:"spelling", rule:"american", severity:"critical",
        start:t.start, end:t.end, original:t.raw,
        suggestions:[/^[A-Z]/.test(t.raw) ? british[0].toUpperCase()+british.slice(1) : british],
        title:"American spelling",
        why:'"'+british+'" is the British form. Tick "Ignore American spellings" if that is deliberate.' });
      return;
    }
    // days, months and nationalities are handled by the capitalisation rule,
    // which gives a far more useful note than "not in the dictionary"
    if(PROPER_NOUNS_LOWER.has(lw)) return;
    // ALL-CAPS tokens are read as acronyms, not words
    if(t.raw.length > 1 && t.raw === t.raw.toUpperCase()) return;
    const stem = lw.replace(/['\u2019]s$/,"");
    const res = suggestFor(stem);
    const midSentence = t.i > 0;
    const looksProper = /^[A-Z]/.test(t.raw) && midSentence;
    if(looksProper){
      // Treat it as a name, silently, when it behaves like one: part of a
      // capitalised run ("Daniel Okonjo"), after a title ("Ms Whitfield"),
      // or used more than once in the same piece of writing.
      const prev = tokens[idx-1], nxt = tokens[idx+1];
      const runOn = (prev && /^[A-Z]/.test(prev.raw) && prev.i > 0) ||
                    (nxt && /^[A-Z]/.test(nxt.raw) && nxt.i > 0);
      const afterTitle = prev && TITLES.has(prev.lw.replace(/\.$/,""));
      if(runOn || afterTitle || capitalisedCounts[lw] > 1) return;
    }
    if(ABBREVIATIONS.has(lw)) return;
    if(lw === "que") return;
    misspelledAt.add(idx);
    if(res.suggestions.length === 0 || looksProper){
      add({ cat:"spelling", rule:"unknown", severity:"advisory",
        start:t.start, end:t.end, original:t.raw, suggestions:res.suggestions.slice(0,3),
        title:"Not in the dictionary",
        why: looksProper
          ? 'This looks like a name or a brand. If it is, add it to your dictionary and it won\'t be flagged again.'
          : 'No word in the 114,500-word British dictionary is close enough to this to correct it confidently.' });
    } else {
      add({ cat:"spelling", rule:"misspelling", severity:"critical",
        start:t.start, end:t.end, original:t.raw,
        suggestions: res.suggestions.map(s => (/^[A-Z]/.test(t.raw) ? s[0].toUpperCase()+s.slice(1) : s)),
        title: (res.kind === "informal" || res.kind === "initialism" ||
                res.kind === "letter"   || res.kind === "rebus" ||
                res.kind === "elongation" || res.kind === "leet") ? "Texting shorthand" : "Spelling",
        why: res.reason
          ? res.reason
          : (res.confidence === "high"
              ? 'One keystroke away from "'+res.suggestions[0]+'", which is in the dictionary.'
              : 'The closest dictionary matches are listed — pick the one you meant.') });
    }
  });

  // ---- grammar, punctuation, style ----
  grammarIssues(text, tokens, sentences, (iss) => {
    if(inSkipRange(iss.start, iss.end)) return;
    // don't build grammar advice on top of a word we already know is misspelled
    for(const idx of misspelledAt){
      const t = tokens[idx];
      if(t.start < iss.end && t.end > iss.start && iss.cat === "grammar") return;
    }
    add(iss);
  });
  punctuationIssues(text, iss => { if(!inSkipRange(iss.start, iss.end)) add(iss); });

  // ---- easily-confused words (optional, off by default) ----
  if(opts.flagConfusables){
    tokens.forEach(t => {
      const alts = HOMOPHONE_MAP[t.lw];
      if(alts && !HANDLED_CONTEXTUALLY.has(t.lw)){
        add({ cat:"confusable", rule:"homophone", severity:"advisory",
          start:t.start, end:t.end, original:t.raw, suggestions:alts,
          title:"Easily confused word",
          why:'"'+t.raw+'" and '+alts.map(a=>'"'+a+'"').join(" / ")+' are often swapped. Check this is the one you meant.' });
      }
    });
  }

  // ---- resolve overlaps: keep the higher-priority issue ----
  issues.sort((a,b) => a.start - b.start || b.end - a.end);
  const kept = [];
  for(const iss of issues){
    let drop = false;
    for(let k=kept.length-1;k>=0 && kept.length-k < 12;k--){
      const prev = kept[k];
      if(prev.end <= iss.start) continue;
      const overlap = Math.min(prev.end, iss.end) - Math.max(prev.start, iss.start);
      if(overlap <= 0) continue;
      const pPrev = CAT_PRIORITY[prev.cat], pNew = CAT_PRIORITY[iss.cat];
      if(pNew > pPrev){ kept.splice(k,1); }
      else if(prev.rule === iss.rule || pNew <= pPrev){ drop = true; break; }
    }
    if(!drop) kept.push(iss);
  }
  kept.sort((a,b)=> a.start - b.start);

  // ---- document statistics ----
  const words = tokens.length;
  const chars = rawText.length;
  const read = computeReadability(text);
  const readability = read.ease == null ? 100 : read.ease;

  let penalty = 0;
  kept.forEach(iss => {
    // an unrecognised name is barely a writing problem, so it barely counts
    const weight = iss.severity === "critical" ? 1 : (iss.rule === "unknown" ? 0.12 : 0.35);
    penalty += weight;
  });
  const density = penalty / Math.max(words, 30);
  const score = words < 3 ? null : Math.max(0, Math.min(100, Math.round(100 * (1 - Math.min(1, density * 7)))));

  return { tokens, sentences, issues: kept, truncated,
           stats:{ words, chars, sentences: sentences.length, readability, score,
                   readingTime: Math.max(1, Math.round(words / 225)),
                   ease: read.ease, grade: read.grade, gradeLabel: read.gradeLabel,
                   wordsPerSentence: read.wordsPerSentence,
                   syllablesPerWord: read.syllablesPerWord,
                   easeProvisional: read.provisional, readWords: read.words } };
}
