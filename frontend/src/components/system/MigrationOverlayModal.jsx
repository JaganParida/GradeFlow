import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Server,
  Copy,
  Check,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const NEW_ORIGIN = "https://grade-flow-six.vercel.app";

export default function MigrationOverlayModal() {
  const [isOldDomain, setIsOldDomain] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetUrl, setTargetUrl] = useState(NEW_ORIGIN);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname.toLowerCase();
    const isOld = host.includes("grade-flow-navy") || host.includes("gradeflow-navy");

    if (isOld) {
      setIsOldDomain(true);
      const fullTarget = `${NEW_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
      setTargetUrl(fullTarget);

      // Bulletproof mobile & desktop background scroll lock
      const origBodyOverflow = document.body.style.overflow;
      const origBodyPosition = document.body.style.position;
      const origBodyWidth = document.body.style.width;
      const origBodyHeight = document.body.style.height;
      const origHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
      document.body.style.top = "0";
      document.body.style.left = "0";
      document.documentElement.style.overflow = "hidden";

      const preventTouchMove = (e) => {
        const viewport = document.querySelector(".gf-migration-viewport");
        if (viewport && viewport.contains(e.target) && viewport.scrollHeight > viewport.clientHeight) {
          return; // Allow internal modal scroll if screen is extremely small
        }
        e.preventDefault();
      };

      document.addEventListener("touchmove", preventTouchMove, { passive: false });

      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.body.style.position = origBodyPosition;
        document.body.style.width = origBodyWidth;
        document.body.style.height = origBodyHeight;
        document.body.style.top = "";
        document.body.style.left = "";
        document.documentElement.style.overflow = origHtmlOverflow;
        document.removeEventListener("touchmove", preventTouchMove);
      };
    }
  }, []);

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
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          width: 100dvw;
          height: 100vh;
          height: 100dvh;
          max-height: 100dvh;
          z-index: 9999999;
          background: #ffffff;
          background: radial-gradient(130% 120% at 50% 0%, #f1f5f9 0%, #f8fafc 50%, #ffffff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: clamp(8px, 1.8vh, 22px) clamp(12px, 3vw, 28px);
          box-sizing: border-box;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: none;
          touch-action: pan-y;
          user-select: none;
          color: #0f172a;
        }

        .gf-migration-topbar {
          width: 100%;
          max-width: 720px;
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
          gap: 10px;
        }

        .gf-migration-brand img {
          height: clamp(24px, 3.6vh, 32px);
          width: auto;
          object-fit: contain;
          display: block;
        }

        .gf-migration-brand-title {
          font-size: clamp(17px, 2.3vh, 21px);
          font-weight: 850;
          letter-spacing: -0.03em;
          color: #0f172a;
        }

        .gf-migration-topbar-subtitle {
          font-size: clamp(11px, 1.4vh, 12.5px);
          font-weight: 600;
          color: #64748b;
          letter-spacing: -0.01em;
        }

        .gf-migration-main-content {
          width: 100%;
          max-width: 660px;
          margin: auto 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: clamp(6px, 1.2vh, 14px) 0;
          box-sizing: border-box;
        }

        .gf-migration-icon-wrap {
          width: clamp(42px, 5.5vh, 52px);
          height: clamp(42px, 5.5vh, 52px);
          border-radius: 14px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4f46e5;
          margin-bottom: clamp(6px, 1vh, 10px);
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.08);
          flex-shrink: 0;
        }

        .gf-migration-heading {
          font-size: clamp(18px, 2.7vh, 25px);
          font-weight: 850;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin: 0 0 clamp(4px, 0.8vh, 8px);
        }

        .gf-migration-lead-text {
          font-size: clamp(12px, 1.55vh, 13.5px);
          color: #475569;
          line-height: 1.45;
          margin: 0 0 clamp(10px, 1.6vh, 16px);
          max-width: 580px;
        }

        /* ── TWO PROFESSIONAL CARDS (SIDE-BY-SIDE ON LAPTOP/DESKTOP, STACKED ON MOBILE) ── */
        .gf-migration-cards-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(8px, 1.2vh, 12px);
          margin-bottom: clamp(10px, 1.6vh, 16px);
          box-sizing: border-box;
        }

        @media (max-width: 580px) {
          .gf-migration-cards-grid {
            grid-template-columns: 1fr;
            gap: 8px;
            margin-bottom: 12px;
          }
        }

        .gf-migration-card {
          background: #ffffff;
          border-radius: 12px;
          padding: clamp(8px, 1.4vh, 12px) clamp(10px, 1.8vw, 14px);
          text-align: left;
          box-sizing: border-box;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .gf-migration-card.trust {
          border: 1px solid #bbf7d0;
          background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
        }

        .gf-migration-card.transition {
          border: 1px solid #c7d2fe;
          background: linear-gradient(180deg, #eef2ff 0%, #ffffff 100%);
        }

        .gf-migration-card-header {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 4px;
        }

        .gf-migration-card-header h3 {
          font-size: clamp(12px, 1.6vh, 13.5px);
          font-weight: 750;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .gf-migration-card.trust .gf-migration-card-header h3 {
          color: #15803d;
        }

        .gf-migration-card.transition .gf-migration-card-header h3 {
          color: #4338ca;
        }

        .gf-migration-card-body {
          font-size: clamp(11px, 1.4vh, 12px);
          line-height: 1.45;
          margin: 0;
          color: #475569;
        }

        .gf-migration-card-body strong {
          font-weight: 700;
          color: #1e293b;
        }

        /* ── URL BAR WITH COPY BUTTON ── */
        .gf-migration-link-panel {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 5px 6px 5px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: clamp(10px, 1.8vh, 16px);
          box-sizing: border-box;
        }

        .gf-migration-link-address {
          font-family: 'Space Mono', SFMono-Regular, Menlo, Monaco, monospace;
          font-size: clamp(12px, 1.55vh, 13.5px);
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
          font-size: clamp(11px, 1.35vh, 12px);
          font-weight: 650;
          padding: 5px 10px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
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

        /* ── ACTION CTA GROUP ── */
        .gf-migration-cta-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .gf-migration-primary-action {
          width: 100%;
          background: #4f46e5;
          border: 1px solid #4338ca;
          color: #ffffff;
          font-size: clamp(13px, 1.7vh, 15px);
          font-weight: 750;
          padding: clamp(10px, 1.6vh, 14px) 18px;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.22);
          transition: all 0.15s ease;
        }

        .gf-migration-primary-action:hover {
          background: #4338ca;
          box-shadow: 0 6px 18px rgba(79, 70, 229, 0.32);
          transform: translateY(-1px);
        }

        .gf-migration-primary-action:active {
          transform: translateY(0);
        }

        .gf-migration-footer {
          width: 100%;
          max-width: 720px;
          padding-top: clamp(6px, 1vh, 10px);
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: clamp(10px, 1.3vh, 11px);
          color: #94a3b8;
          flex-shrink: 0;
        }

        /* ── LARGE SCREEN & LAPTOP ENHANCEMENT (PROPORTIONATE & READABLE FOR LAPTOPS) ── */
        @media (min-width: 769px) {
          .gf-migration-topbar {
            max-width: 860px;
            padding-bottom: 14px;
          }
          .gf-migration-brand img {
            height: 36px;
          }
          .gf-migration-brand-title {
            font-size: 23px;
          }
          .gf-migration-topbar-subtitle {
            font-size: 13.5px;
          }
          .gf-migration-main-content {
            max-width: 820px;
            padding: 16px 0;
          }
          .gf-migration-icon-wrap {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            margin-bottom: 14px;
          }
          .gf-migration-heading {
            font-size: 27px;
            line-height: 1.25;
            margin-bottom: 10px;
          }
          .gf-migration-lead-text {
            font-size: 14.5px;
            line-height: 1.55;
            max-width: 680px;
            margin-bottom: 20px;
          }
          .gf-migration-cards-grid {
            gap: 16px;
            margin-bottom: 20px;
          }
          .gf-migration-card {
            padding: 16px 20px;
            border-radius: 14px;
          }
          .gf-migration-card-header {
            margin-bottom: 7px;
            gap: 9px;
          }
          .gf-migration-card-header h3 {
            font-size: 15.5px;
          }
          .gf-migration-card-body {
            font-size: 13px;
            line-height: 1.55;
          }
          .gf-migration-link-panel {
            padding: 8px 10px 8px 16px;
            border-radius: 14px;
            margin-bottom: 20px;
          }
          .gf-migration-link-address {
            font-size: 15px;
          }
          .gf-migration-copy-button {
            padding: 7px 14px;
            font-size: 13px;
            border-radius: 9px;
          }
          .gf-migration-primary-action {
            font-size: 16px;
            padding: 14px 28px;
            border-radius: 13px;
          }
          .gf-migration-footer {
            max-width: 860px;
            font-size: 12px;
            padding-top: 14px;
          }
        }
      `}</style>

      {/* Top Header with Real GradeFlow Logo & Clean Institutional Title */}
      <div className="gf-migration-topbar">
        <div className="gf-migration-brand">
          <img src="/webisteLogo.png" alt="GradeFlow" />
          <span className="gf-migration-brand-title">GradeFlow</span>
        </div>
        <div className="gf-migration-topbar-subtitle">
          Official Academic Network
        </div>
      </div>

      {/* Main Central Presentation */}
      <div className="gf-migration-main-content">
        <div className="gf-migration-icon-wrap">
          <Server size={24} strokeWidth={2.2} />
        </div>

        <h1 id="migration-heading" className="gf-migration-heading">
          Important Notice: Official Server Migration
        </h1>

        <p className="gf-migration-lead-text">
          To handle high student traffic with zero lag, instant speed, and 100% uptime, GradeFlow has officially transitioned to our high-performance server.
        </p>

        {/* ── TWO PROFESSIONAL TRUST CARDS (GRID ON LAPTOP, STACKED ON MOBILE) ── */}
        <div className="gf-migration-cards-grid">
          {/* Card 1: 100% Student Trust & Data Safety */}
          <div className="gf-migration-card trust">
            <div className="gf-migration-card-header">
              <ShieldCheck size={17} color="#16a34a" strokeWidth={2.4} />
              <h3>Your Data is 100% Safe</h3>
            </div>
            <p className="gf-migration-card-body">
              All student records, semester grades, timetables, and analytics remain fully intact on our secure cloud database. <strong>Zero data has been reset or deleted.</strong>
            </p>
          </div>

          {/* Card 2: Actionable Migration & Bookmark Notice */}
          <div className="gf-migration-card transition">
            <div className="gf-migration-card-header">
              <CheckCircle2 size={17} color="#4f46e5" strokeWidth={2.4} />
              <h3>Please Use Our New Link</h3>
            </div>
            <p className="gf-migration-card-body">
              This old address will be phased out soon. Please <strong>save & bookmark our new link below</strong> so you can access GradeFlow directly next time!
            </p>
          </div>
        </div>

        {/* New URL Bar with Quick Copy */}
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
                <Check size={12} strokeWidth={2.5} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} strokeWidth={2} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Action Group (Student clicks when ready) */}
        <div className="gf-migration-cta-group">
          <button
            type="button"
            className="gf-migration-primary-action"
            onClick={handleRedirect}
          >
            <span>Open Upgraded Website Now</span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Clean Footer */}
      <div className="gf-migration-footer">
        <span>GradeFlow • Academic Analytics & Intelligence</span>
        <span>Secure Migration Protocol</span>
      </div>
    </div>
  );
}
