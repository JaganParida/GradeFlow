import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Server,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Fingerprint,
  Radio,
  ArrowRight,
  RefreshCw,
  Laptop,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

export default function SecuritySection() {
  const [activeLayerId, setActiveLayerId] = useState("layer-auth");
  const [authDemoMode, setAuthDemoMode] = useState("standard"); // "standard" | "lockout"
  const [sessionDemoMode, setSessionDemoMode] = useState("active"); // "active" | "transfer"
  const [approvalAction, setApprovalAction] = useState(null); // null | "approved" | "denied"

  const SECURITY_LAYERS = [
    {
      id: "layer-auth",
      layerNumber: "Layer 01",
      icon: <KeyRound size={18} color="#2563eb" />,
      title: "Credential & Recovery Gate",
      shortTag: "Identity & Defense Gate",
      desc: "Student accounts are secured with mandatory 12-round bcrypt passwords, a strict 3-attempt brute-force defense protocol, and dedicated 5-minute single-use email recovery codes (@centurionuniv.edu.in).",
      specs: [
        { label: "Hash Engine", val: "Bcrypt (12 Salt Rounds)" },
        { label: "Brute-Force Guard", val: "Attempt-Limited Lockout" },
        { label: "Recovery Token", val: "5-Min Single-Use OTP" },
      ],
      interactivePreview: (
        <div style={{ background: "#f8fafc", padding: "clamp(14px, 2.5vw, 18px)", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          {/* Header & Mode Switcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Student Identity Gate</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Interactive Defense Simulator</div>
            </div>
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "2px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => setAuthDemoMode("standard")}
                style={{
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: authDemoMode === "standard" ? "#ffffff" : "transparent",
                  color: authDemoMode === "standard" ? "#2563eb" : "#64748b",
                  boxShadow: authDemoMode === "standard" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Standard Gate
              </button>
              <button
                type="button"
                onClick={() => setAuthDemoMode("lockout")}
                style={{
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: authDemoMode === "lockout" ? "#ffffff" : "transparent",
                  color: authDemoMode === "lockout" ? "#dc2626" : "#64748b",
                  boxShadow: authDemoMode === "lockout" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                3-Attempt Defense
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {authDemoMode === "standard" ? (
              <motion.div
                key="standard"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Registered University ID</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>Password Active</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", fontFamily: "'Space Mono', monospace", wordBreak: "break-all" }}>
                    230301120•••@centurionuniv.edu.in
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11, color: "#475569" }}>
                    <Lock size={12} color="#2563eb" />
                    <span>Bcrypt (12 salt rounds) &bull; Brute-force rate shield active</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#2563eb", fontWeight: 600 }}>
                    <CheckCircle2 size={13} />
                    <span>Protected credential gate with automatic attempt monitoring</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthDemoMode("lockout")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <span>Simulate Failed Attempts</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="lockout"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ background: "#fef2f2", padding: "12px 14px", borderRadius: 8, border: "1px solid #fecaca", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#991b1b", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} color="#dc2626" />
                      <span>Security Defense Triggered</span>
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#dc2626", background: "#fee2e2", border: "1px solid #fca5a5", padding: "1px 6px", borderRadius: 999 }}>
                      Attempt Threshold Reached
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#7f1d1d", lineHeight: 1.4 }}>
                    Password login suspended. Dedicated recovery OTP dispatched to student email with strict <strong>5-minute validity</strong>.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11, color: "#b91c1c", fontWeight: 600 }}>
                    <Clock size={12} />
                    <span>Anti-bypass active &bull; Locks for 24h if unverified &bull; Resets on OTP verification</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#dc2626", fontWeight: 600 }}>
                    <CheckCircle2 size={13} />
                    <span>Anti-bypass locks Page 1 to dedicated recovery flow</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthDemoMode("standard")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <span>Reset to Standard Gate</span>
                    <RefreshCw size={10} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      id: "layer-session",
      layerNumber: "Layer 02",
      icon: <Smartphone size={18} color="#059669" />,
      title: "Device Guardian & In-App Approval",
      shortTag: "Session Protection",
      desc: "Enforces a strict 1-device active quota per student. New device login attempts trigger real-time in-app WebSocket transfer approvals on the active device with live countdown timers and instant revocation.",
      specs: [
        { label: "Device Quota", val: "1 Active Device (Strict)" },
        { label: "Transfer Protocol", val: "Real-Time In-App Approval" },
        { label: "Session Transport", val: "Secure HttpOnly Cookie" },
      ],
      interactivePreview: (
        <div style={{ background: "#f8fafc", padding: "clamp(14px, 2.5vw, 18px)", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Active Session Guardian</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Single-Device Policy &bull; Live Handshake</div>
            </div>
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "2px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => { setSessionDemoMode("active"); setApprovalAction(null); }}
                style={{
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: sessionDemoMode === "active" ? "#ffffff" : "transparent",
                  color: sessionDemoMode === "active" ? "#059669" : "#64748b",
                  boxShadow: sessionDemoMode === "active" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Active Device
              </button>
              <button
                type="button"
                onClick={() => { setSessionDemoMode("transfer"); setApprovalAction(null); }}
                style={{
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: sessionDemoMode === "transfer" ? "#ffffff" : "transparent",
                  color: sessionDemoMode === "transfer" ? "#2563eb" : "#64748b",
                  boxShadow: sessionDemoMode === "transfer" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                2nd Device Transfer
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {sessionDemoMode === "active" ? (
              <motion.div
                key="active-sess"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 10 }}>
                  <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10.5, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                      <Laptop size={11} color="#059669" />
                      <span>Authorized Device</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 750, color: "#0f172a", marginTop: 2 }}>MacBook Pro &bull; Chrome</div>
                  </div>
                  <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10.5, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                      <Fingerprint size={11} color="#059669" />
                      <span>Session Fingerprint</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 750, color: "#0f172a", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>0x9F4B...3A12</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#059669", fontWeight: 600 }}>
                    <CheckCircle2 size={13} />
                    <span>Cryptographic session binding prevents concurrent multi-user abuse</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSessionDemoMode("transfer")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <span>Simulate 2nd Device Attempt</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="transfer-sess"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 8, border: "1px solid #bfdbfe", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Radio size={13} color="#2563eb" />
                      <span style={{ fontSize: 12, fontWeight: 750, color: "#1e40af" }}>Incoming Approval Request</span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 750, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "1px 6px", borderRadius: 999, fontFamily: "'Space Mono', monospace" }}>
                      Expires 02:48
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#334155", lineHeight: 1.4, marginBottom: 8 }}>
                    <strong>iPhone 15 (Safari • Mobile)</strong> requested device login.
                  </div>

                  {approvalAction === null ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setApprovalAction("approved")}
                        style={{
                          flex: "1 1 120px",
                          padding: "6px 10px",
                          background: "#059669",
                          color: "#fff",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 11,
                          fontWeight: 750,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                        <span>Approve Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setApprovalAction("denied")}
                        style={{
                          flex: "1 1 120px",
                          padding: "6px 10px",
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 750,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <X size={12} strokeWidth={3} />
                        <span>Deny &amp; Keep Current</span>
                      </button>
                    </div>
                  ) : approvalAction === "approved" ? (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle2 size={12} color="#16a34a" />
                      <span>Approved! Active session handed over to iPhone 15 smoothly.</span>
                    </div>
                  ) : (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#991b1b", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertCircle size={12} color="#dc2626" />
                      <span>Denied! Incoming device login was blocked instantly.</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#2563eb", fontWeight: 600 }}>
                    <CheckCircle2 size={13} />
                    <span>Real-time Ably WebSocket signaling enables instant device handovers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSessionDemoMode("active"); setApprovalAction(null); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <span>Reset</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      id: "layer-privacy",
      layerNumber: "Layer 03",
      icon: <Server size={18} color="#7c3aed" />,
      title: "Protected Academic Records",
      shortTag: "Data Privacy & Scoping",
      desc: "Grade calculations, semester marksheets, SGPA curves, and domain track records remain strictly scoped to verified student sessions with zero public crawling and tamper-proof server boundaries.",
      specs: [
        { label: "Public Exposure", val: "Zero Indexing (Private)" },
        { label: "Route Security", val: "Scoped HttpOnly Tokens" },
        { label: "Data Integrity", val: "Server-Signed Boundary" },
      ],
      interactivePreview: (
        <div style={{ background: "#f8fafc", padding: "clamp(14px, 2.5vw, 18px)", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Academic Record Boundary</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", padding: "2px 7px", borderRadius: 4 }}>Private &bull; Encrypted</span>
          </div>
          <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>Marksheet &amp; CGPA Access Rule</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>Scoped HttpOnly cookie session verification on all API routes</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10.5, color: "#475569", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>Robots: Noindex</span>
              <span style={{ fontSize: 10.5, color: "#475569", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>Zero Public Search</span>
              <span style={{ fontSize: 10.5, color: "#475569", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>Tamper-Proof HMAC</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            <span>Strict server-side validation against unauthorized cross-student queries</span>
          </div>
        </div>
      ),
    },
    {
      id: "layer-governance",
      layerNumber: "Layer 04",
      icon: <ShieldCheck size={18} color="#0f172a" />,
      title: "Administrative Governance",
      shortTag: "RBAC & Audit Stream",
      desc: "Institutional administration enforces multi-tier role-based access control (Super Admin, Faculty, Evaluators) with immutable audit streams for marks uploads, timetable changes, and student session controls.",
      specs: [
        { label: "Access Control", val: "Granular Multi-Tier RBAC" },
        { label: "Audit Stream", val: "100% Immutable Log" },
        { label: "Rate Guard", val: "Intelligent DDoS Throttling" },
      ],
      interactivePreview: (
        <div style={{ background: "#f8fafc", padding: "clamp(14px, 2.5vw, 18px)", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Admin Gate &amp; Audit Log</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>Audited &bull; Immutable</span>
          </div>
          <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>Live Institutional Audit Stream</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
              [LOG-9418] Curriculum &amp; marks update recorded &bull; Admin ID verified
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
              Multi-step administrative validation with automated rate-limiting defense
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            <span>Role-based access control with granular permission checks &amp; audit tracking</span>
          </div>
        </div>
      ),
    },
  ];

  const currentLayer = SECURITY_LAYERS.find((l) => l.id === activeLayerId) || SECURITY_LAYERS[0];

  return (
    <section
      id="security"
      className="gf-landing-section"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(48px, 8vw, 80px) clamp(16px, 4vw, 24px)",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto clamp(32px, 5vw, 48px)" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            color: "#2563eb",
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            padding: "4px 12px",
            borderRadius: 999,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          <ShieldCheck size={14} strokeWidth={2.4} />
          <span>Security &amp; Trust Architecture</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(26px, 4.2vw, 44px)",
            fontWeight: 850,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            margin: "0 0 16px 0",
          }}
        >
          Your academic data belongs to you
        </h2>

        <p
          style={{
            fontSize: "clamp(14.5px, 1.8vw, 16.5px)",
            lineHeight: 1.6,
            color: "#64748b",
            margin: 0,
            textWrap: "balance",
          }}
        >
          GradeFlow is engineered with strict student privacy, mandatory bcrypt passwords, device-aware session controls, and server-authorized data boundaries.
        </p>
      </div>

      {/* Interactive 4-Layer Security Workbench */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.3fr",
          gap: 24,
          alignItems: "start",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-editorial-split"
      >
        {/* Left Side: 4 Security Layers Interactive Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SECURITY_LAYERS.map((layer) => {
            const isActive = layer.id === activeLayerId;
            return (
              <div
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "clamp(12px, 2.5vw, 16px) clamp(14px, 3vw, 20px)",
                  borderRadius: 12,
                  border: "1.5px solid",
                  borderColor: isActive ? "#2563eb" : "#e2e8f0",
                  background: isActive ? "#ffffff" : "#f8fafc",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 6px 20px rgba(37, 99, 235, 0.1)" : "none",
                  transition: "all 0.18s ease",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isActive ? "#eff6ff" : "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {layer.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {layer.layerNumber} &bull; {layer.shortTag}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: 11, fontWeight: 750, color: "#2563eb" }}>Active Layer &rarr;</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "clamp(14px, 2vw, 15px)", fontWeight: isActive ? 800 : 650, color: "#0f172a", margin: 0 }}>
                    {layer.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Security Blueprint Detail */}
        <div
          style={{
            background: "#ffffff",
            padding: "clamp(20px, 3.5vw, 32px)",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {currentLayer.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {currentLayer.layerNumber} Specification
              </div>
              <div style={{ fontSize: "clamp(16px, 2.5vw, 18px)", fontWeight: 800, color: "#0f172a" }}>
                {currentLayer.title}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "clamp(13px, 1.8vw, 14px)", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px 0" }}>
            {currentLayer.desc}
          </p>

          {/* Key Specifications Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))", gap: 10, marginBottom: 20 }}>
            {currentLayer.specs.map((spec, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>{spec.label}</div>
                <div style={{ fontSize: 12, fontWeight: 750, color: "#0f172a", marginTop: 2, wordBreak: "break-word" }}>{spec.val}</div>
              </div>
            ))}
          </div>

          {/* Interactive Simulation Sandbox */}
          {currentLayer.interactivePreview}
        </div>
      </div>
    </section>
  );
}
