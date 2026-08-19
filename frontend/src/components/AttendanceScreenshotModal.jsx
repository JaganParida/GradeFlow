import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  X,
  Loader2,
  FileCheck,
  Percent,
  Layers,
  ArrowRight,
  Clipboard,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { getSectionSubjectCatalog, cleanSubjectBaseName } from "../utils/timetableHelper";

export default function AttendanceScreenshotModal({
  isOpen,
  onClose,
  onApply,
  currentSection = "CSE-E",
  API = "/api",
}) {
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
  const fileInputRef = useRef(null);

  // Get active section catalog subjects
  const sectionCatalog = getSectionSubjectCatalog(currentSection) || [];

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

  // Canvas-based image preprocessor for optimal OCR recognition (2.5x upscale, table border removal & high contrast)
  const preprocessImageForOcr = (imageSource) => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = 2.5; // High resolution upscale for sharp digit & code recognition
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(imageSource);

          // Fill pure white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Use high quality image smoothing for scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          // Adaptive binarization: Convert dark text (<150) to pure black, and all table lines / pill borders / headers (>155) to pure white
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum < 145) {
              d[i] = 0;
              d[i + 1] = 0;
              d[i + 2] = 0;
            } else {
              d[i] = 255;
              d[i + 1] = 255;
              d[i + 2] = 255;
            }
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

  // Dedicated CUTM ERP Text Parser (Strictly Maps to Enrolled Section Catalog Subjects)
  const parseCutmOcrText = (text, catalog = []) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const subjectsMap = new Map();

    // 1. Pre-populate with all authentic section catalog subjects initialized cleanly
    catalog.forEach((c) => {
      subjectsMap.set(c.subjectName, {
        name: c.subjectName,
        code: c.code || "",
        components: (c.components || ["PP", "PR"]).map((t) => ({
          type: t,
          attended: 0,
          delivered: 0,
          percentage: 0,
        })),
        detectedFromImage: false,
      });
    });

    let detectedOverallAttended = 0;
    let detectedOverallDelivered = 0;

    // Detect Total Percentage line (e.g. "Total Percentage 110/136 80.88%")
    for (let line of lines) {
      if (
        line.toLowerCase().includes("total percentage") ||
        line.toLowerCase().includes("total percent") ||
        line.toLowerCase().includes("total")
      ) {
        const match = line.match(/(\d{1,4})\s*[\/|\\]\s*(\d{1,4})/);
        if (match) {
          detectedOverallAttended = parseInt(match[1], 10);
          detectedOverallDelivered = parseInt(match[2], 10);
        }
      }
    }

    // Fuzzy Subject Matcher — STRICTLY resolves to enrolled catalog only
    const findCatalogSubject = (str) => {
      const upper = str.toUpperCase();
      for (const c of catalog) {
        if (c.code && upper.includes(c.code.toUpperCase())) return c;
        if (upper.includes(c.subjectName.toUpperCase())) return c;
      }
      // Fuzzy keywords for CUTM curriculum
      if (upper.includes("FOBLTIC") || upper.includes("ROBOT") || upper.includes("ROS") || upper.includes("1020")) {
        return catalog.find((c) => c.code === "CUTM1020" || c.subjectName.toLowerCase().includes("robotic"));
      }
      if (upper.includes("MINCE") || upper.includes("MINOR") || upper.includes("1577") || upper.includes("1906")) {
        return catalog.find((c) => c.code === "CUTM1577" || c.code === "CUTM1906" || c.subjectName.toLowerCase().includes("minor"));
      }
      if (upper.includes("CAMA") || upper.includes("STHLCT") || upper.includes("DATA") || upper.includes("STRUCT") || upper.includes("ALGO") || upper.includes("3166")) {
        return catalog.find((c) => c.code === "CUTM3166" || c.subjectName.toLowerCase().includes("data structure"));
      }
      if (upper.includes("TION BES") || upper.includes("TION SER") || upper.includes("INFO") || upper.includes("SECUR") || upper.includes("CIS") || upper.includes("1007")) {
        return catalog.find((c) => c.code === "CUCS1007" || c.subjectName.toLowerCase().includes("security"));
      }
      if (upper.includes("NET") || upper.includes("PROT") || upper.includes("IOT") || upper.includes("1006")) {
        return catalog.find((c) => c.code === "CUCS1006" || c.subjectName.toLowerCase().includes("network"));
      }
      if (upper.includes("COMP") || upper.includes("TOC") || upper.includes("THEORY") || upper.includes("1008")) {
        return catalog.find((c) => c.code === "CUCS1008" || c.subjectName.toLowerCase().includes("theory of comp"));
      }
      if (upper.includes("FISH") || upper.includes("PROMPT") || upper.includes("CHAT") || upper.includes("GPT") || upper.includes("1014")) {
        return catalog.find((c) => c.code === "CUCS1014" || c.subjectName.toLowerCase().includes("prompt"));
      }
      if (upper.includes("LOS FUND") || upper.includes("FUNDZ") || upper.includes("CLOUD") || upper.includes("AZURE") || upper.includes("1015")) {
        return catalog.find((c) => c.code === "CUCS1015" || c.subjectName.toLowerCase().includes("cloud"));
      }
      return null;
    };

    // 2. Line Scanner
    let activeSubject = null;
    let activeCompType = "PP";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignore noise & headers
      if (
        line.includes("Sr.No") ||
        line.includes("Course Name") ||
        line.includes("Course Short Name") ||
        line.includes("Course Code") ||
        line.includes("Attended/Delivered") ||
        line.includes("From date") ||
        line.includes("To date") ||
        line.toLowerCase().startsWith("total percentage")
      ) {
        continue;
      }

      // Component Type Detector (PP, PR, TUT)
      const upper = line.toUpperCase();
      if (upper.includes("- PR") || upper.includes("(PR") || upper.includes("- (PR") || upper.includes("-(PR")) {
        activeCompType = "PR";
      } else if (
        upper.includes("- PP") ||
        upper.includes("(PP") ||
        upper.includes("- (PP") ||
        upper.includes("-(PP") ||
        upper.includes("(PF")
      ) {
        activeCompType = "PP";
      } else if (
        upper.includes("- TUT") ||
        upper.includes("(TUT") ||
        upper.includes("- (TUT") ||
        upper.includes("-(TUT") ||
        upper.includes("(TL")
      ) {
        activeCompType = "TUT";
      }

      const matchedCat = findCatalogSubject(line);
      if (matchedCat) {
        activeSubject = matchedCat;
      }

      const fracMatch = line.match(/(\d+)\s*[\/|\\]\s*(\d+)/);
      if (fracMatch && activeSubject) {
        const att = parseInt(fracMatch[1], 10);
        const del = parseInt(fracMatch[2], 10);

        if (del < 300 && !line.toLowerCase().includes("total")) {
          const sub = subjectsMap.get(activeSubject.subjectName);
          if (sub) {
            sub.detectedFromImage = true;
            let comp = sub.components.find((c) => c.type === activeCompType);
            if (!comp) {
              comp = { type: activeCompType, attended: 0, delivered: 0, percentage: 0 };
              sub.components.push(comp);
            }
            comp.attended = att;
            comp.delivered = del;
            comp.percentage = del > 0 ? Number(((att / del) * 100).toFixed(1)) : 100;
          }
        }
      }
    }

    return Array.from(subjectsMap.values()).map((s, idx) => {
      const totalAtt = s.components.reduce((acc, c) => acc + (Number(c.attended) || 0), 0);
      const totalDel = s.components.reduce((acc, c) => acc + (Number(c.delivered) || 0), 0);

      return {
        id: `ocr_sub_${Date.now()}_${idx}`,
        name: s.name,
        code: s.code,
        attendedClasses: totalAtt,
        totalClasses: totalDel,
        percentage: totalDel > 0 ? Number(((totalAtt / totalDel) * 100).toFixed(1)) : 0,
        components: s.components,
        detectedFromImage: s.detectedFromImage,
      };
    });
  };

  // Analyze Screenshot via Dual AI (Cloud Gemini + Client-Side Tesseract WASM Engine with Image Preprocessing)
  const analyzeScreenshot = async (imageBase64, mimeType) => {
    setIsProcessing(true);
    setErrorMsg("");
    setProcessingStatus("Initializing AI Vision scanner...");

    let extracted = [];

    // 1. Try Serverless Endpoint
    try {
      setProcessingStatus("Scanning image layout with Gemini Vision...");
      const res = await axios.post(`${API}/attendance/ocr`, {
        imageBase64,
        mimeType: mimeType || "image/jpeg",
      });

      if (res.data?.success && Array.isArray(res.data.subjects) && res.data.subjects.length > 0) {
        extracted = res.data.subjects;
      }
    } catch (err) {
      console.warn("Cloud OCR skipped, switching to high-accuracy local OCR engine:", err);
    }

    // 2. If Serverless didn't extract or no API key, run Client-Side Tesseract.js Engine with Canvas Preprocessing
    if (extracted.length === 0) {
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
        extracted = parseCutmOcrText(rawText, sectionCatalog);
      } catch (tessErr) {
        console.warn("Local Tesseract OCR warning, trying default mode:", tessErr);
        try {
          const worker2 = await createWorker("eng");
          const ret2 = await worker2.recognize(imageBase64);
          await worker2.terminate();
          const rawText2 = ret2.data?.text || "";
          extracted = parseCutmOcrText(rawText2, sectionCatalog);
        } catch {}
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

    if (extracted.length > 0) {
      setParsedSubjects(extracted);
      setStep("review");
    } else {
      setErrorMsg("Could not detect subjects automatically. Please add rows manually.");
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
                <Sparkles size={20} />
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
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
            {step === "upload" ? (
              <div>
                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? "#2563eb" : "#cbd5e1"}`,
                    background: dragActive ? "#eff6ff" : "#f8fafc",
                    borderRadius: 16,
                    padding: "36px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {isProcessing ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <Loader2 size={36} color="#2563eb" className="spin" />
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                        Scanning Attendance Screenshot...
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Extracting subjects, attended classes, and total count with AI Vision
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

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#ffffff",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Subject Name</th>
                        <th style={{ padding: "10px 10px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", width: 90, textAlign: "center" }}>Attended</th>
                        <th style={{ padding: "10px 10px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", width: 90, textAlign: "center" }}>Total</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", width: 90, textAlign: "center" }}>Status %</th>
                        <th style={{ padding: "10px 10px", width: 44, textAlign: "center" }}></th>
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
                                      {comp.type}: {comp.attended}/{comp.delivered || comp.total} ({comp.percentage || (comp.delivered > 0 ? ((comp.attended / comp.delivered) * 100).toFixed(0) : 0)}%)
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                value={sub.attendedClasses}
                                onChange={(e) => handleUpdateField(sub.id, "attendedClasses", e.target.value)}
                                style={{
                                  width: 70,
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  textAlign: "center",
                                  color: "#0f172a",
                                  outline: "none",
                                  background: "#fafafa",
                                }}
                              />
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                value={sub.totalClasses}
                                onChange={(e) => handleUpdateField(sub.id, "totalClasses", e.target.value)}
                                style={{
                                  width: 70,
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  textAlign: "center",
                                  color: "#0f172a",
                                  outline: "none",
                                  background: "#fafafa",
                                }}
                              />
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
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
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <button
                                onClick={() => handleDeleteRow(sub.id)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#94a3b8",
                                  cursor: "pointer",
                                  padding: 4,
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Remove Subject"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

          {/* Footer */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #f1f5f9",
              background: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {step === "review" ? (
              <button
                onClick={() => setStep("upload")}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Scan Another Image
              </button>
            ) : (
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Ready for instant upload</span>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleClose}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              {step === "review" && (
                <button
                  onClick={handleConfirmAndApply}
                  style={{
                    background: "#0f172a",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
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
    </AnimatePresence>
  );
}
