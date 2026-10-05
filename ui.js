// ===============================================================
// 9. INTERFACE
// ===============================================================
const editor      = document.getElementById("editor");
const highlights  = document.getElementById("highlights");
const backdrop    = document.getElementById("backdrop");
const notesEl     = document.getElementById("notes");
const filtersEl   = document.getElementById("filters");
const statWords   = document.getElementById("statWords");
const statSent    = document.getElementById("statSentences");
const statRead    = document.getElementById("statReading");
const statEase    = document.getElementById("statEase");
const scoreValue  = document.getElementById("scoreValue");
const scoreArc    = document.getElementById("scoreArc");
const scoreTile   = document.getElementById("scoreTile");
const scoreLabel  = document.getElementById("scoreLabel");
const btnFixAll   = document.getElementById("btnFixAll");
const toggleConf  = document.getElementById("toggleConfusables");
const btnUndo     = document.getElementById("btnUndo");

function ensureOption(id, labelText){
  const existing = document.getElementById(id);
  if(existing) return existing;
  const legend = (document.querySelector && document.querySelector(".legend")) ||
                 (filtersEl && filtersEl.parentNode);
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = id;
  if(!legend) return input;
  const label = document.createElement("label");
  label.appendChild(input);
  label.appendChild(document.createTextNode(" " + labelText));
  legend.appendChild(label);
  return input;
}
function ensureButton(id, className, after){
  const existing = document.getElementById(id);
  if(existing) return existing;
  const b = document.createElement("button");
  b.id = id;
  b.className = className;
  b.disabled = true;
  if(after && after.parentNode) after.parentNode.insertBefore(b, after.nextSibling);
  return b;
}
function ensureStat(id, label){
  const existing = document.getElementById(id);
  if(existing) return existing;
  const row = (document.querySelector && document.querySelector(".stats-row")) || null;
  const value = document.createElement("b");
  value.id = id;
  value.textContent = "—";
  if(!row) return value;
  const span = document.createElement("span");
  span.appendChild(document.createTextNode(label + " "));
  span.appendChild(value);
  row.appendChild(span);
  return value;
}

const toggleAmerican  = ensureOption("toggleAmerican",
  "Ignore American spellings — accept “color”, “organize” and “center” as written");
const btnFixSpelling  = ensureButton("btnFixSpelling", "btn sans", btnFixAll);
const statGrade       = ensureStat("statGrade", "Reading age");

const CAT_LABEL = {
  spelling:"Spelling", grammar:"Grammar", punctuation:"Punctuation",
  style:"Clarity", confusable:"Confusables"
};
const CAT_ORDER = ["spelling","grammar","punctuation","style","confusable"];

const ignored = new Set();
const userDictionary = new Set();
let activeKey = null;
let currentFilter = "all";
let lastResult = null;

// Performance: render() re-runs the whole analysis on a debounce timer, but
// several of its DOM-writing steps (highlight overlay, filter bar, notes
// list) often end up producing byte-for-byte the same output as last time —
// e.g. clicking a filter chip changes nothing about the highlights, and
// typing in one paragraph doesn't change another paragraph's notes. Each
// step below is guarded by a cheap signature check so identical output
// never triggers a DOM write (and the reflow/repaint that comes with it).
// This matters most on low-power devices, where layout work is the
// bottleneck, not JS execution.
let lastHighlightsHtml = null;
let lastFilterSig = null;
let lastNotesSig = null;

// Changes Crockpot makes to the text are undoable — applying a fix, or a
// whole batch of them, should never feel like a one-way door.
const history = [];
function remember(){
  history.push(editor.value);
  if(history.length > 40) history.shift();
  btnUndo.disabled = false;
}
btnUndo.addEventListener("click", () => {
  if(!history.length) return;
  editor.value = history.pop();
  btnUndo.disabled = history.length === 0;
  activeKey = null;
  render();
  editor.focus({ preventScroll: true });
});

function escapeHtml(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function renderHighlights(text, issues){
  let html = "", cursor = 0;
  for(const iss of issues){
    if(iss.start < cursor) continue;           // never nest underlines
    html += escapeHtml(text.slice(cursor, iss.start));
    const cls = "hl hl-" + iss.cat + (iss.key === activeKey ? " hl-active" : "");
    html += '<span class="' + cls + '">' + escapeHtml(text.slice(iss.start, iss.end)) + "</span>";
    cursor = iss.end;
  }
  html += escapeHtml(text.slice(cursor));
  // a trailing newline needs a character after it or the browser collapses it
  html += "\n";
  // Re-running analysis (e.g. after switching a filter chip, or ignoring an
  // issue in a different part of the document) very often leaves this
  // overlay's markup byte-for-byte unchanged. Writing identical innerHTML
  // still forces the browser to re-parse and reflow it, so skip the write
  // entirely when nothing actually changed.
  if(html === lastHighlightsHtml) return;
  lastHighlightsHtml = html;
  highlights.innerHTML = html;
}

function describeScore(score){
  if(score === null) return "Waiting for text";
  if(score >= 95) return "Reads clean";
  if(score >= 85) return "Nearly there";
  if(score >= 70) return "Some work to do";
  if(score >= 50) return "Needs a pass";
  return "Needs a rewrite";
}
function describeEase(ease){
  if(ease >= 80) return "very easy";
  if(ease >= 60) return "plain";
  if(ease >= 50) return "fairly hard";
  if(ease >= 30) return "hard";
  return "very hard";
}

// The editor grows with its text instead of scrolling inside a fixed box, so the
// page does the scrolling and the highlight layer (which fills the same wrapper)
// always lines up with the words underneath it.
const editorWrap = editor.parentElement;
function autosizeEditor(){
  // hold the wrapper at its current height while the textarea is re-measured,
  // so the page never collapses for a moment and jumps the reader's scroll position
  editorWrap.style.minHeight = editorWrap.offsetHeight + "px";
  editor.style.height = "auto";
  editor.style.height = editor.scrollHeight + "px";
  editorWrap.style.minHeight = "";
}

// The margin-notes list follows the editor's height: as the text grows, the
// notes panel grows with it (and scrolls inside itself only once it has more
// notes than that height can show). 560px is the floor, so short documents
// look exactly as they always did.
const leftCard  = editorWrap.closest(".card");
const rightCard = notesEl.closest(".card");
const legendEl  = rightCard && rightCard.querySelector(".legend");
const NOTES_MIN = 560;
const narrowMQ  = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;
function syncNotesHeight(){
  if(!leftCard || !rightCard) return;
  // single-column layout: the two cards are stacked, so there is nothing to match
  if(narrowMQ && narrowMQ.matches){ notesEl.style.maxHeight = ""; return; }
  const n = notesEl.getBoundingClientRect();
  const above = n.top - rightCard.getBoundingClientRect().top;                    // heading, score, filters
  const below = (legendEl ? legendEl.getBoundingClientRect().bottom : n.bottom) - n.bottom +
                (parseFloat(getComputedStyle(rightCard).paddingBottom) || 0);     // legend + padding
  // measured from the parts around the list, never from the list itself, so
  // this settles on one value instead of chasing its own tail
  const v = Math.max(NOTES_MIN, Math.round(leftCard.offsetHeight - above - below)) + "px";
  if(notesEl.style.maxHeight !== v) notesEl.style.maxHeight = v;
}
if(typeof ResizeObserver !== "undefined"){
  const ro = new ResizeObserver(() => requestAnimationFrame(syncNotesHeight));
  if(leftCard) ro.observe(leftCard);
  if(rightCard) ro.observe(rightCard);
} else {
  window.addEventListener("resize", syncNotesHeight);
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(syncNotesHeight);

function render(){
  autosizeEditor();
  const text = editor.value;
  const result = analyze(text, { userDictionary,
                                 flagConfusables: toggleConf.checked,
                                 ignoreAmerican: toggleAmerican.checked });
  lastResult = result;
  const visible = result.issues.filter(iss => !ignored.has(iss.key));

  // stats
  statWords.textContent = result.stats.words;
  statSent.textContent = result.stats.sentences;
  statRead.textContent = result.stats.readingTime + " min";
  const st = result.stats;
  if(st.ease == null){
    statEase.textContent = "—";
    statGrade.textContent = "—";
    statEase.title = "";
  } else {
    statEase.textContent = st.ease + " · " + describeEase(st.ease) +
                           (st.easeProvisional ? " (rough)" : "");
    statGrade.textContent = st.gradeLabel;
    statEase.title = "Flesch reading ease " + st.ease +
      ", Flesch–Kincaid grade " + st.grade + " (" + st.gradeLabel + "). " +
      st.wordsPerSentence + " words per sentence, " +
      st.syllablesPerWord + " syllables per word" +
      (st.easeProvisional ? ". Under thirty words the figure moves a long way on a single long word, so treat it as a rough reading." : ".");
  }

  // score ring
  const score = visible.length === result.issues.length ? result.stats.score : recomputeScore(result, visible);
  const C = 2 * Math.PI * 34;
  if(score === null){
    scoreValue.textContent = "–";
    scoreArc.style.strokeDasharray = "0 " + C;
    scoreTile.style.background = "var(--grey)";
  } else {
    scoreValue.textContent = score;
    scoreArc.style.strokeDasharray = (C * score / 100).toFixed(1) + " " + C;
    const tone = score >= 85 ? "var(--teal)" : (score >= 65 ? "var(--olive)" : "var(--rust)");
    scoreArc.style.stroke = tone;
    scoreTile.style.background = tone;
  }
  scoreLabel.textContent = describeScore(score);

  // filters
  const counts = { all: visible.length };
  CAT_ORDER.forEach(c => counts[c] = 0);
  visible.forEach(i => counts[i.cat]++);
  if(!counts[currentFilter] && currentFilter !== "all") currentFilter = "all";
  const filterDefs = [["all","All"]].concat(CAT_ORDER.filter(c => counts[c] > 0).map(c => [c, CAT_LABEL[c]]));
  // Rebuilding these buttons (and their click handlers) from scratch is
  // wasted work whenever the counts and selection are the same as last
  // time — which is most keystrokes in a large document, since the visible
  // issue set rarely changes character-by-character. Skip it when so.
  const filterSig = currentFilter + "|" + filterDefs.map(([key]) => key + ":" + counts[key]).join(",");
  if(filterSig !== lastFilterSig){
    lastFilterSig = filterSig;
    filtersEl.innerHTML = "";
    filterDefs.forEach(([key,label]) => {
      const b = document.createElement("button");
      b.className = "filter sans" + (currentFilter === key ? " on" : "") + " f-" + key;
      b.innerHTML = escapeHtml(label) + ' <span class="filter-count">' + counts[key] + "</span>";
      b.addEventListener("click", () => { currentFilter = key; render(); });
      filtersEl.appendChild(b);
    });
  }

  const fixable = visible.filter(isConfidentFix);
  btnFixAll.disabled = fixable.length === 0;
  btnFixAll.textContent = fixable.length ? "Fix " + fixable.length + " confident " + (fixable.length === 1 ? "issue" : "issues") : "Nothing to fix yet";

  const spellable = visible.filter(i => isSpellingFix(i) && i.suggestions.length);
  btnFixSpelling.disabled = spellable.length === 0;
  btnFixSpelling.textContent = spellable.length
    ? "Fix " + spellable.length + " " + (spellable.length === 1 ? "misspelling" : "misspellings")
    : "No misspellings";

  renderHighlights(text, visible);

  const shown = visible.filter(i => currentFilter === "all" || i.cat === currentFilter);

  // Every issue card is several DOM nodes plus event listeners, and analyze()
  // reruns on every debounce tick even when only an unrelated part of the
  // document changed. If the set of cards to show (and which one is active)
  // is identical to last time, rebuilding them is pure wasted layout work —
  // skip it, same as the highlights and filter bar above.
  const notesSig = (result.truncated ? "t" : "") + "|" + text.trim().length + "|" + visible.length +
                    "|" + shown.map(i => i.key + (i.key === activeKey ? "*" : "")).join(",");
  if(notesSig === lastNotesSig) return;
  lastNotesSig = notesSig;

  notesEl.innerHTML = "";

  if(result.truncated){
    const note = document.createElement("p");
    note.className = "empty-state sans";
    note.textContent = "Checking the first " + MAX_CHECK_LEN.toLocaleString() + " characters only.";
    notesEl.appendChild(note);
  }
  if(shown.length === 0){
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = text.trim()
      ? (visible.length ? "Nothing in this category." : "Nothing to flag. This reads clean.")
      : "Start typing on the left, or load the example, and notes will appear here.";
    notesEl.appendChild(empty);
    return;
  }
  shown.forEach(issue => notesEl.appendChild(buildCard(issue)));
}

function recomputeScore(result, visible){
  if(result.stats.score === null) return null;
  let penalty = 0;
  visible.forEach(i => penalty += i.severity === "critical" ? 1 : (i.rule === "unknown" ? 0.12 : 0.35));
  const density = penalty / Math.max(result.stats.words, 30);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - Math.min(1, density * 7)))));
}

function isConfidentFix(issue){
  if(issue.severity !== "critical") return false;
  if(!issue.suggestions.length) return false;
  if(issue.cat === "spelling" && issue.rule === "misspelling") return issue.suggestions.length > 0 && issue.why.indexOf("keystroke") !== -1;
  return issue.suggestions.length === 1 || issue.cat === "punctuation";
}

function buildCard(issue){
  const note = document.createElement("div");
  note.className = "note note-" + issue.cat + (issue.key === activeKey ? " note-active" : "");
  note.tabIndex = 0;

  const head = document.createElement("div");
  head.className = "note-head";
  const title = document.createElement("span");
  title.className = "note-title sans";
  title.textContent = issue.title;
  const tag = document.createElement("span");
  tag.className = "note-tag sans tag-" + issue.cat;
  tag.textContent = CAT_LABEL[issue.cat];
  head.appendChild(title); head.appendChild(tag);
  note.appendChild(head);

  const quote = document.createElement("div");
  quote.className = "note-quote";
  const orig = document.createElement("span");
  orig.className = "orig";
  orig.textContent = issue.original.replace(/\s+/g," ");
  quote.appendChild(orig);
  if(issue.suggestions.length){
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "→";
    const fix = document.createElement("span");
    fix.className = "fix";
    fix.textContent = issue.suggestions[0] === "" ? "(remove)" : issue.suggestions[0];
    quote.appendChild(arrow); quote.appendChild(fix);
  }
  note.appendChild(quote);

  const why = document.createElement("p");
  why.className = "note-why sans";
  why.textContent = issue.why;
  note.appendChild(why);

  const row = document.createElement("div");
  row.className = "note-actions";
  issue.suggestions.forEach((s, idx) => {
    const chip = document.createElement("button");
    chip.className = "chip sans" + (idx === 0 ? " chip-primary" : "");
    chip.textContent = idx === 0 ? (s === "" ? "Remove" : "Apply " + '"' + s + '"') : s;
    chip.addEventListener("click", e => { e.stopPropagation(); applyFix(issue, s); });
    row.appendChild(chip);
  });
  const ignoreBtn = document.createElement("button");
  ignoreBtn.className = "linkbtn sans";
  ignoreBtn.textContent = "Ignore";
  ignoreBtn.addEventListener("click", e => { e.stopPropagation(); ignored.add(issue.key); render(); });
  row.appendChild(ignoreBtn);

  if(issue.cat === "spelling"){
    const dictBtn = document.createElement("button");
    dictBtn.className = "linkbtn sans";
    dictBtn.textContent = "Add to dictionary";
    dictBtn.addEventListener("click", e => {
      e.stopPropagation();
      userDictionary.add(issue.original.toLowerCase());
      render();
    });
    row.appendChild(dictBtn);
  }
  note.appendChild(row);

  const focusIssue = () => {
    activeKey = issue.key;
    editor.focus({ preventScroll: true });
    editor.setSelectionRange(issue.start, issue.end);
    render();
    scrollEditorTo(issue.start);
  };
  note.addEventListener("click", focusIssue);
  note.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); focusIssue(); } });
  return note;
}

function scrollEditorTo(pos){
  // The editor no longer scrolls inside itself, so scroll the page. Prefer the
  // highlighted span for the active note (exact, wrapping included); fall back
  // to counting lines before the issue.
  const span = highlights.querySelector(".hl-active");
  let top;
  if(span){
    top = span.getBoundingClientRect().top;
  } else {
    const before = editor.value.slice(0, pos).split("\n").length - 1;
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 30;
    top = editor.getBoundingClientRect().top + before * lineHeight;
  }
  const target = window.scrollY + top - window.innerHeight / 2;
  window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}

function applyFix(issue, suggestion){
  remember();
  const val = editor.value;
  editor.value = val.slice(0, issue.start) + suggestion + val.slice(issue.end);
  const caret = issue.start + suggestion.length;
  editor.focus();
  editor.setSelectionRange(caret, caret);
  activeKey = null;
  render();
}

function applyBatch(filter){
  if(!lastResult) return;
  const fixes = lastResult.issues
    .filter(i => !ignored.has(i.key) && i.suggestions.length && filter(i))
    .sort((a,b) => b.start - a.start);   // back to front, so offsets stay valid
  if(!fixes.length) return;
  remember();
  let val = editor.value;
  let lastStart = Infinity;
  fixes.forEach(f => {
    if(f.end > lastStart) return;        // skip anything that overlaps a fix already made
    val = val.slice(0, f.start) + f.suggestions[0] + val.slice(f.end);
    lastStart = f.start;
  });
  editor.value = val;
  activeKey = null;
  render();
  editor.focus({ preventScroll: true });
}

// Every spelling correction the checker is willing to name, including the
// texting shorthand and the American forms, but not the words it merely
// failed to recognise: those are usually names, and their suggestions are
// guesses. Confusables are left out too — "calender" really might be the
// machine — so this stays a button that cannot quietly change your meaning.
function isSpellingFix(issue){
  return issue.cat === "spelling" &&
         issue.rule !== "unknown" &&
         issue.rule !== "confusable";
}

btnFixAll.addEventListener("click", () => applyBatch(isConfidentFix));
btnFixSpelling.addEventListener("click", () => applyBatch(isSpellingFix));

editor.addEventListener("scroll", () => { backdrop.scrollTop = editor.scrollTop; backdrop.scrollLeft = editor.scrollLeft; });

// re-measure when the available width changes (window resize, rotation, layout
// switch), since that changes where lines wrap; width only, so it cannot loop
let lastEditorWidth = editorWrap.clientWidth;
function onEditorWidthChange(){
  if(editorWrap.clientWidth === lastEditorWidth) return;
  lastEditorWidth = editorWrap.clientWidth;
  autosizeEditor();
}
if(typeof ResizeObserver !== "undefined") new ResizeObserver(onEditorWidthChange).observe(editorWrap);
else window.addEventListener("resize", onEditorWidthChange);
// web fonts arriving late change line widths too
if(document.fonts && document.fonts.ready) document.fonts.ready.then(autosizeEditor);

let debounceTimer = null;
editor.addEventListener("input", () => {
  autosizeEditor();
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(render, 220);
});
toggleConf.addEventListener("change", render);
toggleAmerican.addEventListener("change", render);

document.getElementById("btnClear").addEventListener("click", () => {
  if(editor.value) remember();
  editor.value = "";
  ignored.clear();
  activeKey = null;
  render();
  editor.focus();
});

const SAMPLE_TEXT =
"Their going to the meeting tommorow, but they forgot there keys at you're house. " +
"The the manager said it was a seperate issue, and wich part of the report is wrong is not cler yet.\n\n" +
"I should of checked the figures myself. Me and the team was working on it since monday, and " +
"there is less problems now, but the report were still not finished. He go through the numbers " +
"every evening, and I seen him do it twice. We could of finished early if the data was " +
"recieved on time.\n\n" +
"In order to make a decision at this point in time, we will needs a smaller amount of meetings " +
"and alot less emails. The final outcome was reviewed by the committee, it was approved on " +
"friday. Its important that your happy with the color of the new office , and I hope it wont " +
"be to hard to organize the calendar around it.";

document.getElementById("btnExample").addEventListener("click", () => {
  if(editor.value) remember();
  editor.value = SAMPLE_TEXT;
  ignored.clear();
  userDictionary.clear();
  activeKey = null;
  render();
  editor.focus();
});

render();
syncNotesHeight();
