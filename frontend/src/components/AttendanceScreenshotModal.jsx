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

  // Dedicated CUTM ERP Text Heuristic Parser
  const parseCutmOcrText = (text, catalog) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const subjectsMap = new Map();
    let activeSubjectKey = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignore standard header/footer strings
      if (
        line.includes("Attendance Details") ||
        line.includes("Wise Attendance") ||
        line.includes("From date") ||
        line.includes("To date") ||
        line.includes("Total Percentage") ||
        line.includes("Course Code") ||
        line.includes("Attended/Delivered") ||
        line.includes("Home") ||
        /^\d{10,14}$/.test(line)
      ) {
        continue;
      }

      // Check if line matches a known catalog subject or has a CUTM code
      let matchedCatalog = catalog.find(
        (c) =>
          line.toLowerCase().includes(c.subjectName.toLowerCase()) ||
          (c.code && line.toLowerCase().includes(c.code.toLowerCase()))
      );

      // Fuzzy matching keywords for CUTM curriculum
      if (!matchedCatalog) {
        const lower = line.toLowerCase();
        if (lower.includes("robotic") || lower.includes("ros")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("robotic")) || {
            subjectName: "Robotic Automation with ROS and C++",
            code: "CUTM1020",
          };
        } else if (lower.includes("minor project")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("minor project")) || {
            subjectName: "Minor Project II",
            code: "CUTM1577",
          };
        } else if (lower.includes("summer internship") || lower.includes("internship")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("internship")) || {
            subjectName: "Summer Internship I",
            code: "CUTM1578",
          };
        } else if (lower.includes("cloud") || lower.includes("azure")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("cloud"));
        } else if (lower.includes("network") || lower.includes("iot")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("network"));
        } else if (lower.includes("compiler") || lower.includes("theory of comp") || lower.includes("toc")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("theory of computation"));
        } else if (lower.includes("information security") || lower.includes("cisco")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("information security"));
        } else if (lower.includes("prompt")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("prompt"));
        } else if (lower.includes("data structure") || lower.includes("dsa") || lower.includes("algorithm")) {
          matchedCatalog = catalog.find((c) => c.subjectName.toLowerCase().includes("data structure"));
        }
      }

      if (matchedCatalog) {
        activeSubjectKey = matchedCatalog.subjectName;
        if (!subjectsMap.has(activeSubjectKey)) {
          subjectsMap.set(activeSubjectKey, {
            name: matchedCatalog.subjectName,
            code: matchedCatalog.code || "",
            attended: 0,
            total: 0,
            components: [],
          });
        }
      }

      // Check for fractions e.g. 3/4, 22/24, 4/5, 0/0
      const fracMatch = line.match(/(\d+)\s*[\/|\\]\s*(\d+)/);
      if (fracMatch && activeSubjectKey && subjectsMap.has(activeSubjectKey)) {
        const att = parseInt(fracMatch[1], 10);
        const del = parseInt(fracMatch[2], 10);

        // Sanity filter (not dates like 2026/2027)
        if (del < 300 && !line.includes("2026") && !line.includes("2027")) {
          const sub = subjectsMap.get(activeSubjectKey);
          sub.attended += att;
          sub.total += del;
          sub.components.push({ attended: att, delivered: del, raw: line });
        }
      }
    }

    return Array.from(subjectsMap.values()).map((s, idx) => ({
      id: `ocr_sub_${Date.now()}_${idx}`,
      name: s.name,
      code: s.code,
      attendedClasses: s.attended,
      totalClasses: s.total,
      percentage: s.total > 0 ? Number(((s.attended / s.total) * 100).toFixed(1)) : 0,
      components: s.components,
    }));
  };

  // Analyze Screenshot via Dual AI (Cloud Gemini + Client-Side Tesseract WASM Engine)
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

    // 2. If Serverless didn't extract or no API key, run Client-Side Tesseract.js Engine
    if (extracted.length === 0) {
      try {
        setProcessingStatus("Running local OCR engine on screenshot...");
        const worker = await createWorker("eng");
        const ret = await worker.recognize(imageBase64);
        await worker.terminate();

        const rawText = ret.data?.text || "";
        extracted = parseCutmOcrText(rawText, sectionCatalog);
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
      components: [
        {
          name: "Theory / Lab",
          attended: s.attendedClasses || 0,
          total: s.totalClasses || 0,
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
                    <strong>Pro Tip:</strong> Open your university ERP attendance page, take a quick screenshot (<kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>Win+Shift+S</kbd> or <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>Cmd+Shift+4</kbd>), and press <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>Ctrl+V</kbd> right here.
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
