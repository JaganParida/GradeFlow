import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { TestimonialsSkeleton } from "../components/LoadingSpinner";
import {
  Star,
  Users,
  MessageSquare,
  Sparkles,
  Edit3,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Heart,
  Send,
  Loader2,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Calendar,
} from "lucide-react";

/* ─── Category List ────────────────────────────────────────────── */
const CATEGORIES = [
  "All Reviews",
  "Overall Experience",
  "Easy to Use",
  "Accurate Results",
  "Time Saver",
  "Student Support",
];

const REVIEWS_PER_PAGE = 6;

export default function Testimonials() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Reviews");
  const [sortBy, setSortBy] = useState("Featured 5-Star");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState({});

  // Responsive state
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  const [isSmallMobile, setIsSmallMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsSmallMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [category, setCategory] = useState("Overall Experience");
  const [comment, setComment] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [likedFeedbacks, setLikedFeedbacks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("likedFeedbacks") || "[]");
    } catch {
      return [];
    }
  });

  const { API, studentData } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("highlight");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadFeedbacks();
  }, []);

  // Auto-fill student data if logged in
  useEffect(() => {
    if (studentData) {
      if (!name && studentData.studentName) setName(studentData.studentName);
      if (!regNo && studentData.regNo) setRegNo(studentData.regNo);
    }
  }, [studentData]);

  // ─── Fetch Real Feedbacks from Backend ───────────────────────────
  async function loadFeedbacks() {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API}/feedback`);
      if (Array.isArray(res.data)) {
        setFeedbacks(res.data);
      }
    } catch (err) {
      console.error("Error loading feedbacks from backend:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Auto-scroll to highlighted feedback ─────────────────────────
  useEffect(() => {
    if (highlightedId && feedbacks.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`feedback-${highlightedId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
    }
  }, [highlightedId, feedbacks]);

  // Reset page to 1 when filter or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);

  // ─── Handle Like (Increment Likes in Backend) ─────────────────────
  async function handleLike(id) {
    if (likedFeedbacks.includes(id)) return;

    // Optimistic UI update
    setFeedbacks((prev) =>
      prev.map((f) => (f._id === id ? { ...f, likes: (f.likes || 0) + 1 } : f)),
    );

    const updatedLikes = [...likedFeedbacks, id];
    setLikedFeedbacks(updatedLikes);
    localStorage.setItem("likedFeedbacks", JSON.stringify(updatedLikes));

    try {
      const res = await axios.post(`${API}/feedback/${id}/like`);
      if (res.data && res.data.likes !== undefined) {
        setFeedbacks((prev) =>
          prev.map((f) => (f._id === id ? { ...f, likes: res.data.likes } : f)),
        );
      }
    } catch (err) {
      console.error("Error liking feedback in backend:", err);
    }
  }

  // ─── Toggle Review Expansion ─────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ─── Scroll to Review Form ───────────────────────────────────────
  const scrollToForm = () => {
    const el = document.getElementById("write-review-card");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ─── Handle Real Feedback Submission ─────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating === 0) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name: name.trim(),
        rating,
        comment: comment.trim(),
      };
      if (regNo.trim()) {
        payload.regNo = regNo.trim();
      }

      const res = await axios.post(`${API}/feedback`, payload);

      if (res.data) {
        // Prepend new feedback from server
        setFeedbacks((prev) => [res.data, ...prev]);
        setSubmittedSuccess(true);
        setName("");
        setRegNo("");
        setComment("");
        setRating(5);
        setCurrentPage(1);
        setTimeout(() => setSubmittedSuccess(false), 4500);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to submit review. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Computed Statistics from Real Data ───────────────────────────
  const totalReviewsCount = feedbacks.length;
  const avgRating = useMemo(() => {
    if (feedbacks.length === 0) return "4.9";
    const sum = feedbacks.reduce(
      (acc, curr) => acc + (Number(curr.rating) || 5),
      0,
    );
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  // ─── Filter & Sort (Prioritizing 5-Star & Most Detailed Comments) ─
  const displayedReviews = useMemo(() => {
    let list = [...feedbacks];

    // Filter by Category
    if (selectedCategory !== "All Reviews") {
      list = list.filter((item) => {
        if (item.category) return item.category === selectedCategory;
        return true;
      });
    }

    // Sort Logic
    if (sortBy === "Most Recent") {
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    } else if (sortBy === "Highest Rated") {
      list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    } else {
      // Default: "Featured 5-Star" -> 5-star reviews with longer/more comments first
      list.sort((a, b) => {
        const ratingA = Number(a.rating) || 5;
        const ratingB = Number(b.rating) || 5;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        const lenA = (a.comment || "").trim().length;
        const lenB = (b.comment || "").trim().length;
        if (lenB !== lenA) {
          return lenB - lenA;
        }
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }

    return list;
  }, [feedbacks, selectedCategory, sortBy]);

  // ─── Pagination Calculations ──────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(displayedReviews.length / REVIEWS_PER_PAGE),
  );
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return displayedReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [displayedReviews, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const gridEl = document.getElementById("reviews-section-grid");
      if (gridEl) {
        gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const getPageNumbers = (curr, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (curr <= 3) {
      return [1, 2, 3, 4, "...", total];
    }
    if (curr >= total - 2) {
      return [1, "...", total - 3, total - 2, total - 1, total];
    }
    return [1, "...", curr - 1, curr, curr + 1, "...", total];
  };

  const getRatingLabel = (r) => {
    switch (r) {
      case 5:
        return "Excellent! 5/5";
      case 4:
        return "Very Good! 4/5";
      case 3:
        return "Average 3/5";
      case 2:
        return "Below Average 2/5";
      case 1:
        return "Needs Work 1/5";
      default:
        return "Select rating";
    }
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: isSmallMobile ? 32 : 64,
        overflowX: "hidden",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: isSmallMobile
            ? "14px 12px"
            : isMobile
              ? "20px 16px"
              : "36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: isSmallMobile ? 16 : 28,
          boxSizing: "border-box",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            SECTION 1: HERO HEADER
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "1.2fr 0.8fr",
            gap: isMobile ? 16 : 36,
            alignItems: "center",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Left Hero Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isSmallMobile ? 10 : 16,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            {/* Pill Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: isSmallMobile ? "3px 9px" : "5px 12px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 999,
                color: "#1d4ed8",
                fontSize: isSmallMobile ? 11 : 12,
                fontWeight: 800,
                width: "fit-content",
                letterSpacing: "0.2px",
              }}
            >
              <Sparkles size={isSmallMobile ? 12 : 14} color="#2563eb" />
              <span>STUDENT REVIEWS & EXPERIENCES</span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: isSmallMobile ? 24 : isMobile ? 30 : 42,
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1.2,
                letterSpacing: "-0.8px",
                margin: 0,
              }}
            >
              Loved by Students,{" "}
              <br className={isSmallMobile ? "hidden" : "block"} />
              Trusted by <span style={{ color: "#2563eb" }}>Thousands.</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: isSmallMobile ? 12.5 : 14.5,
                lineHeight: 1.5,
                color: "#64748b",
                maxWidth: 520,
                margin: 0,
              }}
            >
              See how GradeFlow is helping university students track their GPAs,
              analyze grade distributions, and predict placements with
              confidence.
            </p>

            {/* 3 Metric Stat Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: isSmallMobile ? 6 : 10,
                marginTop: isSmallMobile ? 2 : 4,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Stat 1: Students */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: isSmallMobile ? 12 : 14,
                  padding: isSmallMobile ? "10px 8px" : "12px 14px",
                  display: "flex",
                  flexDirection: isSmallMobile ? "column" : "row",
                  alignItems: isSmallMobile ? "flex-start" : "center",
                  gap: isSmallMobile ? 4 : 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: isSmallMobile ? 26 : 32,
                    height: isSmallMobile ? 26 : 32,
                    borderRadius: 8,
                    background: "#dbeafe",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={isSmallMobile ? 13 : 16} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: isSmallMobile ? 13 : 15,
                      fontWeight: 900,
                      color: "#0f172a",
                      lineHeight: 1.2,
                    }}
                  >
                    1000+
                  </div>
                  <div
                    style={{
                      fontSize: isSmallMobile ? 10 : 11,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Students
                  </div>
                </div>
              </div>

              {/* Stat 2: Rating */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: isSmallMobile ? 12 : 14,
                  padding: isSmallMobile ? "10px 8px" : "12px 14px",
                  display: "flex",
                  flexDirection: isSmallMobile ? "column" : "row",
                  alignItems: isSmallMobile ? "flex-start" : "center",
                  gap: isSmallMobile ? 4 : 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: isSmallMobile ? 26 : 32,
                    height: isSmallMobile ? 26 : 32,
                    borderRadius: 8,
                    background: "#fef3c7",
                    color: "#b45309",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Star
                    size={isSmallMobile ? 13 : 16}
                    fill="#f59e0b"
                    color="#f59e0b"
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: isSmallMobile ? 13 : 15,
                      fontWeight: 900,
                      color: "#0f172a",
                      lineHeight: 1.2,
                    }}
                  >
                    {avgRating}/5
                  </div>
                  <div
                    style={{
                      fontSize: isSmallMobile ? 10 : 11,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Rating
                  </div>
                </div>
              </div>

              {/* Stat 3: Reviews */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: isSmallMobile ? 12 : 14,
                  padding: isSmallMobile ? "10px 8px" : "12px 14px",
                  display: "flex",
                  flexDirection: isSmallMobile ? "column" : "row",
                  alignItems: isSmallMobile ? "flex-start" : "center",
                  gap: isSmallMobile ? 4 : 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: isSmallMobile ? 26 : 32,
                    height: isSmallMobile ? 26 : 32,
                    borderRadius: 8,
                    background: "#f3e8ff",
                    color: "#7e22ce",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={isSmallMobile ? 13 : 16} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: isSmallMobile ? 13 : 15,
                      fontWeight: 900,
                      color: "#0f172a",
                      lineHeight: 1.2,
                    }}
                  >
                    {totalReviewsCount > 0 ? `${totalReviewsCount}+` : "45+"}
                  </div>
                  <div
                    style={{
                      fontSize: isSmallMobile ? 10 : 11,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Reviews
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Graphic / CTA (Desktop only) */}
          {!isMobile && (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 220,
                background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
                borderRadius: 20,
                border: "1px solid #e2e8f0",
                padding: "24px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 12,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "2px solid #bfdbfe",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.15)",
                  }}
                >
                  <Heart size={24} fill="#2563eb" color="#2563eb" />
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Have You Used GradeFlow?
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    margin: 0,
                    maxWidth: 280,
                  }}
                >
                  Share your experience to help us improve features for all
                  students.
                </p>
                <button
                  onClick={scrollToForm}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    borderRadius: 10,
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#1d4ed8")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#2563eb")
                  }
                >
                  <Edit3 size={14} />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: CATEGORY FILTERS & SORT CONTROLS
        ══════════════════════════════════════════════════════════ */}
        <div
          id="reviews-section-grid"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Top Controls Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              width: "100%",
            }}
          >
            {/* Scrollable Category Filter Pills */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                flex: 1,
                minWidth: 0,
                padding: "2px 0",
              }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: isSmallMobile ? "6px 11px" : "7px 14px",
                    borderRadius: 999,
                    border:
                      selectedCategory === cat
                        ? "1px solid #2563eb"
                        : "1px solid #e2e8f0",
                    background:
                      selectedCategory === cat ? "#2563eb" : "#ffffff",
                    color: selectedCategory === cat ? "#ffffff" : "#475569",
                    fontSize: isSmallMobile ? 11.5 : 12.5,
                    fontWeight: selectedCategory === cat ? 800 : 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s ease",
                    boxShadow:
                      selectedCategory === cat
                        ? "0 2px 8px rgba(37, 99, 235, 0.2)"
                        : "0 1px 2px rgba(0,0,0,0.02)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Custom Sort Dropdown */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: isSmallMobile ? "6px 10px" : "7px 12px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: isSmallMobile ? 11.5 : 12.5,
                  fontWeight: 700,
                  color: "#334155",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{sortBy}</span>
                <ChevronDown
                  size={13}
                  color="#64748b"
                  style={{
                    transition: "transform 0.2s ease",
                    transform: isSortOpen ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <>
                    <div
                      onClick={() => setIsSortOpen(false)}
                      style={{ position: "fixed", inset: 0, zIndex: 90 }}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        right: 0,
                        width: isSmallMobile ? 200 : 220,
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 5,
                        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                        zIndex: 100,
                      }}
                    >
                      {[
                        {
                          label: "Featured 5-Star (Best)",
                          val: "Featured 5-Star",
                        },
                        { label: "Most Recent", val: "Most Recent" },
                        { label: "Highest Rated", val: "Highest Rated" },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.val);
                            setIsSortOpen(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "none",
                            background:
                              sortBy === opt.val ? "#eff6ff" : "transparent",
                            color: sortBy === opt.val ? "#2563eb" : "#1e293b",
                            fontSize: 12.5,
                            fontWeight: sortBy === opt.val ? 800 : 600,
                            cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          {opt.label}
                          {sortBy === opt.val && (
                            <CheckCircle2 size={13} color="#2563eb" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile "Write a Review" Quick Banner Button */}
          {isMobile && (
            <button
              onClick={scrollToForm}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 10,
                background: "#eff6ff",
                border: "1px dashed #bfdbfe",
                color: "#2563eb",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <Edit3 size={13} />
              <span>Write a Review for GradeFlow</span>
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: REVIEWS LIST & SIDEBAR WRITE-A-REVIEW FORM
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
            gap: isSmallMobile ? 16 : 24,
            alignItems: "start",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Left: Reviews Cards Grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isSmallMobile ? 12 : 16,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {isLoading ? (
              <TestimonialsSkeleton />
            ) : displayedReviews.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: "36px 20px",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                }}
              >
                <MessageSquare
                  size={30}
                  color="#cbd5e1"
                  style={{ margin: "0 auto 8px" }}
                />
                <h4
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 4px",
                  }}
                >
                  No reviews found in this category
                </h4>
                <p style={{ fontSize: 12.5, margin: 0 }}>
                  Be the first student to share your review!
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "minmax(0, 1fr)"
                      : "repeat(2, minmax(0, 1fr))",
                    gap: isSmallMobile ? 10 : 14,
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {paginatedReviews.map((item) => {
                    const itemId = item._id;
                    const isLiked = likedFeedbacks.includes(itemId);
                    const firstLetter = item.name
                      ? item.name.charAt(0).toUpperCase()
                      : "S";
                    const isExpanded = !!expandedReviews[itemId];
                    const fullComment = item.comment || "";
                    const shouldTruncate = fullComment.length > 200;
                    const displayComment =
                      shouldTruncate && !isExpanded
                        ? fullComment.slice(0, 180) + "..."
                        : fullComment;

                    return (
                      <motion.div
                        key={itemId}
                        id={`feedback-${itemId}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          background: "#ffffff",
                          border:
                            itemId === highlightedId
                              ? "2px solid #2563eb"
                              : "1px solid #e2e8f0",
                          borderRadius: isSmallMobile ? 14 : 16,
                          padding: isSmallMobile ? "12px 12px" : "16px 16px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 10,
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          wordBreak: "break-word",
                          overflow: "hidden",
                        }}
                      >
                        {/* Top Row: User Avatar + Name + Stars */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 6,
                              marginBottom: 8,
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 0,
                                flex: "1 1 auto",
                              }}
                            >
                              <div
                                style={{
                                  width: isSmallMobile ? 32 : 36,
                                  height: isSmallMobile ? 32 : 36,
                                  borderRadius: "50%",
                                  background:
                                    "linear-gradient(135deg, #2563eb, #3b82f6)",
                                  color: "#ffffff",
                                  fontSize: isSmallMobile ? 13 : 14,
                                  fontWeight: 900,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {firstLetter}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    minWidth: 0,
                                  }}
                                >
                                  <h4
                                    style={{
                                      fontSize: isSmallMobile ? 13 : 14,
                                      fontWeight: 800,
                                      color: "#0f172a",
                                      margin: 0,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {item.name}
                                  </h4>
                                  <BadgeCheck
                                    size={13}
                                    color="#2563eb"
                                    fill="#dbeafe"
                                    style={{ flexShrink: 0 }}
                                  />
                                </div>
                                <div
                                  style={{
                                    fontSize: isSmallMobile ? 10 : 11,
                                    color: "#64748b",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {item.regNo
                                    ? `Student (${item.regNo})`
                                    : "Student"}
                                </div>
                              </div>
                            </div>

                            {/* Stars Rating */}
                            <div
                              style={{
                                display: "flex",
                                gap: 1.5,
                                color: "#f59e0b",
                                flexShrink: 0,
                              }}
                            >
                              {[...Array(Number(item.rating) || 5)].map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    size={isSmallMobile ? 11.5 : 13}
                                    fill="#f59e0b"
                                    color="#f59e0b"
                                  />
                                ),
                              )}
                            </div>
                          </div>

                          {/* Comment Body */}
                          <p
                            style={{
                              fontSize: isSmallMobile ? 12 : 13,
                              color: "#334155",
                              lineHeight: 1.5,
                              margin: "0 0 4px 0",
                              whiteSpace: "pre-line",
                            }}
                          >
                            {displayComment}
                          </p>

                          {/* Read More / Read Less Toggle */}
                          {shouldTruncate && (
                            <button
                              onClick={() => toggleExpand(itemId)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "#2563eb",
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                marginBottom: 4,
                              }}
                            >
                              {isExpanded ? "Read less" : "Read more"}
                            </button>
                          )}
                        </div>

                        {/* Card Footer: Category Badge + Like Button */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 8,
                            borderTop: "1px solid #f1f5f9",
                            fontSize: isSmallMobile ? 10.5 : 11,
                            width: "100%",
                            boxSizing: "border-box",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#2563eb",
                              background: "#eff6ff",
                              border: "1px solid #dbeafe",
                              padding: "2px 7px",
                              borderRadius: 6,
                              fontSize: isSmallMobile ? 10 : 11,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "60%",
                            }}
                          >
                            {item.category || "Overall Experience"}
                          </span>

                          <button
                            onClick={() => handleLike(itemId)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: isLiked ? "#eff6ff" : "#f8fafc",
                              border: isLiked
                                ? "1px solid #bfdbfe"
                                : "1px solid #e2e8f0",
                              color: isLiked ? "#1d4ed8" : "#64748b",
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: isSmallMobile ? 10.5 : 11.5,
                              fontWeight: 700,
                              cursor: isLiked ? "default" : "pointer",
                              transition: "all 0.15s ease",
                              flexShrink: 0,
                            }}
                          >
                            <ThumbsUp
                              size={isSmallMobile ? 11 : 12}
                              fill={isLiked ? "#2563eb" : "none"}
                            />
                            <span>{item.likes || 0} Helpful</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Responsive Windowed Pagination Controls ── */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                      padding: isSmallMobile ? "8px 10px" : "12px 16px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    {/* Prev Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        padding: isSmallMobile ? "5px 8px" : "7px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                        color: currentPage === 1 ? "#cbd5e1" : "#1e293b",
                        fontSize: isSmallMobile ? 11.5 : 12.5,
                        fontWeight: 700,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        flexShrink: 0,
                      }}
                    >
                      <ChevronLeft size={13} /> <span>Prev</span>
                    </button>

                    {/* Windowed Page Number Pills */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isSmallMobile ? 3 : 5,
                        minWidth: 0,
                        flexWrap: "nowrap",
                      }}
                    >
                      {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                        p === "..." ? (
                          <span
                            key={`dots-${idx}`}
                            style={{
                              color: "#94a3b8",
                              padding: "0 1px",
                              fontSize: isSmallMobile ? 11 : 13,
                              fontWeight: 700,
                              userSelect: "none",
                              flexShrink: 0,
                            }}
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            style={{
                              width: isSmallMobile ? 26 : 30,
                              height: isSmallMobile ? 26 : 30,
                              borderRadius: 7,
                              border:
                                currentPage === p
                                  ? "1px solid #2563eb"
                                  : "1px solid #e2e8f0",
                              background:
                                currentPage === p ? "#2563eb" : "#ffffff",
                              color: currentPage === p ? "#ffffff" : "#475569",
                              fontSize: isSmallMobile ? 11 : 12,
                              fontWeight: currentPage === p ? 800 : 600,
                              cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {p}
                          </button>
                        ),
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        padding: isSmallMobile ? "5px 8px" : "7px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background:
                          currentPage === totalPages ? "#f8fafc" : "#ffffff",
                        color:
                          currentPage === totalPages ? "#cbd5e1" : "#1e293b",
                        fontSize: isSmallMobile ? 11.5 : 12.5,
                        fontWeight: 700,
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        flexShrink: 0,
                      }}
                    >
                      <span>Next</span> <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Write a Review Card */}
          <div
            id="write-review-card"
            style={{
              position: isMobile ? "static" : "sticky",
              top: 86,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: isSmallMobile ? 16 : 18,
                padding: isSmallMobile ? "14px 14px" : "20px 18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                boxSizing: "border-box",
              }}
            >
              {/* Form Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: isSmallMobile ? 10 : 14,
                }}
              >
                <div
                  style={{
                    width: isSmallMobile ? 30 : 34,
                    height: isSmallMobile ? 30 : 34,
                    borderRadius: 9,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Edit3 size={isSmallMobile ? 15 : 17} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: isSmallMobile ? 14 : 15.5,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    Write a Review
                  </h3>
                  <p
                    style={{
                      fontSize: isSmallMobile ? 11 : 12,
                      color: "#64748b",
                      margin: 0,
                    }}
                  >
                    Share your experience with GradeFlow
                  </p>
                </div>
              </div>

              {/* Star Rating Picker */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 10px",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    cursor: "pointer",
                    marginBottom: 2,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                      }}
                    >
                      <Star
                        size={isSmallMobile ? 22 : 24}
                        fill={
                          (hoverRating || rating) >= star
                            ? "#f59e0b"
                            : "#e2e8f0"
                        }
                        color={
                          (hoverRating || rating) >= star
                            ? "#d97706"
                            : "#cbd5e1"
                        }
                      />
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    minHeight: 16,
                  }}
                >
                  {(hoverRating || rating) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {[1, 2, 3, 4, 5].slice(0, hoverRating || rating).map((s) => (
                        <Star key={s} size={11} fill="#f59e0b" color="#d97706" />
                      ))}
                    </div>
                  )}
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}
                  >
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* Review Form */}
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isSmallMobile ? 8 : 10,
                }}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name *"
                  required
                  style={{
                    width: "100%",
                    padding: isSmallMobile ? "8px 10px" : "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: isSmallMobile ? 12 : 13,
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    color: "#0f172a",
                  }}
                />

                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="Registration Number (Optional)"
                  style={{
                    width: "100%",
                    padding: isSmallMobile ? "8px 10px" : "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: isSmallMobile ? 12 : 13,
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    color: "#0f172a",
                  }}
                />

                {/* Category Dropdown */}
                <div style={{ position: "relative", width: "100%" }}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: isSmallMobile ? "8px 10px" : "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: isSmallMobile ? 12 : 13,
                      background: "#ffffff",
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#0f172a",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <span>{category}</span>
                    <ChevronDown
                      size={13}
                      color="#64748b"
                      style={{
                        transition: "transform 0.2s ease",
                        transform: isCategoryOpen ? "rotate(180deg)" : "none",
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {isCategoryOpen && (
                      <>
                        <div
                          onClick={() => setIsCategoryOpen(false)}
                          style={{ position: "fixed", inset: 0, zIndex: 90 }}
                        />

                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            right: 0,
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: 4,
                            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.1)",
                            zIndex: 100,
                          }}
                        >
                          {CATEGORIES.filter((c) => c !== "All Reviews").map(
                            (catOpt) => (
                              <button
                                key={catOpt}
                                type="button"
                                onClick={() => {
                                  setCategory(catOpt);
                                  setIsCategoryOpen(false);
                                }}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "7px 10px",
                                  borderRadius: 6,
                                  border: "none",
                                  background:
                                    category === catOpt
                                      ? "#eff6ff"
                                      : "transparent",
                                  color:
                                    category === catOpt ? "#2563eb" : "#1e293b",
                                  fontSize: 12.5,
                                  fontWeight: category === catOpt ? 700 : 500,
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans', sans-serif",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                {catOpt}
                                {category === catOpt && (
                                  <CheckCircle2 size={13} color="#2563eb" />
                                )}
                              </button>
                            ),
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Comment Textarea */}
                <div style={{ position: "relative" }}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    placeholder="Write your review or feedback..."
                    rows={isSmallMobile ? 3 : 4}
                    required
                    style={{
                      width: "100%",
                      padding: isSmallMobile ? "8px 10px" : "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: isSmallMobile ? 12 : 13,
                      outline: "none",
                      fontFamily: "'DM Sans', sans-serif",
                      resize: "none",
                      boxSizing: "border-box",
                      background: "#ffffff",
                      color: "#0f172a",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 5,
                      right: 8,
                      fontSize: 10,
                      color: "#94a3b8",
                    }}
                  >
                    {comment.length}/500
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: isSmallMobile ? "9px" : "11px",
                    borderRadius: 9,
                    background: isSubmitting
                      ? "#93c5fd"
                      : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#ffffff",
                    border: "1px solid #1e40af",
                    fontSize: isSmallMobile ? 12.5 : 13.5,
                    fontWeight: 800,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 3px 10px rgba(37, 99, 235, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Submit Review
                    </>
                  )}
                </button>
              </form>

              {/* Success Alert */}
              {submittedSuccess && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                    fontSize: 12,
                    textAlign: "center",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={15} color="#15803d" />
                  <span>Thank you! Your review has been published.</span>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    fontSize: 11.5,
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4: BOTTOM CTA BANNER
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isSmallMobile ? 14 : 18,
            padding: isSmallMobile ? "14px 14px" : "20px 24px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: isSmallMobile ? 10 : 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isSmallMobile ? 10 : 14,
            }}
          >
            <div
              style={{
                width: isSmallMobile ? 36 : 44,
                height: isSmallMobile ? 36 : 44,
                borderRadius: 10,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Users size={isSmallMobile ? 18 : 22} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: isSmallMobile ? 14 : 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 2px 0",
                }}
              >
                Join Thousands of Happy Students
              </h3>
              <p
                style={{
                  fontSize: isSmallMobile ? 11 : 12.5,
                  color: "#64748b",
                  margin: 0,
                }}
              >
                Explore your academic analytics and take control of your grades
                today.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: isSmallMobile ? "8px 14px" : "10px 20px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              border: "1px solid #1e40af",
              fontSize: isSmallMobile ? 12 : 13.5,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 3px 10px rgba(37, 99, 235, 0.2)",
              width: isMobile ? "100%" : "auto",
              justifyContent: "center",
            }}
          >
            <span>Get Started for Free</span>
            <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </div>
  );
}
