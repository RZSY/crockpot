// ===============================================================
// 6. GRAMMAR / PUNCTUATION / STYLE RULES
// ===============================================================

const DANGLING_PERSON_HEADS = S(`
  i he she we they you who man men woman women person people boy boys girl girls
  child children doctor doctors teacher teachers student students manager managers
  worker workers officer officers friend friends dog dogs cat cats driver drivers
  passenger passengers police author authors writer writers reader readers someone anyone
  everyone nobody somebody anybody animal animals bird birds horse horses baby babies
  expert experts researcher researchers patient patients guest guests client clients
  colleague colleagues member members player players leader leaders boss bosses
`);
const DANGLING_PAST_PART = S("exhausted shocked surprised confused frightened alarmed amazed excited bored annoyed worried pleased satisfied disappointed tired");
const PREPOSITIONAL_INGS = S("during according following regarding concerning pending considering including excluding notwithstanding touching respecting barring");
const INFINITIVE_DISCOURSE = S("honest fair sure frank plain brief truth date repeat begin start summarize summarise conclude recap clarify");
const INVARIANT_PAST_VERBS = S("read cut put set let hit hurt shut cost spread split quit burst cast shed upset beat fit");
const SINGULAR_COMPOUND_UNITS = S("bread-and-butter bacon-and-eggs fish-and-chips rock-and-roll peace-and-quiet wear-and-tear trial-and-error law-and-order");

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
// --- reversing "-er"/"-est" back to the base adjective --------------------
// Handles the three regular spelling changes so the doubled-comparative
// check below isn't limited to a short hardcoded list: consonant doubling
// (sad -> sadder), dropping a silent e (fine -> finer), and y -> i
// (happy -> happier), on top of the plain suffix (fast -> faster). Every
// candidate is checked against the real adjective list before being
// accepted, so a coincidental "-er"/"-est" ending on an unrelated word
// (offer, sober, modest) never produces a false match.
function comparativeBaseCandidates(w, suffix){
  const stripped = w.slice(0, -suffix.length);
  const candidates = [stripped, stripped + "e"];
  if(suffix === "er" && /ier$/.test(w)) candidates.push(w.slice(0,-3)+"y");
  if(suffix === "est" && /iest$/.test(w)) candidates.push(w.slice(0,-4)+"y");
  if(stripped.length > 2 && stripped[stripped.length-1] === stripped[stripped.length-2]){
    candidates.push(stripped.slice(0,-1));
  }
  return candidates;
}
function baseOfComparative(w){
  if(!/er$/.test(w) || w.length < 4) return undefined;
  return comparativeBaseCandidates(w,"er").find(c =>
    c.length > 2 && (COMMON_ADJECTIVES.has(c) || (DICTIONARY.has(c) && isAdjective(c))));
}
function baseOfSuperlative(w){
  if(!/est$/.test(w) || w.length < 5) return undefined;
  return comparativeBaseCandidates(w,"est").find(c =>
    c.length > 2 && (COMMON_ADJECTIVES.has(c) || (DICTIONARY.has(c) && isAdjective(c))));
}
// --- irregular-plural and person-noun data for the rules further down ----
const IRREGULAR_PLURAL_MISTAKES = {
  mans:"men", mouses:"mice", gooses:"geese", foots:"feet", deers:"deer",
  tooths:"teeth", oxes:"oxen", fishs:"fish", sheeps:"sheep", cactuses:"cacti"
};
const PERSON_NOUNS = S("person people man men woman women boy boys girl girls child children kid kids baby babies student students teacher teachers friend friends driver drivers doctor doctors nurse nurses worker workers employee employees customer customers player players member members colleague colleagues neighbour neighbours neighbor neighbors parent parents mother mothers father fathers brother brothers sister sisters son sons daughter daughters manager managers officer officers scientist scientists artist artists author authors writer writers engineer engineers lawyer lawyers farmer farmers soldier soldiers king queen kings queens");
const SUBJ_PRONOUNS_FOR_WHAT = S("i you he she it we they");

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

const NUMBER_WORDS = S("one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred thousand million billion first second third last next other same only very such more less");
const INTERJECTIONS = S("yes yeah yep nope well please okay ok hey oh ah wow alright hi hello thanks cheers right so now");
const QUANTIFIER_HEADS = S("rest remainder half number couple lot bunch handful none all some any most few several plenty variety range series percentage proportion minority majority dozen pair set group total sort kind type");
const QUANT_PLURAL_THERE = S("many several few both lots two three four five six seven eight nine ten dozens hundreds thousands millions numerous various multiple");
const SG_QUANT = S("one each either neither anyone anybody everyone everybody someone somebody nobody none much little");
const PL_QUANT = S("two three four five six seven eight nine ten eleven twelve dozens hundreds thousands millions many several few both couple numerous plenty");
const AGREES_WITH_NOUN = S("all some most half any lot lots rest remainder majority minority percentage proportion");
const OF_ADJECTIVES = S("fond aware unaware ashamed devoid worthy deserving ignorant tolerant intolerant wary leery");
const PLURAL_QUANTIFIER = S("few couple number lot handful dozen majority minority variety range host series bunch load pair set");
const SWEET_CONTEXT = S("food menu course spoon wine chocolate pudding cake ice cream sweet meal cream tart trolley");
const ARID_CONTEXT = S("sun sand storm island dry arid dunes camel oasis nomad heat");
const ADAPT_CONTEXT = S("book novel film movie screenplay play story");
const ADOPT_CONTEXT = S("child puppy kitten pet orphan dog cat baby");
const NOUN_FORM = { practise:"practice", license:"licence", advise:"advice", prophesy:"prophecy", devise:"device" };
const VERB_FORM = { practice:"practise", licence:"license", advice:"advise", prophecy:"prophecy", device:"devise" };
const POSSESS = S("my our your his her its their whose");
const INF_TRIGGER = S("to want wants wanted need needs needed try tries tried going like likes liked decide decides decided plan plans planned hope hopes hoped intend intends intended choose chose refuse refuses refused agree agrees agreed learn learns learned manage manages managed continue continues continued");
const BUY_VERBS = S("buy buys bought order orders ordered purchase purchases purchased stock stocks stocked supply supplies supplied office");
const STILL_VERBS = S("remained remain remains stayed stay stays kept keep keeps was were is are stood standing");
const PRAISE_VERBS = S("pay pays paid give gives gave receive receives received return returns returned");
const SEPARATE_NOUNS = S("units unit steps step parts part categories category values value items item chunks packets stages blocks components");
const LEGAL = S("legal wise sound seek seeks sought seeking offer offers offered independent expert");
const CIVIC = S("city town county local borough parish district village county");
const MORE_NOUNS = S("information details notice questions research discussion work study reading notes comment enquiries");
const SUBORDINATORS = S("if when whenever while although though because since unless until after before as once whereas whether given assuming during despite provided than where who which that having");
const MANY_SEVERAL_PLURAL_SET = S("many few several both these those two three four five six seven eight nine ten");
const WHAT_NOUNS_SET = S("thing things stuff one item object");
const DETERMINER_LEAD_SET = S("the a an this that my our his her their each every one both");
const SUBJ_PRONOUNS_SET = S("i you he she it we they");
const OPINION_VERBS_SET = S("think guess suppose hope believe mean know said says");
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
// Single-pass phrase lookup index
const PHRASE_INDEX = new Map();
function buildGrammarPhraseIndex(){
  const addP = (phrase, type, extra, why) => {
    const parts = phrase.split(" ");
    const first = parts[0];
    let list = PHRASE_INDEX.get(first);
    if(!list){ list = []; PHRASE_INDEX.set(first, list); }
    list.push({ parts, len: parts.length, type, extra, why });
  };
  WORDY_PHRASES.forEach(([phrase, better]) => addP(phrase, "wordy", better));
  REDUNDANCIES.forEach(([phrase, better]) => addP(phrase, "redundant", better));
  IDIOM_FIXES.forEach(([phrase, better, why]) => addP(phrase, "idiom", better, why));
  HYPHENATE.forEach(([phrase, hyphened]) => addP(phrase, "hyphen", hyphened));
}
buildGrammarPhraseIndex();

const INVENTED_NOUN_PLURALS = {
  childs: "children", gooses: "geese", oxes: "oxen", knifes: "knives", leafs: "leaves",
  sheeps: "sheep", deers: "deer", foots: "feet", tooths: "teeth", mouses: "mice",
  mans: "men", womans: "women", busses: "buses", evidences: "evidence", rices: "rice",
  breads: "bread", equipments: "equipment", furnitures: "furniture", informations: "information",
  advices: "advice", luggages: "luggage", baggages: "baggage", homeworks: "homework", houseworks: "housework"
};

function grammarIssues(text, tokens, sentences, add){
  const n = tokens.length;
  const lw = i => (i>=0 && i<n) ? tokens[i].lw : "";
  const raw = i => (i>=0 && i<n) ? tokens[i].raw : "";
  // contiguous = nothing but spaces between the two tokens
  const contig = i => i>=0 && i<n-1 && /^[ \t]*$/.test(text.slice(tokens[i].end, tokens[i+1].start));
  const sameSentence = (i,j) => i>=0 && j>=0 && i<n && j<n && tokens[i].s === tokens[j].s;
  const sentStart = i => i>=0 && i<n && tokens[i].i === 0;
  const prevW = (idx, off = 1) => (idx >= off && sameSentence(idx - off, idx)) ? lw(idx - off) : "";
  const prevContig = (idx, off = 1) => idx >= off && sameSentence(idx - off, idx) && /^[ \t]*$/.test(text.slice(tokens[idx - off].end, tokens[idx].start));

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
  // Sentence-openers that are neither a pronoun nor a determiner but are
  // also not a fresh noun subject, for the bare-subject check further down.
  function headNounAfter(i){
    let j = i+1, guard = 0;
    while(j < n && guard < 4 && contig(j-1) &&
          (NUMBER_WORDS.has(lw(j)) || isAdjective(lw(j)) || isAdverb(lw(j)) || /^[0-9]+$/.test(lw(j)))){ j++; guard++; }
    if(j >= n || !contig(j-1) || !sameSentence(i, j)) return -1;
    const h = lw(j);
    if(!DICTIONARY.has(h)) return -1;
    if(PRONOUNS.has(h) || PREPOSITIONS.has(h) || MODALS.has(h) || CONJUNCTIONS.has(h) ||
       BE_FORMS.has(h) || HAVE_FORMS.has(h) || DO_FORMS.has(h) || DETERMINERS.has(h) ||
       QUANTIFIER_HEADS.has(h) || COLLECTIVE.has(h) || INVARIANT_PLURALS.has(h) ||
       h.indexOf("'") !== -1) return -1; // a contraction ("don't", "isn't") is never the subject noun
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
    const p1 = prevW(i, 1), p2 = prevW(i, 2);
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
      // "an advice" / "a progress" — mass nouns aren't counted one at a
      // time, so they never take "a"/"an" in the first place.
      if(h === i+1 && UNCOUNTABLE.has(lw(h))){
        const n2 = lw(i+2);
        const isNounAdjunct = i+2 < n && isNounish(n2) && !isAdverb(n2) && !/^(today|yesterday|tomorrow|this|next|last|there|here|again|already|now|soon|too|at|for|in|on|with|by|from|to)$/.test(n2);
        if(!isNounAdjunct){
          add({ cat:"grammar", rule:"art-uncountable", severity:"critical", ...span(i,i+1),
            suggestions:[raw(i+1), "some "+lw(i+1), "a piece of "+lw(i+1)], title:"Article with an uncountable noun",
            why:'"'+raw(h)+'" isn\'t counted one at a time, so it takes no article — or "some" — rather than "'+w+'".' });
        }
      }
    }
    // "many"/"several"/"fewer" + an uncountable noun — these count things
    // one by one, which is exactly what a mass noun can't be done to.
    if((w === "many" || w === "several" || w === "fewer") && next && UNCOUNTABLE.has(w1) && !isAdjective(w1)){
      const fix = { many:"much", several:"some", fewer:"less" }[w];
      add({ cat:"grammar", rule:"quant-uncountable", severity:"critical", ...span(i,i),
        suggestions:[sub(i,fix)], title:'"'+w+'" doesn\'t fit an uncountable noun',
        why:'"'+raw(i+1)+'" isn\'t counted one by one, so this wants "'+fix+'" rather than "'+w+'".' });
    }
    // this/that + plural, these/those + singular
    if(w === "this" || w === "that" || w === "these" || w === "those" || w === "every" || w === "each" || w === "both"){
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
        } else if(w === "both" && !plural && !UNCOUNTABLE.has(lw(h)) && !isIngForm(lw(h)) && !/^[A-Z]/.test(raw(h))){
          add({ cat:"grammar", rule:"det-number", severity:"critical", ...span(h,h),
            suggestions:[sub(h, pluralise(lw(h)))], title:'"Both" takes a plural noun',
            why:'"Both" refers to two things, so the noun after it is plural: "'+pluralise(lw(h))+'".' });
        }
      }
    }
    // A handful of irregular plurals (man/goose/mouse/foot/deer...) also
    // happen to be real dictionary words in some other role — "mans" and
    // "foots" as rare verbs, "deers" as a stray variant — so the spellchecker
    // never flags them. Only treat one as the wrong plural when a word that
    // calls for a plural noun sits right in front of it.
    if(IRREGULAR_PLURAL_MISTAKES[w1] && next &&
       (NUMBER_WORDS.has(w) || MANY_SEVERAL_PLURAL_SET.has(w))){
      add({ cat:"grammar", rule:"irregular-plural", severity:"critical", ...span(i+1,i+1),
        suggestions:[sub(i+1, IRREGULAR_PLURAL_MISTAKES[w1])], title:"Irregular plural",
        why:'The plural of "'+singularise(w1)+'" is "'+IRREGULAR_PLURAL_MISTAKES[w1]+'", not "'+w1+'".' });
    }
    // "which"/"what" used where English wants "who"/"that" — "which" never
    // takes a person as its antecedent, and "what" doesn't introduce a
    // relative clause in Standard English ("the thing what I need").
    if(w1 === "which" && next && PERSON_NOUNS.has(w)){
      add({ cat:"grammar", rule:"rel-pronoun", severity:"critical", ...span(i+1,i+1),
        suggestions:[sub(i+1,"who")], title:'"Which" doesn\'t refer to people',
        why:'"'+raw(i)+'" is a person, so the relative clause needs "who" rather than "which".' });
    } else if(w1 === "what" && next && i+2 < n && SUBJ_PRONOUNS_FOR_WHAT.has(lw(i+2)) &&
              contig(i+1) && WHAT_NOUNS_SET.has(w)){
      // Deliberately a small, explicit noun list rather than the general
      // isNounish() check: "what" after a genuine noun ("the thing what I
      // need") is the nonstandard pattern, but isNounish() also accepts
      // inflected verb forms it doesn't specifically recognise (e.g.
      // "knows"), and "she knows what she wants" is an ordinary, correct
      // embedded question that must never be touched.
      add({ cat:"grammar", rule:"rel-pronoun", severity:"critical", ...span(i+1,i+1),
        suggestions:[sub(i+1,"that")], title:'"What" doesn\'t introduce a relative clause',
        why:'Standard English uses "that" (or nothing) here, not "what", to say more about "'+raw(i)+'".' });
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
      const isSecondInCompound = (p1 === "and" && prevContig(i, 1));
      const isObjectPosition = (p1 !== "" && (PREPOSITIONS.has(p1) || (isFiniteVerb(p1) && !MODALS.has(p1) && !DO_FORMS.has(p1))));
      const sn = sentences[tokens[i].s];
      const sentStartAux = (sn && sn.tokStart < n && /^(do|does|did|can|could|will|would|shall|should|may|might|must)$/.test(tokens[sn.tokStart].lw));
      const INVARIANT_PAST = S("read put cost cut hit hurt quit set shut spread split cast bid burst");

      const subjSg = !isSecondInCompound && !isObjectPosition && (SUBJ_PRON_SG3.has(w) || INDEF_SG.has(w) || w === "this");
      const subjPl = !isObjectPosition && (SUBJ_PRON_PL.has(w) || (isSecondInCompound && (SUBJ_PRON_SG3.has(w) || w === "i")));
      const fixMap = { are:"is", were:"was", have:"has", do:"does", "don't":"doesn't",
                       "aren't":"isn't", "weren't":"wasn't", "haven't":"hasn't" };
      const fixMapPl = { is:"are", was:"were", has:"have", does:"do", "doesn't":"don't",
                         "isn't":"aren't", "wasn't":"weren't", "hasn't":"haven't" };
      if(subjSg && fixMap[w1] && !(w1 === "have" && w2 === "to")){
        add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, fixMap[w1])], title:"Subject and verb don't agree",
          why:'"'+raw(i)+'" is singular, so it takes "'+fixMap[w1]+'".' });
      } else if(subjPl && fixMapPl[w1] && !isSecondInCompound){
        add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, fixMapPl[w1])], title:"Subject and verb don't agree",
          why:'"'+raw(i)+'" is plural, so it takes "'+fixMapPl[w1]+'".' });
      } else if(w === "i" && raw(i) === "I" && !isSecondInCompound){
        const iFix = { is:"am", are:"am", has:"have", does:"do", "isn't":"am not",
                       "doesn't":"don't", "hasn't":"haven't" };
        if(iFix[w1] && !(w1 === "were" )){
          add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
            suggestions:[iFix[w1]], title:"Subject and verb don't agree",
            why:'"I" takes "'+iFix[w1]+'".' });
        }
      }
      // he/she/it/everyone + bare verb -> third person -s  ("he go to work")
      const isTemporalLast = (w1 === "last" && /^(week|month|year|night|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.test(w2));
      if(!isSecondInCompound && !isObjectPosition && !sentStartAux && !INVARIANT_PAST.has(w1) && !isTemporalLast &&
         (SUBJ_PRON_SG3.has(w) || INDEF_SG.has(w)) && isBaseVerb(w1) && !MODALS.has(w1) && !BE_FORMS.has(w1) &&
         !HAVE_FORMS.has(w1) && !DO_FORMS.has(w1) && !isPluralNoun(w1) && w1 !== "need" &&
         !PREPOSITIONS.has(w1) && !isNounish(w1)){
        add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, thirdPerson(w1))], title:"Verb needs a third-person ending",
          why:'With "'+raw(i)+'" the verb takes -s: "'+thirdPerson(w1)+'".' });
      }
      // "this" + bare verb -> third person -s ("this happen a lot").
      if(!isObjectPosition && w === "this" && isBaseVerb(w1) && !MODALS.has(w1) && !BE_FORMS.has(w1) &&
         !HAVE_FORMS.has(w1) && !DO_FORMS.has(w1) && !isPluralNoun(w1) && w1 !== "need" &&
         !PREPOSITIONS.has(w1) && !isNounish(w1) && !isTemporalLast &&
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
    // ---------------------------------------------------------------
    // BARE SUBJECT AT THE START OF A SENTENCE — a name ("Sarah has..."),
    // or a plural/mass noun used generically ("Dogs bark", "Coffee helps").
    // Restricted to sentence-initial position: with no determiner to lean
    // on, a noun spotted mid-sentence is far more likely to be an object,
    // or the tail of a longer phrase, than a fresh subject — exactly the
    // ambiguity a determiner or "both of X" resolves for the rules above.
    if(sentStart(i) && next && !PRONOUNS.has(w) && !DETERMINERS.has(w) &&
       !PREPOSITIONS.has(w) && !CONJUNCTIONS.has(w) && !MODALS.has(w) &&
       !BE_FORMS.has(w) && !HAVE_FORMS.has(w) && !DO_FORMS.has(w) &&
       !INTERJECTIONS.has(w) && w.indexOf("'") === -1){
      const capitalName = /^[A-Z]/.test(raw(i)) && !DICTIONARY.has(w);
      const bareNoun = !capitalName && isNounish(w) && !COLLECTIVE.has(w) && !isAdjective(w);
      if(capitalName || bareNoun){
        const plural = bareNoun && isPluralNoun(w) && !UNCOUNTABLE.has(w);
        const vb = w1;
        if(!plural){
          const fix = { are:"is", were:"was", have:"has", do:"does" }[vb];
          if(fix){
            add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
              suggestions:[sub(i+1, fix)], title:"Subject and verb don't agree",
              why:'"'+raw(i)+'" is singular, so it takes "'+fix+'".' });
          } else if(isBaseVerb(vb) && !MODALS.has(vb) && !BE_FORMS.has(vb) && !HAVE_FORMS.has(vb) &&
                    !DO_FORMS.has(vb) && !isPluralNoun(vb) && vb !== "need" && !INVARIANT_PAST_VERBS.has(vb) &&
                    !PREPOSITIONS.has(vb) && !isNounish(vb)){
            add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(i+1,i+1),
              suggestions:[sub(i+1, thirdPerson(vb))], title:"Verb needs a third-person ending",
              why:'"'+raw(i)+'" is singular, so the verb takes -s: "'+thirdPerson(vb)+'".' });
          }
        } else {
          const fix = { is:"are", was:"were", has:"have", does:"do" }[vb];
          if(fix){
            add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(i+1,i+1),
              suggestions:[sub(i+1, fix)], title:"Subject and verb don't agree",
              why:'"'+raw(i)+'" is plural, so it takes "'+fix+'".' });
          } else if(looksLikeVerbS(vb) && !BE_FORMS.has(vb) && !HAVE_FORMS.has(vb) && !DO_FORMS.has(vb)){
            const base = baseOfThird(vb);
            if(ALL_BASE_VERBS.has(base)){
              add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(i+1,i+1),
                suggestions:[sub(i+1, base)], title:"Verb shouldn't take -s here",
                why:'"'+raw(i)+'" is plural, so the verb stays as "'+base+'".' });
            }
          }
        }
      }
    }
    // there/here is/are
    if((w === "there" || w === "here") && next && (w1 === "is" || w1 === "was" || w1 === "'s")){
      let j = i+2, guard = 0;
      while(j < n && guard < 4 && (DETERMINERS.has(lw(j)) === false && isAdjective(lw(j)))){ j++; guard++; }
      const head = lw(j);
      if((QUANT_PLURAL_THERE.has(lw(i+2)) || QUANT_PLURAL_THERE.has(head)) ||
         (isPluralNoun(head) && isNounish(head) && !UNCOUNTABLE.has(singularise(head)))){
        add({ cat:"grammar", rule:"there-agree", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, w1 === "was" ? "were" : "are")], title:'"'+raw(i)+'" agrees with what follows it',
          why:'What follows is plural, so it takes "'+lw(i)+' '+(w1==="was"?"were":"are")+'".' });
      }
    }
    // "one of the reports is" vs "three of the reports are".
    // In a phrase like "X of the Ys", it is X — not the nearest noun — that
    // fixes the number of the verb, which is exactly where nearest-noun
    // checkers get it wrong in both directions.
    if(w === "of" && next && i > 0 && contig(i-1) && sameSentence(i-1, i)){
      const q = lw(i-1);
      // Predicate adjectives that take "of" ("fond of", "aware of") and
      // read, without a "who is"/"which are" in front of them, exactly like
      // a reduced relative clause ("people fond of animals are kind"). Most
      // adjectives before "of" are already caught by the general adjective
      // check below; this covers the short, common ones — mostly missing a
      // recognisable suffix — that check does not.
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
    if(w === "there" && next && (w1 === "are" || w1 === "were") &&
       (lw(i+2) === "a" || lw(i+2) === "an" || lw(i+2) === "one") && !PLURAL_QUANTIFIER.has(lw(i+3))){
      add({ cat:"grammar", rule:"there-agree", severity:"critical", ...span(i+1,i+1),
        suggestions:[sub(i+1, w1 === "were" ? "was" : "is")], title:'"There" agrees with what follows it',
        why:'"'+raw(i+2)+'" introduces a single thing, so it takes "there '+(w1==="were"?"was":"is")+'".' });
    }
    // determiner + plural noun + verb  ("the dogs is barking", "the dogs runs")
    // A noun sitting inside a prepositional phrase is never the subject, so
    // "each of the students has" and "a box of chocolates is" are left alone.
    if(DETERMINERS.has(w) && w !== "this" && w !== "that" && next && !inPrepPhrase(i)){
      const h = headNounAfter(i);
      if(h > 0 && contig(h) && headIsPlural(h) && !UNCOUNTABLE.has(lw(h)) && !S_ENDING_SINGULAR.has(lw(h))){
        const vb = lw(h+1);
        const fix = { is:"are", was:"were", has:"have", does:"do" }[vb];
        if(fix){
          add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(h+1,h+1),
            suggestions:[sub(h+1, fix)], title:"Subject and verb don't agree",
            why:'"'+raw(h)+'" is plural, so it takes "'+fix+'".' });
        } else if(sentStart(i) && looksLikeVerbS(vb) && !BE_FORMS.has(vb) && !HAVE_FORMS.has(vb) && !DO_FORMS.has(vb)){
          // an ordinary lexical verb wrongly carrying the -s that only a
          // singular subject takes ("the dogs runs"). Restricted to a
          // clause-opening noun phrase: past the first few words, a
          // determiner phrase is at least as likely to be an object as a
          // subject, and the word after it then need not be a verb at all.
          const base = baseOfThird(vb);
          if(ALL_BASE_VERBS.has(base)){
            add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(h+1,h+1),
              suggestions:[sub(h+1, base)], title:"Verb shouldn't take -s here",
              why:'"'+raw(h)+'" is plural, so the verb stays as "'+base+'".' });
          }
        }
      }
    }
    // compound subject: "the manager and I was", "Tom and she is", "Sarah and Ali calls"
    const leftIsNoun = i > 0 && prevContig(i) && (isNounish(prevW(i, 1)) || PRONOUNS.has(prevW(i, 1)) || /^[A-Z]/.test(raw(i-1)));
    if(w === "and" && next && leftIsNoun){
      let j = -1;
      if(PRONOUNS.has(w1) && contig(i+1)) j = i+2;
      else if((isNounish(w1) || /^[A-Z]/.test(raw(i+1))) && contig(i+1)) j = i+2;
      else if(DETERMINERS.has(w1) && contig(i+1) && isNounish(w2) && contig(i+2)) j = i+3;
      if(j > 0 && sameSentence(i, j)){
        const compoundText = text.slice(tokens[i-1].start, tokens[j-1].end).toLowerCase().replace(/\s+/g, "-");
        if(!SINGULAR_COMPOUND_UNITS.has(compoundText)){
          const vj = lw(j);
          const fix = { is:"are", was:"were", has:"have", "isn't":"aren't", "wasn't":"weren't" }[vj];
          if(fix){
            add({ cat:"grammar", rule:"compound-subject", severity:"critical", ...span(j,j),
              suggestions:[sub(j, fix)], title:"Two subjects joined by \u201cand\u201d are plural",
              why:'"'+text.slice(tokens[i-1].start, tokens[j-1].end)+'" is more than one thing, so the verb is "'+fix+'".' });
          } else if(looksLikeVerbS(vj) && !BE_FORMS.has(vj) && !HAVE_FORMS.has(vj) && !DO_FORMS.has(vj)){
            const b = baseOfThird(vj);
            if(ALL_BASE_VERBS.has(b)){
              add({ cat:"grammar", rule:"compound-subject", severity:"critical", ...span(j,j),
                suggestions:[sub(j, b)], title:"Two subjects joined by \u201cand\u201d are plural",
                why:'"'+text.slice(tokens[i-1].start, tokens[j-1].end)+'" is more than one thing, so the verb stays as "'+b+'".' });
            }
          }
        }
      }
    }
    // "Tom and me left early", "Mei Ling and me joined the team"
    if(w === "and" && w1 === "me" && contig(i+1) && i > 0 && sameSentence(i-1, i) && i+2 < n && sameSentence(i, i+2)){
      const p = lw(i-1);
      const isSubjCandidate = (/^[A-Z]/.test(raw(i-1)) || /^(he|she|they|we|you)$/.test(p)) &&
                              (sentStart(i-1) || (i >= 2 && sentStart(i-2) && /^[A-Z]/.test(raw(i-2))));
      const nextV = lw(i+2);
      if(isSubjCandidate && (isFiniteVerb(nextV) || isPastForm(nextV) || IRREG_PAST.has(nextV) || looksLikeVerbS(nextV) || BE_FORMS.has(nextV) || HAVE_FORMS.has(nextV))){
        add({ cat:"grammar", rule:"subject-pronoun", severity:"critical", ...span(i+1, i+1),
          suggestions:[sub(i+1, "I")], title:'Use "I" as part of the subject',
          why:'"Me" is an object pronoun; as part of the subject it should be "I": "'+raw(i-1)+' and I".' });
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
    // singular noun (including an uncountable one — mass nouns are
    // grammatically singular too: "the traffic was bad") + a verb that only
    // agrees with a plural subject. Collectives are exempt, because British
    // English happily says "the team are winning".
    if(DETERMINER_LEAD_SET.has(w) && next){
      const h = headNounAfter(i);
      if(h > 0 && contig(h) && !headIsPlural(h) &&
         lw(h+2) !== "and" && !(h+2 < n && lw(h+2) === "of")){
        const vb = lw(h+1);
        const fix = { are:"is", were:"was", have:"has", do:"does" }[vb];
        // A noun phrase embedded straight after a preposition ("students
        // in the classroom have...") is a modifier, not the subject, so
        // the word right after it need not be its verb at all — unless the
        // noun is uncountable, in which case it takes a singular verb
        // wherever it sits ("none of the information was..."), so the fix
        // holds regardless of what the real subject turns out to be.
        if(fix && (!inPrepPhrase(i) || UNCOUNTABLE.has(lw(h)))){
          add({ cat:"grammar", rule:"sv-agree", severity:"critical", ...span(h+1,h+1),
            suggestions:[sub(h+1, fix)], title:"Subject and verb don't agree",
            why:'"'+raw(h)+'" is singular, so it takes "'+fix+'".' });
        } else if(sentStart(i) && !inPrepPhrase(i) && isBaseVerb(vb) && !MODALS.has(vb) && !BE_FORMS.has(vb) && !HAVE_FORMS.has(vb) &&
                  !DO_FORMS.has(vb) && !isPluralNoun(vb) && vb !== "need" &&
                  !PREPOSITIONS.has(vb) && !isNounish(vb) &&
                  !(h + 2 < n && isFiniteVerb(lw(h + 2))) &&
                  !S("read put cost cut hit hurt quit set shut spread split cast bid burst").has(vb)){
          // an ordinary lexical verb left bare when the singular subject
          // needs the third-person -s ("the dog run fast"). Restricted to
          // a clause-opening, non-embedded noun phrase for the same reason
          // as above, plus: skip a noun phrase that is itself the object of
          // "of" ("one of my friend"), where the word after it answers to
          // the quantifier before "of", not to this noun.
          add({ cat:"grammar", rule:"sv-agree-s", severity:"critical", ...span(h+1,h+1),
            suggestions:[sub(h+1, thirdPerson(vb))], title:"Verb needs a third-person ending",
            why:'"'+raw(h)+'" is singular, so the verb takes -s: "'+thirdPerson(vb)+'".' });
        }
      }
    }

    // ---------------------------------------------------------------
    // VERB FORMS
    // ---------------------------------------------------------------
    // invented irregular past ("bringed", "winned", "builded", "feeled", "seed")
    if(INVENTED_IRREGULAR_PAST[w]){
      const sug = INVENTED_IRREGULAR_PAST[w];
      add({ cat:"grammar", rule:"irregular-past", severity:"critical", ...span(i,i),
        suggestions:[matchCase(raw(i), sug)], title:"Irregular verb form",
        why:'"'+raw(i)+'" is not the standard past form; use "'+sug+'".' });
    }
    if(INVENTED_NOUN_PLURALS[w]){
      const prev = p1;
      const isNounPos = (p1 !== "" && (DETERMINERS.has(prev) || PREPOSITIONS.has(prev) || /^(two|three|four|five|six|seven|eight|nine|ten|many|several|some|more|few|lot|useful|count|counted|of|no)$/.test(prev) || isAdjective(prev))) ||
                        (next && (w1 === "were" || w1 === "are" || w1 === "have" || w1 === "was" || isPastForm(w1)));
      if(isNounPos){
        const fix = INVENTED_NOUN_PLURALS[w];
        add({ cat:"grammar", rule:"irregular-plural", severity:"critical", ...span(i,i),
          suggestions:[matchCase(raw(i), fix)], title:"Irregular plural form",
          why:'The standard plural form is "'+fix+'", not "'+raw(i)+'".' });
      }
    }
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
    if((MODALS.has(w) || w === "ought") && next && w1 === "of" && !(w === "can" && p1 !== "" && (DETERMINERS.has(p1) || isAdjective(p1)))){
      add({ cat:"grammar", rule:"modal-of", severity:"critical", ...span(i+1,i+1),
        suggestions:[sub(i+1,"have")], title:'"Of" should be "have"',
        why:'This is the contraction "'+w+"'ve"+'" misheard — the word is "have".' });
    }
    // have/has/had (+ an adverb) + past tense or base where a participle is needed
    const isHaveAux = HAVE_FORMS.has(w) || w === "haven't" || w === "hasn't" || w === "hadn't";
    if(isHaveAux && w !== "having" && next){
      const SKIPPABLE = S("ever never just already always still recently probably certainly really actually only also nearly almost i you he she it we they");
      let k = -1;
      let partFix = null;
      for(let j=i+1; j<=i+3 && j<n && contig(j-1) && sameSentence(i,j); j++){
        const wj = lw(j);
        if(PAST_TO_PARTICIPLE[wj]){ k = j; partFix = PAST_TO_PARTICIPLE[wj]; break; }
        if(IRREGULAR_VERBS[wj] && IRREGULAR_VERBS[wj][1] !== wj && !COMMON_ADJECTIVES.has(wj)){
          k = j; partFix = IRREGULAR_VERBS[wj][1]; break;
        }
        if(!SKIPPABLE.has(wj)) break;
      }
      if(k > 0 && partFix){
        add({ cat:"grammar", rule:"perfect-participle", severity:"critical", ...span(k,k),
          suggestions:[sub(k, partFix)], title:"Wrong verb form after have/has/had",
          why:'The perfect tense takes the past participle: "'+w+" "+partFix+'".' });
      }
    }
    // be + past tense where participle is needed in passive voice ("the bus was took -> taken")
    if(BE_FORMS.has(w) && next && (w === "was" || w === "were" || w === "is" || w === "are" || w === "been" || w === "being")){
      if(PAST_TO_PARTICIPLE[w1]){
        add({ cat:"grammar", rule:"passive-participle", severity:"critical", ...span(i+1,i+1),
          suggestions:[sub(i+1, PAST_TO_PARTICIPLE[w1])], title:"Wrong verb form in passive voice",
          why:'Passive voice takes the past participle: "'+w+" "+PAST_TO_PARTICIPLE[w1]+'".' });
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
       !BE_FORMS.has(p1) && !HAVE_FORMS.has(p1)){
      let k = -1;
      for(let j=i+1; j<=i+3 && j<n && contig(j-1) && sameSentence(i,j); j++){
        if(PARTICIPLE_TO_PAST[lw(j)]){ k = j; break; }
        if(!isAdverb(lw(j))) break;
      }
      if(k > 0){
        const kw = lw(k);
        const isPlOr1st2nd = w === "i" || SUBJ_PRON_PL.has(w);
        if(!(isPlOr1st2nd && (isBaseVerb(kw) || IRREG_BASE.has(kw)))){
          add({ cat:"grammar", rule:"bare-participle", severity:"critical", ...span(k,k),
            suggestions:[sub(k, PARTICIPLE_TO_PAST[kw]), "have "+kw], title:"Past participle without an auxiliary",
            why:'"'+raw(k)+'" needs "have" in front of it; on its own the past tense is "'+PARTICIPLE_TO_PAST[kw]+'".' });
        }
      }
    }
    // do/does/did + inflected verb
    if((w === "do" || w === "does" || w === "did" || w === "don't" || w === "doesn't" || w === "didn't") && next){
      let vIdx = -1;
      if(isPastForm(w1) || looksLikeVerbS(w1) || isIngForm(w1) || IRREG_PAST.has(w1)){
        vIdx = i + 1;
      } else if(sentStart(i) && (PRONOUNS.has(w1) || isNounish(w1) || (i+1 < n && /^[A-Z]/.test(raw(i+1))))){
        if(i + 2 < n && contig(i+1) && (isPastForm(w2) || looksLikeVerbS(w2) || isIngForm(w2) || IRREG_PAST.has(w2))){
          vIdx = i + 2;
        }
      }
      if(vIdx > 0 && sameSentence(i, vIdx)){
        const vw = lw(vIdx);
        let base = null;
        if(looksLikeVerbS(vw)) base = baseOfThird(vw);
        else if(IRREG_PAST.has(vw)) base = baseOfPast(vw);
        else if(isPastForm(vw)) base = baseOfPast(vw);
        else if(isIngForm(vw)) base = baseOfIng(vw);
        if(base && ALL_BASE_VERBS.has(base) && base !== vw){
          add({ cat:"grammar", rule:"do-base", severity:"critical", ...span(vIdx, vIdx),
            suggestions:[sub(vIdx, base)], title:"Verb form after do/does/did",
            why:'"'+raw(i)+'" already carries the tense, so the verb stays as "'+base+'".' });
        }
      }
    }
    // "suppose to" / "use to"
    if(w === "suppose" && w1 === "to" && next && BE_FORMS.has(p1)){
      add({ cat:"grammar", rule:"supposed-to", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"supposed")], title:'The phrase is "supposed to"',
        why:'The -d is silent in speech but it belongs in writing.' });
    }
    if(w === "use" && w1 === "to" && next && (PRONOUNS.has(p1) || isNounish(p1)) &&
       !BE_FORMS.has(p1) && !MODALS.has(p1) && p1 !== "to"){
      add({ cat:"grammar", rule:"used-to", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"used")], title:'The phrase is "used to"',
        why:'For a past habit the form is "used to".' });
    }
    // double comparative / superlative
    const IRREGULAR_COMPARATIVES = S("better best worse worst further furthest");
    if((w === "more" || w === "most") && next &&
       (baseOfComparative(w1) || IRREGULAR_COMPARATIVES.has(w1))){
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
       !PREPOSITIONS.has(p1) && p1 !== "over" && p1 !== "out" && p1 !== "up" &&
       p1 !== "down" && p1 !== "back" && p1 !== "right" && p1 !== "in" &&
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
        (isAdjective(w1) && !isNounish(w1) && !(w1 === "right" && w2 === "to")))){
      add({ cat:"grammar", rule:"its-it-is", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"it's")], title:'"It\'s" is "it is"',
        why:'"Its" is possessive, like "his". Here the sentence needs "it is" — so it takes an apostrophe.' });
    }
    if(w === "it's" && next && (w1 === "own" || (isNounish(w1) && (!isAdjective(w1) || clauseEnd(i+1))) || (isNounish(w1) && contig(i+1) &&
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
    if(w === "then" && (COMPARATIVES.has(p1) || (/er$/.test(p1) && COMMON_ADJECTIVES.has(p1.replace(/ier$/,"y").replace(/er$/,""))))){
      add({ cat:"grammar", rule:"then-than", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"than")], title:'Comparisons use "than"',
        why:'"Then" is about time. After "'+raw(i-1)+'" you are comparing, so it takes "than".' });
    }
    if(w === "than" && (sentStart(i) || p1 === "and" || p1 === "but" || p1 === "so" || (p1 !== "" && text.slice(tokens[i-1].end, tokens[i].start).includes(","))) &&
       next && (PRONOUNS.has(w1) || DETERMINERS.has(w1) || isBaseVerb(w1))){
      add({ cat:"grammar", rule:"than-then", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"then")], title:'Sequence uses "then"',
        why:'Nothing is being compared here — this is "and then", about what happens next.' });
    }
    // to / too / two
    if(w === "to" && next && (COMMON_ADJECTIVES.has(w1) || w1 === "much" || w1 === "many" ||
        w1 === "often" || w1 === "late" || w1 === "early" || w1 === "soon") &&
        !isBaseVerb(w1) && p1 !== "want" && p1 !== "need" && p1 !== "go" &&
        !isNounish(w1) && lw(i+2) !== "of" && !nearbyAny(i, S("promoted appointed elected named rank colonel captain general sergeant"), 4)){
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
    if(w === "loose" && (MODALS.has(p1) || p1 === "to" || NEG_CONTRACTIONS.has(p1) ||
        p1 === "not" || p1 === "gonna" || (p1 === "going" && p2 === "to"))){
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
    if(w === "affect" && (DETERMINERS.has(p1) || p1 === "side" || p1 === "little" ||
        p1 === "big" || p1 === "positive" || p1 === "negative" || p1 === "adverse")){
      add({ cat:"grammar", rule:"affect-effect", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"effect")], title:'"Effect" is the noun',
        why:'After "'+raw(i-1)+'" you need a noun — the result is an "effect". "Affect" is the verb.' });
    }
    if((w === "effect" || w === "effects") && (MODALS.has(p1) || p1 === "to" ||
        p1 === "not" || p1 === "directly" || p1 === "negatively" || p1 === "really" ||
        NEG_CONTRACTIONS.has(p1)) && next && (DETERMINERS.has(w1) || PRONOUNS.has(w1) || isNounish(w1))){
      add({ cat:"grammar", rule:"effect-affect", severity:"critical", ...span(i,i),
        suggestions:[sub(i, w === "effect" ? "affect" : "affects")], title:'"Affect" is the verb',
        why:'Here the word is doing something to "'+raw(i+1)+'", which calls for the verb "affect".' });
    }
    // were / we're / where
    if(w === "where" && next && (vbgNext || (BE_FORMS.has(w1) === false && isPastForm(w1))) &&
       (PRONOUNS.has(p1) || isPluralNoun(p1))){
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
       (p1 === "everyone" || p1 === "everything" || p1 === "all" || p1 === "anyone")){
      add({ cat:"grammar", rule:"accept-except", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"except")], title:'"Except" means "apart from"',
        why:'"Accept" means to receive something; here you are leaving something out.' });
    }
    if(w === "except" && (
       MODALS.has(p1) || NEG_CONTRACTIONS.has(p1) || p1 === "to" || p1 === "not" || p1 === "please" ||
       (sentStart(i) && next && (DETERMINERS.has(w1) || POSSESS.has(w1) || /^(my|our|your|this|that|these|those)$/.test(w1)))
    )){
      add({ cat:"grammar", rule:"accept-except", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"accept")], title:'"Accept" means to agree or receive',
        why:'"Except" means "apart from" or "excluding"; here the verb is "accept".' });
    }
    if(w === "weather" && next && (w1 === "or" && lw(i+2) === "not")){
      add({ cat:"grammar", rule:"weather-whether", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"whether")], title:'"Whether or not"',
        why:'"Weather" is rain and sun; the conjunction is "whether".' });
    }
    if(w === "quite" && (
       (next && (w1 === "down" || w1 === "please" || w1 === "room" || w1 === "place")) ||
       p1 === "keep" || p1 === "kept" || p1 === "stay" || p1 === "stayed" || p1 === "remain" || p1 === "remained" ||
       (p1 === "be" && (!next || (!isAdjective(w1) && !isAdverb(w1))))
    )){
      add({ cat:"grammar", rule:"quite-quiet", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"quiet")], title:'"Quiet" means without noise',
        why:'"Quite" is a degree word, as in "quite good". To mean without noise, use "quiet".' });
    }
    if(w === "quiet" && next && (w1 === "good" || w1 === "well" || w1 === "nice" || w1 === "often" || w1 === "sure" || w1 === "right" || w1 === "happy" || w1 === "different")){
      add({ cat:"grammar", rule:"quiet-quite", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"quite")], title:'"Quite" is a degree word',
        why:'"Quiet" means without noise; as a degree adverb use "quite": "quite '+w1+'".' });
    }
    if(w === "waist" && next && (w1 === "time" || w1 === "money" || w1 === "of" || w1 === "food" || w1 === "energy")){
      add({ cat:"grammar", rule:"waist-waste", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"waste")], title:'"Waste" is squandering',
        why:'"Waist" is part of the body; here the word means squandering: "waste '+w1+'".' });
    }
    if(w === "knew" && (DETERMINERS.has(p1) || p1 === "brand") && next && isNounish(w1)){
      add({ cat:"grammar", rule:"knew-new", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"new")], title:'"New" means not old',
        why:'"Knew" is the past tense of know; here you need the adjective "new".' });
    }
    if(w === "weak" && (p1 === "next" || p1 === "last" || p1 === "this" || p1 === "every" || p1 === "per" || (p1 === "a" && (p2 === "for" || p2 === "in" || p2 === "once" || p2 === "twice")) || (next && w1 === "ago"))){
      add({ cat:"grammar", rule:"weak-week", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"week")], title:'"Week" is seven days',
        why:'"Weak" means lacking strength; seven days is a "week".' });
    }
    if(w === "brake" && (p1 === "take" || p1 === "took" || p1 === "taking" || p1 === "lunch" || p1 === "coffee" || p1 === "spring" || p1 === "summer" || (p1 === "a" && (p2 === "take" || p2 === "took" || p2 === "taking" || p2 === "have" || p2 === "had" || p2 === "need" || p2 === "needed" || p2 === "without" || p2 === "short" || p2 === "quick")))){
      add({ cat:"grammar", rule:"brake-break", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"break")], title:'"Break" is a pause',
        why:'"Brake" slows down a car; a rest or pause is a "break".' });
    }
    if(w === "peace" && (p1 === "a" || p1 === "one" || p1 === "another" || p1 === "this") && next && w1 === "of"){
      add({ cat:"grammar", rule:"peace-piece", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"piece")], title:'"Piece" is a part or portion',
        why:'"Peace" is the opposite of war; a portion is a "piece".' });
    }
    if(w === "piece" && ((p1 === "world" || p1 === "inner" || p1 === "make" || (p1 === "in" && p2 === "rest")) || (next && w1 === "and" && lw(i+2) === "quiet"))){
      add({ cat:"grammar", rule:"peace-piece", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"peace")], title:'"Peace" is calm or tranquility',
        why:'"Piece" is a part or portion; calm and the absence of war is "peace".' });
    }
    if(w === "right" && ((MODALS.has(p1) || p1 === "to" || p1 === "please" || sentStart(i)) && next && (DETERMINERS.has(w1) || w1 === "down" || /^(a|an|the|to|about|letters?|books?|notes?|emails?|poems?|essays?)$/.test(w1)))){
      add({ cat:"grammar", rule:"right-write", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"write")], title:'"Write" is composing text',
        why:'"Right" means correct; putting words on paper is "write".' });
    }
    if(w === "tale" && (p1 === "its" || /'s$/.test(p1) || (p1 === "the" && (p2 === "wag" || p2 === "wagged" || p2 === "wagging"))) && (!next || !isNounish(w1))){
      add({ cat:"grammar", rule:"tale-tail", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"tail")], title:'"Tail" of an animal',
        why:'"Tale" is a story; an animal\'s body part is a "tail".' });
    }
    if(w === "tail" && (p1 === "fairy" || p1 === "folk" || (p1 === "a" && p2 === "tell"))){
      add({ cat:"grammar", rule:"tale-tail", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"tale")], title:'"Tale" is a story',
        why:'"Tail" is part of an animal; a story is a "tale".' });
    }
    if(w === "breath" && (p1 === "to" || /^(can|could|cannot|can't)$/.test(p1) || (p1 === "to" && /^(hard|easy|difficult)$/.test(p2)))){
      add({ cat:"grammar", rule:"breath-breathe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"breathe")], title:'"Breathe" is the verb',
        why:'"Breath" is the noun; the action of inhaling is "breathe".' });
    }
    if(w === "breathe" && (p1 === "deep" || p1 === "a" || (p1 === "deep" && p2 === "a") || p1 === "of" || p1 === "my" || p1 === "your" || p1 === "his" || p1 === "her")){
      const vb = (p1 === "deep" && p2 === "a") ? prevW(i, 3) : p2;
      const isVerbTake = /^(take|takes|took|taking|held|hold|catch|caught|lose|lost|draw)$/.test(vb || p1);
      const isPrepOf = (p1 === "of" && (p2 === "out" || p2 === "shortness" || p2 === "waste"));
      if(isVerbTake || isPrepOf || (p1 === "deep" && (p2 === "a" || !p2))){
        add({ cat:"grammar", rule:"breathe-breath", severity:"critical", ...span(i,i),
          suggestions:[sub(i,"breath")], title:'"Breath" is the noun',
          why:'"Breathe" is the verb; you take or catch a "breath".' });
      }
    }
    if(w === "hole" && (DETERMINERS.has(p1) || p1 === "a" || p1 === "the") && next && /^(world|day|time|life|night|family|year|story|cake|thing|week|month|book|meal|afternoon|morning|town|city)$/.test(w1)){
      add({ cat:"grammar", rule:"hole-whole", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"whole")], title:'"Whole" means entire',
        why:'"Hole" is an opening; entire is "whole".' });
    }
    if(w === "here" && (/^(can|could|cannot|can't|couldn't|to)$/.test(p1) || (p1 === "not" && /^(could|can)$/.test(p2))) && next && (/^(you|me|him|her|us|them|it|the|a|an|anything|nothing|any|clearly|well|what)$/.test(w1) || !isNounish(w1))){
      add({ cat:"grammar", rule:"here-hear", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"hear")], title:'"Hear" is listening',
        why:'"Here" means in this place; perceiving sound is "hear".' });
    }
    if(w === "hear" && (/^(come|came|over|right|stay|stayed|live|lived|look|sit|sat|stand|stood)$/.test(p1) || (p1 === "in" && p2 === "up"))){
      add({ cat:"grammar", rule:"here-hear", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"here")], title:'"Here" is a place',
        why:'"Hear" means listening; in this place is "here".' });
    }
    if(w === "through" && (/^(he|she|they|i|we)$/.test(p1) || (i > 0 && /^[A-Z]/.test(raw(i-1)) && !PREPOSITIONS.has(p1) && !MODALS.has(p1))) && next && (DETERMINERS.has(w1) || /^(the|a|an|his|her|their|my|our|it|them|balls?|stones?|rocks?|passes?|papers?)$/.test(w1))){
      add({ cat:"grammar", rule:"through-threw", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"threw")], title:'"Threw" is the past tense of throw',
        why:'"Through" means from one side to the other; the past tense of throw is "threw".' });
    }
    if(w === "by" && (p1 === "to" && /^(want|wants|wanted|going|need|needs|needed|decided|like|likes|liked|hoping|hoped|plan|plans|planned|try|tried)$/.test(p2)) && next && (DETERMINERS.has(w1) || /^(a|an|the|some|more|new|this|that|these|those|groceries|tickets?|clothes?|houses?|cars?|food|drinks?|phones?|books?)$/.test(w1))){
      add({ cat:"grammar", rule:"by-buy", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"buy")], title:'"Buy" means to purchase',
        why:'"By" is a preposition; to purchase something is "buy".' });
    }
    if(w === "advice" && (/^(i|you|he|she|we|they|would|to)$/.test(p1) || (i > 0 && /^[A-Z]/.test(raw(i-1)) && sentStart(i-1))) && next && /^(you|him|her|us|them|me|that|to|against|everyone|all|clients?|students?)$/.test(w1)){
      add({ cat:"grammar", rule:"advice-advise", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"advise")], title:'"Advise" is the verb',
        why:'In British English, "advice" is a noun; the verb is "advise".' });
    }
    if(w === "whether" && (p1 === "the" || /^(good|bad|cold|hot|warm|nice|wet|dry|stormy|severe|mild|inclement)$/.test(p1)) && (!next || !/^(or|they|he|she|it|we|you|i|to)$/.test(w1))){
      add({ cat:"grammar", rule:"whether-weather", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"weather")], title:'"Weather" is climate',
        why:'"Whether" expresses alternatives; atmospheric conditions are the "weather".' });
    }
    if(w === "weather" && ((next && (w1 === "to" || (w1 === "or" && lw(i+2) === "not"))) || (/^(know|wonder|doubt|decide|tell|discuss|asked|unsure|depends|see)$/.test(p1)))){
      add({ cat:"grammar", rule:"whether-weather", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"whether")], title:'"Whether" introduces an alternative',
        why:'"Weather" is climate; introducing alternatives or doubt takes "whether".' });
    }
    if(w === "know" && (p1 === "is" && p2 === "there") && next && isNounish(w1)){
      add({ cat:"grammar", rule:"know-no", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"no")], title:'Use "no" before a noun',
        why:'"Know" is a verb; before a noun to mean not any, use "no".' });
    }
    if(w === "no" && ((/^(do|did|does)$/.test(p2) && p1 === "you") || (/^(i|we|they|you)$/.test(p2) && p1 === "don't") || (p1 === "not" && /^(did|do|does)$/.test(p2))) && next && /^(what|how|why|that|if|whether|the|where|who|when)$/.test(w1)){
      add({ cat:"grammar", rule:"no-know", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"know")], title:'"Know" is the verb',
        why:'"No" means negative; having knowledge is the verb "know".' });
    }
    if(w === "sale" && (/^(will|shall|can|to|set)$/.test(p1) || (next && /^(across|around|tonight|tomorrow|away|south|north)$/.test(w1)))){
      add({ cat:"grammar", rule:"sale-sail", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"sail")], title:'"Sail" is navigating by water',
        why:'"Sale" is selling goods; traveling by boat or ship is "sail".' });
    }
    if(w === "sail" && (p1 === "a" || p1 === "the" || p1 === "for" || p1 === "on" || (p1 === "big" && p2 === "a") || (p1 === "clearance" || p1 === "garage")) && (!next || !/^(across|around|away|into|to|through)$/.test(w1))){
      add({ cat:"grammar", rule:"sail-sale", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"sale")], title:'"Sale" is selling goods',
        why:'"Sail" is on a boat; selling items or offering discounts is a "sale".' });
    }
    if(w === "board" && (p1 === "was" || p1 === "were" || p1 === "am" || p1 === "is" || p1 === "are" || p1 === "felt" || p1 === "got") && next && (w1 === "by" || w1 === "with" || w1 === "of")){
      add({ cat:"grammar", rule:"board-bored", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"bored")], title:'"Bored" means uninterested',
        why:'"Board" is a plank or committee; feeling weary or uninterested is "bored".' });
    }
    if(w === "son" && p1 === "the" && next && /^(is|shone|rose|set|came)$/.test(w1)){
      add({ cat:"grammar", rule:"son-sun", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"sun")], title:'"Sun" is the star',
        why:'"Son" is a male child; the star in the sky is the "sun".' });
    }
    if(w === "meat" && (p1 === "to" || MODALS.has(p1) || p1 === "did" || p1 === "will") && next && (PRONOUNS.has(w1) || w1 === "each" || w1 === "with" || w1 === "tomorrow" || w1 === "soon")){
      add({ cat:"grammar", rule:"meat-meet", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"meet")], title:'"Meet" is to encounter',
        why:'"Meat" is food; to encounter someone is to "meet".' });
    }
    if(w === "sea" && (MODALS.has(p1) || p1 === "to" || NEG_CONTRACTIONS.has(p1)) && next && (PRONOUNS.has(w1) || DETERMINERS.has(w1) || isNounish(w1))){
      add({ cat:"grammar", rule:"sea-see", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"see")], title:'"See" is perceiving with eyes',
        why:'"Sea" is the ocean; perceiving with your eyes is "see".' });
    }
    if(w === "sale" && ((p1 === "set" && prevContig(i)) || (next && (w1 === "across" || w1 === "around" || (w1 === "the" && (lw(i+2) === "boat" || lw(i+2) === "ship" || lw(i+2) === "ocean" || lw(i+2) === "sea")))))){
      add({ cat:"grammar", rule:"sale-sail", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"sail")], title:'"Sail" is navigating water',
        why:'"Sale" is selling; traveling by boat is "sail".' });
    }
    if(w === "sail" && p1 === "for" && prevContig(i) && !next){
      add({ cat:"grammar", rule:"sail-sale", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"sale")], title:'"For sale" takes the noun',
        why:'Items available for purchase are "for sale".' });
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
    if(REFLEXIVE[w] && contig(i-1) && sameSentence(i-1, i) &&
       (PREPOSITIONS.has(p1) || CONJUNCTIONS.has(p1) || p1 === "and" ||
        isFiniteVerb(p1))){
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
    if(w === "who" && prevContig(i) && PREPOSITIONS.has(p1)){
      add({ cat:"grammar", rule:"who-whom", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"whom")], title:'"Whom" after a preposition',
        why:'A preposition takes the object form, so "'+raw(i-1)+' '+raw(i)+'" becomes "'+raw(i-1)+' whom".' });
    }
    // "whom" used as the subject of a following verb ("whom is calling")
    if(w === "whom" && next && (BE_FORMS.has(w1) || isThirdPersonVerb(w1) || isBaseVerb(w1)) &&
       !(p1 !== "" && PREPOSITIONS.has(p1) && prevContig(i))){
      add({ cat:"grammar", rule:"who-whom", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"who")], title:'"Who" is the subject form',
        why:'Here this word is the subject of "'+raw(i+1)+'", so it takes the subject form "who".' });
    }

    // ---------------------------------------------------------------
    // MORE CONTEXT-DEPENDENT CONFUSABLES
    // ---------------------------------------------------------------
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
    if(w === "envelop" && contig(i-1) && sameSentence(i-1, i) && DETERMINERS.has(p1)){
      add({ cat:"grammar", rule:"envelop-envelope", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"envelope")], title:'"Envelope" is the noun',
        why:'The paper wrapper for a letter is an "envelope", with a final e. "Envelop" (no e) is a verb meaning to surround.' });
    }
    if(w === "envelope" && contig(i-1) && sameSentence(i-1, i) && MODALS.has(p1)){
      add({ cat:"grammar", rule:"envelop-envelope", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"envelop")], title:'"Envelop" is the verb',
        why:'To surround something is to "envelop" it, with no final e. "Envelope" is the paper wrapper.' });
    }
    if(w === "breath" && contig(i-1) && sameSentence(i-1, i) &&
       (MODALS.has(p1) || p1 === "to" || p1 === "please" || p1 === "just")){
      add({ cat:"grammar", rule:"breath-breathe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"breathe")], title:'"Breathe" is the verb',
        why:'The action is "breathe", with a final e and a soft th. "Breath" is the noun, the air itself.' });
    }
    if(w === "loath" && contig(i-1) && sameSentence(i-1, i) && PRONOUNS.has(p1) && !next){
      add({ cat:"grammar", rule:"loath-loathe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"loathe")], title:'"Loathe" is the verb',
        why:'To detest something is to "loathe" it, with a final e. "Loath" (no e) means reluctant.' });
    }
    if(w === "loath" && next && w1 && (!p1 || (!MODALS.has(p1) && p1 !== "am" && p1 !== "is" && p1 !== "are" && p1 !== "was" && p1 !== "were")) && w1 !== "to" &&
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
    if(w === "waiver" && contig(i-1) && sameSentence(i-1, i) && MODALS.has(p1)){
      add({ cat:"grammar", rule:"waive-waiver", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"waive")], title:'"Waive" is the verb',
        why:'To give something up is to "waive" it. A "waiver" is the document or the noun form.' });
    }
    if(w === "waive" && contig(i-1) && sameSentence(i-1, i) && DETERMINERS.has(p1)){
      add({ cat:"grammar", rule:"waive-waiver", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"waiver")], title:'"Waiver" is the noun',
        why:'The document that gives something up is a "waiver". "Waive" is the verb.' });
    }
    if(w === "adopt" && next){
      const j2 = DETERMINERS.has(w1) && contig(i+1) ? i+2 : i+1;
      if(contig(j2-1) && sameSentence(i,j2) && ADAPT_CONTEXT.has(lw(j2))){
        add({ cat:"grammar", rule:"adopt-adapt", severity:"critical", ...span(i,i),
          suggestions:[sub(i,"adapt")], title:'"Adapt" is to rework',
          why:'Turning a "'+raw(j2)+'" into something else is to "adapt" it. "Adopt" means to take on as your own.' });
      }
    }
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
    // A following object ("they license their software") means it is a verb
    // after all, whatever sits in front of it.
    if(NOUN_FORM[w] && contig(i-1) && sameSentence(i-1, i) &&
       !(next && (DETERMINERS.has(w1) || PRONOUNS.has(w1) || POSSESS.has(w1))) &&
       (DETERMINERS.has(p1) || POSSESS.has(p1) || isAdjective(p1) || isIngForm(p1))){
      add({ cat:"grammar", rule:"ce-se", severity:"critical", ...span(i,i),
        suggestions:[sub(i, NOUN_FORM[w])], title:'"'+NOUN_FORM[w]+'" is the noun',
        why:'After "'+raw(i-1)+'" this is a noun, and the noun is spelled "'+NOUN_FORM[w]+'" with a c. The -se form is the verb.' });
    }
    if(VERB_FORM[w] && contig(i-1) && sameSentence(i-1, i) &&
       (MODALS.has(p1) || (p1 === "to" && INF_TRIGGER.has(p2)))){
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
       contig(i-1) && sameSentence(i-1, i) && (DETERMINERS.has(p1) || POSSESS.has(p1))){
      add({ cat:"grammar", rule:"principal-principle", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"principal")], title:'"Principal" is the adjective',
        why:'Describing "'+raw(i+1)+'" as the main one takes "principal". A "principle" is a rule or belief.' });
    }
    if(w === "principal" && (p1 === "on" || p1 === "in") && contig(i-1) && sameSentence(i-1, i)){
      add({ cat:"grammar", rule:"principal-principle", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"principle")], title:'"On principle" takes the noun',
        why:'Acting "on principle" means acting on a belief, which is the -ple spelling.' });
    }
    if(w === "principal" && (p1 === "first" || p1 === "guiding" || p1 === "basic" || p1 === "fundamental" || p1 === "moral") && prevContig(i)){
      add({ cat:"grammar", rule:"principal-principle", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"principle")], title:'"Principle" is a rule or truth',
        why:'A fundamental rule or belief is a "principle" with -le.' });
    }
    if(w === "principle" && (p1 === "school" || p1 === "college" || p1 === "firm" || p1 === "company") && prevContig(i)){
      add({ cat:"grammar", rule:"principal-principle", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"principal")], title:'"Principal" is the head or chief',
        why:'The head of a school or organization is a "principal" with -al.' });
    }
    if(w === "stationary" && contig(i-1) && sameSentence(i-1, i) && BUY_VERBS.has(p1)){
      add({ cat:"grammar", rule:"stationary-stationery", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"stationery")], title:'"Stationery" is the paper',
        why:'Pens and paper are "stationery" with an e. "Stationary" means not moving.' });
    }
    if(w === "stationery" && contig(i-1) && sameSentence(i-1, i) && STILL_VERBS.has(p1)){
      add({ cat:"grammar", rule:"stationary-stationery", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"stationary")], title:'"Stationary" means not moving',
        why:'Standing still is "stationary" with an a. "Stationery" is pens and paper.' });
    }
    // "paid her a compliment" — the verb can sit a couple of words back
    if(w === "complement" && (
       (i > 0 && PRAISE_VERBS.has(lw(i-1)) && sameSentence(i-1, i)) ||
       (i > 1 && PRAISE_VERBS.has(lw(i-2)) && sameSentence(i-2, i)) ||
       (i > 2 && PRAISE_VERBS.has(lw(i-3)) && sameSentence(i-3, i))
    )){
      add({ cat:"grammar", rule:"complement-compliment", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"compliment")], title:'"Compliment" is the praise',
        why:'Praise you pay someone is a "compliment" with an i. A "complement" completes something.' });
    }
    if(w === "discrete" && w1 === "about" && next){
      add({ cat:"grammar", rule:"discreet-discrete", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"discreet")], title:'"Discreet" means tactful',
        why:'Being careful about what you say is "discreet". "Discrete" means separate.' });
    }
    if(w === "discreet" && next && SEPARATE_NOUNS.has(w1)){
      add({ cat:"grammar", rule:"discreet-discrete", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"discrete")], title:'"Discrete" means separate',
        why:'Separate, countable "'+raw(i+1)+'" are "discrete". "Discreet" means tactful.' });
    }
    if(w === "lead" && contig(i-1) && sameSentence(i-1, i) &&
       (HAVE_FORMS.has(p1) || p1 === "was" || p1 === "were" || p1 === "been")){
      add({ cat:"grammar", rule:"lead-led", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"led")], title:'The past tense is "led"',
        why:'After "'+raw(i-1)+'" you need the past form, which is "led". "Lead" is either the present tense or the metal.' });
    }
    if(w === "past" && contig(i-1) && sameSentence(i-1, i) && HAVE_FORMS.has(p1)){
      add({ cat:"grammar", rule:"past-passed", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"passed")], title:'"Passed" is the verb',
        why:'After "'+raw(i-1)+'" this is a verb, so it is "passed". "Past" is the noun or preposition.' });
    }
    if(w === "past" && w1 === "away" && next){
      add({ cat:"grammar", rule:"past-passed", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"passed")], title:'"Passed away"',
        why:'The verb in this phrase is "passed".' });
    }
    if(w === "past" && prevContig(i) && SUBJ_PRONOUNS_SET.has(p1) && next &&
       (w1 === "the" || w1 === "a" || w1 === "an" || w1 === "his" || w1 === "her" || w1 === "their" || w1 === "my" || w1 === "our") &&
       /^(exam|exams|test|tests|bill|bills|law|laws|inspection|inspections|course|courses|class|classes|interview|interviews)$/.test(lw(i+2))){
      add({ cat:"grammar", rule:"past-passed", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"passed")], title:'"Passed" is the verb',
        why:'Succeeding in a test or enacting a law is "passed". "Past" is the noun or preposition.' });
    }
    if(w === "council" && contig(i-1) && sameSentence(i-1, i) && LEGAL.has(p1)){
      add({ cat:"grammar", rule:"council-counsel", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"counsel")], title:'"Counsel" is advice',
        why:'Advice, or a barrister, is "counsel". A "council" is a body of people.' });
    }
    if(w === "counsel" && contig(i-1) && sameSentence(i-1, i) && CIVIC.has(p1)){
      add({ cat:"grammar", rule:"council-counsel", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"council")], title:'"Council" is the body',
        why:'A local authority is a "council". "Counsel" is advice, or a barrister.' });
    }
    if(w === "illicit" && next && (DETERMINERS.has(w1) || PRONOUNS.has(w1))){
      add({ cat:"grammar", rule:"elicit-illicit", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"elicit")], title:'"Elicit" is the verb',
        why:'Drawing something out of someone is to "elicit" it. "Illicit" means illegal.' });
    }
    if(w === "elicit" && next && isNounish(w1) && contig(i-1) && sameSentence(i-1, i) && DETERMINERS.has(p1)){
      add({ cat:"grammar", rule:"elicit-illicit", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"illicit")], title:'"Illicit" is the adjective',
        why:'Describing "'+raw(i+1)+'" as unlawful takes "illicit". "Elicit" is a verb.' });
    }
    if(w === "allusion" && contig(i-1) && sameSentence(i-1, i) && (p1 === "optical" || p1 === "visual")){
      add({ cat:"grammar", rule:"allusion-illusion", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"illusion")], title:'"Illusion" is the trick of the eye',
        why:'Something that deceives the eye is an "illusion". An "allusion" is an indirect reference.' });
    }
    if(w === "farther" && next && MORE_NOUNS.has(w1)){
      add({ cat:"grammar", rule:"farther-further", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"further")], title:'"Further" for anything but distance',
        why:'"Farther" is for physical distance. Additional "'+raw(i+1)+'" takes "further".' });
    }
    // lay / lie — "lay" needs an object, "lie" does not
    if(w === "lay" && next && (w1 === "down" || w1 === "in" || w1 === "on") && contig(i-1) && sameSentence(i-1, i) &&
       (p1 === "to" || MODALS.has(p1) || p1 === "wanna" || p1 === "gonna")){
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
       contig(i-1) && sameSentence(i-1, i) && (PRONOUNS.has(p1) || isNounish(p1))){
      add({ cat:"grammar", rule:"maybe", severity:"critical", ...span(i,i),
        suggestions:[sub(i,"may be")], title:'"May be" is the verb',
        why:'Here this is the verb "be" after "may", so it is two words. "Maybe" means "perhaps".' });
    }

    // ---------------------------------------------------------------
    // APOSTROPHES
    // ---------------------------------------------------------------
    // The greengrocer's apostrophe: a plural written with 's.
    const COUNTING = S("two three four five six seven eight nine ten several many few both dozens hundreds thousands various numerous all some most these those");
    if(/^[a-z]+'s$/.test(w) && contig(i-1) && sameSentence(i-1, i) &&
       (COUNTING.has(p1) || /^[0-9]+$/.test(p1))){
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
    const IRREGULAR_SUPERLATIVES = S("best worst furthest");
    if((w === "most" || w === "more") && next &&
       (baseOfSuperlative(w1) || IRREGULAR_SUPERLATIVES.has(w1))){
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

  function looksLikeNounHead(w){
    return DICTIONARY.has(w) && !PRONOUNS.has(w) && !DETERMINERS.has(w) &&
      !PREPOSITIONS.has(w) && !CONJUNCTIONS.has(w) && !BE_FORMS.has(w) &&
      !HAVE_FORMS.has(w) && !DO_FORMS.has(w) && !MODALS.has(w) &&
      !isAdverb(w) && !isPastForm(w) && !looksLikeVerbS(w) && !isAdjective(w);
  }
  // ---- multi-word phrase rules (wordiness, redundancy, idioms, hyphens) ----
  const lowerWords = tokens.map(t=>t.lw);
  for(let i=0; i<n; i++){
    const candidates = PHRASE_INDEX.get(lowerWords[i]);
    if(!candidates) continue;
    for(let c=0; c<candidates.length; c++){
      const item = candidates[c];
      const len = item.len;
      if(i + len > n) continue;
      let match = true;
      for(let k=1; k<len; k++){
        if(lowerWords[i+k] !== item.parts[k] || !contig(i+k-1)){ match = false; break; }
      }
      if(!match) continue;
      const a = i, b = i + len - 1;
      const phrase = item.parts.join(" ");
      if(item.type === "wordy"){
        const better = item.extra;
        const replacement = better === "-" ? "" : matchCase(tokens[a].raw, better);
        add({ cat:"style", rule:"wordy", severity:"advisory",
          start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
          suggestions: better === "-" ? [] : [replacement],
          title: better === "-" ? "Filler phrase" : "Wordy phrase",
          why: better === "-"
            ? "This phrase carries no information — the sentence works without it."
            : '"' + phrase + '" is ' + (len - better.split(" ").length) + ' words longer than "' + better + '" and says the same thing.' });
      } else if(item.type === "redundant"){
        const better = item.extra;
        add({ cat:"style", rule:"redundant", severity:"advisory",
          start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
          suggestions: [matchCase(tokens[a].raw, better)], title:"Redundant wording",
          why:'One half of this phrase already contains the other — "' + better + '" is enough.' });
      } else if(item.type === "idiom"){
        add({ cat:"grammar", rule:"idiom", severity:"critical",
          start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
          suggestions:[matchCase(tokens[a].raw, item.extra)], title:"Set phrase",
          why: item.why });
      } else if(item.type === "hyphen"){
        const after = lowerWords[b+1];
        if(b+1 >= n || !contig(b) || !after) continue;
        if(!looksLikeNounHead(after)) continue;
        if(!sameSentence(a, b+1)) continue;
        add({ cat:"punctuation", rule:"hyphen", severity:"critical",
          start: tokens[a].start, end: tokens[b].end, original: text.slice(tokens[a].start, tokens[b].end),
          suggestions:[matchCase(tokens[a].raw, item.extra)], title:"Compound modifier takes a hyphen",
          why:'These words act as a single adjective in front of "' + tokens[b+1].raw + '", so they are joined with a hyphen.' });
      }
    }
  }

  // ---- repeated word ----
  for(let i=0;i<n-1;i++){
    if(lowerWords[i] === lowerWords[i+1] && contig(i) && /^[a-z']+$/.test(lowerWords[i]) &&
       lowerWords[i] !== "had" && lowerWords[i] !== "that" && lowerWords[i] !== "can"){
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
    // Dangling modifier: opening participial / non-finite clause followed by inanimate subject
    const sStart = sent.tokStart, sEnd = sent.tokEnd;
    if(sEnd - sStart >= 4){
      let commaIdx = -1;
      for(let i = sStart; i < Math.min(sEnd - 2, sStart + 8); i++){
        const gap = text.slice(tokens[i].end, tokens[i+1].start);
        if(gap.indexOf(",") !== -1){ commaIdx = i; break; }
      }
      if(commaIdx > sStart){
        const fWord = tokens[sStart].lw;
        let isIntro = false;
        if((fWord.endsWith("ing") || fWord === "having" || fWord === "being") && !PREPOSITIONAL_INGS.has(fWord)){
          isIntro = true;
        } else if((fWord === "after" || fWord === "before" || fWord === "while") && commaIdx > sStart &&
                  (tokens[sStart+1].lw.endsWith("ing") || tokens[sStart+1].lw === "having" || tokens[sStart+1].lw === "being") &&
                  !PREPOSITIONAL_INGS.has(tokens[sStart+1].lw)){
          isIntro = true;
        } else if(fWord === "to" && commaIdx > sStart){
          const t1 = tokens[sStart+1].lw;
          if(isBaseVerb(t1) && !INFINITIVE_DISCOURSE.has(t1) && !PREPOSITIONS.has(t1) && !COMMON_ADJECTIVES.has(t1)){
            if(t1 === "be" && commaIdx > sStart + 1 && INFINITIVE_DISCOURSE.has(tokens[sStart+2].lw)){
              isIntro = false;
            } else {
              isIntro = true;
            }
          }
        } else if(DANGLING_PAST_PART.has(fWord)){
          isIntro = true;
        }
        if(isIntro){
          let hasSubjBefore = false;
          for(let k = sStart; k <= commaIdx; k++){
            if(/^(i|he|she|we|they|you|who)$/.test(tokens[k].lw)){ hasSubjBefore = true; break; }
          }
          if(!hasSubjBefore){
            const nextTok = tokens[commaIdx + 1];
            if(nextTok){
              const nw = nextTok.lw;
              if(!DANGLING_PERSON_HEADS.has(nw)){
                let head = nw;
                if(/^(the|a|an|my|our|their|his|her|its|several|some|all|this|that|these|those)$/.test(nw)){
                  let j = commaIdx + 2;
                  while(j < sEnd && j <= commaIdx + 3 && !/^(was|were|is|are|had|has|have|could|would|will|started|caught|looked|fell|rang|began)$/.test(tokens[j].lw)){
                    j++;
                  }
                  head = tokens[j-1].lw;
                }
                if(!DANGLING_PERSON_HEADS.has(head)){
                  const commaPos = text.indexOf(",", tokens[commaIdx].end);
                  const endPos = commaPos !== -1 ? commaPos : tokens[commaIdx].end;
                  const introStr = text.slice(tokens[sStart].start, endPos);
                  const subjStr = text.slice(nextTok.start, tokens[Math.min(sEnd-1, commaIdx + 2)].end);
                  add({
                    cat: "grammar",
                    rule: "dangling-modifier",
                    severity: "critical",
                    start: tokens[sStart].start,
                    end: endPos,
                    original: introStr,
                    suggestions: [],
                    title: "Dangling modifier",
                    why: 'The opening phrase describes an action, but the subject that immediately follows ("' + subjStr + '") is not the one performing it.'
                  });
                }
              }
            }
          }
        }
      }
    }
    // comma splice: ", <pronoun> <finite verb>" — but only when what comes
    // before the comma is itself a full sentence. A leading subordinate
    // clause ("If that is right, I am content") takes a comma quite properly,
    // so anything with a subordinator in front of the comma is left alone.
    for(let i=sent.tokStart;i<sent.tokEnd-2;i++){
      const gap = text.slice(tokens[i].end, tokens[i+1].start);
      if(gap.indexOf(",") === -1) continue;
      let subordinateBefore = false, finiteBefore = false;
      for(let k=sent.tokStart;k<=i;k++){
        if(SUBORDINATORS.has(tokens[k].lw)) subordinateBefore = true;
        if(isFiniteVerb(tokens[k].lw)) finiteBefore = true;
      }
      if(subordinateBefore || !finiteBefore) continue;
      const firstW = tokens[sent.tokStart].lw;
      if(PREPOSITIONS.has(firstW) || isIngForm(firstW) || isPastForm(firstW) || firstW === "being" || firstW === "having") continue;
      const p = tokens[i+1].lw, v = tokens[i+2].lw;
      const isSubj = SUBJ_PRONOUNS_SET.has(p);
      const tail = sent.tokEnd - (i+1);
      if(isSubj && isFiniteVerb(v) && !CONJUNCTIONS.has(v) && tail >= 3 &&
         !OPINION_VERBS_SET.has(v)){
        add({ cat:"punctuation", rule:"comma-splice", severity:"advisory",
          start: tokens[i].end, end: tokens[i+1].end,
          original: text.slice(tokens[i].end, tokens[i+1].end).trim(),
          suggestions:[], title:"Comma joining two sentences",
          why:'"'+tokens[i+1].raw+" "+tokens[i+2].raw+'..." could stand alone as a sentence. A full stop, a semicolon, or "and"/"but" would join it properly.' });
      }
    }
  });
}

