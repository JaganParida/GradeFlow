import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MessageSquare, CheckCircle2, Send, Sparkles, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function FeedbackModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(2); // 1 = Prompt (Star/Feedback), 2 = Review Form
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { API, studentData } = useApp();

  // Prefill student details if logged in
  useEffect(() => {
    if (studentData) {
      if (!name && studentData.studentName) setName(studentData.studentName);
      if (!regNo && studentData.regNo) setRegNo(studentData.regNo);
    }
  }, [studentData, show]);

  // Listen to open event from any part of the app (e.g. Upgrade popup, footer, navbar)
  useEffect(() => {
    const handleOpen = (e) => {
      setShow(true);
      setStep(2);
      setIsSuccess(false);
      setErrorMessage("");
      if (e?.detail?.rating) setRating(e.detail.rating);
    };

    window.addEventListener("open-feedback-modal", handleOpen);
    return () => window.removeEventListener("open-feedback-modal", handleOpen);
  }, []);

  const handleClose = () => {
    setShow(false);
    setIsSuccess(false);
    setErrorMessage("");
    localStorage.setItem("gf_feedback_modal_dismissed", "true");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedRegNo = regNo.trim();
    const trimmedComment = comment.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!trimmedComment) {
      setErrorMessage("Please share a brief comment or review.");
      return;
    }

    if (rating === 0) {
      setErrorMessage("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: trimmedName,
        rating: Number(rating),
        comment: trimmedComment,
      };

      if (trimmedRegNo) {
        payload.regNo = trimmedRegNo;
      }

      const res = await axios.post(`${API}/feedback`, payload);

      setIsSuccess(true);
      setTimeout(() => {
        setShow(false);
        setIsSuccess(false);
        setComment("");
        navigate(`/testimonials?highlight=${res.data._id}`);
      }, 1200);
    } catch (err) {
      console.error("Failed to submit feedback", err);
      const serverMsg =
        err.response?.data?.message ||
        "Failed to submit feedback. Please ensure all inputs are valid.";
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r) => {
    switch (r) {
      case 5:
        return "Outstanding experience! ⭐⭐⭐⭐⭐";
      case 4:
        return "Very good & helpful! ⭐⭐⭐⭐";
      case 3:
        return "Good, with room for improvement ⭐⭐⭐";
      case 2:
        return "Fair, needs work ⭐⭐";
      case 1:
        return "Needs major improvement ⭐";
      default:
        return "Select your star rating";
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
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
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              background: "#ffffff",
              borderRadius: 22,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)",
              padding: "26px 24px",
              zIndex: 10,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Top Accent Strip */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 5,
                background: "linear-gradient(90deg, #2563eb, #8b5cf6, #f59e0b)",
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
              }}
            />

            {/* Close Button */}
            <button
              onClick={handleClose}
              aria-label="Close modal"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                cursor: "pointer",
                transition: "all 0.15s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              <X size={16} />
            </button>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: "center",
                  padding: "30px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#dcfce7",
                    border: "2px solid #86efac",
                    color: "#15803d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Thank You for Your Review!
                </h3>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
                  Your feedback helps us continuously improve GradeFlow for everyone.
                </p>
              </motion.div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      color: "#b45309",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                    }}
                  >
                    <Star size={22} fill="#f59e0b" color="#f59e0b" />
                  </div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "#0f172a",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Leave a Review for GradeFlow
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    Share your experience with the new look and tools!
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {/* Star Rating Interactive Selector */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
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
                            transition: "transform 0.12s ease",
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
                          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          <Star
                            size={28}
                            fill={(hoverRating || rating) >= star ? "#f59e0b" : "#e2e8f0"}
                            color={(hoverRating || rating) >= star ? "#d97706" : "#cbd5e1"}
                          />
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      {getRatingLabel(hoverRating || rating)}
                    </span>
                  </div>

                  {/* Name & Registration Number Inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#475569",
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "9px 12px",
                          borderRadius: 10,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#0f172a",
                          fontSize: 13.5,
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#475569",
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Reg. No (Optional)
                      </label>
                      <input
                        type="text"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        placeholder="e.g. 23030112..."
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "9px 12px",
                          borderRadius: 10,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#0f172a",
                          fontSize: 13.5,
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  </div>

                  {/* Comment / Review */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Your Review / Thoughts *
                    </label>
                    <textarea
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What do you think about GradeFlow's new design, features, and accuracy?"
                      rows={3}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#0f172a",
                        fontSize: 13.5,
                        outline: "none",
                        resize: "vertical",
                        minHeight: 70,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Error banner if any */}
                  {errorMessage && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 10,
                        padding: "8px 12px",
                        color: "#b91c1c",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 11,
                      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      border: "1px solid #1e40af",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
                      transition: "all 0.15s ease",
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                    }}
                  >
                    <Send size={15} />
                    <span>{isSubmitting ? "Submitting Review..." : "Submit Review"}</span>
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
