import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  WifiOff,
  RefreshCw,
  Home as HomeIcon,
  Zap,
  Gamepad2,
  Trophy,
  Play,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRADEFLOW OFFLINE RUNNER MINI-GAME (Google Dino Style for Students)
 * ═══════════════════════════════════════════════════════════════════════════
 */
function OfflineRunnerGame() {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem("gf_offline_highscore") || "0", 10);
    } catch {
      return 0;
    }
  });

  const gameState = useRef({
    playerY: 0,
    playerVy: 0,
    isJumping: false,
    obstacles: [],
    frame: 0,
    speed: 4.5,
    score: 0,
    active: false,
  });

  const jump = () => {
    if (!gameState.current.active) {
      startGame();
      return;
    }
    if (!gameState.current.isJumping) {
      gameState.current.playerVy = -11;
      gameState.current.isJumping = true;
    }
  };

  const startGame = () => {
    gameState.current = {
      playerY: 0,
      playerVy: 0,
      isJumping: false,
      obstacles: [],
      frame: 0,
      speed: 4.5,
      score: 0,
      active: true,
    };
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const groundY = 120;
    const playerX = 50;
    const playerSize = 24;

    const loop = () => {
      const state = gameState.current;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Ground Line
      ctx.beginPath();
      ctx.moveTo(0, groundY + playerSize);
      ctx.lineTo(canvas.width, groundY + playerSize);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ground moving dots
      if (state.active) {
        state.frame++;
        const dotOffset = (state.frame * state.speed) % 20;
        ctx.fillStyle = "#94a3b8";
        for (let x = -dotOffset; x < canvas.width; x += 20) {
          ctx.fillRect(x, groundY + playerSize + 6, 4, 1.5);
        }
      }

      if (state.active) {
        // Physics update
        state.playerY += state.playerVy;
        state.playerVy += 0.65; // gravity

        if (state.playerY >= 0) {
          state.playerY = 0;
          state.playerVy = 0;
          state.isJumping = false;
        }

        // Spawn obstacles
        if (state.frame % Math.max(50, 110 - Math.floor(state.score / 20)) === 0 && Math.random() > 0.25) {
          state.obstacles.push({
            x: canvas.width,
            w: 16 + Math.floor(Math.random() * 8),
            h: 22 + Math.floor(Math.random() * 12),
          });
        }

        // Update score & speed
        state.score += 0.1;
        setScore(Math.floor(state.score));
        state.speed = 4.5 + Math.min(4, state.score * 0.015);

        // Move obstacles & collision check
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.speed;

          // Draw obstacle (Books / Obstacle)
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.roundRect(obs.x, groundY + playerSize - obs.h, obs.w, obs.h, 4);
          ctx.fill();

          // Obstacle spine details
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(obs.x + 3, groundY + playerSize - obs.h + 4, obs.w - 6, 2);

          // Collision detection
          const curPlayerY = groundY + state.playerY;
          if (
            playerX + playerSize - 6 > obs.x &&
            playerX + 6 < obs.x + obs.w &&
            curPlayerY + playerSize > groundY + playerSize - obs.h
          ) {
            // GAME OVER
            state.active = false;
            setIsPlaying(false);
            setGameOver(true);
            const finalScore = Math.floor(state.score);
            if (finalScore > highScore) {
              setHighScore(finalScore);
              try {
                localStorage.setItem("gf_offline_highscore", String(finalScore));
              } catch {}
            }
          }

          // Remove offscreen
          if (obs.x + obs.w < 0) {
            state.obstacles.splice(i, 1);
          }
        }
      }

      // Draw Player (GradeFlow Cap / Student Avatar)
      const pY = groundY + state.playerY;
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.roundRect(playerX, pY, playerSize, playerSize, 6);
      ctx.fill();

      // Cap / Face highlight
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(playerX + 8, pY + 10, 2.5, 0, Math.PI * 2);
      ctx.arc(playerX + 16, pY + 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(playerX + 9, pY + 10, 1.2, 0, Math.PI * 2);
      ctx.arc(playerX + 17, pY + 10, 1.2, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore]);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        padding: "20px 24px",
        maxWidth: 580,
        width: "100%",
        boxShadow: "0 6px 24px rgba(15, 23, 42, 0.04)",
        boxSizing: "border-box",
        margin: "20px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Game Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Gamepad2 size={18} color="#2563eb" />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
            GradeFlow Offline Runner
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748b", fontWeight: 700 }}>
            <Trophy size={14} color="#f59e0b" />
            <span>HI: {highScore}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#2563eb", fontFamily: "monospace" }}>
            SCORE: {score}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        onClick={jump}
        style={{
          width: "100%",
          cursor: "pointer",
          position: "relative",
          background: "#f8fafc",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #f1f5f9",
          userSelect: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          width={532}
          height={160}
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {/* Start / Game Over Overlay */}
        {!isPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(2px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              {gameOver ? "Game Over! 💥" : "Waiting for connection? 🚀"}
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
              {gameOver ? "Tap or press Space to try again" : "Press Space or Tap anywhere to jump & dodge obstacles"}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              style={{
                marginTop: 6,
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "6px 16px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
              }}
            >
              {gameOver ? <RotateCcw size={14} /> : <Play size={14} />}
              <span>{gameOver ? "Play Again" : "Start Game"}</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8 }}>
        💡 Tip: Tap screen on mobile or hit <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, color: "#334155" }}>Space</kbd> on keyboard to jump
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OFFLINE FULL PAGE (With Google-Style Animated Runner Game)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export default function OfflinePage({ onRetry }) {
  const { hasActiveSession, currentRegNo } = useApp();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/favicon.ico?t=" + Date.now(), { method: "HEAD", cache: "no-store" });
      if (res.ok) {
        setTestResult("online");
        if (onRetry) onRetry();
        else window.location.reload();
      } else {
        setTestResult("offline");
      }
    } catch {
      setTestResult("offline");
    } finally {
      setTimeout(() => setTesting(false), 800);
    }
  };

  return (
    <div
      style={{
        minHeight: "90vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px 60px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "radial-gradient(ellipse at 50% 25%, rgba(245, 158, 11, 0.05) 0%, #fcfdfe 70%)",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Status Badge ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fffbeb",
          border: "1px solid #fde68a",
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#92400e",
          marginBottom: 12,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
        NO INTERNET DETECTED &bull; WORKING OFFLINE
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 8px 0",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
        }}
      >
        You're Currently Offline
      </motion.h1>

      {/* ── Subtitle ── */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.55,
          maxWidth: 480,
          margin: "0 0 16px 0",
        }}
      >
        Your connection is unavailable. Play our offline mini-game while we wait for your internet connection to restore!
      </motion.p>

      {/* ── Interactive Google-Style Dino Runner Mini-Game ── */}
      <OfflineRunnerGame />

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}
      >
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            cursor: testing ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
          }}
        >
          <RefreshCw size={15} className={testing ? "gf-spin" : ""} />
          <span>{testing ? "Testing Ping..." : "Check Connection & Retry"}</span>
        </button>

        {hasActiveSession && (
          <Link
            to={`/dashboard/${currentRegNo}`}
            className="gf-state-btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 650,
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              textDecoration: "none",
            }}
          >
            <HomeIcon size={15} />
            <span>View Cached Dashboard</span>
          </Link>
        )}
      </motion.div>

      {testResult === "offline" && (
        <span style={{ fontSize: 13, color: "#dc2626", marginTop: 14, fontWeight: 600 }}>
          ⚠️ Still offline. Make sure your Wi-Fi or mobile data is turned on.
        </span>
      )}
    </div>
  );
}
