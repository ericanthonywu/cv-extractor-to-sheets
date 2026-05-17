const fs = require("fs");
const pdf = require("pdf-parse");

// Suppress noisy pdfjs-dist warnings during parsing
const SUPPRESSED = [
  "Ran out of space in font private use area",
  "TT: undefined function",
  "TT: invalid function",
  "Command token too long",
];

async function parsePdf(input) {
  const buffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);

  const origWarn = console.warn;
  const origLog = console.log;
  const suppress = (args) =>
    SUPPRESSED.some((p) => (args[0]?.toString() || "").includes(p));

  console.warn = (...a) => !suppress(a) && origWarn.apply(console, a);
  console.log = (...a) => !suppress(a) && origLog.apply(console, a);

  try {
    const data = await pdf(buffer);
    return data.text;
  } catch {
    return "";
  } finally {
    console.warn = origWarn;
    console.log = origLog;
  }
}

module.exports = { parsePdf };
