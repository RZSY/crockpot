// ===============================================================
// 3. SPELLING ENGINE
//    Norvig-style known-edit generation over the British dictionary,
//    re-ranked by a confusion-aware cost model, keyboard geometry,
//    phonetics and word frequency.
// ===============================================================

// Common contractions the frequency corpus doesn't carry as plain a-z tokens.
// Folded into the main dictionary (with a modest synthetic frequency rank) so
// the same edit machinery that catches "fone"/"phone" catches "dont"/"don't".
const CONTRACTIONS_LIST = ["i'm","i've","i'll","i'd","you're","you've","you'll","you'd",
  "he's","he'll","he'd","she's","she'll","she'd","it's","it'll","we're","we've","we'll","we'd",
  "they're","they've","they'll","they'd","don't","doesn't","didn't","isn't","aren't","wasn't",
  "weren't","can't","couldn't","wouldn't","shouldn't","won't","haven't","hasn't","hadn't",
  "that's","what's","who's","where's","when's","why's","how's","there's","here's","let's",
  "mustn't","needn't","oughtn't","ain't","y'all","o'clock","could've","should've",
  "would've","might've","must've","who're"];
CONTRACTIONS_LIST.forEach((c,i)=>{
  DICTIONARY.add(c);
  if(!RANK.has(c)) RANK.set(c, 60 + i*4);
});

// ---- keyboard adjacency (QWERTY) ----
const ADJ = {
  q:"wa",w:"qeas",e:"wrsd",r:"etdf",t:"ryfg",y:"tugh",u:"yihj",i:"uojk",o:"ipkl",p:"ol",
  a:"qwsz",s:"awedxz",d:"serfcx",f:"drtgvc",g:"ftyhbv",h:"gyujnb",j:"huikmn",k:"jiolm",l:"kop",
  z:"asx",x:"zsdc",c:"xdfv",v:"cfgb",b:"vghn",n:"bhjm",m:"njk"
};
function isAdjacentKey(a,b){ return !!(ADJ[a] && ADJ[a].indexOf(b) !== -1); }
function keyboardScore(a,b){
  if(a.length !== b.length) return 0;
  let score = 0;
  for(let i=0;i<a.length;i++) if(a[i] !== b[i] && isAdjacentKey(a[i], b[i])) score++;
  return score;
}

// ---- edit generation ----
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const INSERTABLE = LETTERS.concat(["'"]);

function edits1(word){
  const results = new Set();
  for(let i=0;i<=word.length;i++){
    const L = word.slice(0,i), R = word.slice(i);
    if(R.length>0) results.add(L + R.slice(1));
    if(R.length>1) results.add(L + R[1] + R[0] + R.slice(2));
    if(R.length>0) for(const c of LETTERS) results.add(L + c + R.slice(1));
    for(const c of INSERTABLE) results.add(L + c + R);
  }
  results.delete(word);
  return results;
}
function knownOf(iterable){
  const out = [];
  for(const w of iterable) if(DICTIONARY.has(w)) out.push(w);
  return out;
}
function knownEdits2(word){
  const pool = new Set();
  let count = 0;
  for(const w of edits1(word)){
    if(count > 1200) break;
    count++;
    for(const w2 of edits1(w)) if(DICTIONARY.has(w2)) pool.add(w2);
  }
  return pool;
}
function damerauLevenshtein(a,b){
  const al=a.length, bl=b.length, d=[];
  for(let i=0;i<=al;i++){ d.push(new Array(bl+1).fill(0)); d[i][0]=i; }
  for(let j=0;j<=bl;j++) d[0][j]=j;
  for(let i=1;i<=al;i++) for(let j=1;j<=bl;j++){
    const cost = a[i-1]===b[j-1] ? 0 : 1;
    d[i][j] = Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+cost);
    if(i>1 && j>1 && a[i-1]===b[j-2] && a[i-2]===b[j-1]) d[i][j] = Math.min(d[i][j], d[i-2][j-2]+1);
  }
  return d[al][bl];
}

// ---- confusion-weighted distance ----
const VOWELS = new Set(["a","e","i","o","u","y"]);
const CONFUSABLE_GROUPS = [["c","k","q"],["s","z"],["s","c"],["b","p"],["d","t"],["g","j"],["f","v"],["m","n"],["u","w"]];
const CONFUSABLE_OF = new Map();
CONFUSABLE_GROUPS.forEach(group=>group.forEach(ch=>{
  if(!CONFUSABLE_OF.has(ch)) CONFUSABLE_OF.set(ch, new Set());
  group.forEach(other=>{ if(other!==ch) CONFUSABLE_OF.get(ch).add(other); });
}));
function substitutionCost(x,y){
  if(x === y) return 0;
  if(VOWELS.has(x) && VOWELS.has(y)) return 0.6;
  if(CONFUSABLE_OF.has(x) && CONFUSABLE_OF.get(x).has(y)) return 0.65;
  if(isAdjacentKey(x,y)) return 0.75;
  return 1.0;
}
function weightedEditDistance(a,b){
  const al=a.length, bl=b.length, d=[];
  for(let i=0;i<=al;i++){ d.push(new Array(bl+1).fill(0)); d[i][0]=i; }
  for(let j=0;j<=bl;j++) d[0][j]=j;
  for(let i=1;i<=al;i++) for(let j=1;j<=bl;j++){
    const same = a[i-1]===b[j-1];
    const subCost = same ? 0 : substitutionCost(a[i-1], b[j-1]);
    const insCost = b[j-1]==="'" ? 0.4 : ((j>1 && b[j-1]===b[j-2]) ? 0.5 : 1.0);
    const delCost = a[i-1]==="'" ? 0.4 : ((i>1 && a[i-1]===a[i-2]) ? 0.5 : 1.0);
    d[i][j] = Math.min(d[i-1][j]+delCost, d[i][j-1]+insCost, d[i-1][j-1]+subCost);
    if(i>1 && j>1 && a[i-1]===b[j-2] && a[i-2]===b[j-1]) d[i][j] = Math.min(d[i][j], d[i-2][j-2]+0.75);
  }
  return d[al][bl];
}

// ---------------------------------------------------------------
// 3b. PHONETIC ENGINE
//     Four independent encoders, each deliberately lossy in a
//     different direction, so a misspelling only has to survive one
//     of them to be found:
//
//       doubleMetaphone  sound-alike, consonant-led, handles silent
//                        letters and digraphs (fone/phone, nite/night)
//       consonantSkeleton vowels thrown away entirely — the one that
//                        catches vowel-dropped texting (txt, pls, bcz)
//       soundexKey       coarse consonant classes, catches substitutions
//                        the metaphone is too strict about
//       vowelShape       keeps a rough vowel melody, which is the only
//                        thing separating hat/hit/hot once consonants
//                        have been normalised
//
//     Above them sits a lexicon of informal forms. Short chat spellings
//     ("u", "y", "hu") carry almost no phonetic signal — two letters
//     encode to the same key as a dozen real words — so for those the
//     lexicon decides and the encoders handle the long tail.
// ---------------------------------------------------------------

// ---- surface normalisers ----
// Applied before anything else, so "sooooo", "s0o0o" and "SOOO" all
// reach the encoders as "so".

// Chat elongation: "heyyyy" -> "heyy" -> "hey". Two forms are produced
// because some real words genuinely double ("been", "coffee").
function elongationVariants(word){
  const out = [];
  if(/(.)\1{2,}/.test(word)){
    out.push(word.replace(/(.)\1{2,}/g, "$1$1"));
    out.push(word.replace(/(.)\1{2,}/g, "$1"));
  }
  return out;
}

// Leetspeak / symbol substitution. Only applied when the token actually
// mixes letters and digits, so bare numbers and years are left alone.
const LEET_MAP = { "0":"o","1":"i","3":"e","4":"a","5":"s","6":"g","7":"t","9":"g",
                   "@":"a","$":"s","!":"i","|":"l","+":"t","€":"e" };
function deLeet(word){
  if(!/[0-9@$!|+€]/.test(word) || !/[a-z]/.test(word)) return null;
  const out = word.replace(/[0-9@$!|+€]/g, c => LEET_MAP[c] !== undefined ? LEET_MAP[c] : c);
  return out === word ? null : out;
}

// Digit rebus: a digit standing in for the sound of its name.
// "b4" -> "before", "gr8" -> "great", "any1" -> "anyone", "2nite" -> "tonight".
const DIGIT_SOUNDS = { "1":["one","won"], "2":["to","too","two"], "4":["for","four","fore"], "8":["ate","eight"] };
function rebusVariants(word){
  if(!/[1248]/.test(word) || !/[a-z]/.test(word)) return [];
  const out = new Set();
  for(const d in DIGIT_SOUNDS){
    if(word.indexOf(d) === -1) continue;
    for(const sound of DIGIT_SOUNDS[d]) out.add(word.split(d).join(sound));
  }
  return Array.from(out);
}

// ---- letter-name homophony ----
// The names of the letters are themselves words: the letter R is said
// "are", U is said "you", Y is said "why". This is a whole class of
// substitution, not a list of one-offs, so it gets its own table.
const LETTER_NAME_WORDS = {
  b:["be","bee"], c:["see","sea"], g:["gee"], j:["jay"], k:["okay"],
  n:["and"], o:["oh","owe"], p:["pea"], q:["queue","cue"], r:["are"],
  t:["tea","tee"], u:["you"], y:["why"]
};

// ---- informal lexicon ----
// Ordered best-first. Entries are the forms where phonetics alone can't
// decide, because the token is too short to carry enough signal.
const INFORMAL = Object.create(null);
function informal(map){ for(const k in map) INFORMAL[k] = map[k].split(" "); }

// question words — the ones that collapse hardest in chat
informal({
  hu:"who", whu:"who", hoo:"who", hooo:"who", ho:"who", whoo:"who",
  hw:"how", hau:"how", hao:"how", haw:"how", hou:"how", howe:"how",
  wy:"why", wai:"why", whi:"why",
  wat:"what", wot:"what", wht:"what", whut:"what", wut:"what", wha:"what", whar:"what",
  wen:"when", whn:"when", wene:"when",
  wer:"where", whr:"where", wher:"where", wea:"where", weir:"where",
  wich:"which", whch:"which", wych:"which",
  hoos:"whose who's", whos:"who's whose", whoz:"who's",
  wos:"what's", wats:"what's", wuts:"what's", whts:"what's"
});

// vowel-dropped shortenings
informal({
  pls:"please", plz:"please", plse:"please", plez:"please", pleez:"please", pliz:"please",
  thx:"thanks", thnx:"thanks", tnx:"thanks", thanx:"thanks", thnks:"thanks", tnks:"thanks", thks:"thanks",
  txt:"text", txts:"texts", txting:"texting", txted:"texted",
  msg:"message", msgs:"messages", mssg:"message", msging:"messaging",
  abt:"about", abut:"about",
  bcz:"because", bcoz:"because", bcos:"because", bcus:"because", becuz:"because",
  becoz:"because", becos:"because", cuz:"because", coz:"because", cos:"because", cz:"because",
  tmrw:"tomorrow", tmr:"tomorrow", tmro:"tomorrow", tomoro:"tomorrow", tomorow:"tomorrow",
  ppl:"people", peeps:"people",
  prolly:"probably", probly:"probably", probs:"probably", prob:"probably", prbly:"probably",
  rly:"really", rlly:"really", realy:"really", rele:"really", reallly:"really",
  srsly:"seriously", srs:"serious",
  obvs:"obviously", obv:"obvious",
  bday:"birthday", bdy:"birthday",
  fav:"favourite", fave:"favourite", favs:"favourites",
  bro:"brother", sis:"sister",
  nxt:"next", wk:"week", wknd:"weekend", yr:"year", hrs:"hours", mins:"minutes",
  gf:"girlfriend", bf:"boyfriend",
  smth:"something", smthng:"something", sth:"something", sumthing:"something",
  somthing:"something", sumthin:"something", somethin:"something",
  nthg:"nothing", nuthin:"nothing", nothin:"nothing",
  anuther:"another", anotha:"another",
  gr8ful:"grateful", tho:"though", altho:"although", thru:"through", thro:"through",
  thoro:"thorough", tht:"that", ths:"this", thn:"then", dnt:"don't", cnt:"can't",
  wnt:"want", jst:"just", knw:"know", nvr:"never", alwys:"always", bcm:"become",
  gvn:"given", rmbr:"remember", diff:"different", info:"information", pic:"picture",
  pics:"pictures", vid:"video", vids:"videos", congrats:"congratulations"
});

// phonetic respellings
informal({
  nite:"night", nyte:"night", tonite:"tonight", "2nite":"tonight",
  lite:"light", brite:"bright", rite:"right", ryt:"right", rght:"right",
  tuff:"tough", enuf:"enough", enuff:"enough",
  luv:"love", luvs:"loves", luvly:"lovely",
  wud:"would", wuld:"would", wld:"would", shud:"should", shuld:"should", shld:"should",
  cud:"could", culd:"could", cld:"could",
  gud:"good", gd:"good", "gr8":"great", "b4":"before", "l8":"late", "l8r":"later", "w8":"wait", "m8":"mate",
  "h8":"hate", "sk8":"skate", "str8":"straight", "gr8t":"great", "2gether":"together",
  "4ever":"forever", "4eva":"forever", "4give":"forgive", "n1":"nice one", "gr8ly":"greatly",
  skool:"school", scool:"school", skul:"school",
  fone:"phone", phne:"phone", foto:"photo", fotos:"photos",
  frend:"friend", freind:"friend", frnd:"friend", frends:"friends",
  wif:"with", wiv:"with", wth:"with",
  da:"the", de:"the", teh:"the",
  dat:"that", dis:"this", dem:"them", dere:"there", den:"then", dey:"they", doe:"though",
  ova:"over", eva:"ever", neva:"never", afta:"after", betta:"better", togetha:"together",
  sumone:"someone", sumwhere:"somewhere", nuthing:"nothing",
  awsome:"awesome", awsum:"awesome", kool:"cool",
  hella:"really", sik:"sick", fam:"family",
  aight:"alright", ight:"alright", alrite:"alright", arite:"alright",
  cmon:"come on", cmere:"come here",
  wassup:"what's up", whassup:"what's up", wazzup:"what's up", wassap:"what's up", sup:"what's up",
  hiya:"hi", heya:"hey", yolo:"you only live once"
});

// spoken-form collapses
informal({
  wanna:"want to", gonna:"going to", gotta:"got to", kinda:"kind of", sorta:"sort of",
  oughta:"ought to", coulda:"could have", shoulda:"should have", woulda:"would have",
  musta:"must have", mighta:"might have", outta:"out of", lotta:"lot of",
  dunno:"don't know", lemme:"let me", gimme:"give me", betcha:"bet you",
  gotcha:"got you", whatcha:"what are you", innit:"isn't it",
  finna:"going to", tryna:"trying to", imma:"I'm going to", ima:"I'm going to",
  ya:"you", yah:"yeah", yh:"yeah", yep:"yes", yup:"yes", nah:"no", nope:"no",
  cya:"see you", cu:"see you", kk:"okay", oki:"okay", okie:"okay"
});

// further shortenings, British chat forms and common keyboard slips
informal({
  ur:"your", urs:"yours", ure:"you're", uve:"you've", ull:"you'll",
  mite:"might", nvr:"never", evry:"every", evryone:"everyone",
  evrything:"everything", somethin:"something", nuffin:"nothing",
  summat:"somewhat", owt:"anything", nowt:"nothing",
  gissa:"give us a", giz:"give us", init:"isn't it", shure:"sure", corse:"course", thort:"thought", rong:"wrong",
  alredy:"already", allready:"already", allways:"always", ave:"have", sumfin:"something",
  fink:"think", finking:"thinking", bruv:"brother",
  minger:"unattractive",
  soz:"sorry", srry:"sorry", sory:"sorry", apols:"apologies",
  tnite:"tonight", "2moz":"tomorrow", tomoz:"tomorrow", sumtimes:"sometimes",
  sumtime:"sometime", anytin:"anything", evrytin:"everything",
  jus:"just", jsut:"just", hte:"the", taht:"that",
  adn:"and", nad:"and", wiht:"with", tihs:"this",
  yuo:"you", oyu:"you", yur:"your", yuor:"your", thier:"their",
  becuase:"because", becasue:"because", beacuse:"because",
  wnat:"want", jhon:"john",
});

// initialisms — expanded, not corrected, and only ever advisory
const INITIALISMS = {
  idk:"I don't know", idc:"I don't care", ikr:"I know, right",
  imo:"in my opinion", imho:"in my humble opinion", btw:"by the way",
  omg:"oh my God", brb:"be right back", ttyl:"talk to you later",
  tbh:"to be honest", tbf:"to be fair", fyi:"for your information",
  asap:"as soon as possible", aka:"also known as", rn:"right now",
  nvm:"never mind", jk:"just kidding", smh:"shaking my head",
  irl:"in real life", wyd:"what are you doing", hbu:"how about you",
  wbu:"what about you", ily:"I love you", imy:"I miss you",
  ngl:"not going to lie", istg:"I swear to God", tldr:"too long, didn't read",
  np:"no problem", ty:"thank you", yw:"you're welcome", otw:"on the way",
  bff:"best friend", dm:"direct message", atm:"at the moment",
  cba:"can't be bothered", iirc:"if I recall correctly", afaik:"as far as I know",
  lmk:"let me know", nbd:"no big deal", wfh:"working from home",
  eod:"end of day", eta:"estimated time of arrival", rsvp:"please reply",
  ootd:"outfit of the day", tia:"thanks in advance", nrn:"no reply needed",
  eob:"end of business", cob:"close of business", wip:"work in progress",
  poc:"point of contact", sme:"subject matter expert", kpi:"key performance indicator",
  ooo:"out of office", pto:"paid time off", fwiw:"for what it is worth",
  ymmv:"your mileage may vary", tbc:"to be confirmed", tba:"to be announced", ffs:"for goodness sake", icymi:"in case you missed it",
  lmfao:"laughing", rofl:"laughing", lmao:"laughing", lol:"laughing",
  gtg:"got to go", g2g:"got to go", hmu:"message me", wdym:"what do you mean",
  wym:"what do you mean", idts:"I don't think so", iykyk:"if you know, you know",
  ong:"honestly", bruh:"brother", bby:"baby"
};

// Informal forms that are also ordinary English words. Correcting these
// blind would wreck real prose ("a cant of the roof", "against her wont"),
// so they are only ever raised when the surrounding text is already
// informal — see informalInContext().
const AMBIGUOUS_INFORMAL = {
  cant:"can't", wont:"won't", cud:"could", allot:"a lot",
  tho:"though", wat:"what", wen:"when", dis:"this", dat:"that", coz:"because",
  ur:"your", u:"you", r:"are", y:"why", n:"and", k:"okay", alot:"a lot"
};

// ---- Double Metaphone ----
// Lawrence Philips' algorithm, with two deliberate departures, both
// aimed at chat spelling rather than surnames:
//   * "wh" before "o" encodes as H, not W, so who/whom/whose group with
//     "hu"/"hoo" instead of with "we"/"way".
//   * "ough" is resolved by its written ending rather than dropped, so
//     "enough" keeps its F and meets "enuf".
const DM_VOWELS = "AEIOUY";
function dmIsVowel(s,i){ return i>=0 && i<s.length && DM_VOWELS.indexOf(s[i]) !== -1; }
const DM_SETS = new Map();
function dmSet(spec){
  let set = DM_SETS.get(spec);
  if(!set){ set = new Set(spec.split("|")); DM_SETS.set(spec,set); }
  return set;
}
function dmAt(s,start,len,spec){
  if(start < 0 || start + len > s.length) return false;
  return dmSet(spec).has(s.substr(start,len));
}
function doubleMetaphone(input){
  const s = String(input).toUpperCase().replace(/[^A-Z]/g,"");
  if(!s) return ["",""];
  let pri = "", sec = "", i = 0;
  const len = s.length, last = len - 1;
  const add = (a,b) => { pri += a; sec += (b === undefined ? a : b); };
  // silent leading pairs
  if(dmAt(s,0,2,"GN|KN|PN|AE|WR")) i = 1;
  if(s[0] === "X"){ add("S"); i = 1; }

  while(i < len){
    if(pri.length > 5 && sec.length > 5) break;
    const c = s[i];
    switch(c){
      case "A": case "E": case "I": case "O": case "U": case "Y":
        if(i === 0) add("A");
        i++; break;
      case "B":
        add("P"); i += (s[i+1] === "B" ? 2 : 1); break;
      case "C":
        if(i>1 && !dmIsVowel(s,i-2) && dmAt(s,i-1,3,"ACH") && s[i+2]!=="I" && s[i+2]!=="E"){
          add("K"); i += 2; break;
        }
        if(i===0 && dmAt(s,0,6,"CAESAR")){ add("S"); i += 2; break; }
        if(dmAt(s,i,4,"CHIA")){ add("K"); i += 2; break; }
        if(dmAt(s,i,2,"CH")){
          if(i>0 && dmAt(s,i,4,"CHAE")){ add("K","X"); i += 2; break; }
          if(i===0 && (dmAt(s,i+1,5,"HARAC|HARIS") || dmAt(s,i+1,3,"HOR|HYM|HIA|HEM")) && !dmAt(s,0,5,"CHORE")){
            add("K"); i += 2; break;
          }
          if(dmAt(s,0,4,"VAN |VON ") || dmAt(s,0,3,"SCH") ||
             dmAt(s,i-2,6,"ORCHES|ARCHIT|ORCHID") ||
             s[i+2]==="T" || s[i+2]==="S" ||
             ((i===0 || dmAt(s,i-1,1,"A|O|U|E")) && dmAt(s,i+2,1,"L|R|N|M|B|H|F|V|W| "))){
            add("K"); i += 2; break;
          }
          if(i>0) add(dmAt(s,0,2,"MC") ? "K" : "X","K");
          else add("X");
          i += 2; break;
        }
        if(dmAt(s,i,2,"CZ") && !dmAt(s,i-2,4,"WICZ")){ add("S","X"); i += 2; break; }
        if(dmAt(s,i+1,3,"CIA")){ add("X"); i += 3; break; }
        if(dmAt(s,i,2,"CC") && !(i===1 && s[0]==="M")){
          if(dmAt(s,i+2,1,"I|E|H") && !dmAt(s,i+2,2,"HU")){
            if((i===1 && s[i-1]==="A") || dmAt(s,i-1,5,"UCCEE|UCCES")) add("KS");
            else add("X");
            i += 3; break;
          }
          add("K"); i += 2; break;
        }
        if(dmAt(s,i,2,"CK|CG|CQ")){ add("K"); i += 2; break; }
        if(dmAt(s,i,2,"CI|CE|CY")){
          add(dmAt(s,i,3,"CIO|CIE|CIA") ? "S" : "S");
          i += 2; break;
        }
        add("K");
        i += dmAt(s,i+1,2," C| Q| G") ? 3 : 1;
        break;
      case "D":
        if(dmAt(s,i,2,"DG")){
          if(dmAt(s,i+2,1,"I|E|Y")){ add("J"); i += 3; }
          else { add("TK"); i += 2; }
          break;
        }
        if(dmAt(s,i,2,"DT|DD")){ add("T"); i += 2; break; }
        add("T"); i++; break;
      case "F":
        add("F"); i += (s[i+1] === "F" ? 2 : 1); break;
      case "G":
        if(s[i+1] === "H"){
          if(i>0 && !dmIsVowel(s,i-1)){ add("K"); i += 2; break; }
          if(i === 0){
            if(s[i+2] === "I") add("J");
            else add("K");
            i += 2; break;
          }
          // -OUGH- : decided by what follows, so "enough" keeps its F
          if(i>1 && dmAt(s,i-2,2,"OU")){
            if(i+2 >= len || dmAt(s,i+2,1,"T")) add("F");
            i += 2; break;
          }
          if(i>2 && dmAt(s,i-3,3,"AUG|EIG|IGH")){ i += 2; break; }
          if(i>1 && dmAt(s,i-2,1,"B|H|D")){ i += 2; break; }
          add("K"); i += 2; break;
        }
        if(s[i+1] === "N"){
          if(i===1 && dmIsVowel(s,0) && !dmAt(s,0,4,"AGNI")) add("KN","N");
          else if(!dmAt(s,i+2,2,"EY") && s[i+1]!=="Y") add("N","KN");
          else add("KN");
          i += 2; break;
        }
        if(dmAt(s,i+1,2,"LI") && !dmAt(s,0,4,"ANGL")){ add("KL","L"); i += 2; break; }
        if(i===0 && (s[i+1]==="Y" || dmAt(s,i+1,2,"ES|EP|EB|EL|EY|IB|IL|IN|IE|EI|ER"))){
          add("K","J"); i += 2; break;
        }
        if((dmAt(s,i+1,2,"ER") || s[i+1]==="Y") && !dmAt(s,0,6,"DANGER|RANGER|MANGER") && !dmAt(s,i-1,1,"E|I|Y")){
          add("K","J"); i += 2; break;
        }
        if(dmAt(s,i+1,1,"E|I|Y") || dmAt(s,i-1,4,"AGGI|OGGI")){
          if(dmAt(s,0,4,"VAN |VON ") || dmAt(s,0,3,"SCH") || dmAt(s,i+1,2,"ET")) add("K");
          else add("J","K");
          i += 2; break;
        }
        add("K"); i += (s[i+1] === "G" ? 2 : 1); break;
      case "H":
        // kept only when it is actually pronounced: between vowels or word-initial before a vowel
        if((i===0 || dmIsVowel(s,i-1)) && dmIsVowel(s,i+1)){ add("H"); i += 2; }
        else i++;
        break;
      case "J":
        if(dmAt(s,i,4,"JOSE") || dmAt(s,0,4,"SAN ")){ add("H"); i++; break; }
        if(i===0) add("J","A");
        else if(dmIsVowel(s,i-1) && (s[i+1]==="A" || s[i+1]==="O")) add("J","H");
        else if(i===last) add("J","");
        else if(!dmAt(s,i+1,1,"L|T|K|S|N|M|B|Z") && !dmAt(s,i-1,1,"S|K|L")) add("J");
        i += (s[i+1] === "J" ? 2 : 1); break;
      case "K":
        add("K"); i += (s[i+1] === "K" ? 2 : 1); break;
      case "L":
        if(s[i+1] === "L"){
          if((i === len-3 && dmAt(s,i-1,4,"ILLO|ILLA|ALLE")) ||
             ((dmAt(s,last-1,2,"AS|OS") || dmAt(s,last,1,"A|O")) && dmAt(s,i-1,4,"ALLE"))){
            add("L",""); i += 2; break;
          }
          i += 2; add("L"); break;
        }
        add("L"); i++; break;
      case "M":
        add("M");
        i += (s[i+1]==="M" || (dmAt(s,i-1,3,"UMB") && (i+1===last || dmAt(s,i+2,2,"ER")))) ? 2 : 1;
        break;
      case "N":
        add("N"); i += (s[i+1] === "N" ? 2 : 1); break;
      case "P":
        if(s[i+1] === "H"){ add("F"); i += 2; break; }
        add("P"); i += (s[i+1]==="P" || s[i+1]==="B") ? 2 : 1; break;
      case "Q":
        add("K"); i += (s[i+1] === "Q" ? 2 : 1); break;
      case "R":
        if(i===last && !dmAt(s,0,4,"MAC |MC ") && dmAt(s,i-2,2,"IE") && !dmAt(s,i-4,2,"ME|MA")) add("","R");
        else add("R");
        i += (s[i+1] === "R" ? 2 : 1); break;
      case "S":
        if(dmAt(s,i-1,3,"ISL|YSL")){ i++; break; }
        if(i===0 && dmAt(s,0,5,"SUGAR")){ add("X","S"); i++; break; }
        if(dmAt(s,i,2,"SH")){
          if(dmAt(s,i+1,4,"HEIM|HOEK|HOLM|HOLZ")) add("S");
          else add("X");
          i += 2; break;
        }
        if(dmAt(s,i,3,"SIO|SIA") || dmAt(s,i,4,"SIAN")){ add("S","X"); i += 3; break; }
        if((i===0 && dmAt(s,i+1,1,"M|N|L|W")) || s[i+1]==="Z"){
          add("S","X"); i += (s[i+1]==="Z" ? 2 : 1); break;
        }
        if(dmAt(s,i,2,"SC")){
          if(s[i+2] === "H"){
            if(dmAt(s,i+3,2,"OO|ER|EN|UY|ED|EM")) add(dmAt(s,i+3,2,"ER|EN") ? "X" : "SK","SK");
            else if(i===0 && !dmIsVowel(s,3) && s[3]!=="W") add("X","S");
            else add("X");
            i += 3; break;
          }
          if(dmAt(s,i+2,1,"I|E|Y")){ add("S"); i += 3; break; }
          add("SK"); i += 3; break;
        }
        if(i===last && dmAt(s,i-2,2,"AI|OI")) add("","S");
        else add("S");
        i += (s[i+1]==="S" || s[i+1]==="Z") ? 2 : 1; break;
      case "T":
        if(dmAt(s,i,4,"TION")){ add("X"); i += 3; break; }
        if(dmAt(s,i,3,"TIA|TCH")){ add(dmAt(s,i,3,"TCH") ? "X" : "X"); i += 3; break; }
        if(dmAt(s,i,2,"TH") || dmAt(s,i,3,"TTH")){
          if(dmAt(s,i+2,2,"OM|AM") || dmAt(s,0,4,"VAN |VON ") || dmAt(s,0,3,"SCH")) add("T");
          else add("0","T");
          i += 2; break;
        }
        add("T"); i += (s[i+1]==="T" || s[i+1]==="D") ? 2 : 1; break;
      case "V":
        add("F"); i += (s[i+1] === "V" ? 2 : 1); break;
      case "W":
        if(dmAt(s,i,2,"WR")){ add("R"); i += 2; break; }
        // who / whom / whose / whole: "wh" before O is an H sound
        if(dmAt(s,i,3,"WHO")){ add("H"); i += 2; break; }
        if(i===0 && (dmIsVowel(s,i+1) || dmAt(s,i,2,"WH"))){
          if(dmIsVowel(s,i+1)) add("A","F"); else add("A");
          i++; break;
        }
        if((i===last && dmIsVowel(s,i-1)) || dmAt(s,i-1,5,"EWSKI|EWSKY|OWSKI|OWSKY") || dmAt(s,0,3,"SCH")){
          add("","F"); i++; break;
        }
        if(dmAt(s,i,4,"WICZ|WITZ")){ add("TS","FX"); i += 4; break; }
        i++; break;
      case "X":
        if(!(i===last && (dmAt(s,i-3,3,"IAU|EAU") || dmAt(s,i-2,2,"AU|OU")))) add("KS");
        i += (s[i+1]==="C" || s[i+1]==="X") ? 2 : 1; break;
      case "Z":
        if(s[i+1] === "H"){ add("J"); i += 2; break; }
        if(dmAt(s,i+1,2,"ZO|ZI|ZA") || (i>0 && s[i-1]==="T")) add("S","TS");
        else add("S");
        i += (s[i+1] === "Z" ? 2 : 1); break;
      default:
        i++;
    }
  }
  return [pri.slice(0,6), sec.slice(0,6)];
}

// ---- consonant skeleton ----
// Every vowel removed. This is the encoder that does the real work on
// texting: "txt", "pls", "bcz", "thx", "msg" and "tmrw" all reduce to
// exactly the skeleton of the word they stand for.
const SKELETON_FOLD = { c:"k", q:"k", x:"ks", z:"s", v:"f", j:"g", y:"" };
function consonantSkeleton(word){
  let w = word.toLowerCase().replace(/[^a-z]/g,"");
  if(!w) return "";
  w = w.replace(/^(kn|gn|wr|ps|pn|mn)/,"n")
       .replace(/ph/g,"f").replace(/gh/g,"").replace(/ck/g,"k")
       .replace(/ch/g,"C").replace(/sh/g,"S").replace(/th/g,"T").replace(/qu/g,"k");
  let out = "";
  for(const ch of w){
    if("aeiou".indexOf(ch) !== -1) continue;
    if(ch === "C" || ch === "S" || ch === "T"){ out += ch; continue; }
    out += (SKELETON_FOLD[ch] !== undefined ? SKELETON_FOLD[ch] : ch);
  }
  return out.replace(/(.)\1+/g,"$1");
}

// ---- soundex ----
// Coarser than the metaphone and wrong in different places, which is
// exactly why it is worth consulting as a second opinion.
const SOUNDEX_CODE = { b:1,f:1,p:1,v:1, c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,
                       d:3,t:3, l:4, m:5,n:5, r:6 };
function soundexKey(word){
  const w = word.toLowerCase().replace(/[^a-z]/g,"");
  if(!w) return "";
  let out = w[0], prev = SOUNDEX_CODE[w[0]] || 0;
  for(let i=1;i<w.length && out.length<4;i++){
    const code = SOUNDEX_CODE[w[i]] || 0;
    if(code && code !== prev) out += code;
    if(w[i] !== "h" && w[i] !== "w") prev = code;
  }
  return (out + "000").slice(0,4);
}

// ---- vowel shape ----
// The original key, with the one change that mattered: vowels are folded
// into three broad classes instead of all becoming "a", so "hat", "hit"
// and "hot" stop colliding while "grey"/"gray" still meet.
const VOWEL_CLASS = { a:"A", e:"E", i:"E", o:"O", u:"O", y:"E" };
const VOWEL_SHAPE_RULES = [
    [/^kn/,"n"],[/^gn/,"n"],[/^wr/,"r"],[/^ps/,"s"],[/^pn/,"n"],[/^x/,"z"],
    [/ough$/,"of"],[/ough/g,"o"],[/augh/g,"af"],
    [/ph/g,"f"],[/gh/g,""],
    [/tion/g,"Sn"],[/sion/g,"Sn"],[/cian/g,"Sn"],[/sure/g,"Sr"],
    [/tch/g,"C"],[/ch/g,"C"],[/sh/g,"S"],[/th/g,"T"],[/ck/g,"k"],[/qu/g,"kw"],[/dge/g,"j"],
    [/c(?=[eiy])/g,"s"],[/c/g,"k"],[/g(?=[eiy])/g,"j"],
    [/x/g,"ks"],[/z/g,"s"],[/v/g,"f"],
    [/([^aeiouy])e$/,"$1"]
  ];
function vowelShape(word){
  let w = word.toLowerCase().replace(/[^a-z']/g,"");
  for(const [re,rep] of VOWEL_SHAPE_RULES) w = w.replace(re,rep);
  w = w.replace(/[aeiouy]+/g, m => VOWEL_CLASS[m[0]] || "A");
  return w.replace(/(.)\1+/g,"$1");
}

// Kept under its original name: other parts of the checker call it.
function phoneticKey(word){ return vowelShape(word); }

// ---- indexes ----
// Built on first use rather than at load, so opening the page stays fast
// and the cost is paid once, by whoever actually mistypes something.
const PHONETIC_DEPTH = 60000;
const BUCKET_CAP = 24;
let PHONETIC_INDEX = new Map();      // vowel shape  (name kept for compatibility)
let DM_INDEX = new Map();            // double metaphone, primary and secondary
let SKELETON_INDEX = new Map();      // consonant skeleton
let SOUNDEX_INDEX = new Map();
let indexesBuilt = false;

function pushBucket(map, key, word){
  if(!key) return;
  let b = map.get(key);
  if(!b){ b = []; map.set(key, b); }
  if(b.length < BUCKET_CAP) b.push(word);
}
const INDEX_DEPTH = Math.min(PHONETIC_DEPTH, WORD_LIST.length);
let indexCursor = 0;
function indexChunk(n){
  const stop = Math.min(indexCursor + n, INDEX_DEPTH);
  for(; indexCursor < stop; indexCursor++){
    const w = WORD_LIST[indexCursor];
    if(w.length < 2) continue;
    pushBucket(PHONETIC_INDEX, vowelShape(w), w);
    pushBucket(SKELETON_INDEX, consonantSkeleton(w), w);
    pushBucket(SOUNDEX_INDEX, soundexKey(w), w);
    const [p,sx] = doubleMetaphone(w);
    pushBucket(DM_INDEX, p, w);
    if(sx && sx !== p) pushBucket(DM_INDEX, sx, w);
  }
  if(indexCursor >= INDEX_DEPTH) indexesBuilt = true;
}
// Finish the index now. Called before any phonetic lookup; usually a no-op
// because the background pass below has already got there.
function buildPhoneticIndexes(){
  if(!indexesBuilt) indexChunk(INDEX_DEPTH);
}
// Encoding 60,000 words takes around a second, which is fine to spend but
// not fine to spend all at once while someone is typing. It is done in
// slices during idle time from the moment the page loads, so by the time
// anyone misspells anything the index is normally already there.
(function primePhoneticIndexes(){
  if(typeof window === "undefined") return;
  const idle = window.requestIdleCallback || (fn => setTimeout(() => fn({ timeRemaining:() => 8 }), 1));
  const step = deadline => {
    do { indexChunk(2000); }
    while(!indexesBuilt && deadline.timeRemaining && deadline.timeRemaining() > 4);
    if(!indexesBuilt) idle(step);
  };
  idle(step);
})();

// Phonetic keys are short and drawn from a small alphabet, so instead of
// scanning every bucket for near misses we generate the handful of keys
// one edit away from the query and look those up directly. A few hundred
// O(1) probes, rather than a sweep over tens of thousands of buckets.
const DM_ALPHABET   = "APKTFHJLMNRSX0";
const SKEL_ALPHABET = "bkdfghjklmnprstwCST";
function nearKeys(key, alphabet){
  const out = new Set();
  for(let i=0;i<key.length;i++) out.add(key.slice(0,i) + key.slice(i+1));          // deletion
  for(let i=0;i<key.length;i++)
    for(const c of alphabet) if(c !== key[i]) out.add(key.slice(0,i) + c + key.slice(i+1));  // substitution
  for(let i=0;i<=key.length;i++)
    for(const c of alphabet) out.add(key.slice(0,i) + c + key.slice(i));           // insertion
  out.delete(key);
  return out;
}

// Gather phonetic candidates, tagging each with how it was found so the
// ranker can tell a three-encoder agreement from a single lucky hit.
function phoneticCandidates(lw){
  buildPhoneticIndexes();
  const hits = new Map();   // word -> { exact:Set, near:Set }
  const note = (w, enc, exact) => {
    if(w === lw) return;
    let h = hits.get(w);
    if(!h){ h = { exact:new Set(), near:new Set() }; hits.set(w, h); }
    (exact ? h.exact : h.near).add(enc);
  };

  const shape = vowelShape(lw);
  const skel  = consonantSkeleton(lw);
  const sdx   = soundexKey(lw);
  const [dp, ds] = doubleMetaphone(lw);

  if(PHONETIC_INDEX.has(shape)) for(const w of PHONETIC_INDEX.get(shape)) note(w,"shape",true);
  if(SKELETON_INDEX.has(skel) && skel.length >= 2) for(const w of SKELETON_INDEX.get(skel)) note(w,"skel",true);
  if(SOUNDEX_INDEX.has(sdx)) for(const w of SOUNDEX_INDEX.get(sdx)) note(w,"sdx",true);
  for(const k of (ds && ds !== dp) ? [dp,ds] : [dp]){
    if(DM_INDEX.has(k)) for(const w of DM_INDEX.get(k)) note(w,"dm",true);
  }

  // Near misses are a fallback: only worth the probes when the exact keys
  // did not turn up much, and only for short keys, where a single edit is
  // still a meaningful resemblance rather than a coincidence.
  if(hits.size < 8){
    if(dp.length >= 2 && dp.length <= 5){
      for(const k of nearKeys(dp, DM_ALPHABET)){
        const b = DM_INDEX.get(k);
        if(b) for(const w of b) note(w,"dm~",false);
      }
    }
    if(skel.length >= 2 && skel.length <= 5){
      for(const k of nearKeys(skel, SKEL_ALPHABET)){
        const b = SKELETON_INDEX.get(k);
        if(b) for(const w of b) note(w,"skel~",false);
      }
    }
  }
  return hits;
}

// ---- run-together words ----
function trySplit(word){
  if(word.length < 3 || word.length > 18) return null;
  const FREQ_CAP = 2500;
  for(let i=1; i<word.length; i++){
    const a = word.slice(0,i), b = word.slice(i);
    if(b.length>=2 && RANK.has(a) && RANK.has(b) && RANK.get(a)<FREQ_CAP && RANK.get(b)<FREQ_CAP)
      return a + " " + b;
  }
  return null;
}

// ---- suffix confusion ----
const SUFFIX_SWAPS = [
  ["ant","ent"],["ent","ant"],["ance","ence"],["ence","ance"],
  ["able","ible"],["ible","able"],["ary","ery"],["ery","ary"],
  ["ary","ory"],["ory","ary"],["tion","sion"],["sion","tion"],
  ["sion","cian"],["ify","efy"],["efy","ify"],["ise","ice"],["ice","ise"],
  ["cal","cle"],["cle","cal"],["ly","ley"],["ey","y"],["y","ey"],
  ["shun","tion"],["shon","tion"],["cion","tion"],["ck","c"],["k","c"],
  ["z","se"],["s","ce"],["f","ph"],["ff","ph"],["u","ou"],["er","re"],["or","our"]
];
function suffixCandidates(word){
  const out = [];
  for(const [from,to] of SUFFIX_SWAPS) if(word.endsWith(from)) out.push(word.slice(0, -from.length) + to);
  return out;
}

// ---- informal lookup ----
// Returns the standard form for a chat spelling, or null. Elongation,
// leetspeak and digit rebus are unwound first, so "pleeeease", "pl3ase"
// and "b4" all resolve without needing their own entries.
function informalExpansion(lw){
  const direct = INFORMAL[lw];
  if(direct) return { words:direct, kind:"informal" };
  if(INITIALISMS[lw]) return { words:[INITIALISMS[lw]], kind:"initialism" };
  if(lw.length === 1 && LETTER_NAME_WORDS[lw]) return { words:LETTER_NAME_WORDS[lw], kind:"letter" };

  for(const v of elongationVariants(lw)){
    if(INFORMAL[v]) return { words:INFORMAL[v], kind:"informal", via:"elongation" };
    if(DICTIONARY.has(v)) return { words:[v], kind:"elongation" };
  }
  const flat = deLeet(lw);
  if(flat){
    if(INFORMAL[flat]) return { words:INFORMAL[flat], kind:"informal", via:"leet" };
    if(DICTIONARY.has(flat)) return { words:[flat], kind:"leet" };
  }
  for(const v of rebusVariants(lw)){
    if(DICTIONARY.has(v)) return { words:[v], kind:"rebus" };
    if(INFORMAL[v]) return { words:INFORMAL[v], kind:"informal", via:"rebus" };
  }
  // Sounding the digits out rarely lands exactly on the spelling: "b4"
  // gives "befor", a letter short of "before". Allow one edit to close it.
  const loose = [];
  for(const v of rebusVariants(lw)){
    if(v.length < 5) continue;
    for(const cand of knownOf(edits1(v))){
      // The expansion has to still look like the word it lands on, or
      // "h2o" -> "htoo" would happily drift to "too".
      if(cand.slice(0,2) !== v.slice(0,2)) continue;
      loose.push({ w:cand, r: RANK.has(cand) ? RANK.get(cand) : WORD_LIST.length });
    }
  }
  if(loose.length){
    loose.sort((a,b)=>a.r-b.r);
    const words = [];
    for(const c of loose){ if(words.indexOf(c.w) === -1) words.push(c.w); if(words.length === 3) break; }
    return { words, kind:"rebus" };
  }
  return null;
}

// How informal the surrounding words are. Used to decide whether a token
// that is also an ordinary English word is being used as chat shorthand:
// "wont" is a noun in "against her wont" and a contraction in "i wont go",
// and only the company it keeps tells the two apart.
function informalSignal(neighbours){
  let signal = 0;
  for(const n of neighbours){
    if(!n) continue;
    if(INITIALISMS[n]) signal += 2;
    else if(INFORMAL[n] && !DICTIONARY.has(n)) signal += 2;
    else if(n.length === 1 && LETTER_NAME_WORDS[n] && n !== "a" && n !== "i" && n !== "o") signal += 1;
    else if(AMBIGUOUS_INFORMAL[n]) signal += 1;
  }
  return signal;
}
function informalInContext(lw, neighbours){
  if(!AMBIGUOUS_INFORMAL[lw]) return null;
  return informalSignal(neighbours) >= 2 ? AMBIGUOUS_INFORMAL[lw] : null;
}

// ---------------------------------------------------------------
// 3c. CURATED DATA
//     Three tables the encoders cannot derive for themselves.
//
//     The engine gets the overwhelming majority of misspellings right on
//     its own, so these are not a substitute for it — they are the cases
//     where it ranks the right answer second. "suprise" is a keystroke
//     from both "surprise" and "suppress"; "peice" is a keystroke from
//     both "piece" and "peace". Nothing in the spelling or the sound
//     separates them, so the choice has to be recorded rather than
//     computed.
// ---------------------------------------------------------------

// Misspellings where the correct answer loses a tie it ought to win, plus
// the classics that any checker is judged on. Applied before the encoders.
const MISSPELLINGS = Object.create(null);
function misspellings(map){ for(const k in map) MISSPELLINGS[k] = map[k]; }

// vowel confusions and near-homophone traps
misspellings({
  suprise:"surprise", suprised:"surprised", suprising:"surprising",
  peice:"piece", peices:"pieces", theif:"thief", theives:"thieves",
  liason:"liaison", liasion:"liaison", tounge:"tongue", vehical:"vehicle",
  yatch:"yacht", desparate:"desperate", desparately:"desperately",
  seperate:"separate", seperated:"separated", seperately:"separately",
  seperation:"separation", definate:"definite", definately:"definitely",
  definitly:"definitely", greatful:"grateful",
  concious:"conscious", conscous:"conscious", concius:"conscious",
  pronounciation:"pronunciation", occurance:"occurrence", occurence:"occurrence",
  existance:"existence", persistance:"persistence", resistence:"resistance",
  independance:"independence", correspondance:"correspondence",
  maintainance:"maintenance", maintenence:"maintenance", perseverence:"perseverance",
  relevent:"relevant", prevalant:"prevalent", persistant:"persistent",
  consistant:"consistent", apparant:"apparent", ignorence:"ignorance",
  tendancy:"tendency", dependancy:"dependency", competance:"competence"
});

// doubled and undoubled consonants
misspellings({
  acommodate:"accommodate", accomodate:"accommodate", acommodation:"accommodation",
  accomodation:"accommodation", ocassion:"occasion", occassion:"occasion",
  neccessary:"necessary", necesary:"necessary", neccesary:"necessary",
  embarass:"embarrass", embarassed:"embarrassed", embarassing:"embarrassing",
  embarassment:"embarrassment", harrass:"harass", harrassment:"harassment",
  begining:"beginning", comming:"coming", runing:"running", stoping:"stopping",
  refered:"referred", refering:"referring", prefered:"preferred",
  preffered:"preferred", occured:"occurred", occuring:"occurring",
  commited:"committed", commitee:"committee", comittee:"committee",
  millenium:"millennium", paralel:"parallel", parralel:"parallel",
  posession:"possession", posessive:"possessive", proffesional:"professional",
  profesional:"professional", succesful:"successful", sucessful:"successful",
  succesfully:"successfully", adress:"address", agressive:"aggressive",
  agression:"aggression", apparrent:"apparent", dissapoint:"disappoint",
  dissapointed:"disappointed", dissapear:"disappear", dissapeared:"disappeared",
  untill:"until", fullfil:"fulfil", fullfill:"fulfil", wilfull:"wilful",
  withold:"withhold", threshhold:"threshold", excelent:"excellent",
  intelligient:"intelligent", inteligence:"intelligence", inteligent:"intelligent",
  interupt:"interrupt", interupted:"interrupted", tommorrow:"tomorrow",
  tommorow:"tomorrow", writting:"writing", writen:"written", vaccum:"vacuum"
});

// ie / ei and silent letters
misspellings({
  recieve:"receive", recieved:"received", recieving:"receiving",
  beleive:"believe", beleived:"believed", beleif:"belief",
  acheive:"achieve", acheived:"achieved", acheivement:"achievement",
  wierd:"weird", freind:"friend", freinds:"friends", feild:"field",
  sheild:"shield", yeild:"yield", greif:"grief", releif:"relief",
  concieve:"conceive", decieve:"deceive", percieve:"perceive",
  foriegn:"foreign", heigth:"height", wieght:"weight", seige:"siege",
  sieze:"seize", neigbour:"neighbour", nieghbour:"neighbour",
  rythm:"rhythm", rythem:"rhythm", goverment:"government", enviroment:"environment",
  enviromental:"environmental", parliment:"parliament", knowlege:"knowledge",
  knowledgable:"knowledgeable", gaurd:"guard", gaurantee:"guarantee",
  garantee:"guarantee", garanteed:"guaranteed", shedule:"schedule",
  wich:"which", propoganda:"propaganda"
});

// suffix confusions
misspellings({
  arguement:"argument", truely:"truly", duely:"duly",
  basicly:"basically", publically:"publicly", finaly:"finally",
  completly:"completely", immediatly:"immediately", unfortunatly:"unfortunately",
  sincerly:"sincerely", extremly:"extremely", absolutly:"absolutely",
  aparently:"apparently", especialy:"especially", generaly:"generally",
  usualy:"usually", reccomend:"recommend", recomend:"recommend",
  recomendation:"recommendation", accesible:"accessible", responsable:"responsible",
  irresistable:"irresistible", indispensible:"indispensable", visable:"visible",
  managable:"manageable", changable:"changeable", noticable:"noticeable",
  knowlegable:"knowledgeable", supercede:"supersede", proceedure:"procedure",
  catagory:"category", catagories:"categories", cemetary:"cemetery", secratary:"secretary",
  temperture:"temperature", miniture:"miniature", questionaire:"questionnaire",
  restaraunt:"restaurant", resturant:"restaurant", labratory:"laboratory",
  libary:"library", febuary:"february", wensday:"wednesday"
});

// British forms the frequency ordering tends to bury
misspellings({
  liscence:"licence", lisence:"licence",
  humourous:"humorous", glamourous:"glamorous", rigourous:"rigorous",
  vigourous:"vigorous", laborous:"laborious", mischevious:"mischievous",
  mischievious:"mischievous", religous:"religious", exagerate:"exaggerate",
  exagerated:"exaggerated", equiptment:"equipment", sacrafice:"sacrifice",
  sargeant:"sergeant", pharoah:"pharaoh", buisness:"business",
  bussiness:"business", collegue:"colleague", curiousity:"curiosity",
  familliar:"familiar", similer:"similar", speach:"speech",
  vegatable:"vegetable", potatoe:"potato", tomatoe:"tomato",
  privelege:"privilege", priviledge:"privilege", prejudise:"prejudice",
  repitition:"repetition", heirarchy:"hierarchy", bizzare:"bizarre",
  athiest:"atheist", fourty:"forty", ninty:"ninety", personnell:"personnel"
});

// Words written as one that should be two, and the reverse. The splitter
// finds some of these on its own, but it cannot tell "a lot" (wanted) from
// "a dress" (not), because both split into two perfectly ordinary words.
const RUN_TOGETHER = {
  alot:"a lot", aswell:"as well", atleast:"at least", infact:"in fact",
  incase:"in case", inspite:"in spite", eachother:"each other",
  everytime:"every time", nevermind:"never mind", thankyou:"thank you",
  upto:"up to", aslong:"as long", ontop:"on top", inorder:"in order",
  ofcourse:"of course", alltogether:"altogether", eventhough:"even though",
  abit:"a bit", awhole:"a whole", infront:"in front",
  nowdays:"nowadays", atall:"at all"
};

// Rare words that are one keystroke from a very common one. Flagged only as
// advisory, and never corrected outright: "calender" really is a machine for
// pressing cloth, "wether" really is a castrated ram, and someone writing
// about either deserves to be left alone. The suggestion just asks.
const RARE_WORD_CONFUSABLES = {
  calender:"calendar", wether:"whether", florescent:"fluorescent",
  calvary:"cavalry", miniscule:"minuscule", millenia:"millennia",
  supercedes:"supersedes", trafic:"traffic"
};

// A rare dictionary word that is a keystroke from a very common one. The
// frequency check is a second lock on the table: if a word turns out to be
// common after all, it is left alone whatever the list says.
function rareWordConfusion(lw){
  const alt = RARE_WORD_CONFUSABLES[lw];
  if(!alt || !DICTIONARY.has(alt)) return null;
  const mine = RANK.has(lw) ? RANK.get(lw) : WORD_LIST.length;
  const theirs = RANK.has(alt) ? RANK.get(alt) : WORD_LIST.length;
  return (mine > 25000 && theirs < mine / 3) ? alt : null;
}

// Look a misspelling up, allowing for an inflection the table does not list:
// "acommodated" is not an entry, but "acommodate" is, and the ending can be
// carried across.
const INFLECTIONS = [
  ["s",""], ["es",""], ["ed",""], ["d",""], ["ing",""], ["ly",""],
  ["ment",""], ["ness",""], ["er",""], ["ers",""], ["ion",""]
];
function misspellingLookup(lw){
  const direct = MISSPELLINGS[lw] || RUN_TOGETHER[lw];
  if(direct) return direct;
  for(const [suf] of INFLECTIONS){
    if(!lw.endsWith(suf) || lw.length <= suf.length + 2) continue;
    const stem = lw.slice(0, -suf.length);
    const fix = MISSPELLINGS[stem];
    if(!fix || fix.indexOf(" ") !== -1) continue;
    // reattach the ending, allowing for a dropped or doubled final letter
    const tries = [fix + suf];
    if(fix.endsWith("e")) tries.push(fix.slice(0,-1) + suf);
    if(suf === "s" && /(s|x|z|ch|sh)$/.test(fix)) tries.push(fix + "es");
    if(suf === "ly" && fix.endsWith("y")) tries.push(fix.slice(0,-1) + "ily");
    for(const t of tries) if(DICTIONARY.has(t)) return t;
  }
  return null;
}

// ---------------------------------------------------------------
// 3d. AMERICAN SPELLINGS
//     The dictionary is British, so American forms fail it and come out
//     as misspellings. Naming them properly is worth doing anyway, and
//     it is what makes "ignore American spellings" possible.
//
//     Rather than generating American variants of all 114,500 British
//     words and indexing them, the rules run backwards on the token in
//     hand: "color" is turned into "colour" and the dictionary is asked.
//     That costs nothing, needs no index, and is self-checking — a rule
//     misfiring on "doctor" produces "doctour", which is not a word, so
//     the candidate is simply dropped. Only tokens that have already
//     failed the dictionary ever reach here, so no British spelling can
//     be caught by it.
// ---------------------------------------------------------------

// Pairs no rule derives: different words rather than different endings.
const AMERICAN_IRREGULARS = {
  plow:"plough", plows:"ploughs", plowed:"ploughed", plowing:"ploughing",
  mold:"mould", molds:"moulds", molded:"moulded", molding:"moulding",
  moldy:"mouldy", molt:"moult", molted:"moulted", smolder:"smoulder",
  smoldering:"smouldering", boulder:"boulder",
  gray:"grey", grays:"greys", grayer:"greyer", grayest:"greyest",
  grayish:"greyish", grayed:"greyed", jewelry:"jewellery",
  aluminum:"aluminium", pajamas:"pyjamas", pajama:"pyjama",
  skeptic:"sceptic", skeptics:"sceptics", skeptical:"sceptical",
  skeptically:"sceptically", skepticism:"scepticism",
  airplane:"aeroplane", airplanes:"aeroplanes", donut:"doughnut",
  donuts:"doughnuts", specialty:"speciality", specialties:"specialities",
  artifact:"artefact", artifacts:"artefacts", carburetor:"carburettor",
  sulfur:"sulphur", sulfate:"sulphate", sulfide:"sulphide",
  sulfuric:"sulphuric", cozy:"cosy", cozier:"cosier", coziest:"cosiest",
  cozily:"cosily", mustache:"moustache", mustaches:"moustaches",
  omelet:"omelette", omelets:"omelettes", persnickety:"pernickety",
  maneuver:"manoeuvre", maneuvers:"manoeuvres", maneuvered:"manoeuvred",
  maneuvering:"manoeuvring", maneuverable:"manoeuvrable",
  furor:"furore", math:"maths", mom:"mum", moms:"mums", ax:"axe",
  checkered:"chequered", tidbit:"titbit", tidbits:"titbits",
  aging:"ageing", judgment:"judgement", judgments:"judgements",
  fulfillment:"fulfilment", enrollment:"enrolment",
  installment:"instalment", skillful:"skilful", skillfully:"skilfully",
  willful:"wilful", willfully:"wilfully", instill:"instil",
  distill:"distil", fulfill:"fulfil", fulfills:"fulfils", appall:"appal",
  appalls:"appals", annex:"annexe", dexterously:"dextrously",
  gases:"gasses", vise:"vice", curb:"kerb", curbs:"kerbs",
  spelled:"spelt", burned:"burnt", dreamed:"dreamt", leaped:"leapt",
  kneeled:"knelt", smelled:"smelt", spilled:"spilt", spoiled:"spoilt",
  learned:"learnt"
};

// Endings that take an American spelling with them, so the rule can tell a
// suffix boundary from the middle of a word.
const AM_SUFFIX = "(s|es|ed|ing|er|ers|est|ly|ment|ments|able|ably|ful|less|ist|ists|ism|ite|ites|ation|ations)?$";

function americanCandidates(w){
  const out = [];
  const add = c => { if(c && c !== w && out.indexOf(c) === -1) out.push(c); };

  // color -> colour, favorite -> favourite, honorable -> honourable
  add(w.replace(new RegExp("or" + AM_SUFFIX), (m,s)=> "our" + (s||"")));
  // organize -> organise, organization -> organisation, analyze -> analyse
  add(w.replace(/iz(?=[ea])/g, "is"));
  add(w.replace(/yz(?=[ea])/g, "ys"));
  // center -> centre, theater -> theatre, fiber -> fibre
  add(w.replace(/er(s)?$/, (m,s)=> "re" + (s||"")));
  // catalog -> catalogue, dialog -> dialogue
  add(w.replace(/og(s|ue)?$/, "ogue"));
  // traveled -> travelled, marvelous -> marvellous, counselor -> counsellor
  add(w.replace(/l(ed|ing|er|ers|or|ors|ous|ously|ery)$/, (m,s)=> "ll" + s));
  // defense -> defence, license -> licence, pretense -> pretence
  add(w.replace(/nse(s|d)?$/, (m,s)=> "nce" + (s||"")));
  // fulfill -> fulfil, skillful -> skilful
  add(w.replace(/ll(ment|ful|fully)?$/, (m,s)=> "l" + (s||"")));
  // program -> programme, gram -> gramme
  add(w.replace(/gram(s)?$/, (m,s)=> "gramme" + (s||"")));
  // anemia -> anaemia, fetus -> foetus, medieval -> mediaeval
  // The classical digraphs are restored one "e" at a time and the
  // dictionary throws out everything that was not a word to begin with.
  let from = 0, found = 0;
  while(found < 4){
    const i = w.indexOf("e", from);
    if(i === -1) break;
    add(w.slice(0,i) + "ae" + w.slice(i+1));
    add(w.slice(0,i) + "oe" + w.slice(i+1));
    from = i + 1; found++;
  }
  return out;
}

const americanCache = new Map();

// Returns the British form of an American spelling, or null. Only sensible
// for a token that is not already in the dictionary.
function americanSpelling(lw){
  if(americanCache.has(lw)) return americanCache.get(lw);
  let result = null;
  const irregular = AMERICAN_IRREGULARS[lw];
  if(irregular && DICTIONARY.has(irregular)) result = irregular;
  else {
    let best = null, bestRank = Infinity;
    for(const c of americanCandidates(lw)){
      if(!DICTIONARY.has(c)) continue;
      const r = RANK.has(c) ? RANK.get(c) : WORD_LIST.length;
      if(r < bestRank){ best = c; bestRank = r; }
    }
    result = best;
  }
  americanCache.set(lw, result);
  return result;
}
// ---- suggestion ranking ----
// Scored in bands rather than on one continuous scale. An orthographic
// near-miss used to beat a phonetic match every time, because a single
// edit was worth less than any phonetic penalty could overcome — which
// is why "fone" resolved to "fine" rather than "phone". Bands stop the
// two kinds of evidence competing directly: a word backed by several
// encoders cannot be displaced by one that merely looks similar.
const BAND = { informal:0, strong:1000, phonetic:2600, orthographic:4200 };

// The encoders are not equally trustworthy. The vowel shape keeps both the
// consonants and the rough vowel melody, so agreeing with it means a great
// deal; the consonant skeleton throws the vowels away on purpose and so
// agrees far too readily to count for much on its own.
const ENCODER_WEIGHT = { shape:3, dm:2, skel:1, sdx:1 };
function agreementWeight(h){
  if(!h) return 0;
  let total = 0;
  for(const e of h.exact) total += ENCODER_WEIGHT[e] || 1;
  for(const e of h.near)  total += (ENCODER_WEIGHT[e.replace("~","")] || 1) * 0.5;
  return total;
}

const suggestCache = new Map();
function suggestFor(lw){
  if(suggestCache.has(lw)) return suggestCache.get(lw);

  // 1. informal lexicon — decisive when it fires
  const inf = informalExpansion(lw);
  if(inf){
    const result = {
      type: inf.kind === "initialism" ? "informal" : "spelling",
      suggestions: inf.words.slice(0,6),
      confidence: "high",
      kind: inf.kind,
      reason: inf.kind === "initialism"
        ? 'Chat initialism. Spell it out in writing anyone else has to read.'
        : inf.kind === "letter"
          ? 'The name of the letter is being used for the word that sounds like it.'
          : inf.kind === "elongation"
            ? 'Repeated letters, held down for emphasis.'
            : inf.kind === "rebus"
              ? 'A digit standing in for the sound of its name.'
              : inf.kind === "leet"
                ? 'Digits and symbols standing in for letters.'
                : 'Texting shorthand.'
    };
    suggestCache.set(lw, result);
    return result;
  }

  // Leetspeak that does not resolve to a real word is still worth cleaning
  // up before matching: "w0rkin" should be matched as "workin", not as a
  // token containing a digit.
  const cleaned = deLeet(lw);
  const base = (cleaned && !DICTIONARY.has(cleaned)) ? cleaned : lw;

  // 2. curated misspellings — the cases where the right answer would
  //    otherwise lose a tie it ought to win
  const fixed = misspellingLookup(lw);
  if(fixed){
    const result = {
      type:"spelling", suggestions:[fixed], confidence:"high",
      kind: fixed.indexOf(" ") !== -1 ? "runtogether" : "spelling",
      reason: fixed.indexOf(" ") !== -1
        ? 'Two words written as one.'
        : 'A common misspelling of "'+fixed+'".'
    };
    suggestCache.set(lw, result);
    return result;
  }

  // 3. orthographic candidates
  const pool = new Map();   // word -> band
  const setBand = (w,b) => { if(!pool.has(w) || pool.get(w) > b) pool.set(w,b); };
  for(const w of knownOf(edits1(base))) setBand(w, BAND.orthographic);
  if(pool.size < 4 && lw.length <= 12) for(const w of knownEdits2(base)) setBand(w, BAND.orthographic);
  for(const w of suffixCandidates(base)) if(DICTIONARY.has(w)) setBand(w, BAND.phonetic);

  // 4. phonetic candidates, banded by how much the encoders agree
  const hits = phoneticCandidates(base);
  for(const [w,h] of hits){
    if(!DICTIONARY.has(w)) continue;
    const weight = agreementWeight(h);
    // The consonant skeleton agrees readily by design: "seperate" and
    // "support" share one. On its own, and with the spelling nowhere near,
    // that is a coincidence rather than a suggestion.
    if(weight < 2 && damerauLevenshtein(base, w) > 3) continue;
    // Three of the four encoders read consonants only, so they agree with
    // each other far more often than they agree by luck — "seperate",
    // "spirit" and "support" all reduce to SPRT. Only the vowel shape is
    // independent evidence, so the top band is reserved for candidates it
    // backs as well.
    const shaped = h.exact.has("shape");
    setBand(w, (shaped && weight >= 4) ? BAND.strong
             : weight >= 2 ? BAND.phonetic
             : BAND.phonetic + 500);
  }

  const split = trySplit(base);

  const ranked = Array.from(pool).map(([w,band])=>{
    const rawDist = damerauLevenshtein(base, w);
    const dist = weightedEditDistance(base, w);
    const weight = agreementWeight(hits.get(w));
    const freq = RANK.has(w) ? RANK.get(w) : WORD_LIST.length;
    // A single keystroke is the strongest evidence there is, so a one-edit
    // match is promoted to the top band rather than being left to lose to a
    // sound-alike: "enviroment" is "environment", even though "informant"
    // happens to share a metaphone with it.
    // Two edits still beats a word that merely rhymes, so close spellings are
    // promoted a band as well. Without this the alternatives on offer for
    // "seperate" drift to "spirit" and "support" instead of "separated".
    const effective = rawDist <= 1 ? Math.min(band, BAND.strong)
                    : rawDist <= 2 ? Math.min(band, BAND.phonetic)
                    : band;
    // Within a band: weight of encoder agreement first, then how common the
    // word is, then how close the spelling is. None of these crosses a band.
    const score = effective
      - weight * 180
      + Math.min(freq, 90000) * 0.006
      + dist * 90
      + Math.abs(base.length - w.length) * 25
      - keyboardScore(base, w) * 15;
    return { w, score, rawDist, weight };
  });
  ranked.sort((a,b)=> a.score - b.score);

  let top = ranked.slice(0,8).map(r=>r.w);
  if(split){
    // A split used to be promoted to first place unconditionally, which made
    // "adress" come out as "a dress" and "withold" as "with old". It belongs
    // ahead of the single-word candidates only when none of them is close.
    const best = ranked[0];
    if(!best || best.rawDist > 1) top.unshift(split);
    else top.splice(1, 0, split);
  }
  top = Array.from(new Set(top)).slice(0,6);

  let result;
  if(top.length === 0){
    result = { type:"unknown", suggestions:[], confidence:"low", kind:"unknown", reason:null };
  } else {
    const best = ranked[0];
    const phoneticLed = best && best.weight >= 2 && best.rawDist > 1;
    const confidence = (best && best.rawDist <= 1) ? "high"
                     : (best && best.weight >= 4) ? "high"
                     : (best && (best.rawDist <= 2 || best.weight >= 2)) ? "medium" : "low";
    result = {
      type:"spelling", suggestions: top, confidence,
      kind: phoneticLed ? "phonetic" : "spelling",
      reason: phoneticLed
        ? 'Spelled the way it sounds. "'+top[0]+'" is the written form.'
        : null
    };
  }
  suggestCache.set(lw, result);
  return result;
}

// Is this token spelled correctly, allowing for possessives, plurals of
// proper nouns and hyphenated compounds?
function spellingKnown(lw){
  if(DICTIONARY.has(lw)) return true;
  if(lw.endsWith("'s") && DICTIONARY.has(lw.slice(0,-2))) return true;   // dog's
  if(lw.endsWith("s'") && DICTIONARY.has(lw.slice(0,-2))) return true;   // dogs'
  if(lw.endsWith("'") && DICTIONARY.has(lw.slice(0,-1))) return true;
  return false;
}
