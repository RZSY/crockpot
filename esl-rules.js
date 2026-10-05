// ===============================================================
// 6b. LEARNER-ENGLISH RULES
//     The patterns in this file are the ones a second-language writer
//     reaches for most often and a spellchecker cannot see at all:
//     embedded-question word order, "enjoy to read", "is knowing",
//     "have seen it yesterday", "if she will come", "married with",
//     "returned back", "Her went", "than me do", and a few dozen more.
//
//     The same house rule applies as in grammar-rules.js: every rule is
//     written to stay silent when the context is ambiguous. A missed
//     error costs a reader nothing; a wrong correction costs trust. Most
//     rules therefore insist on a pronoun subject, a closed list of
//     verbs, or a clause boundary on one side before they speak.
// ===============================================================

// ---- inflection helpers (spelling-aware, unlike the lexicon's) ------
const ESL_MULTI_DOUBLE = S("begin forget prefer admit permit occur refer regret control commit submit upset omit transmit equip");
function eslSyllables(w){ const m = w.match(/[aeiouy]+/g); return m ? m.length : 0; }
function eslDoubles(base){
  if(ESL_MULTI_DOUBLE.has(base)) return true;
  return /[^aeiou][aeiou][^aeiouwxy]$/.test(base) && eslSyllables(base) === 1;
}
function eslIng(base){
  if(base === "be") return "being";
  if(/ie$/.test(base)) return base.slice(0,-2) + "ying";
  if(/[^aeiouye]e$/.test(base)) return base.slice(0,-1) + "ing";
  if(eslDoubles(base)) return base + base[base.length-1] + "ing";
  return base + "ing";
}
function eslPast(base){
  if(base === "be") return "was";
  if(IRREGULAR_VERBS[base]) return IRREGULAR_VERBS[base][0];
  if(/e$/.test(base)) return base + "d";
  if(/[^aeiou]y$/.test(base)) return base.slice(0,-1) + "ied";
  if(eslDoubles(base)) return base + base[base.length-1] + "ed";
  return base + "ed";
}
function eslParticiple(base){
  if(base === "be") return "been";
  if(IRREGULAR_VERBS[base]) return IRREGULAR_VERBS[base][1];
  return eslPast(base);
}
function eslThird(base){
  if(base === "be") return "is";
  if(base === "have") return "has";
  return thirdPerson(base);
}
// Any inflected form of a verb back to its base, or "" when it isn't one.
function eslBaseOf(w){
  if(w === "is" || w === "are" || w === "am" || w === "was" || w === "were" || w === "been" || w === "being") return "be";
  if(w === "has" || w === "had" || w === "having") return "have";
  if(w === "does" || w === "did" || w === "done" || w === "doing") return "do";
  if(ALL_BASE_VERBS.has(w)) return w;
  if(IRREG_PAST.has(w) || IRREG_PART.has(w)){
    for(const b in IRREGULAR_VERBS){ if(IRREGULAR_VERBS[b][0] === w || IRREGULAR_VERBS[b][1] === w) return b; }
  }
  if(/ing$/.test(w) && w.length > 4){
    const s = w.slice(0,-3);
    if(ALL_BASE_VERBS.has(s)) return s;
    if(ALL_BASE_VERBS.has(s+"e")) return s+"e";
    if(s.length > 2 && s[s.length-1] === s[s.length-2] && ALL_BASE_VERBS.has(s.slice(0,-1))) return s.slice(0,-1);
    if(/y$/.test(s) === false && /yi$/.test(s)) return "";
    return "";
  }
  if(/ed$/.test(w)){
    const s = w.slice(0,-2);
    if(ALL_BASE_VERBS.has(s)) return s;
    if(ALL_BASE_VERBS.has(s+"e")) return s+"e";
    if(/i$/.test(s) && ALL_BASE_VERBS.has(s.slice(0,-1)+"y")) return s.slice(0,-1)+"y";
    if(s.length > 2 && s[s.length-1] === s[s.length-2] && ALL_BASE_VERBS.has(s.slice(0,-1))) return s.slice(0,-1);
    return "";
  }
  if(/s$/.test(w) && !/ss$/.test(w)){
    if(/ies$/.test(w) && ALL_BASE_VERBS.has(w.slice(0,-3)+"y")) return w.slice(0,-3)+"y";
    if(/(ch|sh|x|z|s|o)es$/.test(w) && ALL_BASE_VERBS.has(w.slice(0,-2))) return w.slice(0,-2);
    if(ALL_BASE_VERBS.has(w.slice(0,-1))) return w.slice(0,-1);
  }
  return "";
}
function eslMatchCase(model, word){
  if(!model || !word) return word;
  if(model.length > 1 && model === model.toUpperCase() && /[A-Z]/.test(model)) return word.toUpperCase();
  if(model[0] !== model[0].toLowerCase()) return word[0].toUpperCase() + word.slice(1);
  return word;
}

// ---- word lists -----------------------------------------------------
const ESL_SUBJ = S("i he she we they you it");
const ESL_SUBJ_NOIT = S("i he she we they you");
const ESL_OBJ  = S("me him her us them you it");
const ESL_OBJ_PERSON = S("me him her us them");
const ESL_OBJ_TO_SUBJ = { me:"I", him:"he", her:"she", us:"we", them:"they" };
const ESL_SUBJ_TO_OBJ = { i:"me", he:"him", she:"her", we:"us", they:"them" };
const ESL_WH = S("what where why how who when");
const ESL_AUX_BE = S("is are was were am");
const ESL_AUX_MODAL = S("can could will would should shall may might must");
const ESL_AUX_HAVE = S("have has had");
const ESL_AUX_DO = S("do does did");
const ESL_DET = S("the a an my your his her our their this that these those");
const ESL_TIME_WORDS = S("today tonight now tomorrow yesterday");
const ESL_NEG_POS = { "can't":"can", "don't":"do", "doesn't":"does", "didn't":"did", "couldn't":"could",
  "won't":"will", "wouldn't":"would", "isn't":"is", "aren't":"are", "wasn't":"was", "weren't":"were",
  "haven't":"have", "hasn't":"has", "hadn't":"had", "shouldn't":"should", "mustn't":"must" };
// verbs whose complement is an -ing form, never "to"
const ESL_GERUND_VERBS = S("avoid enjoy finish mind suggest consider practise practice imagine risk postpone delay appreciate resist escape dislike");
// verbs that take "to"-infinitives, never a bare -ing form
const ESL_TO_VERBS = S("hope promise decide refuse agree manage afford offer plan expect want need learn wish");
const ESL_TO_VERBS_STRICT = S("hope promise decide refuse agree manage afford offer");
// verbs that want  object + to-infinitive
const ESL_OBJ_TO_VERBS = S("allow permit enable encourage persuade advise invite urge ask tell want expect order force warn remind forbid teach cause");
// words that are adjectives or nouns as well as base verbs; never read "He is X" as a verb
const ESL_NOT_PREDICATE_VERB = S(`close open clear fit dry last present mean left right well fine even kind blind mind second content
  head chair lead star host judge partner boss guard cut hit hurt let put quit read set shut cost spread burst live
  still free cool calm warm lie like own`);
const ESL_STATIVE = S("know believe understand want need own belong seem consist contain cost resemble owe prefer possess lack deserve doubt");
const ESL_STATIVE_PERSON_ONLY = S("know understand want need prefer believe doubt deserve");
const ESL_STATIVE_ANY_SUBJECT = S("contain consist belong resemble possess own owe lack");
// bases that read naturally as simple present after dropping "am/is/are": "I am agree" -> "I agree"
const ESL_DROP_BE_VERBS = S("agree believe want need know understand like love hate hope think prefer wish remember belong seem own contain");

const ESL_COUNT_NOUNS = S(`
 question answer mistake problem reason solution idea student teacher friend person child man woman boy girl
 book page chapter story letter message email word sentence number name day week month year hour minute
 car house room door window table chair bed bag box key phone computer picture photo song film movie game
 team group company product service customer client worker doctor nurse driver player member issue point
 example result change difference option choice decision plan project job office city country town village
 road street building shop store school class lesson course exam test report paper file list item thing
 way place country event party meeting visitor tourist passenger patient animal dog cat bird horse fish
 apple orange cookie sandwich meal dish cup glass bottle plate hand finger foot leg eye ear head tooth
 country language mile pound dollar rule law case fact tool machine mistake error bug feature step attempt
 effort suggestion complaint opinion argument reply request offer invitation lie secret trick joke goal
`);
const ESL_UNCOUNT_QUANT = S(`patience mail rubbish garbage pollution laughter scenery jewellery jewelry cash accommodation
 permission behaviour behavior attention luck advice information furniture luggage baggage equipment knowledge research
 evidence homework housework traffic weather music progress feedback`);
const ESL_LATIN_PLURALS = S("criteria curricula phenomena bacteria alumni stimuli");
const ESL_IRREG_SING_TO_PL = { phenomenon:"phenomena", mouse:"mice", person:"people", thesis:"theses", criterion:"criteria",
  analysis:"analyses", crisis:"crises", hypothesis:"hypotheses", child:"children", man:"men", woman:"women",
  foot:"feet", tooth:"teeth", goose:"geese", ox:"oxen", bacterium:"bacteria", curriculum:"curricula",
  stimulus:"stimuli", nucleus:"nuclei", cactus:"cacti", fungus:"fungi", alumnus:"alumni", datum:"data" };
const ESL_PLURAL_QUANT = S("several numerous various many few two three four five six seven eight nine ten dozen");
const ESL_NOT_NOUN_AFTER_QUANT = S("more less other others same least most much such enough hundred thousand million billion dozen of");
// verbs that are fine as "is go"-style carriers elsewhere; kept empty on purpose
const ESL_STATIVE_NOT = new Set();
const ESL_MONTHS = S("january february march april may june july august september october november december");
const ESL_DAYS = S("monday tuesday wednesday thursday friday saturday sunday");

// Past-tense forms. "Distinct" means different from the base form, so that
// "cut/put/set/read" (which are their own past) never count as an error.
function eslPastBase(w){
  if(IRREG_PAST.has(w)){
    for(const b in IRREGULAR_VERBS){ if(IRREGULAR_VERBS[b][0] === w && b !== w) return b; }
    return "";
  }
  if(/ed$/.test(w) && isPastForm(w)) return eslBaseOf(w);
  return "";
}
// irregular past that is not also the past participle: went/gone, ran/run, saw/seen
function eslPastNotParticiple(w){
  if(!IRREG_PAST.has(w)) return "";
  for(const b in IRREGULAR_VERBS){
    if(IRREGULAR_VERBS[b][0] === w && IRREGULAR_VERBS[b][1] !== w && b !== w) return b;
  }
  return "";
}
// words that look like a past tense but are usually something else
const ESL_AMBIG_PAST = S("saw found left rose lay fell bound ground wound bore lit meant spoke said used");

// ===============================================================
function eslIssues(text, tokens, sentences, add){
  const n = tokens.length;
  if(!n) return;
  const L = i => (i>=0 && i<n) ? tokens[i].lw : "";
  const R = i => (i>=0 && i<n) ? tokens[i].raw : "";
  const gapText = i => (i>=0 && i<n-1) ? text.slice(tokens[i].end, tokens[i+1].start) : "";
  const tight = i => i>=0 && i<n-1 && /^[ \t]*$/.test(gapText(i));
  const clauseEnd = i => i>=n-1 || !tight(i);
  const sameS = (i,j) => i>=0 && j>=0 && i<n && j<n && tokens[i].s === tokens[j].s;
  const sentStart = i => i>=0 && i<n && tokens[i].i === 0;
  // the token starts a clause: sentence start, or straight after punctuation
  const clauseStart = i => i === 0 || sentStart(i) || !tight(i-1);
  const sp = (i,j) => ({ start:tokens[i].start, end:tokens[j].end, original:text.slice(tokens[i].start, tokens[j].end) });
  const mc = (i, word) => eslMatchCase(R(i), word);
  const isCap = i => /^[A-Z]/.test(R(i)) && !sentStart(i) && R(i) !== "I";
  function emit(rule, i, j, suggestions, title, why, severity){
    let span = sp(i,j);
    // A pure deletion absorbs one neighbouring space, so applying it never
    // leaves a double space or a space before punctuation.
    if(suggestions && suggestions.length === 1 && suggestions[0] === ""){
      if(text[span.end] === " ") span = { start: span.start, end: span.end + 1, original: text.slice(span.start, span.end + 1) };
      else if(span.start > 0 && text[span.start-1] === " ") span = { start: span.start - 1, end: span.end, original: text.slice(span.start - 1, span.end) };
    }
    add({ cat:"grammar", rule, severity: severity || "critical", ...span,
          suggestions: suggestions || [], title, why });
  }
  // a run of tokens i..j with nothing but spaces between them
  const run = (i,j) => { for(let k=i;k<j;k++) if(!tight(k)) return false; return true; };
  // a word that can head a noun phrase
  const noun = w => DICTIONARY.has(w) && !ESL_SUBJ.has(w) && !ESL_OBJ_PERSON.has(w) && !PREPOSITIONS.has(w) &&
                    !CONJUNCTIONS.has(w) && !BE_FORMS.has(w) && !HAVE_FORMS.has(w) && !DO_FORMS.has(w) &&
                    !MODALS.has(w) && !DETERMINERS.has(w);
  // A short noun phrase starting at i: [det] [adj] noun. Returns last index, or -1.
  function simpleNP(i){
    let j = i;
    if(DETERMINERS.has(L(j))){ if(!tight(j)) return -1; j++; }
    let guard = 0;
    while(j < n-1 && tight(j) && isAdjective(L(j)) && guard < 2){ j++; guard++; }
    if(j >= n) return -1;
    const w = L(j);
    if(!noun(w) || isAdverb(w)) return -1;
    return j;
  }
  // present-tense be for a subject: I -> am, he/she/it -> is, otherwise are
  const beFor = w => w === "i" ? "am" : (w === "he" || w === "she" || w === "it") ? "is" : "are";
  const YEAR_AFTER = i => /^\s*(?:19|20)\d\d\b/.test(text.slice(tokens[i].end, tokens[i].end + 8));
  const NUM_AFTER = i => /^\s*[0-9]+/.test(text.slice(tokens[i].end, tokens[i].end + 12));

  const ctx = { n, L, R, tight, clauseEnd, sameS, sentStart, clauseStart, sp, mc, isCap, emit, run,
                noun, simpleNP, beFor, YEAR_AFTER, NUM_AFTER, text, tokens, add, gapText };
  for(const fam of ESL_FAMILIES) fam(ctx);
}

// Each family receives the shared context and walks the tokens itself, so
// one family can be tuned without disturbing another.
const ESL_FAMILIES = [];

// All inflected forms of a list of base verbs, as a set.
function eslForms(set){
  const out = new Set();
  for(const b of set){
    out.add(b); out.add(eslThird(b)); out.add(eslPast(b)); out.add(eslParticiple(b)); out.add(eslIng(b));
  }
  return out;
}
const ESL_NUMBER_WORDS = S("one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty sixty hundred thousand million");

// ---------------------------------------------------------------
// 1. EMBEDDED QUESTIONS: "She wondered where did he go"
//    An embedded question keeps statement order: "where he went".
// ---------------------------------------------------------------
ESL_FAMILIES.push(function embeddedQuestions(c){
  const { n, L, R, tight, clauseEnd, sameS, sp, emit, mc, tokens, text } = c;
  const TRIG = S(`ask asks asked asking know knows knew wonder wonders wondered wondering tell tells told explain explains
    explained understand understood remember remembered forget forgot decide decided learn learned discover discovered
    show showed idea sure curious see saw realise realised realize realized`);
  const OBJ = S("me you him her us them");
  const BACKSHIFT = { can:"could", will:"would", may:"might", shall:"should" };
  const DEM = S("this that these those");
  const wellFormedAfter = e => clauseEnd(e) || PREPOSITIONS.has(L(e+1)) || CONJUNCTIONS.has(L(e+1)) ||
    ADJECTIVAL_PARTICIPLES.has(L(e+1)) || isPastForm(L(e+1)) || isIngForm(L(e+1)) || isAdverb(L(e+1)) || isAdjective(L(e+1));
  for(let t=0;t<n-2;t++){
    if(!TRIG.has(L(t)) || !tight(t)) continue;
    let j = t+1;
    if(OBJ.has(L(j)) && tight(j)){ j++; }
    const pastTrigger = /^(asked|wondered|knew|told|explained|forgot|decided|learned|discovered|showed|saw|understood|remembered|realised|realized)$/.test(L(t));

    // -- no wh-word at all: "He asked me can I help" --
    if(/^(ask|asks|asked|asking|wonder|wonders|wondered|wondering)$/.test(L(t)) && ESL_AUX_MODAL.has(L(j)) &&
       tight(j) && ESL_SUBJ.has(L(j+1)) && tight(j+1) && L(j) !== "will" && sameS(t,j+1) &&
       (isBaseVerb(L(j+2)) || L(j+2) === "be")){
      const m = pastTrigger ? (BACKSHIFT[L(j)] || L(j)) : L(j);
      emit("embedded-question", j, j+1, ["if " + R(j+1) + " " + m],
        "Embedded question",
        'After "'+L(t)+'", the question becomes a clause: "if I '+m+'", not "'+L(j)+' I".');
      continue;
    }
    const wh = L(j);
    if(!ESL_WH.has(wh) || !tight(j) || !sameS(t,j)) continue;
    const k = j+1, aux = L(k);
    if(k >= n || !tight(k) && k < n-1 && false) continue;

    // -- wh + do/does/did + subject + verb --
    if(ESL_AUX_DO.has(aux) && tight(k)){
      const s = k+1;
      let subjEnd = -1;
      if(ESL_SUBJ.has(L(s))) subjEnd = s;
      else if(DETERMINERS.has(L(s)) && tight(s) && noun(L(s+1))) subjEnd = s+1;
      function noun(w){ return DICTIONARY.has(w) && !PRONOUNS.has(w) && !isAdjective(w) && !ESL_AUX_BE.has(w) && !MODALS.has(w); }
      if(subjEnd < 0 || subjEnd >= n-1 || !tight(subjEnd)) continue;
      const v = subjEnd+1, vw = L(v);
      const base = isBaseVerb(vw) ? vw : eslBaseOf(vw);
      if(!base || MODALS.has(vw) || PREPOSITIONS.has(vw)) continue;
      let verb;
      if(aux === "did") verb = (eslPastBase(vw) || IRREG_PAST.has(vw)) && vw !== base ? vw : eslPast(base);
      else if(aux === "does") verb = (isThirdPersonVerb(vw) && vw !== base) ? vw : eslThird(base);
      else verb = base;
      if(base === "be") continue;
      const subj = text.slice(tokens[s].start, tokens[subjEnd].end);
      emit("embedded-question", j, v, [R(j) + " " + subj + " " + verb],
        "Embedded question",
        'Inside a longer sentence, "'+wh+'" introduces a clause, which keeps statement order: "'+wh+' '+subj+' '+verb+'", with no "'+aux+'".');
      continue;
    }
    // -- wh + be + pronoun / noun phrase --
    if(ESL_AUX_BE.has(aux) && tight(k) && k < n-1){
      const s = k+1;
      if(ESL_SUBJ.has(L(s)) && (L(s) !== "it" || wh !== "what" || true)){
        // "what is it like" is a real embedded predicate question; leave it
        if(L(s) === "it" && L(s+1) === "like") continue;
        emit("embedded-question", j, s, [R(j) + " " + R(s) + " " + R(k)],
          "Embedded question",
          'Inside a longer sentence, "'+wh+'" introduces a clause, which keeps statement order: "'+wh+' '+R(s)+' '+R(k)+'".');
        continue;
      }
      if(DEM.has(L(s)) && clauseEnd(s) && wh !== "who"){
        emit("embedded-question", j, s, [R(j) + " " + R(s) + " " + R(k)],
          "Embedded question",
          'Inside a longer sentence, "'+wh+'" introduces a clause, which keeps statement order: "'+wh+' '+R(s)+' '+R(k)+'".');
        continue;
      }
      if(wh !== "who" && DETERMINERS.has(L(s)) && !/^(what|which|whose|no|any|some|much|many|few|all|most|enough|such|every|each)$/.test(L(s))){
        // determiner + noun, with a verb-ish or boundary after it
        let e = s+1, guard = 0;
        if(tight(s) && e < n){
          while(e < n-1 && tight(e) && isAdjective(L(e)) && guard < 2){ e++; guard++; }
          const nw = L(e);
          if(DICTIONARY.has(nw) && !PRONOUNS.has(nw) && !isAdjective(nw) && !ESL_AUX_BE.has(nw) &&
             !MODALS.has(nw) && !HAVE_FORMS.has(nw) && !DO_FORMS.has(nw) && !CONJUNCTIONS.has(nw) && wellFormedAfter(e)){
            const np = text.slice(tokens[s].start, tokens[e].end);
            emit("embedded-question", j, e, [R(j) + " " + np + " " + R(k)],
              "Embedded question",
              'Inside a longer sentence, "'+wh+'" introduces a clause, which keeps statement order: "'+wh+' '+np+' '+R(k)+'".');
            continue;
          }
        }
      }
      continue;
    }
    // -- wh + modal / have + pronoun --
    if((ESL_AUX_MODAL.has(aux) || ESL_AUX_HAVE.has(aux)) && tight(k) && ESL_SUBJ.has(L(k+1)) && k+1 < n-1 && tight(k+1) &&
       (isBaseVerb(L(k+2)) || L(k+2) === "be" || IRREG_PART.has(L(k+2)) || isPastForm(L(k+2)))){
      emit("embedded-question", j, k+1, [R(j) + " " + R(k+1) + " " + R(k)],
        "Embedded question",
        'Inside a longer sentence, "'+wh+'" introduces a clause, which keeps statement order: "'+wh+' '+R(k+1)+' '+R(k)+'".');
    }
  }
});

// ---------------------------------------------------------------
// 2. MODAL VERBS: "should to leave", "can't does", "ought leave"
// ---------------------------------------------------------------
ESL_FAMILIES.push(function modalComplements(c){
  const { n, L, R, tight, sp, emit, mc, clauseStart } = c;
  const MOD = S("can could may might must shall should will would can't couldn't mustn't shouldn't won't wouldn't mightn't cannot");
  const NOUNY = S("can will may must might");
  const noModal = i => !(i > 0 && tight(i-1) && (DETERMINERS.has(L(i-1)) || PREPOSITIONS.has(L(i-1)) || isAdjective(L(i-1))));
  for(let i=0;i<n-1;i++){
    const w = L(i);
    if(MOD.has(w) && tight(i) && (!NOUNY.has(w) || noModal(i))){
      const w1 = L(i+1);
      // modal + to + verb
      if(w1 === "to" && tight(i+1) && i+2 < n && isBaseVerb(L(i+2)) && !(w === "can" && L(i+2) === "can")){
        emit("modal-to", i, i+2, [R(i) + " " + R(i+2)], 'No "to" after a modal verb',
          '"'+w+'" is followed directly by the bare verb: "'+R(i)+' '+R(i+2)+'".');
        continue;
      }
      // modal + third-person -s / past / -ing
      const nxt = i+1;
      const b3 = (isThirdPersonVerb(w1) && !NOUN_ONLY_S.has(w1)) ? eslBaseOf(w1) : "";
      if(b3 && b3 !== w1 && !MODALS.has(w1)){
        emit("modal-form", i, nxt, [R(i) + " " + b3], "Verb form after a modal",
          'After "'+w+'" the verb stays in its base form: "'+b3+'", not "'+w1+'".');
        continue;
      }
      if(!ESL_AMBIG_PAST.has(w1) && !ADJECTIVAL_PARTICIPLES.has(w1) && !ALL_BASE_VERBS.has(w1)){
        const bp = eslPastBase(w1);
        if(bp && bp !== "be" && !HAVE_FORMS.has(w1) || w1 === "had" && false){
          emit("modal-form", i, nxt, [R(i) + " " + bp], "Verb form after a modal",
            'After "'+w+'" the verb stays in its base form: "'+bp+'", not "'+w1+'".');
          continue;
        }
      }
      if(isIngForm(w1) && !/^(being|having|doing)$/.test(w1)){
        const bi = eslBaseOf(w1);
        if(bi && bi !== "be" && w !== "will" || (bi && w === "will" && false)){
          emit("modal-form", i, nxt, [R(i) + " " + bi], "Verb form after a modal",
            'After "'+w+'" the verb stays in its base form: "'+bi+'", not "'+w1+'".');
          continue;
        }
      }
    }
    // "had better not to forget"
    if(w === "better" && (L(i-1) === "had" || /'d$/.test(L(i-1))) && tight(i-1)){
      let j = i+1;
      if(L(j) === "not" && tight(j)) j++;
      if(L(j) === "to" && tight(j) && isBaseVerb(L(j+1))){
        emit("modal-to", j, j+1, [R(j+1)], 'No "to" after "had better"',
          '"had better" is followed directly by the bare verb: "better '+(L(i+1)==="not"?"not ":"")+R(j+1)+'".');
      }
    }
    // "ought leave" -> "ought to leave"
    if(w === "ought" && tight(i) && isBaseVerb(L(i+1)) && L(i+1) !== "to"){
      emit("ought-to", i, i+1, [R(i) + " to " + R(i+1)], '"Ought" takes "to"',
        '"ought" is always followed by "to": "'+R(i)+' to '+R(i+1)+'".');
    }
    // "able doing" -> "able to do"
    if(w === "able" && tight(i) && isIngForm(L(i+1)) && L(i-1) && BE_FORMS.has(L(i-1))){
      const b = eslBaseOf(L(i+1));
      if(b && b !== "be") emit("able-to", i, i+1, [R(i) + " to " + b], '"Able" takes "to"',
        '"able" is followed by "to" and the bare verb: "able to '+b+'".');
    }
  }
});

// ---------------------------------------------------------------
// 3. BE + BARE VERB, MISSING BE, FUTURE/PROGRESSIVE SLIPS
// ---------------------------------------------------------------
ESL_FAMILIES.push(function progressiveSlips(c){
  const { n, L, R, tight, sp, emit, mc, isCap, sentStart, clauseEnd, tokens, text, beFor } = c;
  const subjectBefore = i => i > 0 && tight(i-1) && (ESL_SUBJ_NOIT.has(L(i-1)) || (isCap(i-1) && !DICTIONARY.has(L(i-1))));
  const simpleFor = (subjIdx, base) => {
    const sw = L(subjIdx);
    return (sw === "i" || sw === "we" || sw === "they" || sw === "you") ? base : eslThird(base);
  };
  for(let i=0;i<n-1;i++){
    const w = L(i), w1 = L(i+1);
    // am/is/are/was/were + bare verb
    if(ESL_AUX_BE.has(w) && tight(i) && subjectBefore(i)){
      if(isBaseVerb(w1) && w1 !== "be" && !ESL_NOT_PREDICATE_VERB.has(w1) && !isAdjective(w1) && !COMMON_ADJECTIVES.has(w1) &&
         !ESL_STATIVE_NOT.has(w1)){
        const past = (w === "was" || w === "were");
        if(ESL_DROP_BE_VERBS.has(w1)){
          const form = past ? eslPast(w1) : simpleFor(i-1, w1);
          emit("be-bare-verb", i-1, i+1, [R(i-1) + " " + form], "Check the verb form",
            '"'+R(i)+' '+R(i+1)+'" mixes "be" with a bare verb. In the simple tense it is just "'+R(i-1)+' '+form+'".');
        } else {
          emit("be-bare-verb", i, i+1, [R(i) + " " + eslIng(w1)], "Missing -ing",
            'After "'+R(i)+'", an action verb needs its -ing form: "'+R(i)+' '+eslIng(w1)+'".');
        }
        continue;
      }
    }
    // pronoun + -ing with no "be":  "She going to buy it"
    if(ESL_SUBJ_NOIT.has(w) && tight(i) && isIngForm(w1) && !/^(being|having|doing|during|according)$/.test(w1)){
      const b = eslBaseOf(w1);
      const prev = L(i-1);
      if(b && b !== "be" && !/^(with|without|see|saw|hear|heard|watch|watched|noticed|notice|imagine|that|than|as|like|and|but|or)$/.test(prev) &&
         !PREPOSITIONS.has(prev) && !BE_FORMS.has(prev) && !HAVE_FORMS.has(prev) && !DO_FORMS.has(prev) && !MODALS.has(prev)){
        const be = beFor(w);
        emit("missing-be", i, i+1, [R(i) + " " + be + " " + R(i+1)], 'Missing "'+be+'"',
          'A progressive verb needs a form of "be": "'+R(i)+' '+be+' '+R(i+1)+'".');
        continue;
      }
    }
    // will be + base verb:  "They will be arrive soon"
    if(/^(will|would|can|could|may|might|must|should|shall)$/.test(w) && tight(i) && w1 === "be" && tight(i+1) && i+2 < n){
      const v = L(i+2);
      if(isBaseVerb(v) && v !== "be" && !ESL_NOT_PREDICATE_VERB.has(v) && !isAdjective(v) && !COMMON_ADJECTIVES.has(v) &&
         !ESL_STATIVE_NOT.has(v) && !(i > 0 && tight(i-1) && DETERMINERS.has(L(i-1))) &&
         eslParticiple(v) !== v){
        const sugg = /^(can|could|may|might|must|should)$/.test(w)
          ? [R(i)+" be "+eslParticiple(v), R(i)+" "+v]
          : [R(i)+" "+v, R(i)+" be "+eslIng(v)];
        emit("will-be-bare", i, i+2, sugg, 'Check "be" + verb',
          '"'+R(i)+' be '+R(i+2)+'" mixes the passive or progressive with a bare verb.');
      }
    }
    // is going visit -> is going to visit
    if(w === "going" && BE_FORMS.has(L(i-1)) && tight(i-1) && tight(i) && isBaseVerb(w1) && !/^(live|wrong|be|fit|cut|well|even|mad|free|clear|dry|open|close)$/.test(w1) &&
       !isAdjective(w1) && !COMMON_ADJECTIVES.has(w1) && !ESL_NOT_PREDICATE_VERB.has(w1) && L(i+2) !== "to"){
      emit("going-to", i, i+1, [R(i) + " to " + R(i+1)], 'Missing "to"',
        '"going" needs "to" before the verb: "going to '+R(i+1)+'".');
    }
  }
});


// ---------------------------------------------------------------
// 4. VERB COMPLEMENTATION: "enjoys to read", "hope seeing", "asked me helping"
// ---------------------------------------------------------------
const ESL_GERUND_FORMS = eslForms(ESL_GERUND_VERBS);
const ESL_TO_FORMS = eslForms(S("want need try decide hope plan like love hate begin start refuse agree manage expect promise learn forget remember ask tell continue fail seem appear help prefer intend offer afford wish choose allow encourage force invite teach urge warn remind order advise permit enable attempt tend deserve dare"));
const ESL_TO_STRICT_FORMS = eslForms(ESL_TO_VERBS_STRICT);
const ESL_OBJ_TO_FORMS = eslForms(ESL_OBJ_TO_VERBS);
const ESL_CLEAR_VERBS = S(`come go leave stay study help join start finish stop wait arrive call sit stand do make take give sleep eat
  drink run swim learn try think know see bring buy send speak talk listen follow forget remember sing dance cook clean
  drive fly pay pass meet open close sell write read visit enter return move`);
ESL_FAMILIES.push(function verbComplementation(c){
  const { n, L, R, tight, clauseEnd, sameS, emit, mc, sp, text, tokens } = c;
  const phraseEndsAfter = k => clauseEnd(k) || ESL_OBJ.has(L(k+1)) || DETERMINERS.has(L(k+1)) || PREPOSITIONS.has(L(k+1)) ||
                               isAdverb(L(k+1)) || CONJUNCTIONS.has(L(k+1)) || ESL_SUBJ.has(L(k+1));
  const notBe = S("being having doing");
  for(let i=0;i<n-1;i++){
    const w = L(i), w1 = L(i+1);
    if(!tight(i)) continue;

    // ---- to-infinitive written with the wrong verb form ----
    if(w1 === "to" && tight(i+1) && i+2 < n){
      const trigger = ESL_TO_FORMS.has(w) || w === "going" || w === "able" ||
        ((w === "not" || w === "never") && (ESL_TO_FORMS.has(L(i-1)) || (ESL_OBJ_PERSON.has(L(i-1)) && ESL_TO_FORMS.has(L(i-2))))) ||
        (ESL_OBJ_PERSON.has(w) && ESL_TO_FORMS.has(L(i-1)));
      const v = L(i+2);
      if(trigger){
        // past tense after "to": "continued to worked"
        const bp = eslPastBase(v);
        if(bp && bp !== v && !ESL_AMBIG_PAST.has(v) && !ADJECTIVAL_PARTICIPLES.has(v) && !ALL_BASE_VERBS.has(v) && bp !== "be"){
          emit("to-form", i+1, i+2, ["to " + bp], 'Bare verb after "to"',
            'After "to" the verb stays in its base form: "to '+bp+'", not "to '+v+'".');
          continue;
        }
        // 3rd-person -s after "to": "not to enters"
        if(w !== "going" && isThirdPersonVerb(v) && !NOUN_ONLY_S.has(v) && !isBaseVerb(v) && eslBaseOf(v)){
          const b = eslBaseOf(v);
          emit("to-form", i+1, i+2, ["to " + b], 'Bare verb after "to"',
            'After "to" the verb stays in its base form: "to '+b+'", not "to '+v+'".');
          continue;
        }
      }
      // gerund-only verbs: "enjoys to read", "avoids to answering"
      if(ESL_GERUND_FORMS.has(w) && !/^(risk|practice|practise|delay|escape|resist|suggest|mind)$/.test(w) || /^(suggests?|suggested|minds?|minded|risked|risks|practi[sc]ed|practi[sc]es)$/.test(w)){
        if(isIngForm(v) && !notBe.has(v)){
          emit("gerund-verb", i+1, i+2, [R(i+2)], '"'+w+'" is followed by -ing',
            '"'+w+'" takes an -ing form, with no "to": "'+R(i)+' '+R(i+2)+'".');
          continue;
        }
        if(isBaseVerb(v) && !ESL_CLEAR_VERBS.has("__none__") && v !== "be" && c.noun !== undefined){
          const ing = eslIng(v);
          emit("gerund-verb", i+1, i+2, [ing], '"'+w+'" is followed by -ing',
            '"'+w+'" takes an -ing form, not "to": "'+R(i)+' '+ing+'".');
          continue;
        }
      }
    }
    // "looks forward to meet you" -> "meeting"
    if(w === "forward" && w1 === "to" && tight(i+1) && /^(look|looks|looked|looking)$/.test(L(i-1)) && tight(i-1) && i+2 < n){
      const v = L(i+2);
      const verbOnly = S("meet see hear receive welcome read speak join visit hearing");
      if(isBaseVerb(v) && (verbOnly.has(v) || ESL_OBJ_PERSON.has(L(i+3)) || DETERMINERS.has(L(i+3)))){
        emit("forward-to", i+1, i+2, ["to " + eslIng(v)], '"Look forward to" takes -ing',
          'Here "to" is a preposition, so a verb after it takes -ing: "looking forward to '+eslIng(v)+'".');
        continue;
      }
    }
    // thanked me to helping  -> thanked me for helping
    if(/^(thank|thanks|thanked|thanking)$/.test(w) && ESL_OBJ_PERSON.has(w1) && tight(i+1) && L(i+2) === "to" && tight(i+2) && isIngForm(L(i+3))){
      emit("thank-for", i+2, i+2, ["for"], '"Thank" takes "for"', 'You thank someone "for" doing something.');
      continue;
    }
    // hope seeing -> hope to see
    if(ESL_TO_STRICT_FORMS.has(w) && isIngForm(w1) && !notBe.has(w1)){
      const b = eslBaseOf(w1);
      if(b && b !== "be" && !(L(i-1) && DETERMINERS.has(L(i-1)))){
        emit("to-verb", i+1, i+1, ["to " + b], '"'+w+'" is followed by "to"',
          '"'+w+'" takes a to-infinitive, not an -ing form: "'+R(i)+' to '+b+'".');
        continue;
      }
    }
    // object + wrong complement:  "allowed us leaving", "asked me helping", "expected me comes"
    if(ESL_OBJ_TO_FORMS.has(w) && !/^(teach|teaches|taught|teaching|cause|caused|causes|causing)$/.test(w) &&
       ESL_OBJ_PERSON.has(w1) && tight(i+1) && i+2 < n){
      const v = L(i+2);
      const isHer = w1 === "her";
      if(isIngForm(v) && !notBe.has(v)){
        const b = eslBaseOf(v);
        if(b && b !== "be" && (!isHer || phraseEndsAfter(i+2)) && !(w1 === "them" && false)){
          emit("obj-to", i+2, i+2, ["to " + b], 'Missing "to"',
            '"'+w+' '+w1+'" is followed by a to-infinitive: "'+R(i)+' '+R(i+1)+' to '+b+'".');
          continue;
        }
      }
      if(!isHer && ESL_CLEAR_VERBS.has(v) && !ESL_AUX_BE.has(v)){
        emit("obj-to", i+2, i+2, ["to " + v], 'Missing "to"',
          '"'+w+' '+w1+'" is followed by a to-infinitive: "'+R(i)+' '+R(i+1)+' to '+v+'".');
        continue;
      }
      if(!isHer && isThirdPersonVerb(v) && !NOUN_ONLY_S.has(v)){
        const b = eslBaseOf(v);
        if(b && ESL_CLEAR_VERBS.has(b) && b !== v){
          emit("obj-to", i+2, i+2, ["to " + b], 'Missing "to"',
            '"'+w+' '+w1+'" is followed by a to-infinitive: "'+R(i)+' '+R(i+1)+' to '+b+'".');
          continue;
        }
      }
    }
    // insisted me to stay -> insisted that I stay
    if(/^(insist|insists|insisted|insisting)$/.test(w) && ESL_OBJ_PERSON.has(w1) && tight(i+1) && L(i+2) === "to" && tight(i+2) && isBaseVerb(L(i+3))){
      const subj = ESL_OBJ_TO_SUBJ[w1];
      emit("insist", i, i+3, [R(i) + " that " + subj + " " + R(i+3)], 'Check "insist"',
        '"insist" does not take an object plus "to": "'+R(i)+' that '+subj+' '+R(i+3)+'".');
      continue;
    }
    // asked me that I could help
    if(/^(ask|asks|asked|asking)$/.test(w) && ESL_OBJ_PERSON.has(w1) && tight(i+1) && L(i+2) === "that" && tight(i+2) && ESL_SUBJ.has(L(i+3)) && sameS(i,i+3)){
      emit("ask-that", i+2, i+2, ["if"], 'Check "ask that"',
        'A question reported after "ask" is introduced by "if" or "whether", not "that".');
      continue;
    }
    // told that he was sick -> said that
    if(/^(tell|tells|told|telling)$/.test(w) && w1 === "that" && tight(i) && ESL_SUBJ.has(L(i+2)) && tight(i+1) &&
       !/^(was|were|is|are|be|been|being|get|got|gets|getting)$/.test(L(i-1))){
      const say = { tell:"say", tells:"says", told:"said", telling:"saying" }[w];
      emit("tell-that", i, i, [mc(i, say)], 'Check "tell"',
        '"tell" needs a person after it ("told me that"); with no one named, use "'+say+'".');
      continue;
    }
    // let/make + object + to / wrong form
    if(/^(let|lets|letting|make|makes|made|making)$/.test(w) && ESL_OBJ_PERSON.has(w1) && tight(i+1) && i+2 < n){
      const isLet = /^let/.test(w);
      const v = L(i+2);
      if(v === "to" && tight(i+2) && isBaseVerb(L(i+3))){
        emit("let-to", i+2, i+3, [R(i+3)], 'No "to" here',
          '"'+w+'" is followed by the bare verb, with no "to": "'+R(i)+' '+R(i+1)+' '+R(i+3)+'".');
        continue;
      }
      if(isLet){
        const bp = eslPastBase(v), bi = isIngForm(v) && !notBe.has(v) ? eslBaseOf(v) : "";
        const b = (bp && !ESL_AMBIG_PAST.has(v) && v !== "let") ? bp : bi;
        if(b && b !== "be" && b !== v){
          emit("let-form", i+2, i+2, [b], "Bare verb needed",
            '"let" is followed by the bare verb: "'+R(i)+' '+R(i+1)+' '+b+'".');
          continue;
        }
      }
    }
    // saw them ran -> saw them run
    if(/^(see|sees|saw|seen|seeing|hear|hears|heard|hearing|watch|watched|watches|notice|noticed|feel|felt)$/.test(w) &&
       ESL_OBJ_PERSON.has(w1) && tight(i+1) && i+2 < n){
      const v = L(i+2);
      const b = !ESL_AMBIG_PAST.has(v) ? eslPastNotParticiple(v) : "";
      if(b && b !== "be"){
        emit("see-form", i+2, i+2, [b], "Bare verb needed",
          'After "'+w+' '+w1+'" the action is a bare verb: "'+R(i)+' '+R(i+1)+' '+b+'".');
        continue;
      }
    }
  }
});

// ---------------------------------------------------------------
// 5. STATIVE VERBS IN THE PROGRESSIVE: "She is knowing the answer"
// ---------------------------------------------------------------
ESL_FAMILIES.push(function stativeProgressive(c){
  const { n, L, R, tight, sentStart, isCap, emit, mc } = c;
  for(let i=1;i<n-1;i++){
    const w = L(i);
    if(!ESL_AUX_BE.has(w) || !tight(i) || sentStart(i)) continue;
    const ing = L(i+1);
    if(!/ing$/.test(ing)) continue;
    const b = eslBaseOf(ing);
    if(!b || !ESL_STATIVE.has(b) && b !== "appear") continue;
    const subj = L(i-1);
    const personSubj = tight(i-1) && (ESL_SUBJ_NOIT.has(subj) || ESL_OBJ_PERSON.has(subj) || isCap(i-1));
    const anySubj = tight(i-1);
    let ok = false;
    if(ESL_STATIVE_ANY_SUBJECT.has(b)) ok = anySubj;
    else if(b === "seem") ok = personSubj || subj === "it";
    else if(b === "appear") ok = personSubj && isAdjective(L(i+2));
    else if(b === "cost") ok = anySubj && (L(i+2) === "too" || ESL_NUMBER_WORDS.has(L(i+2)) || c.NUM_AFTER(i+1));
    else if(ESL_STATIVE_PERSON_ONLY.has(b)) ok = personSubj;
    if(!ok) continue;
    if(b === "understand" && (PREPOSITIONS.has(L(i+2)) || L(i+2) === "and")) continue;   // "understanding of", adjectival use
    const past = (w === "was" || w === "were");
    let form;
    if(past) form = eslPast(b);
    else form = (w === "is") ? eslThird(b) : b;
    emit("stative-progressive", i, i+1, [mc(i, form)], "Stative verb in the progressive",
      '"'+b+'" describes a state, not an action in progress, so it is not used with "be + -ing": "'+form+'".');
  }
});

// ---------------------------------------------------------------
// 6. TENSE AND TIME MARKERS
// ---------------------------------------------------------------
const ESL_UNITS = S("year years month months week weeks day days hour hours minute minutes second seconds decade decades");
const ESL_LAST_UNITS = S("night week month year summer winter spring autumn weekend decade century christmas monday tuesday wednesday thursday friday saturday sunday january february march april june july august september october november december time semester term");
const ESL_NOT_BEFORE_LAST = S("the this for in over during of at since until till from by before after these those my our his her their every each");
ESL_FAMILIES.push(function tenseMarkers(c){
  const { n, L, R, tight, clauseEnd, sameS, sentStart, clauseStart, emit, mc, text, tokens, YEAR_AFTER, NUM_AFTER, isCap } = c;
  const STOP = S("and but that because since while when if which who where what whether although though so then");
  // find a finished-time marker after token p, in the same clause
  function findMarker(p){
    for(let k=p+1; k<n && k<=p+8; k++){
      if(!sameS(p,k)) return -1;
      if(!tight(k-1) && k-1 >= p) return -1;       // punctuation ends the clause
      const w = L(k);
      if(STOP.has(w) && k !== p+1 || (STOP.has(w) && w !== "when")) { if(w !== "yesterday") return -1; }
      if(w === "yesterday" && !/^(since|until|till|from|before|by|after)$/.test(L(k-1))) return k;
      if(w === "ago" && k > p+1) return k;
      if(w === "last" && !ESL_NOT_BEFORE_LAST.has(L(k-1)) && ESL_LAST_UNITS.has(L(k+1)) && tight(k)) return k;
      if(w === "in" && YEAR_AFTER(k) && tight(k) === false) return k;
    }
    return -1;
  }
  const pastOfPart = w => PARTICIPLE_TO_PAST[w] || w;
  for(let i=0;i<n;i++){
    const w = L(i);

    // ---- have/has + participle + finished time ----
    if((w === "have" || w === "has" || w === "haven't" || w === "hasn't" || /^(i|you|we|they)'ve$/.test(w)) && tight(i)){
      const prev = L(i-1);
      if(MODALS.has(prev) || prev === "to" || prev === "not" && false) continue;
      if(/^(would|could|should|might|must|may)'?v?e?$/.test(prev)) continue;
      let p = i+1;
      const adv = [];
      while(p < n-1 && tight(p-1) && /^(already|just|also|never|finally|recently|ever|once)$/.test(L(p)) && p < i+3){ adv.push(R(p)); p++; }
      const pw = L(p);
      const isPart = IRREG_PART.has(pw) && !(ALL_BASE_VERBS.has(pw) && !/^(put|set|cut|let|hit|hurt|read|shut|cost|quit)$/.test(pw) && false)
                     || (/ed$/.test(pw) && isPastForm(pw));
      if(!isPart || pw === "been" && false) continue;
      if(!tight(p-1) && p > i+1) continue;
      if(pw === "had" || pw === "been" || pw === "gotten" && false) { if(pw === "had") continue; }
      const m = findMarker(p);
      if(m < 0) continue;
      let sugg;
      if(w === "haven't" || w === "hasn't"){
        const b = eslBaseOf(pw);
        if(!b || b === "be") continue;
        sugg = "didn't " + b;
      } else if(pw === "been"){
        const sj = /^(i|he|she|it)$/.test(prev) ? "was" : /^(we|they|you)$/.test(prev) ? "were" : "";
        if(!sj) continue;
        sugg = (adv.length ? adv.join(" ") + " " : "") + sj;
        if(/'ve$/.test(w)) sugg = R(i).slice(0,-3) + " " + sugg;
      } else {
        sugg = (adv.length ? adv.join(" ") + " " : "") + pastOfPart(pw);
        if(/'ve$/.test(w)) sugg = R(i).slice(0,-3) + " " + sugg;
      }
      sugg = mc(i, sugg);
      emit("perfect-past-time", i, p, [sugg], "Present perfect with a finished time",
        'A finished time such as "'+R(m)+'" calls for the simple past, not "have" + participle.');
      continue;
    }

    // ---- since + a length of time: "since five years" -> "for" ----
    if(w === "since"){
      let ok = false, unitIdx = -1;
      if(NUM_AFTER(i) && ESL_UNITS.has(L(i+1)) && tight(i)) { ok = true; unitIdx = i+1; }
      else if(tight(i) && (ESL_NUMBER_WORDS.has(L(i+1)) || /^(a|an|several|many|few)$/.test(L(i+1))) && tight(i+1)){
        if(ESL_UNITS.has(L(i+2))) { ok = true; unitIdx = i+2; }
        else if(L(i+1) === "a" && L(i+2) === "few" && tight(i+2) && ESL_UNITS.has(L(i+3))) { ok = true; unitIdx = i+3; }
      }
      if(ok && L(unitIdx+1) !== "ago" && !(L(unitIdx+1) === "of")){
        emit("since-for", i, i, [mc(i, "for")], 'Use "for" with a length of time',
          '"since" points to a moment ("since 2020"); a length of time ("five years") takes "for".');
        continue;
      }
      // ---- simple past + since + a point in time ----
      let pt = false;
      const nx = L(i+1);
      if(tight(i) || NUM_AFTER(i) || YEAR_AFTER(i)){
        if(nx === "yesterday" || ESL_DAYS.has(nx) || (nx === "last" && ESL_LAST_UNITS.has(L(i+2))) || YEAR_AFTER(i) ||
           (nx === "this" && /^(morning|afternoon|week|month|year)$/.test(L(i+2)))) pt = true;
        if(ESL_MONTHS.has(nx) && nx !== "may" && nx !== "march") pt = true;
      }
      if(!pt) continue;
      // scan back for the verb, and for any perfect auxiliary in the sentence
      let perfect = false;
      for(let k=i-1;k>=0 && sameS(k,i);k--){
        if(/^(have|has|had|haven't|hasn't|hadn't)$/.test(L(k)) || /'(ve|d)$/.test(L(k)) || /^(it's|he's|she's|that's|there's)$/.test(L(k))) { perfect = true; break; }
        if(!tight(k)) { /* still within the sentence: keep looking for an auxiliary */ }
      }
      if(perfect) continue;
      let v = -1;
      for(let k=i-1;k>=Math.max(0,i-7) && sameS(k,i);k--){
        if(!tight(k) && k !== i-1) break;
        const wk = L(k);
        if(CONJUNCTIONS.has(wk) && wk !== "since") break;
        if((IRREG_PAST.has(wk) && eslPastBase(wk) && !ESL_AMBIG_PAST.has(wk)) || (/ed$/.test(wk) && isPastForm(wk) && !ADJECTIVAL_PARTICIPLES.has(wk))){ v = k; break; }
        if(ESL_AUX_BE.has(wk)) { v = k; break; }
        if(MODALS.has(wk)) break;
      }
      if(v < 0) continue;
      const wv = L(v);
      if(BE_FORMS.has(wv)){
        // "was here since", "is here since"; leave passives and "it is X since" alone
        if(/^[a-z]+ed$/.test(L(v+1)) && isPastForm(L(v+1))) continue;
        if(wv === "am" || wv === "is" || wv === "are" || wv === "was" || wv === "were"){
          const subj = L(v-1);
          const has = (wv === "is" || wv === "was" && /^(he|she|it)$/.test(subj)) ? "has been" : (/^(he|she|it)$/.test(subj) ? "has been" : "have been");
          const hb = (wv === "is" || /^(he|she|it)$/.test(subj)) ? "has been" : "have been";
          // present progressive: "is waiting since" -> "has been waiting"
          emit("since-tense", v, v, [mc(v, hb)], 'Use the perfect with "since"',
            'With "since" the verb is in the present perfect: "'+hb+'", because the situation runs from then until now.');
        }
        continue;
      }
      const subj = L(v-1);
      const has = /^(he|she|it)$/.test(subj) ? "has" : (/^(i|we|they|you)$/.test(subj) ? "have" : "");
      const part = PARTICIPLE_TO_PAST[wv] ? (IRREG_PART.has(wv) ? wv : eslParticiple(eslBaseOf(wv))) : eslParticiple(eslBaseOf(wv));
      const sugg = has ? [mc(v, has + " " + (IRREG_PAST.has(wv) ? eslParticiple(eslBaseOf(wv)) : wv))]
                       : [mc(v, "has " + (IRREG_PAST.has(wv) ? eslParticiple(eslBaseOf(wv)) : wv)), mc(v, "have " + (IRREG_PAST.has(wv) ? eslParticiple(eslBaseOf(wv)) : wv))];
      emit("since-tense", v, v, sugg, 'Use the perfect with "since"',
        'With "since" the verb is in the present perfect ("has lived", "have worked"), because the situation runs from then until now.');
      continue;
    }

    // ---- will + a finished time ----
    if(w === "will" && tight(i) && !(i > 0 && tight(i-1) && DETERMINERS.has(L(i-1)))){
      let m = -1, stop = false;
      for(let k=i+1;k<n && k<=i+6;k++){
        if(!sameS(i,k)) break;
        if(!tight(k-1)) break;
        const wk = L(k);
        if(CONJUNCTIONS.has(wk) || ESL_WH.has(wk) || /^(said|told|asked|thought|knew|remember|remembered)$/.test(wk)) break;
        if(wk === "yesterday" || (wk === "ago" && k > i+1)) { m = k; break; }
        if(wk === "last" && !ESL_NOT_BEFORE_LAST.has(L(k-1)) && ESL_LAST_UNITS.has(L(k+1)) && tight(k)) { m = k; break; }
      }
      if(m < 0) continue;
      const subj = L(i-1);
      let sugg = [];
      if(L(i+1) === "be" && isIngForm(L(i+2)) && tight(i+1)){
        const wb = /^(we|they|you)$/.test(subj) ? "were" : /^(i|he|she|it)$/.test(subj) ? "was" : "";
        if(wb) sugg = [mc(i, wb + " " + R(i+2))];
        emit("will-past-time", i, i+2, sugg, "Future with a finished time",
          '"will" looks forward, but "'+R(m)+'" is in the past.');
      } else if(isBaseVerb(L(i+1)) && L(i+1) !== "be"){
        sugg = [mc(i, eslPast(L(i+1)))];
        emit("will-past-time", i, i+1, sugg, "Future with a finished time",
          '"will" looks forward, but "'+R(m)+'" is in the past.');
      }
    }
  }
});

// ---------------------------------------------------------------
// 7. CONDITIONAL / TIME CLAUSES, WISH, WOULD RATHER
// ---------------------------------------------------------------
ESL_FAMILIES.push(function conditionals(c){
  const { n, L, R, tight, clauseStart, sameS, emit, mc, sentStart, text, tokens } = c;
  const TIMEC = S("when before after until once");
  const subjEnd = i => { // pronoun, or det + noun
    if(ESL_SUBJ.has(L(i)) && tight(i)) return i;
    if(DETERMINERS.has(L(i)) && tight(i) && i+1 < n && DICTIONARY.has(L(i+1)) && !isBaseVerb(L(i+1)) && tight(i+1)) return i+1;
    return -1;
  };
  for(let i=0;i<n-3;i++){
    const w = L(i);
    // unless + negative
    if(w === "unless"){
      const e = subjEnd(i+1);
      if(e > 0 && tight(i) && ESL_NEG_POS[L(e+1)] && L(e+1) !== "won't"){
        emit("unless-neg", i, i, [mc(i,"if")], 'Double negative with "unless"',
          '"unless" already means "if ... not", so a second negative cancels it: use "if" with the negative, or drop the negative.');
      }
    }
    const isIf = w === "if" && clauseStart(i);
    const isTime = (TIMEC.has(w) && (clauseStart(i) || w === "after" || w === "before" || w === "until" || w === "once")) || w === "unless";
    if(!(isIf || isTime) || !tight(i)) continue;
    const e = subjEnd(i+1);
    if(e < 0 || e+2 >= n || !tight(e)) continue;
    const m = L(e+1), v = L(e+2);
    const subj = L(e);
    if(m === "will" && isBaseVerb(v) && !(isIf && subj === "you") && tight(e+1)){
      let form;
      if(v === "be") form = subj === "i" ? "am" : (/^(he|she|it)$/.test(subj) || !isPluralNoun(subj)) && !/^(we|they|you)$/.test(subj) ? "is" : "are";
      else form = (subj === "i" || /^(we|they|you)$/.test(subj)) ? v : eslThird(v);
      emit("will-in-clause", e+1, e+2, [form], 'No "will" in a "'+w+'" clause',
        'After "'+w+'" a future event is written in the present tense: "'+form+'", not "will '+v+'".');
    } else if(isIf && m === "would" && !(subj === "you") && tight(e+1) && L(e+2) !== "only" && !/^(like|prefer|care|mind)$/.test(v)){
      if(v === "have" && tight(e+2) && (IRREG_PART.has(L(e+3)) || /ed$/.test(L(e+3)))){
        emit("if-would", e+1, e+2, ["had"], 'No "would" in an "if" clause',
          'An unreal past condition is "if + had + participle": "had '+R(e+3)+'".');
      } else if(isBaseVerb(v) && v !== "be"){
        emit("if-would", e+1, e+2, [eslPast(v)], 'No "would" in an "if" clause',
          'The "if" part of a conditional uses the past simple, not "would": "'+eslPast(v)+'".');
      }
    }
  }
  // wish / would rather + present tense
  for(let i=0;i<n-3;i++){
    const w = L(i);
    const wish = /^(wish|wishes)$/.test(w), rather = (w === "rather" && (L(i-1) === "would" || /'d$/.test(L(i-1)) || L(i-1) === "had"));
    if(!(wish || rather) || !tight(i)) continue;
    let j = i+1;
    if(L(j) === "that" && tight(j)) j++;
    const s = L(j);
    if(!ESL_SUBJ.has(L(j)) || !tight(j) || (s === "you" && wish && !/^(are|can|will|do|have|were)$/.test(L(j+1)))) continue;
    const v = L(j+1);
    if(rather){
      if(v === "will" && isBaseVerb(L(j+2)) && tight(j+1)){
        const b = L(j+2);
        emit("wish-tense", j+1, j+2, [eslPast(b)], 'Use the past after "would rather"',
          '"would rather" + a person takes the past simple: "'+R(j)+' '+eslPast(b)+'".');
      }
      continue;
    }
    const MAP = { am:"were", is:"were", are:"were", can:"could", will:"would", "isn't":"weren't", "aren't":"weren't", "don't":"didn't", "doesn't":"didn't", "can't":"couldn't", "won't":"wouldn't", has:"had", have:"had" };
    if(MAP[v] && !(v === "have" && L(j+2) && IRREG_PART.has(L(j+2)) && false)){
      emit("wish-tense", j+1, j+1, [MAP[v]], 'Use the past after "wish"',
        'A wish about the present uses the past tense: "'+R(i)+' '+R(j)+' '+MAP[v]+'".');
    } else if(!MAP[v] && (isThirdPersonVerb(v) && !NOUN_ONLY_S.has(v)) && /^(he|she|it)$/.test(s) && eslBaseOf(v)){
      const b = eslBaseOf(v);
      emit("wish-tense", j+1, j+1, [eslPast(b)], 'Use the past after "wish"',
        'A wish about the present uses the past tense: "'+R(i)+' '+R(j)+' '+eslPast(b)+'".');
    }
  }
  // if + were/had ... will  -> would
  for(let i=0;i<n;i++){
    if(L(i) !== "if" || !sentStart(i)) continue;
    let k = i+1, seenCond = false;
    for(; k<n && k<i+9 && sameS(i,k); k++){
      if(L(k) === "were" || (L(k) === "had" && !(IRREG_PART.has(L(k+1)) && false))) seenCond = true;
      if(seenCond && L(k) === "will" && tight(k) && isBaseVerb(L(k+1))){
        emit("conditional-mismatch", k, k, ["would"], "Conditional tense mismatch",
          'An "if" clause in the past ("were", "had") goes with "would" in the main clause, not "will".');
        break;
      }
    }
  }
});

// ---------------------------------------------------------------
// 8. PRONOUN CASE
// ---------------------------------------------------------------
ESL_FAMILIES.push(function pronounCase(c){
  const { n, L, R, tight, clauseEnd, clauseStart, sentStart, emit, mc, sameS } = c;
  const PREP = S("to with at from by of on about against between among towards toward into onto upon without near over under behind beside for");
  const endish = i => clauseEnd(i) || /^(and|or|but|so|who|which|that|as|if|when|because)$/.test(L(i+1)) ||
                      PREPOSITIONS.has(L(i+1)) || isAdverb(L(i+1));
  const finiteNext = S("is are was were am have has had do does did can could will would should may might must went came ran saw");
  for(let i=0;i<n;i++){
    const w = L(i);
    // preposition + subject pronoun:  "gave it to he"
    if(PREP.has(w) && tight(i) && ESL_SUBJ_TO_OBJ[L(i+1)] && L(i+1) !== "i" && endish(i+1) && !finiteNext.has(L(i+2)) && !(w === "of" && false)){
      const o = ESL_SUBJ_TO_OBJ[L(i+1)];
      emit("pronoun-case", i+1, i+1, [mc(i+1, o)], "Pronoun case",
        'After "'+w+'" use the object form: "'+o+'".');
      continue;
    }
    // between you and I
    if(/^(between|for|with|to|from|about)$/.test(w) && tight(i) && i+3 < n){
      for(let len=1; len<=2; len++){
        const a = i+len;
        if(L(a+1) === "and" && tight(a) && tight(a+1) && L(a+2) === "i" && R(a+2) === "I" &&
           (endish(a+2) && L(a+3) !== "to") && !finiteNext.has(L(a+3)) && (ESL_SUBJ_NOIT.has(L(i+1)) || DETERMINERS.has(L(i+1)) || /^[A-Z]/.test(R(i+1)))){
          emit("pronoun-case", a+2, a+2, ["me"], "Pronoun case",
            'After "'+w+'" use the object form: "'+R(i+1)+' and me".');
          break;
        }
      }
    }
    // sentence-initial object pronoun as subject:  "Them are outside", "Her went"
    if(ESL_OBJ_PERSON.has(w) && sentStart(i) && tight(i) && ESL_OBJ_TO_SUBJ[w]){
      const v = L(i+1);
      const verbal = ESL_AUX_BE.has(v) || ESL_AUX_HAVE.has(v) || ESL_AUX_DO.has(v) || ESL_AUX_MODAL.has(v) ||
                     (IRREG_PAST.has(v) && !ESL_AMBIG_PAST.has(v) && v !== "read") ||
                     (w !== "her" && ESL_CLEAR_VERBS.has(v) && w !== "us");
      if(verbal && v !== "am" || (v === "am" && w === "me")){
        const s = ESL_OBJ_TO_SUBJ[w];
        emit("pronoun-case", i, i, [mc(i, s)], "Pronoun case",
          '"'+R(i)+'" is the object form; as the subject of a verb it should be "'+s+'".');
        continue;
      }
    }
    // "You and me should leave" at the start of a sentence
    if(sentStart(i) && L(i+1) === "and" && tight(i) && tight(i+1) && i+3 < n){
      const x = L(i), y = L(i+2), v = L(i+3);
      const verbal = ESL_AUX_MODAL.has(v) || ESL_AUX_BE.has(v) || ESL_AUX_HAVE.has(v) || (IRREG_PAST.has(v) && !ESL_AMBIG_PAST.has(v));
      if(verbal && tight(i+2) && ((ESL_OBJ_PERSON.has(y) && (ESL_SUBJ.has(x) || /^[A-Z]/.test(R(i)) || ESL_OBJ_PERSON.has(x))) ||
                                  (ESL_OBJ_PERSON.has(x) && (ESL_SUBJ.has(y) || /^[A-Z]/.test(R(i+2)))) ) && tight(i+2)){
        const fx = ESL_OBJ_TO_SUBJ[x] || R(i), fy = ESL_OBJ_TO_SUBJ[y] || R(i+2);
        const parts = [fx === "I" ? null : fx, fy === "I" ? null : fy];
        let a = ESL_OBJ_TO_SUBJ[x] ? mc(i, fx) : R(i), b = ESL_OBJ_TO_SUBJ[y] ? fy : R(i+2);
        // "I" goes last: "He and I"
        if(a === "I"){ const t = a; a = b; b = t; a = a; }
        emit("pronoun-case", i, i+2, [a + " and " + b], "Pronoun case",
          'As the subject of the verb, use the subject forms: "'+a+' and '+b+'".');
      }
    }
    // than me do / than him is
    if(w === "than" && ESL_OBJ_TO_SUBJ[L(i+1)] && tight(i) && tight(i+1) &&
       /^(do|does|did|can|could|is|are|was|were|am|will|would|have|has)$/.test(L(i+2))){
      const s = ESL_OBJ_TO_SUBJ[L(i+1)];
      emit("than-case", i+1, i+1, [s], "Pronoun case after \"than\"",
        'Followed by a verb, the pronoun after "than" is a subject: "than '+s+' '+R(i+2)+'".');
      continue;
    }
    // stronger than what I am
    if(w === "than" && L(i+1) === "what" && tight(i) && tight(i+1) && ESL_SUBJ.has(L(i+2)) && ESL_AUX_BE.has(L(i+3)) && clauseEnd(i+3)){
      emit("than-what", i+1, i+1, [""], 'Drop "what"', '"than" is followed directly by the clause: "than '+R(i+2)+' '+R(i+3)+'".');
    }
  }
});

// ---------------------------------------------------------------
// 9. COLLOCATION, PREPOSITION AND REDUNDANCY SLIPS
// ---------------------------------------------------------------
const ESL_ADJ_PREP = {
  grateful:{about:["for"]}, jealous:{from:["of"]}, proud:{for:["of"], on:["of"]}, disappointed:{on:["with","by","at"]},
  famous:{by:["for"]}, concerned:{on:["about","with"]}, afraid:{from:["of"]}, similar:{with:["to"]}, addicted:{with:["to"]},
  aware:{about:["of"]}, interested:{about:["in"], on:["in"]}, angry:{on:["with"]}, capable:{to:["of"]},
  dependent:{of:["on"]}, scared:{from:["of"]}, surprised:{of:["at","by"]}, keen:{in:["on"]}, fond:{about:["of"]}
};
const ESL_VERB_PREP = { // verb + redundant/wrong preposition -> fix of the pair
  mention:{about:""}, discuss:{about:""}, request:{for:""}, depend:{of:"on", from:"on"}, suffer:{of:"from"}
};
const ESL_REDUNDANT = [ // [tokens, replacement tokens, note]
  [["returned","back"],["returned"]], [["return","back"],["return"]], [["returns","back"],["returns"]], [["returning","back"],["returning"]],
  [["joined","together"],["joined"]], [["join","together"],["join"]], [["combined","together"],["combined"]], [["combine","together"],["combine"]],
  [["exited","out"],["exited"]], [["exit","out"],["exit"]], [["entered","into","inside"],["entered"]], [["enter","into","inside"],["enter"]],
  [["entering","into","inside"],["entering"]], [["beside","to"],["beside"]], [["toward","to"],["toward"]], [["towards","to"],["towards"]],
  [["into","inside"],["into"]], [["into","on"],["onto","into"]], [["in","front","of","ahead","of"],["in front of","ahead of"]],
  [["reverted","back"],["reverted"]], [["revert","back"],["revert"]], [["repeated","again"],["repeated"]], [["repeat","again"],["repeat"]]
];
ESL_FAMILIES.push(function collocations(c){
  const { n, L, R, tight, clauseEnd, clauseStart, sentStart, emit, mc, text, tokens, run, isCap } = c;
  const PLACES = S("room building house office shop store hall kitchen classroom city garden church school hospital car bank cave");
  for(let i=0;i<n;i++){
    const w = L(i), w1 = L(i+1);
    // adjective + wrong preposition
    if(ESL_ADJ_PREP[w] && ESL_ADJ_PREP[w][w1] && tight(i)){
      const bePrev = i > 0 && tight(i-1) && (BE_FORMS.has(L(i-1)) || /^(very|so|really|quite|too|become|became|feel|felt|get|got)$/.test(L(i-1)));
      if(bePrev){
        const alt = ESL_ADJ_PREP[w][w1];
        emit("adj-prep", i+1, i+1, alt.map(a => mc(i+1, a)), "Wrong preposition",
          '"'+w+'" is followed by "'+alt[0]+'", not "'+w1+'".');
        continue;
      }
    }
    // excited for meeting / excited for to travel
    if(w === "excited" && w1 === "for" && tight(i)){
      if(L(i+2) === "to" && tight(i+1)) emit("adj-prep", i+1, i+2, ["to"], "Wrong preposition", '"excited to" + verb, not "excited for to".');
      else if(isIngForm(L(i+2)) && tight(i+1)) emit("adj-prep", i+1, i+1, ["about"], "Wrong preposition", '"excited about" + -ing, not "excited for".');
      continue;
    }
    // married with her / He married with her
    if((w === "married" || w === "marry" || w === "marries" || w === "marrying") && w1 === "with" && tight(i)){
      const o = L(i+2), o2 = L(i+3);
      const personish = ESL_OBJ_PERSON.has(o) || isCap(i+2) || ((DETERMINERS.has(o) || true) && PERSON_NOUNS.has(DETERMINERS.has(o) ? o2 : o) &&
                         !/^(child|children|kid|kids|baby|babies|boy|boys|girl|girls|son|sons|daughter|daughters)$/.test(DETERMINERS.has(o) ? o2 : o));
      if(personish && tight(i+1)){
        const aux = i > 0 && BE_FORMS.has(L(i-1));
        if(aux) emit("adj-prep", i+1, i+1, ["to"], "Wrong preposition", '"married to" a person, not "married with".');
        else emit("married-with", i, i+1, [R(i)], 'No preposition after "marry"', 'The verb "marry" takes its object directly: "'+R(i)+' her".');
        continue;
      }
    }
    // mentioned about / discussed about / requested for / depends of
    const vb = eslBaseOf(w);
    if(vb && ESL_VERB_PREP[vb] && ESL_VERB_PREP[vb][w1] !== undefined && tight(i) && !ESL_AUX_BE.has(L(i-1)) && !(DETERMINERS.has(L(i-1)))){
      const fix = ESL_VERB_PREP[vb][w1];
      emit("verb-prep", i, i+1, [R(i) + (fix ? " " + fix : "")], fix ? "Wrong preposition" : "Unneeded preposition",
        fix ? '"'+vb+'" goes with "'+fix+'".' : '"'+vb+'" takes its object directly, with no "'+w1+'": "'+R(i)+'".');
      continue;
    }
    // arrived to the airport
    if(/^(arrive|arrives|arrived|arriving)$/.test(w) && w1 === "to" && tight(i) && tight(i+1) && (DETERMINERS.has(L(i+2)) || isCap(i+2))){
      emit("verb-prep", i+1, i+1, ["at", "in"], 'Use "at" or "in" with "arrive"', '"arrive" takes "at" (a place) or "in" (a city), not "to".');
      continue;
    }
    // entered into the room
    if(/^(enter|enters|entered|entering)$/.test(w) && w1 === "into" && tight(i) && tight(i+1) && DETERMINERS.has(L(i+2)) && PLACES.has(L(i+3)) && tight(i+2)){
      emit("verb-prep", i, i+1, [R(i)], "Unneeded preposition", '"enter" takes a place directly: "'+R(i)+' the '+R(i+3)+'".');
      continue;
    }
    // went to a bed -> went to bed
    if(/^(go|goes|went|going|gone)$/.test(w) && w1 === "to" && L(i+2) === "a" && L(i+3) === "bed" && run(i,i+3)){
      emit("idiom-bed", i+1, i+3, ["to bed"], "Idiom", 'The idiom is "go to bed", with no article.');
      continue;
    }
    // in last night / on yesterday / at Sunday / on January
    if(/^(in|on|at)$/.test(w) && tight(i)){
      if(/^(last|yesterday|tomorrow|next)$/.test(w1) && (w1 !== "next" || ESL_LAST_UNITS.has(L(i+2))) && (w1 !== "last" || ESL_LAST_UNITS.has(L(i+2)))){
        emit("time-prep", i, i, [""], "Unneeded preposition", '"'+w1+'" already says when; it takes no "'+w+'".');
        continue;
      }
      if((w === "at" || w === "in") && ESL_DAYS.has(w1) && !(L(i+2) === "night")){
        emit("time-prep", i, i, [mc(i,"on")], "Wrong preposition", 'Days take "on": "on '+R(i+1)+'".');
        continue;
      }
      if(w === "on" && ESL_MONTHS.has(w1) && w1 !== "may" && w1 !== "march" && !c.NUM_AFTER(i+1) && R(i+1)[0] !== "m" || (w === "on" && ESL_MONTHS.has(w1) && /^[A-Z]/.test(R(i+1)) && !c.NUM_AFTER(i+1) && w1 !== "may" && w1 !== "march")){
        emit("time-prep", i, i, [mc(i,"in")], "Wrong preposition", 'Months take "in": "in '+R(i+1)+'".');
        continue;
      }
    }
    if(w === "in" && w1 === "the" && L(i+2) === "bus" && L(i+3) === "stop" && run(i,i+3) && /^(wait|waited|waiting|waits|stood|stand|standing|sat|sit)$/.test(L(i-1))){
      emit("place-prep", i, i, ["at"], "Wrong preposition", 'You wait "at" a bus stop.');
    }
    // light-verb slips: "did a suggestion", "made an experiment", "took an appointment"
    const LV = { do:"do", does:"do", did:"do", doing:"do", done:"do", make:"make", makes:"make", made:"make", making:"make", take:"take", takes:"take", took:"take", taking:"take", taken:"take" };
    const FORMS = { do:["do","does","did","done","doing"], make:["make","makes","made","made","making"], take:["take","takes","took","taken","taking"], have:["have","has","had","had","having"] };
    if(LV[w] && tight(i)){
      let j = i+1; if(/^(a|an|the|my|his|her|some)$/.test(L(j)) && tight(j)) j++;
      const nn = L(j);
      const MAKE_NOUNS = S("suggestion complaint mistake appointment offer promise attempt effort");
      const DO_NOUNS = { experiment:"do", homework:"do", research:"do", favour:"do", favor:"do" };
      const HAVE_NOUNS = S("discussion party");
      const TAKE_NOUNS = S("photo shower nap exam");
      let target = "";
      if(LV[w] !== "make" && MAKE_NOUNS.has(nn) && !(LV[w] === "take" && nn === "appointment" && false)) target = "make";
      else if(LV[w] === "make" && DO_NOUNS[nn]) target = "do";
      else if(LV[w] === "make" && HAVE_NOUNS.has(nn)) target = "have";
      else if(LV[w] === "make" && TAKE_NOUNS.has(nn)) target = "take";
      if(target && (j === i+1 || true) && !(LV[w] === "do" && target === "do")){
        const idx = FORMS[LV[w]].indexOf(w);
        const f = FORMS[target][idx >= 0 ? idx : 0];
        emit("light-verb", i, i, [mc(i, f)], "Wrong verb for this phrase",
          'The usual phrase is "'+f+' '+(j>i+1 ? L(i+1)+' ' : '')+nn+'".');
        continue;
      }
    }
    // said me / explained him the situation
    if(/^(said|say|says)$/.test(w) && (w1 === "me" || w1 === "us") && tight(i)){
      emit("say-tell", i, i, [mc(i, w === "said" ? "told" : w === "say" ? "tell" : "tells")], 'Use "tell" with a person',
        '"say" does not take a person directly; "tell" does: "told me".');
      continue;
    }
    if(/^(explain|explains|explained|describe|describes|described|suggest|suggests|suggested|mention|mentioned|announce|announced)$/.test(w) &&
       /^(me|him|us|them|you)$/.test(w1) && tight(i) && tight(i+1) && DETERMINERS.has(L(i+2)) && L(i+2) !== "her"){
      let e = i+2, guard = 0;
      while(e < n-1 && tight(e) && (isAdjective(L(e+1)) || guard === 0) && guard < 3){ e++; guard++; if(!isAdjective(L(e))) break; }
      if(clauseEnd(e) || PREPOSITIONS.has(L(e+1))){
        const np = text.slice(tokens[i+2].start, tokens[e].end);
        emit("ditransitive-to", i, e, [R(i) + " " + np + " to " + R(i+1)], 'Needs "to"',
          '"'+vb0(w)+'" takes the thing first and the person after "to": "'+R(i)+' '+np+' to '+R(i+1)+'".');
      }
    }
    // redundant word pairs
    for(const [seq, rep] of ESL_REDUNDANT){
      if(w !== seq[0] || i+seq.length > n) continue;
      let ok = true;
      for(let k=1;k<seq.length;k++) if(L(i+k) !== seq[k] || !tight(i+k-1)) { ok = false; break; }
      if(!ok) continue;
      emit("redundant", i, i+seq.length-1, rep.map((r,ix) => ix === 0 ? mc(i, r) : r), "Redundant word",
        '"'+text.slice(tokens[i].start, tokens[i+seq.length-1].end)+'" says the same thing twice.', "advisory");
      break;
    }
  }
  function vb0(w){ return w; }
});

// ---------------------------------------------------------------
// 10. CONJUNCTION CLASHES, DOUBLE NEGATIVES, CORRELATIVES, DEGREE WORDS
// ---------------------------------------------------------------
ESL_FAMILIES.push(function conjunctionsAndDegree(c){
  const { n, L, R, tight, clauseEnd, sentStart, clauseStart, sameS, emit, mc, text, tokens, run } = c;
  const cap = (i, ws) => ws.map(x => sentStart(i) ? x[0].toUpperCase()+x.slice(1) : x);
  for(let i=0;i<n;i++){
    const w = L(i), w1 = L(i+1);
    if(w === "so" && w1 === "therefore" && tight(i)) emit("conj-clash", i, i+1, cap(i,["so","therefore"]), "Two linking words", '"so" and "therefore" do the same job; use one.');
    else if(w === "but" && w1 === "however" && tight(i)) emit("conj-clash", i, i+1, cap(i,["but","however"]), "Two linking words", '"but" and "however" do the same job; use one.');
    else if(w === "since" && w1 === "because" && tight(i)) emit("conj-clash", i, i+1, cap(i,["since","because"]), "Two linking words", '"since" and "because" do the same job; use one.');
    // Because ..., therefore he ...  /  Although ..., but we ...
    if((w === "therefore" || w === "so" && false) && i > 0 && !tight(i-1) && /,\s*$/.test(c.gapText(i-1)) && ESL_SUBJ.has(w1) && tight(i)){
      let s0 = i-1; while(s0 > 0 && sameS(s0-1,i)) s0--;
      if(/^(because|since|as)$/.test(L(s0)) && sentStart(s0)) emit("conj-clash", i, i+1, [R(i+1)], "Two linking words", 'The "because" clause already gives the reason; "therefore" is not needed.');
    }
    if(w === "but" && i > 0 && /,\s*$/.test(c.gapText(i-1)) && tight(i)){
      let s0 = i-1; while(s0 > 0 && sameS(s0-1,i)) s0--;
      if(/^(although|though)$/.test(L(s0)) && sentStart(s0)) emit("conj-clash", i, i+1, [R(i+1)], "Two linking words", '"although" already marks the contrast; "but" is not needed.');
    }
    if(w === "for" && w1 === "example" && L(i+2) === "such" && L(i+3) === "as" && run(i,i+3)) emit("conj-clash", i, i+3, [mc(i,"for example,"), "such as"], "Two linking words", '"for example" and "such as" do the same job; use one.');
    if(w === "reason" && w1 === "because" && tight(i)) emit("reason-because", i, i+1, ["reason why","reason that"], 'Use "reason why" or "reason that"', '"The reason" is followed by "why" or "that", not "because".');
    if((w === "despite" || (w === "in" && w1 === "spite" && L(i+2) !== "of")) ){
      const k = w === "despite" ? i+1 : i+2;
      if(tight(k-1) && ESL_SUBJ.has(L(k)) && tight(k) && (ESL_AUX_BE.has(L(k+1)) || ESL_AUX_HAVE.has(L(k+1)) || ESL_AUX_DO.has(L(k+1)) || ESL_AUX_MODAL.has(L(k+1)))){
        emit("despite-clause", i, k-1, [mc(i,"although")], 'Use "although" before a clause', '"despite" is followed by a noun or -ing form, not a full clause; "although" takes a clause.');
      }
    }
    // double negatives
    if(/^(hardly|scarcely|barely)$/.test(w) && w1 === "never" && tight(i)) emit("double-negative", i+1, i+1, ["ever"], "Double negative", '"hardly" is already negative: "hardly ever".');
    if(/^(no|nobody|nothing)$/.test(w) && false){}
    if((w === "one" && L(i-1) === "no" || w === "nobody" || w === "nothing") && L(i+1) === "never" && tight(i)) emit("double-negative", i+1, i+1, ["ever"], "Double negative", 'The sentence is already negative: "'+R(i)+' ever".');
    if(ESL_NEG_POS[w] && L(i+1) === "never" && tight(i)) emit("double-negative", i, i+1, [ESL_NEG_POS[w] + " never", R(i) + " ever"], "Double negative", 'Use one negative: "'+ESL_NEG_POS[w]+' never" or "'+R(i)+' ever".');
    if(w === "ain't" && L(i+1) === "never" && tight(i)) emit("double-negative", i+1, i+1, ["ever"], "Double negative", 'Use one negative: "ain\'t ever".');
    if(ESL_NEG_POS[w] && /^(hardly|scarcely|barely)$/.test(L(i+1)) && tight(i)) emit("double-negative", i, i+1, [ESL_NEG_POS[w] + " " + L(i+1)], "Double negative", '"'+L(i+1)+'" is already negative: "'+ESL_NEG_POS[w]+' '+L(i+1)+'".');
    if(w === "none" && L(i+1) === "of" && tight(i)){
      for(let k=i+2;k<n && k<i+7 && sameS(i,k) && tight(k-1);k++){
        if(/^(didn't|don't|doesn't)$/.test(L(k)) && isBaseVerb(L(k+1)) && tight(k)){
          const b = L(k+1), f = L(k) === "didn't" ? eslPast(b) : L(k) === "doesn't" ? eslThird(b) : b;
          emit("double-negative", k, k+1, [f], "Double negative", '"none" is already negative, so the verb needs no "'+L(k)+'".');
          break;
        }
      }
    }
    // too enough / too much enough
    if(w === "too" && (w1 === "enough" || (w1 === "much" && L(i+2) === "enough")) ){
      const k = w1 === "enough" ? i+2 : i+3;
      if(run(i,k-1) && (isAdjective(L(k)) || isAdverb(L(k)))) emit("too-enough", i, k, ["too "+R(k), R(k)+" enough"], 'Not "too" and "enough" together', '"too" and "enough" do opposite jobs; choose one.');
    }
    // too/very/so + comparative
    if(/^(too|so|very)$/.test(w) && tight(i) && (baseOfComparative(w1) || /^(better|worse)$/.test(w1)) && w1.length > 3 && !/^(sooner|later|rather|water|never|other|either|neither|over|under|after|ever)$/.test(w1)){
      if(w === "too" && baseOfComparative(w1)) emit("degree", i, i+1, [mc(i,"too")+" "+baseOfComparative(w1)], 'No comparative after "too"', '"too" takes the plain adjective: "too '+baseOfComparative(w1)+'".');
      else if(w !== "too") emit("degree", i, i, [mc(i,"much")], 'Use "much" before a comparative', '"'+w+'" does not go with a comparative; "much" does: "much '+w1+'".');
    }
    // most/more/very + absolute adjective
    if(/^(most|more|very)$/.test(w) && tight(i) && /^(ideal|unique|impossible)$/.test(w1) && !(L(i-1) === "the" && false)) emit("absolute-adj", i, i+1, [R(i+1)], "Absolute adjective", '"'+w1+'" cannot be made more or less so.', "advisory");
    // neither ... or / either ... nor / both ... as
    if(w === "neither" || w === "either" || w === "both"){
      const want = w === "neither" ? "nor" : w === "either" ? "or" : "and";
      const bad = w === "neither" ? S("or and") : w === "either" ? S("nor") : S("as or");
      for(let k=i+1;k<n && k<=i+5 && sameS(i,k) && tight(k-1);k++){
        if(bad.has(L(k)) && !(w === "both" && L(k) === "or" && false)){
          emit("correlative", k, k, [want], 'Mismatched pair', '"'+w+'" pairs with "'+want+'", not "'+L(k)+'".');
          break;
        }
        if(L(k) === want) break;
      }
    }
  }
});

// ---------------------------------------------------------------
// 11. QUANTITY, AGREEMENT AND ARTICLE SLIPS
// ---------------------------------------------------------------
ESL_FAMILIES.push(function agreementAndQuantity(c){
  const { n, L, R, tight, clauseEnd, clauseStart, sentStart, sameS, emit, mc, text, tokens } = c;
  const PLV = { are:"is", were:"was", have:"has", "don't":"doesn't", do:"does" };
  const SGV = { is:"are", was:"were", has:"have", "doesn't":"don't", does:"do" };
  for(let i=0;i<n;i++){
    const w = L(i), w1 = L(i+1);
    // many/several + uncountable
    if(/^(many|several)$/.test(w) && tight(i) && ESL_UNCOUNT_QUANT.has(w1) && (clauseEnd(i+1) || !DICTIONARY.has(L(i+2)) || ESL_AUX_BE.has(L(i+2)) || PREPOSITIONS.has(L(i+2)))){
      emit("quant-uncountable", i, i, [mc(i, w === "many" ? "much" : "some")], '"'+w+'" does not fit an uncountable noun', '"'+w1+'" is not counted one by one.');
      continue;
    }
    // plural quantifier + singular irregular noun / singular count noun
    if(ESL_PLURAL_QUANT.has(w) && tight(i) && !(w === "many" && L(i-1) === "a") ){
      if(ESL_IRREG_SING_TO_PL[w1] && !(w1 === "datum")){
        emit("quant-singular", i+1, i+1, [mc(i+1, ESL_IRREG_SING_TO_PL[w1])], "Plural noun needed", '"'+w+'" goes with a plural noun: "'+ESL_IRREG_SING_TO_PL[w1]+'".');
        continue;
      }
      const wl = (L(i-1) === "a" && w === "few") || w === "several" || w === "numerous" || w === "many" || w === "various";
      if(wl && DICTIONARY.has(w1) && (ESL_COUNT_NOUNS.has(w1) || (!isBaseVerb(w1) && !isAdjective(w1) && !isAdverb(w1) && !ESL_NOT_NOUN_AFTER_QUANT.has(w1) && !UNCOUNTABLE.has(w1) && !ESL_UNCOUNT_QUANT.has(w1) && /(tion|ment|ness|ity|ance|ence|er|or|ist|ure)$/.test(w1))) &&
         !isPluralNoun(w1) && !INVARIANT_PLURALS.has(w1) && !/s$/.test(w1) && DICTIONARY.has(pluralise(w1)) && (clauseEnd(i+1) || ESL_AUX_BE.has(L(i+2)) || PREPOSITIONS.has(L(i+2)) || ESL_AUX_HAVE.has(L(i+2)) || (isPastForm(L(i+2)) && true))){
        emit("quant-singular", i+1, i+1, [mc(i+1, pluralise(w1))], "Plural noun needed", '"'+w+'" goes with a plural noun: "'+pluralise(w1)+'".');
        continue;
      }
    }
    // Much of the books
    if(w === "much" && w1 === "of" && tight(i) && tight(i+1)){
      const h = DETERMINERS.has(L(i+2)) ? i+3 : -1;
      if(h > 0 && isPluralNoun(L(h)) && !UNCOUNTABLE.has(L(h)) && !INVARIANT_PLURALS.has(L(h))) emit("quant-uncountable", i, i, [mc(i,"many")], 'Use "many" with a plural noun', '"'+R(h)+'" is counted, so "many of" rather than "much of".');
    }
    // a group of student(s) / a lot of book
    if(/^(group|number|bunch|couple|variety|pair)$/.test(w) && w1 === "of" && L(i-1) === "a" && tight(i) && tight(i+1) && ESL_COUNT_NOUNS.has(L(i+2)) && !isPluralNoun(L(i+2)) && clauseEnd(i+2) || (/^(group|number|bunch|couple|variety)$/.test(w) && w1 === "of" && L(i-1) === "a" && tight(i) && tight(i+1) && ESL_COUNT_NOUNS.has(L(i+2)) && !isPluralNoun(L(i+2)) && (ESL_AUX_BE.has(L(i+3)) || PREPOSITIONS.has(L(i+3))))){
      emit("quant-singular", i+2, i+2, [mc(i+2, pluralise(L(i+2)))], "Plural noun needed", '"a '+w+' of" is followed by a plural noun: "'+pluralise(L(i+2))+'".');
    }
    // neither/either + plural noun
    if((w === "neither" || w === "either") && tight(i) && isPluralNoun(L(i+1)) && !INVARIANT_PLURALS.has(L(i+1)) && !UNCOUNTABLE.has(L(i+1)) && !/^(of|side|sides)$/.test(L(i+1)) && !isAdverb(L(i+1))){
      const sg = singularise(L(i+1));
      const v = L(i+2);
      if(tight(i+1) && PLV[v]) emit("neither-either", i, i+2, [R(i)+" "+sg+" "+PLV[v]], "Singular noun needed", '"'+R(i)+'" picks one of two, so the noun and verb are singular: "'+R(i)+' '+sg+' '+PLV[v]+'".');
      else emit("neither-either", i+1, i+1, [mc(i+1, sg)], "Singular noun needed", '"'+R(i)+'" picks one of two, so the noun is singular: "'+sg+'".');
      continue;
    }
    // Here are the answer / There have been a mistake / There has lots of work
    if((w === "here" || w === "there") && tight(i) && sentStart(i)){
      if(w1 === "have" && L(i+2) === "been" && tight(i+1) && (L(i+3) === "a" || L(i+3) === "an") && tight(i+2)){
        emit("there-agree", i+1, i+1, ["has"], "Verb agreement", '"a" + one thing: "There has been".');
      } else if(w1 === "has" && tight(i+1) && /^(lots|plenty)$/.test(L(i+2)) && L(i+3) === "of"){
        emit("there-agree", i+1, i+1, ["is"], "Verb agreement", '"There is lots of ..." (or "There are lots of ...").');
      } else if((w1 === "are" || w1 === "were") && tight(i+1) && /^(a|an|one|another)$/.test(L(i+2)) && tight(i+2) && !/^(few|lot|couple|number|bit|great|good|little|handful|total)$/.test(L(i+3))){
        emit("there-agree", i+1, i+1, [w1 === "are" ? "is" : "was"], "Verb agreement", '"'+L(i+2)+'" introduces one thing, so the verb is singular.');
      } else if(w === "here" && (w1 === "are" || w1 === "were") && tight(i+1) && L(i+2) === "the" && tight(i+2)){
        const nn = L(i+3);
        if(DICTIONARY.has(nn) && !isPluralNoun(nn) && !UNCOUNTABLE.has(nn) && !INVARIANT_PLURALS.has(nn) && !COLLECTIVE.has(nn) && !isAdjective(nn) && !/s$/.test(nn) && clauseEnd(i+3) && ESL_COUNT_NOUNS.has(nn)){
          emit("there-agree", i+1, i+1, [w1 === "are" ? "is" : "was"], "Verb agreement", '"the '+nn+'" is one thing, so the verb is singular.');
        }
      }
    }
    // These information are
    if((w === "these" || w === "those") && tight(i) && /^(information|advice|equipment|furniture|news|evidence|luggage|knowledge|research|homework)$/.test(w1)){
      const ex = ESL_AUX_BE.has(L(i+2)) && tight(i+1);
      const sing = w === "these" ? "this" : "that";
      emit("det-uncountable", i, ex ? i+2 : i, [ex ? mc(i, sing) + " " + R(i+1) + " " + (L(i+2) === "are" ? "is" : "was") : mc(i, sing)], "Determiner doesn't match the noun",
        '"'+w1+'" is uncountable, so it takes "'+sing+'" and a singular verb.');
    }
    // the police is / the people is
    if(/^(police|people|cattle|clergy|livestock)$/.test(w) && tight(i) && /^(is|was|has|doesn't)$/.test(w1) && DETERMINERS.has(L(i-1)) || (/^(police|people)$/.test(w) && tight(i) && /^(is|was|has|doesn't)$/.test(w1) && sentStart(i))){
      emit("collective-agree", i+1, i+1, [mc(i+1, SGV[w1])], "Verb agreement", '"'+w+'" is plural, so the verb is "'+SGV[w1]+'".');
    }
    // the curricula has
    if(ESL_LATIN_PLURALS.has(w) && tight(i) && /^(is|was|has|doesn't)$/.test(w1)){
      emit("latin-plural", i+1, i+1, [mc(i+1, SGV[w1])], "Verb agreement", '"'+w+'" is a plural form, so the verb is "'+SGV[w1]+'".');
    }
    // uncountable subject + plural verb: "The traffic are terrible"
    if(UNCOUNTABLE.has(w) && !/^(data|media|paper|time|work|art|love|rain|ice|wood|metal|gold|silver|air|tea|coffee|rice|bread|food)$/.test(w) && tight(i) && /^(are|were|have|don't)$/.test(w1) && i > 0 && tight(i-1) && DETERMINERS.has(L(i-1)) && clauseStart(i-1)){
      emit("uncountable-agree", i+1, i+1, [mc(i+1, PLV[w1])], "Verb agreement", '"'+w+'" is uncountable, so the verb is singular: "'+PLV[w1]+'".');
    }
    // One of my friends live / The collection of books belong
    if(/^(one|each)$/.test(w) && w1 === "of" && tight(i) && tight(i+1) && DETERMINERS.has(L(i+2)) && tight(i+2) && isPluralNoun(L(i+3)) && tight(i+3)){
      const v = L(i+4);
      if(PLV[v]) emit("one-of-agree", i+4, i+4, [mc(i+4, PLV[v])], "Verb agreement", '"'+w+' of" takes a singular verb: "'+PLV[v]+'".');
      else if(isBaseVerb(v) && ESL_CLEAR_VERBS.has(v) && !MODALS.has(v)) emit("one-of-agree", i+4, i+4, [eslThird(v)], "Verb agreement", '"'+w+' of" takes a singular verb: "'+eslThird(v)+'".');
    }
    if(/^(collection|bunch|box|bag|pile|stack|set|list|number|pair|batch)$/.test(w) && w1 === "of" && DETERMINERS.has(L(i-1)) === false && L(i-1) === "the" && false){}
    if(/^(collection|bunch|box|bag|pile|stack|set|list|number|pair|batch)$/.test(w) && w1 === "of" && L(i-1) === "the" && tight(i) && tight(i+1) && isPluralNoun(L(i+2)) && tight(i+2)){
      const v = L(i+3);
      if(PLV[v] && v !== "do") emit("head-agree", i+3, i+3, [mc(i+3, PLV[v])], "Verb agreement", 'The subject is "the '+w+'", which is singular: "'+PLV[v]+'".');
      else if(isBaseVerb(v) && /^(belong|need|contain|come|go|stay|look|seem|remain)$/.test(v)) emit("head-agree", i+3, i+3, [eslThird(v)], "Verb agreement", 'The subject is "the '+w+'", which is singular: "'+eslThird(v)+'".');
    }
    // A lot of time were wasted
    if(w === "lot" && w1 === "of" && L(i-1) === "a" && tight(i) && tight(i+1) && UNCOUNTABLE.has(L(i+2)) && tight(i+2) && /^(were|are|have)$/.test(L(i+3))){
      emit("lot-of-agree", i+3, i+3, [mc(i+3, PLV[L(i+3)])], "Verb agreement", '"'+L(i+2)+'" is uncountable, so the verb is singular: "'+PLV[L(i+3)]+'".');
    }
    // My sister don't / The books doesn't
    if((w === "don't" || w === "doesn't") && i >= 2 && tight(i-1) && DICTIONARY.has(L(i-1)) && !PRONOUNS.has(L(i-1)) && !COLLECTIVE.has(L(i-1)) && !INVARIANT_PLURALS.has(L(i-1)) && !ESL_AUX_BE.has(L(i-1)) && !CONJUNCTIONS.has(L(i-1)) &&
       (DETERMINERS.has(L(i-2)) || POSS_DET.has(L(i-2)))){
      const h = L(i-1);
      if(w === "don't" && !isPluralNoun(h) && !/(s|people|police|children|men|women)$/.test(h) && !isBaseVerb(h) || (w === "don't" && !isPluralNoun(h) && /^(sister|brother|mother|father|website|car|phone|computer|teacher|friend)$/.test(h)))
        emit("noun-neg-agree", i, i, [mc(i, "doesn't")], "Verb agreement", '"'+h+'" is singular, so it takes "doesn\'t".');
      else if(w === "doesn't" && isPluralNoun(h) && !UNCOUNTABLE.has(h))
        emit("noun-neg-agree", i, i, [mc(i, "don't")], "Verb agreement", '"'+h+'" is plural, so it takes "don\'t".');
    }
    // The car need fuel
    if(sentStart(i) && DETERMINERS.has(w) && tight(i) && i+2 < n && tight(i+1)){
      const h = L(i+1), v = L(i+2);
      if(ESL_COUNT_NOUNS.has(h) && !isPluralNoun(h) && !/s$/.test(h) && /^(need|want|seem|belong|look|live|work|think|know|like|come|go)$/.test(v) && !/^(these|those|both|many|several|few)$/.test(w)){
        emit("noun-verb-agree", i+2, i+2, [eslThird(v)], "Verb agreement", '"'+h+'" is singular, so the verb takes -s: "'+eslThird(v)+'".');
      }
    }
    // team ... are ... its
    if(w === "its" && i > 3){
      let m = -1;
      for(let k=i-1;k>=Math.max(0,i-5) && sameS(k,i) && tight(k);k--){
        if(/^(that|because|which|who|while|and|but)$/.test(L(k))) break;
        if(/^(are|were|have|don't|aren't)$/.test(L(k))) { m = k; break; }
      }
      if(m > 0){
        let hit = false;
        for(let k=m-1;k>=Math.max(0,m-5) && sameS(k,m);k--){ if(COLLECTIVE.has(L(k))) { hit = true; break; } if(!tight(k)) break; }
        if(hit) emit("collective-its", i, i, [mc(i,"their")], "Pronoun agreement", 'The verb treats the group as plural, so the pronoun is "their".');
      }
    }
  }
});

// ---------------------------------------------------------------
// 12. RELATIVE CLAUSES
// ---------------------------------------------------------------
ESL_FAMILIES.push(function relativeClauses(c){
  const { n, L, R, tight, clauseEnd, sameS, emit, mc } = c;
  const THINGS = S("car book house phone song movie film table chair computer apartment city street tree box bag door window picture");
  const DITRANS = S("give gave given send sent show showed tell told bring brought buy bought lend lent offer offered teach taught pass passed hand handed owe owed write wrote");
  const finite = k => clauseEnd(k) || ESL_AUX_BE.has(L(k+0)) || ESL_AUX_HAVE.has(L(k)) || ESL_AUX_MODAL.has(L(k)) || ESL_AUX_DO.has(L(k)) || /n't$/.test(L(k)) || (IRREG_PAST.has(L(k)) && !ESL_AMBIG_PAST.has(L(k))) || isThirdPersonVerb(L(k));
  for(let i=0;i<n;i++){
    const w = L(i);
    // the car who broke down
    if((w === "who" || w === "whom") && i > 0 && THINGS.has(L(i-1)) && tight(i-1)) emit("who-thing", i, i, [mc(i,"which"), mc(i,"that")], "Wrong relative pronoun", '"'+L(i-1)+'" is not a person, so use "which" or "that".');
    // whose she / whose I
    if(w === "whose" && ESL_SUBJ.has(L(i+1)) && tight(i) && L(i+1) !== "it") emit("whose-pronoun", i, i, [mc(i,"who")], 'Check "whose"', '"whose" is followed by a noun ("whose house"), not a pronoun.');
    // whose roof it is red
    if(w === "whose" && tight(i) && DICTIONARY.has(L(i+1)) && tight(i+1) && ESL_SUBJ.has(L(i+2)) && tight(i+2) && ESL_AUX_BE.has(L(i+3))){
      emit("resumptive", i+2, i+2, [""], "Unneeded pronoun", 'The noun after "whose" is already the subject; "'+L(i+2)+'" repeats it.');
    }
    // the boy who mother works
    if(w === "who" && tight(i) && /^(mother|father|brother|sister|wife|husband|son|daughter|parents|name|house|car|dog|cat|friend|teacher)$/.test(L(i+1)) && tight(i+1) && (isThirdPersonVerb(L(i+2)) || ESL_AUX_BE.has(L(i+2)) || IRREG_PAST.has(L(i+2)))){
      emit("whose-noun", i, i, [mc(i,"whose")], 'Use "whose"', '"whose" shows possession: "whose '+L(i+1)+'".');
    }
    // which I bought it / who I called her
    if(/^(which|that|who|whom)$/.test(w) && tight(i) && ESL_SUBJ_NOIT.has(L(i+1)) && L(i+1) !== "you" || (/^(which|that|who|whom)$/.test(w) && tight(i) && L(i+1) === "you")){
      const v = i+2;
      if(v >= n || !tight(i+1) || !DICTIONARY.has(L(v)) || ESL_AUX_BE.has(L(v)) || ESL_AUX_HAVE.has(L(v)) || MODALS.has(L(v)) || ESL_AUX_DO.has(L(v))) continue;
      if(!(isBaseVerb(L(v)) || isPast(L(v)) || isThirdPersonVerb(L(v)))) continue;
      const vb = eslBaseOf(L(v)) || L(v);
      for(let p=v+1;p<=v+4 && p<n && sameS(v,p) && tight(p-1);p++){
        if(ESL_OBJ.has(L(p)) || L(p) === "there"){
          const after = p+1;
          const prepBefore = PREPOSITIONS.has(L(p-1));
          const ditransFirst = DITRANS.has(vb) && p === v+1 && L(p) !== "it";
          if(ditransFirst) break;
          if((p === v+1 || prepBefore) && (L(p) !== "there" ? finite(after) : (clauseEnd(after) || ESL_AUX_BE.has(L(after)) || isThirdPersonVerb(L(after)))) && tight(p-1)){
            if(prepBefore && p === v+2 && false) break;
            emit("resumptive", p, p, [""], "Unneeded pronoun", '"'+L(i)+'" already stands for the object, so "'+L(p)+'" repeats it.');
          }
          break;
        }
        if(CONJUNCTIONS.has(L(p)) || PREPOSITIONS.has(L(p)) && p > v+2) break;
      }
    }
  }
  function isPast(w){ return IRREG_PAST.has(w) || (/ed$/.test(w) && isPastForm(w)); }
});

// ---------------------------------------------------------------
// 13. ARTICLES WITH SUBJECTS, SPORTS, INSTRUMENTS AND MEALS
// ---------------------------------------------------------------
ESL_FAMILIES.push(function articlesWithKinds(c){
  const { n, L, R, tight, clauseEnd, emit, mc, isCap, run } = c;
  const LANGS = S("japanese english french german spanish chinese arabic russian italian hindi korean portuguese latin malay");
  const SUBJECTS = S("mathematics maths math physics chemistry biology economics geography");
  const SPORTS = S("football tennis basketball cricket golf rugby chess hockey badminton baseball volleyball");
  const INSTR = S("piano guitar violin drums flute trumpet cello saxophone clarinet harp");
  const MEALS = S("breakfast lunch dinner supper");
  for(let i=0;i<n-2;i++){
    const w = L(i), w1 = L(i+1), w2 = L(i+2);
    if(/^(learn|learns|learned|learning|study|studies|studied|studying|speak|speaks|spoke|speaking|practise|practised)$/.test(w) && w1 === "the" && tight(i) && tight(i+1)){
      if(LANGS.has(w2) && !(w2 === "english" && false) || (SUBJECTS.has(w2)) || (w2 === "history" && clauseEnd(i+2))){
        emit("article-kind", i+1, i+1, [""], "Unneeded article", '"'+w2+'" is a subject or language here and takes no "the".');
        continue;
      }
    }
    if(/^(play|plays|played|playing)$/.test(w) && tight(i) && tight(i+1)){
      if(w1 === "the" && SPORTS.has(w2)) { emit("article-kind", i+1, i+1, [""], "Unneeded article", 'Sports take no article: "'+R(i)+' '+R(i+2)+'".'); continue; }
      if((w1 === "a" || w1 === "an") && INSTR.has(w2)) { emit("article-kind", i+1, i+1, ["the"], "Check the article", 'Instruments take "the": "'+R(i)+' the '+R(i+2)+'".'); continue; }
    }
    if(/^(ate|eat|eats|had|have|has)$/.test(w) && w1 === "a" && MEALS.has(w2) && run(i,i+2) && (clauseEnd(i+2) || isAdverb(L(i+3)) || L(i+3) === "together")){
      emit("article-kind", i+1, i+1, [""], "Unneeded article", 'Meals take no article: "'+R(i)+' '+R(i+2)+'".');
      continue;
    }
    if((w1 === "a" || w1 === "an" || w1 === "the") && w2 === "mount" && isCap(i+2) === false && /^[A-Z]/.test(R(i+3)) && w1 !== "the" && tight(i+1)){
      emit("article-kind", i+1, i+1, [""], "Unneeded article", 'A named mountain takes no "a": "Mount '+R(i+3)+'".');
    }
  }
});

// ---------------------------------------------------------------
// 14. ADJECTIVE / ADVERB MIX-UPS AND -ING / -ED ADJECTIVES
// ---------------------------------------------------------------
const ESL_ADV_OK = S("fast hard late early straight high low deep far near wide long right wrong close tight fair clear direct well");
function eslAdverbOf(adj){
  let a;
  if(/[^aeiou]y$/.test(adj)) a = adj.slice(0,-1) + "ily";
  else if(/le$/.test(adj)) a = adj.slice(0,-1) + "y";
  else if(/ic$/.test(adj)) a = adj + "ally";
  else a = adj + "ly";
  return DICTIONARY.has(a) ? a : "";
}
function eslAdjOf(adv){
  const c = [];
  if(/ily$/.test(adv)) c.push(adv.slice(0,-3) + "y");
  if(/ally$/.test(adv)) c.push(adv.slice(0,-4) + "ic", adv.slice(0,-2));
  if(/ly$/.test(adv)) c.push(adv.slice(0,-2), adv.slice(0,-2) + "e", adv.slice(0,-1) + "e");
  if(/bly$/.test(adv)) c.push(adv.slice(0,-1) + "e");
  return c.find(a => a.length > 2 && (COMMON_ADJECTIVES.has(a) || (DICTIONARY.has(a) && isAdjective(a)))) || "";
}
ESL_FAMILIES.push(function adjectiveAdverb(c){
  const { n, L, R, tight, clauseEnd, emit, mc, isCap, sentStart } = c;
  const ACTION = S(`sing sings sang sung walk walks walked walking work works worked working run runs ran running drive drives drove driving
    speak speaks spoke talk talks talked write writes wrote respond responds responded answer answers answered react reacted
    behave behaves behaved move moved play played perform performed smile smiled arrive arrived finish finished`);
  const LINK = S("taste tastes tasted smell smells smelled sound sounds sounded seem seems seemed");
  const SLOPPY_OK = S("slow loud quick");
  for(let i=1;i<n;i++){
    const w = L(i);
    // linking verb + -ly adverb: "tastes deliciously"
    if(/ly$/.test(w) && i > 0 && tight(i-1) && (LINK.has(L(i-1)) || (/^(looks|looked|look)$/.test(L(i-1)) && ESL_TIME_WORDS.has(L(i+1)))) && (clauseEnd(i) || ESL_TIME_WORDS.has(L(i+1)))){
      const adj = eslAdjOf(w);
      if(adj && !/^(early|friendly|only|likely)$/.test(w)) emit("adj-adv", i, i, [mc(i, adj)], "Adjective, not adverb", '"'+L(i-1)+'" describes how something is, so it takes an adjective: "'+adj+'".');
      continue;
    }
    // action verb + adjective at the end of the clause: "sang beautiful"
    if(ACTION.has(L(i-1)) && tight(i-1) && (clauseEnd(i) || PREPOSITIONS.has(L(i+1))) && !ESL_ADV_OK.has(w) && (COMMON_ADJECTIVES.has(w) || isAdjective(w)) && !/ly$/.test(w) && !(w === "safe" && L(i+1) === "and")){
      const adv = eslAdverbOf(w);
      if(adv && !(L(i-1) === "arrive" && false)) emit("adj-adv", i, i, [mc(i, adv)], "Adverb needed", '"'+R(i-1)+'" is described by an adverb: "'+adv+'".', SLOPPY_OK.has(w) ? "advisory" : "critical");
    }
  }
  // emotion adjectives: "bored by" / "was bored" (inanimate) / "annoying by the noise"
  const EMO_ING = S("boring annoying exciting tiring confusing frightening disappointing frustrating shocking surprising amazing astonishing fascinating terrifying embarrassing depressing irritating worrying");
  const INANIMATE = S("movie film lesson lecture book story speech show game result news trip journey meeting concert match exam test");
  for(let i=1;i<n-1;i++){
    const w = L(i);
    if(EMO_ING.has(w) && ESL_AUX_BE.has(L(i-1)) || (EMO_ING.has(w) && i > 1 && L(i-1) === "very" || EMO_ING.has(w) && i > 1 && L(i-1) === "so")){
      const j = tight(i) ? i+1 : -1;
      const hasBe = ESL_AUX_BE.has(L(i-1)) || (i > 1 && ESL_AUX_BE.has(L(i-2)));
      if(hasBe && j > 0 && L(j) === "by"){
        const ed = w.replace(/ing$/, "ed").replace(/(.)ed$/, (m,a) => a + "ed");
        const fix = DICTIONARY.has(w.slice(0,-3) + "ed") ? w.slice(0,-3) + "ed" : w.slice(0,-3) + "d";
        emit("emotion-adj", i, i, [mc(i, fix)], "-ing or -ed?", 'The person who feels it is "'+fix+'"; the thing that causes it is "'+w+'".');
      }
    }
  }
  const EMO_ED = { bored:"boring", interested:"interesting", excited:"exciting", annoyed:"annoying", confused:"confusing", frightened:"frightening", disappointed:"disappointing", shocked:"shocking", surprised:"surprising", amazed:"amazing", embarrassed:"embarrassing", frustrated:"frustrating", fascinated:"fascinating" };
  for(let i=2;i<n;i++){
    const w = L(i);
    if(EMO_ED[w] && ESL_AUX_BE.has(L(i-1)) && tight(i-1) && INANIMATE.has(L(i-2)) && DETERMINERS.has(L(i-3)) && clauseEnd(i)){
      emit("emotion-adj", i, i, [mc(i, EMO_ED[w])], "-ing or -ed?", 'A thing that causes the feeling is "'+EMO_ED[w]+'"; a person who has it is "'+w+'".');
    }
  }
});
