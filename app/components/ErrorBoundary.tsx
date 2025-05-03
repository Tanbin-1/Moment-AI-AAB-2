import React, { Component, ErrorInfo, ReactNode } from "react";
import ErrorFallback from './ErrorFallback';
import { View, Text } from "react-native";

interface Props {
  children: ReactNode;
  isDarkMode?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service here
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Render fallback UI
      return (
        <ErrorFallback 
          error={this.state.error} 
          resetError={this.resetError}
          isDarkMode={this.props.isDarkMode}
        />
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
