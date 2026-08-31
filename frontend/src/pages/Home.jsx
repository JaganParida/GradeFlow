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
    waitForAuthResolution,
    openStudentAuthModal,
    fetchStudent,
  } = useApp();

  const currentRegNo = studentSession?.regNo || "";

  // Auto-restore session studentData when returning to Home
  useEffect(() => {
    if (studentSession?.regNo && studentData?.regNo !== studentSession.regNo) {
      fetchStudent(studentSession.regNo);
    }
  }, [studentSession?.regNo, studentData?.regNo]);

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

  const goToProtectedDestination = async (destination) => {
    // Do not use the initial empty React state as an auth decision. Wait for
    // the HTTP-only cookie bootstrap, then use its resolved session directly.
    const resolvedSession = await waitForAuthResolution();
    const regNo = resolvedSession?.regNo || currentRegNo;
    if (!regNo) {
      openStudentAuthModal(destination);
      return;
    }

    const encodedId = encodeStudentId(regNo);
    if (destination.type === "leaderboard") {
      navigate("/leaderboard");
    } else if (destination.type === "timetable") {
      navigate(`/timetable/${encodedId}`);
    } else if (destination.type === "attendance") {
      navigate(`/attendance/${encodedId}`);
    } else if (destination.type === "analytics") {
      const query = destination.tab ? `?tab=${encodeURIComponent(destination.tab)}` : "";
      navigate(`/analytics/${encodedId}${query}`);
    } else {
      const query = destination.tab ? `?tab=${encodeURIComponent(destination.tab)}` : "";
      navigate(`/dashboard/${encodedId}${query}`);
    }
  };

  const handleLogin = async () => {
    const resolvedSession = await waitForAuthResolution();
    if (resolvedSession?.regNo) {
      navigate(`/dashboard/${encodeStudentId(resolvedSession.regNo)}`);
      return;
    }
    openStudentAuthModal();
  };

  const handleDashboard = () => goToProtectedDestination({ type: "dashboard" });
  const handleTimetable = () => goToProtectedDestination({ type: "timetable" });
  const handleAttendance = () => goToProtectedDestination({ type: "attendance" });
  const handlePredictor = () => goToProtectedDestination({ type: "analytics", tab: "predictor" });
  const handleAnalytics = (tab = "overview") => goToProtectedDestination({ type: "analytics", tab });
  const handlePlacement = () => goToProtectedDestination({ type: "analytics", tab: "placement" });
  const handleDomains = () => goToProtectedDestination({ type: "analytics", tab: "mastery" });
  const handleGradeSheet = () => goToProtectedDestination({ type: "analytics", tab: "grades" });
  const handleDegreeProgress = () => goToProtectedDestination({ type: "dashboard", tab: "baskets" });
  const handleLeaderboard = () => goToProtectedDestination({ type: "leaderboard" });

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
        authChecking={authChecking}
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
        onOpenDegreeProgress={handleDegreeProgress}
        onOpenTimetable={handleTimetable}
        onOpenAttendance={handleAttendance}
        onOpenLeaderboard={handleLeaderboard}
      />

      {/* 4. Grade Predictor / What-If Simulation Lab */}
      <PredictorSection onOpenPredictorTool={handlePredictor} />

      {/* 5. Placement Intelligence Matrix */}
      <PlacementSection onOpenPlacement={handlePlacement} />

      {/* 6. 160-Credit Degree Framework & Baskets */}
      <DomainIntelligenceSection onOpenDegreeProgress={handleDegreeProgress} />

      {/* 7. Class Timetable & Attendance Intelligence */}
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
        authChecking={authChecking}
        onOpenApp={handleDashboard}
        onLogin={handleLogin}
      />

      {/* 17. Footer */}
      <LandingFooter onNavigateSection={handleNavigateSection} />
    </div>
  );
}
