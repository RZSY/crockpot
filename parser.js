// ===============================================================
// 6b. PARSER  (tagger -> chunker -> clause finder)
//     Load AFTER lexicon.js / tokenizer.js and BEFORE document-analysis.js.
//
//     Same philosophy as the rest of Crockpot: no model, and every
//     stage is allowed to say "I don't know". A rule built on this
//     layer only fires when the parse is unambiguous.
//
//       1. tag()      word -> part of speech (closed classes from the
//                     lexicon, morphology for the rest, then contextual
//                     rules that resolve noun/verb ambiguity)
//       2. chunk()    tags -> NP / VP / PP chunks
//       3. clauses()  chunks -> { subject, verb } pairs
//       4. parserIssues()  rules that read the clauses
// ===============================================================
const PARSER = (() => {
  const has = (set, w) => !!set && set.has(w);
  const adjectiveKnown = w =>
    (typeof COMMON_ADJECTIVES !== "undefined" && COMMON_ADJECTIVES.has(w)) ||
    (typeof isAdjective === "function" && typeof DICTIONARY !== "undefined" &&
     DICTIONARY.has(w) && isAdjective(w));


  // Words that genuinely live in more than one class. Listing them is what
  // lets the tagger ask "which job is this word doing HERE?" instead of
  // guessing from the spelling. Order of classes = prior (most likely first).
  const DUAL = {};
  (function(){
    const add = (cls, words) => words.split(/\s+/).forEach(w => DUAL[w] = cls.split(" "));
    add("ADJ NN",     "red blue green yellow black white brown grey gray orange pink purple dark flat low high fair plain native criminal general private public official initial minor major human original professional individual positive negative good bad");
    add("ADJ NN VB",  "light fast right present express round second square wet empty double key top back mean");
    add("ADJ NN VBD", "left");
    add("ADJ VB",     "free clear dry");
    add("ADJ NN",     "final");
    add("PREP ADJ NN","past");
    add("PREP ADJ",   "near");
  })();
  // Adjectives that are also used for a group of people: "the poor are", "the young".
  const PEOPLE_ADJ = S("poor rich young old sick wounded elderly homeless unemployed blind deaf dead living injured disabled needy wealthy");
  // ---- irregular verbs: base, past, participle -------------------------------
  // One table feeds two jobs: tagging ("sat" is a verb, not the noun "SATs") and
  // lemmatising ("wrote" -> "write", so the manner-verb list needs no irregular forms).
  const IRREGULAR_VERBS = `
    arise arose arisen; awake awoke awoken; bear bore borne; beat beat beaten; become became become;
    begin began begun; bend bent bent; bind bound bound; bite bit bitten; bleed bled bled; blow blew blown;
    break broke broken; breed bred bred; bring brought brought; build built built; burn burnt burnt;
    buy bought bought; catch caught caught; choose chose chosen; cling clung clung; come came come;
    creep crept crept; deal dealt dealt; dig dug dug; do did done; draw drew drawn; dream dreamt dreamt;
    drink drank drunk; drive drove driven; eat ate eaten; fall fell fallen; feed fed fed; feel felt felt;
    fight fought fought; find found found; flee fled fled; fling flung flung; fly flew flown;
    forbid forbade forbidden; forget forgot forgotten; forgive forgave forgiven; freeze froze frozen;
    get got gotten; give gave given; go went gone; grind ground ground; grow grew grown; hang hung hung;
    hear heard heard; hide hid hidden; hold held held; keep kept kept; kneel knelt knelt; know knew known;
    lay laid laid; lead led led; lean leant leant; leap leapt leapt; learn learnt learnt; leave left left;
    lend lent lent; lie lay lain; light lit lit; lose lost lost; make made made; mean meant meant;
    meet met met; pay paid paid; ride rode ridden; ring rang rung; rise rose risen; run ran run;
    say said said; see saw seen; seek sought sought; sell sold sold; send sent sent; shake shook shaken;
    shine shone shone; shoot shot shot; show showed shown; shrink shrank shrunk; sing sang sung;
    sink sank sunk; sit sat sat; sleep slept slept; slide slid slid; speak spoke spoken; spend spent spent;
    spin spun spun; spring sprang sprung; stand stood stood; steal stole stolen; stick stuck stuck;
    sting stung stung; strike struck struck; swear swore sworn; sweep swept swept; swim swam swum;
    swing swung swung; take took taken; teach taught taught; tear tore torn; tell told told;
    think thought thought; throw threw thrown; understand understood understood; wake woke woken;
    wear wore worn; weep wept wept; win won won; wind wound wound; write wrote written
  `;
  const LEMMA = Object.create(null);          // past / participle form -> base verb
  const IRREGULAR_PAST = new Set();
  (function(){
    // forms that are also everyday nouns or adjectives are left out ("a bit", "a rose", "a shot")
    const AMBIGUOUS = S("bit saw wound bore ground lay rose rung shot bound drunk left lit");
    IRREGULAR_VERBS.split(";").forEach(row => {
      const f = row.trim().split(/\s+/);
      if(f.length !== 3) return;
      f.slice(1).forEach(form => {
        if(form === f[0]) return;
        LEMMA[form] = f[0];
        if(!AMBIGUOUS.has(form)) IRREGULAR_PAST.add(form);
      });
    });
  })();

  // ---- adverbs that look like adjectives ------------------------------------
  // Same form in both classes: "a fast car" / "drives fast". These are accepted as
  // adverbs, so they are never flagged, and are read as adverbs after a verb.
  const FLAT_ADV = S(`
    fast hard late early long far high low deep straight wrong right loud slow tight wide direct fair
    cheap short flat free wild sharp bright close near
    daily weekly monthly yearly hourly nightly quarterly
  `);
  // Subset where an object can sit in between: "hit the ball hard", "sell it cheap".
  const FAR_ADV = S("fast hard late early long far high low deep straight wrong cheap short tight wide");
  // Adjectives that end in -ly. The tagger would otherwise take every -ly word for an adverb.
  const LY_ADJ = S(`
    friendly lovely lonely lively deadly costly likely unlikely ugly silly curly oily jolly bubbly smelly
    chilly wobbly sickly kindly cowardly motherly fatherly brotherly sisterly manly womanly neighbourly
    neighborly beastly ghostly heavenly earthly worldly timely untimely lowly surly holy elderly orderly
    unruly scaly bully chubby daily weekly monthly yearly hourly nightly quarterly early
    scholarly saintly kingly princely queenly soldierly gentlemanly statesmanly lordly masterly miserly
    deathly ghastly goodly stately comely homely seemly unseemly portly wily burly cuddly leisurely
    grisly measly sprightly courtly cleanly fortnightly
  `);
  // Adjectives that are idiomatic after a verb, so they are not "wrong": "play dirty", "think big".
  const IDIOM_ADJ = S("dirty rough safe sure simple tough easy cool big small positive young tall quiet still calm firm thin thick true square");

  // ---- manner verbs: how the action is done, so an adverb belongs after them ---------
  // Deliberately omits verbs that take an adjective ("stay calm", "turn red", "go quiet",
  // "sit tight", "grow tall", "get ready", "fall silent"). Inflections are derived
  // (speaks, spoke, speaking), so only base forms are listed.
  const MANNER_BASE = S(`
    speak talk whisper shout yell scream shriek mutter mumble murmur chat gossip argue debate lecture
    preach reply respond answer sing hum chant announce explain describe express pronounce spell

    run jog sprint dash hurry rush march stroll wander crawl creep climb jump leap hop skip swim sail
    fly drive ride cycle steer glide slide skate ski dance move travel proceed advance retreat walk
    paddle row dive roll race pedal trudge shuffle limp

    work perform play act behave operate function handle treat manage cope serve teach train practise
    practice study learn read write type draw paint cook bake build construct design develop plan
    prepare organise organize react cooperate collaborate communicate negotiate compete fight deal

    think listen watch observe examine inspect consider decide judge reason analyse analyze calculate
    compute remember concentrate focus

    eat drink sleep breathe chew swallow sip smile laugh cry weep sigh nod wave bow dress

    pay sell cut shoot aim kick throw catch rank score fit
  `);
  // Sense verbs take an adjective, not an adverb: "sounds beautiful", not "sounds beautifully".
  const SENSE_VERB = S("look looks looked looking smell smells smelled smelt taste tastes tasted sound sounds sounded feel feels felt");
  // Evaluative / appearance adverbs that are wrongly used after a sense verb. Each one is
  // paired with its adjective automatically (see adjOfAdv), so only the adverb is listed.
  const EVAL_ADV = S(`
    beautifully wonderfully terribly horribly awfully deliciously fantastically amazingly strangely
    gorgeously fabulously marvellously magnificently superbly brilliantly dreadfully hideously
    disgustingly pleasantly unpleasantly suspiciously differently sadly happily angrily nervously
    peacefully comfortably uncomfortably impressively disappointingly fascinatingly
  `);
  // Verbs that take an adjective, not an adverb, as their complement.
  const LINKING = S("seem seems seemed look looks looked feel feels felt become becomes became stay stays stayed remain remains remained get gets got sound sounds sounded grow grows grew turn turns turned appear appears appeared smell smells smelled taste tastes tasted prove proves proved");
  const INTENSIFIER = S("very too so quite rather more most less least extremely really fairly pretty how as slightly incredibly highly deeply");

  // Number evidence ------------------------------------------------
  // Noun-only irregular plurals. Verb-ambiguous ones ("bases", "analyses") are deliberately left out.
  const IRREGULAR_PLURAL = S("people children men women feet teeth mice geese police cattle oxen criteria phenomena alumni fungi cacti nuclei stimuli radii indices matrices theses crises hypotheses appendices bacteria");
  const SINGULAR_IN_S    = S("news series species mathematics physics economics politics athletics gymnastics linguistics bus gas class glass boss business process address success access focus");
  const VAGUE_NUMBER     = S("data staff team committee government family group media number couple lot majority minority variety range set pair bunch percent percentage rest half none any all most some");
  const PLURAL_DET       = S("these those many few several both");
  const SINGULAR_DET     = S("this that each every another");
  const AUX_FIX = {            // singular form <-> plural form
    is:"are", was:"were", has:"have", does:"do",
    "isn't":"aren't", "wasn't":"weren't", "hasn't":"haven't", "doesn't":"don't"
  };
  const AUX_FIX_BACK = {}; Object.keys(AUX_FIX).forEach(k => AUX_FIX_BACK[AUX_FIX[k]] = k);

  // ---- 1. TAGGER ------------------------------------------------
  function lexicalTag(w, raw, atStart){
    if(w === "past" || w === "near") return DUAL[w].slice();
    if(/^(do|does|did)n't$/.test(w)) return ["DO"];
    if(/^(is|are|was|were)n't$|^ain't$/.test(w)) return ["BE"];
    if(/^(has|have|had)n't$/.test(w)) return ["HAVE"];
    if(/^(can|could|would|should|will|must|might|shall)n't$|^won't$/.test(w)) return ["MD"];
    if(/^(he|she|it|that|there|what|who|here|let)'s$/.test(w)) return ["PRON"];
    if(/^(i|you|we|they)'(m|re|ve|ll|d)$/.test(w)) return ["PRON"];
    if(has(MODALS, w)) return ["MD"];
    if(has(BE_FORMS, w)) return ["BE"];
    if(has(HAVE_FORMS, w)) return ["HAVE"];
    if(has(DO_FORMS, w)) return ["DO"];
    if(w === "to") return ["TO", "PREP"];
    if(w === "and" || w === "or" || w === "but" || w === "nor") return ["CC"];
    if(/^(not|never|n't|there|here|now|then|today|tomorrow|yesterday|also|too|always|often|soon|still|already|just|only|very|quite|rather|extremely|really|fairly|pretty|slightly|incredibly|highly|deeply)$/.test(w)) return ["ADV"];
    if(has(PRONOUNS, w) && !has(DETERMINERS, w)) return ["PRON"];
    if(has(POSS_DET, w)) return ["DET"];
    if(has(DETERMINERS, w)) return w === "that" ? ["DET", "SUB"] : ["DET"];
    if(has(PREPOSITIONS, w)) return ["PREP"];
    if(has(CONJUNCTIONS, w)) return ["SUB"];
    if(/^\d/.test(w)) return ["CD"];
    return null;
  }

  // ---- word-class inference from the dictionary itself ------------
  // A word's inflected family shows what it can be, so nothing has to be
  // listed by hand:
  //     plural exists       (lights, reds)        -> can be a noun
  //     -ed / -ing exist    (lighted, lighting)   -> can be a verb
  //     -est exists         (lightest, reddest)   -> can be an adjective
  // "happy" has happiest but no "happys": adjective only.  "car" has cars but
  // no verb forms of its own: noun only.  "light" has all three.
  // The -er form alone is never trusted ("worker" is not "work" + comparative);
  // the superlative is, because nothing but an adjective takes it.
  const dictHas = w => typeof DICTIONARY !== "undefined" && DICTIONARY.has(w);
  const rankOf  = w => (typeof RANK !== "undefined" && RANK.has(w)) ? RANK.get(w) : Infinity;
  const RANK_LOOSE = 90000, RANK_STRICT = 30000;   // list position: lower = commoner
  const firstKnown = (forms, limit) => forms.find(f => dictHas(f) && rankOf(f) < limit) || null;
  const PARADIGM = new Map();

  function inferClasses(w){
    if(PARADIGM.has(w)) return PARADIGM.get(w);
    const last = w[w.length-1];
    const endsE = /e$/.test(w), endsCY = /[^aeiou]y$/.test(w);
    const stem = endsCY ? w.slice(0, -1) : "";
    // consonant-vowel-consonant words double the last letter: red/redder, hat/hatted
    const cvc = w.length <= 5 && /[^aeiou][aeiou][^aeiouwxy]$/.test(w);

    const plural = [w + "s", w + "es"].concat(endsCY ? [stem + "ies"] : []);

    // "care" steals "cared"/"caring" from "car": when a silent-e sibling exists,
    // only the doubled forms (hatted, hatting) count as evidence of a verb.
    const eSibling = !endsE && dictHas(w + "e");
    const verbForms = [];
    if(!eSibling) verbForms.push(w + "ed", w + "ing");
    if(cvc) verbForms.push(w + last + "ed", w + last + "ing");
    if(endsE) verbForms.push(w + "d", w.slice(0, -1) + "ing");
    if(endsCY) verbForms.push(stem + "ied");

    const grade = suf => {
      const out = [endsE ? w + suf.slice(1) : w + suf];
      if(endsCY) out.push(stem + "i" + suf);
      if(cvc) out.push(w + last + suf);
      return out;
    };
    const sup = w.length >= 3 ? firstKnown(grade("est"), RANK_LOOSE) : null;
    // "sadness" + "sadly" without a superlative still points at an adjective
    const nessLy = !sup && w.length >= 3 &&
      firstKnown(endsCY ? [stem + "iness"] : [w + "ness"], RANK_LOOSE) &&
      firstKnown(endsCY ? [stem + "ily", w + "ly"] : [w + "ly"], RANK_LOOSE);

    const noun = firstKnown(plural, RANK_LOOSE), verb = firstKnown(verbForms, RANK_LOOSE);
    // weaker clue: "patiently" exists, so "patient" can be an adjective even without "patientest".
    // The -ly word must not itself be an adjective ("friendly" says nothing about "friend").
    const lyForms = [w + "ly"].concat(endsCY ? [stem + "ily"] : [], /le$/.test(w) ? [w.slice(0, -1) + "y"] : [], /ic$/.test(w) ? [w + "ally"] : []);
    const lyAdv = (sup || nessLy || w.length < 4) ? null : firstKnown(lyForms.filter(f => !LY_ADJ.has(f)), RANK_LOOSE);
    const classes = [];
    if(sup || nessLy) classes.push("ADJ");
    if(noun) classes.push("NN");
    if(verb) classes.push("VB");
    if(lyAdv) classes.push("ADJ");                    // weak: listed last, so context must earn it
    const res = {
      classes,
      strongNN: !!firstKnown(plural, RANK_STRICT),
      strongVB: !!firstKnown(verbForms, RANK_STRICT),
      evidence: { adjective: sup || (nessLy ? "-ness / -ly" : (lyAdv ? lyAdv + " (weak)" : null)), noun, verb }
    };
    PARADIGM.set(w, res);
    return res;
  }

  const tagged = (arr, src) => { arr.src = src; return arr; };

  function morphTag(w){
    if(DUAL[w]) return tagged(DUAL[w].slice(), "table");
    if(PEOPLE_ADJ.has(w)) return tagged(["ADJ", "NN"], "table");
    if(IRREGULAR_PAST.has(w)) return tagged(["VBD", "VBN"], "table");
    if(LY_ADJ.has(w)) return tagged(["ADJ"], "table");
    const inflected = /s$/.test(w);                       // -s forms are handled below
    const inf = (w.length >= 3 && !inflected) ? inferClasses(w) : null;

    if(adjectiveKnown(w)){
      // a known adjective only gains a second job on strong, common evidence:
      // "good" has "goods", but "true" having a rare "trues" must not count
      const cls = ["ADJ"];
      if(inf && inf.strongNN) cls.push("NN");
      if(inf && inf.strongVB) cls.push("VB");
      // no superlative / -ness+-ly evidence means the word is really a noun that the
      // adjective list also claims ("table", "metal", "plastic"): prefer the noun
      if(cls.length > 1 && !(inf && inf.evidence.adjective) && cls[1] === "NN") { cls[0] = "NN"; cls[1] = "ADJ"; }
      return tagged(cls, cls.length > 1 ? "dictionary evidence" : "adjective list");
    }
    // "need", "seed", "speed" end in -ed but are base words: they have plurals
    if(/ed$/.test(w) && w.length > 3 && inf && inf.evidence.noun)
      return tagged(inf.classes.slice(), "dictionary evidence");

    if(/ly$/.test(w) && w.length > 4 && !/(family|italy|supply|reply|apply|rely|july|assembly|anomaly)$/.test(w)) return tagged(["ADV"], "suffix");
    if(/ing$/.test(w) && w.length > 4) return tagged(["VBG", "NN"], "suffix");
    if(/ed$/.test(w) && w.length > 3) return tagged(["VBD", "VBN", "ADJ"], "suffix");
    if(/(tion|sion|ment|ness|ity|ance|ence|ship|ism|hood)s?$/.test(w)) return tagged(/s$/.test(w) ? ["NNS"] : ["NN"], "suffix");
    if(/(ous|ful|ive|able|ible|less|ical)$/.test(w)) return tagged(["ADJ"], "suffix");
    if(/s$/.test(w) && !/(ss|us|is)$/.test(w) && !has(SINGULAR_IN_S, w)) return tagged(["NNS", "VBZ"], "suffix");
    if(inf && inf.classes.length) return tagged(inf.classes.slice(), "dictionary evidence");
    return tagged(["NN", "VB"], "default");               // no evidence: noun or base verb
  }

  const NOMINAL_BEFORE = new Set(["DET", "ADJ", "PREP", "CD"]);
  const isNounTag = g => g === "NN" || g === "NNS";
  const skipAdv = (out, k) => { while(k >= 0 && out[k].tag === "ADV") k--; return k; };
  const linkingAt = (out, k) => k >= 0 && (out[k].tag === "BE" || LINKING.has(out[k].lw));

  // Decide which job a multi-class word is doing in this sentence.
  // Called right-to-left, so the word on the right is already settled.
  function resolveDual(out, k){
    const t = out[k], prev = k > 0 ? out[k-1] : null, next = k < out.length-1 ? out[k+1] : null;
    const p = prev ? prev.tag : "^";
    const can = x => t.alts.indexOf(x) !== -1;
    const settle = (tag, why, extra) => { t.tag = tag; t.why = why; t.alts = [tag]; if(extra) Object.assign(t, extra); };
    const nextModifiable = !!next && !t.brk && !LINKING.has(next.lw) &&
      (isNounTag(next.tag) || (next.tag === "ADJ" && next.attr));

    // after a modal, "to" or do-support, or after I/you/we/they: a verb
    if(can("VB") && (p === "MD" || p === "TO" || p === "DO" ||
       (p === "PRON" && /^(i|you|we|they)$/.test(prev.lw)))) return settle("VB", "follows a modal, \u201cto\u201d or a plural pronoun, so it is a verb");

    // "He left early.": after its subject, "left" is the past tense of "leave"
    if(can("VBD") && (p === "PRON" || isNounTag(p)))
      return settle("VBD", "follows its subject, so it is a past-tense verb");

    // "past the door" (preposition) vs "the past" (noun) vs "past events" (adjective)
    if(can("PREP") && !NOMINAL_BEFORE.has(p) && !linkingAt(out, skipAdv(out, k-1)) &&
       next && (next.tag === "DET" || next.tag === "PRON" || next.tag === "CD" || isNounTag(next.tag)))
      return settle("PREP", "introduces the phrase that follows, so it is a preposition");

    // "very light", "too red", "more fast"
    if(can("ADJ") && prev && INTENSIFIER.has(prev.lw))
      return settle("ADJ", "follows \u201c" + prev.lw + "\u201d, which modifies adjectives", { attr: nextModifiable });

    // "the red car", "a light touch": it modifies the noun that follows
    if(can("ADJ") && nextModifiable)
      return settle("ADJ", "modifies \u201c" + next.raw + "\u201d, the noun that follows", { attr: true });

    // "the red was fading", "the left of the page": nothing follows to modify
    if(can("NN") && (p === "DET" || p === "CD" || (p === "ADJ" && prev.attr)))
      return settle("NN", "closes the noun phrase after \u201c" + prev.raw + "\u201d, so it is a noun", { fromAdj: PEOPLE_ADJ.has(t.lw) });

    // "The sky is red", "it looks light", "seems very fast"
    if(can("ADJ") && linkingAt(out, skipAdv(out, k-1)))
      return settle("ADJ", "describes the subject after \u201c" + out[skipAdv(out, k-1)].raw + "\u201d");

    // "red and green": copy the neighbour on the other side of the conjunction
    if(prev && prev.tag === "CC" && k >= 2){
      const other = out[k-2];
      if(other.tag === "ADJ" && can("ADJ")) return settle("ADJ", "joined by \u201c" + prev.raw + "\u201d to the adjective \u201c" + other.raw + "\u201d");
      if(isNounTag(other.tag) && can("NN")) return settle("NN", "joined by \u201c" + prev.raw + "\u201d to the noun \u201c" + other.raw + "\u201d");
    }
    if(next && next.tag === "CC" && k + 2 < out.length){
      const other = out[k+2];
      if(other.tag === "ADJ" && can("ADJ")) return settle("ADJ", "joined by \u201c" + next.raw + "\u201d to the adjective \u201c" + other.raw + "\u201d");
      if(isNounTag(other.tag) && can("NN")) return settle("NN", "joined by \u201c" + next.raw + "\u201d to the noun \u201c" + other.raw + "\u201d");
    }

    // "in red", "for free": no determiner, nothing to modify
    if(p === "PREP" && can("NN")) return settle("NN", "follows \u201c" + prev.raw + "\u201d with nothing to modify, so it is a noun");

    // "blue and a red hat": a determiner after the conjunction means a noun phrase is coming
    if(next && next.tag === "CC" && k + 2 < out.length && out[k+2].tag === "DET" && can("NN"))
      return settle("NN", "is joined by \u201c" + next.raw + "\u201d to a noun phrase (\u201c" + out[k+2].raw + " \u2026\u201d)");

    // "painted the wall red": an adjective right after a noun, with nothing to modify, describes that noun
    if(can("ADJ") && prev && isNounTag(prev.tag) && (!next || ["PREP","CC","ADV","SUB"].indexOf(next.tag) !== -1))
      return settle("ADJ", "describes \u201c" + prev.raw + "\u201d, the noun before it");

    // "Clear the table.": a sentence-opening verb with its object after it is an imperative
    if(t.i === 0 && can("VB") && next && (next.tag === "DET" || next.tag === "PRON" || next.tag === "CD"))
      return settle("VB", "opens the sentence and is followed by its object, so it is a command");

    // sentence opens with it and a verb follows: "Red is my favourite."
    if(t.i === 0 && can("NN") && next && ["BE","MD","DO","HAVE","VBZ"].indexOf(next.tag) !== -1)
      return settle("NN", "is the subject of the verb that follows");

    // no evidence either way: keep the more common reading, but admit it
    return settle(t.alts[0], "no clear clue in the sentence; taken as the more common use", { uncertain: true });
  }

  function tag(tokens, text){
    const out = tokens.map(t => ({ i:0, raw:t.raw, lw:t.lw, start:t.start, end:t.end, s:t.s,
                                    tag:null, src:"", cls:[], alts:[], why:"", role:"", attr:false, fromAdj:false, uncertain:false, brk:false }));
    out.forEach((t, k) => {
      const cand = lexicalTag(t.lw, t.raw, t.i === 0) || morphTag(t.lw);
      t.i = tokens[k].i;                                     // position in sentence
      t.brk = !text || k === tokens.length - 1 || !/^[ \t]*$/.test(text.slice(tokens[k].end, tokens[k+1].start));
      t.idx = k;
      if(IRREGULAR_PLURAL.has(t.lw)) { t.alts = ["NNS"]; t.tag = "NNS"; return; }
      t.tag = cand[0]; t.alts = cand; t.cls = cand.slice(); t.src = cand.src || "closed class";
    });

    // pass 1 (right to left): multi-class words that can be adjectives
    for(let k = out.length - 1; k >= 0; k--){
      const t = out[k];
      if(t.alts.length > 1 && t.alts.indexOf("ADJ") !== -1 &&
         t.alts.some(x => x === "NN" || x === "VB" || x === "PREP")) resolveDual(out, k);
    }

    // pass 2 (left to right): everything else that is ambiguous
    out.forEach((t, k) => {
      const prev = k > 0 ? out[k-1] : null, next = k < out.length-1 ? out[k+1] : null;
      const p = prev ? prev.tag : "^";
      if(t.tag === "TO"){            // infinitive marker vs preposition
        t.tag = (next && (next.tag === "DET" || next.tag === "PRON" || next.tag === "CD")) ? "PREP" : "TO";
        return;
      }
      if(t.alts.length < 2) return;
      const can = x => t.alts.indexOf(x) !== -1;

      if(can("DET") && can("SUB")){   // "that"
        t.tag = (next && (isNounTag(next.tag) || next.tag === "ADJ")) ? "DET" : "SUB";
      }
      else if(can("NNS") && can("VBZ")){
        if(NOMINAL_BEFORE.has(p) || p === "NNS") t.tag = "NNS";
        else if(p === "PRON" && /^(he|she|it)$/.test(prev.lw)) t.tag = "VBZ";
        else if(p === "NN") t.tag = "VBZ";
        else t.tag = "NNS";
      }
      else if(can("VBD") && can("VBN")){
        if(p === "BE" || p === "HAVE") t.tag = "VBN";
        else if(NOMINAL_BEFORE.has(p)) { t.tag = "ADJ"; t.why = "a participle used as an adjective"; }
        else t.tag = "VBD";
      }
      else if(can("VBG")){
        if(p === "BE") t.tag = "VBG";
        else if(NOMINAL_BEFORE.has(p) || p === "DET") t.tag = "NN";   // gerund used as a noun
        else t.tag = "VBG";
      }
      else if(can("NN") && can("VB")){
        if(p === "MD" || p === "TO" || p === "DO") t.tag = "VB";
        else if(p === "PRON" && /^(i|you|we|they|he|she|it)$/.test(prev.lw)) t.tag = "VB";
        else t.tag = "NN";
      }
    });

    // pass 4: an adjective-shaped word that is really modifying a verb
    out.forEach((t, k) => {
      const nx = k < out.length-1 ? out[k+1] : null;
      const verb = x => x >= 0 && ["VB","VBZ","VBD","VBN","VBG"].indexOf(out[x].tag) !== -1 && !LINKING.has(out[x].lw);
      // "teaches patient": a word that can be an adjective, left unresolved after a manner verb
      if(t.uncertain && t.tag !== "ADJ" && t.cls.indexOf("ADJ") !== -1){
        const jv = skipAdv(out, k-1);
        if(verb(jv) && !out[jv].brk && isMannerVerb(out[jv].lw) && (t.brk || (nx && ["PREP","CC","ADV","SUB"].indexOf(nx.tag) !== -1)))
          { t.tag = "ADJ"; t.why = "follows the action \u201c" + out[jv].raw + "\u201d with nothing to modify"; t.uncertain = false; return; }
      }
      if(t.tag !== "ADJ" || !FLAT_ADV.has(t.lw)) return;
      const next = nx;
      if(next && !t.brk && (isNounTag(next.tag) || next.tag === "ADJ")) return;     // "a fast car"
      let j = skipAdv(out, k-1);
      // "drives fast", "works hard", "arrived late"
      if(verb(j) && !out[j].brk)
        { t.tag = "ADV"; t.why = "modifies the verb \u201c" + out[j].raw + "\u201d (same form as the adjective)"; t.uncertain = false; return; }
      // "hit the ball hard": step back over the object to find the verb
      if(FAR_ADV.has(t.lw) && t.brk){
        let m = k - 1;
        while(m >= 0 && ["NN","NNS","DET","CD","ADJ","PRON"].indexOf(out[m].tag) !== -1) m--;
        if(m < k - 1 && verb(m))
          { t.tag = "ADV"; t.why = "modifies the verb \u201c" + out[m].raw + "\u201d, after its object"; t.uncertain = false; }
      }
    });

    // pass 3: name the job each word is doing
    out.forEach((t, k) => {
      const prev = k > 0 ? out[k-1] : null, next = k < out.length-1 ? out[k+1] : null;
      if(t.tag === "ADJ"){
        const attributive = next && !t.brk && (isNounTag(next.tag) || (next.tag === "ADJ")) && !LINKING.has(next.lw);
        const predicative = linkingAt(out, skipAdv(out, k-1));
        t.role = attributive ? "attributive adjective" : (predicative ? "predicate adjective" : "adjective");
        if(t.role === "adjective" && prev && prev.tag === "CC" && k >= 2 && out[k-2].tag === "ADJ") t.role = out[k-2].role;
        if(!t.why) t.why = attributive ? "sits before a noun it describes" : (predicative ? "describes the subject through a linking verb" : "describes something");
      } else if(t.tag === "ADV"){
        t.role = "adverb";
        if(!t.why) t.why = "modifies a verb, an adjective or another adverb";
      } else if(isNounTag(t.tag)){
        const modifier = next && !t.brk && isNounTag(next.tag) && !LINKING.has(next.lw);
        t.role = modifier ? "noun modifier" : (t.fromAdj ? "nominalised adjective" : "noun");
        if(!t.why) t.why = modifier ? "a noun acting as a modifier of the noun after it" : "names the thing the phrase is about";
      }
    });
    return out;
  }

  // ---- 2. CHUNKER -----------------------------------------------
  const isNoun = g => g === "NN" || g === "NNS";
  const isVerbish = g => g === "VB" || g === "VBZ" || g === "VBD" || g === "VBN" || g === "VBG";

  function npAt(tg, i){
    let j = i;
    if(j < tg.length && tg[j].tag === "PRON") return { type:"NP", start:i, end:j, head:j };
    if(j < tg.length && tg[j].tag === "DET") j++;
    while(j < tg.length && tg[j].tag === "CD") j++;
    while(j < tg.length && tg[j].tag === "ADJ") j++;
    const nStart = j;
    while(j < tg.length && isNoun(tg[j].tag)){ j++; if(tg[j-1].brk) break; }
    if(j === nStart) return null;
    return { type:"NP", start:i, end:j-1, head:j-1 };
  }
  function vpAt(tg, i){
    let j = i, aux = -1;
    while(j < tg.length && ["MD","BE","HAVE","DO","TO"].indexOf(tg[j].tag) !== -1){ if(aux < 0) aux = j; j++; }
    while(j < tg.length && tg[j].tag === "ADV") j++;
    let main = -1;
    if(j < tg.length && isVerbish(tg[j].tag)) { main = j; j++; }
    if(aux < 0 && main < 0) return null;
    if(aux >= 0 && main < 0 && j === i + 1 + 0 && tg[i].tag === "TO") return null;
    return { type:"VP", start:i, end:j-1, aux, main, first:aux >= 0 ? aux : main };
  }
  function chunk(tg){
    const chunks = [];
    let i = 0;
    while(i < tg.length){
      let c = null;
      if(tg[i].tag === "PREP"){
        const np = npAt(tg, i+1);
        if(np){ c = { type:"PP", start:i, end:np.end, np }; }
      }
      c = c || npAt(tg, i) || vpAt(tg, i);
      if(!c){ chunks.push({ type:"O", start:i, end:i }); i++; continue; }
      chunks.push(c); i = c.end + 1;
    }
    return chunks;
  }

  // ---- 3. CLAUSE FINDER -----------------------------------------
  // number of a noun phrase: "sg" | "pl" | null 
  function numberOf(tg, np){
    const head = tg[np.head];
    const det = tg[np.start].tag === "DET" ? tg[np.start].lw : "";
    if(head.tag === "PRON"){
      if(/^(he|she|it)(\W|$)/.test(head.lw) || head.lw === "one") return "sg";
      if(/^(we|they)(\W|$)/.test(head.lw)) return "pl";
      return null;                                   // I, you, who, which...
    }
    if(VAGUE_NUMBER.has(head.lw)) return null;
    if(PLURAL_DET.has(det)) return "pl";
    if(SINGULAR_DET.has(det)) return "sg";
    if(head.fromAdj) return "pl";                        // "the poor are", "the young are"
    if(head.tag === "NNS") return "pl";
    if(head.tag === "NN") return "sg";
    return null;
  }

  function clauses(tg, chunks, text){
    const found = [];
    const sepBetween = (a, b) => /[,;:()\u2014\u2013-]/.test(text.slice(tg[a].end, tg[b].start));
    for(let c = 0; c < chunks.length; c++){
      if(chunks[c].type !== "NP") continue;
      // gather "NP and NP and NP"
      let subj = [chunks[c]], k = c + 1;
      while(k + 1 < chunks.length && chunks[k].type === "O" && tg[chunks[k].start].tag === "CC" &&
            chunks[k+1].type === "NP" && !sepBetween(chunks[k].start, chunks[k+1].start) &&
            !sepBetween(subj[subj.length-1].end, chunks[k].start)){
        subj.push(chunks[k+1]); k += 2;
      }
      const conj = subj.length > 1 ? tg[chunks[c + 1].start].lw : null;
      // skip prepositional phrases between subject and verb
      const pps = [];
      while(k < chunks.length && chunks[k].type === "PP"){ pps.push(chunks[k]); k++; }
      if(k >= chunks.length || chunks[k].type !== "VP") continue;
      const vp = chunks[k];
      // a comma between subject and verb means an interruption: stay silent
      if(sepBetween(subj[subj.length-1].end, vp.start) && !pps.length) continue;
      // a subject right after a subordinator / relative pronoun is fine; one
      // directly after another NP (e.g. relative clause) is not
      if(c > 0 && chunks[c-1].type === "NP") continue;

      let number;
      // Coordinated subjects ("X and Y", "X or Y") are left to the compound-subject rule in
      // grammar-rules.js, which knows the notional-singular idioms ("fish and chips is",
      // "rock and roll is"). Guessing here would flag those correct sentences.
      if(conj) number = null;
      else number = numberOf(tg, subj[0]);
      found.push({ subject:{ chunks:subj, number, head: subj[0].head }, viaPP: pps.length > 0, verb: vp });
      c = k;
    }
    return found;
  }

  // ---- public entry point ---------------------------------------
  function parseDocument(text, tokens, sentences){
    return sentences.map(sn => {
      const tg = tag(tokens.slice(sn.tokStart, sn.tokEnd), text);
      const chunks = chunk(tg);
      return { sentence:sn, tags:tg, chunks, clauses:clauses(tg, chunks, text) };
    });
  }

  // ---- 4. RULES THAT READ THE PARSE -----------------------------
  const matchCase = (model, word) =>
    (model === model.toUpperCase() && model.length > 1) ? word.toUpperCase()
    : (model[0] === model[0].toUpperCase() ? word[0].toUpperCase() + word.slice(1) : word);

  // "-ly" form of an adjective, if the dictionary has one: quick -> quickly, easy -> easily
  function advForm(w){
    const c = [w + "ly"];
    if(/[^aeiou]y$/.test(w)) c.unshift(w.slice(0, -1) + "ily");
    if(/le$/.test(w)) c.unshift(w.slice(0, -1) + "y");
    if(/ic$/.test(w)) c.unshift(w + "ally");
    return c.find(x => dictHas(x)) || null;
  }
  function isMannerVerb(w){
    if(MANNER_BASE.has(w)) return true;
    if(LEMMA[w] && MANNER_BASE.has(LEMMA[w])) return true;          // wrote -> write
    return [w.replace(/s$/, ""), w.replace(/es$/, ""), w.replace(/ed$/, ""), w.replace(/d$/, ""),
            w.replace(/ing$/, ""), w.replace(/ing$/, "e"), w.replace(/ied$/, "y"), w.replace(/ies$/, "y"),
            w.replace(/(.)\1ing$/, "$1"), w.replace(/(.)\1ed$/, "$1")]
      .some(c => c !== w && MANNER_BASE.has(c));
  }
  // beautifully -> beautiful, easily -> easy, terribly -> terrible, fantastically -> fantastic
  function adjOfAdv(adv){
    const c = [];
    if(/ily$/.test(adv)) c.push(adv.slice(0, -3) + "y");
    if(/ibly$/.test(adv)) c.push(adv.slice(0, -1) + "e");
    if(/ably$/.test(adv)) c.push(adv.slice(0, -1) + "e");
    if(/ically$/.test(adv)) c.push(adv.slice(0, -4));
    if(/ally$/.test(adv)) c.push(adv.slice(0, -2));
    if(/ly$/.test(adv)) c.push(adv.slice(0, -2));
    return c.find(x => x.length > 2 && dictHas(x)) || null;
  }

  function adverbIssues(parsed, add){
    for(const ps of parsed){
      const tg = ps.tags;
      tg.forEach((t, k) => {
        const prev = k > 0 ? tg[k-1] : null, next = k < tg.length-1 ? tg[k+1] : null;
        if(!prev || prev.brk) return;
        const verbTag = ["VB","VBZ","VBD","VBN","VBG"].indexOf(prev.tag) !== -1;
        const clauseEnds = t.brk || (next && ["PREP","CC","ADV","SUB"].indexOf(next.tag) !== -1);

        // 1. adjective where an adverb is needed: "He runs quick." -> "quickly"
        if(t.tag === "ADJ" && verbTag && isMannerVerb(prev.lw) && clauseEnds && !FLAT_ADV.has(t.lw) && !IDIOM_ADJ.has(t.lw)){
          let fix = advForm(t.lw);
          if(t.lw === "good") fix = "well";
          if(fix) add({ cat:"grammar", rule:"adverb-needed", severity:"critical",
            start:t.start, end:t.end, original:t.raw, suggestions:[matchCase(t.raw, fix)],
            title:"Adjective used as an adverb",
            why:'\u201c' + prev.raw + '\u201d is an action, so how it is done takes an adverb: \u201c' + fix + '\u201d.' });
          return;
        }
        // "You did good." -> "well"
        if(t.lw === "good" && prev.tag === "DO" && /^(did|done)$/.test(prev.lw) && clauseEnds){
          add({ cat:"grammar", rule:"adverb-needed", severity:"critical",
            start:t.start, end:t.end, original:t.raw, suggestions:[matchCase(t.raw, "well")],
            title:"Adjective used as an adverb",
            why:'How something was done takes an adverb: \u201cwell\u201d, not \u201cgood\u201d.' });
          return;
        }
        // "real quick" -> "really quick"
        if(t.lw === "real" && next && !t.brk && (next.tag === "ADJ" || next.tag === "ADV") && !LINKING.has(next.lw)){
          add({ cat:"grammar", rule:"adverb-needed", severity:"advisory",
            start:t.start, end:t.end, original:t.raw, suggestions:[matchCase(t.raw, "really")],
            title:"Adjective used as an adverb",
            why:'\u201creal\u201d is an adjective; to intensify \u201c' + next.raw + '\u201d use \u201creally\u201d.' });
          return;
        }
        // 2. adverb where an adjective is needed: "The song sounds beautifully." -> "beautiful"
        if(t.tag === "ADV" && EVAL_ADV.has(t.lw) && SENSE_VERB.has(prev.lw) && t.brk){
          const adj = adjOfAdv(t.lw);
          if(adj) add({ cat:"grammar", rule:"adjective-needed", severity:"critical",
            start:t.start, end:t.end, original:t.raw, suggestions:[matchCase(t.raw, adj)],
            title:"Adverb used as an adjective",
            why:'\u201c' + prev.raw + '\u201d describes the subject here, so it takes an adjective: \u201c' + adj + '\u201d.' });
        }
      });
    }
  }

  function parserIssues(parsed, add){
    adverbIssues(parsed, add);
    for(const ps of parsed){
      for(const cl of ps.clauses){
        const { subject, verb } = cl;
        if(!subject.number || verb.aux < 0) continue;
        const aux = ps.tags[verb.aux];
        if(aux.tag === "MD" || aux.tag === "TO") continue;     // modals never agree
        const w = aux.lw;
        let fix = null;
        if(subject.number === "pl" && AUX_FIX[w]) fix = AUX_FIX[w];
        if(subject.number === "sg" && AUX_FIX_BACK[w]) fix = AUX_FIX_BACK[w];
        if(!fix) continue;
        const subjText = ps.tags[subject.chunks[0].start].raw + "…" + ps.tags[subject.head].raw;
        const first = ps.tags[subject.chunks[0].start], last = ps.tags[subject.chunks[subject.chunks.length-1].end];
        add({ cat:"grammar", rule:"agreement-parse", severity:"critical",
          start:aux.start, end:aux.end, original:aux.raw,
          suggestions:[matchCase(aux.raw, fix)],
          title:"Subject and verb don't agree",
          why:'The subject here is ' + (subject.number === "pl" ? "plural" : "singular") +
              ' (\u201c' + ps.tags[subject.head].raw + '\u201d)' +
              (cl.viaPP ? ', and the words in between don\u2019t change that' : '') +
              ', so the verb should be \u201c' + fix + '\u201d.' });
      }
    }
  }

  // Debug / teaching helper: what job does each word do in this text?
  function explain(text){
    const tokens = tokenize(text), sentences = splitSentences(text, tokens);
    return parseDocument(text, tokens, sentences).flatMap(ps => ps.tags.map(t => ({
      word: t.raw, tag: t.tag, role: t.role, why: t.why, src: t.src, uncertain: t.uncertain })));
  }

  // What can this word be, and how do we know?
  function classesOf(word){
    const w = word.toLowerCase(), c = morphTag(w);
    const inf = w.length >= 3 ? inferClasses(w) : null;
    return { word:w, classes:c.slice(), src:c.src, evidence: inf ? inf.evidence : null };
  }
  // Teach the parser a word (e.g. from the user's own dictionary).
  // addDual("ADJ NN", "grey taupe")  /  addDual("NN VB", "email")
  function addDual(classes, words){
    words.split(/\s+/).filter(Boolean).forEach(w => { DUAL[w.toLowerCase()] = classes.split(" "); });
  }

  // Extend any list at runtime, e.g. from a user dictionary or a settings panel:
  //   PARSER.extend({ manner:"whisper bellow", flatAdverbs:"cheap", farAdverbs:"cheap",
  //                   idiomatic:"gritty", senseVerbs:"seem", evaluative:"glamorously",
  //                   lyAdjectives:"scholarly" })
  const LISTS = { manner:MANNER_BASE, flatAdverbs:FLAT_ADV, farAdverbs:FAR_ADV, idiomatic:IDIOM_ADJ,
                  senseVerbs:SENSE_VERB, evaluative:EVAL_ADV, lyAdjectives:LY_ADJ };
  function extend(spec){
    let added = 0;
    Object.keys(spec).forEach(k => {
      if(!LISTS[k]) throw new Error("PARSER.extend: unknown list \u201c" + k + "\u201d (" + Object.keys(LISTS).join(", ") + ")");
      spec[k].split(/\s+/).filter(Boolean).forEach(w => { if(!LISTS[k].has(w.toLowerCase())){ LISTS[k].add(w.toLowerCase()); added++; } });
    });
    return added;
  }
  const sizes = () => Object.keys(LISTS).reduce((o, k) => (o[k] = LISTS[k].size, o), { irregularForms: IRREGULAR_PAST.size });

  return { tag, chunk, clauses, parseDocument, parserIssues, numberOf, explain, classesOf, addDual, extend, sizes };
})();
