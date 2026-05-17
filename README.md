# CV Extractor

Automated tool that extracts structured candidate data from PDF CVs stored in Google Drive and appends it to a Google Sheet.

## Features

- **Google Drive Integration** — Reads PDFs directly from a shared Drive folder with automatic pagination
- **Regex-Based Extraction** — Parses candidate info using pattern matching (no AI/LLM dependency)
- **Google Sheets Output** — Appends extracted data row-by-row with real-time progress
- **Multi-Format Support** — Handles both ATS-friendly and designed CV layouts
- **Scanned PDF Detection** — Gracefully handles image-based PDFs (appends CV number only)

## Extracted Fields

| Field | Description |
|-------|-------------|
| CV No | Parsed from filename (`{cvNo}_rest.pdf`) |
| Name | First valid name found (letters only, blacklist-filtered) |
| Mandarin Competency | Highest HSK level detected (1-6) |
| Status | Graduation status (Not Yet Graduated / Graduated This Year / Graduated) |
| Major | Field of study from education section |
| Hometown | City/country if explicitly stated |
| CV Link | Auto-generated Google Drive view link |
| Email | First valid email found |
| Phone | First valid phone number found |

## Setup

### 1. Prerequisites

- Node.js 18+
- A Google Cloud project with **Drive API** and **Sheets API** enabled
- A **Service Account** with a downloaded JSON key file

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEET_NAME=Sheet2
GOOGLE_DRIVE_FOLDER=https://drive.google.com/drive/folders/your_folder_id
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json
```

### 4. Share Access

- Share the **Google Drive folder** with your service account email (Viewer)
- Share the **Google Sheet** with your service account email (Editor)

The service account email is the `client_email` field in your JSON key file.

### 5. Run

```bash
npm start
```

## Project Structure

```
├── index.js              # Entry point — orchestrates the pipeline
├── src/
│   ├── config.js         # Environment config loader
│   ├── drive.js          # Google Drive API (list & download PDFs)
│   ├── extractor.js      # Regex-based data extraction logic
│   ├── pdfParser.js      # PDF to text conversion
│   └── sheets.js         # Google Sheets API (append rows)
├── .env.example          # Environment template
└── package.json
```

## Tech Stack

- **Node.js** — Runtime
- **googleapis** — Google Drive & Sheets API client
- **pdf-parse** — PDF text extraction
- **dotenv** — Environment variable management
