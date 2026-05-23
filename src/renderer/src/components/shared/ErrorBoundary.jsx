import React from "react";
import { useTranslation } from "react-i18next";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.t = props.t || ((key) => key); // Fallback if t not available in class component
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-100 font-sans">
          <div className="max-w-md w-full mx-4 p-8 bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-3xl">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-red-400">
                {this.t("errorBoundary.errorOccurred")}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {this.t("errorBoundary.errorDesc")}
              </p>
              {this.state.error && (
                <details className="w-full text-left mt-4">
                  <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                    {this.t("errorBoundary.viewErrorDetails")}
                  </summary>
                  <pre className="mt-2 p-4 bg-slate-950 rounded-xl text-xs text-red-400 overflow-auto max-h-40 font-mono">
                    {this.state.error.toString()}
                    {this.state.errorInfo &&
                      this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                {this.t("errorBoundary.refreshApp")}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
