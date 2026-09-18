// ===============================================================
// 6. GRAMMAR / PUNCTUATION / STYLE RULES
// ===============================================================

// --- a vs an -------------------------------------------------------------
const VOWEL_SOUND_EXCEPTIONS = S("hour hours hourly honest honestly honesty honour honours honoured honourable honour's heir heiress hourglass herb");
const CONSONANT_SOUND_EXCEPTIONS = S(`
 one once oneself use used user users useful useless usual usually usage using unit units
 unite united unity universe university universal unicorn uniform uniforms unify union
 unions unique unicycle unilateral uranium urine urinal utensil utility utilities utilise
 utilised utopia ukulele euro europe european eulogy euphemism euphoria eucalyptus eunuch
 ewe ubiquitous unanimous
`);
const LETTER_VOWEL_SOUND = S("a e f h i l m n o r s x");
function startsWithVowelSound(word){
  const w = word.toLowerCase().replace(/[^a-z']/g,"");
  if(!w) return false;
  if(VOWEL_SOUND_EXCEPTIONS.has(w)) return true;
  if(CONSONANT_SOUND_EXCEPTIONS.has(w)) return false;
  // Acronym read letter by letter (FBI, MBA, NHS, RSPCA)
  if(word.length > 1 && word === word.toUpperCase() && !DICTIONARY.has(w))
    return LETTER_VOWEL_SOUND.has(w[0]);
  if(word.length === 1) return LETTER_VOWEL_SOUND.has(w);
  return "aeiou".indexOf(w[0]) !== -1;
}

// --- wordiness and redundancy -------------------------------------------
const WORDY_PHRASES = [
  ["in order to","to"],["due to the fact that","because"],["owing to the fact that","because"],
  ["in spite of the fact that","although"],["despite the fact that","although"],
  ["at this point in time","now"],["at the present time","now"],["in this day and age","today"],
  ["a large number of","many"],["a great deal of","much"],["the majority of","most"],
  ["in the event that","if"],["on the grounds that","because"],["for the reason that","because"],
  ["has the ability to","can"],["have the ability to","can"],["is able to","can"],["are able to","can"],
  ["make a decision","decide"],["take into consideration","consider"],["give consideration to","consider"],
  ["with regard to","about"],["in regard to","about"],["with reference to","about"],
  ["in relation to","about"],["in terms of","for"],["for the purpose of","to"],
  ["on a daily basis","daily"],["on a regular basis","regularly"],["in the near future","soon"],
  ["prior to","before"],["subsequent to","after"],["in close proximity to","near"],
  ["in the vicinity of","near"],["a sufficient amount of","enough"],["in excess of","more than"],
  ["at all times","always"],["until such time as","until"],["in my opinion i think","i think"],
  ["the reason why is because","because"],["it is important to note that","note that"],
  ["please be advised that","-"],["needless to say","-"],["as a matter of fact","in fact"],
  ["each and every","every"],["first and foremost","first"],["by means of","by"],
  ["in the process of","-"],["during the course of","during"],["in the absence of","without"],
  ["come to the conclusion","conclude"],["conduct an investigation","investigate"],
  ["provide assistance to","help"],["in view of the fact that","because"],
  ["in the majority of cases","usually"],["despite of","despite"],
  ["regardless of the fact that","although"],["with the exception of","except"],
  ["in a timely manner","promptly"],["perform an analysis of","analyse"],
  ["a majority of","most"],["the vast majority of","most"],["in the final analysis","finally"],
  ["at the end of the day","ultimately"],["it goes without saying that","-"],
  ["as far as i'm concerned","i think"],["in the not too distant future","soon"],
  ["on account of the fact that","because"],["for the simple reason that","because"]
];
const REDUNDANCIES = [
  ["absolutely essential","essential"],["past history","history"],["advance planning","planning"],
  ["basic fundamentals","fundamentals"],["close proximity","proximity"],["end result","result"],
  ["free gift","gift"],["future plans","plans"],["join together","join"],["new innovation","innovation"],
  ["personal opinion","opinion"],["repeat again","repeat"],["revert back","revert"],
  ["unexpected surprise","surprise"],["atm machine","atm"],["pin number","pin"],
  ["lcd display","lcd"],["final outcome","outcome"],["added bonus","bonus"],
  ["completely finished","finished"],["actual fact","fact"],["true fact","fact"],
  ["general consensus","consensus"],["mutual cooperation","cooperation"],["brief summary","summary"],
  ["sum total","total"],["still remains","remains"],["plan ahead","plan"],["may possibly","may"],
  ["merge together","merge"],["over exaggerate","exaggerate"],["reason why","reason"],
  ["small in size","small"],["few in number","few"],["period of time","period"],
  ["return back","return"],["combine together","combine"],["gather together","gather"],
  ["connect together","connect"],["blend together","blend"],["mix together","mix"],
  ["exact same","same"],["new beginning","beginning"],["final conclusion","conclusion"],
  ["empty space","space"],["unintentional mistake","mistake"],["advance warning","warning"],
  ["end product","product"],["final destination","destination"],["free bonus","bonus"],
  ["honest truth","truth"],["most unique","unique"],["very unique","unique"],
  ["totally unanimous","unanimous"],["close scrutiny","scrutiny"]
];
const HEDGES = S("very really quite rather somewhat basically actually literally simply just totally definitely absolutely extremely incredibly honestly obviously clearly essentially virtually");

// Participles that are ordinary adjectives after "be", so flagging them as
// passive voice would be wrong.
const ADJECTIVAL_PARTICIPLES = S(`
 tired interested excited pleased worried confused located related based involved known
 supposed used married born done finished gone concerned satisfied surprised bored
 annoyed prepared determined dressed committed qualified experienced limited advanced
 closed open broken lost dedicated devoted accustomed obliged entitled allowed
`);

const PROPER_NOUNS_LOWER = S(`
 monday tuesday wednesday thursday friday saturday sunday
 monday's tuesday's wednesday's thursday's friday's saturday's sunday's
 january february april june july september october november december
 england scotland wales ireland britain london europe africa asia antarctica
 america australia canada france germany spain italy japan china india russia brazil
 mexico argentina chile peru egypt kenya nigeria ghana greece portugal norway sweden
 finland denmark iceland ukraine korea vietnam thailand indonesia philippines pakistan
 bangladesh israel iran iraq syria lebanon jordan saudi qatar kuwait malaysia singapore
 zimbabwe zambia uganda tanzania morocco algeria tunisia libya sudan ethiopia somalia
 cuba jamaica bermuda georgia netherlands belgium switzerland austria
 paris berlin madrid rome moscow beijing tokyo delhi cairo dubai sydney toronto
 dublin edinburgh glasgow cardiff belfast
 english british scottish welsh irish european american australian canadian french german
 spanish italian japanese chinese indian russian mexican argentinian chilean peruvian
 egyptian kenyan nigerian ghanaian greek portuguese norwegian swedish finnish danish
 icelandic ukrainian korean vietnamese thai indonesian filipino pakistani bangladeshi
 israeli iranian iraqi syrian lebanese jordanian saudi qatari kuwaiti malaysian
 singaporean zimbabwean zambian ugandan tanzanian moroccan algerian tunisian libyan
 sudanese ethiopian somali cuban jamaican georgian dutch belgian swiss austrian
 swahili hindi urdu arabic hebrew tagalog
 christianity islam judaism hinduism buddhism christian muslim jewish hindu buddhist
 catholic protestant
 christmas easter halloween thanksgiving hanukkah ramadan eidulfitr eiduladha diwali deepavali hogmanay

 afghanistan albania andorra angola armenia azerbaijan bahamas bahrain barbados
 belarus belize benin bhutan bolivia bosnia botswana brunei bulgaria burundi
 cambodia cameroon colombia comoros congo croatia cyprus djibouti dominica
 ecuador eritrea estonia fiji gabon gambia grenada guatemala guinea guyana
 haiti honduras hungary kazakhstan kiribati kosovo kyrgyzstan laos latvia
 lesotho liberia liechtenstein lithuania luxembourg madagascar malawi maldives
 mali malta mauritania mauritius micronesia moldova monaco mongolia montenegro
 mozambique myanmar namibia nauru nepal nicaragua niger oman palau panama
 paraguay poland romania rwanda samoa senegal serbia seychelles slovakia
 slovenia suriname swaziland tajikistan togo tonga turkmenistan tuvalu
 uruguay uzbekistan vanuatu venezuela yemen

 afghan albanian andorran angolan armenian azerbaijani bahamian bahraini
 barbadian belarusian belizean beninese bhutanese bolivian bosnian botswanan
 bruneian bulgarian burundian cambodian cameroonian colombian congolese
 croatian cypriot djiboutian dominican ecuadorian eritrean estonian fijian
 gabonese gambian guatemalan guinean guyanese haitian honduran hungarian
 kazakh kosovar kyrgyz laotian latvian liberian lithuanian malagasy malawian
 maldivian malian maltese mauritanian mauritian moldovan mongolian
 montenegrin mozambican namibian nepalese nicaraguan nigerien omani
 panamanian paraguayan romanian rwandan salvadoran senegalese serbian
 seychellois slovak slovenian surinamese swazi tajik togolese tongan
 turkmen uruguayan uzbek venezuelan yemeni

 amsterdam athens baghdad bangkok brussels budapest copenhagen hanoi
 helsinki islamabad jakarta kabul kiev lisbon manila nairobi oslo ottawa
 prague riyadh seoul stockholm vienna warsaw wellington zurich mumbai
 shanghai istanbul venice florence milan barcelona munich hamburg frankfurt
 geneva brisbane melbourne perth auckland vancouver montreal calgary

 mandarin cantonese bengali punjabi tamil telugu marathi gujarati farsi
 persian pashto kurdish amharic yoruba zulu xhosa afrikaans czech turkish
 malay burmese khmer nepali sinhala tibetan esperanto sanskrit

 mercury venus mars jupiter saturn neptune pluto uranus
 aries taurus gemini leo virgo libra scorpio sagittarius capricorn aquarius pisces

 sikh sikhism taoism taoist shinto confucianism confucian bahai
 zoroastrianism zoroastrian mormon mormonism anglican methodist baptist
 lutheran presbyterian orthodox sunni shia quaker

 passover lent pentecost epiphany nowruz kwanzaa vesak
`);

function grammarIssues(text, tokens, sentences, add){
  const n = tokens.length;
  const lw = i => (i>=0 && i<n) ? tokens[i].lw : "";
  const raw = i => (i>=0 && i<n) ? tokens[i].raw : "";
  // contiguous = nothing but spaces between the two tokens
  const contig = i => i>=0 && i<n-1 && /^[ \t]*$/.test(text.slice(tokens[i].end, tokens[i+1].start));
  const sameSentence = (i,j) => i>=0 && j<n && tokens[i].s === tokens[j].s;
  const sentStart = i => i>=0 && i<n && tokens[i].i === 0;

  function span(i,j){ return { start: tokens[i].start, end: tokens[j].end, original: text.slice(tokens[i].start, tokens[j].end) }; }
  function matchCase(model, word){
    if(model === model.toUpperCase() && model.length > 1) return word.toUpperCase();
    if(model[0] === model[0].toUpperCase()) return word[0].toUpperCase() + word.slice(1);
    return word;
  }
  // rewrite token i with `word`, keeping the original capitalisation pattern
  function sub(i, word){ return matchCase(raw(i), word); }

  // Walk from a determiner past any numbers and adjectives to the noun the
  // phrase is actually about: "those two long meetings" -> "meetings".
  const NUMBER_WORDS = S("one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred thousand million billion first second third last next other same only very such more less");
  const QUANTIFIER_HEADS = S("rest remainder half number couple lot bunch handful none all some any most few several plenty variety range series percentage proportion minority majority dozen pair set group total sort kind type");
  function headNounAfter(i){
    let j = i+1, guard = 0;
    while(j < n && guard < 4 && contig(j-1) &&
          (NUMBER_WORDS.has(lw(j)) || isAdjective(lw(j)) || isAdverb(lw(j)) || /^[0-9]+$/.test(lw(j)))){ j++; guard++; }
    if(j >= n || !contig(j-1) || !sameSentence(i, j)) return -1;
    const h = lw(j);
    if(!DICTIONARY.has(h)) return -1;
    if(PRONOUNS.has(h) || PREPOSITIONS.has(h) || MODALS.has(h) || CONJUNCTIONS.has(h) ||
       BE_FORMS.has(h) || HAVE_FORMS.has(h) || DO_FORMS.has(h) || DETERMINERS.has(h) ||
       QUANTIFIER_HEADS.has(h) || COLLECTIVE.has(h) || INVARIANT_PLURALS.has(h)) return -1;
    return j;
  }
  function headIsPlural(j){ return isPluralNoun(lw(j)); }

  // True when the noun phrase starting at i is the object of a preposition
  // ("of the students", "in those meetings"). Such a noun can never be the
  // subject of the verb that follows, so agreement rules must ignore it.
  function inPrepPhrase(i){
    return i > 0 && contig(i-1) && PREPOSITIONS.has(lw(i-1)) && sameSentence(i-1, i);
  }
  // True when a word from `set` appears within `span` tokens of idx, in the
  // same sentence — used for confusables where the trigger word can be
  // several places away rather than the immediate neighbour.
  function nearbyAny(idx, set, span){
    for(let k=Math.max(0,idx-span); k<=Math.min(n-1,idx+span); k++){
      if(k===idx || !sameSentence(idx,k)) continue;
      if(set.has(lw(k))) return true;
    }
    return false;
  }

  for(let i=0;i<n;i++){
    const w = lw(i), w1 = lw(i+1), w2 = lw(i+2);
    const next = contig(i);

    // ---------------------------------------------------------------
    // ARTICLES
    // ---------------------------------------------------------------
    if((w === "a" || w === "an") && next && w1){
      const vowel = startsWithVowelSound(raw(i+1));
      if(w === "a" && vowel){
        const sp = span(i,i);
        add({ cat:"grammar", rule:"a-an", severity:"critical", ...sp,
          suggestions:[sub(i,"an")], title:'Use "an" before a vowel sound',
          why:'"'+raw(i+1)+'" begins with a vowel sound, so it takes "an".' });
      } else if(w === "an" && !vowel){
        const sp = span(i,i);
        add({ cat:"grammar", rule:"a-an", severity:"critical", ...sp,
          suggestions:[sub(i,"a")], title:'Use "a" before a consonant sound',
          why:'"'+raw(i+1)+'" begins with a consonant sound, so it takes "a".' });
      }
      // "a books" / "an apples"
      const h = headNounAfter(i);
      if(h === i+1 && headIsPlural(h)){
        add({ cat:"grammar", rule:"art-plural", severity:"critical", ...span(i,i+1),
          suggestions:[sub(i,"the")+" "+raw(i+1), raw(i)+" "+singularise(w1)],
          title:"Article with a plural noun",
          why:'"'+w+'" introduces a single thing, so it can\'t sit in front of the plural "'+raw(i+1)+'".' });
      }
    }
    // this/that + plural, these/those + singular
    if(w === "this" || w === "that" || w === "these" || w === "those" || w === "every" || w === "each"){
      const h = headNounAfter(i);
      // "this works fine" is a verb; "this books are mine" is a noun — what
      // follows tells them apart.
      if(h > 0 && (!isThirdPersonVerb(lw(h)) || (h+1 < n && isFiniteVerb(lw(h+1))))){
        const plural = headIsPlural(h);
        if((w === "this" || w === "that") && plural){
          add({ cat:"grammar", rule:"det-number", severity:"critical", ...span(i,i),
            suggestions:[sub(i, w === "this" ? "these" : "those")], title:"Determiner doesn't match the noun",
            why:'"'+raw(h)+'" is plural, so it needs "these" or "those".' });
        } else if((w === "these" || w === "those") && !plural && !UNCOUNTABLE.has(lw(h))){
          add({ cat:"grammar", rule:"det-number", severity:"critical", ...span(i,i),
            suggestions:[sub(i, w === "these" ? "this" : "that")], title:"Determiner doesn't match the noun",
            why:'"'+raw(h)+'" is singular, so it takes "this" or "that".' });
        } else if((w === "every" || w === "each") && plural){
          add({ cat:"grammar", rule:"det-number", severity:"critical", ...span(h,h),
            suggestions:[sub(h, singularise(lw(h)))], title:'"'+w+'" takes a singular noun',
            why:'"'+w+'" picks out members one at a time, so the noun after it stays singular.' });
        }
      }
    }
    // fewer/less, number/amount, many/much
    if(w === "less" && next && (()=>{ const h = headNounAfter(i); return h > 0 && headIsPlural(h) && !UNCOUNTABLE.has(singularise(lw(h))); })()){
      add({ cat:"grammar", rule:"less-fewer", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"fewer")], title:'"Fewer" for things you can count',
        why:'"'+raw(i+1)+'" can be counted, so it takes "fewer". "Less" is for quantities you measure.' });
    }
    if(w === "amount" && w1 === "of" && next && contig(i+1) && isPluralNoun(w2) && isNounish(w2)){
      add({ cat:"grammar", rule:"amount-number", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"number")], title:'"Number of" for countable things',
        why:'"Amount" measures a mass; countable things like "'+raw(i+2)+'" take "number of".' });
    }
    if(w === "much" && next && isPluralNoun(w1) && isNounish(w1) && !UNCOUNTABLE.has(singularise(w1))){
      add({ cat:"grammar", rule:"much-many", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"many")], title:'"Many" with countable nouns',
        why:'"'+raw(i+1)+'" is countable, so it pairs with "many".' });
    }

    // ---------------------------------------------------------------
    // SUBJECT-VERB AGREEMENT
    // ---------------------------------------------------------------
    if(next){
      // "this" joins he/she/it here because, unlike "that", it is never a
      // relative pronoun borrowing someone else's number ("the toys that
      // break" takes its number from "toys", not from "that") — "this"
      // used as a pronoun is always notionally singular on its own.
      const subjSg = SUBJ_PRON_SG3.has(w) || INDEF_SG.has(w) || w === "this";
      const subjPl = SUBJ_PRON_PL.has(w);
      const fixMap = { are:"is", were:"was", have:"has", do:"does", "don't":"doesn't",
                       "aren't":"isn't", "weren't":"wasn't", "haven't":"hasn't" };
      const fixMapPl = { is:"are", was:"were", has:"have", does:"do", "doesn't":"don't",
                         "isn't":"aren't", "wasn't":"weren't", "hasn't":"haven't" };
      if(subjSg && fixMap[w1] && !(w1 === "have" && w2 === "to")){
        add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, fixMap[w1])], title:"Subject and verb don't agree",
          why:'"'+raw(i)+'" is singular, so it takes "'+fixMap[w1]+'".' });
      } else if(subjPl && fixMapPl[w1]){
        add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, fixMapPl[w1])], title:"Subject and verb don't agree",
          why:'"'+raw(i)+'" is plural, so it takes "'+fixMapPl[w1]+'".' });
      } else if(w === "i" && raw(i) === "I"){
        const iFix = { is:"am", are:"am", has:"have", does:"do", "isn't":"am not",
                       "doesn't":"don't", "hasn't":"haven't" };
        if(iFix[w1] && !(w1 === "were" )){
          add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
            suggestions:[iFix[w1]], title:"Subject and verb don't agree",
            why:'"I" takes "'+iFix[w1]+'".' });
        }
      }
      // he/she/it/everyone + bare verb -> third person -s  ("he go to work")
      if((SUBJ_PRON_SG3.has(w) || INDEF_SG.has(w)) && isBaseVerb(w1) && !MODALS.has(w1) && !BE_FORMS.has(w1) &&
         !HAVE_FORMS.has(w1) && !DO_FORMS.has(w1) && !isPluralNoun(w1) && w1 !== "need" &&
         !(w2 === "" ) && !PREPOSITIONS.has(w1) && !isNounish(w1)){
        add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, thirdPerson(w1))], title:"Verb needs a third-person ending",
          why:'With "'+raw(i)+'" the verb takes -s: "'+thirdPerson(w1)+'".' });
      }
      // "this" + bare verb -> third person -s ("this happen a lot"). Kept
      // separate from the he/she/it rule above rather than folded into it,
      // because "this" carries a risk those pronouns don't: "this" can
      // also head a longer noun phrase whose real verb comes later ("this
      // change means a lot" — "change" is the noun, "means" is the verb),
      // and he/she/it are never determiners so that reading never arises
      // for them. The extra condition rules that out: it only fires when
      // what follows the candidate verb looks like the end of the clause
      // or a plain complement (an adjective or adverb), never when a
      // further verb-shaped word follows, which would mean the word right
      // after "this" was a noun, not the verb.
      if(w === "this" && isBaseVerb(w1) && !MODALS.has(w1) && !BE_FORMS.has(w1) &&
         !HAVE_FORMS.has(w1) && !DO_FORMS.has(w1) && !isPluralNoun(w1) && w1 !== "need" &&
         !PREPOSITIONS.has(w1) && !isNounish(w1) &&
         (w2 === "" || (contig(i+1) && (isAdjective(w2) || isAdverb(w2)) &&
                         !isPastForm(w2) && !isThirdPersonVerb(w2)))){
        add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, thirdPerson(w1))], title:"Verb needs a third-person ending",
          why:'With "this" the verb takes -s: "'+thirdPerson(w1)+'".' });
      }
      // they/we/I + verb+s  ("they goes")
      if((subjPl || w === "i") && looksLikeVerbS(w1) &&
         !BE_FORMS.has(w1) && !HAVE_FORMS.has(w1) && !DO_FORMS.has(w1)){
        const b = baseOfThird(w1);
        if(ALL_BASE_VERBS.has(b)){
          add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(i+1,i+1),
            suggestions:[sub(i+1, b)], title:"Verb shouldn't take -s here",
            why:'"'+raw(i)+'" is not third-person singular, so the verb stays as "'+b+'".' });
        }
      }
    }
    // there is/are
    if(w === "there" && next && (w1 === "is" || w1 === "was" || w1 === "'s")){
      let j = i+2, guard = 0;
      while(j < n && guard < 4 && (DETERMINERS.has(lw(j)) === false && isAdjective(lw(j)))){ j++; guard++; }
      const head = lw(j);
      const quantPlural = S("many several few both lots two three four five six seven eight nine ten dozens hundreds thousands millions numerous various multiple");
      if((quantPlural.has(lw(i+2)) || quantPlural.has(head)) ||
         (isPluralNoun(head) && isNounish(head) && !UNCOUNTABLE.has(singularise(head)))){
        add({ cat:"grammar", rule:"there-agree", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, w1 === "was" ? "were" : "are")], title:'"There" agrees with what follows it',
          why:'What follows is plural, so it takes "there '+(w1==="was"?"were":"are")+'".' });
      }
    }
    // "one of the reports is" vs "three of the reports are".
    // In a phrase like "X of the Ys", it is X — not the nearest noun — that
    // fixes the number of the verb, which is exactly where nearest-noun
    // checkers get it wrong in both directions.
    if(w === "of" && next && i > 0 && contig(i-1) && sameSentence(i-1, i)){
      const q = lw(i-1);
      const SG_QUANT = S("one each either neither anyone anybody everyone everybody someone somebody nobody none much little");
      const PL_QUANT = S("two three four five six seven eight nine ten eleven twelve dozens hundreds thousands millions many several few both couple numerous plenty");
      const AGREES_WITH_NOUN = S("all some most half any lot lots rest remainder majority minority percentage proportion");
      // Predicate adjectives that take "of" ("fond of", "aware of") and
      // read, without a "who is"/"which are" in front of them, exactly like
      // a reduced relative clause ("people fond of animals are kind"). Most
      // adjectives before "of" are already caught by the general adjective
      // check below; this covers the short, common ones — mostly missing a
      // recognisable suffix — that check does not.
      const OF_ADJECTIVES = S("fond aware unaware ashamed devoid worthy deserving ignorant tolerant intolerant wary leery");
      let j = i+1;
      if(DETERMINERS.has(lw(j)) && contig(j-1)) j++;
      let guard = 0;
      while(j < n && guard < 3 && contig(j-1) &&
            (NUMBER_WORDS.has(lw(j)) || isAdjective(lw(j)) || /^[0-9]+$/.test(lw(j)))){ j++; guard++; }
      const head = lw(j);
      if(j < n && contig(j) && sameSentence(i, j) && DICTIONARY.has(head) && isNounish(head)){
        const vb = lw(j+1);
        const toSg = { are:"is", were:"was", have:"has", do:"does", "aren't":"isn't",
                       "weren't":"wasn't", "haven't":"hasn't", "don't":"doesn't" };
        const toPl = { is:"are", was:"were", has:"have", does:"do", "isn't":"aren't",
                       "wasn't":"weren't", "hasn't":"haven't", "doesn't":"don't" };
        let want = null;
        if(q === "number" && lw(i-2) === "the") want = "sg";
        else if(q === "number" && (lw(i-2) === "a" || lw(i-2) === "any")) want = "pl";
        else if(SG_QUANT.has(q) && q !== "none") want = "sg";
        else if(PL_QUANT.has(q)) want = "pl";
        else if(AGREES_WITH_NOUN.has(q)) want = isPluralNoun(head) ? "pl" : "sg";
        // An ordinary noun before "of" fixes its own number the same way a
        // quantifier does — "a string of numbers", "a pile of papers" — it
        // is q, not the noun inside the "of" phrase, that the verb has to
        // agree with. This deliberately does not reuse isNounish(), which
        // rules out anything that merely resembles a verb (a base-verb
        // homograph, or a word like "string"/"thing" that its naive "-ing"
        // check misreads as a participle) — a word directly in front of
        // "of" is always functioning as a noun regardless of what else it
        // might be, since nothing else in English sits immediately before
        // "of" this way. Adjective-plus-"of" idioms ("fond of", "capable
        // of") are excluded so those are not mistaken for the same
        // construction. Collective nouns are left alone, since British
        // usage already allows those to take a plural verb regardless
        // ("the team of experts are ready"), and QUANTIFIER_HEADS is
        // excluded because those words (range, series, variety, set...)
        // are already treated elsewhere as taking their number from what
        // follows, not from themselves.
        else if(DICTIONARY.has(q) && !PRONOUNS.has(q) && !DETERMINERS.has(q) &&
                !PREPOSITIONS.has(q) && !MODALS.has(q) && !BE_FORMS.has(q) &&
                !HAVE_FORMS.has(q) && !DO_FORMS.has(q) && !CONJUNCTIONS.has(q) &&
                !isAdjective(q) && !OF_ADJECTIVES.has(q) && !COLLECTIVE.has(q) && !QUANTIFIER_HEADS.has(q)){
          want = isPluralNoun(q) ? "pl" : "sg";
        }
        if(want === "sg" && toSg[vb] && !UNCOUNTABLE.has(head)){
          add({ cat:"grammar", rule:"quantifier-agree", severity:"critical", ...span(j+1,j+1),
            suggestions:[sub(j+1, toSg[vb])], title:"Subject and verb don't agree",
            why:'The subject here is "'+raw(i-1)+'", not "'+raw(j)+'", so the verb is "'+toSg[vb]+'".' });
        } else if(want === "pl" && toPl[vb]){
          add({ cat:"grammar", rule:"quantifier-agree", severity:"critical", ...span(j+1,j+1),
            suggestions:[sub(j+1, toPl[vb])], title:"Subject and verb don't agree",
            why:'"'+raw(i-1)+' of the '+raw(j)+'" is more than one thing, so the verb is "'+toPl[vb]+'".' });
        }
      }
    }
    const PLURAL_QUANTIFIER = S("few couple number lot handful dozen majority minority variety range host series bunch load pair set");
    if(w === "there" && next && (w1 === "are" || w1 === "were") &&
       (lw(i+2) === "a" || lw(i+2) === "an" || lw(i+2) === "one") && !PLURAL_QUANTIFIER.has(lw(i+3))){
      add({ cat:"grammar", rule:"there-agree", severity:"critical", ...span(i+1,i+1),
        suggestions:[sub(i+1, w1 === "were" ? "was" : "is")], title:'"There" agrees with what follows it',
        why:'"'+raw(i+2)+'" introduces a single thing, so it takes "there '+(w1==="were"?"was":"is")+'".' });
    }
    // determiner + plural noun + is/was  ("the dogs is barking")
    // A noun sitting inside a prepositional phrase is never the subject, so
    // "each of the students has" and "a box of chocolates is" are left alone.
    if(DETERMINERS.has(w) && w !== "this" && w !== "that" && next && !inPrepPhrase(i)){
      const h = headNounAfter(i);
      if(h > 0 && contig(h) && headIsPlural(h) && !UNCOUNTABLE.has(lw(h)) && !S_ENDING_SINGULAR.has(lw(h))){
        const fix = { is:"are", was:"were", has:"have" }[lw(h+1)];
        if(fix){
          add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(h+1,h+1),
            suggestions:[sub(h+1, fix)], title:"Subject and verb don't agree",
            why:'"'+raw(h)+'" is plural, so it takes "'+fix+'".' });
        }
      }
    }
    // compound subject: "the manager and I was", "Tom and she is"
    if(w === "and" && next && contig(i-1) && (isNounish(lw(i-1)) || PRONOUNS.has(lw(i-1)))){
      let j = -1;
      if(PRONOUNS.has(w1) && contig(i+1)) j = i+2;
      else if(DETERMINERS.has(w1) && contig(i+1) && isNounish(w2) && contig(i+2)) j = i+3;
      const fix = { is:"are", was:"were", has:"have", "isn't":"aren't", "wasn't":"weren't" }[lw(j)];
      if(j > 0 && fix && sameSentence(i, j)){
        add({ cat:"grammar", rule:"compound-subject", severity:"critical", ...span(j,j),
          suggestions:[sub(j, fix)], title:"Two subjects joined by \u201cand\u201d are plural",
          why:'"'+text.slice(tokens[i-1].start, tokens[j-1].end)+'" is more than one thing, so the verb is "'+fix+'".' });
      }
    }
    // "Me and the team..." as the subject of a sentence
    if(sentStart(i) && (w === "me" || w === "him" || w === "her" || w === "us" || w === "them") && w1 === "and" && next){
      let j = i+2, guard = 0;
      while(j < n && guard < 4 && !isFiniteVerb(lw(j)) && sameSentence(i,j)){ j++; guard++; }
      if(j > i+2 && j < n){
        const phrase = text.slice(tokens[i+2].start, tokens[j-1].end);
        const subjectForm = { me:"I", him:"he", her:"she", us:"we", them:"they" }[w];
        const rebuilt = phrase.charAt(0).toUpperCase() + phrase.slice(1) + " and " + subjectForm;
        add({ cat:"grammar", rule:"subject-pronoun", severity:"critical",
          start: tokens[i].start, end: tokens[j-1].end,
          original: text.slice(tokens[i].start, tokens[j-1].end),
          suggestions:[rebuilt], title:"Object pronoun used as the subject",
          why:'You would say "'+subjectForm+' '+(subjectForm==="I"?"was":"was")+' working", not "'+w+' was working". The other person is named first by convention.' });
      }
    }
    // singular noun + are/were  ("the dog are barking") — collectives exempt,
    // because British English happily says "the team are winning".
    if(S("the a an this that my our his her their each every one").has(w) && next){
      const h = headNounAfter(i);
      if(h > 0 && contig(h) && !headIsPlural(h) && !UNCOUNTABLE.has(lw(h)) &&
         (lw(h+1) === "are" || lw(h+1) === "were") && lw(h+2) !== "and" &&
         !(h+2 < n && lw(h+2) === "of")){
        const fix = lw(h+1) === "are" ? "is" : "was";
        add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(h+1,h+1),
          suggestions:[sub(h+1, fix)], title:"Subject and verb don't agree",
          why:'"'+raw(h)+'" is singular, so it takes "'+fix+'".' });
      }
    }

    // ---------------------------------------------------------------
    // VERB FORMS
    // ---------------------------------------------------------------
    // modal + inflected verb  ("can goes", "will went", "should going")
    if(MODALS.has(w) && next && w !== "ought"){
      let bad = null, base = null;
      if(looksLikeVerbS(w1)){ bad = "-s form"; base = baseOfThird(w1); }
      else if(IRREG_PAST.has(w1) && !IRREG_PART.has(w1)){ bad = "past tense"; base = baseOfPast(w1); }
      else if(isPastForm(w1) && !isAdjective(w1) && lw(i+2) !== "by"){ bad = "past tense"; base = baseOfPast(w1); }
      if(bad && base && ALL_BASE_VERBS.has(base) && base !== w1){
        add({ cat:"grammar", rule:"modal-base", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, base)], title:"Verb form after a modal",
          why:'After "'+raw(i)+'" the verb stays in its base form, so the '+bad+' "'+raw(i+1)+'" becomes "'+base+'".' });
      }
    }
    // "could of" and friends
    if((MODALS.has(w) || w === "ought") && next && w1 === "of"){
      add({ cat:"grammar", rule:"modal-of", severity:"critical", ...span(i+1,i+1),
        suggestions:[sub(i+1,"have")], title:'"Of" should be "have"',
        why:'This is the contraction "'+w+"'ve"+'" misheard — the word is "have".' });
    }
    // have/has/had (+ an adverb) + past tense where a participle is needed
    if(HAVE_FORMS.has(w) && w !== "having" && next){
      // "have you ever went" — step over a subject pronoun and an adverb or two
      const SKIPPABLE = S("ever never just already always still recently probably certainly really actually only also nearly almost i you he she it we they");
      let k = -1;
      for(let j=i+1; j<=i+3 && j<n && contig(j-1) && sameSentence(i,j); j++){
        if(PAST_TO_PARTICIPLE[lw(j)]){ k = j; break; }
        if(!SKIPPABLE.has(lw(j))) break;
      }
      if(k > 0){
        add({ cat:"grammar", rule:"perfect-participle", severity:"critical", ...span(k,k),
          suggestions:[sub(k, PAST_TO_PARTICIPLE[lw(k)])], title:"Wrong verb form after have/has/had",
          why:'The perfect tense takes the past participle: "'+w+" "+PAST_TO_PARTICIPLE[lw(k)]+'".' });
      }
    }
    // "I seen it", "he done it" — participle with no auxiliary. An adverb
    // or two ("already", "just", "never") commonly sits between the subject
    // and the participle ("it already done"), so this steps past those
    // rather than only checking the token immediately after the subject.
    // The guard before the subject covers both "have/has/had" ("Have I
    // done it?") and "be" ("Is it done?") question inversion, where the
    // participle is correct and the auxiliary has simply moved in front.
    if((PRONOUNS.has(w) && SUBJ_PRON_SG3.has(w) || SUBJ_PRON_PL.has(w) || w === "i") && next &&
       !BE_FORMS.has(lw(i-1)) && !HAVE_FORMS.has(lw(i-1))){
      let k = -1;
      for(let j=i+1; j<=i+3 && j<n && contig(j-1) && sameSentence(i,j); j++){
        if(PARTICIPLE_TO_PAST[lw(j)]){ k = j; break; }
        if(!isAdverb(lw(j))) break;
      }
      if(k > 0){
        add({ cat:"grammar", rule:"bare-participle", severity:"critical", ...span(k,k),
          suggestions:[sub(k, PARTICIPLE_TO_PAST[lw(k)]), "have "+lw(k)], title:"Past participle without an auxiliary",
          why:'"'+raw(k)+'" needs "have" in front of it; on its own the past tense is "'+PARTICIPLE_TO_PAST[lw(k)]+'".' });
      }
    }
    // do/does/did + inflected verb
    if((w === "do" || w === "does" || w === "did" || NEG_CONTRACTIONS.has(w)) && next){
      const isDoAux = DO_FORMS.has(w) || w === "don't" || w === "doesn't" || w === "didn't";
      if(isDoAux){
        let base = null;
        if(looksLikeVerbS(w1)) base = baseOfThird(w1);
        else if(IRREG_PAST.has(w1)) base = baseOfPast(w1);
        if(base && ALL_BASE_VERBS.has(base) && base !== w1){
          add({ cat:"grammar", rule:"do-base", severity:"critical", ...span(i+1,i+1),
            suggestions:[sub(i+1, base)], title:"Verb form after do/does/did",
            why:'"'+raw(i)+'" already carries the tense, so the next verb is the plain "'+base+'".' });
        }
      }
    }
    // "suppose to" / "use to"
    if(w === "suppose" && w1 === "to" && next && BE_FORMS.has(lw(i-1))){
      add({ cat:"grammar", rule:"supposed-to", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"supposed")], title:'The phrase is "supposed to"',
        why:'The -d is silent in speech but it belongs in writing.' });
    }
    if(w === "use" && w1 === "to" && next && (PRONOUNS.has(lw(i-1)) || isNounish(lw(i-1))) &&
       !BE_FORMS.has(lw(i-1)) && !MODALS.has(lw(i-1)) && lw(i-1) !== "to"){
      add({ cat:"grammar", rule:"used-to", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"used")], title:'The phrase is "used to"',
        why:'For a past habit the form is "used to".' });
    }
    // double comparative / superlative
    if((w === "more" || w === "most") && next &&
       ((/er$/.test(w1) && COMMON_ADJECTIVES.has(w1.replace(/ier$/,"y").replace(/er$/,""))) ||
        S("better best worse worst easier easiest bigger biggest older oldest faster fastest happier happiest").has(w1))){
      add({ cat:"grammar", rule:"double-comparative", severity:"critical", ...span(i,i+1),
        suggestions:[raw(i+1)], title:"Doubled comparison",
        why:'"'+raw(i+1)+'" already carries the comparison, so "'+w+'" is one step too many.' });
    }
    // double negative
    if((NEG_CONTRACTIONS.has(w) || w === "not" || w === "never") && sameSentence(i, Math.min(i+3,n-1))){
      for(let j=i+1;j<=i+3 && j<n;j++){
        if(NEGATIVE_WORDS.has(lw(j)) && tokens[j].s === tokens[i].s && lw(j) !== "never"){
          const fix = { no:"any", none:"any", nothing:"anything", nobody:"anybody",
                        nowhere:"anywhere", neither:"either" }[lw(j)];
          if(fix) add({ cat:"grammar", rule:"double-negative", severity:"critical", ...span(j,j),
            suggestions:[sub(j, fix)], title:"Two negatives in one clause",
            why:'"'+raw(i)+'" is already negative, so "'+raw(j)+'" cancels it out. "'+fix+'" is the form you want.' });
          break;
        }
      }
    }
    // "between you and I"
    if(w === "and" && (w1 === "i") && next && PREPOSITIONS.has(lw(i-2)) && raw(i+1) === "I"){
      add({ cat:"grammar", rule:"and-i", severity:"critical", ...span(i+1,i+1),
        suggestions:["me"], title:'"Me" after a preposition',
        why:'After "'+raw(i-2)+'" the object form is "me" — you would say "'+raw(i-2)+' me", not "'+raw(i-2)+' I".' });
    }

    // ---------------------------------------------------------------
    // CONTEXTUAL CONFUSABLES — the real-word errors a spellchecker can't see
    // ---------------------------------------------------------------
    const vbgNext = next && isIngForm(w1);
    const beNext  = next && BE_FORMS.has(w1);

    // their / there / they're
    if(w === "their" && next){
      if(beNext || w1 === "has" || w1 === "have"){
        add({ cat:"grammar", rule:"their-there", severity:"critical", ...span(i,i),
          suggestions:[sub(i, (w1==="is"||w1==="was"||w1==="are"||w1==="were"||w1==="has"||w1==="have") ? "there" : "they're")],
          title:'"Their" shows possession',
          why:'"Their" owns something. Before "'+raw(i+1)+'" you want "there" (a place or a statement) or "they\'re" (they are).' });
      } else if(vbgNext || w1 === "not" || w1 === "going" || w1 === "gonna" || (isAdjective(w1) && !isNounish(w1))){
        add({ cat:"grammar", rule:"their-theyre", severity:"critical", ...span(i,i),
          suggestions:[sub(i,"they're")], title:'"They\'re" is "they are"',
          why:'"'+raw(i+1)+'" needs a subject and verb in front of it, so this is "they\'re".' });
      }
    }
    if(w === "there" && next && isNounish(w1) && !isPluralNoun(w1) === false){ /* handled below */ }
    if(w === "there" && next && isNounish(w1) && !BE_FORMS.has(w1) && !HAVE_FORMS.has(w1) &&
       !PREPOSITIONS.has(lw(i-1)) && lw(i-1) !== "over" && lw(i-1) !== "out" && lw(i-1) !== "up" &&
       lw(i-1) !== "down" && lw(i-1) !== "back" && lw(i-1) !== "right" && lw(i-1) !== "in" &&
       !isThirdPersonVerb(w1) && !isBaseVerb(w1)){
      add({ cat:"grammar", rule:"there-their", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"their")], title:'"Their" shows who owns something',
        why:'"'+raw(i+1)+'" belongs to someone here, so it takes the possessive "their".' });
    }
    if(w === "they're" && next && isNounish(w1) && !isAdjective(w1) && !isIngForm(w1)){
      add({ cat:"grammar", rule:"theyre-their", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"their")], title:'"They\'re" means "they are"',
        why:'Read it back as "they are '+raw(i+1)+'" — if that doesn\'t work, you want "their".' });
    }
    // your / you're
    if(w === "your" && next && (vbgNext || w1 === "not" || w1 === "welcome" || w1 === "right" ||
       w1 === "wrong" || w1 === "sure" || w1 === "very" || w1 === "really" || w1 === "so" ||
       w1 === "too" || w1 === "always" || w1 === "never" || (isAdjective(w1) && !isNounish(w1)))){
      add({ cat:"grammar", rule:"your-youre", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"you're")], title:'"You\'re" is "you are"',
        why:'"Your" owns something; here the sentence needs "you are".' });
    }
    if(w === "your" && next && BE_FORMS.has(w1) && w1 !== "being"){
      add({ cat:"grammar", rule:"your-youre", severity:"critical", ...span(i,i+1),
        suggestions:[sub(i,"you're")], title:'"Your" doesn\'t take a verb',
        why:'"Your '+raw(i+1)+'" doubles up the verb — the contraction "you\'re" already contains "are".' });
    }
    if(w === "you're" && next && isNounish(w1) && !isAdjective(w1) && !isIngForm(w1) && !isAdverb(w1)){
      add({ cat:"grammar", rule:"youre-your", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"your")], title:'"You\'re" means "you are"',
        why:'Read it back as "you are '+raw(i+1)+'" — if that doesn\'t work, the possessive "your" is what you want.' });
    }
    // its / it's
    if(w === "its" && next && (BE_FORMS.has(w1) || vbgNext || w1 === "not" || w1 === "been" ||
        w1 === "a" || w1 === "an" || w1 === "the" || w1 === "just" || w1 === "only" ||
        w1 === "always" || w1 === "never" || w1 === "probably" || w1 === "too" ||
        (isAdjective(w1) && !isNounish(w1)))){
      add({ cat:"grammar", rule:"its-it-is", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"it's")], title:'"It\'s" is "it is"',
        why:'"Its" is possessive, like "his". Here the sentence needs "it is" — so it takes an apostrophe.' });
    }
    if(w === "it's" && next && (w1 === "own" || (isNounish(w1) && contig(i+1) &&
        (BE_FORMS.has(lw(i+2)) || HAVE_FORMS.has(lw(i+2)))))){
      add({ cat:"grammar", rule:"it-is-its", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"its")], title:'"Its" is the possessive',
        why:'Read it back as "it is '+raw(i+1)+'" — that doesn\'t work here, so drop the apostrophe.' });
    }
    // whose / who's
    if(w === "whose" && next && (BE_FORMS.has(w1) || w1 === "been" || vbgNext || w1 === "got")){
      add({ cat:"grammar", rule:"whose-whos", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"who's")], title:'"Who\'s" is "who is"',
        why:'"Whose" asks who owns something; here you need "who is" or "who has".' });
    }
    if(w === "who's" && next && isNounish(w1) && !isAdjective(w1) && !isIngForm(w1)){
      add({ cat:"grammar", rule:"whos-whose", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"whose")], title:'"Whose" asks who owns it',
        why:'"Who\'s" unpacks to "who is", which doesn\'t fit in front of "'+raw(i+1)+'".' });
    }
    // then / than
    const COMPARATIVES = S("more less better worse greater fewer rather other different larger smaller bigger older younger faster slower higher lower cheaper easier harder stronger weaker sooner longer shorter");
    if(w === "then" && (COMPARATIVES.has(lw(i-1)) || (/er$/.test(lw(i-1)) && COMMON_ADJECTIVES.has(lw(i-1).replace(/ier$/,"y").replace(/er$/,""))))){
      add({ cat:"grammar", rule:"then-than", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"than")], title:'Comparisons use "than"',
        why:'"Then" is about time. After "'+raw(i-1)+'" you are comparing, so it takes "than".' });
    }
    if(w === "than" && (sentStart(i) || lw(i-1) === "and" || lw(i-1) === "but" || lw(i-1) === "so") &&
       next && (PRONOUNS.has(w1) || DETERMINERS.has(w1) || isBaseVerb(w1))){
      add({ cat:"grammar", rule:"than-then", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"then")], title:'Sequence uses "then"',
        why:'Nothing is being compared here — this is "and then", about what happens next.' });
    }
    // to / too / two
    if(w === "to" && next && (COMMON_ADJECTIVES.has(w1) || w1 === "much" || w1 === "many" ||
        w1 === "often" || w1 === "late" || w1 === "early" || w1 === "soon") &&
        !isBaseVerb(w1) && lw(i-1) !== "want" && lw(i-1) !== "need" && lw(i-1) !== "go" &&
        !isNounish(w1) && lw(i+2) !== "of"){
      add({ cat:"grammar", rule:"to-too", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"too")], title:'"Too" means excessively',
        why:'In front of "'+raw(i+1)+'" you want "too" — as in "too '+w1+'".' });
    }
    if(w === "too" && next && (isBaseVerb(w1) && !isNounish(w1) && !COMMON_ADJECTIVES.has(w1))){
      add({ cat:"grammar", rule:"too-to", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"to")], title:'Infinitives take "to"',
        why:'"To '+w1+'" is the infinitive; "too" means "excessively" or "also".' });
    }
    if(w === "two" && next && (isBaseVerb(w1) && !isNounish(w1) && !isPluralNoun(w1))){
      add({ cat:"grammar", rule:"two-to", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"to"), sub(i,"too")], title:'"Two" is the number',
        why:'The number doesn\'t fit here — you want "to" or "too".' });
    }
    // lose / loose
    if(w === "loose" && (MODALS.has(lw(i-1)) || lw(i-1) === "to" || NEG_CONTRACTIONS.has(lw(i-1)) ||
        lw(i-1) === "not" || lw(i-1) === "gonna" || (lw(i-1) === "going" && lw(i-2) === "to"))){
      add({ cat:"grammar", rule:"loose-lose", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"lose")], title:'"Lose" is the verb',
        why:'"Loose" is the opposite of tight. Mislaying something is "lose", with one o-sound.' });
    }
    if(w === "loosing" && next){
      add({ cat:"grammar", rule:"loose-lose", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"losing")], title:'"Losing" has one o',
        why:'"Loosing" means setting something free — almost always "losing" is meant.' });
    }
    // affect / effect
    if(w === "affect" && (DETERMINERS.has(lw(i-1)) || lw(i-1) === "side" || lw(i-1) === "little" ||
        lw(i-1) === "big" || lw(i-1) === "positive" || lw(i-1) === "negative" || lw(i-1) === "adverse")){
      add({ cat:"grammar", rule:"affect-effect", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"effect")], title:'"Effect" is the noun',
        why:'After "'+raw(i-1)+'" you need a noun — the result is an "effect". "Affect" is the verb.' });
    }
    if((w === "effect" || w === "effects") && (MODALS.has(lw(i-1)) || lw(i-1) === "to" ||
        lw(i-1) === "not" || lw(i-1) === "directly" || lw(i-1) === "negatively" || lw(i-1) === "really" ||
        NEG_CONTRACTIONS.has(lw(i-1))) && next && (DETERMINERS.has(w1) || PRONOUNS.has(w1) || isNounish(w1))){
      add({ cat:"grammar", rule:"effect-affect", severity:"critical", ...span(i,i),
        suggestions:[sub(i, w === "effect" ? "affect" : "affects")], title:'"Affect" is the verb',
        why:'Here the word is doing something to "'+raw(i+1)+'", which calls for the verb "affect".' });
    }
    // were / we're / where
    if(w === "where" && next && (vbgNext || (BE_FORMS.has(w1) === false && isPastForm(w1))) &&
       (PRONOUNS.has(lw(i-1)) || isPluralNoun(lw(i-1)))){
      add({ cat:"grammar", rule:"where-were", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"were")], title:'"Were" is the verb',
        why:'"Where" asks about a place. Here the sentence needs the past tense of "be".' });
    }
    if(w === "we're" && next && isNounish(w1) && !isAdjective(w1) && !isIngForm(w1)){
      add({ cat:"grammar", rule:"were-we-are", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"were"), sub(i,"where")], title:'"We\'re" means "we are"',
        why:'Read it back as "we are '+raw(i+1)+'" — if that doesn\'t work, you want "were" or "where".' });
    }
    // accept / except, weather / whether, quiet / quite
    const verbBefore = (() => {
      if(i < 1) return false;
      const sent = sentences[tokens[i].s];
      for(let k = sent.tokStart; k < i; k++) if(isFiniteVerb(lw(k))) return true;
      return false;
    });
    if(w === "accept" && verbBefore() &&
       (lw(i-1) === "everyone" || lw(i-1) === "everything" || lw(i-1) === "all" || lw(i-1) === "anyone")){
      add({ cat:"grammar", rule:"accept-except", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"except")], title:'"Except" means "apart from"',
        why:'"Accept" means to receive something; here you are leaving something out.' });
    }
    if(w === "weather" && next && (w1 === "or" && lw(i+2) === "not")){
      add({ cat:"grammar", rule:"weather-whether", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"whether")], title:'"Whether or not"',
        why:'"Weather" is rain and sun; the conjunction is "whether".' });
    }
    if(w === "quite" && next && (w1 === "down" || w1 === "please" || w1 === "room" || w1 === "place")){
      add({ cat:"grammar", rule:"quite-quiet", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"quiet")], title:'"Quiet" means without noise',
        why:'"Quite" is a degree word, as in "quite good".' });
    }
    // missing apostrophe in real-word contractions
    if(w === "cant" && next && (isBaseVerb(w1) || w1 === "be" || w1 === "have")){
      add({ cat:"punctuation", rule:"apostrophe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"can't")], title:"Missing apostrophe",
        why:'"Cant" is insincere talk. The contraction of "cannot" needs its apostrophe.' });
    }
    if(w === "wont" && next && (isBaseVerb(w1) || w1 === "be" || w1 === "have")){
      add({ cat:"punctuation", rule:"apostrophe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"won't")], title:"Missing apostrophe",
        why:'"Wont" means a habit. The contraction of "will not" is "won\'t".' });
    }
    if((w === "ill" || w === "id") && sentStart(i) && next && isBaseVerb(w1) && !isNounish(w1)){
      add({ cat:"punctuation", rule:"apostrophe", severity:"critical", ...span(i,i),
        suggestions:[w === "ill" ? "I'll" : "I'd"], title:"Missing apostrophe",
        why:'This reads as the contraction of "I '+(w === "ill" ? "will" : "would")+'".' });
    }
    if((w === "hell" || w === "shell") && next && isBaseVerb(w1) && !isNounish(w1)){
      add({ cat:"punctuation", rule:"apostrophe", severity:"critical", ...span(i,i),
        suggestions:[sub(i, w === "hell" ? "he'll" : "she'll")], title:"Missing apostrophe",
        why:'In front of "'+raw(i+1)+'" this is the contraction "'+(w === "hell" ? "he'll" : "she'll")+'".' });
    }
    if(w === "lets" && next && isBaseVerb(w1) && !isNounish(w1) && sentStart(i)){
      add({ cat:"punctuation", rule:"apostrophe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"let's")], title:"Missing apostrophe",
        why:'A suggestion to do something together is "let us" — "let\'s".' });
    }

    // ---------------------------------------------------------------
    // CAPITALISATION
    // ---------------------------------------------------------------
    const abbrevDot = (text[tokens[i].end] === "." && raw(i).length === 1);
    if((raw(i) === "i" && !abbrevDot) || /^i['\u2019](m|ve|ll|d)$/.test(raw(i))){
      add({ cat:"punctuation", rule:"capital-i", severity:"critical", ...span(i,i),
        suggestions:[raw(i)[0].toUpperCase() + raw(i).slice(1)], title:'"I" is always capitalised',
        why:'The first-person pronoun takes a capital letter wherever it appears.' });
    }
    if(sentStart(i) && /^[a-z]/.test(raw(i)) && raw(i).length > 1 && tokens[i].s < 9999){
      const sent = sentences[tokens[i].s];
      if(sent && sent.tokEnd - sent.tokStart >= 2){
        add({ cat:"punctuation", rule:"sentence-capital", severity:"critical", ...span(i,i),
          suggestions:[raw(i)[0].toUpperCase() + raw(i).slice(1)], title:"Sentence should start with a capital",
          why:'The first word of a sentence is capitalised.' });
      }
    }
    if(PROPER_NOUNS_LOWER.has(w) && /^[a-z]/.test(raw(i))){
      add({ cat:"punctuation", rule:"proper-noun", severity:"critical", ...span(i,i),
        suggestions:[raw(i)[0].toUpperCase() + raw(i).slice(1)], title:"Proper noun needs a capital",
        why:'Days, months, places and nationalities are capitalised in English.' });
    }

    // ---------------------------------------------------------------
    // STYLE
    // ---------------------------------------------------------------
    // passive voice
    if(BE_FORMS.has(w) && next && !ADJECTIVAL_PARTICIPLES.has(w1) &&
       (IRREG_PART.has(w1) || (isPastForm(w1) && !isAdjective(w1))) && w1 !== "used"){
      const byAgent = lw(i+2) === "by";
      add({ cat:"style", rule:"passive", severity:"advisory", ...span(i,i+1),
        suggestions:[], title:"Passive voice",
        why: byAgent
          ? 'Naming the doer first — "'+raw(i+2)+'..." — usually reads more directly.'
          : 'The sentence hides who is doing this. Active voice is often shorter and clearer.' });
    }
    // ---------------------------------------------------------------
    // REFLEXIVE PRONOUN MISUSE
    // ---------------------------------------------------------------
    // "Please contact myself" — a reflexive needs its antecedent in the
    // same clause ("I hurt myself"). Used as a stand-in for "me" or "I",
    // with no such antecedent nearby, it's a common over-formal error.
    const REFLEXIVE = { myself:"me", himself:"him", herself:"her", ourselves:"us", themselves:"them" };
    const FIRST_ANTECEDENT = { myself:"i", ourselves:"we" };
    if(REFLEXIVE[w] && i > 0 && contig(i-1) &&
       (PREPOSITIONS.has(lw(i-1)) || CONJUNCTIONS.has(lw(i-1)) || lw(i-1) === "and" ||
        isFiniteVerb(lw(i-1)))){
      let hasAntecedent = false;
      for(let k=Math.max(0,i-8); k<i; k++){
        if(!sameSentence(k, i)) continue;
        const need = FIRST_ANTECEDENT[w];
        if(need && lw(k) === need){ hasAntecedent = true; break; }
        if(!need && PRONOUNS.has(lw(k))){ hasAntecedent = true; break; }
      }
      if(!hasAntecedent){
        add({ cat:"grammar", rule:"reflexive", severity:"critical", ...span(i,i),
          suggestions:[sub(i, REFLEXIVE[w])], title:'"'+REFLEXIVE[w]+'" is plainer here',
          why:'A reflexive pronoun needs its match earlier in the same sentence ("I hurt myself"). Without one, "'+REFLEXIVE[w]+'" is what\u2019s meant.' });
      }
    }

    // ---------------------------------------------------------------
    // OBJECT PRONOUN AS SUBJECT / SUBJECT PRONOUN AS OBJECT
    // ---------------------------------------------------------------
    // "Give it to John and I" — after a preposition, both halves of a
    // compound take the object form.
    const SUBJ_TO_OBJ = { i:"me", he:"him", she:"her", we:"us", they:"them" };
    if(PREPOSITIONS.has(w) && next && w1 && DICTIONARY.has(w1) && !PRONOUNS.has(w1) &&
       lw(i+2) === "and" && contig(i+1) && contig(i+2) && SUBJ_TO_OBJ[lw(i+3)] && contig(i+3)){
      add({ cat:"grammar", rule:"pronoun-case", severity:"critical", ...span(i+3,i+3),
        suggestions:[sub(i+3, SUBJ_TO_OBJ[lw(i+3)])], title:"Object pronoun after a preposition",
        why:'"'+raw(i)+'" governs both halves, so the pronoun takes the object form: "'+SUBJ_TO_OBJ[lw(i+3)]+'".' });
    }

    // ---------------------------------------------------------------
    // EITHER/OR, NEITHER/NOR AGREEMENT
    // ---------------------------------------------------------------
    // The verb agrees with whichever noun is closer to it — the classic
    // rule is "proximity agreement", so "either the boss or the staff
    // are" is correct, and "either the staff or the boss is" is too.
    // "X or Y <verb>" / "X nor Y <verb>" — Y (immediately before the verb)
    // decides number.
    if((w === "either" || w === "neither") && next){
      const linker = w === "either" ? "or" : "nor";
      let j = i+1, orIdx = -1, guard = 0;
      while(j < n && guard < 10 && sameSentence(i,j)){
        if(lw(j) === linker){ orIdx = j; break; }
        j++; guard++;
      }
      if(orIdx > 0){
        let k = orIdx+1, guard2 = 0;
        while(k < n && guard2 < 3 && contig(k-1) && (DETERMINERS.has(lw(k)) || isAdjective(lw(k)))){ k++; guard2++; }
        const head = lw(k);
        const looksLikeName = /^[A-Z]/.test(raw(k)) && k > 0;
        if(k < n && sameSentence(i,k) && (looksLikeName || (DICTIONARY.has(head) && isNounish(head))) && !COLLECTIVE.has(head)){
          const vb = lw(k+1);
          const plural = !looksLikeName && isPluralNoun(head) && !UNCOUNTABLE.has(head);
          const toSg = { are:"is", were:"was", have:"has" };
          const toPl = { is:"are", was:"were", has:"have" };
          if(!plural && toSg[vb] && contig(k)){
            add({ cat:"grammar", rule:"either-or-agree", severity:"critical", ...span(k+1,k+1),
              suggestions:[sub(k+1, toSg[vb])], title:"Subject and verb don't agree",
              why:'With "'+w+' \u2026 '+linker+'", the verb agrees with the nearer noun, "'+raw(k)+'", which is singular.' });
          } else if(plural && toPl[vb] && contig(k)){
            add({ cat:"grammar", rule:"either-or-agree", severity:"critical", ...span(k+1,k+1),
              suggestions:[sub(k+1, toPl[vb])], title:"Subject and verb don't agree",
              why:'With "'+w+' \u2026 '+linker+'", the verb agrees with the nearer noun, "'+raw(k)+'", which is plural.' });
          }
        }
      }
    }

    // ---------------------------------------------------------------
    // WHO / WHOM
    // ---------------------------------------------------------------
    // Immediately after a preposition, the object form "whom" is required
    // ("to whom", "for whom", "with whom") — one of the few places the
    // whom/who distinction is still consistently observed.
    if(w === "who" && i > 0 && contig(i-1) && PREPOSITIONS.has(lw(i-1)) && sameSentence(i-1,i)){
      add({ cat:"grammar", rule:"who-whom", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"whom")], title:'"Whom" after a preposition',
        why:'A preposition takes the object form, so "'+raw(i-1)+' '+raw(i)+'" becomes "'+raw(i-1)+' whom".' });
    }
    // "whom" used as the subject of a following verb ("whom is calling")
    if(w === "whom" && next && (BE_FORMS.has(w1) || isThirdPersonVerb(w1) || isBaseVerb(w1)) &&
       !(i>0 && PREPOSITIONS.has(lw(i-1)) && contig(i-1))){
      add({ cat:"grammar", rule:"who-whom", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"who")], title:'"Who" is the subject form',
        why:'Here this word is the subject of "'+raw(i+1)+'", so it takes the subject form "who".' });
    }

    // ---------------------------------------------------------------
    // MORE CONTEXT-DEPENDENT CONFUSABLES
    // ---------------------------------------------------------------
    const SWEET_CONTEXT = S("food menu course spoon wine chocolate pudding cake ice cream sweet meal cream tart trolley");
    const ARID_CONTEXT = S("sun sand storm island dry arid dunes camel oasis nomad heat");
    if(w === "desert" && nearbyAny(i, SWEET_CONTEXT, 4)){
      add({ cat:"grammar", rule:"desert-dessert", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"dessert")], title:'"Dessert" is the sweet course',
        why:'The sweet course after a meal is spelled "dessert", with two s\u2019s. A "desert" is the dry, sandy kind.' });
    }
    if(w === "dessert" && nearbyAny(i, ARID_CONTEXT, 4)){
      add({ cat:"grammar", rule:"desert-dessert", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"desert")], title:'"Desert" is the arid place',
        why:'A dry, sandy expanse is a "desert", with one s. "Dessert" is the sweet course.' });
    }
    if(w === "envelop" && i > 0 && contig(i-1) && DETERMINERS.has(lw(i-1))){
      add({ cat:"grammar", rule:"envelop-envelope", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"envelope")], title:'"Envelope" is the noun',
        why:'The paper wrapper for a letter is an "envelope", with a final e. "Envelop" (no e) is a verb meaning to surround.' });
    }
    if(w === "envelope" && i > 0 && contig(i-1) && MODALS.has(lw(i-1))){
      add({ cat:"grammar", rule:"envelop-envelope", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"envelop")], title:'"Envelop" is the verb',
        why:'To surround something is to "envelop" it, with no final e. "Envelope" is the paper wrapper.' });
    }
    if(w === "breath" && i > 0 && contig(i-1) &&
       (MODALS.has(lw(i-1)) || lw(i-1) === "to" || lw(i-1) === "please" || lw(i-1) === "just")){
      add({ cat:"grammar", rule:"breath-breathe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"breathe")], title:'"Breathe" is the verb',
        why:'The action is "breathe", with a final e and a soft th. "Breath" is the noun, the air itself.' });
    }
    if(w === "loath" && i > 0 && contig(i-1) && PRONOUNS.has(lw(i-1)) && !next){
      add({ cat:"grammar", rule:"loath-loathe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"loathe")], title:'"Loathe" is the verb',
        why:'To detest something is to "loathe" it, with a final e. "Loath" (no e) means reluctant.' });
    }
    if(w === "loath" && next && w1 && !MODALS.has(lw(i-1)) && lw(i-1) !== "am" && lw(i-1) !== "is" &&
       lw(i-1) !== "are" && lw(i-1) !== "was" && lw(i-1) !== "were" && w1 !== "to" &&
       (PRONOUNS.has(w1) || DETERMINERS.has(w1) || isIngForm(w1) || (isNounish(w1) && !isAdjective(w1)))){
      add({ cat:"grammar", rule:"loath-loathe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"loathe")], title:'"Loathe" is the verb',
        why:'To detest something is to "loathe" it, with a final e. "Loath" (no e) means reluctant, as in "loath to admit it".' });
    }
    if(w === "que" && next){
      add({ cat:"spelling", rule:"queue", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"queue")], title:'"Queue" is the spelling',
        why:'A waiting line is spelled "queue".' });
    }
    if(w === "waiver" && i > 0 && contig(i-1) && MODALS.has(lw(i-1))){
      add({ cat:"grammar", rule:"waive-waiver", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"waive")], title:'"Waive" is the verb',
        why:'To give something up is to "waive" it. A "waiver" is the document or the noun form.' });
    }
    if(w === "waive" && i > 0 && contig(i-1) && DETERMINERS.has(lw(i-1))){
      add({ cat:"grammar", rule:"waive-waiver", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"waiver")], title:'"Waiver" is the noun',
        why:'The document that gives something up is a "waiver". "Waive" is the verb.' });
    }
    const ADAPT_CONTEXT = S("book novel film movie screenplay play story");
    if(w === "adopt" && next){
      const j2 = DETERMINERS.has(w1) && contig(i+1) ? i+2 : i+1;
      if(contig(j2-1) && sameSentence(i,j2) && ADAPT_CONTEXT.has(lw(j2))){
        add({ cat:"grammar", rule:"adopt-adapt", severity:"critical", ...span(i,i),
          suggestions:[sub(i,"adapt")], title:'"Adapt" is to rework',
          why:'Turning a "'+raw(j2)+'" into something else is to "adapt" it. "Adopt" means to take on as your own.' });
      }
    }
    const ADOPT_CONTEXT = S("child puppy kitten pet orphan dog cat baby");
    if(w === "adapt" && next){
      const j2 = DETERMINERS.has(w1) && contig(i+1) ? i+2 : i+1;
      if(contig(j2-1) && sameSentence(i,j2) && ADOPT_CONTEXT.has(lw(j2))){
        add({ cat:"grammar", rule:"adopt-adapt", severity:"critical", ...span(i,i),
          suggestions:[sub(i,"adopt")], title:'"Adopt" is to take on',
          why:'Taking on a "'+raw(j2)+'" as your own is to "adopt" it. "Adapt" means to adjust or rework.' });
      }
    }

    // hedges and intensifiers
    if(HEDGES.has(w) && next && (isAdjective(w1) || isAdverb(w1) || isBaseVerb(w1))){
      add({ cat:"style", rule:"hedge", severity:"advisory", ...span(i,i),
        suggestions:[], title:'"'+raw(i)+'" adds little',
        why:'Intensifiers like this dilute the word they modify. Cutting it, or choosing a stronger "'+raw(i+1)+'", is usually tighter.' });
    }

    // ---------------------------------------------------------------
    // BRITISH NOUN / VERB SPELLING PAIRS
    // ---------------------------------------------------------------
    // British English splits several words the Americans spell one way:
    // the -ce form is the noun, the -se form the verb. "A licence" but
    // "to license"; "some advice" but "to advise". Neither form is a
    // misspelling on its own, so only the position in the sentence tells
    // you which one is wrong — a plain dictionary can never catch these.
    const NOUN_FORM = { practise:"practice", license:"licence", advise:"advice",
                        prophesy:"prophecy", devise:"device" };
    const VERB_FORM = { practice:"practise", licence:"license", advice:"advise",
                        prophecy:"prophesy", device:"devise" };
    const POSSESS = S("my our your his her its their whose");
    // A following object ("they license their software") means it is a verb
    // after all, whatever sits in front of it.
    const takesObject = next && (DETERMINERS.has(w1) || PRONOUNS.has(w1) || POSSESS.has(w1));
    if(NOUN_FORM[w] && i > 0 && contig(i-1) && !takesObject &&
       (DETERMINERS.has(lw(i-1)) || POSSESS.has(lw(i-1)) || isAdjective(lw(i-1)) || isIngForm(lw(i-1)))){
      add({ cat:"grammar", rule:"ce-se", severity:"critical", ...span(i,i),
        suggestions:[sub(i, NOUN_FORM[w])], title:'"'+NOUN_FORM[w]+'" is the noun',
        why:'After "'+raw(i-1)+'" this is a noun, and the noun is spelled "'+NOUN_FORM[w]+'" with a c. The -se form is the verb.' });
    }
    const INF_TRIGGER = S("to want wants wanted need needs needed try tries tried going like likes liked decide decides decided plan plans planned hope hopes hoped intend intends intended choose chose refuse refuses refused agree agrees agreed learn learns learned manage manages managed continue continues continued");
    if(VERB_FORM[w] && i > 0 && contig(i-1) &&
       (MODALS.has(lw(i-1)) || (lw(i-1) === "to" && INF_TRIGGER.has(lw(i-2))))){
      add({ cat:"grammar", rule:"ce-se", severity:"critical", ...span(i,i),
        suggestions:[sub(i, VERB_FORM[w])], title:'"'+VERB_FORM[w]+'" is the verb',
        why:'After "'+raw(i-1)+'" this is a verb, and the verb is spelled "'+VERB_FORM[w]+'" with an s. The -ce form is the noun.' });
    }

    // ---------------------------------------------------------------
    // CONTEXT-DEPENDENT CONFUSABLES
    // ---------------------------------------------------------------
    // Both spellings are real words, so the only evidence is the company
    // they keep. Each pair below is triggered by a neighbour that settles
    // which sense was meant.
    if(w === "principle" && next && isNounish(w1) && !isPluralNoun(w1) &&
       i > 0 && (DETERMINERS.has(lw(i-1)) || POSSESS.has(lw(i-1)))){
      add({ cat:"grammar", rule:"principal-principle", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"principal")], title:'"Principal" is the adjective',
        why:'Describing "'+raw(i+1)+'" as the main one takes "principal". A "principle" is a rule or belief.' });
    }
    if(w === "principal" && (lw(i-1) === "on" || lw(i-1) === "in") && contig(i-1)){
      add({ cat:"grammar", rule:"principal-principle", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"principle")], title:'"On principle" takes the noun',
        why:'Acting "on principle" means acting on a belief, which is the -ple spelling.' });
    }
    const BUY_VERBS = S("buy buys bought order orders ordered purchase purchases purchased stock stocks stocked supply supplies supplied office");
    if(w === "stationary" && i > 0 && contig(i-1) && BUY_VERBS.has(lw(i-1))){
      add({ cat:"grammar", rule:"stationary-stationery", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"stationery")], title:'"Stationery" is the paper',
        why:'Pens and paper are "stationery" with an e. "Stationary" means not moving.' });
    }
    const STILL_VERBS = S("remained remain remains stayed stay stays kept keep keeps was were is are stood standing");
    if(w === "stationery" && i > 0 && contig(i-1) && STILL_VERBS.has(lw(i-1))){
      add({ cat:"grammar", rule:"stationary-stationery", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"stationary")], title:'"Stationary" means not moving',
        why:'Standing still is "stationary" with an a. "Stationery" is pens and paper.' });
    }
    const PRAISE_VERBS = S("pay pays paid give gives gave receive receives received return returns returned");
    // "paid her a compliment" — the verb can sit a couple of words back
    const praiseNearby = [1,2,3].some(k => i-k >= 0 && PRAISE_VERBS.has(lw(i-k)) && sameSentence(i-k, i));
    if(w === "complement" && praiseNearby){
      add({ cat:"grammar", rule:"complement-compliment", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"compliment")], title:'"Compliment" is the praise',
        why:'Praise you pay someone is a "compliment" with an i. A "complement" completes something.' });
    }
    if(w === "discrete" && w1 === "about" && next){
      add({ cat:"grammar", rule:"discreet-discrete", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"discreet")], title:'"Discreet" means tactful',
        why:'Being careful about what you say is "discreet". "Discrete" means separate.' });
    }
    const SEPARATE_NOUNS = S("units unit steps step parts part categories category values value items item chunks packets stages blocks components");
    if(w === "discreet" && next && SEPARATE_NOUNS.has(w1)){
      add({ cat:"grammar", rule:"discreet-discrete", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"discrete")], title:'"Discrete" means separate',
        why:'Separate, countable "'+raw(i+1)+'" are "discrete". "Discreet" means tactful.' });
    }
    if(w === "lead" && i > 0 && contig(i-1) &&
       (HAVE_FORMS.has(lw(i-1)) || lw(i-1) === "was" || lw(i-1) === "were" || lw(i-1) === "been")){
      add({ cat:"grammar", rule:"lead-led", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"led")], title:'The past tense is "led"',
        why:'After "'+raw(i-1)+'" you need the past form, which is "led". "Lead" is either the present tense or the metal.' });
    }
    if(w === "past" && i > 0 && contig(i-1) && HAVE_FORMS.has(lw(i-1))){
      add({ cat:"grammar", rule:"past-passed", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"passed")], title:'"Passed" is the verb',
        why:'After "'+raw(i-1)+'" this is a verb, so it is "passed". "Past" is the noun or preposition.' });
    }
    if(w === "past" && w1 === "away" && next){
      add({ cat:"grammar", rule:"past-passed", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"passed")], title:'"Passed away"',
        why:'The verb in this phrase is "passed".' });
    }
    const LEGAL = S("legal wise sound seek seeks sought seeking offer offers offered independent expert");
    if(w === "council" && i > 0 && contig(i-1) && LEGAL.has(lw(i-1))){
      add({ cat:"grammar", rule:"council-counsel", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"counsel")], title:'"Counsel" is advice',
        why:'Advice, or a barrister, is "counsel". A "council" is a body of people.' });
    }
    const CIVIC = S("city town county local borough parish district village county");
    if(w === "counsel" && i > 0 && contig(i-1) && CIVIC.has(lw(i-1))){
      add({ cat:"grammar", rule:"council-counsel", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"council")], title:'"Council" is the body',
        why:'A local authority is a "council". "Counsel" is advice, or a barrister.' });
    }
    if(w === "illicit" && next && (DETERMINERS.has(w1) || PRONOUNS.has(w1))){
      add({ cat:"grammar", rule:"elicit-illicit", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"elicit")], title:'"Elicit" is the verb',
        why:'Drawing something out of someone is to "elicit" it. "Illicit" means illegal.' });
    }
    if(w === "elicit" && next && isNounish(w1) && i > 0 && DETERMINERS.has(lw(i-1))){
      add({ cat:"grammar", rule:"elicit-illicit", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"illicit")], title:'"Illicit" is the adjective',
        why:'Describing "'+raw(i+1)+'" as unlawful takes "illicit". "Elicit" is a verb.' });
    }
    if(w === "allusion" && i > 0 && contig(i-1) && (lw(i-1) === "optical" || lw(i-1) === "visual")){
      add({ cat:"grammar", rule:"allusion-illusion", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"illusion")], title:'"Illusion" is the trick of the eye',
        why:'Something that deceives the eye is an "illusion". An "allusion" is an indirect reference.' });
    }
    const MORE_NOUNS = S("information details notice questions research discussion work study reading notes comment enquiries");
    if(w === "farther" && next && MORE_NOUNS.has(w1)){
      add({ cat:"grammar", rule:"farther-further", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"further")], title:'"Further" for anything but distance',
        why:'"Farther" is for physical distance. Additional "'+raw(i+1)+'" takes "further".' });
    }
    // lay / lie — "lay" needs an object, "lie" does not
    if(w === "lay" && next && (w1 === "down" || w1 === "in" || w1 === "on") && i > 0 && contig(i-1) &&
       (lw(i-1) === "to" || MODALS.has(lw(i-1)) || lw(i-1) === "wanna" || lw(i-1) === "gonna")){
      add({ cat:"grammar", rule:"lay-lie", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"lie")], title:'"Lie" takes no object',
        why:'You lay something down, but you lie down yourself. Without an object it is "lie".' });
    }
    if(w === "laying" && next && (w1 === "down" || w1 === "in" || w1 === "on")){
      add({ cat:"grammar", rule:"lay-lie", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"lying")], title:'"Lying" takes no object',
        why:'You lay something down, but you lie down yourself — so the -ing form here is "lying".' });
    }

    // ---------------------------------------------------------------
    // ONE WORD OR TWO
    // ---------------------------------------------------------------
    // "everyday" is an adjective; the adverb is two words.
    if(w === "everyday" && (!next || !isNounish(w1) || isFiniteVerb(w1))){
      add({ cat:"grammar", rule:"everyday", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"every day")], title:'"Every day" is two words here',
        why:'"Everyday" is an adjective, as in "everyday clothes". Meaning "each day", it splits into two words.' });
    }
    // "maybe" is an adverb; "may be" is a verb
    const MAY_BE_NEXT = S("able possible worth better best wise necessary useful helpful available required needed");
    if(w === "maybe" && next && (MAY_BE_NEXT.has(w1) || isPastForm(w1) || isIngForm(w1)) &&
       i > 0 && contig(i-1) && (PRONOUNS.has(lw(i-1)) || isNounish(lw(i-1)))){
      add({ cat:"grammar", rule:"maybe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"may be")], title:'"May be" is the verb',
        why:'Here this is the verb "be" after "may", so it is two words. "Maybe" means "perhaps".' });
    }

    // ---------------------------------------------------------------
    // APOSTROPHES
    // ---------------------------------------------------------------
    // The greengrocer's apostrophe: a plural written with 's.
    const COUNTING = S("two three four five six seven eight nine ten several many few both dozens hundreds thousands various numerous all some most these those");
    if(/^[a-z]+'s$/.test(w) && i > 0 && contig(i-1) &&
       (COUNTING.has(lw(i-1)) || /^[0-9]+$/.test(text.slice(tokens[i-1].start, tokens[i-1].end)))){
      const base = w.slice(0,-2);
      if(DICTIONARY.has(base) && !(next && isNounish(w1) && !isFiniteVerb(w1))){
        add({ cat:"punctuation", rule:"greengrocer", severity:"critical", ...span(i,i),
          suggestions:[sub(i, pluralise(base))], title:"Plurals take no apostrophe",
          why:'After "'+raw(i-1)+'" this is simply a plural, and plurals are formed with -s alone.' });
      }
    }

    // ---------------------------------------------------------------
    // "THERE'S" WITH A PLURAL
    // ---------------------------------------------------------------
    if((w === "there's" || w === "here's") && next){
      let j = i+1, guard = 0;
      while(j < n && guard < 3 && contig(j-1) && (isAdjective(lw(j)) || NUMBER_WORDS.has(lw(j)))){ j++; guard++; }
      const head = lw(j);
      const plural = S("lots loads plenty many several dozens hundreds thousands millions");
      if(j < n && sameSentence(i,j) &&
         (plural.has(lw(i+1)) || (isPluralNoun(head) && isNounish(head) && !UNCOUNTABLE.has(singularise(head))))){
        add({ cat:"grammar", rule:"there-agree", severity:"critical", ...span(i,i),
          suggestions:[sub(i, w === "there's" ? "there are" : "here are")], title:'"There\u2019s" is singular',
          why:'What follows is plural, so this needs the plural form.' });
      }
    }

    // ---------------------------------------------------------------
    // PRONOUN CASE AFTER A PREPOSITION
    // ---------------------------------------------------------------
    // "between you and I" — the preposition governs both pronouns, so the
    // second one takes the object form too.
    if(PREPOSITIONS.has(w) && next && w1 === "you" && lw(i+2) === "and" && contig(i+1) && contig(i+2)){
      const objForm = { i:"me", he:"him", she:"her", we:"us", they:"them" }[lw(i+3)];
      if(objForm){
        add({ cat:"grammar", rule:"pronoun-case", severity:"critical", ...span(i+3,i+3),
          suggestions:[sub(i+3, objForm)], title:"Object pronoun after a preposition",
          why:'"'+raw(i)+'" governs both pronouns. You would say "'+raw(i)+' '+objForm+'", so it is "'+raw(i)+' you and '+objForm+'".' });
      }
    }

    // ---------------------------------------------------------------
    // "ONE OF THE" TAKES A PLURAL
    // ---------------------------------------------------------------
    if(w === "one" && w1 === "of" && next && contig(i+1)){
      let j = i+2;
      if(DETERMINERS.has(lw(j)) && contig(j-1)) j++;
      let guard = 0;
      while(j < n && guard < 3 && contig(j-1) && (isAdjective(lw(j)) || NUMBER_WORDS.has(lw(j)))){ j++; guard++; }
      const h = lw(j);
      if(j < n && sameSentence(i,j) && isNounish(h) && !isPluralNoun(h) && !UNCOUNTABLE.has(h) &&
         !COLLECTIVE.has(h) && !S_ENDING_SINGULAR.has(h) && !INVARIANT_PLURALS.has(h) &&
         DICTIONARY.has(pluralise(h))){
        add({ cat:"grammar", rule:"one-of-plural", severity:"critical", ...span(j,j),
          suggestions:[sub(j, pluralise(h))], title:'"One of" takes a plural',
          why:'"One of" picks a single item out of a group, so the group is plural: "one of the '+pluralise(h)+'".' });
      }
    }

    // ---------------------------------------------------------------
    // DOUBLE SUPERLATIVE
    // ---------------------------------------------------------------
    if((w === "most" || w === "more") && next && /(est)$/.test(w1) && DICTIONARY.has(w1) &&
       isAdjective(w1.replace(/est$/,"")) ){
      add({ cat:"grammar", rule:"double-superlative", severity:"critical", ...span(i,i+1),
        suggestions:[raw(i+1)], title:"Doubled comparison",
        why:'"'+raw(i+1)+'" is already the -est form, so it does not also need "'+raw(i)+'".' });
    }

    // ---------------------------------------------------------------
    // COMMA AFTER A SENTENCE-OPENING CONNECTIVE
    // ---------------------------------------------------------------
    const CONNECTIVE = S("however therefore moreover furthermore nevertheless nonetheless consequently meanwhile otherwise accordingly conversely alternatively additionally admittedly");
    if(sentStart(i) && CONNECTIVE.has(w) && next && text[tokens[i].end] !== ","){
      // "However you look at it" is a different word — it means "in whatever way"
      // Only "however" has a second sense ("however you look at it") that
      // takes no comma; the rest are connectives whatever follows them.
      const ADVERBIAL = S("you he she it they we i much many long hard far else little");
      if(!(w === "however" && ADVERBIAL.has(w1))){
        add({ cat:"punctuation", rule:"connective-comma", severity:"critical", ...span(i,i),
          suggestions:[raw(i)+","], title:'Comma after "'+raw(i)+'"',
          why:'"'+raw(i)+'" introduces the sentence, so a comma separates it from the clause that follows.' });
      }
    }
  }

  // ---- multi-word phrase rules (wordiness, redundancy) ----
  const lowerWords = tokens.map(t=>t.lw);
  function findPhrase(phrase){
    const parts = phrase.split(" ");
    const hits = [];
    for(let i=0;i+parts.length<=n;i++){
      let ok = true;
      for(let k=0;k<parts.length;k++){
        if(lowerWords[i+k] !== parts[k]){ ok = false; break; }
        if(k > 0 && !contig(i+k-1)){ ok = false; break; }
      }
      if(ok) hits.push([i, i+parts.length-1]);
    }
    return hits;
  }
  for(const [phrase, better] of WORDY_PHRASES){
    for(const [a,b] of findPhrase(phrase)){
      const replacement = better === "-" ? "" : matchCase(tokens[a].raw, better);
      add({ cat:"style", rule:"wordy", severity:"advisory",
        start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
        suggestions: better === "-" ? [] : [replacement],
        title: better === "-" ? "Filler phrase" : "Wordy phrase",
        why: better === "-"
          ? 'This phrase carries no information — the sentence works without it.'
          : '"'+phrase+'" is '+(phrase.split(" ").length - better.split(" ").length)+' words longer than "'+better+'" and says the same thing.' });
    }
  }
  for(const [phrase, better] of REDUNDANCIES){
    for(const [a,b] of findPhrase(phrase)){
      add({ cat:"style", rule:"redundant", severity:"advisory",
        start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
        suggestions: [matchCase(tokens[a].raw, better)], title:"Redundant wording",
        why:'One half of this phrase already contains the other — "'+better+'" is enough.' });
    }
  }

  // ---- set phrases that get mangled ----
  // These are idioms people reproduce by ear. Every word in them is spelled
  // correctly, so a dictionary sails straight past; only the fixed shape of
  // the phrase shows that the wrong word got in.
const IDIOM_FIXES = [
  ["for all intensive purposes","for all intents and purposes",'The phrase is "intents and purposes" — intentions, not intensity.'],
  ["nip it in the butt","nip it in the bud",'The image is pinching off a flower bud before it opens.'],
  ["make due","make do",'The phrase is "make do" — to manage with what you have.'],
  ["peaked my interest","piqued my interest",'"Pique" means to stir up. Nothing reaches a peak here.'],
  ["peaked our interest","piqued our interest",'"Pique" means to stir up. Nothing reaches a peak here.'],
  ["sneak peak","sneak peek",'A quick look is a "peek". A "peak" is a summit.'],
  ["free reign","free rein",'The image is from horse riding — dropping the reins, not ruling.'],
  ["tow the line","toe the line",'You put your toe on the line, which is where the phrase comes from.'],
  ["baited breath","bated breath",'"Bated" means held back, as in abated. Bait is for fishing.'],
  ["deep seeded","deep-seated",'The phrase is "deep-seated" — firmly seated, not planted.'],
  ["hone in on","home in on",'A missile homes in on a target. "Hone" means to sharpen.'],
  ["case and point","case in point",'The phrase is "a case in point" — an example that proves it.'],
  ["one in the same","one and the same",'The phrase means a single thing: "one and the same".'],
  ["beckon call","beck and call",'"Beck" is a summoning gesture, paired with "call".'],
  ["mute point","moot point",'A "moot" point is arguable or irrelevant. "Mute" means silent.'],
  ["by in large","by and large",'The phrase is "by and large".'],
  ["step foot in","set foot in",'The idiom is "set foot".'],
  ["escape goat","scapegoat",'The word is "scapegoat", one word.'],
  ["different than","different from",'British English takes "different from".'],
  ["bored of","bored with",'You are bored with something, or bored by it.'],
  ["comprised of","composed of",'The whole comprises the parts; it is not "comprised of" them.'],
  ["centred around","centred on",'A thing centres on a point, not around one.'],
  ["centered around","centred on",'A thing centres on a point, not around one.'],
  ["based off of","based on",'The phrase is "based on".'],
  ["based off","based on",'The phrase is "based on".'],
  ["in regards to","with regard to",'The fixed phrase is singular: "with regard to".'],
  ["on accident","by accident",'Things happen by accident, or on purpose.'],
  ["could care less","couldn't care less",'The point is you care so little that less is impossible.'],
  ["would of","would have",'"Would\'ve" is often misheard as "would of" — it\'s always "have".'],
  ["should of","should have",'"Should\'ve" is often misheard as "should of" — it\'s always "have".'],
  ["could of","could have",'"Could\'ve" is often misheard as "could of" — it\'s always "have".'],
  ["irregardless","regardless",'"Irregardless" is a double negative; the correct word is "regardless".'],
  ["expresso","espresso",'The word borrowed from Italian is "espresso", no "x".'],
  ["wet your appetite","whet your appetite",'"Whet" means to sharpen. Wetting an appetite makes no sense.'],
  ["chomping at the bit","champing at the bit",'Horses "champ" — chew restlessly — at the bit.'],
  ["curl up in the feeble position","curl up in the fetal position",'The posture resembles a fetus, not feebleness.'],
  ["old timer's disease","Alzheimer's disease",'The condition is named for Alois Alzheimer.'],
  ["extract revenge","exact revenge",'You "exact" — inflict — revenge, not extract it.'],
  ["all be it","albeit",'"Albeit" is one word meaning "although it be".'],
  ["a whole nother","a whole other",'"Nother" isn\'t a word; the phrase splits "another" incorrectly.'],
  ["without further adieu","without further ado",'"Ado" means fuss; "adieu" is French for goodbye.'],
  ["slight of hand","sleight of hand",'"Sleight" means skillful deception, unrelated to "slight".'],
  ["wreck havoc","wreak havoc",'You "wreak" — inflict — havoc, not wreck it.'],
  ["pour over the details","pore over the details",'"Pore over" means to study closely; "pour" is for liquids.'],
  ["give free reign","give free rein",'The riding image again: loosen the reins, not hand over a crown.'],
  ["through the ringer","through the wringer",'A wringer squeezes water from laundry — the source of the image.'],
  ["it's a doggy dog world","it's a dog-eat-dog world",'The phrase describes ruthless competition, not dogs being "doggy".'],
  ["shoe-in","shoo-in",'A "shoo-in" was originally a race easily "shooed" to the finish.'],
  ["statue of limitations","statute of limitations",'It\'s a legal "statute", not a "statue".'],
  ["shutter to think","shudder to think",'You "shudder" — tremble — at the thought; a shutter is a window cover.'],
  ["shoo in","shoo-in",'A "shoo-in" was originally a race easily "shooed" to the finish.'],
  ["shoe horn","shoehorn",'"Shoehorn" as a verb is one word.'],
  ["scotch free","scot-free",'"Scot" was a medieval tax; going "scot-free" meant avoiding it.'],
  ["duck tape","duct tape",'The tape was originally made for sealing air ducts.'],
  ["supposably","supposedly",'The word is "supposedly", from "suppose".'],
  ["expatriot","expatriate",'The word is "expatriate" — from "patria", homeland — not "patriot".'],
  ["pacific reason","specific reason",'"Pacific" refers to the ocean or peace; the word wanted is "specific".'],
  ["momento","memento",'The word is "memento", from Latin "remember", not "moment".'],
  ["axe a question","ask a question",'The verb is "ask"; "axe" is a tool or a dialectal pronunciation.'],
  ["that's a mute point","that's a moot point",'A "moot" point is arguable or irrelevant. "Mute" means silent.'],
  ["a mute point","a moot point",'A "moot" point is arguable or irrelevant. "Mute" means silent.'],
  ["conversating","conversing",'The verb is "converse"; "conversating" is a nonstandard back-formation.'],
  ["preform a task","perform a task",'The verb is "perform"; "preform" means to shape in advance.'],
  ["diffuse the situation","defuse the situation",'You "defuse" a bomb-like situation; "diffuse" means to spread out.'],
  ["ex-patriot","expatriate",'The word is "expatriate" — from "patria", homeland — not "patriot".'],
  ["I could care less","I couldn't care less",'The point is you care so little that less is impossible.'],
  ["worse comes to worse","worse comes to worst",'The progression is from bad ("worse") to the extreme ("worst").'],
  ["change tact","change tack",'"Tack" is a sailing term for direction; "tact" means diplomacy.'],
  ["hunger pain","hunger pang",'A "pang" is a sudden sharp feeling; "pain" is the wrong noun here.'],
  ["fall by the waste side","fall by the wayside",'The image is something left beside the road ("way"), not waste.'],
  ["nerve wrecking","nerve-racking",'The word is "racking", as in a rack that stretches, not "wrecking".'],
  ["curve your appetite","curb your appetite",'You "curb" — restrain — an appetite; "curve" doesn\'t fit.'],
  ["shudder the thought","shudder to think",'The idiom is "shudder to think", not "shudder the thought".'],
  ["must of","must have",'"Must\'ve" is often misheard as "must of" — it\'s always "have".'],
  ["might of","might have",'"Might\'ve" is often misheard as "might of" — it\'s always "have".'],
  ["reign in","rein in",'The image is again from horse riding — pulling in the reins, not a monarch\'s reign.'],
  ["bare with me","bear with me",'You "bear" — endure — with someone; "bare" means uncovered.'],
  ["bare in mind","bear in mind",'You "bear" — carry — something in mind; "bare" means uncovered.'],
  ["bare the burden","bear the burden",'You "bear" — carry — a burden; "bare" means uncovered.'],
  ["alot","a lot",'It is always two words: "a lot".'],
  ["each one worse than the next","each one worse than the last",'The comparison runs backward to what came before, not forward to what\'s next.'],
  ["with regards to","with regard to",'The fixed phrase is singular: "with regard to".'],
  ["biting my time","biding my time",'You "bide" — wait out — time; "biting" doesn\'t fit.'],
  ["old wise tale","old wives' tale",'The phrase credits folk wisdom to "old wives", not general "wise" tales.'],
  ["shear luck","sheer luck",'"Sheer" means utter or complete; "shear" means to cut.'],
  ["shear stupidity","sheer stupidity",'"Sheer" means utter or complete; "shear" means to cut.'],
  ["bonified","bona fide",'The Latin phrase is "bona fide", meaning "in good faith".'],
  ["shoe-string budget","shoestring budget",'"Shoestring" is one word in this idiom for a tiny budget.'],
  ["beckon and call","beck and call",'"Beck" is a summoning gesture, paired with "call" — not "beckon".'],
  ["make ends meat","make ends meet",'The verb is "meet" — the ends come together — not "meat".'],
  ["at the drop of the hat","at the drop of a hat",'The idiom uses the indefinite article: "a hat", not "the hat".'],
  ["give up the goat","give up the ghost",'The idiom for dying or quitting is "give up the ghost".'],
  ["wolf in cheap clothing","wolf in sheep's clothing",'The disguise is sheep\'s wool, not cheapness.'],
  ["hard road to hoe","hard row to hoe",'The image is a farmer\'s "row" to hoe, not a "road".'],
  ["tow the mark","toe the mark",'You put your toe on the mark, the same image as "toe the line".'],
  ["on tender hooks","on tenterhooks",'"Tenterhooks" held cloth stretched taut on a frame; it has nothing to do with tenderness.'],
  ["tender hooks","tenterhooks",'"Tenterhooks" held cloth stretched taut on a frame; it has nothing to do with tenderness.'],
  ["in one foul swoop","in one fell swoop",'"Fell" here is an old word for fierce, not "foul".'],
  ["not phased","not fazed",'"Fazed" means disturbed or disconcerted; "phase" is a stage or period.'],
  ["phased by","fazed by",'"Fazed" means disturbed or disconcerted; "phase" is a stage or period.'],
  ["unphased","unfazed",'"Fazed" means disturbed or disconcerted; "phase" is a stage or period.'],
  ["loose weight","lose weight",'You "lose" pounds; "loose" means not tight.'],
  ["loose your mind","lose your mind",'You "lose" your mind; "loose" means not tight.'],
  ["per say","per se",'The Latin phrase is "per se", meaning "in itself".'],
  ["own violation","own volition",'"Volition" means free will; a "violation" is a breach of a rule.'],
  ["unchartered territory","uncharted territory",'"Uncharted" means not mapped; "unchartered" would mean lacking a charter.'],
  ["on route to","en route to",'The French borrowing is "en route", meaning "on the way".'],
  ["jives with","jibes with",'"Jibe" means to agree; "jive" is a style of dance or music.'],
  ["eeks out","ekes out",'"Eke out" means to make something stretch, e.g. a living.'],
  ["eek out","eke out",'"Eke out" means to make something stretch, e.g. a living.'],
  ["play it by year","play it by ear",'The idiom comes from musicians improvising "by ear", not "by year".'],
  ["take it with a grain of assault","take it with a grain of salt",'A pinch of salt makes a claim easier to swallow — "assault" doesn\'t fit.'],
  ["mind your peas and cues","mind your Ps and Qs",'The idiom refers to the letters P and Q, not vegetables.'],
  ["all of the sudden","all of a sudden",'The idiom uses the indefinite article: "a sudden", not "the sudden".'],
  ["in lame man's terms","in layman's terms",'A "layman" is a non-expert; "lame man" is unrelated.'],
  ["in the mist of","in the midst of",'"Midst" means in the middle of; "mist" is fog or haze.'],
  ["sneak a peak","sneak a peek",'A quick look is a "peek". A "peak" is a summit.'],
  ["take a peak","take a peek",'A quick look is a "peek". A "peak" is a summit.'],
  ["sneak peaks","sneak peeks",'A quick look is a "peek". A "peak" is a summit.'],
  ["chester drawers","chest of drawers",'The furniture is a "chest of drawers"; "Chester" is a name, not a container.'],
  ["ex-cetera","et cetera",'The Latin phrase is "et cetera" — "and the rest" — abbreviated "etc."'],
  ["did a complete 360","did a complete 180",'A 360 brings you back where you started; a full reversal is a 180.'],
  ["he did a complete 360","he did a complete 180",'A 360 brings you back where you started; a full reversal is a 180.'],
  ["no love loss","no love lost",'The idiom describes affection that never existed — "lost", not "loss".'],
  ["mind-bottling","mind-boggling",'Something that overwhelms the mind is "mind-boggling", not "bottling".'],
];
  for(const [phrase, better, why] of IDIOM_FIXES){
    for(const [a,b] of findPhrase(phrase)){
      add({ cat:"grammar", rule:"idiom", severity:"critical",
        start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
        suggestions:[matchCase(tokens[a].raw, better)], title:"Set phrase",
        why });
    }
  }

  // ---- compound modifiers want a hyphen before the noun ----
  // "a well-known author" takes the hyphen; "the author is well known"
  // does not, so the rule only fires when a noun follows.
const HYPHENATE = [
  // --- Original set ---
  ["well known","well-known"],["well established","well-established"],
  ["well written","well-written"],["well documented","well-documented"],
  ["long term","long-term"],["short term","short-term"],["high quality","high-quality"],
  ["full time","full-time"],["part time","part-time"],["real time","real-time"],
  ["cost effective","cost-effective"],["user friendly","user-friendly"],
  ["decision making","decision-making"],["so called","so-called"],
  ["one off","one-off"],["high profile","high-profile"],["low cost","low-cost"],
  ["short lived","short-lived"],["long standing","long-standing"],
  ["world class","world-class"],["up to date","up-to-date"],
  ["state of the art","state-of-the-art"],["day to day","day-to-day"],
  ["face to face","face-to-face"],["off the shelf","off-the-shelf"],

  // --- well- compounds ---
  ["well off","well-off"],["well being","well-being"],["well meaning","well-meaning"],
  ["well intentioned","well-intentioned"],["well balanced","well-balanced"],
  ["well rounded","well-rounded"],["well informed","well-informed"],
  ["well respected","well-respected"],["well received","well-received"],
  ["well deserved","well-deserved"],["well timed","well-timed"],
  ["well behaved","well-behaved"],["well equipped","well-equipped"],
  ["well funded","well-funded"],["well connected","well-connected"],
  ["well maintained","well-maintained"],["well organized","well-organized"],
  ["well planned","well-planned"],["well prepared","well-prepared"],
  ["well trained","well-trained"],["well versed","well-versed"],
  ["well worn","well-worn"],["well suited","well-suited"],
  ["well liked","well-liked"],["well paid","well-paid"],["well read","well-read"],
  ["well to do","well-to-do"],

  // --- self- compounds ---
  ["self aware","self-aware"],["self conscious","self-conscious"],
  ["self sufficient","self-sufficient"],["self taught","self-taught"],
  ["self employed","self-employed"],["self service","self-service"],
  ["self control","self-control"],["self confidence","self-confidence"],
  ["self discipline","self-discipline"],["self respect","self-respect"],
  ["self improvement","self-improvement"],["self expression","self-expression"],
  ["self reliant","self-reliant"],["self evident","self-evident"],
  ["self explanatory","self-explanatory"],["self contained","self-contained"],
  ["self inflicted","self-inflicted"],["self imposed","self-imposed"],
  ["self serving","self-serving"],["self absorbed","self-absorbed"],
  ["self centered","self-centered"],["self centred","self-centred"],
  ["self destructive","self-destructive"],["self fulfilling","self-fulfilling"],
  ["self indulgent","self-indulgent"],["self assured","self-assured"],
  ["self important","self-important"],["self righteous","self-righteous"],
  ["self assessment","self-assessment"],["self care","self-care"],
  ["self help","self-help"],["self starter","self-starter"],

  // --- co- compounds ---
  ["co worker","co-worker"],["co founder","co-founder"],["co author","co-author"],
  ["co owner","co-owner"],["co pilot","co-pilot"],["co star","co-star"],
  ["co host","co-host"],["co dependent","co-dependent"],["co sign","co-sign"],
  ["co chair","co-chair"],

  // --- descriptive compound adjectives ---
  ["hard working","hard-working"],["easy going","easy-going"],
  ["wide ranging","wide-ranging"],["far reaching","far-reaching"],
  ["long lasting","long-lasting"],["eye catching","eye-catching"],
  ["heart breaking","heart-breaking"],["ground breaking","ground-breaking"],
  ["record breaking","record-breaking"],["law abiding","law-abiding"],
  ["time consuming","time-consuming"],["thought provoking","thought-provoking"],
  ["awe inspiring","awe-inspiring"],["jaw dropping","jaw-dropping"],
  ["mouth watering","mouth-watering"],["breath taking","breath-taking"],
  ["spine chilling","spine-chilling"],["gut wrenching","gut-wrenching"],
  ["bone chilling","bone-chilling"],["hair raising","hair-raising"],
  ["spine tingling","spine-tingling"],["mind blowing","mind-blowing"],
  ["mind boggling","mind-boggling"],["heart warming","heart-warming"],
  ["heart wrenching","heart-wrenching"],["action packed","action-packed"],
  ["star studded","star-studded"],["cutting edge","cutting-edge"],

  // --- cross-/in-/on-/off- compounds ---
  ["cross border","cross-border"],["cross country","cross-country"],
  ["cross functional","cross-functional"],["cross platform","cross-platform"],
  ["cross section","cross-section"],["in depth","in-depth"],["in house","in-house"],
  ["off site","off-site"],["on site","on-site"],["off center","off-center"],
  ["off centre","off-centre"],

  // --- scale / level / tier compounds ---
  ["large scale","large-scale"],["small scale","small-scale"],["full scale","full-scale"],
  ["high tech","high-tech"],["low tech","low-tech"],["high end","high-end"],
  ["low end","low-end"],["high risk","high-risk"],["low risk","low-risk"],
  ["high level","high-level"],["low level","low-level"],["high speed","high-speed"],
  ["low speed","low-speed"],["high pressure","high-pressure"],["low pressure","low-pressure"],
  ["high impact","high-impact"],["high stakes","high-stakes"],["high powered","high-powered"],
  ["top notch","top-notch"],["top secret","top-secret"],["mid range","mid-range"],
  ["top tier","top-tier"],["sub par","sub-par"],["third rate","third-rate"],

  // --- personality / temperament compounds ---
  ["like minded","like-minded"],["open minded","open-minded"],
  ["broad minded","broad-minded"],["narrow minded","narrow-minded"],
  ["absent minded","absent-minded"],["strong willed","strong-willed"],
  ["weak willed","weak-willed"],["quick witted","quick-witted"],
  ["sharp witted","sharp-witted"],["soft spoken","soft-spoken"],
  ["loud mouthed","loud-mouthed"],["warm hearted","warm-hearted"],
  ["cold hearted","cold-hearted"],["kind hearted","kind-hearted"],
  ["big hearted","big-hearted"],["good natured","good-natured"],
  ["bad tempered","bad-tempered"],["even tempered","even-tempered"],
  ["quick tempered","quick-tempered"],["level headed","level-headed"],
  ["hot headed","hot-headed"],["cool headed","cool-headed"],
  ["clear headed","clear-headed"],["thick skinned","thick-skinned"],
  ["thin skinned","thin-skinned"],["tongue tied","tongue-tied"],
  ["tight lipped","tight-lipped"],["single minded","single-minded"],
  ["fair minded","fair-minded"],["high minded","high-minded"],
  ["simple minded","simple-minded"],["empty handed","empty-handed"],
  ["heavy handed","heavy-handed"],["even handed","even-handed"],
  ["high handed","high-handed"],["open handed","open-handed"],

  // --- made / picked / produced compounds ---
  ["hand picked","hand-picked"],["hand made","hand-made"],["home made","home-made"],
  ["custom made","custom-made"],["tailor made","tailor-made"],["man made","man-made"],
  ["mass produced","mass-produced"],

  // --- class / rank compounds ---
  ["middle class","middle-class"],["working class","working-class"],
  ["upper class","upper-class"],["lower class","lower-class"],
  ["first class","first-class"],["second class","second-class"],

  // --- phrasal / idiomatic multi-word compounds ---
  ["down to earth","down-to-earth"],["out of date","out-of-date"],
  ["over the counter","over-the-counter"],["behind the scenes","behind-the-scenes"],
  ["hands on","hands-on"],["built in","built-in"],["made up","made-up"],
  ["middle aged","middle-aged"],["old school","old-school"],["old fashioned","old-fashioned"],
  ["run down","run-down"],["worn out","worn-out"],["burnt out","burnt-out"],
  ["burned out","burned-out"],["sold out","sold-out"],["drive through","drive-through"],
  ["walk in","walk-in"],["sit down","sit-down"],["stand up","stand-up"],
  ["follow up","follow-up"],["set up","set-up"],["start up","start-up"],
  ["back up","back-up"],["trade off","trade-off"],["kick off","kick-off"],
  ["warm up","warm-up"],["cool down","cool-down"],["shake up","shake-up"],
  ["line up","line-up"],["round up","round-up"],["wrap up","wrap-up"],
  ["close up","close-up"],["cover up","cover-up"],["build up","build-up"],
  ["mix up","mix-up"],["clear cut","clear-cut"],["knee jerk","knee-jerk"],
  ["matter of fact","matter-of-fact"],["tongue in cheek","tongue-in-cheek"],
  ["larger than life","larger-than-life"],["far fetched","far-fetched"],
  ["long winded","long-winded"],["short sighted","short-sighted"],
  ["far sighted","far-sighted"],["first hand","first-hand"],["second hand","second-hand"],

  // --- business / marketing compounds ---
  ["risk averse","risk-averse"],["data driven","data-driven"],
  ["evidence based","evidence-based"],["results driven","results-driven"],
  ["customer focused","customer-focused"],["market leading","market-leading"],
  ["industry leading","industry-leading"],["award winning","award-winning"],
  ["best selling","best-selling"],["top rated","top-rated"],

  // --- pairwise / sequence compounds ---
  ["head to head","head-to-head"],["one on one","one-on-one"],
  ["back to back","back-to-back"],["side by side","side-by-side"],
  ["hand in hand","hand-in-hand"],["step by step","step-by-step"],
  ["day by day","day-by-day"],["one to one","one-to-one"],
];
  // A same word often reads as either a noun or a verb ("plan", "cost").
  // What actually rules a hyphen out is the *following* word being a clear
  // function word or an inflected verb form, not the word being verb-shaped.
  function looksLikeNounHead(w){
    return DICTIONARY.has(w) && !DETERMINERS.has(w) && !PREPOSITIONS.has(w) &&
      !PRONOUNS.has(w) && !CONJUNCTIONS.has(w) && !BE_FORMS.has(w) &&
      !HAVE_FORMS.has(w) && !DO_FORMS.has(w) && !MODALS.has(w) &&
      !isAdverb(w) && !isPastForm(w) && !looksLikeVerbS(w) && !isAdjective(w);
  }
  for(const [phrase, hyphened] of HYPHENATE){
    for(const [a,b] of findPhrase(phrase)){
      const after = lowerWords[b+1];
      if(b+1 >= n || !contig(b) || !after) continue;
      if(!looksLikeNounHead(after)) continue;
      if(!sameSentence(a, b+1)) continue;
      add({ cat:"punctuation", rule:"hyphen", severity:"critical",
        start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
        suggestions:[matchCase(tokens[a].raw, hyphened)], title:"Compound modifier takes a hyphen",
        why:'These words act as a single adjective in front of "'+tokens[b+1].raw+'", so they are joined with a hyphen.' });
    }
  }

  // ---- repeated word ----
  for(let i=0;i<n-1;i++){
    if(lowerWords[i] === lowerWords[i+1] && contig(i) && /^[a-z']+$/.test(lowerWords[i]) &&
       lowerWords[i] !== "had" && lowerWords[i] !== "that"){
      add({ cat:"grammar", rule:"repeat", severity:"critical",
        start: tokens[i].start, end: tokens[i+1].end, original: text.slice(tokens[i].start, tokens[i+1].end),
        suggestions:[tokens[i].raw], title:"Word typed twice",
        why:'"'+tokens[i].raw+'" appears twice in a row.' });
    }
  }

  // ---- run-together words split by a stray space ----
  for(let i=0;i<n-1;i++){
    if(!contig(i)) continue;
    const merged = (lowerWords[i] + lowerWords[i+1]);
    if(merged.length >= 6 && DICTIONARY.has(merged) && RANK.has(merged) && RANK.get(merged) < 6000 &&
       lowerWords[i].length <= 4 && lowerWords[i+1].length <= 6 &&
       (!DICTIONARY.has(lowerWords[i]) || !DICTIONARY.has(lowerWords[i+1]))){
      add({ cat:"spelling", rule:"merge", severity:"critical",
        start: tokens[i].start, end: tokens[i+1].end, original: text.slice(tokens[i].start, tokens[i+1].end),
        suggestions:[merged], title:"These look like one word",
        why:'"'+merged+'" is a single word in the dictionary.' });
    }
  }

  // ---- sentence-level checks ----
  sentences.forEach((sent, si) => {
    const count = sent.tokEnd - sent.tokStart;
    if(count > 34){
      add({ cat:"style", rule:"long-sentence", severity:"advisory",
        start: sent.start, end: Math.min(sent.end, sent.start + 60),
        original: text.slice(sent.start, Math.min(sent.end, sent.start+60)).trim(),
        suggestions:[], title:"Long sentence ("+count+" words)",
        why:'Readers lose the thread past about 30 words. Look for a natural place to break this in two.' });
    }
    // conjunctive adverb opening without a comma
    const first = tokens[sent.tokStart];
    if(first && CONJ_ADVERBS.has(first.lw) && sent.tokStart+1 < sent.tokEnd){
      const after = text.slice(first.end, tokens[sent.tokStart+1].start);
      if(!after.includes(",")){
        add({ cat:"punctuation", rule:"intro-comma", severity:"advisory",
          start: first.start, end: first.end, original: first.raw,
          suggestions:[first.raw + ","], title:"Comma after an opening adverb",
          why:'An introductory "'+first.raw+'" is followed by a comma.' });
      }
    }
    // comma splice: ", <pronoun> <finite verb>" — but only when what comes
    // before the comma is itself a full sentence. A leading subordinate
    // clause ("If that is right, I am content") takes a comma quite properly,
    // so anything with a subordinator in front of the comma is left alone.
    const SUBORDINATORS = S("if when whenever while although though because since unless until after before as once whereas whether given assuming during despite provided than where who which that having");
    for(let i=sent.tokStart;i<sent.tokEnd-2;i++){
      const gap = text.slice(tokens[i].end, tokens[i+1].start);
      if(gap.indexOf(",") === -1) continue;
      let subordinateBefore = false, finiteBefore = false;
      for(let k=sent.tokStart;k<=i;k++){
        if(SUBORDINATORS.has(tokens[k].lw)) subordinateBefore = true;
        if(isFiniteVerb(tokens[k].lw)) finiteBefore = true;
      }
      if(subordinateBefore || !finiteBefore) continue;
      if(PREPOSITIONS.has(tokens[sent.tokStart].lw)) continue;
      const p = tokens[i+1].lw, v = tokens[i+2].lw;
      const isSubj = S("i you he she it we they").has(p);
      const tail = sent.tokEnd - (i+1);
      if(isSubj && isFiniteVerb(v) && !CONJUNCTIONS.has(v) && tail > 3 &&
         !S("think guess suppose hope believe mean know said says").has(v)){
        add({ cat:"punctuation", rule:"comma-splice", severity:"advisory",
          start: tokens[i].end, end: tokens[i+1].end,
          original: text.slice(tokens[i].end, tokens[i+1].end).trim(),
          suggestions:[], title:"Comma joining two sentences",
          why:'"'+tokens[i+1].raw+" "+tokens[i+2].raw+'..." could stand alone as a sentence. A full stop, a semicolon, or "and"/"but" would join it properly.' });
      }
    }
  });
}

