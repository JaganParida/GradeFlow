import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  CheckCircle2,
  Send,
  Loader2,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function FeedbackModal() {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const {
    API_BASE,
    studentData,
    studentSession,
    hasActiveSession,
    openStudentAuthModal,
    maintenance,
    adminToken,
  } = useApp();

  const isMaintenanceBlocked = Boolean(maintenance?.enabled && !adminToken);
  const currentRegNo = studentData?.regNo || studentSession?.regNo || "";
  const currentStudentName =
    studentData?.studentName ||
    studentSession?.studentName ||
    studentSession?.name ||
    "Verified Student";

  // Bulletproof mobile + desktop background scroll lock
  useEffect(() => {
    if (!show) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const preventBackdropTouch = (e) => {
      if (e.target && e.target.closest && e.target.closest(".gf-modal-scrollable")) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventBackdropTouch, { passive: false });

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.removeEventListener("touchmove", preventBackdropTouch);
      window.scrollTo(0, scrollY);
    };
  }, [show]);

  // Listen to open event from any part of the application
  useEffect(() => {
    const handleOpen = (e) => {
      if (isMaintenanceBlocked) return;

      const isAuth = Boolean(hasActiveSession && studentSession?.regNo);
      if (!isAuth) {
        openStudentAuthModal({ type: "feedback" });
        return;
      }

      setShow(true);
      setIsSuccess(false);
      setErrorMessage("");
      if (e?.detail?.rating) setRating(e.detail.rating);
    };

    window.addEventListener("open-feedback-modal", handleOpen);
    return () => window.removeEventListener("open-feedback-modal", handleOpen);
  }, [hasActiveSession, studentSession, studentData, isMaintenanceBlocked, openStudentAuthModal]);

  if (isMaintenanceBlocked) return null;

  const handleClose = () => {
    setShow(false);
    setIsSuccess(false);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const trimmedComment = comment.trim();
    if (!currentRegNo) {
      handleClose();
      openStudentAuthModal({ type: "feedback" });
      return;
    }

    if (!trimmedComment || trimmedComment.length < 5) {
      setErrorMessage("Please share a brief comment or review (min 5 characters).");
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select a star rating from 1 to 5.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: currentStudentName,
        regNo: currentRegNo,
        rating: Number(rating),
        comment: trimmedComment,
        category: "Overall Experience",
      };

      const res = await axios.post(`${API_BASE || "/api"}/feedback`, payload);

      setIsSuccess(true);
      setTimeout(() => {
        setShow(false);
        setIsSuccess(false);
        setComment("");
        if (res.data?._id) {
          navigate(`/testimonials?highlight=${res.data._id}`);
        }
      }, 1200);
    } catch (err) {
      console.error("Failed to submit feedback", err);
      const serverMsg =
        err.response?.data?.message ||
        "Failed to submit review. Please try again.";
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r) => {
    switch (r) {
      case 5:
        return "5/5 — Outstanding & Highly Recommended";
      case 4:
        return "4/5 — Very Good & Helpful";
      case 3:
        return "3/5 — Good & Satisfactory";
      case 2:
        return "2/5 — Fair, Needs Work";
      case 1:
        return "1/5 — Needs Major Improvement";
      default:
        return "Select a star rating";
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
            touchAction: "none",
          }}
        >
          {/* Backdrop Blur & Full Cover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            onTouchMove={(e) => {
              if (e.cancelable) e.preventDefault();
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              touchAction: "none",
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              maxHeight: "min(90vh, 600px)",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              zIndex: 10,
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 20px 14px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src="/webisteLogo.png"
                  alt="GradeFlow Logo"
                  style={{
                    height: 28,
                    width: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                <div>
                  <h2
                    id="feedback-modal-title"
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: 0,
                      lineHeight: 1.2,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Share Your Feedback
                  </h2>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                    Help improve GradeFlow for all students
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="gf-modal-scrollable"
              style={{
                padding: "18px 20px",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                touchAction: "pan-y",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {isSuccess ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "36px 12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                    Thank You for Your Review!
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0, maxWidth: 300 }}>
                    Your feedback has been successfully published to the community wall.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Verified Student Session Card */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "#2563eb",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 800,
                        }}
                      >
                        {currentStudentName.charAt(0).toUpperCase() || "S"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                          {currentStudentName}
                        </div>
                        <div style={{ fontSize: 11.5, fontFamily: "'Space Mono', monospace", color: "#64748b" }}>
                          {currentRegNo}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <ShieldCheck size={12} />
                      <span>Verified</span>
                    </div>
                  </div>

                  {/* Star Rating Selector */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: 8,
                      }}
                    >
                      Your Rating
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoverRating || rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 4,
                              cursor: "pointer",
                              outline: "none",
                              transition: "transform 0.1s ease",
                            }}
                          >
                            <Star
                              size={26}
                              fill={isFilled ? "#f59e0b" : "none"}
                              color={isFilled ? "#f59e0b" : "#cbd5e1"}
                              strokeWidth={1.75}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontWeight: 500 }}>
                      {getRatingLabel(hoverRating || rating)}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <label
                      htmlFor="feedback-comment"
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: 6,
                      }}
                    >
                      Your Review / Experience
                    </label>
                    <textarea
                      id="feedback-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What do you love most about GradeFlow? How did it help your academic workflow?"
                      maxLength={600}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        fontSize: 13.5,
                        fontFamily: "'DM Sans', sans-serif",
                        color: "#0f172a",
                        boxSizing: "border-box",
                        resize: "none",
                        outline: "none",
                        transition: "border-color 0.15s ease",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                      onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {comment.length} / 600
                      </span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#dc2626",
                        background: "#fef2f2",
                        border: "1px solid #fee2e2",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontWeight: 600,
                      }}
                    >
                      {errorMessage}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      paddingTop: 6,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#334155",
                        fontSize: 13,
                        fontWeight: 650,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        flex: 1.4,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "10px 16px",
                        borderRadius: 10,
                        background: "#2563eb",
                        border: "1px solid #2563eb",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        opacity: isSubmitting ? 0.8 : 1,
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="gf-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Review</span>
                          <Send size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
