import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary component to catch React errors and display fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (could be sent to error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {this.props.title || 'Something went wrong'}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.props.message || 'An unexpected error occurred. Please try again.'}
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Show error details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-32">
                  <div className="font-bold mb-1">{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
