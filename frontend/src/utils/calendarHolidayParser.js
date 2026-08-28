/**
 * Month names lookup for natural date parsing
 */
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_SHORT = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Format Date as YYYY-MM-DD string
 */
export function formatISODate(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return "";
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Derive Day of Week from Date string
 */
export function getDayOfWeekFromDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return DAYS_OF_WEEK[d.getDay()] || "";
  } catch {
    return "";
  }
}

/**
 * Parse any natural, ISO, Indian, or Excel serial date into standard ISO YYYY-MM-DD start & end dates
 */
export function parseDateStringToRange(rawVal, defaultYear = 2026) {
  if (rawVal === undefined || rawVal === null) {
    return { startDate: "", endDate: "", schedule: "" };
  }

  // 1. If it is already a JS Date object
  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    const iso = formatISODate(rawVal);
    return { startDate: iso, endDate: iso, schedule: iso };
  }

  // 2. If it is an Excel Serial Date (e.g. 46270)
  if (typeof rawVal === "number" && rawVal > 30000 && rawVal < 70000) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + rawVal * 86400000);
    const iso = formatISODate(d);
    return { startDate: iso, endDate: iso, schedule: iso };
  }

  const str = String(rawVal).trim();
  if (!str) return { startDate: "", endDate: "", schedule: "" };

  // 3. Exact ISO Date: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return { startDate: iso, endDate: iso, schedule: str };
  }

  // 4. Indian Date: DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
  const indMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (indMatch) {
    const [, d, m, y] = indMatch;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return { startDate: iso, endDate: iso, schedule: str };
  }

  // 5. Date Range with dots/hyphens: "16.02.2026 - 21.02.2026" or "07-09-2026 to 11-09-2026"
  const rangeMatch = str.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*(?:-|–|to)\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/i
  );
  if (rangeMatch) {
    const [, d1, m1, y1, d2, m2, y2] = rangeMatch;
    const startIso = `${y1}-${m1.padStart(2, "0")}-${d1.padStart(2, "0")}`;
    const endIso = `${y2}-${m2.padStart(2, "0")}-${d2.padStart(2, "0")}`;
    return { startDate: startIso, endDate: endIso, schedule: str };
  }

  // 6. Natural Language Range: "7th to 11th September 2026", "1st to 5th June 2026", "15th–30th April 2027"
  const natRangeMatch = str.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|–|-)\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i
  );
  if (natRangeMatch) {
    const [, d1, d2, monthStr, yearStr] = natRangeMatch;
    const mIdx = getMonthIndex(monthStr);
    const yr = yearStr ? parseInt(yearStr, 10) : defaultYear;
    if (mIdx >= 0) {
      const startIso = `${yr}-${String(mIdx + 1).padStart(2, "0")}-${String(d1).padStart(2, "0")}`;
      const endIso = `${yr}-${String(mIdx + 1).padStart(2, "0")}-${String(d2).padStart(2, "0")}`;
      return { startDate: startIso, endDate: endIso, schedule: str };
    }
  }

  // 7. Natural Language Single Date: "6th July 2026", "31st October 2026", "26 January 2027"
  const natSingleMatch = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i);
  if (natSingleMatch) {
    const [, d, monthStr, yearStr] = natSingleMatch;
    const mIdx = getMonthIndex(monthStr);
    const yr = yearStr ? parseInt(yearStr, 10) : defaultYear;
    if (mIdx >= 0) {
      const iso = `${yr}-${String(mIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { startDate: iso, endDate: iso, schedule: str };
    }
  }

  // Fallback
  return { startDate: "", endDate: "", schedule: str };
}

function getMonthIndex(str) {
  if (!str) return -1;
  const clean = str.toLowerCase().trim();
  let idx = MONTH_NAMES.indexOf(clean);
  if (idx >= 0) return idx;
  idx = MONTH_SHORT.indexOf(clean.slice(0, 3));
  return idx;
}

/**
 * Auto-detect category for an academic calendar activity
 */
export function detectActivityCategory(name = "", customCat = "") {
  const clean = `${name} ${customCat}`.toLowerCase();
  if (clean.includes("exam") || clean.includes("mid sem") || clean.includes("end sem") || clean.includes("theory") || clean.includes("practical") || clean.includes("viva")) {
    return "exam";
  }
  if (clean.includes("fest") || clean.includes("gajajyoti") || clean.includes("annual") || clean.includes("cultural") || clean.includes("celebration")) {
    return "festival";
  }
  if (clean.includes("sport") || clean.includes("intra") || clean.includes("inter university") || clean.includes("athletic")) {
    return "sports";
  }
  if (clean.includes("internship") || clean.includes("summer training") || clean.includes("placement") || clean.includes("industry")) {
    return "internship";
  }
  if (clean.includes("break") || clean.includes("vacation") || clean.includes("puja break") || clean.includes("diwali break")) {
    return "break";
  }
  if (clean.includes("registration") || clean.includes("depository") || clean.includes("subject registration")) {
    return "registration";
  }
  return "academic";
}

/**
 * Auto-detect type for an academic holiday
 */
export function detectHolidayType(name = "", customType = "") {
  const clean = `${name} ${customType}`.toLowerCase();
  if (clean.includes("optional") || clean.includes("rh") || clean.includes("restricted") || clean.includes("avail any 2")) {
    return "optional";
  }
  if (clean.includes("observation") || clean.includes("jayanti") || clean.includes("diwas") || clean.includes("independence") || clean.includes("republic") || clean.includes("flag hoisting") || clean.includes("commemorative")) {
    return "observation";
  }
  return "holiday";
}

/**
 * Universal Academic Calendar File Parser (Excel .xlsx, .xls, .csv, and Text/PDF)
 */
export async function parseAcademicCalendarFile(file) {
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase();

  // 1. PDF File Text Extraction
  if (ext === "pdf") {
    return parseCalendarFromPDF(file);
  }

  // 2. Excel / CSV File
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows || rows.length === 0) {
          throw new Error("Spreadsheet contains no data rows.");
        }

        const activities = [];

        rows.forEach((row, idx) => {
          // Flexible key lookup
          const slNo = parseInt(findValue(row, ["sl no", "slno", "no", "#", "sl. no."]) || idx + 1, 10);
          const name = String(findValue(row, ["activity name", "activity", "event name", "event", "name", "title", "particulars"]) || "").trim();
          const rawSchedule = findValue(row, ["schedule / dates", "schedule", "dates", "date", "period", "duration"]) || "";
          const rawStart = findValue(row, ["start date (yyyy-mm-dd)", "start date", "startdate", "from date", "start", "from"]) || "";
          const rawEnd = findValue(row, ["end date (yyyy-mm-dd)", "end date", "enddate", "to date", "end", "to"]) || "";
          const rawCat = findValue(row, ["category", "type", "kind", "event type"]) || "";
          const location = String(findValue(row, ["location", "venue", "campus", "place"]) || "").trim();

          if (!name && !rawSchedule && !rawStart) return; // Skip empty rows

          // Parse start and end dates
          let startDate = "";
          let endDate = "";
          let schedule = String(rawSchedule).trim();

          if (rawStart) {
            const parsedStart = parseDateStringToRange(rawStart);
            startDate = parsedStart.startDate;
          }
          if (rawEnd) {
            const parsedEnd = parseDateStringToRange(rawEnd);
            endDate = parsedEnd.endDate;
          }

          if (!startDate && rawSchedule) {
            const parsedRange = parseDateStringToRange(rawSchedule);
            startDate = parsedRange.startDate;
            endDate = parsedRange.endDate || parsedRange.startDate;
            if (!schedule) schedule = parsedRange.schedule;
          }

          if (startDate && !endDate) endDate = startDate;
          if (!schedule && startDate) {
            schedule = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
          }

          const category = detectActivityCategory(name, rawCat);

          activities.push({
            slNo: isNaN(slNo) ? idx + 1 : slNo,
            name: name || `Activity ${idx + 1}`,
            schedule: schedule || "TBA",
            startDate: startDate || "",
            endDate: endDate || startDate || "",
            category,
            location: location || "",
          });
        });

        resolve({
          success: true,
          fileName: file.name,
          activities,
          count: activities.length,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Universal Academic Holidays File Parser (Excel .xlsx, .xls, .csv, and Text/PDF)
 */
export async function parseAcademicHolidaysFile(file) {
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase();

  // 1. PDF File Text Extraction
  if (ext === "pdf") {
    return parseHolidaysFromPDF(file);
  }

  // 2. Excel / CSV File
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows || rows.length === 0) {
          throw new Error("Spreadsheet contains no data rows.");
        }

        const holidays = [];

        rows.forEach((row, idx) => {
          const slNo = parseInt(findValue(row, ["sl no", "slno", "no", "#", "sl. no."]) || idx + 1, 10);
          const name = String(findValue(row, ["holiday name", "festival", "occasion", "holiday", "name", "title"]) || "").trim();
          const rawDate = findValue(row, ["date (dd.mm.yyyy)", "date (yyyy-mm-dd)", "date", "holiday date", "dates"]) || "";
          const rawDay = String(findValue(row, ["day of week", "day", "weekday"]) || "").trim();
          const rawType = String(findValue(row, ["type (holiday/observation/optional)", "type", "kind", "category"]) || "").trim();
          const description = String(findValue(row, ["description", "remarks", "details", "note"]) || "").trim();

          if (!name && !rawDate) return; // Skip empty rows

          const parsedDate = parseDateStringToRange(rawDate);
          const dateStr = parsedDate.startDate || "";
          const derivedDay = rawDay || getDayOfWeekFromDate(dateStr) || "Monday";
          const type = detectHolidayType(name, rawType);
          const isOptional = type === "optional";
          const isObservation = type === "observation";

          holidays.push({
            slNo: isNaN(slNo) ? idx + 1 : slNo,
            title: name || `Holiday ${idx + 1}`,
            date: dateStr,
            day: derivedDay,
            type,
            isOptional,
            isObservation,
            description: description || (isOptional ? "Optional University Holiday" : isObservation ? "University Observation Day" : "Official University Holiday"),
          });
        });

        resolve({
          success: true,
          fileName: file.name,
          holidays,
          count: holidays.length,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract Date and clean Name from any line of text (used for PDF & loose text rows)
 */
export function extractDateAndNameFromLine(line, defaultYear = 2026) {
  if (!line || typeof line !== "string") return null;
  const original = line.trim();

  // 1. Date Range: DD.MM.YYYY - DD.MM.YYYY
  const rangePattern = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*(?:-|–|to)\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})/i;
  const rangeMatch = original.match(rangePattern);
  if (rangeMatch) {
    const [, d1, m1, y1, d2, m2, y2] = rangeMatch;
    const startIso = `${y1}-${m1.padStart(2, "0")}-${d1.padStart(2, "0")}`;
    const endIso = `${y2}-${m2.padStart(2, "0")}-${d2.padStart(2, "0")}`;
    const matchedText = rangeMatch[0];
    const name = original
      .replace(matchedText, "")
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/[:|\-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      startDate: startIso,
      endDate: endIso,
      schedule: matchedText,
      name,
    };
  }

  // 2. Natural Range: "7th to 11th September 2026"
  const natRangePattern = /(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|–|-)\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i;
  const natRangeMatch = original.match(natRangePattern);
  if (natRangeMatch) {
    const [, d1, d2, monthStr, yearStr] = natRangeMatch;
    const mIdx = getMonthIndex(monthStr);
    const yr = yearStr ? parseInt(yearStr, 10) : defaultYear;
    if (mIdx >= 0) {
      const startIso = `${yr}-${String(mIdx + 1).padStart(2, "0")}-${String(d1).padStart(2, "0")}`;
      const endIso = `${yr}-${String(mIdx + 1).padStart(2, "0")}-${String(d2).padStart(2, "0")}`;
      const matchedText = natRangeMatch[0];
      const name = original
        .replace(matchedText, "")
        .replace(/^\d+[\.\)]\s*/, "")
        .replace(/[:|\-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return {
        startDate: startIso,
        endDate: endIso,
        schedule: matchedText,
        name,
      };
    }
  }

  // 3. Indian Single Date: DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
  const indPattern = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/;
  const indMatch = original.match(indPattern);
  if (indMatch) {
    const [, d, m, y] = indMatch;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const matchedText = indMatch[0];
    const name = original
      .replace(matchedText, "")
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/[:|\-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      startDate: iso,
      endDate: iso,
      schedule: matchedText,
      name,
    };
  }

  // 4. ISO Single Date: YYYY-MM-DD
  const isoPattern = /\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/;
  const isoMatch = original.match(isoPattern);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const matchedText = isoMatch[0];
    const name = original
      .replace(matchedText, "")
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/[:|\-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      startDate: iso,
      endDate: iso,
      schedule: matchedText,
      name,
    };
  }

  // 5. Natural Single Date: "6th July 2026", "31st October 2026"
  const natSinglePattern = /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?\b/i;
  const natSingleMatch = original.match(natSinglePattern);
  if (natSingleMatch) {
    const [, d, monthStr, yearStr] = natSingleMatch;
    const mIdx = getMonthIndex(monthStr);
    const yr = yearStr ? parseInt(yearStr, 10) : defaultYear;
    if (mIdx >= 0) {
      const iso = `${yr}-${String(mIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const matchedText = natSingleMatch[0];
      const name = original
        .replace(matchedText, "")
        .replace(/^\d+[\.\)]\s*/, "")
        .replace(/[:|\-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return {
        startDate: iso,
        endDate: iso,
        schedule: matchedText,
        name,
      };
    }
  }

  return null;
}

/**
 * Client-Side PDF Text Extractor & Parser for Academic Calendar
 */
async function parseCalendarFromPDF(file) {
  const text = await extractTextFromPDFFile(file);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const activities = [];
  let slNo = 1;

  for (const line of lines) {
    const extracted = extractDateAndNameFromLine(line);
    if (extracted && extracted.startDate) {
      let name = extracted.name || `Activity ${slNo}`;
      if (name.length >= 3) {
        activities.push({
          slNo: slNo++,
          name: name.replace(/\s+/g, " "),
          schedule: extracted.schedule || extracted.startDate,
          startDate: extracted.startDate,
          endDate: extracted.endDate || extracted.startDate,
          category: detectActivityCategory(name),
          location: "",
        });
      }
    }
  }

  if (activities.length === 0) {
    throw new Error(
      "Could not automatically detect calendar dates from PDF. Please upload as Excel spreadsheet or ensure the PDF contains selectable text."
    );
  }

  return {
    success: true,
    fileName: file.name,
    activities,
    count: activities.length,
  };
}

/**
 * Client-Side PDF Text Extractor & Parser for Academic Holidays
 */
async function parseHolidaysFromPDF(file) {
  const text = await extractTextFromPDFFile(file);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const holidays = [];
  let slNo = 1;

  for (const line of lines) {
    const extracted = extractDateAndNameFromLine(line);
    if (extracted && extracted.startDate) {
      let rawName = extracted.name || `Holiday ${slNo}`;
      const type = detectHolidayType(rawName, line);
      const day = getDayOfWeekFromDate(extracted.startDate) || "Monday";

      // Clean holiday title from day strings like (Thursday) or type strings
      const cleanTitle = rawName
        .replace(/\((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\)/gi, "")
        .replace(/\b(?:Official Holiday|Observation Day|Optional Leave|RH)\b/gi, "")
        .replace(/[()]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (cleanTitle.length >= 2) {
        holidays.push({
          slNo: slNo++,
          title: cleanTitle,
          date: extracted.startDate,
          day,
          type,
          isOptional: type === "optional",
          isObservation: type === "observation",
          description:
            type === "optional"
              ? "Optional University Holiday"
              : type === "observation"
              ? "University Observation Day"
              : "Official University Holiday",
        });
      }
    }
  }

  if (holidays.length === 0) {
    throw new Error(
      "Could not automatically detect holiday dates from PDF. Please upload as Excel spreadsheet or ensure the PDF contains selectable text."
    );
  }

  return {
    success: true,
    fileName: file.name,
    holidays,
    count: holidays.length,
  };
}

/**
 * Lightweight binary stream text extractor for PDF documents
 */
async function extractTextFromPDFFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let text = "";

  // Decode standard text characters from PDF streams
  const decoder = new TextDecoder("latin1");
  const rawString = decoder.decode(bytes);

  // 1. Extract Tj strings
  const tjMatches = rawString.match(/\(([^()]{2,120})\)\s*Tj/g) || [];
  if (tjMatches.length > 0) {
    text += "\n" + tjMatches.map((m) => m.replace(/^\(/, "").replace(/\)\s*Tj$/, "")).join("\n");
  }

  // 2. Extract TJ array strings: [(text) 10 (text2)] TJ
  const tjArrayMatches = rawString.match(/\[\s*(\([^()]+\)[^\]]*)+\]\s*TJ/g) || [];
  if (tjArrayMatches.length > 0) {
    for (const tjArr of tjArrayMatches) {
      const parts = tjArr.match(/\(([^()]+)\)/g) || [];
      const lineStr = parts.map((p) => p.slice(1, -1)).join("");
      if (lineStr.length > 2) text += "\n" + lineStr;
    }
  }

  // 3. Fallback: match plain lines with date or words
  if (!text || text.trim().length < 20) {
    const lineMatches = rawString.match(/[A-Za-z0-9\s.,\-\/():]{5,120}/g) || [];
    text = lineMatches.join("\n");
  }

  return text;
}

/**
 * Case-insensitive flexible key lookup in spreadsheet row objects
 */
function findValue(row, possibleKeys) {
  if (!row || typeof row !== "object") return undefined;
  const rowKeys = Object.keys(row);
  for (const target of possibleKeys) {
    const cleanTarget = target.toLowerCase().replace(/[\s_\.\-\(\)\/]/g, "");
    for (const rk of rowKeys) {
      const cleanRk = rk.toLowerCase().replace(/[\s_\.\-\(\)\/]/g, "");
      if (cleanRk === cleanTarget && row[rk] !== undefined && row[rk] !== null && row[rk] !== "") {
        return row[rk];
      }
    }
  }
  return undefined;
}
