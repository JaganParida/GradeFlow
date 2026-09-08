import React, { useState, useEffect, useRef } from "react";
import {
  Rocket,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  ArrowRight,
  Pause,
  Play,
  HeartHandshake
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
      className="gf-migration-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-title"
    >
      <style>{`
        .gf-migration-backdrop {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: #060813;
          background: radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.98) 55%, #04060d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(12px, 3vh, 24px) clamp(14px, 3vw, 24px);
          box-sizing: border-box;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-y: auto;
          user-select: none;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .gf-migration-card {
          width: 100%;
          max-width: 580px;
          background: rgba(15, 23, 42, 0.88);
          border: 1px solid rgba(129, 140, 248, 0.28);
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 45px rgba(99, 102, 241, 0.18);
          border-radius: 24px;
          padding: clamp(20px, 4vh, 36px) clamp(18px, 4vw, 32px);
          color: #f8fafc;
          text-align: center;
          position: relative;
          box-sizing: border-box;
          margin: auto 0;
        }

        .gf-migration-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(129, 140, 248, 0.35);
          color: #a5b4fc;
          font-size: clamp(11px, 1.6vh, 12px);
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 9999px;
          margin-bottom: clamp(12px, 2.5vh, 18px);
        }

        .gf-migration-icon-wrap {
          width: clamp(56px, 8vh, 72px);
          height: clamp(56px, 8vh, 72px);
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25));
          border: 1px solid rgba(168, 85, 247, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto clamp(12px, 2vh, 18px);
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.35);
        }

        .gf-migration-title {
          font-size: clamp(20px, 3.4vh, 27px);
          font-weight: 850;
          line-height: 1.25;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0 0 clamp(8px, 1.8vh, 14px);
        }

        .gf-migration-subtitle {
          font-size: clamp(13px, 1.9vh, 15px);
          line-height: 1.55;
          color: #cbd5e1;
          margin: 0 0 clamp(16px, 3vh, 22px);
        }

        .gf-migration-peace-box {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 14px;
          padding: clamp(10px, 1.8vh, 14px) 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          margin-bottom: clamp(14px, 2.5vh, 20px);
        }

        .gf-migration-peace-text {
          font-size: clamp(12px, 1.7vh, 13.5px);
          color: #a7f3d0;
          line-height: 1.45;
          margin: 0;
        }

        .gf-migration-peace-text strong {
          color: #ffffff;
          font-weight: 700;
        }

        .gf-migration-alert-box {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 14px;
          padding: clamp(10px, 1.8vh, 14px) 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          text-align: left;
          margin-bottom: clamp(16px, 3vh, 24px);
        }

        .gf-migration-alert-text {
          font-size: clamp(12px, 1.7vh, 13.5px);
          color: #fca5a5;
          line-height: 1.45;
          margin: 0;
        }

        .gf-migration-alert-text strong {
          color: #fee2e2;
          font-weight: 750;
        }

        .gf-migration-url-box {
          background: rgba(0, 0, 0, 0.4);
          border: 1px dashed rgba(148, 163, 184, 0.35);
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: clamp(16px, 3vh, 24px);
        }

        .gf-migration-url-text {
          font-family: 'Space Mono', monospace, monospace;
          font-size: clamp(12px, 1.8vh, 14px);
          color: #93c5fd;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
        }

        .gf-migration-copy-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f1f5f9;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .gf-migration-copy-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .gf-migration-copy-btn.copied {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
          color: #6ee7b7;
        }

        .gf-migration-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .gf-migration-primary-btn {
          width: 100%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
          border: none;
          color: #ffffff;
          font-size: clamp(14px, 2.2vh, 16px);
          font-weight: 750;
          padding: clamp(12px, 2vh, 16px) 20px;
          border-radius: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.55);
          transition: all 0.2s ease;
        }

        .gf-migration-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.7);
          filter: brightness(1.1);
        }

        .gf-migration-primary-btn:active {
          transform: translateY(0);
        }

        .gf-migration-timer-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: clamp(11.5px, 1.6vh, 13px);
          color: #94a3b8;
          margin-top: 10px;
        }

        .gf-migration-timer-pill {
          color: #a5b4fc;
          font-weight: 700;
        }

        .gf-migration-pause-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 11.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          text-decoration: underline;
        }

        .gf-migration-pause-btn:hover {
          color: #cbd5e1;
        }
      `}</style>

      <div className="gf-migration-card">
        {/* Badge */}
        <div className="gf-migration-badge">
          <Zap size={13} color="#fbbf24" />
          <span>High-Speed Server Migration</span>
        </div>

        {/* Icon */}
        <div className="gf-migration-icon-wrap">
          <Rocket size={34} color="#c084fc" />
        </div>

        {/* Title */}
        <h1 id="migration-title" className="gf-migration-title">
          GradeFlow Has Moved to a New Link! 🚀
        </h1>

        {/* Reassurance peace of mind box */}
        <div className="gf-migration-peace-box">
          <HeartHandshake size={24} color="#34d399" style={{ flexShrink: 0 }} />
          <p className="gf-migration-peace-text">
            <strong>Don’t panic & don’t worry!</strong> Your accounts, marks, and timetables are 100% safe. We upgraded our servers so students can continue enjoying GradeFlow completely <strong>free with high speed and zero downtime</strong>.
          </p>
        </div>

        {/* Warning / Instruction box */}
        <div className="gf-migration-alert-box">
          <ShieldCheck size={22} color="#f87171" style={{ flexShrink: 0, marginTop: "2px" }} />
          <p className="gf-migration-alert-text">
            <strong>⚠️ Do not visit this old link again.</strong> Please <strong>save and bookmark</strong> our new official link below, and visit the new website directly next time!
          </p>
        </div>

        {/* New URL display & copy button */}
        <div className="gf-migration-url-box">
          <span className="gf-migration-url-text" title={NEW_ORIGIN}>
            {NEW_ORIGIN.replace("https://", "")}
          </span>
          <button
            type="button"
            className={`gf-migration-copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Primary CTA Button */}
        <div className="gf-migration-actions">
          <button
            type="button"
            className="gf-migration-primary-btn"
            onClick={handleRedirect}
          >
            <span>Open New Website Now</span>
            <ArrowRight size={18} />
          </button>

          {/* Countdown & Pause option */}
          <div className="gf-migration-timer-row">
            {!isPaused ? (
              <>
                <span>Redirecting automatically in</span>
                <span className="gf-migration-timer-pill">{countdown}s</span>
                <button
                  type="button"
                  className="gf-migration-pause-btn"
                  onClick={() => setIsPaused(true)}
                  title="Pause auto-redirect"
                >
                  <Pause size={12} />
                  <span>Pause</span>
                </button>
              </>
            ) : (
              <>
                <span>Auto-redirect paused</span>
                <button
                  type="button"
                  className="gf-migration-pause-btn"
                  onClick={() => setIsPaused(false)}
                  title="Resume auto-redirect"
                >
                  <Play size={12} />
                  <span>Resume</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
