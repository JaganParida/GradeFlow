import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  categorizeBaskets,
  BASKET_1_SYLLABUS,
  BASKET_2_SYLLABUS,
  BASKET_3_SYLLABUS,
  BASKET_4_SYLLABUS,
  BASKET_5_DOMAINS_DATA,
  inferStudentDomainTrack,
  COMMON_BASKET_5_SYLLABUS,
  isMatch,
  BASKET_5_SKILL_COURSES,
} from "../utils/basketLogic";
import {
  CheckCircle,
  Award,
  Target,
  BookOpen,
  Hexagon,
  Cpu,
  Zap,
  ChevronDown,
  ChevronUp,
  Folder,
  DownloadCloud,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateBasketPDF } from "../utils/pdfGenerator";
import { generateBasketExcel } from "../utils/excelGenerator";
import { generateBasketWord } from "../utils/wordGenerator";

const WhatsAppIcon = ({ size = 16, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const BASKET_ICONS = {
  B1: <Hexagon size={22} color="#2563eb" />,
  B2: <BookOpen size={22} color="#8b5cf6" />,
  B3: <Zap size={22} color="#f59e0b" />,
  B4: <Cpu size={22} color="#ef4444" />,
  B5: <Target size={22} color="#10b981" />,
  EX: <Folder size={22} color="#64748b" />,
};

const BASKET_BG_COLORS = {
  B1: "#eff6ff",
  B2: "#f5f3ff",
  B3: "#fffbeb",
  B4: "#fef2f2",
  B5: "#ecfdf5",
  EX: "#f8fafc",
};

const BASKET_NAMES = {
  B1: "Foundation in Sciences",
  B2: "Humanities & Management",
  B3: "Smart Stack",
  B4: "Core Engineering",
  B5: "Domain, Skill, Internships & Specializations",
  EX: "Additional Electives & Subjects",
};

const GRADE_COLORS = {
  O: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  E: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  A: { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" },
  B: { bg: "#f3e8ff", text: "#7e22ce", border: "#e9d5ff" },
  C: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
  D: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  F: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  R: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  M: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  S: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  I: { bg: "#fef9c3", text: "#a16207", border: "#fef08a" },
};

export default function BasketDashboard({ results, studentData }) {
  const [expandedBasket, setExpandedBasket] = useState("B1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState("");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baskets = useMemo(() => categorizeBaskets(results), [results]);
  const inferredDomain = useMemo(
    () => inferStudentDomainTrack(baskets.B5.subjects, BASKET_5_DOMAINS_DATA),
    [baskets.B5.subjects],
  );

  const totalEarned =
    baskets.B1.credits +
    baskets.B2.credits +
    baskets.B3.credits +
    baskets.B4.credits +
    baskets.B5.credits;
  const targetTotal = 160;
  const completionPercentage = Math.round(Math.min(100, (totalEarned / targetTotal) * 100));

  const honoursCredits = Math.max(0, baskets.B5.credits - baskets.B5.target);
  const honoursTarget = 20;
  const isHonoursEligible = honoursCredits >= honoursTarget;

  const totalSubjectsCount = Object.values(baskets).reduce(
    (acc, curr) => acc + (curr.subjects ? curr.subjects.length : 0),
    0
  );

  const handleExport = async (type) => {
    setShowDownloadMenu(false);
    setIsGenerating(true);
    setGeneratingType(type);
    try {
      if (type === "pdf") await generateBasketPDF(studentData);
      if (type === "excel") await generateBasketExcel(studentData);
      if (type === "word") await generateBasketWord(studentData);
    } catch (err) {
      console.error(`Export ${type} error:`, err);
    } finally {
      setIsGenerating(false);
      setGeneratingType("");
    }
  };

  const renderSubjectRow = (sub, idx, isPending = false, showType = false) => {
    const isBacklog = !isPending && ["F", "R", "M", "S", "I"].includes(sub.grade);
    const isPassed = !isPending && !isBacklog;
    const gradeStyle = isPending
      ? { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" }
      : (GRADE_COLORS[sub.grade] || { bg: "#f8fafc", text: "#334155", border: "#e2e8f0" });

    if (isMobile) {
      return (
        <div
          key={idx}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px 14px",
            borderBottom: "1px solid #f1f5f9",
            background: isBacklog ? "#fef2f2" : isPassed ? "#ffffff" : "#fafafa",
          }}
        >
          {/* Top Row: Subject Name + Grade / Status */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <span
              style={{
                fontSize: 13,
                color: isPending ? "#64748b" : "#0f172a",
                fontWeight: 700,
                lineHeight: 1.35,
                flex: 1,
              }}
            >
              {sub.subName}
            </span>
            {isPending ? (
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 7px",
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  flexShrink: 0,
                }}
              >
                PENDING
              </span>
            ) : (
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  background: gradeStyle.bg,
                  border: `1px solid ${gradeStyle.border}`,
                  color: gradeStyle.text,
                  flexShrink: 0,
                }}
              >
                {sub.grade}
              </span>
            )}
          </div>

          {/* Bottom Row: Code, Sem, Credits, Type */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {sub.subCode && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: "#475569",
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 600,
                  }}
                >
                  {sub.subCode}
                </span>
              )}
              {!isPending && sub.semester && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#334155",
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  Sem {sub.semester}
                </span>
              )}
              {showType && sub.type && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#6b21a8",
                    background: "#f5f3ff",
                    border: "1px solid #e9d5ff",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  {sub.type}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: isPending ? "#94a3b8" : "#0f172a",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {isPending ? sub.credits : sub.earnedCredits} Cr
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={idx}
        className="basket-subject-row"
        style={{
          display: "grid",
          gridTemplateColumns: showType ? "3.2fr 1fr 1.2fr 1fr 1.2fr" : "3.4fr 1fr 1.2fr 1fr",
          padding: "14px 20px",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          background: isBacklog ? "#fef2f2" : isPassed ? "#ffffff" : "#fafafa",
          transition: "background 0.15s ease",
        }}
      >
        {/* Subject Name & Code */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, paddingRight: 12 }}>
          <span
            style={{
              fontSize: 13,
              color: isPending ? "#64748b" : "#0f172a",
              fontWeight: 700,
              lineHeight: 1.35,
              wordBreak: "break-word",
            }}
          >
            {sub.subName}
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {sub.subCode && (
              <span
                style={{
                  fontSize: 10.5,
                  color: "#475569",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {sub.subCode}
              </span>
            )}
            {isPending && (
              <span
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Curriculum Requirement
              </span>
            )}
          </div>
        </div>

        {/* Semester */}
        <div style={{ textAlign: "center" }}>
          {isPending ? (
            <span style={{ color: "#cbd5e1", fontSize: 13 }}>—</span>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              Sem {sub.semester}
            </span>
          )}
        </div>

        {/* Status / Grade Badge */}
        <div style={{ textAlign: "center" }}>
          {isPending ? (
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                letterSpacing: "0.4px",
              }}
            >
              PENDING
            </span>
          ) : (
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 800,
                background: gradeStyle.bg,
                border: `1px solid ${gradeStyle.border}`,
                color: gradeStyle.text,
              }}
            >
              {sub.grade}
            </span>
          )}
        </div>

        {/* Credits */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: isPending ? "#94a3b8" : "#0f172a",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {isPending ? sub.credits : sub.earnedCredits} Cr
          </span>
        </div>

        {/* Course Type */}
        {showType && (
          <div style={{ textAlign: "right" }}>
            {sub.type ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b21a8",
                  background: "#f5f3ff",
                  border: "1px solid #e9d5ff",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {sub.type}
              </span>
            ) : (
              <span style={{ color: "#cbd5e1", fontSize: 13 }}>—</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBasketContents = (key, data) => {
    if (key === "EX") {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="basket-grid-header"
            style={{
              display: "grid",
              gridTemplateColumns: "3.4fr 1fr 1.2fr 1fr",
              padding: "12px 20px",
              background: "#f8fafc",
              borderBottom: "1px solid #cbd5e1",
              fontSize: 11,
              color: "#475569",
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            <div>Subject</div>
            <div style={{ textAlign: "center" }}>Semester</div>
            <div style={{ textAlign: "center" }}>Status</div>
            <div style={{ textAlign: "center" }}>Credits</div>
          </div>
          {data.subjects.length > 0 ? (
            data.subjects.map((sub, idx) => renderSubjectRow(sub, "ex-" + idx, false, false))
          ) : (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No additional elective subjects taken yet.
            </div>
          )}
        </div>
      );
    }

    let syllabusList = [];
    if (key === "B1") syllabusList = BASKET_1_SYLLABUS;
    if (key === "B2") syllabusList = BASKET_2_SYLLABUS;
    if (key === "B3") syllabusList = BASKET_3_SYLLABUS;

    if (["B1", "B2", "B3"].includes(key)) {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="basket-grid-header"
            style={{
              display: "grid",
              gridTemplateColumns: "3.2fr 1fr 1.2fr 1fr 1.2fr",
              padding: "12px 20px",
              background: "#f8fafc",
              borderBottom: "1px solid #cbd5e1",
              fontSize: 11,
              color: "#475569",
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            <div>Subject</div>
            <div style={{ textAlign: "center" }}>Semester</div>
            <div style={{ textAlign: "center" }}>Status</div>
            <div style={{ textAlign: "center" }}>Credits</div>
            <div style={{ textAlign: "right" }}>Type</div>
          </div>
          {syllabusList.map((syllabusSub, idx) => {
            const takenSub = data.subjects.find((s) => isMatch(s, syllabusSub));
            if (takenSub) return renderSubjectRow({ ...takenSub, type: syllabusSub.type || takenSub.type }, idx, false, true);
            return renderSubjectRow(syllabusSub, idx, true, true);
          })}
          {data.subjects
            .filter((s) => !syllabusList.some((syllabusSub) => isMatch(s, syllabusSub)))
            .map((extraSub, idx) => renderSubjectRow(extraSub, "extra-" + idx, false, true))}
        </div>
      );
    }

    if (key === "B4") {
      const b4ExtraSubjects = data.subjects.filter(
        (s) => !BASKET_4_SYLLABUS.some((bs) => isMatch(s, bs)),
      );
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="basket-grid-header"
            style={{
              display: "grid",
              gridTemplateColumns: "3.2fr 1fr 1.2fr 1fr 1.2fr",
              padding: "12px 20px",
              background: "#f8fafc",
              borderBottom: "1px solid #cbd5e1",
              fontSize: 11,
              color: "#475569",
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            <div>Subject</div>
            <div style={{ textAlign: "center" }}>Semester</div>
            <div style={{ textAlign: "center" }}>Status</div>
            <div style={{ textAlign: "center" }}>Credits</div>
            <div style={{ textAlign: "right" }}>Type</div>
          </div>
          {BASKET_4_SYLLABUS.map((syllabusSub, idx) => {
            const takenSub = data.subjects.find((s) => isMatch(s, syllabusSub));
            if (takenSub) return renderSubjectRow({ ...takenSub, type: syllabusSub.type || takenSub.type }, idx, false, true);
            return renderSubjectRow(
              {
                subName: syllabusSub.subName,
                subCode: syllabusSub.subCode,
                credits: syllabusSub.credits,
                type: syllabusSub.type,
              },
              idx,
              true,
              true
            );
          })}
          {b4ExtraSubjects.length > 0 && (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 10, textTransform: "uppercase" }}>
                Additional B4 Core Electives
              </div>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 10, overflow: "hidden" }}>
                {b4ExtraSubjects.map((sub, idx) => renderSubjectRow(sub, "extra-" + idx, false, true))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (key === "B5") {
      const b5ExtraSubjects = data.subjects.filter((s) => {
        const isInCommon = COMMON_BASKET_5_SYLLABUS.some((cs) => isMatch(s, cs));
        if (isInCommon) return false;
        const isSkill = BASKET_5_SKILL_COURSES.some((sc) => isMatch(s, sc));
        if (isSkill) return false;
        if (!inferredDomain) return true;
        return !inferredDomain.subjects.some((ds) => isMatch(s, ds));
      });

      const fullB5Syllabus = inferredDomain
        ? [...inferredDomain.subjects, ...COMMON_BASKET_5_SYLLABUS]
        : COMMON_BASKET_5_SYLLABUS;

      return (
        <div style={{ display: "flex", flexDirection: "column", padding: "16px 20px", gap: 16 }}>
          {/* Domain Track Banner */}
          <div
            style={{
              padding: "14px 16px",
              background: inferredDomain ? "#eff6ff" : "#f8fafc",
              border: inferredDomain ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: inferredDomain ? "#2563eb" : "#64748b",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Specialization Track
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: inferredDomain ? "#1d4ed8" : "#0f172a" }}>
                  {inferredDomain ? inferredDomain.name : "General Domain Track"}
                </div>
              </div>
            </div>
            {inferredDomain && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#2563eb", background: "#dbeafe", padding: "3px 10px", borderRadius: 20 }}>
                Auto-Detected Track
              </span>
            )}
          </div>

          {/* Skill Courses */}
          {(() => {
            const takenSkillCourses = data.subjects.filter((s) =>
              BASKET_5_SKILL_COURSES.some((sc) => isMatch(s, sc)),
            );
            if (takenSkillCourses.length === 0) return null;
            return (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, textTransform: "uppercase" }}>
                  Skill & Certification Courses
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 10, overflow: "hidden" }}>
                  {takenSkillCourses.map((sub, idx) => renderSubjectRow(sub, "skill-" + idx, false, false))}
                </div>
              </div>
            );
          })()}

          {/* Main Domain Curriculum Table */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, textTransform: "uppercase" }}>
              {inferredDomain ? "Domain Requirements & Common Courses" : "Standard Basket 5 Requirements"}
            </div>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 10, overflow: "hidden" }}>
              <div
                className="basket-grid-header"
                style={{
                  display: "grid",
                  gridTemplateColumns: "3.4fr 1fr 1.2fr 1fr",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #cbd5e1",
                  fontSize: 11,
                  color: "#475569",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                <div>Subject</div>
                <div style={{ textAlign: "center" }}>Semester</div>
                <div style={{ textAlign: "center" }}>Status</div>
                <div style={{ textAlign: "center" }}>Credits</div>
              </div>
              {fullB5Syllabus.map((syllabusSub, idx) => {
                const takenSub = data.subjects.find((s) => isMatch(s, syllabusSub));
                if (takenSub) return renderSubjectRow(takenSub, idx, false, false);
                return renderSubjectRow(
                  {
                    subName: syllabusSub.subName,
                    subCode: syllabusSub.subCode,
                    credits: syllabusSub.credits,
                  },
                  idx,
                  true,
                  false
                );
              })}
            </div>
          </div>

          {/* Extra B5 Electives */}
          {b5ExtraSubjects.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, textTransform: "uppercase" }}>
                Additional Completed Basket 5 Subjects
              </div>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 10, overflow: "hidden" }}>
                {b5ExtraSubjects.map((sub, idx) => renderSubjectRow(sub, "extra-" + idx, false, false))}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  const studentBranch = String(studentData?.branch || "").trim().toUpperCase();
  const isCSE = studentBranch === "CSE" || studentBranch.includes("COMPUTER") || studentBranch.includes("CSE");
  const [isBranchNoticeExpanded, setIsBranchNoticeExpanded] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── BRANCH SYLLABUS STRUCTURE NOTICE (Non-CSE Branches) ── */}
      {!isCSE && (
        <div
          style={{
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.04)",
          }}
        >
          <div
            onClick={() => setIsBranchNoticeExpanded(!isBranchNoticeExpanded)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#d97706", fontWeight: 800, fontSize: 13.5 }}>
              <Info size={16} color="#d97706" />
              <span>Branch Syllabus Structure Notice</span>
            </div>
            <div style={{ color: "#d97706", display: "flex", alignItems: "center" }}>
              {isBranchNoticeExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          <AnimatePresence>
            {isBranchNoticeExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}
              >
                <p style={{ margin: 0, fontSize: 12.5, color: "#92400e", lineHeight: 1.55 }}>
                  Due to the unavailability of the complete syllabus structure for the <strong>{studentBranch || "selected"}</strong> branch, this tracker can currently only guarantee accurate degree progress tracking for 1st-year subjects. Tracking for subsequent years may be incomplete.
                </p>

                <p style={{ margin: 0, fontSize: 12.5, color: "#92400e", lineHeight: 1.55 }}>
                  You can still download the Credit Sheet PDF, but please note that only your 1st-year subjects will be auto-filled, while the rest will remain blank.
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 12,
                    marginTop: 4,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12.5, color: "#92400e", lineHeight: 1.55 }}>
                    If you have the official syllabus structure for your branch in the correct format, please contact the developer to get it integrated!
                  </p>

                  <a
                    href={`https://wa.me/919124540575?text=${encodeURIComponent(`Hello Developer, I have the official syllabus structure for the ${studentBranch || "Engineering"} branch to integrate into GradeFlow Degree Progress.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#25D366",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 12.5,
                      padding: "8px 16px",
                      borderRadius: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      textDecoration: "none",
                      boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <WhatsAppIcon size={16} color="#ffffff" />
                    <span>Contact via WhatsApp</span>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {/* Card 1: Main Degree Progress */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(15, 23, 42, 0.03)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: "#eff6ff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <svg width="76" height="76" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx="38" cy="38" r="33" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle
                cx="38"
                cy="38"
                r="33"
                fill="none"
                stroke="#2563eb"
                strokeWidth="6"
                strokeDasharray="207.3"
                strokeDashoffset={207.3 - (207.3 * Math.min(1, totalEarned / targetTotal))}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
              {completionPercentage}%
            </span>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
              Degree Completion
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
              {totalEarned} <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>/ {targetTotal} Credits</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: totalEarned >= targetTotal ? "#15803d" : "#2563eb",
                  background: totalEarned >= targetTotal ? "#dcfce7" : "#eff6ff",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {totalEarned >= targetTotal ? "Requirement Cleared" : `${targetTotal - totalEarned} Credits Remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: B.Tech Honours Progress */}
        <div
          style={{
            background: "#ffffff",
            border: isHonoursEligible ? "1px solid #fde68a" : "1px solid #cbd5e1",
            borderRadius: 16,
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(15, 23, 42, 0.03)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              background: isHonoursEligible ? "#fef3c7" : "#fffbeb",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Award size={30} color="#f59e0b" />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
              B.Tech Honours Track
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
              {honoursCredits} <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>/ {honoursTarget} Extra Cr</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isHonoursEligible ? "#15803d" : "#b45309",
                  background: isHonoursEligible ? "#dcfce7" : "#fef3c7",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {isHonoursEligible ? (
                  <>
                    <CheckCircle size={12} /> Honours Criteria Met
                  </>
                ) : (
                  `${honoursTarget - honoursCredits} Extra Domain Cr to Qualify`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Tracked Curriculum Summary */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(15, 23, 42, 0.03)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              background: "#f5f3ff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Layers size={30} color="#8b5cf6" />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
              Curriculum Breadth
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
              5 <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Active Baskets</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b21a8",
                  background: "#f3e8ff",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {totalSubjectsCount} Subjects Tracked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Baskets Section Header & Export Dropdown */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "4px 0",
        }}
      >
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>
            Curriculum Basket Tracking
          </h3>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
            Click any basket to view required subjects, completed courses, and pending credits
          </p>
        </div>

        {studentData && (
          <div style={{ position: "relative" }} ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={isGenerating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                fontSize: 13,
                fontWeight: 700,
                cursor: isGenerating ? "not-allowed" : "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <DownloadCloud size={16} color="#2563eb" />
              <span>
                {isGenerating ? `Generating ${generatingType.toUpperCase()}...` : "Export Credit Track Sheet"}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            <AnimatePresence>
              {showDownloadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                    overflow: "hidden",
                    zIndex: 100,
                    minWidth: 200,
                  }}
                >
                  <button
                    onClick={() => handleExport("pdf")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      background: "#ffffff",
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      color: "#0f172a",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <FileText size={16} color="#ef4444" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => handleExport("excel")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      background: "#ffffff",
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      color: "#0f172a",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <FileSpreadsheet size={16} color="#10b981" />
                    <span>Download Excel</span>
                  </button>

                  <button
                    onClick={() => handleExport("word")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      background: "#ffffff",
                      border: "none",
                      color: "#0f172a",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <FileText size={16} color="#2563eb" />
                    <span>Download Word</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Accordion Basket Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Object.entries(baskets)
          .filter(([key]) => key !== "EX")
          .map(([key, data], i) => {
            const progress = Math.min(100, (data.credits / data.target) * 100);
            const isComplete = data.credits >= data.target;
            const isExpanded = expandedBasket === key;

            return (
              <div
                key={key}
                style={{
                  background: "#ffffff",
                  border: isExpanded ? "1px solid #3b82f6" : "1px solid #cbd5e1",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: isExpanded
                    ? "0 4px 20px rgba(37, 99, 235, 0.08)"
                    : "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(15, 23, 42, 0.03)",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Basket Card Header */}
                <div
                  onClick={() => setExpandedBasket(isExpanded ? null : key)}
                  style={{
                    padding: isMobile ? "12px 14px" : "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    background: isExpanded ? "#f8fafc" : "#ffffff",
                    borderBottom: isExpanded ? "1px solid #cbd5e1" : "none",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: isMobile ? 36 : 44,
                        height: isMobile ? 36 : 44,
                        borderRadius: 10,
                        background: BASKET_BG_COLORS[key] || "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {React.cloneElement(BASKET_ICONS[key], { size: isMobile ? 18 : 22 })}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <h4
                          style={{
                            fontSize: isMobile ? 13.5 : 15,
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: 0,
                          }}
                        >
                          {key.startsWith("B") ? `Basket ${key.replace("B", "")}: ` : ""}
                          {BASKET_NAMES[key]}
                        </h4>
                        {isComplete && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: isMobile ? 9.5 : 11,
                              fontWeight: 700,
                              color: "#15803d",
                              background: "#dcfce7",
                              padding: "1px 6px",
                              borderRadius: 10,
                            }}
                          >
                            <CheckCircle size={isMobile ? 10 : 12} /> Done
                          </span>
                        )}
                      </div>

                      {/* Progress Bar & Label */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <div
                          style={{
                            width: isMobile ? 90 : 140,
                            height: 5,
                            background: "#e2e8f0",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${progress}%`,
                              height: "100%",
                              background: isComplete ? "#10b981" : "#2563eb",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: isComplete ? "#15803d" : "#2563eb", fontFamily: "'Space Mono', monospace" }}>
                          {data.credits}/{data.target} Cr
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: isMobile ? 26 : 30,
                      height: isMobile ? 26 : 30,
                      borderRadius: 8,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    {isExpanded ? <ChevronUp size={isMobile ? 14 : 16} /> : <ChevronDown size={isMobile ? 14 : 16} />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ background: "#ffffff" }}>
                    <style>
                      {`
                      @media (max-width: 640px) {
                        .basket-grid-header { display: none !important; }
                        .basket-subject-row {
                          grid-template-columns: 1fr !important;
                          gap: 8px;
                          padding: 14px !important;
                        }
                      }
                    `}
                    </style>
                    {renderBasketContents(key, data)}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
