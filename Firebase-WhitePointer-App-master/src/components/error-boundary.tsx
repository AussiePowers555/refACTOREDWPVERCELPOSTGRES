'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🚨 Error Boundary caught an error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    console.groupEnd();

    // Store error info for detailed display
    this.setState({ errorInfo });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportErrorToService(error, errorInfo, this.state.errorId);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-bold text-red-600">Application Error</h2>
                <p className="text-sm text-gray-500">Error ID: {this.state.errorId}</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">
              Sorry, something went wrong. This error has been logged and we're working to fix it.
            </p>

            <div className="mb-4 space-y-2">
              <button
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                onClick={this.retry}
              >
                Try Again
              </button>
              <button
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              <button
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </button>
            </div>

            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details (for developers)
              </summary>
              <div className="mt-3 space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Error Message:</h4>
                  <pre className="text-xs bg-red-50 p-2 rounded overflow-auto text-red-800">
                    {this.state.error.message}
                  </pre>
                </div>
                
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Component Stack:</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                
                {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Stack Trace:</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            <div className="text-xs text-gray-400 text-center">
              {process.env.NODE_ENV === 'development' ? 'Development Mode' : 'Production Mode'}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}