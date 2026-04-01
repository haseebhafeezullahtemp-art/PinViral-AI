import React, { Component, ReactNode } from 'react';
import { Button } from './ui';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      let errorMessage = "The application encountered an unexpected error. Please try refreshing the page.";
      let errorDetails = null;

      try {
        // Try to parse FirestoreErrorInfo if it's a JSON string
        const error = (this as any).state.error;
        if (error && typeof error.message === 'string') {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore ${parsed.operationType} error: ${parsed.error}`;
            errorDetails = parsed;
          }
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="h-screen w-full bg-main-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-error/20 rounded-3xl flex items-center justify-center mb-6 border border-error/30">
            <AlertCircle className="text-error" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
          <p className="text-text-secondary max-w-md mb-4">
            {errorMessage}
          </p>
          {errorDetails && (
            <div className="bg-surface-bg p-4 rounded-xl text-left mb-8 max-w-lg w-full overflow-auto max-h-40 border border-border-primary">
              <p className="text-xs font-mono text-text-secondary mb-2 uppercase tracking-widest">Error Details</p>
              <pre className="text-[10px] text-text-secondary font-mono">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </div>
          )}
          <Button onClick={() => window.location.reload()} className="gap-2">
            Refresh Application
          </Button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
