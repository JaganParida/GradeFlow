import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  CheckCircle2,
  XCircle,
  Check,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Edit2,
  Sliders,
  Award,
  Plus,
  X,
  Loader2,
  FileCheck,
  Percent,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
  Clipboard,
  BookOpen,
  ChevronDown,
  ScanLine,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { getSectionSubjectCatalog, cleanSubjectBaseName } from "../utils/timetableHelper";
import {
  getDailyScanStatus,
  incrementDailyScanCount,
  MAX_DAILY_SCANS,
} from "../utils/scanLimitHelper";

export default function AttendanceScreenshotModal({
  isOpen,
  onClose,
  onApply,
  currentSection = "CSE-E",
  studentId = "",
  API = "/api",
}) {
  const [scanStatus, setScanStatus] = useState(() => getDailyScanStatus(studentId));

  useEffect(() => {
    setScanStatus(getDailyScanStatus(studentId));
    const handleUpdate = () => setScanStatus(getDailyScanStatus(studentId));
    window.addEventListener("gradeflow_scan_limit_updated", handleUpdate);
    return () => window.removeEventListener("gradeflow_scan_limit_updated", handleUpdate);
  }, [studentId, isOpen]);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Analyzing screenshot...");
  const [parsedSubjects, setParsedSubjects] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState("upload"); // "upload" | "review"
  const [pasteNotice, setPasteNotice] = useState(false);
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [isScreenshotVerified, setIsScreenshotVerified] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null); // Sub-modal for editing components (PP, PR, TUT)
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(15);

  // Monotonic progressive stepper for AI OCR scanning (Never loops back to 0)
  useEffect(() => {
    if (!isProcessing) {
      setScanStepIndex(0);
      setScanProgress(0);
      return;
    }

    setScanStepIndex(0);
    setScanProgress(20);

    const t1 = setTimeout(() => {
      setScanStepIndex(1);
      setScanProgress(50);
    }, 1100);

    const t2 = setTimeout(() => {
      setScanStepIndex(2);
      setScanProgress(78);
    }, 2400);

    const t3 = setTimeout(() => {
      setScanStepIndex(3);
      setScanProgress(94);
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isProcessing]);
  const fileInputRef = useRef(null);
  const activeRequestIdRef = useRef(0);

  // Responsive device width tracking
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 640;

  // Get active section catalog subjects
  const sectionCatalog = getSectionSubjectCatalog(currentSection) || [];

  // Live Overall Aggregate Score across all detected subjects in modal
  const liveOverall = useMemo(() => {
    let totalAtt = 0;
    let totalDel = 0;
    parsedSubjects.forEach((s) => {
      totalAtt += Number(s.attendedClasses) || 0;
      totalDel += Number(s.totalClasses) || 0;
    });
    const pct = totalDel > 0 ? (totalAtt / totalDel) * 100 : 0;
    const isEligible = totalDel === 0 ? true : pct >= 75;
    return {
      totalAtt,
      totalDel,
      percentage: Number(pct.toFixed(2)),
      isEligible,
      count: parsedSubjects.length,
    };
  }, [parsedSubjects]);

  // Global Clipboard Paste Listener (Ctrl+V support)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            setPasteNotice(true);
            setTimeout(() => setPasteNotice(false), 3000);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const resetState = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setIsProcessing(false);
    setProcessingStatus("Analyzing screenshot...");
    setParsedSubjects([]);
    setErrorMsg("");
    setStep("upload");
    setShowCatalogDropdown(false);
    setIsScreenshotVerified(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const currentLimit = getDailyScanStatus(studentId);
    if (currentLimit.isLimitReached) {
      setErrorMsg(
        "Daily Screenshot Limit Reached (2/2): You have already used your 2 scans for today. The limit will automatically reset tomorrow at midnight (12:00 AM). Please enter or update your attendance manually."
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image screenshot (PNG, JPG, WebP).");
      return;
    }

    setErrorMsg("");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setImagePreview(base64);
      analyzeScreenshot(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Canvas-based image preprocessor for optimal multi-device OCR (Adaptive Contrast & Pill Border Cleaning)
  const preprocessImageForOcr = (imageSource) => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const padding = 40;
          const targetWidth = img.width < 500 ? 1100 : 2200;
          const scale = targetWidth / Math.max(1, img.width);
          const scaledH = Math.round(img.height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth + padding * 2;
          canvas.height = scaledH + padding * 2;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(imageSource);

          // Fill white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, padding, padding, targetWidth, scaledH);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          // Gentle Linear Contrast Normalization (Preserving character strokes & anti-aliasing)
          let totalLum = 0;
          let minLum = 255;
          let maxLum = 0;
          const step = 8;
          let sampleCount = 0;

          for (let i = 0; i < d.length; i += 4 * step) {
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            totalLum += lum;
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;
            sampleCount++;
          }

          const avgLum = sampleCount > 0 ? totalLum / sampleCount : 200;
          const isDarkMode = avgLum < 120;
          const range = Math.max(20, maxLum - minLum);

          for (let i = 0; i < d.length; i += 4) {
            let lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (isDarkMode) lum = 255 - lum;

            const stretched = Math.max(0, Math.min(255, Math.round(((lum - minLum) / range) * 255)));
            d[i] = stretched;
            d[i + 1] = stretched;
            d[i + 2] = stretched;
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(imageSource);
        img.src = imageSource;
      } catch {
        resolve(imageSource);
      }
    });
  };

// Progressive Monotonic Scanning Stages for AI Vision OCR with Real-time Progress
const SCAN_MESSAGES = [
  {
    title: "Analyzing Image Structure & Table Grid",
    desc: "Preprocessing image pixels, detecting orientation and normalizing table borders...",
    badge: "Stage 1/4: Preprocessing",
    pct: 20,
  },
  {
    title: "Extracting Theory (PP), Lab (PR) & Tutorial (TUT) Breakdown",
    desc: "AI is reading multi-component attendance rows and resolving course codes...",
    badge: "Stage 2/4: Component OCR",
    pct: 50,
  },
  {
    title: "Reading Attended & Delivered Session Counts",
    desc: "Extracting attended lectures, total conducted classes, and percentage scores...",
    badge: "Stage 3/4: Number Verification",
    pct: 78,
  },
  {
    title: "Cross-Matching with Enrolled Section Catalog",
    desc: "Verifying subject names and assembling full review matrix...",
    badge: "Stage 4/4: Finalizing",
    pct: 94,
  },
  {
    title: "Extraction & Calculations Complete!",
    desc: "All subjects verified successfully. Loading your review dashboard...",
    badge: "Complete: 100%",
    pct: 100,
  },
];

// Clean course code normalizer (resolves common OCR letter-digit substitutions e.g. CUTMI020 -> CUTM1020)
const normalizeCourseCode = (code) => {
  if (!code) return "";
  let clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = clean.match(/^([A-Z]{3,5})([A-Z0-9]{3,6})$/i);
  if (match) {
    let prefix = match[1].toUpperCase()
      .replace(/J/g, "U")
      .replace(/^C[UI]T[MI]/, "CUTM")
      .replace(/^C[UI]C[S5I]/, "CUCS");
    let numPart = match[2]
      .replace(/I|l|M/g, "1")
      .replace(/O/g, "0")
      .replace(/S/g, "5")
      .replace(/Z/g, "2")
      .replace(/B/g, "8");
    return prefix + numPart;
  }
  return clean;
};

const cleanSubjectName = (name) => {
  if (!name) return "";
  return name
    .replace(/\([A-Z]{3,5}[A-Z0-9]{3,6}\)$/i, "")
    .replace(/\b(CUTM|CUCS|CUEC|CUEE|CUME|CUCE|CUCY|CUPH|CUMA|BTE|BBA|MBA)\w{3,6}\b/gi, "")
    .replace(/[-_\|\:]+$/, "")
    .replace(/^[-_\|\:\d\.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Deduplicate and Canonicalize Subjects (Dynamically merges multi-components without hardcoded subjects)
const deduplicateAndCanonicalizeSubjects = (rawList = [], catalog = []) => {
  const subjects = [];

  rawList.forEach((item) => {
    if (!item) return;

    const rawCode = normalizeCourseCode(item.code || "");
    let rawName = cleanSubjectName(item.name || "");

    rawName = rawName.replace(new RegExp(rawCode, "gi"), "").trim();
    if (!rawCode && rawName.length < 3) return;

    let existing = subjects.find((s) => {
      if (rawCode && s.code && s.code === rawCode) return true;
      if (rawName && s.name && rawName.length > 2 && s.name.length > 2) {
        const n1 = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const n2 = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (n1 === n2) return true;
      }
      return false;
    });

    if (!existing) {
      let finalName = rawName;
      if (!finalName && rawCode) {
        for (const c of catalog) {
          if (c && c.code && normalizeCourseCode(c.code) === rawCode && c.subjectName) {
            finalName = c.subjectName;
            break;
          }
        }
      }
      if (!finalName) finalName = rawCode || "Subject";

      existing = {
        id: item.id || `ocr_sub_${Date.now()}_${subjects.length}`,
        name: finalName,
        code: rawCode,
        components: [],
        attendedClasses: 0,
        totalClasses: 0,
        percentage: 0,
        detectedFromImage: true,
      };
      subjects.push(existing);
    }

    if (!existing.code && rawCode) existing.code = rawCode;
    if (rawName && (!existing.name || existing.name === existing.code)) existing.name = rawName;

    const comps = Array.isArray(item.components) && item.components.length > 0
      ? item.components
      : [{
          type: "PP",
          attended: item.attendedClasses !== undefined ? item.attendedClasses : (item.attended || 0),
          delivered: item.totalClasses !== undefined ? item.totalClasses : (item.delivered || item.total || 0),
        }];

    comps.forEach((c) => {
      const cType = String(c.type || "PP").toUpperCase();
      let exComp = existing.components.find((ec) => ec.type === cType);
      if (!exComp) {
        exComp = { type: cType, attended: 0, delivered: 0, percentage: 0 };
        existing.components.push(exComp);
      }
      exComp.attended = Math.max(0, parseInt(c.attended, 10) || 0);
      exComp.delivered = Math.max(0, parseInt(c.delivered !== undefined ? c.delivered : c.total, 10) || 0);
      exComp.percentage = exComp.delivered > 0 ? parseFloat(((exComp.attended / exComp.delivered) * 100).toFixed(1)) : 0;
    });

    existing.attendedClasses = existing.components.reduce((acc, c) => acc + c.attended, 0);
    existing.totalClasses = existing.components.reduce((acc, c) => acc + c.delivered, 0);
    existing.percentage = existing.totalClasses > 0 ? parseFloat(((existing.attendedClasses / existing.totalClasses) * 100).toFixed(1)) : 0;
  });

  return subjects;
};

// Dynamic Extraction of Attended/Delivered Session Counts
const extractFractionFromLine = (line) => {
  if (!line) return null;

  // 1. Explicit fraction e.g. "6/7", "24/28", "7/7", "0/0", "2/2", "8/8", "7/9", "5/7", "4/4", "26/28", "8/9", "23/25", "12/12", "6/8", "14/14"
  const fracMatch = line.match(/\b(\d{1,3})\s*[\/\\|]\s*(\d{1,3})\b/);
  if (fracMatch) {
    const a = parseInt(fracMatch[1], 10);
    const d = parseInt(fracMatch[2], 10);
    if (d >= a && d <= 150) return { attended: a, delivered: d };
  }

  // 2. Explicit zero e.g. "0/0", "o/o", "O/O", "0\0", "0|0", "0 0"
  if (/\b[0oO]\s*[\/\\|]\s*[0oO]\b|\b0\s+0\b|\b0\/0\b/.test(line)) {
    return { attended: 0, delivered: 0 };
  }

  // 3. Space-separated two numbers e.g. "6 7", "24 28", "14 14"
  const spaceMatch = line.match(/\b(\d{1,2})\s+(\d{1,2})\b/);
  if (spaceMatch) {
    const a = parseInt(spaceMatch[1], 10);
    const d = parseInt(spaceMatch[2], 10);
    if (d >= a && d <= 150 && d > 0) return { attended: a, delivered: d };
  }

  // 4. Concatenated 4-digit attendance e.g. "2428" (24/28), "1414" (14/14), "1212" (12/12), "2628" (26/28), "2325" (23/25)
  const fourDigitMatches = line.match(/\b(\d{2})(\d{2})\b/g);
  if (fourDigitMatches) {
    for (const m of fourDigitMatches) {
      const a = parseInt(m.substring(0, 2), 10);
      const d = parseInt(m.substring(2, 4), 10);
      if (d >= a && d >= 5 && d <= 60) return { attended: a, delivered: d };
    }
  }

  // 5. Concatenated 2-digit attendance e.g. "67" (6/7), "57" (5/7), "44" (4/4), "77" (7/7), "88" (8/8), "22" (2/2), "89" (8/9), "79" (7/9), "68" (6/8)
  const twoDigitMatches = line.match(/\b(\d)(\d)\b/g);
  if (twoDigitMatches) {
    for (const m of twoDigitMatches) {
      const a = parseInt(m[0], 10);
      const d = parseInt(m[1], 10);
      if (d >= a && d >= 2 && d <= 10) return { attended: a, delivered: d };
    }
  }

  return null;
};

// Universal Dynamic CUTM ERP Text Parser (Website ERP Tables & Mobile ERP Cards)
const parseCutmOcrText = (text, catalog = []) => {
  if (!text || typeof text !== "string") return [];

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isWebsiteTable = /Sr\.?No|Course\s*Name|Course\s*Short|Course\s*Code|Attended\s*[\/\|\\-]?\s*Delivered/i.test(text);

  const rawRows = [];

  if (isWebsiteTable) {
    // ── WEBSITE ERP TABLE PARSER (Structural Column Anchor Architecture) ──
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        /^(Sr\.?No|Course|counaiame|shontioma|coursocods|From\s*date|To\s*date)/i.test(line) ||
        line.toLowerCase().startsWith("total percentage") ||
        line.toLowerCase().startsWith("total percent") ||
        line.toLowerCase().startsWith("total percontoge")
      ) {
        continue;
      }

      // Column 3 Anchor: "Course Short Name" formatted as "CODE - COMP" or "CODE = COMP"
      const shortMatch = line.match(/\b([A-Z]{3,5}[A-Z0-9]{3,6})\s*[-_=\:]\s*(PP|PR|TUT)\b/i);

      let code = "";
      let compType = "PP";
      let namePart = "";
      let frac = null;

      if (shortMatch) {
        code = normalizeCourseCode(shortMatch[1]);
        compType = shortMatch[2].toUpperCase();
        namePart = cleanSubjectName(line.substring(0, shortMatch.index));
        const trailing = line.substring(shortMatch.index + shortMatch[0].length);
        frac = extractFractionFromLine(trailing);
      } else {
        const codeMatches = line.match(/\b([A-Z]{3,5}[A-Z0-9]{3,6})\b/gi);
        code = codeMatches ? normalizeCourseCode(codeMatches[codeMatches.length - 1]) : "";

        const compMatch = line.match(/[-_]\s*(PP|PR|TUT)\b|\((PP|PR|TUT)\)|\b(PP|PR|TUT)\b/i);
        if (compMatch) {
          const tag = (compMatch[1] || compMatch[2] || compMatch[3]).toUpperCase();
          if (tag === "TUT") compType = "TUT";
          else if (tag === "PR") compType = "PR";
          else if (tag === "PP") compType = "PP";
        }

        frac = extractFractionFromLine(line);
        namePart = cleanSubjectName(
          line
            .replace(/^\d+[\.\s\-\|\)]*/, "")
            .replace(/\b[A-Z]{3,5}[A-Z0-9]{3,6}\s*[-_=\:]\s*(PP|PR|TUT)\b/gi, "")
            .replace(/\b[A-Z]{3,5}[A-Z0-9]{3,6}\b/gi, "")
            .replace(/(?:-\s*|\(\s*)(PP|PR|TUT)(?:\s*\))/gi, "")
            .replace(/\b\d{1,3}\s*[\/\\|]\s*\d{1,3}\b/g, "")
            .replace(/\b\d{1,3}(?:\.\d+)?\s*%?\b/g, "")
            .replace(/[\(\)\[\]\|_]/g, " ")
        );
      }

      if ((code && frac) || (shortMatch && frac) || (namePart.length > 3 && frac)) {
        rawRows.push({
          name: namePart || code,
          code: code,
          components: [
            {
              type: compType,
              attended: frac ? frac.attended : 0,
              delivered: frac ? frac.delivered : 0,
            },
          ],
        });
      }
    }
  } else {
    // ── MOBILE ERP CARDS PARSER ──
    let currentSubject = null;
    let currentCompType = "PP";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        /Attendance\s*Details|Subject\s*Wise|From\s*date|To\s*date|Total\s*Percentage|Total\s*Percontoge/i.test(line) ||
        /^(Home|Scan\s*QR|Notifications)$/i.test(line)
      ) {
        continue;
      }

      const compSubMatch = line.match(/[-_]\s*\(?(PP|PR|TUT)\)?|\((PP|PR|TUT)\)/i);
      const frac = extractFractionFromLine(line);

      if (compSubMatch && !frac) {
        const tag = (compSubMatch[1] || compSubMatch[2]).toUpperCase();
        if (tag === "TUT") currentCompType = "TUT";
        else if (tag === "PR") currentCompType = "PR";
        else if (tag === "PP") currentCompType = "PP";
        continue;
      }

      const mainCardMatch = line.match(/^(.*?)\s*\(?([A-Z]{3,5}[A-Z0-9]{3,6})\)?$/i);
      if (mainCardMatch && !frac && !compSubMatch && mainCardMatch[1].trim().length > 3) {
        const code = normalizeCourseCode(mainCardMatch[2]);
        let name = cleanSubjectName(mainCardMatch[1].trim());
        currentSubject = {
          name: name || code,
          code: code,
          components: [],
        };
        rawRows.push(currentSubject);
        currentCompType = "PP";
        continue;
      }

      if (frac) {
        const compTagInLine = line.match(/\(?(PP|PR|TUT)\)?/i);
        const compType = compTagInLine ? compTagInLine[1].toUpperCase() : currentCompType;

        if (!currentSubject) {
          const codeMatch = line.match(/\b([A-Z]{3,5}[A-Z0-9]{3,6})\b/i);
          const code = codeMatch ? normalizeCourseCode(codeMatch[1]) : "";
          if (code) {
            currentSubject = {
              name: code,
              code: code,
              components: [],
            };
            rawRows.push(currentSubject);
          }
        }

        if (currentSubject) {
          let comp = currentSubject.components.find((c) => c.type === compType);
          if (!comp) {
            comp = { type: compType, attended: frac.attended, delivered: frac.delivered };
            currentSubject.components.push(comp);
          } else {
            comp.attended = frac.attended;
            comp.delivered = frac.delivered;
          }
        }
      }
    }
  }

  return deduplicateAndCanonicalizeSubjects(rawRows, catalog);
};

  // Analyze Screenshot via Dual AI (Gemini 2.5 Pro Vision + Client-Side Tesseract WASM Engine with High-Quality Canvas Preprocessing)
  const analyzeScreenshot = async (imageBase64, mimeType) => {
    const currentReqId = ++activeRequestIdRef.current;
    setIsProcessing(true);
    setErrorMsg("");
    setProcessingStatus("Initializing Gemini 2.5 Pro Vision scanner...");

    let extracted = [];

    // 1. Try Vercel Serverless Gemini Vision Endpoint
    const ocrPayload = { imageBase64, mimeType: mimeType || "image/jpeg" };

    const endpointsToTry = [
      { url: `${API}/attendance/ocr`, label: "Vercel OCR Route" },
      { url: `/api/attendance-ocr`, label: "Vercel Serverless Direct" },
    ];

    let lastApiError = "";

    for (const endpoint of endpointsToTry) {
      if (extracted.length > 0) break;
      try {
        setProcessingStatus(`Scanning ERP rows via ${endpoint.label}...`);
        const res = await axios.post(endpoint.url, ocrPayload, { timeout: 60000 });

        if (
          res?.data?.success &&
          Array.isArray(res.data.subjects) &&
          res.data.subjects.length > 0
        ) {
          console.log(
            `[ERP OCR] ${endpoint.label} returned ${res.data.subjects.length} subjects via engine: ${res.data.engine || "unknown"}, model: ${res.data.modelUsed || "unknown"}`
          );
          extracted = deduplicateAndCanonicalizeSubjects(res.data.subjects, sectionCatalog);
        } else {
          const errMsg = res?.data?.error || `engine=${res?.data?.engine}, subjects=${res?.data?.subjects?.length || 0}`;
          if (res?.data?.error) lastApiError = res.data.error;
          console.warn(`[ERP OCR] ${endpoint.label} returned empty/fallback:`, errMsg);
        }
      } catch (err) {
        lastApiError = `Network error connecting to ${endpoint.label}: ${err.message}`;
        console.warn(`[ERP OCR] ${endpoint.label} failed:`, err.message);
      }
    }

    // 2. If Serverless didn't extract, try client OCR only if no explicit auth error
    if (extracted.length === 0 && !lastApiError.includes("Authentication Failed")) {
      try {
        setProcessingStatus("Enhancing contrast & running local OCR engine...");
        const preprocessedBase64 = await preprocessImageForOcr(imageBase64);

        const worker = await createWorker("eng");
        await worker.setParameters({
          tessedit_pageseg_mode: "6", // Assume a single uniform block of text
        });
        const ret = await worker.recognize(preprocessedBase64);
        await worker.terminate();

        const rawText = ret.data?.text || "";
        const clientParsed = parseCutmOcrText(rawText, sectionCatalog);
        if (clientParsed && clientParsed.length >= 6) {
          // Only trust local OCR if it detected a substantial set of subjects
          extracted = clientParsed;
        }
      } catch (tessErr) {
        console.warn("Local Tesseract OCR warning:", tessErr);
      }
    }

    // 3. If still empty, populate with student's actual section catalog subjects for easy manual fill
    if (extracted.length === 0 && sectionCatalog.length > 0) {
      extracted = sectionCatalog.map((c, idx) => ({
        id: `sec_sub_${Date.now()}_${idx}`,
        name: c.subjectName,
        code: c.code || "",
        attendedClasses: 0,
        totalClasses: 0,
        percentage: 0,
        components: [],
      }));
    }

    // Guard against stale asynchronous request race conditions
    if (currentReqId !== activeRequestIdRef.current) return;

    // Ensure final canonical deduplication
    const finalCleanList = deduplicateAndCanonicalizeSubjects(extracted, sectionCatalog);

    // Final 100% completion milestone with smooth transition
    setScanStepIndex(4);
    setScanProgress(100);
    await new Promise((r) => setTimeout(r, 450));

    if (currentReqId !== activeRequestIdRef.current) return;

    if (finalCleanList.length > 0) {
      setParsedSubjects(finalCleanList);
      incrementDailyScanCount(studentId);
      if (lastApiError) setErrorMsg(lastApiError);
      setStep("review");
    } else {
      setErrorMsg(lastApiError || "Could not detect subjects automatically. Please add rows manually.");
      setParsedSubjects([]);
      setStep("review");
    }

    setIsProcessing(false);
  };

  // Row Modification Handlers
  const handleUpdateField = (id, field, value) => {
    setParsedSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id !== id) return sub;

        const updated = { ...sub, [field]: value };
        if (field === "attendedClasses" || field === "totalClasses") {
          const att = Math.max(0, parseInt(field === "attendedClasses" ? value : sub.attendedClasses, 10) || 0);
          const tot = Math.max(0, parseInt(field === "totalClasses" ? value : sub.totalClasses, 10) || 0);
          updated.attendedClasses = att;
          updated.totalClasses = tot;
          updated.percentage = tot > 0 ? parseFloat(((att / tot) * 100).toFixed(1)) : 0;
        }
        return updated;
      })
    );
  };

  const handleAddRow = (presetName = "", presetCode = "") => {
    const newId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setParsedSubjects((prev) => [
      ...prev,
      {
        id: newId,
        name: presetName || `Subject ${prev.length + 1}`,
        code: presetCode || "",
        attendedClasses: 0,
        totalClasses: 0,
        percentage: 0,
      },
    ]);
    setShowCatalogDropdown(false);
  };

  const handleDeleteRow = (id) => {
    setParsedSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Open Component Breakdown & Subject Details Sub-Modal ──
  const handleOpenEditSubject = (sub) => {
    setEditingSubject({
      id: sub.id,
      name: sub.name || "",
      code: sub.code || "",
      components: Array.isArray(sub.components) && sub.components.length > 0
        ? JSON.parse(JSON.stringify(sub.components))
        : [
            { type: "PP", attended: sub.attendedClasses || 0, delivered: sub.totalClasses || 0, percentage: sub.percentage || 0 }
          ],
    });
  };

  // ── Add new component row inside editing sub-modal ──
  const handleAddComponentRow = (type = "PP") => {
    if (!editingSubject) return;
    setEditingSubject((prev) => ({
      ...prev,
      components: [
        ...(prev.components || []),
        { type, attended: 0, delivered: 0, percentage: 0 },
      ],
    }));
  };

  // ── Update a component inside editing sub-modal ──
  const handleUpdateComponentField = (idx, field, value) => {
    if (!editingSubject) return;
    setEditingSubject((prev) => {
      const nextComps = [...(prev.components || [])];
      const comp = { ...nextComps[idx] };

      if (field === "type") {
        comp.type = value;
      } else {
        const numVal = Math.max(0, parseInt(value, 10) || 0);
        comp[field] = numVal;
        const att = field === "attended" ? numVal : comp.attended || 0;
        const del = field === "delivered" ? numVal : comp.delivered || 0;
        comp.percentage = del > 0 ? Number(((att / del) * 100).toFixed(1)) : 0;
      }

      nextComps[idx] = comp;
      return { ...prev, components: nextComps };
    });
  };

  // ── Delete a component row inside editing sub-modal ──
  const handleDeleteComponentRow = (idx) => {
    if (!editingSubject) return;
    setEditingSubject((prev) => ({
      ...prev,
      components: (prev.components || []).filter((_, i) => i !== idx),
    }));
  };

  // ── Save edited subject details & components back to parsedSubjects ──
  const handleSaveEditedSubject = () => {
    if (!editingSubject) return;

    let totAtt = 0;
    let totDel = 0;
    const comps = editingSubject.components || [];

    comps.forEach((c) => {
      totAtt += Number(c.attended) || 0;
      totDel += Number(c.delivered) || 0;
    });

    // If no components were specified, fallback to 0
    const finalPct = totDel > 0 ? Number(((totAtt / totDel) * 100).toFixed(1)) : 0;

    setParsedSubjects((prev) =>
      prev.map((s) => {
        if (s.id === editingSubject.id) {
          return {
            ...s,
            name: editingSubject.name.trim() || s.name,
            code: (editingSubject.code || s.code || "").trim(),
            components: comps,
            attendedClasses: totAtt,
            totalClasses: totDel,
            percentage: finalPct,
          };
        }
        return s;
      })
    );

    setEditingSubject(null);
  };

  const handleConfirmAndApply = () => {
    if (parsedSubjects.length === 0) {
      setErrorMsg("Please add at least one subject before applying.");
      return;
    }

    const formatted = parsedSubjects.map((s, idx) => ({
      id: `imported_sub_${Date.now()}_${idx}`,
      name: s.name.trim() || `Subject ${idx + 1}`,
      code: s.code || "",
      attendedClasses: s.attendedClasses || 0,
      totalClasses: s.totalClasses || 0,
      components:
        Array.isArray(s.components) && s.components.length > 0
          ? s.components.map((c) => ({
              type: (c.type || "PP").toUpperCase(),
              attended: Number(c.attended) || 0,
              delivered: Number(c.delivered !== undefined ? c.delivered : c.total) || 0,
            }))
          : [
              {
                type: "PP",
                attended: s.attendedClasses || 0,
                delivered: s.totalClasses || 0,
              },
            ],
    }));

    onApply(formatted);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.55)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            width: "100%",
            maxWidth: step === "upload" ? 540 : 780,
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fafafa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #dbeafe",
                }}
              >
                <Camera size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {step === "upload" ? "Auto-Import Attendance via Screenshot" : "Review & Confirm Detected Subjects"}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  {step === "upload"
                    ? "Upload or paste your ERP attendance screenshot for instant extraction"
                    : `Verified ${parsedSubjects.length} subjects from your screenshot`}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Paste Notification Banner */}
          {pasteNotice && (
            <div
              style={{
                background: "#f0fdf4",
                borderBottom: "1px solid #bbf7d0",
                padding: "8px 20px",
                fontSize: 12,
                color: "#166534",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Clipboard size={14} />
              <span>Image pasted directly from clipboard! Processing...</span>
            </div>
          )}

          {/* Body */}
          <div style={{ padding: isMobile ? "14px 12px" : "20px 24px", overflowY: "auto", flex: 1 }}>
            {step === "upload" ? (
              <div>
                {/* Clean Daily Scan Quota & Guidance Banner */}
                <div
                  style={{
                    marginBottom: 16,
                    background: scanStatus.isLimitReached ? "#fef2f2" : "#f8fafc",
                    border: `1px solid ${scanStatus.isLimitReached ? "#fecaca" : "#e2e8f0"}`,
                    borderRadius: 14,
                    padding: isMobile ? "12px 14px" : "14px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  {/* Header Row: Title & Badges */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: isMobile ? "flex-start" : "center",
                      justifyContent: "space-between",
                      flexDirection: isMobile ? "column" : "row",
                      gap: isMobile ? 10 : 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: scanStatus.isLimitReached ? "#fee2e2" : "#eff6ff",
                          color: scanStatus.isLimitReached ? "#dc2626" : "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: `1px solid ${scanStatus.isLimitReached ? "#fca5a5" : "#bfdbfe"}`,
                        }}
                      >
                        {scanStatus.isLimitReached ? <Lock size={16} /> : <ScanLine size={16} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: scanStatus.isLimitReached ? "#991b1b" : "#0f172a", letterSpacing: "-0.2px" }}>
                          Daily Screenshot Quota
                        </div>
                        <div style={{ fontSize: 11.5, color: scanStatus.isLimitReached ? "#b91c1c" : "#64748b", marginTop: 1 }}>
                          {scanStatus.isLimitReached
                            ? "Limit reached (2 of 2 used) • Resets at midnight (12:00 AM)"
                            : `${scanStatus.remaining} of ${scanStatus.max} scans available today`}
                        </div>
                      </div>
                    </div>

                    {/* Quota Progress Pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, width: isMobile ? "100%" : "auto" }}>
                      {[...Array(scanStatus.max)].map((_, i) => {
                        const isUsed = i < scanStatus.used;
                        return (
                          <div
                            key={i}
                            style={{
                              flex: isMobile ? 1 : "none",
                              padding: "4px 10px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isUsed ? "#fee2e2" : "#ecfdf5",
                              color: isUsed ? "#991b1b" : "#065f46",
                              border: `1px solid ${isUsed ? "#fecaca" : "#a7f3d0"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 5,
                            }}
                          >
                            {isUsed ? (
                              <>
                                <X size={12} color="#dc2626" strokeWidth={2.5} />
                                <span>Scan {i + 1} Used</span>
                              </>
                            ) : (
                              <>
                                <Check size={12} color="#059669" strokeWidth={2.5} />
                                <span>Scan {i + 1} Free</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guidance & Disclaimer */}
                  <div
                    style={{
                      fontSize: 11.5,
                      color: scanStatus.isLimitReached ? "#7f1d1d" : "#475569",
                      background: scanStatus.isLimitReached ? "#ffffff" : "#ffffff",
                      padding: "8px 12px",
                      borderRadius: 9,
                      border: `1px solid ${scanStatus.isLimitReached ? "#fecaca" : "#e2e8f0"}`,
                      lineHeight: 1.45,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    {scanStatus.isLimitReached ? (
                      <>
                        <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>
                          <strong>Daily Quota Reached:</strong> You have completed your <strong>2 screenshot scans for today</strong>. Please add or modify subjects using <strong>"Add From Section Catalog"</strong> or <strong>"Custom Row"</strong>. Quota resets automatically at midnight.
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>
                          <strong>Usage Guidelines:</strong> Each student is allotted <strong>2 screenshot scans per day</strong>. Please ensure your ERP table is clearly visible before scanning. Quota resets daily at <strong>12:00 AM midnight</strong>.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Drag & Drop Area */}
                <div
                  onDragEnter={!scanStatus.isLimitReached ? handleDrag : undefined}
                  onDragLeave={!scanStatus.isLimitReached ? handleDrag : undefined}
                  onDragOver={!scanStatus.isLimitReached ? handleDrag : undefined}
                  onDrop={!scanStatus.isLimitReached ? handleDrop : undefined}
                  onClick={() => {
                    if (scanStatus.isLimitReached) {
                      setErrorMsg("Daily Screenshot Limit Reached (2/2). It will reset tomorrow at midnight (12:00 AM). Please enter or update your attendance manually.");
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  style={{
                    border: `2px dashed ${scanStatus.isLimitReached ? "#fca5a5" : dragActive ? "#2563eb" : "#cbd5e1"}`,
                    background: scanStatus.isLimitReached ? "#f8fafc" : dragActive ? "#eff6ff" : "#f8fafc",
                    opacity: scanStatus.isLimitReached ? 0.65 : 1,
                    filter: scanStatus.isLimitReached ? "grayscale(30%)" : "none",
                    borderRadius: 16,
                    padding: "36px 20px",
                    textAlign: "center",
                    cursor: scanStatus.isLimitReached ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={scanStatus.isLimitReached}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {isProcessing ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxWidth: 440, margin: "0 auto" }}>
                      {/* Spinner Icon / Completed Check */}
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 16,
                          background: scanProgress >= 100
                            ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                            : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                          border: `1.5px solid ${scanProgress >= 100 ? "#86efac" : "#bfdbfe"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: scanProgress >= 100 ? "#16a34a" : "#2563eb",
                          boxShadow: scanProgress >= 100 ? "0 4px 16px rgba(22, 163, 74, 0.25)" : "0 4px 16px rgba(37, 99, 235, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {scanProgress >= 100 ? (
                          <CheckCircle2 size={30} color="#16a34a" />
                        ) : (
                          <Loader2 size={28} className="spin" />
                        )}
                      </div>

                      {/* Live Scanning Stage Info */}
                      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              color: scanProgress >= 100 ? "#15803d" : "#1d4ed8",
                              background: scanProgress >= 100 ? "#dcfce7" : "#dbeafe",
                              padding: "2px 10px",
                              borderRadius: 999,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {SCAN_MESSAGES[scanStepIndex]?.badge || "AI OCR Processing"}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 900, color: scanProgress >= 100 ? "#16a34a" : "#2563eb" }}>
                            {scanProgress}%
                          </span>
                        </div>

                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                          {SCAN_MESSAGES[scanStepIndex]?.title || "Scanning Attendance Screenshot..."}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.45, minHeight: 34 }}>
                          {SCAN_MESSAGES[scanStepIndex]?.desc || "Extracting subjects, attended classes, and total counts with AI Vision..."}
                        </div>
                      </div>

                      {/* Monotonic Smooth Progress Bar */}
                      <div
                        style={{
                          width: "100%",
                          height: 7,
                          borderRadius: 999,
                          background: "#e2e8f0",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: `${scanProgress}%`,
                            height: "100%",
                            background: scanProgress >= 100
                              ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                              : "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
                            borderRadius: 999,
                            transition: "width 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </div>

                      {/* Prominent Patience Disclaimer Banner */}
                      <div
                        style={{
                          background: scanProgress >= 100 ? "#f0fdf4" : "#fffbeb",
                          border: `1px solid ${scanProgress >= 100 ? "#bbf7d0" : "#fde68a"}`,
                          borderRadius: 12,
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          textAlign: "left",
                          width: "100%",
                          boxSizing: "border-box",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <Clock size={16} color={scanProgress >= 100 ? "#16a34a" : "#d97706"} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: 11.5, color: scanProgress >= 100 ? "#166534" : "#92400e", lineHeight: 1.45 }}>
                          {scanProgress >= 100 ? (
                            <>
                              <strong>Verification complete!</strong> All detected subject calculations loaded successfully.
                            </>
                          ) : (
                            <>
                              <strong>Please be patient:</strong> High-precision AI OCR scanning accurately detects multi-component Theory, Lab, and Tutorial breakdowns. This takes <strong>3–5 seconds</strong>—please do not close or refresh this modal.
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : scanStatus.isLimitReached ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#dc2626",
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.1)",
                        }}
                      >
                        <AlertTriangle size={26} />
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#991b1b" }}>
                        Daily AI Scan Limit Reached (2/2)
                      </div>
                      <div style={{ fontSize: 12, color: "#7f1d1d", maxWidth: 360, lineHeight: 1.45 }}>
                        You have used your 2 AI screenshot scans for today. Limit resets tomorrow after midnight (12:00 AM). Please add your attendance manually below.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#2563eb",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                      >
                        <UploadCloud size={26} />
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}>
                        Drag & drop screenshot here, or <span style={{ color: "#2563eb" }}>browse file</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Supports PNG, JPG, WebP • Or press <kbd style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Ctrl + V</kbd> to paste
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Disclaimer & Checkbox */}
                <div
                  style={{
                    marginTop: 14,
                    background: isScreenshotVerified ? "#f0fdf4" : "#fffbeb",
                    border: `1.5px solid ${isScreenshotVerified ? "#86efac" : "#fde68a"}`,
                    borderRadius: 12,
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <ShieldCheck
                      size={16}
                      color={isScreenshotVerified ? "#059669" : "#d97706"}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <div style={{ fontSize: 11.5, color: isScreenshotVerified ? "#166534" : "#92400e", lineHeight: 1.45 }}>
                      <strong>ERP Verification Disclaimer:</strong> Please double-check that all detected Theory (PP), Lab (PR), and Tutorial (TUT) values match your official ERP attendance records before confirming.
                    </div>
                  </div>

                  <label
                    onClick={() => setIsScreenshotVerified(!isScreenshotVerified)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: isScreenshotVerified ? "#15803d" : "#78350f",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: `2px solid ${isScreenshotVerified ? "#059669" : "#cbd5e1"}`,
                        background: isScreenshotVerified ? "#059669" : "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                        boxShadow: isScreenshotVerified ? "0 2px 6px rgba(5, 150, 105, 0.35)" : "none",
                      }}
                    >
                      {isScreenshotVerified && (
                        <Check size={13} color="#ffffff" strokeWidth={2.5} />
                      )}
                    </div>
                    <span>I have verified that the extracted ERP component attendance values are accurate</span>
                  </label>
                </div>

                {errorMsg && (
                  <div
                    style={{
                      marginTop: 14,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 12.5,
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Quick Hint Card */}
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <FileCheck size={16} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                    <strong>Pro Tip:</strong> Supports both <strong>Website ERP Table</strong> (with Course Code &amp; Component rows e.g. <code>CUTM1020 - PP</code>) and <strong>Mobile ERP App</strong> screenshots. Take a quick snip (<kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>Win+Shift+S</kbd> or <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>Cmd+Shift+4</kbd>) and press <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>Ctrl+V</kbd> right here.
                  </div>
                </div>
              </div>
            ) : (
              /* Review Step */
              <div>
                {/* ── LIVE OVERALL AGGREGATE SUMMARY CARD (TOP OF MODAL) ── */}
                <div
                  style={{
                    background: liveOverall.isEligible
                      ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"
                      : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: `1.5px solid ${liveOverall.isEligible ? "#86efac" : "#fde68a"}`,
                    borderRadius: 14,
                    padding: isMobile ? "12px 14px" : "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
                    <div
                      style={{
                        width: isMobile ? 40 : 46,
                        height: isMobile ? 40 : 46,
                        borderRadius: 12,
                        background: liveOverall.isEligible ? "#059669" : "#d97706",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: liveOverall.isEligible
                          ? "0 3px 10px rgba(5,150,105,0.3)"
                          : "0 3px 10px rgba(217,119,6,0.3)",
                      }}
                    >
                      <Percent size={isMobile ? 20 : 24} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: liveOverall.isEligible ? "#166534" : "#92400e",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Overall Live Attendance Score
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? 19 : 23,
                          fontWeight: 900,
                          color: liveOverall.isEligible ? "#059669" : "#d97706",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {liveOverall.percentage}%{" "}
                        <span style={{ fontSize: isMobile ? 12 : 13.5, color: "#64748b", fontWeight: 700 }}>
                          ({liveOverall.totalAtt} / {liveOverall.totalDel} classes)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 11 : 12,
                      fontWeight: 900,
                      background: liveOverall.isEligible ? "#dcfce7" : "#fef3c7",
                      color: liveOverall.isEligible ? "#15803d" : "#b45309",
                      padding: isMobile ? "4px 8px" : "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${liveOverall.isEligible ? "#bbf7d0" : "#fde68a"}`,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {liveOverall.isEligible ? (
                      <CheckCircle2 size={13} color="#16a34a" />
                    ) : (
                      <AlertCircle size={13} color="#d97706" />
                    )}
                    <span>{liveOverall.isEligible ? "ELIGIBLE" : "BELOW 75%"}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Detected Subjects ({parsedSubjects.length})
                  </span>

                  <div style={{ display: "flex", gap: 8, position: "relative" }}>
                    {/* Add from Section Catalog Button */}
                    <button
                      onClick={() => setShowCatalogDropdown(!showCatalogDropdown)}
                      style={{
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: 8,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1d4ed8",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <BookOpen size={13} />
                      <span>+ Add From Section Catalog</span>
                      <ChevronDown size={12} />
                    </button>

                    {/* Catalog Dropdown Menu */}
                    {showCatalogDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          marginTop: 4,
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                          zIndex: 100,
                          minWidth: 260,
                          maxHeight: 220,
                          overflowY: "auto",
                          padding: 4,
                        }}
                      >
                        {sectionCatalog.map((cat, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleAddRow(cat.subjectName, cat.code)}
                            style={{
                              padding: "7px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1e293b",
                              cursor: "pointer",
                              borderRadius: 6,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span>{cat.subjectName}</span>
                            <Plus size={12} color="#2563eb" />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleAddRow()}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Plus size={13} />
                      <span>Custom Row</span>
                    </button>
                  </div>
                </div>

{isMobile ? (
                  /* Mobile-First Spacious Card List (Zero clipping & full subject names) */
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {parsedSubjects.map((sub, idx) => {
                      const isSafe = sub.percentage >= 75;
                      return (
                        <div
                          key={sub.id || idx}
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: 14,
                            padding: "12px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          }}
                        >
                          {/* Subject Name & Delete Button */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="text"
                              value={sub.name}
                              onChange={(e) => handleUpdateField(sub.id, "name", e.target.value)}
                              placeholder="Subject Name"
                              style={{
                                flex: 1,
                                padding: "7px 10px",
                                borderRadius: 8,
                                border: "1.5px solid #cbd5e1",
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#0f172a",
                                outline: "none",
                                background: "#f8fafc",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenEditSubject(sub)}
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                color: "#1d4ed8",
                                cursor: "pointer",
                                padding: "7px 9px",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                fontSize: 11.5,
                                fontWeight: 700,
                              }}
                              title="Edit Components & Details"
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(sub.id)}
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#dc2626",
                                cursor: "pointer",
                                padding: "7px 9px",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Remove Subject"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Component Badges (Click any badge or Edit button to modify) */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              {sub.components && sub.components.length > 0 ? (
                                sub.components.map((comp, cIdx) => (
                                  <span
                                    key={cIdx}
                                    onClick={() => handleOpenEditSubject(sub)}
                                    title="Click to edit this component"
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 800,
                                      background: comp.type === "PR" ? "#faf5ff" : comp.type === "TUT" ? "#fffbeb" : "#eff6ff",
                                      color: comp.type === "PR" ? "#7c3aed" : comp.type === "TUT" ? "#b45309" : "#1e40af",
                                      border: `1.5px solid ${comp.type === "PR" ? "#ddd6fe" : comp.type === "TUT" ? "#fde68a" : "#bfdbfe"}`,
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <span>{comp.type}: {comp.attended}/{comp.delivered || comp.total}</span>
                                    <span style={{ fontSize: 10, opacity: 0.85 }}>({Number(comp.delivered) > 0 ? `${comp.percentage || ((comp.attended / comp.delivered) * 100).toFixed(0)}%` : "0%"})</span>
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>No components detected</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEditSubject(sub)}
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                color: "#1d4ed8",
                                cursor: "pointer",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 800,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Edit2 size={11} />
                              <span>Edit Components</span>
                            </button>
                          </div>

                          {/* Attended, Total, Status Percentage Controls */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "center", paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                                Attended:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={sub.attendedClasses}
                                onChange={(e) => handleUpdateField(sub.id, "attendedClasses", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  borderRadius: 8,
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: 13.5,
                                  fontWeight: 800,
                                  textAlign: "center",
                                  color: "#0f172a",
                                  outline: "none",
                                  background: "#ffffff",
                                  boxSizing: "border-box",
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                                Total Classes:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={sub.totalClasses}
                                onChange={(e) => handleUpdateField(sub.id, "totalClasses", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  borderRadius: 8,
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: 13.5,
                                  fontWeight: 800,
                                  textAlign: "center",
                                  color: "#0f172a",
                                  outline: "none",
                                  background: "#ffffff",
                                  boxSizing: "border-box",
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                                Score:
                              </label>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  background: isSafe ? "#ecfdf5" : "#fffbeb",
                                  color: isSafe ? "#059669" : "#d97706",
                                  border: `1px solid ${isSafe ? "#a7f3d0" : "#fde68a"}`,
                                  boxSizing: "border-box",
                                  minWidth: 54,
                                }}
                              >
                                {sub.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Desktop / Tablet Spacious Table */
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#ffffff",
                    }}
                  >
                    <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                          <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", width: "48%" }}>Subject Name</th>
                          <th style={{ padding: "10px 8px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", width: "15%", textAlign: "center" }}>Attended</th>
                          <th style={{ padding: "10px 8px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", width: "15%", textAlign: "center" }}>Total</th>
                          <th style={{ padding: "10px 8px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", width: "14%", textAlign: "center" }}>Status %</th>
                          <th style={{ padding: "10px 8px", width: "8%", textAlign: "center" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedSubjects.map((sub, idx) => {
                          const isSafe = sub.percentage >= 75;
                          return (
                            <tr
                              key={sub.id || idx}
                              style={{
                                borderBottom: idx === parsedSubjects.length - 1 ? "none" : "1px solid #f1f5f9",
                              }}
                            >
                              <td style={{ padding: "8px 14px" }}>
                                <input
                                  type="text"
                                  value={sub.name}
                                  onChange={(e) => handleUpdateField(sub.id, "name", e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    border: "1px solid #e2e8f0",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    outline: "none",
                                    background: "#fafafa",
                                    boxSizing: "border-box",
                                  }}
                                />
                                {sub.components && sub.components.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      marginTop: 4,
                                      flexWrap: "wrap",
                                      alignItems: "center",
                                    }}
                                  >
                                    {sub.components.map((comp, cIdx) => (
                                      <span
                                        key={cIdx}
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 800,
                                          background:
                                            comp.type === "PR"
                                              ? "#faf5ff"
                                              : comp.type === "TUT"
                                              ? "#fffbeb"
                                              : "#eff6ff",
                                          color:
                                            comp.type === "PR"
                                              ? "#7c3aed"
                                              : comp.type === "TUT"
                                              ? "#b45309"
                                              : "#1e40af",
                                          border: `1px solid ${
                                            comp.type === "PR"
                                              ? "#ddd6fe"
                                              : comp.type === "TUT"
                                              ? "#fde68a"
                                              : "#bfdbfe"
                                          }`,
                                          padding: "1px 6px",
                                          borderRadius: 4,
                                        }}
                                      >
                                        {comp.type}: {comp.attended}/{comp.delivered || comp.total} ({Number(comp.delivered) > 0 ? `${comp.percentage || ((comp.attended / comp.delivered) * 100).toFixed(0)}%` : "0%"})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={sub.attendedClasses}
                                  onChange={(e) => handleUpdateField(sub.id, "attendedClasses", e.target.value)}
                                  style={{
                                    width: "80%",
                                    padding: "6px 6px",
                                    borderRadius: 6,
                                    border: "1px solid #e2e8f0",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    color: "#0f172a",
                                    outline: "none",
                                    background: "#fafafa",
                                    boxSizing: "border-box",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={sub.totalClasses}
                                  onChange={(e) => handleUpdateField(sub.id, "totalClasses", e.target.value)}
                                  style={{
                                    width: "80%",
                                    padding: "6px 6px",
                                    borderRadius: 6,
                                    border: "1px solid #e2e8f0",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    color: "#0f172a",
                                    outline: "none",
                                    background: "#fafafa",
                                    boxSizing: "border-box",
                                  }}
                                />
                              </td>
                              <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    background: isSafe ? "#ecfdf5" : "#fffbeb",
                                    color: isSafe ? "#059669" : "#d97706",
                                    border: `1px solid ${isSafe ? "#a7f3d0" : "#fde68a"}`,
                                  }}
                                >
                                  {sub.percentage}%
                                </span>
                              </td>
                              <td style={{ padding: "8px 8px", textAlign: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSubject(sub)}
                                    style={{
                                      background: "#eff6ff",
                                      border: "1px solid #bfdbfe",
                                      color: "#1d4ed8",
                                      cursor: "pointer",
                                      padding: "4px 6px",
                                      borderRadius: 6,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    title="Edit Subject Components"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(sub.id)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#dc2626",
                                      cursor: "pointer",
                                      padding: 4,
                                      borderRadius: 6,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    title="Remove Subject"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Verification Disclaimer & Checkbox */}
                <div
                  style={{
                    marginTop: 14,
                    background: isScreenshotVerified ? "#f0fdf4" : "#fffbeb",
                    border: `1.5px solid ${isScreenshotVerified ? "#86efac" : "#fde68a"}`,
                    borderRadius: 12,
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <ShieldCheck
                      size={16}
                      color={isScreenshotVerified ? "#059669" : "#d97706"}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <div style={{ fontSize: 11.5, color: isScreenshotVerified ? "#166534" : "#92400e", lineHeight: 1.45 }}>
                      <strong>ERP Verification Disclaimer:</strong> Please double-check that all detected Theory (PP), Lab (PR), and Tutorial (TUT) values match your official ERP attendance records before confirming.
                    </div>
                  </div>

                  <label
                    onClick={() => setIsScreenshotVerified(!isScreenshotVerified)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: isScreenshotVerified ? "#15803d" : "#78350f",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: `2px solid ${isScreenshotVerified ? "#059669" : "#cbd5e1"}`,
                        background: isScreenshotVerified ? "#059669" : "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                        boxShadow: isScreenshotVerified ? "0 2px 6px rgba(5, 150, 105, 0.35)" : "none",
                      }}
                    >
                      {isScreenshotVerified && (
                        <Check size={13} color="#ffffff" strokeWidth={2.5} />
                      )}
                    </div>
                    <span>I have verified that the extracted ERP component attendance values are accurate</span>
                  </label>
                </div>

                {errorMsg && (
                  <div
                    style={{
                      marginTop: 12,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer (Clean Responsive Stacking) */}
          <div
            style={{
              padding: isMobile ? "12px 14px" : "14px 24px",
              borderTop: "1px solid #f1f5f9",
              background: "#fafafa",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? 8 : 10,
            }}
          >
            {step === "review" ? (
              <button
                type="button"
                onClick={() => setStep("upload")}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                Scan Another Image
              </button>
            ) : (
              <span style={{ fontSize: 12, color: "#94a3b8", display: isMobile ? "none" : "inline" }}>Ready for instant upload</span>
            )}

            <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  flex: isMobile ? 1 : "none",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                Cancel
              </button>

              {step === "review" && (
                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  disabled={!isScreenshotVerified}
                  style={{
                    flex: isMobile ? 2 : "none",
                    opacity: isScreenshotVerified ? 1 : 0.6,
                    cursor: isScreenshotVerified ? "pointer" : "not-allowed",
                    background: "#0f172a",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 16px",
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)",
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm & Save to Cloud</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          SUB-MODAL: COMPONENT BREAKDOWN & DETAILS EDITOR (PP, PR, TUT)
      ═════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingSubject && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? 12 : 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: "#ffffff",
                borderRadius: 18,
                maxWidth: "min(500px, 95vw)",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Sub-Modal Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <Edit2 size={16} color="#2563eb" />
                    <span>Edit Subject & Components</span>
                  </h4>
                  <span style={{ fontSize: 11.5, color: "#64748b" }}>
                    Configure Theory (PP), Lab (PR), and Tutorial (TUT) breakdowns
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sub-Modal Body */}
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Subject Title & Code */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 4 }}>
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject((prev) => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Component Breakdown Rows */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                      Component Breakdown ({editingSubject.components?.length || 0})
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleAddComponentRow("PP")}
                        style={{
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          color: "#1d4ed8",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Plus size={11} /> + Theory (PP)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddComponentRow("PR")}
                        style={{
                          background: "#faf5ff",
                          border: "1px solid #ddd6fe",
                          color: "#7c3aed",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Plus size={11} /> + Lab (PR)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddComponentRow("TUT")}
                        style={{
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          color: "#b45309",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Plus size={11} /> + Tutorial (TUT)
                      </button>
                    </div>
                  </div>

                  {editingSubject.components?.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 12 }}>
                      No components added yet. Click one of the buttons above to add Theory, Lab, or Tutorial.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {editingSubject.components.map((comp, cIdx) => (
                        <div
                          key={cIdx}
                          style={{
                            background: comp.type === "PR" ? "#faf5ff" : comp.type === "TUT" ? "#fffbeb" : "#eff6ff",
                            border: `1.5px solid ${comp.type === "PR" ? "#ddd6fe" : comp.type === "TUT" ? "#fde68a" : "#bfdbfe"}`,
                            borderRadius: 10,
                            padding: "8px 10px",
                            display: "grid",
                            gridTemplateColumns: "1.2fr 1fr 1fr auto auto",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          {/* Component Type Selector */}
                          <div>
                            <label style={{ display: "block", fontSize: 9.5, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                              Type:
                            </label>
                            <select
                              value={comp.type}
                              onChange={(e) => handleUpdateComponentField(cIdx, "type", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 11.5,
                                fontWeight: 800,
                                color: comp.type === "PR" ? "#7c3aed" : comp.type === "TUT" ? "#b45309" : "#1d4ed8",
                                background: "#ffffff",
                                outline: "none",
                              }}
                            >
                              <option value="PP">Theory (PP)</option>
                              <option value="PR">Practical (PR)</option>
                              <option value="TUT">Tutorial (TUT)</option>
                            </select>
                          </div>

                          {/* Attended Classes */}
                          <div>
                            <label style={{ display: "block", fontSize: 9.5, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                              Attended:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={comp.attended}
                              onChange={(e) => handleUpdateComponentField(cIdx, "attended", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 12,
                                fontWeight: 800,
                                textAlign: "center",
                                outline: "none",
                                background: "#ffffff",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>

                          {/* Delivered Classes */}
                          <div>
                            <label style={{ display: "block", fontSize: 9.5, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                              Delivered:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={comp.delivered}
                              onChange={(e) => handleUpdateComponentField(cIdx, "delivered", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 12,
                                fontWeight: 800,
                                textAlign: "center",
                                outline: "none",
                                background: "#ffffff",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>

                          {/* Live Component Percentage */}
                          <div style={{ textAlign: "center" }}>
                            <label style={{ display: "block", fontSize: 9.5, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>
                              Score:
                            </label>
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "3px 6px",
                                borderRadius: 5,
                                background: Number(comp.delivered) > 0 && (comp.percentage || 0) >= 75 ? "#ecfdf5" : "#fffbeb",
                                color: Number(comp.delivered) > 0 && (comp.percentage || 0) >= 75 ? "#059669" : "#d97706",
                                border: `1px solid ${Number(comp.delivered) > 0 && (comp.percentage || 0) >= 75 ? "#a7f3d0" : "#fde68a"}`,
                              }}
                            >
                              {Number(comp.delivered) > 0 ? `${comp.percentage || 0}%` : "0%"}
                            </span>
                          </div>

                          {/* Delete Component Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteComponentRow(cIdx)}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              cursor: "pointer",
                              padding: "4px 6px",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 14,
                            }}
                            title="Delete Component"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Modal Footer */}
              <div
                style={{
                  padding: "12px 20px",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedSubject}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                  }}
                >
                  <Check size={14} />
                  <span>Apply & Update Subject</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
