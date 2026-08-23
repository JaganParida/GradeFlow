import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Server,
  UserCheck,
  Key,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Clock,
  ChevronRight,
  Fingerprint,
} from "lucide-react";

const SECURITY_LAYERS = [
  {
    id: "layer-otp",
    layerNumber: "Layer 01",
    icon: <Lock size={18} color="#2563eb" />,
    title: "Passwordless OTP Verification",
    shortTag: "Identity Gate",
    desc: "Authentication is verified via time-limited one-time passcodes delivered directly to authorized student university email addresses (@cutm.ac.in).",
    specs: [
      { label: "Token Expiry", val: "5 Minutes" },
      { label: "Channel", val: "Institutional Email" },
      { label: "Password Exposure", val: "0% (Zero Password)" },
    ],
    interactivePreview: (
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Student Identity Gate</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "2px 7px", borderRadius: 4 }}>Verified</span>
        </div>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Registered University ID</div>
          <div style={{ fontSize: 13.5, fontWeight: 750, color: "#0f172a" }}>23030112****@cutm.ac.in</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
          <CheckCircle2 size={14} />
          <span>One-Time Passcode validated with AES-256 secure hash</span>
        </div>
      </div>
    ),
  },
  {
    id: "layer-session",
    layerNumber: "Layer 02",
    icon: <Smartphone size={18} color="#059669" />,
    title: "Device-Aware Session Guardian",
    shortTag: "Session Protection",
    desc: "Active browser sessions are monitored with device fingerprinting and automated inactivity expiration to prevent unauthorized access.",
    specs: [
      { label: "Auto-Lock", val: "15 Min Inactivity" },
      { label: "Device Binding", val: "Encrypted Token" },
      { label: "Session Hijack", val: "Prevented" },
    ],
    interactivePreview: (
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Active Device Session</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "2px 7px", borderRadius: 4 }}>Active Session</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "#ffffff", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10.5, color: "#64748b" }}>Device Hash</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>0x9F4B...3A12</div>
          </div>
          <div style={{ background: "#ffffff", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10.5, color: "#64748b" }}>Inactivity Guard</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>Live &bull; 15m Window</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669", fontWeight: 600 }}>
          <CheckCircle2 size={14} />
          <span>Automated token invalidation on logout or session timeout</span>
        </div>
      </div>
    ),
  },
  {
    id: "layer-privacy",
    layerNumber: "Layer 03",
    icon: <Server size={18} color="#7c3aed" />,
    title: "Protected Academic Records",
    shortTag: "Data Privacy",
    desc: "Student academic records, SGPA marksheets, and transcript calculations remain strictly scoped to authenticated user identities with zero public indexing.",
    specs: [
      { label: "Public Search", val: "Zero Indexing" },
      { label: "Access Scope", val: "Strictly Scoped" },
      { label: "Third-Party Sharing", val: "0% Never Sold" },
    ],
    interactivePreview: (
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Academic Record Boundary</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", padding: "2px 7px", borderRadius: 4 }}>Private &bull; Encrypted</span>
        </div>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Marksheet &amp; CGPA Access Rule</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Bearer JWT Token verification on all API routes</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>
          <CheckCircle2 size={14} />
          <span>Strict server-side validation against tamper attempts</span>
        </div>
      </div>
    ),
  },
  {
    id: "layer-governance",
    layerNumber: "Layer 04",
    icon: <ShieldCheck size={18} color="#0f172a" />,
    title: "Administrative Governance",
    shortTag: "Access Governance",
    desc: "Administrative operations require multi-step verification and maintain immutable audit trails to safeguard institutional data integrity.",
    specs: [
      { label: "Admin Gate", val: "Multi-Factor Verification" },
      { label: "Audit Trails", val: "Immutable Logs" },
      { label: "Data Integrity", val: "100% Institutional" },
    ],
    interactivePreview: (
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>Admin Gate &amp; Audit Log</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>Audited</span>
        </div>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Audit Stream</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Timetable &amp; marks update logged with admin ID timestamp</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
          <CheckCircle2 size={14} />
          <span>Role-based access control with granular permission checks</span>
        </div>
      </div>
    ),
  },
];

export default function SecuritySection() {
  const [activeLayerId, setActiveLayerId] = useState("layer-otp");
  const currentLayer = SECURITY_LAYERS.find((l) => l.id === activeLayerId) || SECURITY_LAYERS[0];

  return (
    <section
      id="security"
      className="gf-landing-section"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "80px 24px",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <ShieldCheck size={15} strokeWidth={2.4} />
          <span>Security &amp; Trust Architecture</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 4.2vw, 46px)",
            fontWeight: 850,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            margin: "0 0 16px 0",
          }}
        >
          Your academic data belongs to you
        </h2>

        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 17px)",
            lineHeight: 1.6,
            color: "#64748b",
            margin: 0,
            textWrap: "balance",
          }}
        >
          GradeFlow is engineered with strict student privacy, device-aware session controls, and server-authorized data boundaries.
        </p>
      </div>

      {/* Interactive 4-Layer Security Workbench (Replaces plain static cards) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.3fr",
          gap: 28,
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
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: "1px solid",
                  borderColor: isActive ? "#2563eb" : "#e2e8f0",
                  background: isActive ? "#ffffff" : "#f8fafc",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 4px 16px rgba(37, 99, 235, 0.08)" : "none",
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {layer.layerNumber} &bull; {layer.shortTag}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>Active Layer &rarr;</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: isActive ? 800 : 650, color: "#0f172a", margin: 0 }}>
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
            padding: "32px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {currentLayer.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {currentLayer.layerNumber} Specification
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                {currentLayer.title}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px 0" }}>
            {currentLayer.desc}
          </p>

          {/* Key Specifications Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
            {currentLayer.specs.map((spec, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{spec.label}</div>
                <div style={{ fontSize: 12.5, fontWeight: 750, color: "#0f172a", marginTop: 2 }}>{spec.val}</div>
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
