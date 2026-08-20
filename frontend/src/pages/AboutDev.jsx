import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  ArrowRight,
  ExternalLink,
  Mail,
  Globe,
  Code,
  BarChart2,
  Heart,
  Quote,
  MessageCircle,
  Award,
  Layers,
  Send,
  Zap,
} from "lucide-react";

/* ─── Custom Social SVG Icons ───────────────────────────────────── */
const LinkedInIcon = ({ size = 20, color = "#0a66c2" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GitHubIcon = ({ size = 20, color = "#0f172a" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const WhatsAppIcon = ({ size = 20, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export default function AboutDev() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const whatsappMessage = encodeURIComponent(
    "Hi Jagan, I checked out GradeFlow and wanted to connect with you!"
  );
  const whatsappUrl = `https://wa.me/919124540575?text=${whatsappMessage}`;

  return (
    <div
      style={{
        background: "#fcfdfe",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: isMobile ? 50 : 80,
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: isMobile ? "24px 16px" : "40px 32px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 32 : 48,
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            SECTION 1: HERO (Left Bio & Right Profile Portrait Halo)
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.15fr 1fr",
            gap: isMobile ? 32 : 56,
            alignItems: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
          className="gf-about-hero"
        >
          {/* Left Column: Developer Story & Bio */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20 }}
          >
            {/* Pill Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                borderRadius: 999,
                color: "#2563eb",
                fontSize: 12.5,
                fontWeight: 700,
                width: "fit-content",
              }}
            >
              <User size={13} color="#2563eb" />
              <span>The Developer Behind <span style={{ color: "#1e40af", fontWeight: 800 }}>GradeFlow</span></span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: isMobile ? "32px" : "clamp(38px, 4.4vw, 56px)",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.12,
                letterSpacing: "-1px",
                margin: 0,
              }}
            >
              Hi, I'm <span style={{ color: "#2563eb" }}>Jagan Parida</span>
            </h1>

            {/* Subtitle / Role Tagline */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: isMobile ? 13.5 : 15.5,
                fontWeight: 600,
                color: "#334155",
              }}
            >
              <span style={{ color: "#2563eb", fontWeight: 800, fontSize: 18 }}>—</span>
              <span>Developer • Problem Solver • Lifelong Learner</span>
            </div>

            {/* Story Paragraphs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, color: "#475569", fontSize: isMobile ? 14 : 15, lineHeight: 1.65 }}>
              <p style={{ margin: 0 }}>
                I built GradeFlow to solve a real problem I faced as a student—tracking academic performance across semesters was confusing and time-consuming. This tool is my way of giving back to the student community with something simple, powerful, and free.
              </p>
              <p style={{ margin: 0 }}>
                I'm passionate about building web applications that make life easier, smarter, and more efficient.
              </p>
            </div>

            {/* Handwritten Signature */}
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  fontFamily: "'Caveat', 'Dancing Script', 'Brush Script MT', cursive",
                  fontSize: isMobile ? 28 : 34,
                  fontWeight: 700,
                  color: "#2563eb",
                  letterSpacing: "1px",
                  display: "inline-block",
                  transform: "rotate(-3deg)",
                }}
              >
                Jagan Parida
              </span>
            </div>
          </motion.div>

          {/* Right Column: Halo Portrait & Floating Badges */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: isMobile ? 320 : 400,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Outer Circular Halo Rings */}
            <div
              style={{
                position: "absolute",
                width: isMobile ? 290 : 380,
                height: isMobile ? 290 : 380,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(240, 244, 255, 0) 70%)",
                border: "1px dashed rgba(37, 99, 235, 0.2)",
              }}
            />

            {/* Inner Profile Circle Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{
                position: "relative",
                width: isMobile ? 220 : 290,
                height: isMobile ? 220 : 290,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                boxShadow: "0 20px 45px rgba(37, 99, 235, 0.14), 0 0 0 8px rgba(255, 255, 255, 0.9)",
                overflow: "hidden",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="https://github.com/JaganParida.png"
                alt="Jagan Parida - Developer"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80";
                }}
              />
            </motion.div>

            {/* Floating Badge 1: Top Left Code Icon </> */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                position: "absolute",
                top: isMobile ? 15 : 40,
                left: isMobile ? 10 : 10,
                background: "#ffffff",
                borderRadius: 14,
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
              }}
            >
              <Code size={isMobile ? 16 : 18} color="#2563eb" />
            </motion.div>

            {/* Floating Badge 2: Bottom Right Analytics Icon */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                position: "absolute",
                bottom: isMobile ? 25 : 60,
                right: isMobile ? 10 : 15,
                background: "#ffffff",
                borderRadius: 14,
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
                color: "#2563eb",
              }}
            >
              <BarChart2 size={isMobile ? 16 : 20} />
            </motion.div>

            {/* Floating Card 3: Quote Card on Bottom Left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              style={{
                position: "absolute",
                bottom: isMobile ? -5 : 10,
                left: isMobile ? 5 : 0,
                background: "#ffffff",
                borderRadius: 16,
                padding: isMobile ? "10px 14px" : "14px 18px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
                maxWidth: isMobile ? 180 : 220,
                zIndex: 4,
              }}
            >
              <div style={{ color: "#2563eb", fontSize: 18, fontWeight: 800, lineHeight: 0.8, marginBottom: 4 }}>“</div>
              <p style={{ fontSize: isMobile ? 11 : 12.5, color: "#334155", lineHeight: 1.4, margin: "0 0 4px 0", fontWeight: 500 }}>
                Code is not just what I write, it's how I solve problems.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", color: "#8b5cf6" }}>
                <Heart size={13} fill="#8b5cf6" color="#8b5cf6" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: LET'S CONNECT & 4 SOCIAL CARDS
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #f1f5f9",
            borderRadius: 24,
            padding: isMobile ? "24px 18px" : "36px 36px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.1fr 2.4fr",
            gap: isMobile ? 24 : 32,
            alignItems: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
          className="gf-connect-grid"
        >
          {/* Left Block: Let's Connect CTA with WhatsApp */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={18} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Let's Connect
              </h3>
            </div>

            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.55, margin: 0, maxWidth: isMobile ? "100%" : 300 }}>
              I'm always open to new opportunities, collaborations and interesting conversations.
            </p>

            {/* Say Hello on WhatsApp Action Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                padding: "12px 22px",
                borderRadius: 12,
                background: "#25D366",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
                width: isMobile ? "100%" : "fit-content",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1ebc59";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 211, 102, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#25D366";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(37, 211, 102, 0.35)";
              }}
            >
              <WhatsAppIcon size={18} color="#ffffff" />
              <span>Say Hello on WhatsApp</span>
            </a>
          </div>

          {/* Right Block: 4 Social Cards in a 2x2 Grid on Mobile or 4x1 on Desktop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: 12,
              width: "100%",
            }}
            className="gf-social-cards"
          >
            {/* 1. LinkedIn */}
            <a
              href="https://www.linkedin.com/in/jagan-parida04/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: 16,
                padding: isMobile ? "14px 12px" : "18px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
              }}
            >
              <div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <LinkedInIcon size={18} color="#0a66c2" />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>
                  LinkedIn
                </h4>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.35 }}>
                  Professional profile
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563eb", fontSize: 12, fontWeight: 700 }}>
                Connect <ArrowRight size={12} />
              </div>
            </a>

            {/* 2. GitHub */}
            <a
              href="https://github.com/JaganParida"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: 16,
                padding: isMobile ? "14px 12px" : "18px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
              }}
            >
              <div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <GitHubIcon size={18} color="#0f172a" />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>
                  GitHub
                </h4>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.35 }}>
                  Code repositories
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563eb", fontSize: 12, fontWeight: 700 }}>
                Profile <ArrowRight size={12} />
              </div>
            </a>

            {/* 3. Portfolio */}
            <a
              href="https://www.jaganparida.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: 16,
                padding: isMobile ? "14px 12px" : "18px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
              }}
            >
              <div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "#f5f3ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                    color: "#8b5cf6",
                  }}
                >
                  <Globe size={18} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>
                  Portfolio
                </h4>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.35 }}>
                  Featured projects
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563eb", fontSize: 12, fontWeight: 700 }}>
                Explore <ArrowRight size={12} />
              </div>
            </a>

            {/* 4. Email */}
            <a
              href="mailto:jagan.parida.dev@gmail.com"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: 16,
                padding: isMobile ? "14px 12px" : "18px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
              }}
            >
              <div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                    color: "#ef4444",
                  }}
                >
                  <Mail size={18} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>
                  Email
                </h4>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.35 }}>
                  Drop a message
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563eb", fontSize: 12, fontWeight: 700 }}>
                Contact <ArrowRight size={12} />
              </div>
            </a>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: BOTTOM QUOTE BANNER
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: "#f8faff",
            border: "1px solid #edf2f7",
            borderRadius: 18,
            padding: isMobile ? "16px 18px" : "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            textAlign: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Quote size={18} color="#93c5fd" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: isMobile ? 13.5 : 15.5, fontWeight: 600, color: "#334155", margin: 0 }}>
            Striving to build digital experiences that create real impact.
          </p>
        </section>
      </div>
    </div>
  );
}

