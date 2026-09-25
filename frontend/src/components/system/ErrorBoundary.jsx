import React from "react";
import { UnexpectedErrorState } from "./SystemState";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorStr = (error?.message || "") + " " + (error?.name || "") + " " + String(error || "");
    const isChunkLoadError =
      error?.name === "ChunkLoadError" ||
      errorStr.includes("Failed to fetch dynamically imported module") ||
      errorStr.includes("dynamically imported module") ||
      errorStr.includes("Expected a JavaScript-or-Wasm module script") ||
      errorStr.includes("Unexpected token '<'") ||
      errorStr.includes("text/html");

    if (isChunkLoadError) {
      const lastReload = Number(sessionStorage.getItem("gradeflow_auto_reloaded_chunk") || 0);
      if (Date.now() - lastReload > 8000) {
        sessionStorage.setItem("gradeflow_auto_reloaded_chunk", String(Date.now()));
        try {
          if ("caches" in window) {
            caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
          }
        } catch (_) {}
        const url = new URL(window.location.href);
        url.searchParams.set("_v", String(Date.now()));
        window.location.replace(url.toString());
        return;
      }
    }

    console.error("GradeFlow UI Error Boundary caught an error:", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReset = () => {
    sessionStorage.removeItem("gradeflow_auto_reloaded_chunk");
    try {
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } catch (_) {}
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      const url = new URL(window.location.origin + "/");
      url.searchParams.set("_r", String(Date.now()));
      window.location.replace(url.toString());
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const err = this.state.error;
      const errorStr = (err?.message || "") + " " + (err?.name || "") + " " + String(err || "");
      const isChunkLoadError =
        err?.name === "ChunkLoadError" ||
        errorStr.includes("Failed to fetch dynamically imported module") ||
        errorStr.includes("dynamically imported module") ||
        errorStr.includes("Expected a JavaScript-or-Wasm module script") ||
        errorStr.includes("Unexpected token '<'") ||
        errorStr.includes("text/html");

      return (
        <UnexpectedErrorState
          isChunkError={isChunkLoadError}
          onReset={this.handleReset}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

