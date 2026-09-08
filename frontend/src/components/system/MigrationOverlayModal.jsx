import React, { useState, useEffect, useRef } from "react";
import {
  Server,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Pause,
  Play,
  Clock,
  Sparkles
} from "lucide-react";

const NEW_ORIGIN = "https://grade-flow-six.vercel.app";

export default function MigrationOverlayModal() {
  const [isOldDomain, setIsOldDomain] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [isPaused, setIsPaused] = useState(false);
  const [targetUrl, setTargetUrl] = useState(NEW_ORIGIN);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname.toLowerCase();
    const isOld = host.includes("grade-flow-navy") || host.includes("gradeflow-navy");

    if (isOld) {
      setIsOldDomain(true);
      const fullTarget = `${NEW_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
      setTargetUrl(fullTarget);

      // Lock scroll on old domain
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, []);

  // Automatic countdown redirection
  useEffect(() => {
    if (!isOldDomain || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOldDomain, isPaused, targetUrl]);

  if (!isOldDomain) {
    return null;
  }

  const handleRedirect = () => {
    if (typeof window !== "undefined") {
      window.location.replace(targetUrl);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(NEW_ORIGIN);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = NEW_ORIGIN;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.warn("Failed to copy link:", e);
    }
  };

  return (
    <div
      className="gf-migration-viewport"
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-heading"
    >
      <style>{`
        .gf-migration-viewport {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: #ffffff;
          background: radial-gradient(120% 120% at 50% 0%, #f1f5f9 0%, #f8fafc 45%, #ffffff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: clamp(16px, 3vh, 32px) clamp(16px, 4vw, 36px);
          box-sizing: border-box;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-y: auto;
          user-select: none;
          color: #0f172a;
        }

        .gf-migration-topbar {
          width: 100%;
          max-width: 760px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: clamp(12px, 2vh, 20px);
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .gf-migration-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .gf-migration-brand img {
          height: clamp(26px, 4vh, 32px);
          width: auto;
          display: block;
        }

        .gf-migration-brand-title {
          font-size: clamp(18px, 2.5vh, 21px);
          font-weight: 850;
          letter-spacing: -0.03em;
          color: #0f172a;
        }

        .gf-migration-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 9999px;
        }

        .gf-migration-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
        }

        .gf-migration-main-content {
          width: 100%;
          max-width: 660px;
          margin: auto 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: clamp(12px, 2vh, 24px) 0;
        }

        .gf-migration-icon-badge {
          width: clamp(52px, 7vh, 64px);
          height: clamp(52px, 7vh, 64px);
          border-radius: 18px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4f46e5;
          margin-bottom: clamp(12px, 2vh, 18px);
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.12);
        }

        .gf-migration-category-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #4f46e5;
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          font-size: 11.5px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: clamp(10px, 1.8vh, 14px);
        }

        .gf-migration-heading {
          font-size: clamp(22px, 3.6vh, 32px);
          font-weight: 850;
          color: #0f172a;
          line-height: 1.22;
          letter-spacing: -0.03em;
          margin: 0 0 clamp(8px, 1.5vh, 12px);
        }

        .gf-migration-lead-text {
          font-size: clamp(13.5px, 1.8vh, 15.5px);
          color: #475569;
          line-height: 1.55;
          margin: 0 0 clamp(16px, 2.8vh, 22px);
          max-width: 580px;
        }

        .gf-migration-info-grid {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 1.6vh, 14px);
          margin-bottom: clamp(16px, 2.8vh, 24px);
        }

        .gf-migration-info-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: clamp(12px, 1.8vh, 15px) clamp(14px, 2.5vw, 18px);
          border-radius: 14px;
          text-align: left;
          box-sizing: border-box;
        }

        .gf-migration-info-row.success {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
        }

        .gf-migration-info-row.warning {
          background: #fff1f2;
          border: 1px solid #ffe4e6;
        }

        .gf-migration-info-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .gf-migration-info-text {
          font-size: clamp(12.5px, 1.65vh, 14px);
          line-height: 1.5;
          margin: 0;
        }

        .gf-migration-info-row.success .gf-migration-info-text {
          color: #15803d;
        }

        .gf-migration-info-row.success .gf-migration-info-text strong {
          color: #14532d;
          font-weight: 750;
        }

        .gf-migration-info-row.warning .gf-migration-info-text {
          color: #be123c;
        }

        .gf-migration-info-row.warning .gf-migration-info-text strong {
          color: #881337;
          font-weight: 750;
        }

        .gf-migration-link-panel {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 8px 10px 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: clamp(16px, 2.5vh, 22px);
          box-sizing: border-box;
        }

        .gf-migration-link-address {
          font-family: 'Space Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: clamp(13px, 1.7vh, 14.5px);
          font-weight: 600;
          color: #1e293b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
        }

        .gf-migration-copy-button {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 12.5px;
          font-weight: 650;
          padding: 8px 14px;
          border-radius: 9px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .gf-migration-copy-button:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
          color: #0f172a;
        }

        .gf-migration-copy-button.active {
          background: #f0fdf4;
          border-color: #86efac;
          color: #166534;
        }

        .gf-migration-cta-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .gf-migration-primary-action {
          width: 100%;
          background: #4f46e5;
          border: 1px solid #4338ca;
          color: #ffffff;
          font-size: clamp(14px, 2vh, 16px);
          font-weight: 750;
          padding: clamp(12px, 1.8vh, 15px) 24px;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.28);
          transition: all 0.15s ease;
        }

        .gf-migration-primary-action:hover {
          background: #4338ca;
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.38);
          transform: translateY(-1px);
        }

        .gf-migration-primary-action:active {
          transform: translateY(0);
        }

        .gf-migration-timer-caption {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #64748b;
          font-weight: 500;
        }

        .gf-migration-timer-bold {
          color: #4f46e5;
          font-weight: 750;
        }

        .gf-migration-timer-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          text-decoration: underline;
        }

        .gf-migration-timer-btn:hover {
          color: #0f172a;
        }

        .gf-migration-footer {
          width: 100%;
          max-width: 760px;
          padding-top: clamp(10px, 1.8vh, 18px);
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
          flex-shrink: 0;
        }
      `}</style>

      {/* Top Header */}
      <div className="gf-migration-topbar">
        <div className="gf-migration-brand">
          <img src="/logo.png" alt="GradeFlow" />
          <span className="gf-migration-brand-title">GradeFlow</span>
        </div>
        <div className="gf-migration-status-pill">
          <span className="gf-migration-status-dot" />
          <span>New Server Operational</span>
        </div>
      </div>

      {/* Main Central Presentation */}
      <div className="gf-migration-main-content">
        <div className="gf-migration-icon-badge">
          <Server size={30} strokeWidth={2.2} />
        </div>

        <div className="gf-migration-category-tag">
          <Sparkles size={12} strokeWidth={2.5} />
          <span>System Infrastructure Upgrade</span>
        </div>

        <h1 id="migration-heading" className="gf-migration-heading">
          GradeFlow Has Moved to an Upgraded Server
        </h1>

        <p className="gf-migration-lead-text">
          To provide all students with uninterrupted free access, high responsiveness, and zero downtime under peak traffic, our official deployment has permanently transitioned to our high-performance infrastructure.
        </p>

        {/* Information Grid */}
        <div className="gf-migration-info-grid">
          {/* Reassurance Row */}
          <div className="gf-migration-info-row success">
            <CheckCircle2 size={19} className="gf-migration-info-icon" strokeWidth={2.2} />
            <p className="gf-migration-info-text">
              <strong>Do not panic. Your data is 100% safe.</strong> All student records, semester grades, timetables, and analytics remain fully intact and immediately accessible on the new server.
            </p>
          </div>

          {/* Warning Row */}
          <div className="gf-migration-info-row warning">
            <AlertCircle size={19} className="gf-migration-info-icon" strokeWidth={2.2} />
            <p className="gf-migration-info-text">
              <strong>Do not visit this old link again.</strong> This legacy address is being permanently retired. Please save and bookmark the official link below, and navigate directly to it next time.
            </p>
          </div>
        </div>

        {/* URL Box */}
        <div className="gf-migration-link-panel">
          <span className="gf-migration-link-address" title={NEW_ORIGIN}>
            {NEW_ORIGIN.replace("https://", "")}
          </span>
          <button
            type="button"
            className={`gf-migration-copy-button ${copied ? "active" : ""}`}
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={2.5} />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Action Group */}
        <div className="gf-migration-cta-group">
          <button
            type="button"
            className="gf-migration-primary-action"
            onClick={handleRedirect}
          >
            <span>Continue to New Website</span>
            <ArrowRight size={17} strokeWidth={2.2} />
          </button>

          <div className="gf-migration-timer-caption">
            <Clock size={13} strokeWidth={2} />
            {!isPaused ? (
              <>
                <span>Auto-redirecting in</span>
                <span className="gf-migration-timer-bold">{countdown}s</span>
                <span>•</span>
                <button
                  type="button"
                  className="gf-migration-timer-btn"
                  onClick={() => setIsPaused(true)}
                >
                  <Pause size={11} strokeWidth={2.5} />
                  <span>Pause</span>
                </button>
              </>
            ) : (
              <>
                <span>Redirection paused</span>
                <span>•</span>
                <button
                  type="button"
                  className="gf-migration-timer-btn"
                  onClick={() => setIsPaused(false)}
                >
                  <Play size={11} strokeWidth={2.5} />
                  <span>Resume</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="gf-migration-footer">
        <span>GradeFlow • Academic Analytics & Intelligence</span>
        <span>Zero Downtime Migration Protocol</span>
      </div>
    </div>
  );
}
