// src/components/ErrorBoundary.tsx
// Route-level error boundary. Catches render errors so one broken page
// does not crash the entire app.

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{ fontFamily: 'sans-serif' }}
          className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-[#0a0705] text-[#e8dcc8]"
        >
          <h2 className="text-2xl font-semibold text-red-400 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted/60 mb-6">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            className="px-6 py-2 border border-[#c9a96e]/40 text-[#c9a96e] text-sm hover:bg-[#c9a96e]/10 transition-colors rounded"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

