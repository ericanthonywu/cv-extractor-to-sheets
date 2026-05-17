const { google } = require("googleapis");
const config = require("./config");

async function getAuthClient() {
  return new google.auth.GoogleAuth({
    keyFile: config.googleServiceAccountPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// Column order: CV No | Name | Mandarin | Status | Major | Hometown | CV Link | Email | Phone
async function appendToSheet(cvDataList) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const rows = cvDataList.map((data) => [
    data.cvNo,
    data.name,
    data.mandarinCompetency,
    data.status,
    data.major,
    data.hometown,
    data.cvLink,
    data.email,
    data.phone.startsWith("+") ? `'${data.phone}` : data.phone,
  ]);

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: config.googleSheetsId,
    range: `'${config.googleSheetName}'!A2`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });

  return response.data;
}

module.exports = { appendToSheet };
