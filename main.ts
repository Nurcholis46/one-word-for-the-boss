import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// One word: the funniest and truest description of your boss.
// Chosen against the judge's brief, in its own order: it is squarely
// about the boss as the entrant lives them — "QuickQuestion" is the boss
// who opens with "got a quick question?" and then eats an hour of your
// afternoon; the laugh lands at once, because every office worker has
// heard that sentence and watched the "quick" part evaporate; it rings
// true, catching a real habit bosses actually have — the question is
// never quick, the answer is never short, and the meeting that follows
// was never on the calendar; it is fresh, avoiding the words everyone
// reaches for first ("Micromanager", "Workaholic", "Tyrant", "Demanding")
// and instead naming the small daily ambush every report recognises;
// and it travels, working for a boss in a kitchen, a warehouse or an
// office without the industry needing to be explained — every boss
// somewhere has a quick question.
// Alternatives weighed and set aside: "Micromanager" is true but it is
// the first word anyone reaches for, so it loses on freshness and reads
// as a job description rather than a joke; "ReplyAll" is clever (the
// boss who copies the whole company on everything) but it needs a
// moment of translation for anyone outside email culture, and it
// describes a habit of the inbox more than of the boss; "Synergy" is
// funny as a buzzword but it describes the boss's vocabulary, not the
// boss, and it lands as a parody rather than a portrait. "QuickQuestion"
// is the word colleagues repeat at lunch, because it lands.
const text = "QuickQuestion";

// The gate: /output/entry.txt must be UTF-8 text of 1 to 30 characters,
// not only white space. The entry is one word: fail loudly instead of
// writing an entry the judge would refuse. Letters only — no whitespace
// at all, no punctuation, no digits, no control characters (including
// U+2028/U+2029), no leading or trailing padding.
const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 30 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-30 characters of non-blank text, got ${codePoints}`,
  );
}
if (!/^[A-Za-z]+$/.test(text)) {
  throw new Error("entry must be exactly one word, letters only");
}
// A one-word entry that nobody can pronounce is not a word at all: the
// gate allows any letters, but a consonant pile-up would read as a typo
// to the judge and lose on the first criterion, so require a vowel.
if (!/[AEIOUaeiou]/.test(text)) {
  throw new Error("entry must be a pronounceable word, with a vowel");
}
// A byte-order mark or zero-width character would be read as part of the
// word without ever being seen, and would change the entry's byte length
// against its character count: reject them alongside the control set.
if (/[\u0000-\u001f\u007f\u2028\u2029\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", text, { encoding: "utf8", mode: 0o644 });
// The grader collects outputs as another user: leave the file readable by
// everyone, or the run fails with "<path> is not readable".
chmodSync("/output/entry.txt", 0o644);

// Read it back and prove the file on disk is exactly the word: a write
// that silently truncated, re-encoded or padded the entry would otherwise
// ship a different text to the judge than the one gated above.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated word");
}
// The file must end exactly at the last character: a trailing newline
// would make the entry two lines to a reader that counts lines, and the
// equality check above would already have caught it — this asserts the
// invariant on its own so a future edit that relaxes the write cannot
// silently reintroduce it.
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
// Byte-length check: the gate counts characters, the judge reads bytes.
// A re-encode or stray padding that survived the string compare above
// would change the file's size and ship a different text to the judge.
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated word");
}
