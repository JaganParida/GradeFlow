import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { LeaderboardSkeleton } from "../components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Search,
  Calendar,
  Medal,
  Star,
  Target,
  Award,
  ChevronRight,
  Filter,
  CheckCircle,
  Sparkles,
  Layers,
  GraduationCap,
  X,
  RotateCcw,
} from "lucide-react";

export default function Leaderboard() {
  const { API } = useApp();
  const location = useLocation();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ semesters: [], branches: [], batches: [] });
  const [showCount, setShowCount] = useState(10);
  const [highlightRegNo, setHighlightRegNo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  const [filters, setFilters] = useState({
    semester: "6",
    branch: "",
    section: "",
    batch: "",
    search: "",
    sortBy: "sgpa",
  });

  const isSGPA = filters.sortBy === "sgpa";

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initial Load & Meta
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hl = params.get("highlight");
    const initTab = params.get("tab");

    if (hl) {
      setHighlightRegNo(hl);
      setShowCount(50);
    }

    axios
      .get(`${API}/rankings/meta`)
      .then((r) => {
        const metaData = r.data || { semesters: [], branches: [], batches: [] };
        setMeta(metaData);

        let f = { ...filters };

        const initBranch = params.get("branch");
        if (initBranch) f.branch = initBranch;

        const initSection = params.get("section");
        if (initSection) f.section = initSection;

        const defaultSem =
          metaData.semesters?.length > 0
            ? Math.max(...metaData.semesters).toString()
            : "6";

        if (initTab === "cgpa") {
          f.sortBy = "cgpa";
          f.semester = "";
        } else {
          f.sortBy = "sgpa";
          f.semester = defaultSem;
        }

        setFilters(f);
        fetchRankings(f, metaData);
      })
      .catch(() => {
        fetchRankings(filters);
      });
    // eslint-disable-next-line
  }, []);

  // Highlight scroll
  useEffect(() => {
    if (highlightRegNo && rankings.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(
          `${isMobile ? "mobile-card" : "row"}-${highlightRegNo}`
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setHighlightRegNo(""), 4000);
        }
      }, 400);
    }
  }, [rankings, highlightRegNo, isMobile]);

  const leaderboardCacheRef = useRef(new Map());

  async function fetchRankings(f = filters, metaData = meta) {
    let targetFilter = { ...f };

    // Auto-set default semester if in SGPA mode and empty
    if (targetFilter.sortBy === "sgpa" && !targetFilter.semester) {
      const defaultSem =
        metaData.semesters?.length > 0
          ? Math.max(...metaData.semesters).toString()
          : "6";
      targetFilter.semester = defaultSem;
    }

    const cacheKey = JSON.stringify(targetFilter);
    if (leaderboardCacheRef.current.has(cacheKey)) {
      setRankings(leaderboardCacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (targetFilter.semester && targetFilter.sortBy === "sgpa") {
        params.append("semester", targetFilter.semester);
      }
      if (targetFilter.branch) params.append("branch", targetFilter.branch);
      if (targetFilter.batch) params.append("batch", targetFilter.batch);
      if (targetFilter.search) params.append("search", targetFilter.search);
      if (targetFilter.sortBy) params.append("sortBy", targetFilter.sortBy);
      if (targetFilter.section && targetFilter.branch === "CSE") {
        params.append("section", targetFilter.section);
      }
      params.append("limit", targetFilter.section ? "200" : "50");

      const { data } = await axios.get(`${API}/rankings/top?${params}`);
      leaderboardCacheRef.current.set(cacheKey, data);
      setRankings(data || []);
    } catch {
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }

  // Tab switcher with automatic default assignment
  const handleTabSwitch = (newSortBy) => {
    let f = { ...filters, sortBy: newSortBy };
    if (newSortBy === "sgpa") {
      const defaultSem =
        meta.semesters?.length > 0
          ? Math.max(...meta.semesters).toString()
          : filters.semester || "6";
      f.semester = defaultSem;
    } else {
      f.semester = "";
    }
    setFilters(f);
    setShowCount(10);
    fetchRankings(f);
  };

  function handleFilter(key, val, nextShowCount = null) {
    const f = { ...filters, [key]: val };
    if (key === "branch" && val !== "CSE") f.section = "";

    let count = 10;
    if (nextShowCount !== null) {
      count = nextShowCount;
    } else if (key === "search" && val.trim() !== "") {
      count = 50;
    }

    setFilters(f);
    setShowCount(count);
    fetchRankings(f);
  }

  const handleResetFilters = () => {
    const defaultSem =
      meta.semesters?.length > 0 ? Math.max(...meta.semesters).toString() : "6";
    const f = {
      semester: isSGPA ? defaultSem : "",
      branch: "",
      section: "",
      batch: "",
      search: "",
      sortBy: filters.sortBy,
    };
    setSearchInput("");
    setFilters(f);
    setShowCount(10);
    fetchRankings(f);
  };

  const getBadges = (r) => {
    const b = [];
    if (r.sgpa >= 9.0)
      b.push({ label: "Excellence", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" });
    if (r.cgpa >= 8.5)
      b.push({ label: "Consistent", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" });
    return b;
  };

  // Processed and sorted rankings
  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => {
      const aScore = isSGPA ? a.sgpa : a.cgpa;
      const bScore = isSGPA ? b.sgpa : b.cgpa;
      return (bScore || 0) - (aScore || 0);
    });
  }, [rankings, isSGPA]);

  const processedRankings = useMemo(() => {
    return sortedRankings
      .map((r) => {
        let displayRank;
        if (filters.branch) {
          displayRank = r.dynamicRank;
        } else {
          const rankFromDB = !isSGPA ? r.cgpaRank : r.sgpaRank || r.universityRank;
          displayRank = Number(rankFromDB);
        }
        return { ...r, displayRank };
      })
      .filter((r) => {
        if (filters.search) {
          return r.displayRank <= (filters.section ? 200 : 50);
        }
        return (
          Number.isFinite(r.displayRank) &&
          r.displayRank >= 1 &&
          r.displayRank <= (filters.section ? 200 : 50)
        );
      });
  }, [sortedRankings, filters.branch, filters.section, filters.search, isSGPA]);

  const visibleRankings = filters.search
    ? processedRankings.slice(0, showCount)
    : processedRankings.filter((r) => r.displayRank <= showCount);

  const totalStudents = processedRankings.length;
  const isSection = Boolean(filters.section);

  let buttonVisible = false;
  let buttonText = "";
  let nextCount = 10;

  if (isSection) {
    buttonVisible = totalStudents > 10;
    if (showCount <= 10) {
      const remaining = totalStudents - visibleRankings.length;
      buttonText = remaining > 0 ? `Show remaining ${remaining} students` : "Show all students";
      nextCount = 200;
    } else {
      buttonText = "Show Top 10 Only";
      nextCount = 10;
    }
  } else {
    buttonVisible = processedRankings.some((r) => r.displayRank > 10);
    if (showCount <= 10) {
      buttonText = "Show up to Rank 50";
      nextCount = 50;
    } else {
      buttonText = "Show Top 10 Only";
      nextCount = 10;
    }
  }

  // Top 3 Podium
  const top3 = !filters.search && processedRankings.length >= 3 ? processedRankings.slice(0, 3) : [];

  const isFiltersActive = Boolean(
    filters.branch ||
      filters.section ||
      filters.batch ||
      filters.search ||
      (isSGPA &&
        filters.semester !==
          (meta.semesters?.length > 0 ? Math.max(...meta.semesters).toString() : "6"))
  );

  // Determine active dropdown count for seamless mobile grid
  const activeFilterCount = (isSGPA ? 1 : 0) + 1 + (filters.branch === "CSE" ? 1 : 0) + (meta.batches?.length > 0 ? 1 : 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: isMobile ? "16px 12px 60px 12px" : "24px 20px 60px 20px",
        fontFamily: "'DM Sans', sans-serif",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 12 : 18,
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* 1. Header & Filters Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: isMobile ? "16px 14px" : "20px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(15,23,42,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Top Row: Title + SGPA/CGPA Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "center",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trophy size={18} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: isMobile ? 17 : 20,
                    fontWeight: 900,
                    color: "#0f172a",
                    margin: "0 0 1px 0",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Leaderboard & Rankings
                </h1>
                <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
                  Sorted by <strong>{isSGPA ? "Semester SGPA" : "Cumulative CGPA"}</strong>
                </p>
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 3,
                display: "flex",
                gap: 4,
                width: isMobile ? "100%" : "auto",
                boxSizing: "border-box",
              }}
            >
              <button
                disabled={loading}
                onClick={() => handleTabSwitch("sgpa")}
                style={{
                  flex: isMobile ? 1 : "initial",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: isMobile ? "8px 10px" : "6px 14px",
                  borderRadius: 7,
                  border: isSGPA ? "1px solid #cbd5e1" : "1px solid transparent",
                  background: isSGPA ? "#ffffff" : "transparent",
                  color: isSGPA ? "#0f172a" : "#64748b",
                  fontSize: 12.5,
                  fontWeight: isSGPA ? 800 : 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.65 : 1,
                  boxShadow: isSGPA ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Trophy size={13} color={isSGPA ? "#2563eb" : "#64748b"} /> SGPA Ranking
              </button>

              <button
                disabled={loading}
                onClick={() => handleTabSwitch("cgpa")}
                style={{
                  flex: isMobile ? 1 : "initial",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: isMobile ? "8px 10px" : "6px 14px",
                  borderRadius: 7,
                  border: !isSGPA ? "1px solid #cbd5e1" : "1px solid transparent",
                  background: !isSGPA ? "#ffffff" : "transparent",
                  color: !isSGPA ? "#0f172a" : "#64748b",
                  fontSize: 12.5,
                  fontWeight: !isSGPA ? 800 : 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.65 : 1,
                  boxShadow: !isSGPA ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Star size={13} color={!isSGPA ? "#8b5cf6" : "#64748b"} /> Cumulative CGPA
              </button>
            </div>
          </div>

          {/* Filter Controls: Perfectly Balanced Grid Without Empty Gaps */}
          <div
            style={{
              display: isMobile ? "grid" : "flex",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "none",
              alignItems: "center",
              gap: 8,
              borderTop: "1px solid #f1f5f9",
              paddingTop: 12,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Semester Select (SGPA only) */}
            {isSGPA && (
              <div style={{ width: "100%", boxSizing: "border-box" }}>
                <select
                  disabled={loading}
                  value={filters.semester}
                  onChange={(e) => handleFilter("semester", e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 28px 0 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: loading ? "#f8fafc" : "#ffffff",
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.65 : 1,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                >
                  {meta.semesters.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Branch Select */}
            <div style={{ width: "100%", boxSizing: "border-box" }}>
              <select
                disabled={loading}
                value={filters.branch}
                onChange={(e) => handleFilter("branch", e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 28px 0 10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: loading ? "#f8fafc" : "#ffffff",
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.65 : 1,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.15s ease",
                }}
              >
                <option value="">All Branches</option>
                {meta.branches.map((b) => (
                  <option key={b} value={b}>
                    Branch {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Select (CSE Only) */}
            {filters.branch === "CSE" && (
              <div style={{ width: "100%", boxSizing: "border-box" }}>
                <select
                  disabled={loading}
                  value={filters.section}
                  onChange={(e) => handleFilter("section", e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 28px 0 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: loading ? "#f8fafc" : "#ffffff",
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.65 : 1,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                >
                  <option value="">All Sections</option>
                  {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Batch Select (Spans 2 columns if odd item to prevent empty gaps) */}
            {meta.batches && meta.batches.length > 0 && (
              <div
                style={{
                  width: "100%",
                  gridColumn: isMobile && activeFilterCount % 2 === 1 ? "1 / -1" : "auto",
                  boxSizing: "border-box",
                }}
              >
                <select
                  disabled={loading}
                  value={filters.batch}
                  onChange={(e) => handleFilter("batch", e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 28px 0 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: loading ? "#f8fafc" : "#ffffff",
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.65 : 1,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                >
                  <option value="">All Batches</option>
                  {meta.batches.map((b) => (
                    <option key={b} value={b}>
                      Batch {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (loading) return;
                handleFilter("search", searchInput, searchInput.trim() ? 50 : 10);
              }}
              style={{
                gridColumn: isMobile ? "1 / -1" : "auto",
                flex: isMobile ? "none" : "1 1 200px",
                display: "flex",
                gap: 6,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={14}
                  color="#64748b"
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  disabled={loading}
                  placeholder="Search name or reg no..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (e.target.value.trim() === "") {
                      handleFilter("search", "");
                    }
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    height: 38,
                    padding: "0 10px 0 32px",
                    background: loading ? "#f8fafc" : "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#0f172a",
                    outline: "none",
                    cursor: loading ? "not-allowed" : "text",
                    opacity: loading ? 0.65 : 1,
                    transition: "all 0.15s ease",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.65 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                Search
              </button>

              {isFiltersActive && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResetFilters}
                  style={{
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.65 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                  title="Reset all filters"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* 2. Top 3 Podium Cards */}
        {!loading && top3.length === 3 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 10,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Rank 1 (Gold - On top on mobile, center/right on desktop) */}
            <div
              style={{
                order: isMobile ? 1 : 2,
                background: "#fffbeb",
                border: "2px solid #fde68a",
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "#fef3c7",
                    border: "2px solid #fde68a",
                    color: "#b45309",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    lineHeight: 1.1,
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={13} color="#b45309" style={{ marginBottom: 1 }} />
                  <span>#1</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 900,
                      color: "#92400e",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {top3[0].studentName}
                  </div>
                  <div style={{ fontSize: 12, color: "#b45309", fontFamily: "'Space Mono', monospace", fontWeight: 700, marginTop: 2 }}>
                    {top3[0].regNo}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 9.5, color: "#b45309", fontWeight: 800, textTransform: "uppercase" }}>
                  {isSGPA ? "SGPA" : "CGPA"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#b45309", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                  {(isSGPA ? top3[0].sgpa : top3[0].cgpa)?.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Rank 2 (Silver) */}
            <div
              style={{
                order: isMobile ? 2 : 1,
                background: "#ffffff",
                border: "1.5px solid #cbd5e1",
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "#f1f5f9",
                    border: "1.5px solid #cbd5e1",
                    color: "#475569",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    lineHeight: 1.1,
                    flexShrink: 0,
                  }}
                >
                  <Medal size={13} color="#475569" style={{ marginBottom: 1 }} />
                  <span>#2</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#0f172a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {top3[1].studentName}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'Space Mono', monospace", fontWeight: 700, marginTop: 2 }}>
                    {top3[1].regNo}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 9.5, color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                  {isSGPA ? "SGPA" : "CGPA"}
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: "#0f172a", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                  {(isSGPA ? top3[1].sgpa : top3[1].cgpa)?.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div
              style={{
                order: isMobile ? 3 : 3,
                background: "#ffffff",
                border: "1.5px solid #fed7aa",
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "#ffedd5",
                    border: "1.5px solid #fed7aa",
                    color: "#c2410c",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    lineHeight: 1.1,
                    flexShrink: 0,
                  }}
                >
                  <Medal size={13} color="#c2410c" style={{ marginBottom: 1 }} />
                  <span>#3</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#0f172a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {top3[2].studentName}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'Space Mono', monospace", fontWeight: 700, marginTop: 2 }}>
                    {top3[2].regNo}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 9.5, color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                  {isSGPA ? "SGPA" : "CGPA"}
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: "#c2410c", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                  {(isSGPA ? top3[2].sgpa : top3[2].cgpa)?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Leaderboard: Mobile Card List or Desktop Table */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : processedRankings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #cbd5e1",
            }}
          >
            <Target size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              {filters.search ? "No matching student records found" : "No ranking records available"}
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
              {filters.search
                ? "Try searching with a different registration number or student name."
                : "No data found for the selected semester and branch combination."}
            </p>
          </div>
        ) : isMobile ? (
          /* Mobile Card List View (ZERO Horizontal Scroll & Beautiful Spacing) */
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            {visibleRankings.map((r) => {
              const isGold = r.displayRank === 1;
              const isSilver = r.displayRank === 2;
              const isBronze = r.displayRank === 3;
              const isHighlighted = highlightRegNo === r.regNo;
              const isDeveloper = r.regNo === "230301120327";
              const badges = getBadges(r);

              return (
                <div
                  id={`mobile-card-${r.regNo}`}
                  key={`mobile-${r.regNo}-${r.displayRank}`}
                  style={{
                    background: isHighlighted ? "#eff6ff" : "#ffffff",
                    border: isHighlighted
                      ? "1.5px solid #2563eb"
                      : isGold
                      ? "1.5px solid #fde68a"
                      : isSilver
                      ? "1.5px solid #cbd5e1"
                      : isBronze
                      ? "1.5px solid #fed7aa"
                      : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    transition: "all 0.15s ease",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                >
                  {/* Top Row: Rank Badge + Name + Score */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span
                        style={{
                          minWidth: 32,
                          height: 30,
                          padding: "0 6px",
                          borderRadius: 7,
                          background: isGold
                            ? "#fef3c7"
                            : isSilver
                            ? "#f1f5f9"
                            : isBronze
                            ? "#ffedd5"
                            : "#f8fafc",
                          border: isGold
                            ? "1px solid #fde68a"
                            : isSilver
                            ? "1px solid #cbd5e1"
                            : isBronze
                            ? "1px solid #fed7aa"
                            : "1px solid #e2e8f0",
                          color: isGold
                            ? "#b45309"
                            : isSilver
                            ? "#475569"
                            : isBronze
                            ? "#c2410c"
                            : "#0f172a",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 12.5,
                          fontFamily: "'Space Mono', monospace",
                          flexShrink: 0,
                        }}
                      >
                        #{r.displayRank}
                      </span>
                      <div
                        style={{
                          fontSize: 14.5,
                          fontWeight: 800,
                          color: "#0f172a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.studentName}
                      </div>
                      {isDeveloper && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            background: "#f3e8ff",
                            color: "#7e22ce",
                            border: "1px solid #e9d5ff",
                            padding: "1px 5px",
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        >
                          DEV
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 13.5,
                        fontWeight: 900,
                        color: isSGPA
                          ? r.sgpa >= 9.0
                            ? "#15803d"
                            : "#2563eb"
                          : r.cgpa >= 9.0
                          ? "#15803d"
                          : "#8b5cf6",
                        background: isSGPA
                          ? r.sgpa >= 9.0
                            ? "#dcfce7"
                            : "#eff6ff"
                          : r.cgpa >= 9.0
                          ? "#dcfce7"
                          : "#f3e8ff",
                        border: isSGPA
                          ? `1px solid ${r.sgpa >= 9.0 ? "#bbf7d0" : "#bfdbfe"}`
                          : `1px solid ${r.cgpa >= 9.0 ? "#bbf7d0" : "#e9d5ff"}`,
                        padding: "3px 9px",
                        borderRadius: 7,
                        fontFamily: "'Space Mono', monospace",
                        flexShrink: 0,
                      }}
                    >
                      {(isSGPA ? r.sgpa : r.cgpa)?.toFixed(2)}
                    </span>
                  </div>

                  {/* Bottom Row: Reg No + Badges + Global Rank */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 6,
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#475569" }}>
                        {r.regNo}
                      </span>
                      {filters.branch && (
                        <span
                          style={{
                            background: "#f1f5f9",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: "'Space Mono', monospace",
                            fontWeight: 700,
                          }}
                        >
                          Global #{isSGPA ? r.sgpaRank : r.cgpaRank}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {badges.map((b, bi) => (
                        <span
                          key={bi}
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: b.color,
                            background: b.bg,
                            border: `1px solid ${b.border}`,
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination / Expand Toolbar */}
            {buttonVisible && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button
                  onClick={() => setShowCount(nextCount)}
                  style={{
                    width: "100%",
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  {buttonText}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(15,23,42,0.03)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #cbd5e1" }}>
                    <th
                      style={{
                        padding: "12px 16px",
                        width: "10%",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Rank
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        width: "36%",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Student Name
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        width: "20%",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Registration No
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        width: "18%",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Badges
                    </th>
                    {filters.branch && (
                      <th
                        style={{
                          padding: "12px 16px",
                          width: "16%",
                          textAlign: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Global Rank
                      </th>
                    )}
                    <th
                      style={{
                        padding: "12px 18px",
                        textAlign: "right",
                        width: "16%",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#2563eb",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {isSGPA ? "SGPA Score" : "CGPA Score"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRankings.map((r, idx) => {
                    const isGold = r.displayRank === 1;
                    const isSilver = r.displayRank === 2;
                    const isBronze = r.displayRank === 3;
                    const isHighlighted = highlightRegNo === r.regNo;
                    const isDeveloper = r.regNo === "230301120327";
                    const badges = getBadges(r);

                    let rankBadge = (
                      <span
                        style={{
                          minWidth: 32,
                          height: 30,
                          padding: "0 6px",
                          borderRadius: 7,
                          background: isGold
                            ? "#fef3c7"
                            : isSilver
                            ? "#f1f5f9"
                            : isBronze
                            ? "#ffedd5"
                            : "#f8fafc",
                          border: isGold
                            ? "1px solid #fde68a"
                            : isSilver
                            ? "1px solid #cbd5e1"
                            : isBronze
                            ? "1px solid #fed7aa"
                            : "1px solid #e2e8f0",
                          color: isGold
                            ? "#b45309"
                            : isSilver
                            ? "#475569"
                            : isBronze
                            ? "#c2410c"
                            : "#0f172a",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 12.5,
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        #{r.displayRank}
                      </span>
                    );

                    return (
                      <tr
                        id={`row-${r.regNo}`}
                        key={`${r.regNo}-${r.displayRank}`}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isHighlighted
                            ? "#eff6ff"
                            : idx % 2 === 0
                            ? "#ffffff"
                            : "#fcfdfe",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>{rankBadge}</td>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 13.5 }}>
                              {r.studentName}
                            </span>
                            {isDeveloper && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  background: "#f3e8ff",
                                  color: "#7e22ce",
                                  border: "1px solid #e9d5ff",
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                DEV
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            verticalAlign: "middle",
                            fontFamily: "'Space Mono', monospace",
                            color: "#475569",
                            fontSize: 12.5,
                            fontWeight: 600,
                          }}
                        >
                          {r.regNo}
                        </td>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {badges.map((b, bi) => (
                              <span
                                key={bi}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: b.color,
                                  background: b.bg,
                                  border: `1px solid ${b.border}`,
                                  padding: "2px 7px",
                                  borderRadius: 6,
                                }}
                              >
                                {b.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        {filters.branch && (
                          <td style={{ padding: "12px 16px", textAlign: "center", verticalAlign: "middle" }}>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#64748b",
                                fontFamily: "'Space Mono', monospace",
                                background: "#f1f5f9",
                                padding: "2px 8px",
                                borderRadius: 6,
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              #{isSGPA ? r.sgpaRank : r.cgpaRank}
                            </span>
                          </td>
                        )}
                        <td style={{ padding: "12px 18px", textAlign: "right", verticalAlign: "middle" }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 13.5,
                              fontWeight: 900,
                              color: isSGPA
                                ? r.sgpa >= 9.0
                                  ? "#15803d"
                                  : "#2563eb"
                                : r.cgpa >= 9.0
                                ? "#15803d"
                                : "#8b5cf6",
                              background: isSGPA
                                ? r.sgpa >= 9.0
                                  ? "#dcfce7"
                                  : "#eff6ff"
                                : r.cgpa >= 9.0
                                ? "#dcfce7"
                                : "#f3e8ff",
                              border: isSGPA
                                ? `1px solid ${r.sgpa >= 9.0 ? "#bbf7d0" : "#bfdbfe"}`
                                : `1px solid ${r.cgpa >= 9.0 ? "#bbf7d0" : "#e9d5ff"}`,
                              padding: "2px 9px",
                              borderRadius: 7,
                              fontFamily: "'Space Mono', monospace",
                            }}
                          >
                            {(isSGPA ? r.sgpa : r.cgpa)?.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination / Expand Toolbar */}
            {buttonVisible && (
              <div
                style={{
                  textAlign: "center",
                  padding: "14px 20px",
                  borderTop: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <button
                  onClick={() => setShowCount(nextCount)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {buttonText}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
