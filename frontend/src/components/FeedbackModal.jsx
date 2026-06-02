import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FeedbackModal() {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already seen or submitted feedback
    const hasSeen = localStorage.getItem("hasSeenFeedback");
    if (!hasSeen) {
      // Delay showing the modal slightly for better UX
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("hasSeenFeedback", "true");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !comment || rating === 0) return;

    // Save feedback to localStorage
    const newFeedback = {
      id: Date.now().toString(),
      name,
      regNo,
      rating,
      comment,
      date: new Date().toISOString(),
    };

    const existingFeedbacks = JSON.parse(localStorage.getItem("gradeflow_feedbacks") || "[]");
    localStorage.setItem("gradeflow_feedbacks", JSON.stringify([newFeedback, ...existingFeedbacks]));

    // Mark as seen
    localStorage.setItem("hasSeenFeedback", "true");
    setShow(false);

    // Redirect to testimonials with highlight query
    navigate(`/testimonials?highlight=${newFeedback.id}`);
  };

  return (
    <AnimatePresence>
      {show && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#181818",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
              padding: "24px 20px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
              zIndex: 1,
            }}
          >
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--secondary)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--secondary)"; }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, rgba(62,166,255,0.15), rgba(168,85,247,0.15))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <MessageSquare size={24} color="#3ea6ff" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#f1f1f1" }}>We Value Your Experience!</h2>
              <p style={{ color: "var(--secondary)", fontSize: 14, lineHeight: 1.5 }}>
                Your feedback helps us improve GradeFlow. Please take a moment to share your thoughts.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Star Rating */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
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
                      padding: 4,
                      transition: "transform 0.1s",
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
                    onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <Star
                      size={32}
                      fill={(hoverRating || rating) >= star ? "#f59e0b" : "transparent"}
                      color={(hoverRating || rating) >= star ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                      style={{ transition: "all 0.2s ease" }}
                    />
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 12,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Reg No (Optional)</label>
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="230..."
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 12,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Feedback</label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What do you think about GradeFlow?"
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s",
                    resize: "vertical", minHeight: 80, fontFamily: "inherit"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={rating === 0}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  background: rating === 0 ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #3ea6ff, #3b82f6)",
                  border: "none", color: rating === 0 ? "rgba(255,255,255,0.4)" : "#fff",
                  fontSize: 15, fontWeight: 700, cursor: rating === 0 ? "not-allowed" : "pointer",
                  marginTop: 8, transition: "all 0.2s",
                  boxShadow: rating === 0 ? "none" : "0 8px 24px rgba(62,166,255,0.3)"
                }}
              >
                Submit Feedback
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
