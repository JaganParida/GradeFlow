import React, { useState, useEffect, useRef } from "react";
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Pause,
  Play,
  Clock
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
          background: radial-gradient(130% 120% at 50% 0%, #f1f5f9 0%, #f8fafc 50%, #ffffff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: clamp(10px, 1.8vh, 20px) clamp(12px, 3vw, 28px);
          box-sizing: border-box;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          height: 100vh;
          height: 100dvh;
          max-height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          user-select: none;
          color: #0f172a;
        }

        .gf-migration-topbar {
          width: 100%;
          max-width: 680px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: clamp(6px, 1.2vh, 12px);
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .gf-migration-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gf-migration-brand img {
          height: clamp(24px, 3.5vh, 32px);
          width: auto;
          object-fit: contain;
          display: block;
        }

        .gf-migration-brand-title {
          font-size: clamp(16px, 2.2vh, 20px);
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
          font-size: clamp(11px, 1.4vh, 12px);
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .gf-migration-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.7);
        }

        .gf-migration-main-content {
          width: 100%;
          max-width: 600px;
          margin: auto 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: clamp(6px, 1vh, 14px) 0;
          box-sizing: border-box;
        }

        .gf-migration-icon-wrap {
          width: clamp(44px, 6vh, 56px);
          height: clamp(44px, 6vh, 56px);
          border-radius: 16px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4f46e5;
          margin-bottom: clamp(8px, 1.4vh, 14px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
        }

        .gf-migration-heading {
          font-size: clamp(19px, 2.8vh, 26px);
          font-weight: 850;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin: 0 0 clamp(6px, 1vh, 10px);
        }

        .gf-migration-lead-text {
          font-size: clamp(12px, 1.6vh, 14px);
          color: #475569;
          line-height: 1.45;
          margin: 0 0 clamp(10px, 1.8vh, 16px);
          max-width: 520px;
        }

        .gf-migration-notice-card {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: clamp(8px, 1.4vh, 12px) clamp(10px, 2vw, 14px);
          display: flex;
          flex-direction: column;
          gap: clamp(6px, 1vh, 10px);
          margin-bottom: clamp(12px, 1.8vh, 18px);
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          text-align: left;
        }

        .gf-migration-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: clamp(11.5px, 1.5vh, 13px);
          line-height: 1.4;
        }

        .gf-migration-item.success {
          color: #15803d;
        }

        .gf-migration-item.success strong {
          color: #14532d;
          font-weight: 750;
        }

        .gf-migration-item.warning {
          color: #b91c1c;
        }

        .gf-migration-item.warning strong {
          color: #991b1b;
          font-weight: 750;
        }

        .gf-migration-item-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .gf-migration-link-panel {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 6px 8px 6px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: clamp(10px, 1.6vh, 16px);
          box-sizing: border-box;
        }

        .gf-migration-link-address {
          font-family: 'Space Mono', SFMono-Regular, Menlo, Monaco, monospace;
          font-size: clamp(12px, 1.6vh, 13.5px);
          font-weight: 650;
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
          font-size: clamp(11px, 1.4vh, 12px);
          font-weight: 650;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
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
          gap: 8px;
        }

        .gf-migration-primary-action {
          width: 100%;
          background: #4f46e5;
          border: 1px solid #4338ca;
          color: #ffffff;
          font-size: clamp(13.5px, 1.8vh, 15px);
          font-weight: 750;
          padding: clamp(10px, 1.6vh, 13px) 20px;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
          transition: all 0.15s ease;
        }

        .gf-migration-primary-action:hover {
          background: #4338ca;
          box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
          transform: translateY(-1px);
        }

        .gf-migration-primary-action:active {
          transform: translateY(0);
        }

        .gf-migration-timer-caption {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: clamp(11px, 1.4vh, 12px);
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
          font-size: clamp(11px, 1.4vh, 12px);
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 1px 4px;
          border-radius: 4px;
          text-decoration: underline;
        }

        .gf-migration-timer-btn:hover {
          color: #0f172a;
        }

        .gf-migration-footer {
          width: 100%;
          max-width: 680px;
          padding-top: clamp(6px, 1.2vh, 10px);
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
          flex-shrink: 0;
        }
      `}</style>

      {/* Top Header with Real GradeFlow Logo */}
      <div className="gf-migration-topbar">
        <div className="gf-migration-brand">
          <img src="/webisteLogo.png" alt="GradeFlow" />
          <span className="gf-migration-brand-title">GradeFlow</span>
        </div>
        <div className="gf-migration-status-pill">
          <span className="gf-migration-status-dot" />
          <span>New Server Operational</span>
        </div>
      </div>

      {/* Main Central Presentation */}
      <div className="gf-migration-main-content">
        <div className="gf-migration-icon-wrap">
          <Server size={26} strokeWidth={2.2} />
        </div>

        <h1 id="migration-heading" className="gf-migration-heading">
          GradeFlow Has Moved to an Upgraded Server
        </h1>

        <p className="gf-migration-lead-text">
          To provide zero-downtime reliability and instant response speeds under high student traffic, GradeFlow has permanently transitioned to our upgraded high-performance server.
        </p>

        {/* Compact Integrated Notice Card */}
        <div className="gf-migration-notice-card">
          <div className="gf-migration-item success">
            <CheckCircle2 size={16} className="gf-migration-item-icon" strokeWidth={2.4} />
            <span>
              <strong>Your data is 100% safe:</strong> All student accounts, grades, rankings, and schedules remain fully intact on the new server.
            </span>
          </div>

          <div className="gf-migration-item warning">
            <AlertCircle size={16} className="gf-migration-item-icon" strokeWidth={2.4} />
            <span>
              <strong>Please do not use this old link again:</strong> Bookmark our new official link below and visit it directly next time.
            </span>
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
                <Check size={13} strokeWidth={2.5} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} strokeWidth={2} />
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
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>

          <div className="gf-migration-timer-caption">
            <Clock size={12} strokeWidth={2} />
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
                  <Pause size={10} strokeWidth={2.5} />
                  <span>Pause</span>
                </button>
              </>
            ) : (
              <>
                <span>Paused</span>
                <span>•</span>
                <button
                  type="button"
                  className="gf-migration-timer-btn"
                  onClick={() => setIsPaused(false)}
                >
                  <Play size={10} strokeWidth={2.5} />
                  <span>Resume</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="gf-migration-footer">
        <span>GradeFlow • Academic Analytics</span>
        <span>Zero Downtime Migration Protocol</span>
      </div>
    </div>
  );
}
