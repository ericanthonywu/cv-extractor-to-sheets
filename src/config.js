const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const config = {
  googleSheetsId: process.env.GOOGLE_SHEETS_ID,
  googleSheetName: process.env.GOOGLE_SHEET_NAME || "Sheet1",
  googleDriveFolder: process.env.GOOGLE_DRIVE_FOLDER,
  googleServiceAccountPath: path.resolve(
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "./service-account.json"
  ),
  cvFolder: path.resolve("./cvs"),
};

if (!config.googleSheetsId) throw new Error("GOOGLE_SHEETS_ID is required");
if (!config.googleDriveFolder) throw new Error("GOOGLE_DRIVE_FOLDER is required");

module.exports = config;
