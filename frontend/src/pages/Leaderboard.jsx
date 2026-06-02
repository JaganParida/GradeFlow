import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { Spinner } from "../components/LoadingSpinner";
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
        if (initTab === "cgpa") {
          f.sortBy = "cgpa";
          f.semester = "";
          f.branch = "";
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
      params.append("limit", "50");
      
      const { data } = await axios.get(`${API}/rankings/top?${params}`);
      setRankings(data);
    } catch {
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilter(key, val, nextShowCount = 10) {
    const f = { ...filters, [key]: val };
    setFilters(f);
    setShowCount(nextShowCount);
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
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "var(--secondary)", fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <Trophy size={14} /> University Rankings
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Leaderboard</h1>
        <p style={{ color: "var(--secondary)", marginTop: 4 }}>
          Top performing students ranked by {filters.sortBy.toUpperCase()}
        </p>
      </div>

      {/* Tabs */}
      <div className="leaderboard-tabs" style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button 
          className="leaderboard-tab"
          style={{ 
            padding: "8px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", 
            background: isSGPA ? 'rgba(62,166,255,0.1)' : 'transparent', 
            border: isSGPA ? '1px solid rgba(62,166,255,0.2)' : '1px solid var(--border)',
            color: isSGPA ? 'var(--accent)' : 'var(--secondary)',
            display: "flex", alignItems: "center", gap: 6
          }}
          onClick={() => {
            const f = { ...filters, sortBy: "sgpa" };
            setFilters(f);
            setShowCount(10);
            fetchRankings(f);
          }}
        >
          <Trophy size={16} /> SGPA Ranking
        </button>
        <button 
          className="leaderboard-tab"
          style={{ 
            padding: "8px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", 
            background: !isSGPA ? 'rgba(168,85,247,0.1)' : 'transparent', 
            border: !isSGPA ? '1px solid rgba(168,85,247,0.2)' : '1px solid var(--border)',
            color: !isSGPA ? '#a855f7' : 'var(--secondary)',
            display: "flex", alignItems: "center", gap: 6
          }}
          onClick={() => {
            const f = { ...filters, sortBy: "cgpa", semester: "" }; // Retain branch filter, only clear semester
            setFilters(f);
            setShowCount(10);
            fetchRankings(f);
          }}
        >
          <Star size={16} /> CGPA Ranking
        </button>
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
        
        {isSGPA && (
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
        <Spinner />
      ) : rankings.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          {filters.search ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Target size={48} color="var(--accent)" /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Not in the Top {showCount} Yet</h3>
              <p style={{ color: "var(--secondary)", fontSize: 15, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                Every expert was once a beginner. Keep pushing forward—consistent effort and dedication will get you there. You've got this! 🚀
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
            const processedRankings = rankings.map((r) => {
              const rankFromDB = !isSGPA ? r.cgpaRank : (r.sgpaRank || r.universityRank);
              return { ...r, displayRank: Number(rankFromDB) };
            })
              .filter((r) => Number.isFinite(r.displayRank) && r.displayRank >= 1 && r.displayRank <= 50)
              .sort((a, b) => {
                if (a.displayRank !== b.displayRank) return a.displayRank - b.displayRank;
                const aScore = isSGPA ? a.sgpa : a.cgpa;
                const bScore = isSGPA ? b.sgpa : b.cgpa;
                return (bScore || 0) - (aScore || 0);
              });
            const visibleRankings = processedRankings.filter((r) => r.displayRank <= showCount);
            const hasMoreRankings = processedRankings.some((r) => r.displayRank > 10);

            const colGroup = (
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "23%" }} />
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
                  <td
                    style={{
                      fontFamily: "Space Mono",
                      fontWeight: 800,
                      color: scoreColor,
                      background: "rgba(62,166,255,0.02)",
                      borderLeft: "1px solid rgba(62,166,255,0.1)",
                      borderRight: "1px solid rgba(62,166,255,0.1)",
                      whiteSpace: "nowrap"
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
                    <div className="leaderboard-mobile-rank" style={{ color: rankColor }}>
                      <span>#{r.displayRank}</span>
                      {medalColor && <Medal size={18} color={medalColor} />}
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
                          <td colSpan="5" style={{ textAlign: "center", padding: "60px 20px" }}>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><Target size={48} color="var(--accent)" /></div>
                              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Not in the Top {showCount} Yet</h3>
                              <p style={{ color: "var(--secondary)", fontSize: 15, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                                Every expert was once a beginner. Keep pushing forward—consistent effort and dedication will get you there. You've got this! 🚀
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
                      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Not in the Top {showCount} Yet</h3>
                      <p style={{ color: "var(--secondary)", fontSize: 15, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                        Every expert was once a beginner. Keep pushing forwardâ€”consistent effort and dedication will get you there. You've got this! ðŸš€
                      </p>
                    </motion.div>
                  ) : (
                    visibleRankings.map(renderMobileRankingCard)
                  )}
                </div>
                
                {hasMoreRankings && (
                  <div style={{ textAlign: "center", marginTop: 24 }}>
                    <button 
                      className="btn btn-ghost" 
                      aria-expanded={showCount === 50}
                      onClick={() => setShowCount((current) => current === 10 ? 50 : 10)}
                      style={{
                        border: "1px solid var(--border)",
                        padding: "10px 24px",
                        transition: "background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
                      }}
                    >
                      {showCount === 10 ? "Show up to Rank 50" : "Show Top 10 Only"}
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
