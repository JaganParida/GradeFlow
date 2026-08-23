import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { encodeStudentId } from "../utils/studentIdEncoder";

// Modular Landing Page Section Components
import HeroSection from "../components/landing/HeroSection";
import CapabilityStrip from "../components/landing/CapabilityStrip";
import BentoIntro from "../components/landing/BentoIntro";
import PredictorSection from "../components/landing/PredictorSection";
import PlacementSection from "../components/landing/PlacementSection";
import DomainIntelligenceSection from "../components/landing/DomainIntelligenceSection";
import TimetableAttendanceSection from "../components/landing/TimetableAttendanceSection";
import LeaderboardSection from "../components/landing/LeaderboardSection";
import GradeSheetSection from "../components/landing/GradeSheetSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import ProductTourSection from "../components/landing/ProductTourSection";
import SecuritySection from "../components/landing/SecuritySection";
import FaqSection from "../components/landing/FaqSection";
import FinalCtaSection from "../components/landing/FinalCtaSection";
import LandingFooter from "../components/landing/LandingFooter";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    studentData,
    studentSession,
    hasActiveSession,
    authChecking,
    openStudentAuthModal,
  } = useApp();

  const currentRegNo = studentData?.regNo || studentSession?.regNo || "";

  // Handle URL hash scrolling
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location.hash]);

  const handleNavigateSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleExplore = () => {
    handleNavigateSection("features");
  };

  const handleLogin = () => {
    if (authChecking) return;
    openStudentAuthModal();
  };

  const handleDashboard = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate(`/dashboard/${encodeStudentId(currentRegNo)}`);
    } else {
      openStudentAuthModal({ type: "dashboard" });
    }
  };

  const handleTimetable = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate(`/timetable/${encodeStudentId(currentRegNo)}`);
    } else {
      openStudentAuthModal({ type: "timetable" });
    }
  };

  const handleAttendance = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate(`/attendance/${encodeStudentId(currentRegNo)}`);
    } else {
      openStudentAuthModal({ type: "attendance" });
    }
  };

  const handlePredictor = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate(`/analytics/${encodeStudentId(currentRegNo)}?tab=predictor`);
    } else {
      openStudentAuthModal({ type: "analytics", tab: "predictor" });
    }
  };

  const handleAnalytics = (tab = "overview") => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      const query = tab ? `?tab=${encodeURIComponent(tab)}` : "";
      navigate(`/analytics/${encodeStudentId(currentRegNo)}${query}`);
    } else {
      openStudentAuthModal({ type: "analytics", tab });
    }
  };

  const handlePlacement = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate(`/analytics/${encodeStudentId(currentRegNo)}?tab=placement`);
    } else {
      openStudentAuthModal({ type: "analytics", tab: "placement" });
    }
  };

  const handleDomains = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate(`/analytics/${encodeStudentId(currentRegNo)}?tab=mastery`);
    } else {
      openStudentAuthModal({ type: "analytics", tab: "mastery" });
    }
  };

  const handleGradeSheet = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate(`/analytics/${encodeStudentId(currentRegNo)}?tab=grades`);
    } else {
      openStudentAuthModal({ type: "analytics", tab: "grades" });
    }
  };

  const handleLeaderboard = () => {
    if (authChecking) return;
    if (hasActiveSession && currentRegNo) {
      navigate("/leaderboard");
    } else {
      openStudentAuthModal({ type: "leaderboard" });
    }
  };

  return (
    <div
      className="gf-landing-page"
      style={{
        background: "#fcfdfe",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Hero Section (2-Column Split with Animated Report Card) */}
      <HeroSection
        hasActiveSession={hasActiveSession}
        currentRegNo={currentRegNo}
        onExplore={handleExplore}
        onLogin={handleLogin}
        onDashboard={handleDashboard}
      />

      {/* 2. Capability Strip */}
      <CapabilityStrip />

      {/* 3. Feature Architecture Grid (Pinterest Masonry with Protected Accurate Data Routing) */}
      <BentoIntro
        onNavigateSection={handleNavigateSection}
        onOpenAnalytics={() => handleAnalytics("overview")}
        onOpenPredictor={handlePredictor}
        onOpenPlacement={handlePlacement}
        onOpenDomains={handleDomains}
        onOpenTimetable={handleTimetable}
        onOpenAttendance={handleAttendance}
        onOpenLeaderboard={handleLeaderboard}
        onOpenGradeSheet={handleGradeSheet}
      />

      {/* Desktop In-Depth Workbenches (Hidden on Mobile to Keep Scroll Fast & Snappy) */}
      <div className="gf-desktop-only">
        {/* 4. Grade Predictor / What-If */}
        <PredictorSection onOpenPredictorTool={handlePredictor} />

        {/* 5. Placement Readiness */}
        <PlacementSection />

        {/* 6. Credit / Domain Intelligence */}
        <DomainIntelligenceSection />
      </div>

      {/* 8. Class Timetable & Attendance Intelligence (High Daily Value on Mobile) */}
      <TimetableAttendanceSection
        onOpenTimetable={handleTimetable}
        onOpenAttendance={handleAttendance}
      />

      {/* Desktop Secondary Modules (Hidden on Mobile to Prevent Infinite Scroll Fatigue) */}
      <div className="gf-desktop-only">
        {/* 9. Leaderboard */}
        <LeaderboardSection onOpenLeaderboard={handleLeaderboard} />

        {/* 10. Grade Sheet Generator */}
        <GradeSheetSection />

        {/* 11. How GradeFlow Works */}
        <HowItWorksSection />

        {/* 12. Interactive Product Tour */}
        <ProductTourSection />

        {/* 13. Security / Trust */}
        <SecuritySection />
      </div>

      {/* 14. FAQ (Optimized & Visible on All Devices) */}
      <FaqSection />

      {/* 15. Final CTA */}
      <FinalCtaSection
        hasActiveSession={hasActiveSession}
        currentRegNo={currentRegNo}
        onOpenApp={handleDashboard}
        onLogin={handleLogin}
      />

      {/* 17. Footer */}
      <LandingFooter onNavigateSection={handleNavigateSection} />
    </div>
  );
}
