const path = require("path");

// CV number from filename (format: {cvNo}_random_text.pdf)
function extractCvNo(filename) {
  return path.basename(filename, ".pdf").split("_")[0] || "";
}

// Name: letters, spaces, periods, apostrophes only
function extractName(text) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const validChars = /^[a-zA-Z\s'.]+$/;

  const blacklist = [
    "experience", "education", "skills", "contact", "language", "awards",
    "summary", "profile", "objective", "projects", "certifications",
    "references", "hobbies", "interests", "achievements", "organization",
    "activities", "volunteer", "publications", "information", "attributes",
    "university", "college", "institute", "school", "academy",
    "evaluation", "research", "project", "working", "work",
    "sales", "marketing", "engineering", "workshop", "automotive",
    "dormitory", "international", "domestic", "professional",
    "translator", "developer", "designer", "engineer", "manager",
    "analyst", "coordinator", "specialist", "consultant", "assistant",
    "director", "supervisor", "administrator", "intern", "trainee",
    "part-time", "full-time", "freelance", "self-employed",
    "nationality", "biodata", "curriculum", "vitae", "resume",
    "bachelor", "master", "diploma", "degree", "major",
    "phone", "email", "address", "location", "city",
    "native", "fluent", "proficient", "intermediate", "beginner",
    "english", "chinese", "indonesian", "mandarin", "korean", "japanese",
    "french", "german", "spanish", "italian", "portuguese", "arabic",
    "hindi", "malay", "thai", "vietnamese", "russian", "dutch",
    "cantonese", "hokkien", "teochew", "hakka",
    "speaking", "excellence", "development", "solving", "learning",
    "student", "teacher", "professor", "doctor", "nurse", "accountant",
    "lawyer", "secretary", "officer", "executive", "president",
    "jakarta", "surabaya", "bandung", "medan", "semarang", "indonesia",
    "china", "beijing", "shanghai", "guangzhou", "shenzhen",
    "detailed", "personal", "technical", "soft", "core", "key",
    "about", "me", "my",
    "creative", "design", "game", "data", "mechatronics", "science",
    "technology", "system", "systems", "network", "multimedia",
    "communication", "architecture", "computing", "programming",
    "leadership", "teamwork", "responsible", "organized", "adaptability",
    "languages", "tools", "frameworks", "databases", "methodologies",
  ];

  // Strip CJK, parenthesized content, pipes, non-ASCII
  function clean(line) {
    return line
      .replace(/[\u4e00-\u9fff\u3400-\u4dbf]+/g, "")
      .replace(/[（(][^)）]*[)）]/g, "")
      .replace(/\|.*$/g, "")
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isValid(line) {
    if (!validChars.test(line)) return false;
    if (line.length < 2 || line.length > 50) return false;

    const words = line.toLowerCase().split(/\s+/);
    if (words.some((w) => blacklist.includes(w.replace(/[.']/g, "")))) return false;

    const nameWords = line.split(/\s+/);
    if (nameWords.length < 1 || nameWords.length > 5) return false;
    if (!nameWords.every((w) => /^[A-Z]/.test(w))) return false;

    return true;
  }

  // Scan first 30 lines, fallback to remaining
  const candidates = [];
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const c = clean(lines[i]);
    if (isValid(c)) candidates.push({ line: c, index: i });
  }

  if (candidates.length === 0) {
    for (let i = 30; i < lines.length; i++) {
      const c = clean(lines[i]);
      if (isValid(c)) {
        candidates.push({ line: c, index: i });
        break;
      }
    }
  }

  if (candidates.length === 0) return "";

  // Try combining consecutive candidates (split names)
  for (let i = 0; i < candidates.length - 1; i++) {
    const curr = candidates[i], next = candidates[i + 1];
    if (next.index === curr.index + 1) {
      if (curr.line.toLowerCase() === next.line.toLowerCase()) continue;
      const combined = `${curr.line} ${next.line}`;
      if (combined.split(/\s+/).length <= 5) return combined;
    }
  }

  // Prefer multi-word over single-word (avoid acronyms)
  const multi = candidates.filter((c) => c.line.split(/\s+/).length >= 2);
  const single = candidates.filter((c) => c.line.split(/\s+/).length === 1 && c.line.length >= 5);
  const best = (multi.length > 0 ? multi : single)[0];
  if (!best) return "";

  let name = best.line;

  // Check next line for continuation
  const nextIdx = best.index + 1;
  if (nextIdx < lines.length) {
    const cleaned = clean(lines[nextIdx]);
    if (isValid(cleaned) && cleaned.length <= 30 && cleaned.toLowerCase() !== name.toLowerCase()) {
      name = `${name} ${cleaned}`;
    }
  }

  return name;
}

function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
}

function extractPhone(text) {
  const matches = text.match(/(?:\+?\d{1,4}[\s\-]?)?(?:\(?\d{1,5}\)?[\s\-]?)?\d[\d\s\-]{5,15}\d/g);
  if (!matches) return "";

  for (const m of matches) {
    const trimmed = m.trim();
    if (/^\d{4}\s*[-–—]\s*\d{4}$/.test(trimmed)) continue; // skip year ranges
    if (/^\d{4}$/.test(trimmed)) continue; // skip standalone years
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) return trimmed;
  }

  return "";
}

// Highest HSK level found
function extractMandarinCompetency(text) {
  const matches = [...text.matchAll(/HSK[\s\-]?([1-6])/gi)];
  if (matches.length === 0) return "";
  return `HSK ${Math.max(...matches.map((m) => parseInt(m[1])))}`;
}

function extractStatus(text) {
  const lower = text.toLowerCase();
  const currentYear = new Date().getFullYear().toString();

  const highSchoolKw = ["sma", "smk", "high school", "senior high", "高中", "sekolah menengah atas"];
  const universityKw = [
    "university", "universitas", "institut", "college", "bachelor", "master",
    "s1", "s2", "d3", "d4", "diploma", "sarjana", "magister", "大学", "学院", "本科", "硕士",
  ];

  const hasUni = universityKw.some((kw) => lower.includes(kw));

  const notGradKw = [
    "current student", "currently studying", "expected graduation",
    "expected to graduate", "in progress", "ongoing", "semester",
    "在读", "预计毕业", "mahasiswa", "studying", "currently pursuing",
  ];

  const hasOngoing = /\d{4}\s*[-–—]\s*(?:now|present|sekarang|至今)/i.test(text);
  const isNotGrad = notGradKw.some((kw) => lower.includes(kw)) || hasOngoing;

  if (isNotGrad && hasUni) return "Not Yet Graduated";

  const gradYear = new RegExp(
    `(?:graduat(?:ed|ion)|lulus|毕业).*?${currentYear}|${currentYear}.*?(?:graduat(?:ed|ion)|lulus|毕业)`, "i"
  );
  if (gradYear.test(text)) return "Graduated This Year";

  const yearRange = new RegExp(`\\d{4}\\s*[-–—]\\s*${currentYear}`, "g");
  if (yearRange.test(text) && hasUni) return "Graduated This Year";

  if (!hasUni && highSchoolKw.some((kw) => lower.includes(kw))) return "High School Graduate";
  if (hasUni && !isNotGrad) return "Graduated";

  return "";
}

function extractMajor(text) {
  const lines = text.split("\n");

  const majors = [
    "computer science", "information technology", "informatics", "teknik informatika",
    "sistem informasi", "information systems", "software engineering",
    "electrical engineering", "mechanical engineering", "civil engineering",
    "chemical engineering", "industrial engineering",
    "economy", "economics", "business", "management", "accounting", "akuntansi",
    "finance", "marketing", "law", "hukum", "psychology", "communication", "komunikasi",
    "design", "architecture", "arsitektur", "medicine", "pharmacy", "nursing",
    "mathematics", "physics", "chemistry", "biology", "statistics",
    "data science", "artificial intelligence", "cyber security", "network", "multimedia",
    "visual communication design", "international relations", "public administration",
    "sociology", "english literature", "chinese literature", "japanese literature",
    "education", "teaching", "hospitality", "tourism", "food technology",
    "agribusiness", "agriculture", "计算机科学", "信息技术", "经济学", "工商管理", "会计",
  ];

  // Search near major/field labels first
  const sectionRe = /(?:major|jurusan|program studi|field of study|specialization|专业|学位)/i;
  for (let i = 0; i < lines.length; i++) {
    if (sectionRe.test(lines[i])) {
      const ctx = lines.slice(i, i + 3).join(" ").toLowerCase();
      for (const m of majors) {
        if (ctx.includes(m.toLowerCase())) return m.charAt(0).toUpperCase() + m.slice(1);
      }
      const colon = lines[i].match(/(?:major|jurusan|program studi|field of study|specialization|专业)[:\s]+(.+)/i);
      if (colon) return colon[1].trim();
    }
  }

  // Fallback: near education section
  const eduIdx = text.toLowerCase().search(/education|pendidikan|学历|教育/);
  if (eduIdx !== -1) {
    const eduText = text.substring(eduIdx).toLowerCase();
    for (const m of majors) {
      if (eduText.includes(m.toLowerCase())) return m.charAt(0).toUpperCase() + m.slice(1);
    }
  }

  // Last resort: anywhere
  const lower = text.toLowerCase();
  for (const m of majors) {
    if (lower.includes(m.toLowerCase())) return m.charAt(0).toUpperCase() + m.slice(1);
  }

  return "";
}

function extractDegreeLevel(text) {
  const lower = text.toLowerCase();

  const degrees = [
    { keywords: ["phd", "ph.d", "doctorate", "doctoral", "博士"], label: "PhD" },
    { keywords: ["master", "m.sc", "m.s.", "mba", "magister", "硕士"], label: "Master" },
    { keywords: ["bachelor", "b.sc", "b.s.", "b.a.", "sarjana", "学士", "本科", "s.kom", "s.e", "s.t"], label: "Bachelor" },
    { keywords: ["d4", "diploma iv", "diploma 4"], label: "D4" },
    { keywords: ["d3", "diploma iii", "diploma 3"], label: "D3" },
    { keywords: ["diploma", "associate"], label: "Diploma" },
    { keywords: ["sma", "smk", "high school", "senior high", "高中"], label: "High School" },
  ];

  // S1/S2/S3 standalone (avoid CJK false positives)
  const standalonePatterns = [
    { pattern: /\bS3\b/, label: "PhD" },
    { pattern: /\bS2\b/, label: "Master" },
    { pattern: /\bS1\b/, label: "Bachelor" },
  ];

  const eduStart = text.toLowerCase().search(/education|pendidikan|学历|教育/);
  const eduLines = (eduStart !== -1 ? text.substring(eduStart) : "").split("\n");
  const cjk = /[\u4e00-\u9fff\u3400-\u4dbf]/;

  for (const s of standalonePatterns) {
    for (const line of eduLines) {
      if (!cjk.test(line) && s.pattern.test(line)) return s.label;
    }
  }

  const eduText = eduStart !== -1 ? text.substring(eduStart).toLowerCase() : lower;
  for (const d of degrees) {
    if (d.keywords.some((kw) => eduText.includes(kw))) return d.label;
  }

  return "";
}

// Hometown: letters and spaces only, known cities or labeled values
function extractHometown(text) {
  const lines = text.split("\n");
  const valid = /^[a-zA-Z\s]+$/;

  function isValid(val) {
    const v = val.trim();
    return valid.test(v) && v.length >= 2 && v.length <= 40 && v.split(/\s+/).length <= 4;
  }

  // Check labeled values
  const labelRe = /(?:address|alamat|domisili|domicile|location|kota|city|hometown|居住地|地址)[:\s]+(.+)/i;
  for (const line of lines) {
    const match = line.match(labelRe);
    if (match) {
      const raw = match[1].trim().replace(/[,|•·].*$/, "").trim();
      if (isValid(raw)) return raw;
    }
  }

  // Known Indonesian cities in header area
  const cities = [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang",
    "Makassar", "Palembang", "Tangerang", "Depok", "Bekasi",
    "Bogor", "Malang", "Yogyakarta", "Solo", "Denpasar",
    "Bali", "Batam", "Pekanbaru", "Manado", "Pontianak",
    "Balikpapan", "Samarinda", "Banjarmasin", "Padang",
    "Lampung", "Jambi", "Mataram", "Kupang", "Ambon",
    "Jayapura", "Cirebon", "Tasikmalaya", "Karawang",
    "Cikarang", "Serpong", "Indonesia",
  ];

  const header = lines.slice(0, 20).join("\n");
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(header)) return city;
  }

  return "";
}

// Main extraction: combines all fields
function extractAll(text, filename) {
  const cvNo = extractCvNo(filename);
  const degree = extractDegreeLevel(text);
  const status = extractStatus(text);
  const fullStatus = degree ? `${degree} - ${status || "Graduated"}` : status;

  return {
    cvNo,
    name: extractName(text),
    mandarinCompetency: extractMandarinCompetency(text),
    status: fullStatus,
    major: extractMajor(text),
    hometown: extractHometown(text),
    cvLink: "",
    email: extractEmail(text),
    phone: extractPhone(text),
  };
}

module.exports = { extractAll };
