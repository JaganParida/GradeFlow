import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, GraduationCap, Quote, Heart } from "lucide-react";
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
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, rgba(62,166,255,0.1), rgba(168,85,247,0.1))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <MessageSquare size={32} color="#3ea6ff" />
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.5px" }}>
            Student <span style={{ color: "var(--accent)" }}>Testimonials</span>
          </h1>
          <p style={{ color: "var(--secondary)", fontSize: "clamp(14px, 2vw, 16px)", maxWidth: 500, margin: "0 auto" }}>
            Read what other students are saying about their GradeFlow experience. We value every piece of feedback!
          </p>
        </div>

        {/* Rating Summary Section */}
        {feedbacks.length > 0 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 40,
              background: "linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.9))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 24, padding: "32px", marginBottom: 48,
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              backdropFilter: "blur(12px)", flexWrap: "wrap"
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "clamp(48px, 8vw, 64px)", fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #fff, #a0a0a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
                {averageRating}
              </h2>
              <p style={{ margin: "4px 0 0", color: "var(--secondary)", fontSize: 14, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>out of 5</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={28} 
                    fill={Math.round(averageRating) >= star ? "#f59e0b" : "transparent"} 
                    color={Math.round(averageRating) >= star ? "#f59e0b" : "rgba(255,255,255,0.1)"} 
                  />
                ))}
              </div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 500 }}>
                Based on <span style={{ color: "#fff", fontWeight: 700 }}>{totalReviews}</span> student review{totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        )}

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
