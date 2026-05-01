import React from 'react';
import { Button } from '../ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Intentional: surface to console; production telemetry is added later.
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="mx-auto my-12 max-w-md rounded-lg border border-[color:var(--border-standard)] bg-[color:var(--bg-surface)] p-6 text-[color:var(--text-primary)] shadow-md"
      >
        <h2 className="mb-2 text-lg font-semibold">문제가 발생했습니다</h2>
        <p className="mb-4 text-sm text-[color:var(--text-secondary)]">
          {this.state.error.message}
        </p>
        <Button onClick={this.reset} variant="default">
          다시 시도
        </Button>
      </div>
    );
  }
}
