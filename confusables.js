// ===============================================================
// 5. CONFUSABLE-WORD TABLE (used for the low-confidence advisory pass;
//    the contextual rules in section 6 are the ones that actually decide)
// ===============================================================
const HOMOPHONE_GROUPS = [
  // --- Original set ---
  ["there","their","they're"],["your","you're"],["its","it's"],["then","than"],
  ["affect","effect"],["to","too","two"],["accept","except"],["lose","loose"],
  ["weather","whether"],["principal","principle"],["stationary","stationery"],
  ["complement","compliment"],["desert","dessert"],["led","lead"],["passed","past"],
  ["whose","who's"],["were","we're","where"],["breath","breathe"],["advice","advise"],
  ["farther","further"],["cite","site","sight"],["council","counsel"],
  ["elicit","illicit"],["capital","capitol"],["bare","bear"],["brake","break"],
  ["peace","piece"],["threw","through"],["hear","here"],["new","knew"],
  ["right","write","rite"],["sole","soul"],["waist","waste"],["weak","week"],
  ["board","bored"],["quiet","quite"],["lightning","lightening"],["moral","morale"],
  ["dairy","diary"],["decent","descent","dissent"],["envelop","envelope"],
  ["human","humane"],["later","latter"],["loath","loathe"],["patience","patients"],
  ["precede","proceed"],["scene","seen"],["suit","suite"],["throne","thrown"],
  ["vain","vein","vane"],["altar","alter"],["ascent","assent"],["berth","birth"],
  ["canvas","canvass"],["coarse","course"],["confidant","confident"],
  ["current","currant"],["discreet","discrete"],["elude","allude"],
  ["gorilla","guerrilla"],["hoarse","horse"],["idle","idol"],["mail","male"],
  ["mane","main"],["moose","mousse"],["pray","prey"],["review","revue"],
  ["shone","shown"],["staid","stayed"],["straight","strait"],["tail","tale"],
  ["troop","troupe"],["waive","wave"],["yoke","yolk"],
  ["practice","practise"],["licence","license"],["prophecy","prophesy"],
  ["dependant","dependent"],["draught","draft"],["formally","formerly"],
  ["metal","mettle"],
  ["aisle","isle","I'll"],["allowed","aloud"],["assistance","assistants"],
  ["ball","bawl"],["bald","bawled"],["band","banned"],["bazaar","bizarre"],
  ["billed","build"],["born","borne"],["boarder","border"],["bridal","bridle"],
  ["buy","by","bye"],["cellar","seller"],["cent","scent","sent"],
  ["cereal","serial"],["chord","cord"],["climb","clime"],["colonel","kernel"],
  ["complacent","complaisant"],["core","corps"],["creak","creek"],
  ["dew","due","do"],["die","dye"],["earn","urn"],
  ["eminent","imminent","immanent"],["fair","fare"],["find","fined"],
  ["fir","fur"],["flair","flare"],["flea","flee"],["flew","flu","flue"],
  ["flour","flower"],["foreword","forward"],["foul","fowl"],["gait","gate"],
  ["grate","great"],["grisly","grizzly"],["groan","grown"],["hail","hale"],
  ["hall","haul"],["heal","heel","he'll"],["heard","herd"],
  ["heroin","heroine"],["hoard","horde"],["hole","whole"],
  ["holy","wholly","holey"],["hostel","hostile"],["hymn","him"],
  ["insight","incite"],["knight","night"],["knot","not"],["know","no"],
  ["laid","lain"],["leach","leech"],["leased","least"],["links","lynx"],
  ["loan","lone"],["locks","lox"],["made","maid"],["marshal","martial"],
  ["meat","meet","mete"],["medal","meddle"],["miner","minor"],
  ["missed","mist"],["morning","mourning"],["muscle","mussel"],
  ["naval","navel"],["none","nun"],["oar","or","ore"],["overdo","overdue"],
  ["pail","pale"],["pain","pane"],["pair","pare","pear"],["paws","pause"],
  ["peak","peek","pique"],["peal","peel"],["pedal","peddle","petal"],
  ["plain","plane"],["pole","poll"],["poor","pore","pour"],
  ["populace","populous"],["presence","presents"],["profit","prophet"],
  ["quarts","quartz"],["rain","reign","rein"],["raise","raze","rays"],
  ["reed","read"],["road","rode","rowed"],["role","roll"],["root","route"],
  ["rose","rows"],["rung","wrung"],["sail","sale"],["seam","seem"],
  ["seas","sees","seize"],["serf","surf"],["sew","so","sow"],
  ["shear","sheer"],["side","sighed"],["sink","synch"],["slay","sleigh"],
  ["soar","sore"],["some","sum"],["son","sun"],["stair","stare"],
  ["stake","steak"],["steal","steel"],["step","steppe"],["symbol","cymbal"],
  ["tacked","tact"],["tacks","tax"],["taught","taut"],["team","teem"],
  ["tear","tier"],["throes","throws"],["tide","tied"],["toad","towed"],
  ["told","tolled"],["ton","tun"],["tortoise","tortuous"],["vary","very"],
  ["veil","vale"],["vial","vile"],["wail","whale"],["wait","weight"],
  ["war","wore"],["ware","wear"],["way","weigh","whey"],["which","witch"],
  ["wood","would"],["you'll","yule"],
];
const HOMOPHONE_MAP = {};
HOMOPHONE_GROUPS.forEach(group=>group.forEach(w=>{ HOMOPHONE_MAP[w] = group.filter(x=>x!==w); }));

// Pairs whose distinction is genuinely context-dependent and which the
// contextual rules below already handle — so the advisory pass stays quiet
// about them rather than nagging on every occurrence.
const HANDLED_CONTEXTUALLY = S("there their they're your you're its it's then than to too two lose loose affect effect whose who's were we're where que");

