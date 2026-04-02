const fs = require('fs');
const path = require('path');

// Mock data path
const badwordsData = {
  badwords: ["chó", "gà", "lồn", "dm", "vl"]
};

// Normalize badwords like in the actual app
const normalizedBadwords = badwordsData.badwords.map(w => w.normalize('NFC').toLowerCase());

function checkRegex(text) {
  const content = text.normalize('NFC').toLowerCase();
  for (const word of normalizedBadwords) {
    const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])${word}(?=$|[^\\p{L}\\p{N}])`, 'iu');
    if (regex.test(content)) {
      return { isToxic: true, word };
    }
  }
  return { isToxic: false };
}

const tests = [
  { input: "Bạn thật là gà", expected: true },
  { input: "đồ chó này", expected: true },
  { input: "dm thằng kia", expected: true },
  { input: "vãi lúa", expected: false },
  { input: "conchó", expected: false },
  { input: "Gà rán ngon lắm", expected: true }, // Should be true because 'gà' is a word, even if it's not and insult here. The regex is broad.
  { input: "chó săn", expected: true }
];

tests.forEach(t => {
  const result = checkRegex(t.input);
  console.log(`Input: "${t.input}" | Found: ${result.isToxic} (${result.word || ''}) | Pass: ${result.isToxic === t.expected}`);
});
