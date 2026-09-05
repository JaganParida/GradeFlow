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
          background: "#ffffff",
          border: isOpen ? "1.5px solid #059669" : "1.5px solid #cbd5e1",
          borderRadius: 12,
          padding: isMobile ? "7px 10px" : "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isMobile ? 6 : 10,
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(5, 150, 105, 0.12), 0 2px 8px rgba(0,0,0,0.04)"
            : "0 1px 3px rgba(0,0,0,0.04)",
          transition: "all 0.15s ease",
          textAlign: "left",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Icon & Subject Details */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: isMobile ? 26 : 28,
              height: isMobile ? 26 : 28,
              borderRadius: 7,
              background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
              border: "1px solid #a7f3d0",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={isMobile ? 13 : 15} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap" }}>
              <span
                style={{
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 800,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeItem ? activeItem.subjectName : placeholder}
              </span>
              {activeStats?.code && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    padding: "1px 5px",
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  {activeStats.code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Badges & Chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 5 : 6, flexShrink: 0 }}>
          {activeStats && activeStats.hasData && (
            <span
              style={{
                fontSize: isMobile ? 10.5 : 11,
                fontWeight: 800,
                padding: isMobile ? "2px 5px" : "2px 7px",
                borderRadius: 6,
                background: activeStats.isSafe ? "#ecfdf5" : "#fff1f2",
                color: activeStats.isSafe ? "#065f46" : "#e11d48",
                border: `1px solid ${activeStats.isSafe ? "#a7f3d0" : "#fecdd3"}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                whiteSpace: "nowrap",
              }}
            >
              {activeStats.pct.toFixed(1)}%
              <span style={{ fontSize: 8.5, opacity: 0.85, fontWeight: 700 }}>
                {activeStats.isSafe ? "SAFE" : "RISK"}
              </span>
            </span>
          )}

          {activeItem && activeItem.classesPerWeek > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                padding: "2px 5px",
                borderRadius: 5,
                whiteSpace: "nowrap",
                display: isMobile ? "none" : "inline-block",
              }}
            >
              {activeItem.classesPerWeek}/wk
            </span>
          )}

          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: isOpen ? "#f1f5f9" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <ChevronDown size={isMobile ? 14 : 15} />
          </div>
        </div>
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            left: isMobile ? 0 : "auto",
            width: isMobile ? "100%" : 340,
            maxWidth: "92vw",
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
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
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
