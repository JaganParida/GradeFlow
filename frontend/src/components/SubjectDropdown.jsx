import React, { useState, useRef, useEffect, useMemo } from "react";
import { BookOpen, ChevronDown, Check, Search, X, Sparkles, ArrowUpDown } from "lucide-react";
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

  const activeCode = useMemo(() => {
    if (!activeItem) return "";
    return activeStats?.code || activeItem?.code || activeItem?.subCode || resolveSubjectCode({ subject: activeItem?.subjectName }, studentData) || "";
  }, [activeItem, activeStats, studentData]);

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
          background: isOpen ? "#f8fafc" : "#ffffff",
          border: isOpen ? "1.5px solid #0f172a" : "1px solid #cbd5e1",
          borderRadius: 10,
          padding: isMobile ? "9px 12px" : "10px 14px",
          height: isMobile ? 42 : 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(15, 23, 42, 0.08)"
            : "0 1px 2px rgba(0,0,0,0.02)",
          transition: "all 0.15s ease",
          textAlign: "left",
          outline: "none",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "#94a3b8";
            e.currentTarget.style.background = "#f8fafc";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.background = "#ffffff";
          }
        }}
      >
        {/* Subject Name and Subject Code badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: isMobile ? 13.5 : 14,
              fontWeight: 750,
              color: "#0f172a",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {activeItem ? activeItem.subjectName : placeholder}
          </span>

          {activeCode && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 750,
                color: "#475569",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "1.5px 7px",
                borderRadius: 5,
                letterSpacing: "0.2px",
                flexShrink: 0,
              }}
            >
              {activeCode}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          color="#64748b"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            marginLeft: 4,
          }}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          data-lenis-prevent="true"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: isMobile ? "100%" : "max(100%, 380px)",
            maxWidth: "calc(100vw - 28px)",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
            padding: "8px",
            zIndex: 100,
            maxHeight: isMobile ? "70vh" : 420,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            animation: "fadeIn 0.15s ease-out",
            overflow: "hidden",
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Popover Header Guide */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 6px 8px 6px",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: 6,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Select Subject
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 750,
                  color: "#64748b",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {catalog.length} Available
              </span>
            </div>

            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#059669",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "2px 7px",
                borderRadius: 5,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: 999, background: "#059669" }} />
              Live Routine
            </span>
          </div>

          {/* Custom Webkit scrollbar styles for dropdown */}
          <style>{`
            .subject-dropdown-scroll::-webkit-scrollbar {
              width: 5px;
            }
            .subject-dropdown-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .subject-dropdown-scroll::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 4px;
            }
            .subject-dropdown-scroll::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>

          {/* Quick Search Bar (if 3 or more subjects) */}
          {catalog.length >= 3 && (
            <div
              style={{
                position: "relative",
                marginBottom: 6,
                padding: "2px 0",
                flexShrink: 0,
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
                  pointerEvents: "none",
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
                  padding: "7.5px 28px 7.5px 30px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#f8fafc",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.15s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#94a3b8";
                  e.target.style.background = "#ffffff";
                  e.target.style.boxShadow = "0 0 0 2px rgba(15, 23, 42, 0.05)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.background = "#f8fafc";
                  e.target.style.boxShadow = "none";
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
            className="subject-dropdown-scroll"
            data-lenis-prevent="true"
            style={{
              overflowY: "auto",
              flex: "1 1 auto",
              minHeight: 0,
              maxHeight: isMobile ? "55vh" : 350,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              paddingRight: 4,
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 transparent",
            }}
            onWheel={(e) => e.stopPropagation()}
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
                const code = item.code || item.subCode || stats.code || resolveSubjectCode({ subject: item.subjectName }, studentData) || "";

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
                      padding: isMobile ? "9px 10px" : "10px 12px",
                      borderRadius: 8,
                      border: isSelected ? "1px solid #cbd5e1" : "1px solid transparent",
                      background: isSelected ? "#f8fafc" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.12s ease",
                      boxSizing: "border-box",
                      width: "100%",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Left: Indicator & Subject + Code */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: isSelected ? "none" : "1.5px solid #cbd5e1",
                          background: isSelected ? "#0f172a" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1, overflow: "hidden" }}>
                        <span
                          style={{
                            fontSize: isMobile ? 13 : 13.5,
                            fontWeight: isSelected ? 800 : 650,
                            color: isSelected ? "#0f172a" : "#1e293b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.35,
                          }}
                          title={item.subjectName}
                        >
                          {item.subjectName}
                        </span>

                        {code && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 750,
                              background: isSelected ? "#e2e8f0" : "#f1f5f9",
                              color: isSelected ? "#0f172a" : "#475569",
                              border: `1px solid ${isSelected ? "#cbd5e1" : "#e2e8f0"}`,
                              padding: "1.5px 6px",
                              borderRadius: 4,
                              flexShrink: 0,
                              letterSpacing: "0.2px",
                            }}
                          >
                            {code}
                          </span>
                        )}
                      </div>
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
