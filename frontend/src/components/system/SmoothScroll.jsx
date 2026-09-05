import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * One Lenis instance for the full application. It intentionally respects the
 * operating-system reduced-motion preference and cleans up on hot reload.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reduceMotion?.matches) return undefined;

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.15,
      autoRaf: false,
      allowNestedScroll: true,
    });

    let animationFrameId;
    const raf = (time) => {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    };
    animationFrameId = requestAnimationFrame(raf);

    const resetScroll = () => lenis.scrollTo(0, { immediate: true, force: true });
    window.addEventListener("gradeflow:scroll-top", resetScroll);

    return () => {
      window.removeEventListener("gradeflow:scroll-top", resetScroll);
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return null;
}
