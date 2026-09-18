// ===============================================================
// 7. PUNCTUATION AND SPACING (character-level)
// ===============================================================
function punctuationIssues(text, add){
  let m;
  const rules = [
    { re:/\s+([,;:!?])/g, title:"Space before punctuation", cat:"punctuation",
      why:'Punctuation sits tight against the word before it.',
      fix:(m)=>m[1] },
    { re:/\s+\.(?!\.)/g, title:"Space before a full stop", cat:"punctuation",
      why:'A full stop sits tight against the word before it.', fix:()=>"." },
    { re:/([,;:])(?=[A-Za-z])/g, title:"Missing space after punctuation", cat:"punctuation",
      why:'A space belongs after a comma, semicolon or colon.', fix:(m)=>m[1] + " " },
    { re:/[ ]{2,}(?=\S)/g, title:"Double space", cat:"punctuation",
      why:'One space between words.', fix:()=>" " },
    { re:/([!?]){3,}/g, title:"Repeated punctuation", cat:"style",
      why:'One mark carries the emphasis; a row of them reads as shouting.', fix:(m)=>m[1] },
    { re:/\b([a-z]+)\.([A-Z][a-z]+)/g, title:"Missing space after a full stop", cat:"punctuation",
      why:'Sentences are separated by a space.', fix:(m)=>m[1] + ". " + m[2] },
    { re:/\s+'\s*s\b/g, title:"Detached possessive", cat:"punctuation",
      why:"The possessive 's attaches to the noun it belongs to.", fix:()=>"'s" }
  ];
  for(const r of rules){
    r.re.lastIndex = 0;
    while((m = r.re.exec(text))){
      if(r.re.source.includes("[a-z]+\\.") ){
        const word = m[1].toLowerCase();
        if(ABBREVIATIONS.has(word)) continue;
      }
      add({ cat:r.cat, rule:"spacing", severity:"critical",
        start:m.index, end:m.index + m[0].length, original:m[0],
        suggestions:[r.fix(m)], title:r.title, why:r.why });
      if(m[0].length === 0) r.re.lastIndex++;
    }
  }
  // unbalanced brackets and quotes
  const opens = (text.match(/\(/g)||[]).length, closes = (text.match(/\)/g)||[]).length;
  if(opens !== closes){
    const idx = opens > closes ? text.lastIndexOf("(") : text.lastIndexOf(")");
    add({ cat:"punctuation", rule:"brackets", severity:"advisory",
      start: Math.max(0,idx), end: Math.max(0,idx)+1, original: text[idx] || "(",
      suggestions:[], title:"Unclosed bracket",
      why:'There '+(opens>closes?'are more opening than closing brackets':'are more closing than opening brackets')+' in this text.' });
  }
  const quotes = (text.match(/"/g)||[]).length;
  if(quotes % 2 === 1){
    const idx = text.lastIndexOf('"');
    add({ cat:"punctuation", rule:"quotes", severity:"advisory",
      start: idx, end: idx+1, original: '"',
      suggestions:[], title:"Unclosed quotation mark",
      why:'This text has an odd number of double quotes.' });
  }
}
