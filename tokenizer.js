// ===============================================================
// 4. TOKENISER + SENTENCE SPLITTER
// ===============================================================
const ABBREVIATIONS = S("mr mrs ms dr prof sr jr st vs etc eg ie inc ltd co no vol fig approx dept univ ave rd pp ed cf al");

function tokenize(text){
  const re = /[A-Za-z]+(?:['\u2019][A-Za-z]+)*/g;
  const tokens = [];
  let m;
  while((m = re.exec(text))){
    const raw = m[0];
    tokens.push({
      raw,
      lw: raw.toLowerCase().replace(/\u2019/g, "'"),
      start: m.index,
      end: m.index + raw.length,
      s: 0, i: 0
    });
  }
  return tokens;
}

function splitSentences(text, tokens){
  const sentences = [];
  let startChar = 0, startTok = 0;
  const boundary = /([.!?]+)(["'\u201d\u2019)\]]*)(\s+|$)/g;
  let m;
  const cuts = [];
  while((m = boundary.exec(text))){
    const before = text.slice(0, m.index);
    const lastWord = (before.match(/([A-Za-z]+)$/) || [])[1];
    if(lastWord && ABBREVIATIONS.has(lastWord.toLowerCase()) && m[1] === ".") continue;
    if(lastWord && lastWord.length === 1 && m[1] === ".") continue; // initials: J. R. Smith
    cuts.push(m.index + m[0].length);
  }
  cuts.push(text.length);
  let ti = 0;
  for(const cut of cuts){
    if(cut <= startChar) continue;
    const tokStart = ti;
    while(ti < tokens.length && tokens[ti].start < cut) ti++;
    if(ti > tokStart || cut === text.length){
      sentences.push({ start: startChar, end: cut, tokStart, tokEnd: ti });
      for(let k=tokStart;k<ti;k++){ tokens[k].s = sentences.length-1; tokens[k].i = k - tokStart; }
    }
    startChar = cut;
    startTok = ti;
  }
  return sentences.filter(s => s.tokEnd > s.tokStart);
}

