const path = require("path");
const config = require("./src/config");
const { parsePdf } = require("./src/pdfParser");
const { extractAll } = require("./src/extractor");
const { appendToSheet } = require("./src/sheets");
const { listPdfFiles, downloadFile } = require("./src/drive");

async function main() {
  console.log("=== CV Extractor ===\n");

  const files = await listPdfFiles();
  if (files.length === 0) return console.log("No PDFs found.");

  // Sort by CV number (numeric ascending)
  files.sort((a, b) => {
    const numA = parseInt(a.name.split("_")[0]) || 0;
    const numB = parseInt(b.name.split("_")[0]) || 0;
    return numA - numB;
  });

  let success = 0, fail = 0;
  const errors = [];

  for (const file of files) {
    console.log(`Processing: ${file.name}`);

    try {
      const buffer = await downloadFile(file.id);
      const text = await parsePdf(buffer);
      let data;

      if (!text || text.trim().length === 0) {
        // Scanned/image PDF — append with CV number only
        console.log("  ⚠ No extractable text");
        data = {
          cvNo: path.basename(file.name, ".pdf").split("_")[0],
          name: "", mandarinCompetency: "", status: "", major: "",
          hometown: "", cvLink: file.webViewLink || "",
          email: "", phone: "",
        };
      } else {
        data = extractAll(text, file.name);
        data.cvLink = file.webViewLink || "";
        console.log(`  Name: ${data.name || "-"} | Email: ${data.email || "-"} | Phone: ${data.phone || "-"}`);
      }

      await appendToSheet([data]);
      console.log("  ✓ Done\n");
      success++;
    } catch (err) {
      console.log(`  ✗ ${err.message}`);
      // Still append CV number on error
      try {
        const cvNo = path.basename(file.name, ".pdf").split("_")[0];
        await appendToSheet([{
          cvNo, name: "", mandarinCompetency: "", status: "", major: "",
          hometown: "", cvLink: file.webViewLink || "", email: "", phone: "",
        }]);
        console.log("  ✓ CV No appended\n");
      } catch { /* ignore sheet error */ }
      errors.push({ file: file.name, error: err.message });
      fail++;
    }
  }

  console.log(`\n=== Summary: ${success} ok, ${fail} failed out of ${files.length} ===`);
  if (errors.length) {
    console.log("\nFailed:");
    errors.forEach((e) => console.log(`  - ${e.file}: ${e.error}`));
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
