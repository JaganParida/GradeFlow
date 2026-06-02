import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, GraduationCap, Quote } from "lucide-react";
import { useSearchParams } from "react-router-dom";

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

  const loadFeedbacks = () => {
    const data = JSON.parse(localStorage.getItem("gradeflow_feedbacks") || "[]");
    setFeedbacks(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !comment || rating === 0) return;

    const newFeedback = {
      id: Date.now().toString(),
      name,
      regNo,
      rating,
      comment,
      date: new Date().toISOString(),
    };

    const updatedFeedbacks = [newFeedback, ...feedbacks];
    localStorage.setItem("gradeflow_feedbacks", JSON.stringify(updatedFeedbacks));
    setFeedbacks(updatedFeedbacks);
    
    // Clear form
    setRating(0);
    setName("");
    setRegNo("");
    setComment("");
    
    // Also mark global modal as seen if they submit here
    localStorage.setItem("hasSeenFeedback", "true");
  };

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

        {/* Inline Feedback Form */}
        <div style={{
          background: "#212121",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "24px 20px",
          marginBottom: 40,
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <Star size={18} color="#f59e0b" fill="#f59e0b" /> Leave your review
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
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="Reg No (Optional)"
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
                disabled={rating === 0}
                style={{
                  padding: "12px 24px", borderRadius: 12,
                  background: rating === 0 ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #3ea6ff, #3b82f6)",
                  border: "none", color: rating === 0 ? "rgba(255,255,255,0.4)" : "#fff",
                  fontSize: 14, fontWeight: 700, cursor: rating === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: rating === 0 ? "none" : "0 4px 12px rgba(62,166,255,0.3)"
                }}
              >
                Post Review
              </motion.button>
            </div>
          </form>
        </div>

        {/* Feedback List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {feedbacks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--secondary)", background: "#212121", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <Quote size={40} style={{ opacity: 0.2, marginBottom: 16, margin: "0 auto" }} />
              <p>No feedback yet. Be the first to share your experience!</p>
            </div>
          ) : (
            feedbacks.map((fb, index) => {
              const isHighlighted = fb.id === highlightedId;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  id={`feedback-${fb.id}`}
                  key={fb.id}
                  style={{
                    background: isHighlighted ? "rgba(62,166,255,0.06)" : "#212121",
                    border: isHighlighted ? "1px solid rgba(62,166,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: "20px 20px",
                    boxShadow: isHighlighted ? "0 0 20px rgba(62,166,255,0.15)" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 700, color: "#f1f1f1"
                      }}>
                        {fb.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f1f1" }}>{fb.name}</h4>
                        {fb.regNo && (
                          <div style={{ fontSize: 12, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <GraduationCap size={12} /> {fb.regNo}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={14} fill={fb.rating >= star ? "#f59e0b" : "transparent"} color={fb.rating >= star ? "#f59e0b" : "rgba(255,255,255,0.1)"} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{formatDate(fb.date)}</div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--secondary)", whiteSpace: "pre-wrap" }}>
                    "{fb.comment}"
                  </p>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
