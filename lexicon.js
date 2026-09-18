// ===============================================================
// 2. LEXICON + MORPHOLOGY
//    A lightweight, hand-built part-of-speech layer. Full statistical
//    tagging is out of scope for a no-model checker, but almost every
//    grammar rule below only needs to answer a handful of questions:
//    is this word a pronoun, a determiner, a finite verb, a plural noun,
//    an adjective? Closed classes (pronouns, determiners, modals,
//    auxiliaries, prepositions) are listed exhaustively because they're
//    small and finite; open classes are handled with frequency lists plus
//    morphology (suffixes, irregular tables) and, crucially, the rules
//    that depend on them are written to fail *silently* rather than
//    guess — a missed error is much cheaper than a wrong correction.
// ===============================================================
const S = str => new Set(str.trim().split(/\s+/));

const SUBJ_PRON_SG3 = S("he she it");
const SUBJ_PRON_PL  = S("we they you");
const INDEF_SG      = S("everyone everybody someone somebody anyone anybody nobody noone nothing something anything everything each either neither one");
const DETERMINERS   = S("a an the this that these those my your his her its our their whose some any no every each another either neither both several many much few little all most enough such what which");
const POSS_DET      = S("my your his her its our their");
const PRONOUNS      = S("i you he she it we they me him her us them myself yourself himself herself itself ourselves yourselves themselves who whom whoever mine yours hers ours theirs");
const PREPOSITIONS  = S("about above across after against along among around at before behind below beneath beside besides between beyond by despite down during except for from in inside into like near of off on onto out outside over past per since through throughout till to toward towards under underneath until up upon with within without");
const MODALS        = S("can could will would shall should may might must ought");
const BE_FORMS      = S("am is are was were be been being");
const HAVE_FORMS    = S("have has had having");
const DO_FORMS      = S("do does did doing done");
const CONJUNCTIONS  = S("and but or nor yet so for because although though while whereas unless until since if when whenever wherever whether after before once than that as");
const CONJ_ADVERBS  = S("however therefore moreover furthermore nevertheless nonetheless consequently otherwise meanwhile instead additionally besides accordingly hence thus indeed similarly likewise");
const COLLECTIVE    = S(`
 team staff government family committee band group company police public crew jury council
 class audience couple board party media majority minority firm cabinet union club orchestra
 parliament squad army navy faculty management panel tribunal congregation choir crowd flock
 herd gang troupe cast electorate ministry department association society community population
 workforce leadership opposition press clergy personnel militia senate commission delegation
 jury council board management staff team side coalition alliance partnership household
 audience generation membership committee bureau agency authority trust charity institute
`);
const NEGATIVE_WORDS = S("no none nothing nobody nowhere neither never");
const NEG_CONTRACTIONS = S("don't doesn't didn't can't cannot couldn't won't wouldn't shouldn't isn't aren't wasn't weren't haven't hasn't hadn't mustn't ain't");

// Irregular verbs: base -> [past, past participle]
const IRREGULAR_VERBS = {
  be:["was","been"], become:["became","become"], begin:["began","begun"], bend:["bent","bent"],
  bite:["bit","bitten"], blow:["blew","blown"], break:["broke","broken"], bring:["brought","brought"],
  build:["built","built"], buy:["bought","bought"], catch:["caught","caught"], choose:["chose","chosen"],
  come:["came","come"], cost:["cost","cost"], cut:["cut","cut"], deal:["dealt","dealt"],
  dig:["dug","dug"], do:["did","done"], draw:["drew","drawn"], drink:["drank","drunk"],
  drive:["drove","driven"], eat:["ate","eaten"], fall:["fell","fallen"], feed:["fed","fed"],
  feel:["felt","felt"], fight:["fought","fought"], find:["found","found"], fly:["flew","flown"],
  forget:["forgot","forgotten"], forgive:["forgave","forgiven"], freeze:["froze","frozen"],
  get:["got","got"], give:["gave","given"], go:["went","gone"], grow:["grew","grown"],
  hang:["hung","hung"], have:["had","had"], hear:["heard","heard"], hide:["hid","hidden"],
  hit:["hit","hit"], hold:["held","held"], hurt:["hurt","hurt"], keep:["kept","kept"],
  know:["knew","known"], lay:["laid","laid"], lead:["led","led"], leave:["left","left"],
  lend:["lent","lent"], let:["let","let"], lie:["lay","lain"], lose:["lost","lost"],
  make:["made","made"], mean:["meant","meant"], meet:["met","met"], pay:["paid","paid"],
  put:["put","put"], quit:["quit","quit"], read:["read","read"], ride:["rode","ridden"],
  ring:["rang","rung"], rise:["rose","risen"], run:["ran","run"], say:["said","said"],
  see:["saw","seen"], seek:["sought","sought"], sell:["sold","sold"], send:["sent","sent"],
  set:["set","set"], shake:["shook","shaken"], shine:["shone","shone"], shoot:["shot","shot"],
  show:["showed","shown"], shrink:["shrank","shrunk"], shut:["shut","shut"], sing:["sang","sung"],
  sink:["sank","sunk"], sit:["sat","sat"], sleep:["slept","slept"], slide:["slid","slid"],
  speak:["spoke","spoken"], spend:["spent","spent"], spin:["spun","spun"], stand:["stood","stood"],
  steal:["stole","stolen"], stick:["stuck","stuck"], sting:["stung","stung"], strike:["struck","struck"],
  swear:["swore","sworn"], sweep:["swept","swept"], swim:["swam","swum"], swing:["swung","swung"],
  take:["took","taken"], teach:["taught","taught"], tear:["tore","torn"], tell:["told","told"],
  think:["thought","thought"], throw:["threw","thrown"], understand:["understood","understood"],
  wake:["woke","woken"], wear:["wore","worn"], win:["won","won"], write:["wrote","written"]
};
const PAST_TO_PARTICIPLE = {};   // went -> gone
const PARTICIPLE_TO_PAST = {};   // seen -> saw
const IRREG_PAST = new Set();
const IRREG_PART = new Set();
const IRREG_BASE = new Set(Object.keys(IRREGULAR_VERBS));
for(const base in IRREGULAR_VERBS){
  const [past, part] = IRREGULAR_VERBS[base];
  IRREG_PAST.add(past); IRREG_PART.add(part);
  if(past !== part){
    PAST_TO_PARTICIPLE[past] = part;
    PARTICIPLE_TO_PAST[part] = past;
  }
}

// Frequent base-form verbs. Used to decide "is this token a verb at all",
// which several agreement rules depend on.
const COMMON_VERBS = S(`
 accept add admit advise afford agree allow answer appear apply argue arrange arrive ask
 attack attend avoid bake become begin believe belong borrow break bring build burn buy
 call carry catch cause change charge chase check choose claim clean clear climb close
 collect come commit compare complain complete concern confirm connect consider contain
 continue cook copy cost count cover create cross cry cut damage dance decide deliver
 demand deny depend describe design destroy develop die disagree discover discuss divide
 drink drive drop dry earn eat edit employ encourage end enjoy enter examine exist expect
 explain express fail fall feed feel fight fill find finish fit fix fly fold follow forget
 forgive form gather get give go grow guess handle hang happen hate have head hear help
 hide hire hit hold hope hurry hurt identify ignore imagine improve include increase
 indicate influence inform insist install intend introduce invite involve join joke jump
 keep kick kill kiss knock know lack land last laugh lay lead learn leave lend let lie
 lift like listen live look lose love make manage mark marry match matter mean measure
 meet mention mind miss move name need notice obtain occur offer open order organise owe
 own paint pass pay perform pick plan play point post pour practise prefer prepare present
 press prevent print produce promise protect prove provide publish pull push put raise
 reach read realise receive recognise recommend record reduce refer reflect refuse regard
 relate release remain remember remind remove repeat replace reply report represent
 require rest result return reveal ride ring rise risk roll run save say search see seek
 seem sell send separate serve set settle shake share shoot shop show shut sign sing sit
 sleep smell smile sort sound speak spend stand start state stay steal stick stop study
 succeed suffer suggest supply support suppose surprise survive take talk teach tell tend
 test thank think throw touch train travel treat try turn understand use visit vote wait
 wake walk want warn wash watch wear welcome win wish wonder work worry write
 cancel approve review submit schedule confirm attach forward assign update upload
 download publish sign book email text message file review budget fund launch hire
 fire promote train brief draft revise edit format print scan email invoice quote
 negotiate sponsor audit forecast allocate approve escalate delegate monitor track
 resolve flag archive restore backup migrate deploy release test debug refactor
 rename delete install configure enable disable subscribe register login logout
 attend chair minute circulate distribute summarise clarify outline highlight
 emphasise acknowledge apologise congratulate thank remind notify alert warn
 contact liaise coordinate collaborate consult verify validate authorise clarify
 reassure appreciate compensate reimburse invoice bill charge credit debit
`);
const ALL_BASE_VERBS = new Set([...COMMON_VERBS, ...IRREG_BASE]);

// Frequent adjectives. "to" + adjective is the strongest signal for the
// too/to mix-up, and a/an + adjective + noun needs this too.
const COMMON_ADJECTIVES = S(`
 able afraid angry available bad beautiful best better big black blue boring bright busy
 careful certain cheap clean clear clever close cold comfortable common complete confident
 confused cool correct crazy cruel curious dangerous dark dead deep different difficult
 dirty dry due early easy empty enough excited expensive fair familiar famous far fast fat
 few final fine flat foolish free fresh friendly full funny general gentle glad good great
 green guilty happy hard harsh healthy heavy high honest hot huge hungry important
 impossible interesting kind large last late lazy light likely little lonely long loud
 lovely low lucky mad main major married mean modern narrow nasty natural near nervous new
 nice noisy normal obvious odd old open ordinary original painful pale particular perfect
 pleasant polite poor popular possible powerful pretty proud quick quiet rare ready real
 recent regular rich right rough round rude sad safe scared secret serious sharp short shy
 sick silly similar simple slow small smart smooth soft sorry special specific steady
 straight strange strong stupid successful sudden sunny sure surprised sweet tall terrible
 thick thin tidy tight tiny tired tough true typical ugly unhappy unusual upset useful
 usual valuable violent warm weak weird wet white wide wild wise wonderful wrong young
 much many far late soon often little low high
`);
const COMMON_ADVERBS = S("very really quite rather too so just almost nearly always never often sometimes usually rarely seldom already still yet soon early late here there now then again once twice however therefore also even only especially probably certainly definitely perhaps maybe simply merely actually basically literally honestly clearly obviously totally completely absolutely extremely incredibly");

// Words ending in -s that are nouns first and foremost, so they must not be
// read as third-person verbs after a pronoun or modal.
const NOUN_ONLY_S = S("means series species news politics economics works goods stairs glasses clothes savings earnings surroundings contents thanks arms times ways things people others days years");
const INVARIANT_PLURALS = S("sheep fish deer series species aircraft offspring salmon trout moose swine");
const IRREGULAR_PLURALS = S("children people men women teeth feet mice geese oxen criteria phenomena data media alumni fungi cacti indices matrices theses analyses crises bases hypotheses");
const IRREGULAR_SINGULARS = { children:"child", people:"person", men:"man", women:"woman", teeth:"tooth", feet:"foot", mice:"mouse", geese:"goose" };
// Words ending in -s that are singular or uncountable, so they must never be
// read as plurals by the agreement rules.
const S_ENDING_SINGULAR = S(`
 news mathematics maths physics economics politics statistics ethics gymnastics athletics
 measles mumps diabetes rabies series species means analysis crisis basis thesis campus
 bus gas lens bias virus focus status census chaos glass class grass mass pass process
 access address business witness illness happiness kindness darkness progress success
 address always perhaps yes plus versus atlas canvas cactus bonus circus radius surplus
 this his hers its ours yours theirs us as thus
 shambles crossroads barracks headquarters innings gallows kudos ethos pathos molasses
 herpes shingles corps chassis bellows gasworks waterworks
 linguistics acoustics aerobics logistics mechanics optics genetics obstetrics paediatrics
 robotics semantics thermodynamics aesthetics diagnostics dynamics forensics hydraulics
 phonetics civics dietetics geriatrics orthodontics pyrotechnics
 billiards darts skittles wales
`);
const UNCOUNTABLE = S(`
 advice information money furniture luggage baggage equipment knowledge research evidence
 homework housework work traffic weather music art love happiness sadness anger courage
 water milk coffee tea juice rice bread butter cheese meat sugar salt pepper flour food
 air oxygen smoke sand snow rain ice wood paper plastic metal gold silver electricity
 time space energy progress education travel news software hardware data feedback training
`);

function endsWith(w, s){ return w.length > s.length && w.slice(-s.length) === s; }

function singularise(w){
  if(IRREGULAR_SINGULARS[w]) return IRREGULAR_SINGULARS[w];
  if(endsWith(w,"ies")) return w.slice(0,-3) + "y";
  if(endsWith(w,"ves")) return w.slice(0,-3) + "f";
  if(/(ches|shes|sses|xes|zes)$/.test(w)) return w.slice(0,-2);
  if(endsWith(w,"oes")) return w.slice(0,-2);
  if(endsWith(w,"s")) return w.slice(0,-1);
  return w;
}
function pluralise(w){
  if(/(s|x|z|ch|sh)$/.test(w)) return w + "es";
  if(/[^aeiou]y$/.test(w)) return w.slice(0,-1) + "ies";
  return w + "s";
}
function thirdPerson(base){
  if(base === "be") return "is";
  if(base === "have") return "has";
  if(/(s|x|z|ch|sh|o)$/.test(base)) return base + "es";   // go -> goes, watch -> watches
  if(/[^aeiou]y$/.test(base)) return base.slice(0,-1) + "ies";
  return base + "s";
}
// A token that is very likely a verb carrying the third-person -s, rather
// than a plural noun that happens to look the same ("goes", "makes").
function looksLikeVerbS(w){
  if(!isThirdPersonVerb(w)) return false;
  if(NOUN_ONLY_S.has(w)) return false;
  return true;
}
function baseOfThird(w){
  if(w === "is") return "be";
  if(w === "has") return "have";
  if(w === "does") return "do";
  if(w === "goes") return "go";
  const s = singularise(w);
  return s;
}
function pastOf(base){
  if(IRREGULAR_VERBS[base]) return IRREGULAR_VERBS[base][0];
  if(endsWith(base,"e")) return base + "d";
  if(/[^aeiou]y$/.test(base)) return base.slice(0,-1) + "ied";
  return base + "ed";
}
function participleOf(base){
  if(IRREGULAR_VERBS[base]) return IRREGULAR_VERBS[base][1];
  return pastOf(base);
}
function ingOf(base){
  if(base === "be") return "being";
  if(/[^aeiou]e$/.test(base)) return base.slice(0,-1) + "ing";
  return base + "ing";
}

function isBaseVerb(w){ return ALL_BASE_VERBS.has(w); }
function isThirdPersonVerb(w){
  if(!endsWith(w,"s") || S_ENDING_SINGULAR.has(w)) return false;
  const b = baseOfThird(w);
  return ALL_BASE_VERBS.has(b);
}
function isIngForm(w){ return endsWith(w,"ing") && w.length > 4 && DICTIONARY.has(w); }
function isPastForm(w){
  if(IRREG_PAST.has(w)) return true;
  if(!endsWith(w,"ed")) return false;
  const stem = w.slice(0,-2);
  return ALL_BASE_VERBS.has(stem) || ALL_BASE_VERBS.has(stem + "e") ||
         ALL_BASE_VERBS.has(stem.replace(/i$/,"y")) ||
         (stem.length>2 && stem[stem.length-1]===stem[stem.length-2] && ALL_BASE_VERBS.has(stem.slice(0,-1)));
}
function baseOfPast(w){
  for(const b in IRREGULAR_VERBS){
    if(IRREGULAR_VERBS[b][0] === w || IRREGULAR_VERBS[b][1] === w) return b;
  }
  if(endsWith(w,"ed")){
    const stem = w.slice(0,-2);
    if(ALL_BASE_VERBS.has(stem)) return stem;
    if(ALL_BASE_VERBS.has(stem + "e")) return stem + "e";
    const y = stem.replace(/i$/,"y");
    if(ALL_BASE_VERBS.has(y)) return y;
    if(stem.length>2 && stem[stem.length-1]===stem[stem.length-2] && ALL_BASE_VERBS.has(stem.slice(0,-1))) return stem.slice(0,-1);
    return stem;
  }
  return w;
}
function baseOfIng(w){
  if(!endsWith(w,"ing")) return w;
  const stem = w.slice(0,-3);
  if(ALL_BASE_VERBS.has(stem)) return stem;
  if(ALL_BASE_VERBS.has(stem + "e")) return stem + "e";
  if(stem.length>2 && stem[stem.length-1]===stem[stem.length-2] && ALL_BASE_VERBS.has(stem.slice(0,-1))) return stem.slice(0,-1);
  return stem;
}
function isAdjective(w){
  if(COMMON_ADJECTIVES.has(w)) return true;
  if(isBaseVerb(w) || isThirdPersonVerb(w)) return false;
  return /(ous|ful|ive|able|ible|less|ish|al|ic|ary)$/.test(w) && DICTIONARY.has(w);
}
function isAdverb(w){
  return COMMON_ADVERBS.has(w) || (endsWith(w,"ly") && DICTIONARY.has(w) && !COMMON_ADJECTIVES.has(w));
}
function isPluralNoun(w){
  if(IRREGULAR_PLURALS.has(w)) return true;
  if(!endsWith(w,"s") || endsWith(w,"ss") || endsWith(w,"us") || endsWith(w,"is")) return false;
  if(S_ENDING_SINGULAR.has(w) || PRONOUNS.has(w) || BE_FORMS.has(w) || HAVE_FORMS.has(w) || DO_FORMS.has(w) || w === "goes") return false;
  const sing = singularise(w);
  return sing.length > 1 && DICTIONARY.has(sing);
}
// A word that can head a noun phrase: not a verb, not a function word.
function isNounish(w){
  if(!DICTIONARY.has(w)) return false;
  if(PRONOUNS.has(w) || DETERMINERS.has(w) || PREPOSITIONS.has(w) || MODALS.has(w)) return false;
  if(BE_FORMS.has(w) || HAVE_FORMS.has(w) || DO_FORMS.has(w) || CONJUNCTIONS.has(w)) return false;
  if(COMMON_ADVERBS.has(w) || isAdverb(w)) return false;
  if(COMMON_ADJECTIVES.has(w)) return false;
  if(isIngForm(w) || isPastForm(w)) return false;
  if(isBaseVerb(w) && !isPluralNoun(w)) return false;
  return true;
}
function isFiniteVerb(w){
  return BE_FORMS.has(w) || HAVE_FORMS.has(w) || DO_FORMS.has(w) || MODALS.has(w) ||
         isThirdPersonVerb(w) || isPastForm(w) || isBaseVerb(w);
}
