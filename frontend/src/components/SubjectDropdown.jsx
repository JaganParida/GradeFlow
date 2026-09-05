import React, { useState, useRef, useEffect, useMemo } from "react";
import { BookOpen, ChevronDown, Check, Search, X, Sparkles } from "lucide-react";
import { resolveSubjectCode } from "../utils/timetableHelper";

// Helper to normalize and compare subject names
function matchesSubject(catItem, savedItem) {
  if (!catItem || !savedItem) return false;
  const nameA = (catItem.subjectName || catItem.name || "").trim().toLowerCase();
  const nameB = (savedItem.subject || savedItem.subjectName || savedItem.name || "").trim().toLowerCase();
  if (nameA && nameB && nameA === nameB) return true;

  const codeA = (catItem.code || catItem.subCode || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const codeB = (savedItem.code || savedItem.subCode || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (codeA && codeB && codeA === codeB) return true;

  // Partial or clean match
  const cleanA = nameA.replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
  const cleanB = nameB.replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
  if (cleanA && cleanB && (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA))) {
    return true;
  }
  return false;
}

export default function SubjectDropdown({
  catalog = [],
  selectedSubjectName = "",
  onSelectSubject = () => {},
  savedSubjects = [],
  studentData = null,
  targetGoal = 75,
  isMobile = false,
  placeholder = "Select Subject...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Active catalog item
  const activeItem = useMemo(() => {
    return catalog.find((s) => s.subjectName === selectedSubjectName) || catalog[0] || null;
  }, [catalog, selectedSubjectName]);

  // Calculate subject attendance details
  const getSubjectAttendance = useMemo(() => {
    return (catItem) => {
      const saved = savedSubjects.find((s) => matchesSubject(catItem, s));
      let attended = 0;
      let delivered = 0;
      if (saved && Array.isArray(saved.components)) {
        saved.components.forEach((c) => {
          attended += Number(c.attended) || 0;
          delivered += Number(c.delivered) || 0;
        });
      }
      const pct = delivered > 0 ? (attended / delivered) * 100 : 0;
      const code = catItem?.code || saved?.code || resolveSubjectCode({ subject: catItem?.subjectName }, studentData) || "";
      const isSafe = delivered > 0 && pct >= targetGoal;
      const hasData = delivered > 0;
      return { attended, delivered, pct, code, isSafe, hasData };
    };
  }, [savedSubjects, studentData, targetGoal]);

  const activeStats = useMemo(() => {
    if (!activeItem) return null;
    return getSubjectAttendance(activeItem);
  }, [activeItem, getSubjectAttendance]);

  // Filtered catalog list
  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalog;
    const term = searchTerm.toLowerCase();
    return catalog.filter((item) => {
      const name = (item.subjectName || "").toLowerCase();
      const code = (item.code || resolveSubjectCode({ subject: item.subjectName }, studentData) || "").toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [catalog, searchTerm, studentData]);

  const handleSelect = (item) => {
    onSelectSubject(item);
    setIsOpen(false);
  };

  if (!catalog || catalog.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        zIndex: isOpen ? 50 : 1,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Click to switch active subject from your routine"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: "100%",
          background: isOpen ? "#f0fdf4" : "#f8fafc",
          border: isOpen ? "1.5px solid #059669" : "1.5px solid #e2e8f0",
          borderRadius: 14,
          padding: isMobile ? "10px 12px" : "12px 16px",
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 10 : 16,
          flexDirection: isMobile ? "column" : "row",
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(5, 150, 105, 0.12), 0 2px 8px rgba(0,0,0,0.04)"
            : "0 1px 2px rgba(0,0,0,0.02)",
          transition: "all 0.15s ease",
          textAlign: "left",
          outline: "none",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.background = "#ffffff";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.background = "#f8fafc";
          }
        }}
      >
        {/* Left: Icon & Subject Details (Full Subject Name Always Visible) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1, width: isMobile ? "100%" : "auto" }}>
          <div
            style={{
              width: isMobile ? 32 : 36,
              height: isMobile ? 32 : 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 5px rgba(5, 150, 105, 0.2)",
            }}
          >
            <BookOpen size={isMobile ? 15 : 18} />
          </div>

          <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Active Routine Subject
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: isMobile ? 13.5 : 15,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.35,
                  wordBreak: "break-word",
                }}
              >
                {activeItem ? activeItem.subjectName : placeholder}
              </span>
              {activeStats?.code && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    padding: "1px 6px",
                    borderRadius: 5,
                    flexShrink: 0,
                  }}
                >
                  {activeStats.code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Badges & Switch Action */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 8,
            flexWrap: "wrap",
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "space-between" : "flex-end",
            paddingTop: isMobile ? 6 : 0,
            borderTop: isMobile ? "1px dashed #e2e8f0" : "none",
          }}
        >
          {activeStats && activeStats.hasData && (
            <span
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 800,
                padding: isMobile ? "3px 8px" : "4px 10px",
                borderRadius: 7,
                background: activeStats.isSafe ? "#ecfdf5" : "#fff1f2",
                color: activeStats.isSafe ? "#065f46" : "#e11d48",
                border: `1px solid ${activeStats.isSafe ? "#a7f3d0" : "#fecdd3"}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              {activeStats.pct.toFixed(1)}%
              <span style={{ fontSize: 9.5, opacity: 0.85, fontWeight: 700 }}>
                {activeStats.isSafe ? "SAFE" : "RISK"}
              </span>
            </span>
          )}

          {activeItem && activeItem.classesPerWeek > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                padding: isMobile ? "3px 7px" : "4px 9px",
                borderRadius: 7,
                whiteSpace: "nowrap",
              }}
            >
              {activeItem.classesPerWeek} classes / wk
            </span>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: isMobile ? "4px 9px" : "5px 12px",
              borderRadius: 8,
              fontSize: isMobile ? 11.5 : 12,
              fontWeight: 800,
              color: "#334155",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              flexShrink: 0,
            }}
          >
            <span>Change</span>
            <ChevronDown
              size={14}
              style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </div>
        </div>
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            width: "100%",
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: 14,
            boxShadow: "0 12px 30px -4px rgba(15, 23, 42, 0.16), 0 4px 10px rgba(0, 0, 0, 0.05)",
            padding: "8px",
            zIndex: 100,
            maxHeight: 340,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Quick Search Bar (if 3 or more subjects) */}
          {catalog.length >= 3 && (
            <div
              style={{
                position: "relative",
                marginBottom: 6,
                padding: "2px 2px",
              }}
            >
              <Search
                size={14}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search subject by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 28px 7px 30px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#f8fafc",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    padding: 2,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Subjects List */}
          <div
            style={{
              overflowY: "auto",
              maxHeight: 270,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              paddingRight: 2,
            }}
          >
            {filteredCatalog.length === 0 ? (
              <div
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontSize: 12.5,
                  color: "#94a3b8",
                  fontWeight: 600,
                }}
              >
                No subjects matching "{searchTerm}"
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const isSelected = activeItem && activeItem.subjectName === item.subjectName;
                const stats = getSubjectAttendance(item);

                return (
                  <button
                    key={item.subjectName}
                    type="button"
                    onClick={() => handleSelect(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: isMobile ? "8px 10px" : "9px 12px",
                      borderRadius: 9,
                      border: isSelected ? "1.5px solid #a7f3d0" : "1px solid transparent",
                      background: isSelected ? "#f0fdf4" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s ease",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Left: Checkmark & Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: isSelected ? "none" : "1.5px solid #cbd5e1",
                          background: isSelected ? "#059669" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: isMobile ? 12.5 : 13.5,
                              fontWeight: isSelected ? 800 : 700,
                              color: isSelected ? "#065f46" : "#1e293b",
                              wordBreak: "break-word",
                              lineHeight: 1.35,
                            }}
                          >
                            {item.subjectName}
                          </span>
                          {stats.code && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: isSelected ? "#dcfce7" : "#eff6ff",
                                color: isSelected ? "#15803d" : "#2563eb",
                                border: `1px solid ${isSelected ? "#bbf7d0" : "#bfdbfe"}`,
                                padding: "1px 5px",
                                borderRadius: 4,
                              }}
                            >
                              {stats.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {stats.hasData ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: stats.isSafe ? "#ecfdf5" : "#fff1f2",
                            color: stats.isSafe ? "#065f46" : "#e11d48",
                            border: `1px solid ${stats.isSafe ? "#a7f3d0" : "#fecdd3"}`,
                          }}
                        >
                          {stats.pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "#94a3b8",
                            background: "#f1f5f9",
                            padding: "1px 5px",
                            borderRadius: 5,
                          }}
                        >
                          0 / 0
                        </span>
                      )}

                      {item.classesPerWeek > 0 && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: "#64748b",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            padding: "2px 6px",
                            borderRadius: 5,
                          }}
                        >
                          {item.classesPerWeek}/wk
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
