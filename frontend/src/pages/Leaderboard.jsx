import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { LeaderboardSkeleton } from "../components/LoadingSpinner";
import { motion } from "framer-motion";
import { Trophy, Search, Calendar, Medal, Star, Target } from "lucide-react";

export default function Leaderboard() {
  const { API } = useApp();
  const location = useLocation();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ semesters: [], branches: [] });
  const [showCount, setShowCount] = useState(10);
  const tableShellRef = useRef(null);
  const tableInnerRef = useRef(null);
  const previousTableHeightRef = useRef(0);
  const [tableHeight, setTableHeight] = useState("auto");
  const [highlightRegNo, setHighlightRegNo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    semester: "",
    branch: "",
    section: "",
    search: "",
    sortBy: "sgpa",
  });

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
        setMeta(r.data);
        let f = { ...filters };
        
        const initBranch = params.get("branch");
        if (initBranch) {
          f.branch = initBranch;
        }
        
        const initSection = params.get("section");
        if (initSection) {
          f.section = initSection;
        }

        if (initTab === "cgpa") {
          f.sortBy = "cgpa";
          f.semester = "";
        } else if (r.data.semesters?.length > 0) {
          f.semester = Math.max(...r.data.semesters).toString();
        }
        setFilters(f);
        fetchRankings(f);
      })
      .catch(() => {
        fetchRankings(filters);
      });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (highlightRegNo && rankings.length > 0) {
      setTimeout(() => {
        const isCompactLeaderboard = window.matchMedia("(max-width: 900px)").matches;
        const el = document.getElementById(`${isCompactLeaderboard ? "mobile-row" : "row"}-${highlightRegNo}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setHighlightRegNo(""), 4000);
        }
      }, 500);
    }
  }, [rankings, highlightRegNo]);

  useLayoutEffect(() => {
    const shell = tableShellRef.current;
    const inner = tableInnerRef.current;
    if (!shell || !inner || loading || rankings.length === 0) return undefined;

    if (window.matchMedia("(max-width: 900px)").matches) {
      setTableHeight("auto");
      return undefined;
    }

    const previousHeight = previousTableHeightRef.current;
    const nextHeight = inner.getBoundingClientRect().height;
    previousTableHeightRef.current = nextHeight;

    if (!previousHeight || Math.abs(previousHeight - nextHeight) < 1) {
      setTableHeight("auto");
      return undefined;
    }

    setTableHeight(previousHeight);
    const frame = window.requestAnimationFrame(() => {
      setTableHeight(nextHeight);
    });
    const timeout = window.setTimeout(() => {
      setTableHeight("auto");
    }, 540);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [
    showCount,
    rankings,
    loading,
    filters.sortBy,
    filters.search,
    filters.semester,
    filters.branch,
  ]);

  async function fetchRankings(f = filters) {
    if (f.sortBy === "sgpa" && !f.semester) {
      setRankings([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.semester) params.append("semester", f.semester);
      if (f.branch) params.append("branch", f.branch);
      if (f.search) params.append("search", f.search);
      if (f.sortBy) params.append("sortBy", f.sortBy);
      if (f.section && f.branch === "CSE") params.append("section", f.section);
      params.append("limit", f.section ? "200" : "50");
      
      const { data } = await axios.get(`${API}/rankings/top?${params}`);
      setRankings(data);
    } catch {
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }

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

  const getBadges = (r) => {
    const b = [];
    if (r.sgpa >= 9.0) b.push({ label: "Excellence", color: "#f59e0b" });
    if (r.cgpa >= 8.5) b.push({ label: "Consistent", color: "#3ea6ff" });
    return b;
  };

  const isSGPA = filters.sortBy === "sgpa";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page">
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 800, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: 6 }}>
          <Trophy size={12} /> University Rankings
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Leaderboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Top students ranked by {filters.sortBy.toUpperCase()}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: 24 }}>
        <div style={{ display: "inline-flex", gap: 3, background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: 16, border: "1px solid var(--border)", flexWrap: "nowrap", maxWidth: "100%" }}>
          <button
            className="leaderboard-tab"
            style={{
              padding: "8px 22px",
              borderRadius: 999,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.22s",
              background: isSGPA ? '#2a2a2a' : 'transparent',
              border: 'none',
              color: isSGPA ? '#f1f1f1' : 'var(--text-muted)',
              display: "flex", alignItems: "center", gap: 7,
              fontSize: 14,
              letterSpacing: "0.01em",
              boxShadow: isSGPA ? '0 1px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.06)' : 'none',
            }}
            onClick={() => {
              const f = { ...filters, sortBy: "sgpa" };
              setFilters(f);
              setShowCount(10);
              fetchRankings(f);
            }}
          >
            <Trophy size={15} /> SGPA Ranking
          </button>
          <button
            className="leaderboard-tab"
            style={{
              padding: "8px 22px",
              borderRadius: 999,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.22s",
              background: !isSGPA ? '#2a2a2a' : 'transparent',
              border: 'none',
              color: !isSGPA ? '#f1f1f1' : 'var(--text-muted)',
              display: "flex", alignItems: "center", gap: 7,
              fontSize: 14,
              letterSpacing: "0.01em",
              boxShadow: !isSGPA ? '0 1px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.06)' : 'none',
            }}
            onClick={() => {
              const f = { ...filters, sortBy: "cgpa", semester: "" };
              setFilters(f);
              setShowCount(10);
              fetchRankings(f);
            }}
          >
            <Star size={15} /> CGPA Ranking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="leaderboard-filters"
        style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}
      >
        {isSGPA && (
          <select
            className="leaderboard-filter-select"
            value={filters.semester}
            onChange={(e) => handleFilter("semester", e.target.value)}
            style={{ width: 150, flexShrink: 0 }}
          >
            <option value="" disabled>Select Semester</option>
            {meta.semesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        )}
        
        <select
          className="leaderboard-filter-select"
          value={filters.branch}
          onChange={(e) => handleFilter("branch", e.target.value)}
          style={{ width: 150, flexShrink: 0 }}
        >
          <option value="">All Branches</option>
          {meta.branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        
        {filters.branch === "CSE" && (
          <select
            className="leaderboard-filter-select"
            value={filters.section}
            onChange={(e) => handleFilter("section", e.target.value)}
            style={{ width: 150, flexShrink: 0 }}
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
            <option value="E">Section E</option>
            <option value="F">Section F</option>
            <option value="G">Section G</option>
            <option value="H">Section H</option>
            <option value="I">Section I</option>
            <option value="J">Section J</option>
          </select>
        )}

        <form 
          className="leaderboard-search-form"
          style={{ flex: 1, minWidth: 200, display: "flex", gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            handleFilter("search", searchInput, searchInput.trim() ? 50 : 10);
          }}
        >
          <div className="leaderboard-search-field" style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--secondary)", zIndex: 1, pointerEvents: "none" }} />
            <input
              placeholder="Search name or reg no..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (e.target.value.trim() === "") {
                  handleFilter("search", "");
                }
              }}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <button type="submit" className="btn btn-primary leaderboard-search-button" style={{ padding: "10px 20px", flexShrink: 0 }}>Search</button>
        </form>
      </div>

      {!filters.semester && isSGPA ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Calendar size={48} color="var(--secondary)" /></div>
          <p style={{ color: "var(--secondary)" }}>
            Please select a semester to view SGPA rankings.
          </p>
        </div>
      ) : loading ? (
        <LeaderboardSkeleton />
      ) : rankings.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          {filters.search ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Target size={48} color="var(--accent)" /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                {filters.section ? "Student Not Found in this Section" : `Not in the Top ${showCount} Yet`}
              </h3>
              <p style={{ color: "var(--secondary)", fontSize: 15, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                {filters.section 
                  ? "Please make sure you are searching within your correct section." 
                  : "Every expert was once a beginner. Keep pushing forward—consistent effort and dedication will get you there. You've got this! 🚀"}
              </p>
            </motion.div>
          ) : (
            <>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Trophy size={48} color="var(--secondary)" /></div>
              <p style={{ color: "var(--secondary)" }}>
                No rankings available. Admin needs to generate rankings first.
              </p>
            </>
          )}
        </div>
      ) : (
        <div>
          {(() => {
            const sortedRankings = [...rankings].sort((a, b) => {
              const aScore = isSGPA ? a.sgpa : a.cgpa;
              const bScore = isSGPA ? b.sgpa : b.cgpa;
              return (bScore || 0) - (aScore || 0);
            });

            let currentRank = 1;
            let previousScore = null;

            const processedRankings = sortedRankings.map((r, index, arr) => {
              let displayRank;
              
              if (filters.branch) {
                displayRank = r.dynamicRank;
              } else {
                const rankFromDB = !isSGPA ? r.cgpaRank : (r.sgpaRank || r.universityRank);
                displayRank = Number(rankFromDB);
              }
              
              return { ...r, displayRank };
            })
              .filter((r) => {
                if (filters.search) {
                  return r.displayRank <= (filters.section ? 200 : 50);
                }
                return Number.isFinite(r.displayRank) && r.displayRank >= 1 && r.displayRank <= (filters.section ? 200 : 50);
              });
            const visibleRankings = filters.search
              ? processedRankings.slice(0, showCount)
              : processedRankings.filter((r) => r.displayRank <= showCount);
            
            const totalStudents = processedRankings.length;
            const isSection = !!filters.section;
            
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

            const colGroup = (
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "18%" }} />
                {filters.branch && <col style={{ width: "10%" }} />}
                <col style={{ width: "15%" }} />
              </colgroup>
            );

            const renderRankingRow = (r) => {
              const isGold = r.displayRank === 1;
              const isSilver = r.displayRank === 2;
              const isBronze = r.displayRank === 3;
              let rankColor = "var(--text)";
              let nameColor = "var(--text)";
              let scoreColor = "var(--text)";
              let medalColor = null;

              if (isGold) { rankColor = "#facc15"; nameColor = "#fef08a"; scoreColor = "#eab308"; medalColor = "#facc15"; }
              else if (isSilver) { rankColor = "#a1a1aa"; nameColor = "#e4e4e7"; scoreColor = "#a1a1aa"; medalColor = "#a1a1aa"; }
              else if (isBronze) { rankColor = "#d97706"; nameColor = "#fed7aa"; scoreColor = "#c2670a"; medalColor = "#d97706"; }

              const isHighlighted = highlightRegNo === r.regNo;
              const isDeveloper = r.regNo === "230301120327";

              return (
                <tr
                  id={`row-${r.regNo}`}
                  key={`${r.regNo}-${r.displayRank}-${isSGPA ? "sgpa" : "cgpa"}`}
                  style={{
                    backgroundColor: isHighlighted ? "rgba(168,85,247,0.25)" : "transparent",
                    boxShadow: isHighlighted ? "inset 0 0 0 2px rgba(168,85,247,0.5)" : "none",
                    transition: "background-color 0.5s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 16, fontFamily: "Space Mono", fontWeight: 800, color: rankColor, width: 34, textAlign: "right", display: "inline-block" }}>
                        #{r.displayRank}
                      </span>
                      {medalColor && <Medal size={20} color={medalColor} />}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: nameColor, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                      <span style={{ whiteSpace: "nowrap" }}>{r.studentName}</span>
                      {isDeveloper && (
                        <span style={{
                          background: "rgba(168,85,247,0.15)",
                          color: "#a855f7",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 800,
                          border: "1px solid rgba(168,85,247,0.3)",
                          boxShadow: "0 0 8px rgba(168,85,247,0.2)",
                          whiteSpace: "nowrap"
                        }}>
                          DEVELOPER
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: "Space Mono",
                      fontSize: 12,
                      color: "var(--secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.regNo}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                      {getBadges(r).map((b, bi) => (
                        <span
                          key={bi}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: b.color + "20",
                            color: b.color,
                            padding: "2px 7px",
                            borderRadius: 10,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  {filters.branch && (
                    <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      <span style={{ 
                        backgroundColor: "rgba(255,255,255,0.05)", 
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: 13, 
                        color: "var(--text-secondary)", 
                        fontWeight: 600,
                        fontFamily: "Space Mono"
                      }}>
                        #{isSGPA ? r.sgpaRank : r.cgpaRank}
                      </span>
                    </td>
                  )}
                  <td
                    style={{
                      fontFamily: "Space Mono",
                      fontWeight: 800,
                      color: scoreColor,
                      background: "rgba(62,166,255,0.02)",
                      borderLeft: "1px solid rgba(62,166,255,0.1)",
                      borderRight: "1px solid rgba(62,166,255,0.1)",
                      whiteSpace: "nowrap",
                      textAlign: "right"
                    }}
                  >
                    {isSGPA ? r.sgpa?.toFixed(2) : r.cgpa?.toFixed(2)}
                  </td>
                </tr>
              );
            };

            const renderMobileRankingCard = (r) => {
              const isGold = r.displayRank === 1;
              const isSilver = r.displayRank === 2;
              const isBronze = r.displayRank === 3;
              let rankColor = "var(--text)";
              let nameColor = "var(--text)";
              let scoreColor = "var(--text)";
              let medalColor = null;

              if (isGold) { rankColor = "#facc15"; nameColor = "#fef08a"; scoreColor = "#eab308"; medalColor = "#facc15"; }
              else if (isSilver) { rankColor = "#a1a1aa"; nameColor = "#e4e4e7"; scoreColor = "#a1a1aa"; medalColor = "#a1a1aa"; }
              else if (isBronze) { rankColor = "#d97706"; nameColor = "#fed7aa"; scoreColor = "#c2670a"; medalColor = "#d97706"; }

              const isHighlighted = highlightRegNo === r.regNo;
              const isDeveloper = r.regNo === "230301120327";
              const badges = getBadges(r);

              return (
                <article
                  id={`mobile-row-${r.regNo}`}
                  key={`mobile-${r.regNo}-${r.displayRank}-${isSGPA ? "sgpa" : "cgpa"}`}
                  className="leaderboard-mobile-card"
                  style={{
                    backgroundColor: isHighlighted ? "rgba(168,85,247,0.18)" : undefined,
                    boxShadow: isHighlighted ? "inset 0 0 0 2px rgba(168,85,247,0.5)" : undefined,
                  }}
                >
                  <div className="leaderboard-mobile-top">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <div className="leaderboard-mobile-rank" style={{ color: rankColor }}>
                        <span>#{r.displayRank}</span>
                        {medalColor && <Medal size={18} color={medalColor} />}
                      </div>
                      {filters.branch && (
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, fontWeight: 600, fontFamily: "Space Mono" }}>
                          Global #{isSGPA ? r.sgpaRank : r.cgpaRank}
                        </div>
                      )}
                    </div>
                    <div className="leaderboard-mobile-score" style={{ color: scoreColor }}>
                      <span>{isSGPA ? "SGPA" : "CGPA"}</span>
                      <strong>{isSGPA ? r.sgpa?.toFixed(2) : r.cgpa?.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="leaderboard-mobile-student">
                    <div className="leaderboard-mobile-name" style={{ color: nameColor }}>
                      {r.studentName}
                    </div>
                    {isDeveloper && (
                      <span className="leaderboard-mobile-dev-badge">
                        DEVELOPER
                      </span>
                    )}
                  </div>

                  <div className="leaderboard-mobile-meta">
                    <span>Reg. No</span>
                    <strong>{r.regNo}</strong>
                  </div>

                  <div className="leaderboard-mobile-badges">
                    {badges.length > 0 ? (
                      badges.map((b, bi) => (
                        <span
                          key={bi}
                          style={{
                            background: b.color + "20",
                            color: b.color,
                          }}
                        >
                          {b.label}
                        </span>
                      ))
                    ) : (
                      <span className="leaderboard-mobile-empty-badge">No badge yet</span>
                    )}
                  </div>
                </article>
              );
            };

            return (
              <>
                <div
                  ref={tableShellRef}
                  className="table-wrap leaderboard-table-wrap"
                  style={{
                    marginBottom: 0,
                    height: tableHeight,
                    overflowX: "auto",
                    overflowY: "hidden",
                    transition: "height 0.48s cubic-bezier(0.16, 1, 0.3, 1)",
                    willChange: tableHeight === "auto" ? "auto" : "height",
                    contain: "layout paint",
                  }}
                >
                  <table ref={tableInnerRef} style={{ margin: 0, tableLayout: "auto", width: "100%", minWidth: 980 }}>
                    {colGroup}
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: "nowrap" }}>Rank</th>
                        <th style={{ whiteSpace: "nowrap" }}>Student</th>
                        <th style={{ whiteSpace: "nowrap" }}>Reg. No</th>
                        <th style={{ whiteSpace: "nowrap" }}>Badges</th>
                        {filters.branch && <th style={{ whiteSpace: "nowrap", textAlign: "center" }}>Global Rank</th>}
                        {isSGPA && (
                          <th style={{ borderBottom: "2px solid var(--accent)", color: "var(--accent)" }}>SGPA</th>
                        )}
                        {!isSGPA && (
                          <th style={{ borderBottom: "2px solid var(--accent)", color: "var(--accent)" }}>CGPA</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRankings.length === 0 && filters.search && (
                        <tr>
                          <td colSpan={filters.branch ? 6 : 5} style={{ textAlign: "center", padding: "60px 20px" }}>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Target size={48} color="var(--accent)" /></div>
                              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                                {filters.section ? "Student Not Found in this Section" : `Not in the Top ${showCount} Yet`}
                              </h3>
                              <p style={{ color: "var(--secondary)", fontSize: 15, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                                {filters.section 
                                  ? "Please make sure you are searching within your correct section." 
                                  : "Every expert was once a beginner. Keep pushing forward—consistent effort and dedication will get you there. You've got this! 🚀"}
                              </p>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                      {visibleRankings.map(renderRankingRow)}
                    </tbody>
                  </table>
                </div>

                <div className="leaderboard-mobile-list">
                  {visibleRankings.length === 0 && filters.search ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="leaderboard-mobile-empty">
                      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Target size={48} color="var(--accent)" /></div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                        {filters.section ? "Student Not Found in this Section" : `Not in the Top ${showCount} Yet`}
                      </h3>
                      <p style={{ color: "var(--secondary)", fontSize: 15, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                        {filters.section 
                          ? "Please make sure you are searching within your correct section." 
                          : "Every expert was once a beginner. Keep pushing forward—consistent effort and dedication will get you there. You've got this! 🚀"}
                      </p>
                    </motion.div>
                  ) : (
                    visibleRankings.map(renderMobileRankingCard)
                  )}
                </div>
                
                {buttonVisible && (
                  <div style={{ textAlign: "center", marginTop: 24 }}>
                    <button 
                      className="btn btn-ghost" 
                      aria-expanded={showCount > 10}
                      onClick={() => setShowCount(nextCount)}
                      style={{
                        border: "1px solid var(--border)",
                        padding: "10px 24px",
                        transition: "background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
                      }}
                    >
                      {buttonText}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </motion.div>
  );
}
