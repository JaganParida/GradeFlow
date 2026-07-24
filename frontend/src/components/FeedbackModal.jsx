import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function FeedbackModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1); // 1 = Prompt (Star/Feedback), 2 = Form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { API } = useApp();

  useEffect(() => {
    // Check if user has already seen the popup (persisted in localStorage)
    const hasBeenShown = localStorage.getItem("gf_github_modal_shown");
    const isHome = location.pathname === "/";
    const isAdmin = location.pathname.startsWith("/admin");

    // Only show ONCE when user navigates to any section other than Home (Dashboard, Analytics, Leaderboard, Testimonials)
    if (!isHome && !isAdmin && !hasBeenShown) {
      const timer = setTimeout(() => {
        setShow(true);
        // Permanently record that popup was shown so it NEVER shows on refresh or future navigations
        localStorage.setItem("gf_github_modal_shown", "true");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("gf_github_modal_shown", "true");
    setTimeout(() => setStep(1), 300);
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
        name,
        regNo,
        rating,
        comment,
      });

      setShow(false);
      localStorage.setItem("gf_github_modal_shown", "true");
      setTimeout(() => setStep(1), 300);
      navigate(`/testimonials?highlight=${res.data._id}`);
    } catch (err) {
      console.error("Failed to submit feedback", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: step === 1 ? 400 : 480,
              maxHeight: "100%",
              overflowY: "auto",
              background: "#121212",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              padding: "20px 16px",
              boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
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
                color: "var(--secondary, #a1a1aa)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "var(--secondary, #a1a1aa)";
              }}
            >
              <X size={18} />
            </button>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  style={{ textAlign: "center" }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(62,166,255,0.15), rgba(168,85,247,0.15))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Star size={32} color="#f59e0b" fill="#f59e0b" />
                  </div>
                  <h2
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      marginBottom: 12,
                      color: "#fff",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Enjoying GradeFlow?
                  </h2>
                  <p
                      style={{
                        color: "var(--secondary, #a1a1aa)",
                        fontSize: 15,
                        lineHeight: 1.6,
                        marginBottom: 24,
                      }}
                    >
                      If GradeFlow has been helpful to you, consider dropping a star on GitHub, or share your thoughts to help me improve it!
                    </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <a
                      href="https://github.com/JaganParida/GradeFlow"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: "16px",
                        borderRadius: 14,
                        background: "#fff",
                        color: "#000",
                        fontWeight: 700,
                        textDecoration: "none",
                        fontSize: 16,
                        transition: "all 0.2s",
                        boxShadow: "0 4px 12px rgba(255,255,255,0.1)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0-.1-3.8s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0C6.2 1.6 5 2 5 2a5.5 5.5 0 0 0-.1 3.8A5.5 5.5 0 0 0 3.4 9.6c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/><path d="M9 18c-4.5 1.5-5-2.5-7-3"/></svg> Star on GitHub
                    </a>
                    <button
                      onClick={() => setStep(2)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: "16px",
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 16,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <MessageSquare size={20} /> Provide Feedback
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: "linear-gradient(135deg, rgba(62,166,255,0.15), rgba(168,85,247,0.15))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <MessageSquare size={20} color="#3ea6ff" />
                    </div>
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        marginBottom: 4,
                        color: "#fff",
                      }}
                    >
                      We Value Your Experience!
                    </h2>
                    <p
                      style={{
                        color: "var(--secondary, #a1a1aa)",
                        fontSize: 13,
                        lineHeight: 1.4,
                      }}
                    >
                      Your feedback helps us improve GradeFlow. Please take a moment to share your thoughts.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Star Rating */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
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
                          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
                          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          <Star
                            size={24}
                            fill={(hoverRating || rating) >= star ? "#f59e0b" : "transparent"}
                            color={(hoverRating || rating) >= star ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                            style={{ transition: "all 0.2s ease" }}
                          />
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 180px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--secondary, #a1a1aa)",
                            marginBottom: 6,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            fontSize: 14,
                            outline: "none",
                            transition: "all 0.2s",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--accent, #3ea6ff)";
                            e.target.style.background = "rgba(255,255,255,0.05)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "rgba(255,255,255,0.1)";
                            e.target.style.background = "rgba(255,255,255,0.03)";
                          }}
                        />
                      </div>
                      <div style={{ flex: "1 1 120px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--secondary, #a1a1aa)",
                            marginBottom: 6,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Registration No.
                        </label>
                        <input
                          type="text"
                          required
                          value={regNo}
                          onChange={(e) => setRegNo(e.target.value)}
                          placeholder="230..."
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            fontSize: 14,
                            outline: "none",
                            transition: "all 0.2s",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--accent, #3ea6ff)";
                            e.target.style.background = "rgba(255,255,255,0.05)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "rgba(255,255,255,0.1)";
                            e.target.style.background = "rgba(255,255,255,0.03)";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--secondary, #a1a1aa)",
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Your Feedback
                      </label>
                      <textarea
                        required
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What do you think about GradeFlow?"
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#fff",
                          fontSize: 14,
                          outline: "none",
                          transition: "all 0.2s",
                          resize: "vertical",
                          minHeight: 60,
                          fontFamily: "inherit",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "var(--accent, #3ea6ff)";
                          e.target.style.background = "rgba(255,255,255,0.05)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgba(255,255,255,0.1)";
                          e.target.style.background = "rgba(255,255,255,0.03)";
                        }}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: rating === 0 || isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: rating === 0 || isSubmitting ? 1 : 0.98 }}
                      type="submit"
                      disabled={rating === 0 || isSubmitting}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 10,
                        background:
                          rating === 0 || isSubmitting
                            ? "rgba(255,255,255,0.05)"
                            : "linear-gradient(135deg, #3ea6ff, #3b82f6)",
                        border: "none",
                        color: rating === 0 || isSubmitting ? "rgba(255,255,255,0.3)" : "#fff",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: rating === 0 || isSubmitting ? "not-allowed" : "pointer",
                        marginTop: 0,
                        transition: "all 0.2s",
                        boxShadow:
                          rating === 0 || isSubmitting ? "none" : "0 8px 24px rgba(62,166,255,0.3)",
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--secondary, #a1a1aa)",
                        fontSize: 13,
                        cursor: "pointer",
                        textDecoration: "underline",
                        marginTop: -2,
                      }}
                    >
                      Back
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
