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
    // Log diagnostics safely on client side without exposing secrets
    console.error("GradeFlow UI Error Boundary caught an error:", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReset = () => {
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
