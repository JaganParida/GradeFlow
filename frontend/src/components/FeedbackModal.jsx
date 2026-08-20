import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  MessageSquare,
  CheckCircle2,
  Send,
  AlertCircle,
  Lock,
  Search,
  ShieldCheck,
  Loader2,
  Info,
  BadgeCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function FeedbackModal() {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Search Step State
  const [searchRegInput, setSearchRegInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isChangingReg, setIsChangingReg] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { API, studentData, fetchStudent } = useApp();

  const currentRegNo = studentData?.regNo || "";
  const currentStudentName = studentData?.studentName || "";

  // Prefill student details whenever available
  useEffect(() => {
    if (currentRegNo) {
      setRegNo(currentRegNo);
    }
    if (currentStudentName) {
      setName(currentStudentName);
    }
  }, [studentData, currentRegNo, currentStudentName]);

  // Listen to open event from any part of the app (e.g. Upgrade popup, footer, navbar)
  useEffect(() => {
    const handleOpen = (e) => {
      setShow(true);
      setIsSuccess(false);
      setErrorMessage("");
      setSearchError("");
      setIsChangingReg(false);
      if (e?.detail?.rating) setRating(e.detail.rating);
    };

    window.addEventListener("open-feedback-modal", handleOpen);
    return () => window.removeEventListener("open-feedback-modal", handleOpen);
  }, []);

  const handleClose = () => {
    setShow(false);
    setIsSuccess(false);
    setErrorMessage("");
    setSearchError("");
    setIsChangingReg(false);
    localStorage.setItem("gf_feedback_modal_dismissed", "true");
  };

  const handleVerifyStudent = async (e) => {
    if (e) e.preventDefault();
    setSearchError("");
    const cleanInput = searchRegInput.trim();
    if (!cleanInput) {
      setSearchError("Please enter your registration number.");
      return;
    }

    setSearchLoading(true);
    try {
      const data = await fetchStudent(cleanInput);
      let studentObj = data && typeof data === "object" ? data : null;
      if (!studentObj) {
        try {
          studentObj = JSON.parse(sessionStorage.getItem("gf_student_data"));
        } catch {}
      }
      if (
        data &&
        (studentObj?.studentName || studentObj?.regNo || data === true)
      ) {
        const foundName = studentObj?.studentName || "";
        const foundReg = studentObj?.regNo || cleanInput;
        setName(foundName);
        setRegNo(foundReg);
        try {
          sessionStorage.setItem("last_regNo", foundReg);
          sessionStorage.setItem("last_studentName", foundName);
        } catch {}
        setIsChangingReg(false);
      } else {
        setSearchError(
          "Student record not found. Please verify your registration number.",
        );
      }
    } catch (err) {
      setSearchError(
        err?.response?.data?.message ||
          "Failed to verify student. Please check your registration number.",
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = (name || currentStudentName).trim();
    const trimmedRegNo = (regNo || currentRegNo).trim();
    const trimmedComment = comment.trim();

    if (!trimmedRegNo) {
      setIsChangingReg(true);
      return;
    }

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
        regNo: trimmedRegNo,
        rating: Number(rating),
        comment: trimmedComment,
      };

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
        return "Outstanding experience (5/5)";
      case 4:
        return "Very good & helpful (4/5)";
      case 3:
        return "Good, with room for improvement (3/5)";
      case 2:
        return "Fair, needs work (2/5)";
      case 1:
        return "Needs major improvement (1/5)";
      default:
        return "Select your star rating";
    }
  };

  const [isMobile, setIsMobile] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth < 640 || window.innerHeight < 700 : false)
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640 || window.innerHeight < 700);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            padding: isMobile ? "8px" : "16px",
            boxSizing: "border-box",
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
              maxHeight: "min(92vh, 580px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              background: "#ffffff",
              borderRadius: isMobile ? 18 : 22,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)",
              padding: isMobile ? "18px 16px 16px 16px" : "26px 24px",
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
                height: 4,
                background: "linear-gradient(90deg, #2563eb, #8b5cf6, #f59e0b)",
                borderTopLeftRadius: isMobile ? 18 : 22,
                borderTopRightRadius: isMobile ? 18 : 22,
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
            ) : (!currentRegNo && !regNo) || isChangingReg ? (
              /* Step 0: Registration Number Required */
              <div>
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px auto",
                    }}
                  >
                    <Search size={22} />
                  </div>
                  <h3
                    style={{
                      fontSize: 19,
                      fontWeight: 900,
                      color: "#0f172a",
                      margin: "0 0 6px 0",
                    }}
                  >
                    Registration Number Required
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    Please enter your registration number to continue.
                  </p>
                </div>

                <form onSubmit={handleVerifyStudent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        marginBottom: 5,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={searchRegInput}
                      onChange={(e) => {
                        setSearchRegInput(e.target.value);
                        setSearchError("");
                      }}
                      placeholder="e.g. 230301120450"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: searchError ? "1px solid #ef4444" : "1px solid #cbd5e1",
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                    {searchError && (
                      <p
                        style={{
                          fontSize: 11.5,
                          color: "#dc2626",
                          marginTop: 4,
                          marginBottom: 0,
                          fontWeight: 600,
                        }}
                      >
                        {searchError}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {isChangingReg && (
                      <button
                        type="button"
                        onClick={() => setIsChangingReg(false)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 10,
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "none",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={searchLoading}
                      style={{
                        flex: 1.3,
                        padding: "10px",
                        borderRadius: 10,
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: searchLoading ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                      }}
                    >
                      {searchLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <BadgeCheck size={14} />
                          <span>Verify & Continue</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
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
                    Share your experience with GradeFlow
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
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
                      padding: "10px 14px",
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 18 }}>
                      {(hoverRating || rating) > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {[1, 2, 3, 4, 5].slice(0, hoverRating || rating).map((s) => (
                            <Star key={s} size={12} fill="#f59e0b" color="#d97706" />
                          ))}
                        </div>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                        {getRatingLabel(hoverRating || rating)}
                      </span>
                    </div>
                  </div>

                  {/* Name & Registration Number Inputs (Strict Locked Mode) */}
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
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          readOnly
                          required
                          value={name || currentStudentName}
                          placeholder="Full Name"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "9px 28px 9px 12px",
                            borderRadius: 10,
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            fontSize: 13,
                            outline: "none",
                            fontFamily: "inherit",
                            cursor: "default",
                          }}
                        />
                        <Lock
                          size={12}
                          color="#64748b"
                          style={{
                            position: "absolute",
                            right: 9,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                        />
                      </div>
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
                        Reg. No *
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          readOnly
                          required
                          value={regNo || currentRegNo}
                          placeholder="Registration Number"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "9px 28px 9px 12px",
                            borderRadius: 10,
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            fontSize: 13,
                            outline: "none",
                            fontFamily: "inherit",
                            cursor: "default",
                          }}
                        />
                        <Lock
                          size={12}
                          color="#64748b"
                          style={{
                            position: "absolute",
                            right: 9,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Locked Profile Badge with Change Option */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "#eff6ff",
                      border: "1px solid #dbeafe",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#1e40af",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <ShieldCheck size={13} color="#2563eb" />
                      <span>
                        Verified Profile: <strong>{regNo || currentRegNo}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingReg(true);
                        setSearchRegInput(regNo || currentRegNo);
                        setSearchError("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      Change
                    </button>
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
                      placeholder="What do you think about GradeFlow?"
                      rows={3}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#0f172a",
                        fontSize: 13,
                        outline: "none",
                        fontFamily: "inherit",
                        resize: "none",
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 10,
                      background: isSubmitting
                        ? "#93c5fd"
                        : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting Review...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Review</span>
                      </>
                    )}
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
