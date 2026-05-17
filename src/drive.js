const { google } = require("googleapis");
const config = require("./config");

function extractFolderId(input) {
  if (!input) return null;
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]+$/.test(input.trim())) return input.trim();
  return null;
}

async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.googleServiceAccountPath,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

// List all PDFs in the folder with pagination
async function listPdfFiles() {
  const folderId = extractFolderId(config.googleDriveFolder);
  if (!folderId) throw new Error("Invalid GOOGLE_DRIVE_FOLDER in .env");

  const drive = await getDriveClient();
  const allFiles = [];
  let pageToken = null;

  console.log(`Fetching PDFs from Drive folder: ${folderId}`);

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
      fields: "nextPageToken, files(id, name, webViewLink)",
      pageSize: 100,
      pageToken: pageToken || undefined,
      orderBy: "name",
    });

    allFiles.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;

    if (pageToken) console.log(`  ${allFiles.length} files loaded, fetching more...`);
  } while (pageToken);

  console.log(`Found ${allFiles.length} PDF(s)\n`);
  return allFiles;
}

// Download a file as Buffer
async function downloadFile(fileId) {
  const drive = await getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data);
}

module.exports = { listPdfFiles, downloadFile };
