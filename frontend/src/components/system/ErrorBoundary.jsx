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
    // Auto-recover from stale chunks when a new deployment occurs
    const isChunkLoadError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("dynamically imported module") ||
      error?.message?.includes("Expected a JavaScript-or-Wasm module script");

    if (isChunkLoadError) {
      const alreadyReloaded = sessionStorage.getItem("gradeflow_auto_reloaded_chunk");
      if (!alreadyReloaded) {
        sessionStorage.setItem("gradeflow_auto_reloaded_chunk", "true");
        window.location.reload();
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
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <UnexpectedErrorState onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
