import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  const handleHardReset = () => {
    try {
      localStorage.removeItem('creatorpulse:clientState');
      localStorage.removeItem('creatorpulse:lastContentId');
      localStorage.removeItem('creatorpulse:customChannel');
    } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#20243b] text-[#f2eedf] p-6">
      <div className="max-w-lg w-full text-center rounded-2xl border border-[#3c415e] bg-[#292d47] p-8 shadow-xl">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[#a0a2b0]">
          {error.message || "This part of the app encountered an unexpected state."}
        </p>
        
        {error.stack && (
          <pre className="mt-4 max-h-32 overflow-x-auto rounded-xl bg-[#1a1d30] p-3 text-left font-mono text-[11px] text-red-300/90 border border-red-500/20">
            {error.stack.split("\n").slice(0, 4).join("\n")}
          </pre>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={resetError}
            className="rounded-xl bg-[#d8f66a] px-5 py-2.5 text-xs font-bold text-[#20243b] hover:bg-[#c9e859] transition-all"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={handleHardReset}
            className="rounded-xl border border-[#3c415e] bg-[#20243b] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#343959] transition-all"
          >
            Reset Workspace & Reload
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
