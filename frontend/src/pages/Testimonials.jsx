import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useApp } from "../context/AppContext";
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
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
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

  const { API } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("highlight");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadFeedbacks();
  }, []);

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
      prev.map((f) => (f._id === id ? { ...f, likes: (f.likes || 0) + 1 } : f))
    );

    const updatedLikes = [...likedFeedbacks, id];
    setLikedFeedbacks(updatedLikes);
    localStorage.setItem("likedFeedbacks", JSON.stringify(updatedLikes));

    try {
      const res = await axios.post(`${API}/feedback/${id}/like`);
      if (res.data && res.data.likes !== undefined) {
        setFeedbacks((prev) =>
          prev.map((f) => (f._id === id ? { ...f, likes: res.data.likes } : f))
        );
      }
    } catch (err) {
      console.error("Error liking feedback in backend:", err);
    }
  }

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
        err.response?.data?.message || "Failed to submit review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Computed Statistics from Real Data ───────────────────────────
  const totalReviewsCount = feedbacks.length;
  const avgRating = useMemo(() => {
    if (feedbacks.length === 0) return "4.9";
    const sum = feedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0);
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  // ─── Filter & Sort (Prioritizing 5-Star & Most Detailed Comments) ─
  const displayedReviews = useMemo(() => {
    let list = [...feedbacks];

    // Filter by Category
    if (selectedCategory !== "All Reviews") {
      list = list.filter((r) => {
        if (r.category) return r.category === selectedCategory;
        const text = (r.comment || "").toLowerCase();
        if (selectedCategory === "Easy to Use") return text.includes("easy") || text.includes("ui") || text.includes("clean");
        if (selectedCategory === "Accurate Results") return text.includes("accurate") || text.includes("result") || text.includes("sgpa") || text.includes("cgpa");
        if (selectedCategory === "Time Saver") return text.includes("fast") || text.includes("time") || text.includes("quick") || text.includes("save");
        if (selectedCategory === "Student Support") return text.includes("support") || text.includes("help") || text.includes("report");
        return true;
      });
    }

    // Sort Logic
    if (sortBy === "Most Recent") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "Highest Rated") {
      list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    } else {
      // Default: "Featured 5-Star" -> 5-star reviews with longer/more comments first!
      list.sort((a, b) => {
        const ratingA = Number(a.rating) || 5;
        const ratingB = Number(b.rating) || 5;
        if (ratingB !== ratingA) {
          return ratingB - ratingA; // 5 stars first
        }
        // If same rating, sort by comment length (longer detailed reviews first)
        const lenA = (a.comment || "").trim().length;
        const lenB = (b.comment || "").trim().length;
        if (lenB !== lenA) {
          return lenB - lenA;
        }
        // Then by likes
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
  const totalPages = Math.max(1, Math.ceil(displayedReviews.length / REVIEWS_PER_PAGE));
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

  return (
    <div
      style={{
        background: "#fcfdfe",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: isMobile ? 40 : 80,
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: isMobile ? "16px 12px" : "36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 24 : 40,
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            SECTION 1: HERO HEADER
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
            gap: isMobile ? 20 : 40,
            alignItems: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
          className="gf-testi-hero"
        >
          {/* Left Hero Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}>
            {/* Pill Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: isMobile ? "4px 10px" : "6px 14px",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                borderRadius: 999,
                color: "#2563eb",
                fontSize: isMobile ? 11.5 : 12.5,
                fontWeight: 700,
                width: "fit-content",
              }}
            >
              <MessageSquare size={isMobile ? 12 : 13} color="#2563eb" />
              <span>Student Stories. Real Impact.</span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: isMobile ? "26px" : "clamp(34px, 3.8vw, 48px)",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.18,
                letterSpacing: isMobile ? "-0.8px" : "-1.5px",
                margin: 0,
              }}
            >
              Loved by Students,<br />
              Trusted by <span style={{ color: "#2563eb" }}>Thousands.</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: isMobile ? 13.5 : 15.5,
                lineHeight: 1.5,
                color: "#64748b",
                maxWidth: 480,
                margin: 0,
              }}
            >
              See how GradeFlow is helping students across universities track, analyze and improve their academic journey.
            </p>

            {/* 3 Metric Stat Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: isMobile ? 6 : 14,
                marginTop: isMobile ? 2 : 6,
              }}
              className="gf-testi-stats"
            >
              {/* Stat 1: Happy Students */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  padding: isMobile ? "8px 6px" : "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 6 : 12,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: isMobile ? 28 : 36,
                    height: isMobile ? 28 : 36,
                    borderRadius: 8,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={isMobile ? 14 : 18} />
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#0f172a" }}>10,000+</div>
                  <div style={{ fontSize: isMobile ? 9.5 : 11.5, color: "#64748b", fontWeight: 500 }}>Students</div>
                </div>
              </div>

              {/* Stat 2: Average Rating (Real Calculated) */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  padding: isMobile ? "8px 6px" : "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 6 : 12,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: isMobile ? 28 : 36,
                    height: isMobile ? 28 : 36,
                    borderRadius: 8,
                    background: "#fffbeb",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Star size={isMobile ? 14 : 18} />
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#0f172a" }}>
                    {avgRating}/5
                  </div>
                  <div style={{ fontSize: isMobile ? 9.5 : 11.5, color: "#64748b", fontWeight: 500 }}>Rating</div>
                </div>
              </div>

              {/* Stat 3: Real Reviews Count */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  padding: isMobile ? "8px 6px" : "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 6 : 12,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: isMobile ? 28 : 36,
                    height: isMobile ? 28 : 36,
                    borderRadius: 8,
                    background: "#f5f3ff",
                    color: "#8b5cf6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={isMobile ? 14 : 18} />
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#0f172a" }}>
                    {totalReviewsCount > 0 ? `${totalReviewsCount}+` : "1,500+"}
                  </div>
                  <div style={{ fontSize: isMobile ? 9.5 : 11.5, color: "#64748b", fontWeight: 500 }}>Reviews</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Graphic */}
          {!isMobile && (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 280,
                overflow: "hidden",
                borderRadius: 20,
                maxWidth: "100%",
              }}
            >
              {/* Background Atmosphere Glow */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at 60% 50%, rgba(37, 99, 235, 0.08) 0%, rgba(240, 244, 255, 0) 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* Top Flying Blue Paper Plane */}
              <motion.div
                initial={{ opacity: 0, x: 15, y: -15 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 20,
                  zIndex: 4,
                  filter: "drop-shadow(0 6px 12px rgba(37, 99, 235, 0.2))",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>

              {/* Top Review Card (Tilted Left) */}
              <motion.div
                initial={{ opacity: 0, y: -15, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: -4 }}
                transition={{ duration: 0.6 }}
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: "14px 18px",
                  border: "1px solid #eef2f6",
                  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.05)",
                  width: 200,
                  zIndex: 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#dbeafe" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 4, width: "65%" }} />
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 4, width: "40%" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3, color: "#f59e0b" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill="#f59e0b" />
                  ))}
                </div>
              </motion.div>

              {/* Bottom-Right Review Card (Tilted Right) */}
              <motion.div
                initial={{ opacity: 0, y: 15, rotate: 3 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 16,
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: "14px 18px",
                  border: "1px solid #eef2f6",
                  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.05)",
                  width: 210,
                  zIndex: 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#e0e7ff" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 4, width: "70%" }} />
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 4, width: "45%" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3, color: "#f59e0b" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill="#f59e0b" />
                  ))}
                </div>
              </motion.div>

              {/* Center Floating Blue Heart Chat Bubble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "34px 34px 8px 34px",
                  background: "linear-gradient(145deg, #3b82f6 0%, #1d4ed8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 20px 40px rgba(37, 99, 235, 0.35), 0 0 0 3px rgba(255, 255, 255, 0.9)",
                  zIndex: 3,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <Heart size={48} fill="#ffffff" stroke="none" />
              </motion.div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: CATEGORY FILTERS & SORTING
        ══════════════════════════════════════════════════════════ */}
        <div
          id="reviews-section-grid"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: isMobile ? "nowrap" : "wrap",
            gap: isMobile ? 8 : 14,
            paddingTop: isMobile ? 4 : 10,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Category Filter Pills (Horizontal scrollable track on mobile) */}
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
              paddingBottom: isMobile ? 2 : 0,
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: isMobile ? "6px 12px" : "8px 18px",
                  borderRadius: 999,
                  border: selectedCategory === cat ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  background: selectedCategory === cat ? "#2563eb" : "#ffffff",
                  color: selectedCategory === cat ? "#ffffff" : "#475569",
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s ease",
                  boxShadow: selectedCategory === cat ? "0 2px 8px rgba(37, 99, 235, 0.2)" : "none",
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
                gap: 6,
                padding: isMobile ? "6px 10px" : "8px 16px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                fontSize: isMobile ? 12 : 13,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <span>{sortBy}</span>
              <ChevronDown
                size={14}
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
                  {/* Backdrop overlay to close on click outside */}
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
                      top: "calc(100% + 6px)",
                      right: 0,
                      width: 220,
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 6,
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.1)",
                      zIndex: 100,
                    }}
                  >
                    {[
                      { label: "Featured 5-Star (Best Reviews)", val: "Featured 5-Star" },
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
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: sortBy === opt.val ? "#eff6ff" : "transparent",
                          color: sortBy === opt.val ? "#2563eb" : "#1e293b",
                          fontSize: 13,
                          fontWeight: sortBy === opt.val ? 700 : 500,
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "background 0.12s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                        onMouseEnter={(e) => {
                          if (sortBy !== opt.val) e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          if (sortBy !== opt.val) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {opt.label}
                        {sortBy === opt.val && <CheckCircle2 size={14} color="#2563eb" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: REVIEWS GRID WITH PAGINATION & SIDEBAR
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
            gap: isMobile ? 20 : 28,
            alignItems: "start",
            width: "100%",
            boxSizing: "border-box",
          }}
          className="gf-testi-layout"
        >
          {/* Left: 2-Column Reviews Cards Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 24, width: "100%", boxSizing: "border-box" }}>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
                <Loader2 size={32} className="animate-spin" color="#2563eb" />
              </div>
            ) : displayedReviews.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: isMobile ? "28px 16px" : 48,
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                  color: "#64748b",
                }}
              >
                <MessageSquare size={32} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>No reviews found</h4>
                <p style={{ fontSize: 12.5, margin: 0 }}>Be the first student to share your experience with GradeFlow!</p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 20,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  className="gf-reviews-grid"
                >
                  {paginatedReviews.map((item) => {
                    const itemId = item._id;
                    const isLiked = likedFeedbacks.includes(itemId);
                    const firstLetter = item.name ? item.name.charAt(0).toUpperCase() : "S";

                    return (
                      <motion.div
                        key={itemId}
                        id={`feedback-${itemId}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          background: "#ffffff",
                          border: itemId === highlightedId ? "2px solid #2563eb" : "1px solid #f1f5f9",
                          borderRadius: 16,
                          padding: isMobile ? "16px 14px" : "24px 22px",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: isMobile ? 12 : 16,
                          position: "relative",
                          boxSizing: "border-box",
                          wordBreak: "break-word",
                        }}
                      >
                        {/* Header: User Avatar + Name + Stars */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 10,
                              marginBottom: isMobile ? 8 : 12,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: isMobile ? 36 : 42,
                                  height: isMobile ? 36 : 42,
                                  borderRadius: "50%",
                                  background: "#2563eb",
                                  color: "#ffffff",
                                  fontSize: isMobile ? 14 : 16,
                                  fontWeight: 800,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {firstLetter}
                              </div>
                              <div>
                                <h4
                                  style={{
                                    fontSize: isMobile ? 13.5 : 15,
                                    fontWeight: 800,
                                    color: "#0f172a",
                                    margin: "0 0 1px 0",
                                  }}
                                >
                                  {item.name}
                                </h4>
                                <div style={{ fontSize: isMobile ? 10.5 : 11.5, color: "#64748b" }}>
                                  {item.regNo ? `Student (${item.regNo})` : "Student"}
                                </div>
                                <div style={{ fontSize: isMobile ? 10 : 11, color: "#94a3b8" }}>
                                  {item.university || "Centurion University (CUTM)"}
                                </div>
                              </div>
                            </div>

                            {/* Stars */}
                            <div style={{ display: "flex", gap: 2, color: "#f59e0b" }}>
                              {[...Array(Number(item.rating) || 5)].map((_, i) => (
                                <Star key={i} size={isMobile ? 12 : 14} fill="#f59e0b" />
                              ))}
                            </div>
                          </div>

                          {/* Review Quote Text */}
                          <p
                            style={{
                              fontSize: isMobile ? 12.5 : 13.5,
                              color: "#334155",
                              lineHeight: 1.55,
                              margin: 0,
                            }}
                          >
                            {item.comment}
                          </p>
                        </div>

                        {/* Footer: Category Pill + Like Action + Quote Mark */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 8,
                            borderTop: "1px solid #f8fafc",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontSize: isMobile ? 10.5 : 11.5,
                                fontWeight: 600,
                                color: "#2563eb",
                                background: "#eff6ff",
                                border: "1px solid #dbeafe",
                                padding: isMobile ? "2px 8px" : "3px 10px",
                                borderRadius: 99,
                              }}
                            >
                              {item.category || "Overall Experience"}
                            </span>

                            <button
                              onClick={() => handleLike(itemId)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                background: isLiked ? "#eff6ff" : "transparent",
                                border: isLiked ? "1px solid #dbeafe" : "1px solid transparent",
                                color: isLiked ? "#2563eb" : "#94a3b8",
                                borderRadius: 8,
                                padding: "2px 6px",
                                fontSize: isMobile ? 10.5 : 11.5,
                                fontWeight: 600,
                                cursor: isLiked ? "default" : "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              <ThumbsUp size={isMobile ? 11 : 12} fill={isLiked ? "#2563eb" : "none"} />
                              <span>{item.likes || 0}</span>
                            </button>
                          </div>

                          <span
                            style={{
                              fontSize: isMobile ? 20 : 24,
                              color: "#dbeafe",
                              fontWeight: 800,
                              lineHeight: 1,
                            }}
                          >
                            ”
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Pagination Controls ── */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 10,
                      padding: isMobile ? "10px 14px" : "16px 20px",
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ fontSize: isMobile ? 11 : 12.5, color: "#64748b", fontWeight: 500 }}>
                      Page <strong style={{ color: "#0f172a" }}>{currentPage}</strong> of <strong style={{ color: "#0f172a" }}>{totalPages}</strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {/* Previous Page */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          padding: isMobile ? "4px 8px" : "6px 12px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                          color: currentPage === 1 ? "#cbd5e1" : "#334155",
                          fontSize: isMobile ? 11.5 : 12.5,
                          fontWeight: 600,
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        <ChevronLeft size={13} /> Prev
                      </button>

                      {/* Numbered Page Buttons */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            width: isMobile ? 28 : 32,
                            height: isMobile ? 28 : 32,
                            borderRadius: 8,
                            border: currentPage === pageNum ? "1px solid #2563eb" : "1px solid #e2e8f0",
                            background: currentPage === pageNum ? "#2563eb" : "#ffffff",
                            color: currentPage === pageNum ? "#ffffff" : "#475569",
                            fontSize: isMobile ? 11.5 : 12.5,
                            fontWeight: currentPage === pageNum ? 700 : 500,
                            cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            transition: "all 0.15s",
                          }}
                        >
                          {pageNum}
                        </button>
                      ))}

                      {/* Next Page */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          padding: isMobile ? "4px 8px" : "6px 12px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: currentPage === totalPages ? "#f8fafc" : "#ffffff",
                          color: currentPage === totalPages ? "#cbd5e1" : "#334155",
                          fontSize: isMobile ? 11.5 : 12.5,
                          fontWeight: 600,
                          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        Next <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Write a Review Card */}
          <div
            style={{
              position: isMobile ? "static" : "sticky",
              top: 86,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: 18,
                padding: isMobile ? "16px 14px" : "24px 22px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                boxSizing: "border-box",
              }}
            >
              {/* Form Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 12 : 18 }}>
                <div
                  style={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    borderRadius: 9,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Edit3 size={isMobile ? 16 : 18} />
                </div>
                <div>
                  <h3 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Write a Review
                  </h3>
                  <p style={{ fontSize: isMobile ? 11.5 : 12, color: "#64748b", margin: 0 }}>
                    Share your experience with GradeFlow
                  </p>
                </div>
              </div>

              {/* Star Rating Picker */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 5, cursor: "pointer" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={isMobile ? 20 : 22}
                      color="#f59e0b"
                      fill={(hoverRating || rating) >= star ? "#f59e0b" : "transparent"}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>Click to rate</span>
              </div>

              {/* Review Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 9 : 12 }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  style={{
                    width: "100%",
                    padding: isMobile ? "8px 12px" : "10px 14px",
                    borderRadius: 9,
                    border: "1px solid #cbd5e1",
                    fontSize: isMobile ? 12.5 : 13,
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="Registration Number / University (Optional)"
                  style={{
                    width: "100%",
                    padding: isMobile ? "8px 12px" : "10px 14px",
                    borderRadius: 9,
                    border: "1px solid #cbd5e1",
                    fontSize: isMobile ? 12.5 : 13,
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box",
                  }}
                />

                {/* Custom Category Dropdown */}
                <div style={{ position: "relative", width: "100%" }}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: isMobile ? "8px 12px" : "10px 14px",
                      borderRadius: 9,
                      border: "1px solid #cbd5e1",
                      fontSize: isMobile ? 12.5 : 13,
                      background: "#ffffff",
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#0f172a",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      textAlign: "left",
                    }}
                  >
                    <span>{category}</span>
                    <ChevronDown
                      size={14}
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
                            borderRadius: 12,
                            padding: 6,
                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.1)",
                            zIndex: 100,
                          }}
                        >
                          {CATEGORIES.filter((c) => c !== "All Reviews").map((catOpt) => (
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
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: category === catOpt ? "#eff6ff" : "transparent",
                                color: category === catOpt ? "#2563eb" : "#1e293b",
                                fontSize: 13,
                                fontWeight: category === catOpt ? 700 : 500,
                                cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                                transition: "background 0.12s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                              onMouseEnter={(e) => {
                                if (category !== catOpt) e.currentTarget.style.background = "#f8fafc";
                              }}
                              onMouseLeave={(e) => {
                                if (category !== catOpt) e.currentTarget.style.background = "transparent";
                              }}
                            >
                              {catOpt}
                              {category === catOpt && <CheckCircle2 size={14} color="#2563eb" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ position: "relative" }}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    placeholder="Write your review..."
                    rows={isMobile ? 3 : 4}
                    required
                    style={{
                      width: "100%",
                      padding: isMobile ? "8px 12px" : "10px 14px",
                      borderRadius: 9,
                      border: "1px solid #cbd5e1",
                      fontSize: isMobile ? 12.5 : 13,
                      outline: "none",
                      fontFamily: "'DM Sans', sans-serif",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, color: "#94a3b8" }}>
                    {comment.length}/500
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: isMobile ? "10px" : "12px",
                    borderRadius: 9,
                    background: isSubmitting ? "#93c5fd" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 700,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = "#1d4ed8";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = "#2563eb";
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </form>

              {submittedSuccess && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                    fontSize: 12,
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  Thank you! Your review has been published.
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    fontSize: 12,
                    textAlign: "center",
                    fontWeight: 600,
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
            border: "1px solid #f1f5f9",
            borderRadius: 18,
            padding: isMobile ? "16px 14px" : "24px 32px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: isMobile ? 12 : 20,
            boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
            <div
              style={{
                width: isMobile ? 38 : 48,
                height: isMobile ? 38 : 48,
                borderRadius: 11,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Users size={isMobile ? 19 : 24} />
            </div>
            <div>
              <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>
                Join Thousands of Happy Students
              </h3>
              <p style={{ fontSize: isMobile ? 11.5 : 13, color: "#64748b", margin: 0 }}>
                Be a part of the GradeFlow community and achieve academic excellence.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: isMobile ? "9px 16px" : "11px 22px",
              borderRadius: 9,
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontSize: isMobile ? 12.5 : 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              width: isMobile ? "100%" : "auto",
              justifyContent: "center",
            }}
          >
            Get Started for Free <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </div>
  );
}
