import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
            <div className="flex h-screen items-center justify-center p-4">
                <div className="bg-red-50 border-red-200 border p-6 rounded-lg max-w-lg w-full">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
                    <p className="text-sm text-gray-700 mb-4">
                        {this.state.error?.message || "An unexpected error occurred."}
                    </p>
                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
