import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, GraduationCap, Quote, Heart } from "lucide-react";

/* ─── Social Icons ─────────────────────────────────────────────── */
const GithubIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function Testimonials() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("highlight");

  // Inline form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedFeedbacks, setLikedFeedbacks] = useState(() => {
    return JSON.parse(localStorage.getItem("likedFeedbacks") || "[]");
  });
  const { API } = useApp();

  useEffect(() => {
    loadFeedbacks();
    
    // Auto-scroll to highlighted feedback
    if (highlightedId) {
      setTimeout(() => {
        const el = document.getElementById(`feedback-${highlightedId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [highlightedId]);

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/feedback`);
      setFeedbacks(res.data);
      
      // Self-healing: if local storage says liked but server says 0, the API call previously failed.
      // Remove it from local storage so the user can try again.
      const localLiked = JSON.parse(localStorage.getItem("likedFeedbacks") || "[]");
      let modified = false;
      const validLiked = localLiked.filter(id => {
        const fb = res.data.find(f => f._id === id);
        if (fb && (fb.likes === 0 || fb.likes === undefined)) {
          modified = true;
          return false;
        }
        return true;
      });
      if (modified) {
        setLikedFeedbacks(validLiked);
        localStorage.setItem("likedFeedbacks", JSON.stringify(validLiked));
      }
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !regNo || !comment || rating === 0) {
      alert("Please fill in all fields and provide a rating.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API}/feedback`, {
        name, regNo, rating, comment
      });

      const updatedFeedbacks = [res.data, ...feedbacks];
      setFeedbacks(updatedFeedbacks);
      
      // Clear form
      setRating(0);
      setName("");
      setRegNo("");
      setComment("");
      
      // Also mark global modal as seen if they submit here
      localStorage.setItem("hasSeenFeedback", "true");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id) => {
    if (likedFeedbacks.includes(id)) return;
    
    // Optimistic update
    const updatedLiked = [...likedFeedbacks, id];
    setLikedFeedbacks(updatedLiked);
    localStorage.setItem("likedFeedbacks", JSON.stringify(updatedLiked));

    setFeedbacks(feedbacks.map(fb => 
      fb._id === id ? { ...fb, likes: (fb.likes || 0) + 1 } : fb
    ));

    try {
      await axios.post(`${API}/feedback/${id}/like`);
    } catch (err) {
      console.error("Failed to like feedback:", err);
      // Revert optimistic update on failure
      const revertedLiked = likedFeedbacks.filter(likedId => likedId !== id);
      setLikedFeedbacks(revertedLiked);
      localStorage.setItem("likedFeedbacks", JSON.stringify(revertedLiked));
      setFeedbacks(feedbacks.map(fb => 
        fb._id === id ? { ...fb, likes: Math.max((fb.likes || 1) - 1, 0) } : fb
      ));
      alert("Failed to register like. Please ensure the backend is running and try again.");
    }
  };

  const totalReviews = feedbacks.length;
  const averageRating = totalReviews > 0 
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalReviews).toFixed(1) 
    : 0;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(d);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 16px 80px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 800 }}>
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <GraduationCap size={12} /> Student Voice
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, marginBottom: 14, letterSpacing: "-0.5px" }}>
            Student Testimonials
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "clamp(14px, 2vw, 16px)", maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
            Read what students are saying about their GradeFlow experience. Every piece of feedback matters.
          </p>
        </div>

        {/* Rating Summary Section */}
        {feedbacks.length > 0 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
              marginBottom: 48,
            }}
          >
            <div style={{
              background: "linear-gradient(145deg, rgba(28,28,28,0.9), rgba(18,18,18,0.98))",
              borderRadius: 999,
              padding: "14px 28px",
              display: "flex", alignItems: "center", gap: 18,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <span style={{ fontFamily: "Space Mono, monospace", fontSize: 34, fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-1px" }}>
                {averageRating}
              </span>
              <div style={{ width: 1, height: 32, background: "var(--border)" }} />
              <div style={{ display: "flex", gap: 5 }}>
                {[1, 2, 3, 4, 5].map(starIndex => {
                  const fillPercentage = Math.max(0, Math.min(100, (parseFloat(averageRating) - starIndex + 1) * 100));
                  return (
                    <div key={starIndex} style={{ position: "relative", width: 28, height: 28 }}>
                      <div style={{ position: "absolute", top: 0, left: 0 }}>
                        <Star size={28} color="rgba(255,255,255,0.1)" fill="rgba(255,255,255,0.1)" />
                      </div>
                      <div style={{ position: "absolute", top: 0, left: 0, width: `${fillPercentage}%`, overflow: "hidden", height: "100%" }}>
                        <div style={{ width: 28, height: 28 }}>
                          <Star size={28} color="#facc15" fill="#facc15" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13, fontWeight: 600, letterSpacing: "0.3px" }}>
              Based on <span style={{ color: "var(--text)", fontWeight: 700 }}>{totalReviews}</span> student review{totalReviews !== 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        {/* Developer Social Links (Top) */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 48, flexWrap: "wrap" }}>
          <span style={{ color: "var(--secondary)", fontSize: 14, fontWeight: 500 }}>
            Developed by <span style={{ color: "var(--text)", fontWeight: 700 }}>Jagan Parida</span>:
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { icon: <GithubIcon size={18} />, url: "https://github.com/JaganParida", color: "#fff", label: "GitHub" },
              { icon: <LinkedinIcon size={18} />, url: "https://www.linkedin.com/in/jagan-parida04", color: "#3b82f6", label: "LinkedIn" },
              { icon: <InstagramIcon size={18} />, url: "https://instagram.com/imjagaan", color: "#ec4899", label: "Instagram" },
            ].map((link, idx) => (
              <motion.a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--secondary)",
                  transition: "all 0.3s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = link.color;
                  e.currentTarget.style.background = `${link.color}15`;
                  e.currentTarget.style.borderColor = `${link.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--secondary)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
                aria-label={link.label}
              >
                {link.icon}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Inline Feedback Form */}
        <div style={{
          background: "linear-gradient(145deg, rgba(30,30,30,0.4), rgba(20,20,20,0.8))",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 24,
          padding: "32px 28px",
          marginBottom: 48,
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)"
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
            <Star size={20} color="#f59e0b" fill="#f59e0b" /> Leave your review
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
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
                    padding: 0,
                    transition: "transform 0.1s",
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
                  onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Star
                    size={28}
                    fill={(hoverRating || rating) >= star ? "#f59e0b" : "transparent"}
                    color={(hoverRating || rating) >= star ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                    style={{ transition: "all 0.2s ease" }}
                  />
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                style={{
                  flex: "1 1 200px", padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
              <input
                type="text"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="Registration No."
                style={{
                  flex: "1 1 200px", padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={2}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s",
                resize: "vertical", minHeight: 80, fontFamily: "inherit"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={rating === 0 || isSubmitting}
                style={{
                  padding: "12px 24px", borderRadius: 12,
                  background: rating === 0 || isSubmitting ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #3ea6ff, #3b82f6)",
                  border: "none", color: rating === 0 || isSubmitting ? "rgba(255,255,255,0.4)" : "#fff",
                  fontSize: 14, fontWeight: 700, cursor: rating === 0 || isSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: rating === 0 || isSubmitting ? "none" : "0 4px 12px rgba(62,166,255,0.3)"
                }}
              >
                {isSubmitting ? "Posting..." : "Post Review"}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Feedback List */}
        <div style={{ 
          columnWidth: "320px", 
          columnGap: "24px", 
          width: "100%" 
        }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--secondary)", background: "#212121", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <p>Loading feedbacks...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "var(--secondary)", background: "#212121", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <Quote size={40} style={{ opacity: 0.2, marginBottom: 16, margin: "0 auto" }} />
              <p>No feedback yet. Be the first to share your experience!</p>
            </div>
          ) : (
            feedbacks.map((fb, index) => {
              const isHighlighted = fb._id === highlightedId;
              const hasLiked = likedFeedbacks.includes(fb._id);
              
              // Generate a consistent gradient based on the first letter of the name
              const charCode = fb.name.charCodeAt(0) || 0;
              const gradients = [
                "linear-gradient(135deg, #FF6B6B, #C0392B)", // Red
                "linear-gradient(135deg, #4facfe, #00f2fe)", // Blue
                "linear-gradient(135deg, #43e97b, #38f9d7)", // Green
                "linear-gradient(135deg, #fa709a, #fee140)", // Pink/Yellow
                "linear-gradient(135deg, #a18cd1, #fbc2eb)", // Purple/Pink
                "linear-gradient(135deg, #f6d365, #fda085)"  // Orange
              ];
              const avatarBg = gradients[charCode % gradients.length];

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
                  id={`feedback-${fb._id}`}
                  key={fb._id}
                  style={{
                    breakInside: "avoid",
                    marginBottom: "24px",
                    position: "relative",
                    overflow: "hidden",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: isHighlighted ? "linear-gradient(145deg, rgba(62,166,255,0.1), rgba(20,20,20,0.8))" : "linear-gradient(145deg, rgba(35,35,35,0.6), rgba(20,20,20,0.9))",
                    border: isHighlighted ? "1px solid rgba(62,166,255,0.3)" : "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 24,
                    padding: "32px 28px",
                    boxShadow: isHighlighted ? "0 12px 40px rgba(62,166,255,0.15)" : "0 8px 32px rgba(0,0,0,0.3)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                >
                  <Quote size={80} color="rgba(255,255,255,0.02)" style={{ position: "absolute", top: 10, right: 10, zIndex: 0 }} />
                  
                  <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 16,
                        background: avatarBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, fontWeight: 800, color: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        {fb.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>{fb.name}</h4>
                        {fb.regNo && (
                          <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <GraduationCap size={14} opacity={0.7} /> {fb.regNo}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={16} fill={fb.rating >= star ? "#f59e0b" : "transparent"} color={fb.rating >= star ? "#f59e0b" : "rgba(255,255,255,0.08)"} />
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{formatDate(fb.createdAt)}</div>
                    </div>
                  </div>
                  <p style={{ flex: 1, position: "relative", zIndex: 1, margin: 0, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                    "{fb.comment}"
                  </p>
                  <div style={{ position: "relative", zIndex: 1, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleLike(fb._id)}
                      disabled={hasLiked}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: hasLiked ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.03)",
                        border: hasLiked ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255,255,255,0.08)",
                        padding: "6px 12px", borderRadius: 20,
                        color: hasLiked ? "#ef4444" : "var(--secondary)",
                        cursor: hasLiked ? "default" : "pointer",
                        fontSize: 13, fontWeight: 600,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <Heart size={16} fill={hasLiked ? "#ef4444" : "transparent"} color={hasLiked ? "#ef4444" : "currentColor"} />
                      <span>{fb.likes || 0}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

    </motion.div>
  );
}
