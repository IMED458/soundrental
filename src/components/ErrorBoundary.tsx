import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * A crash anywhere below this boundary used to unmount the whole tree and leave
 * a blank page. Show what happened — in both languages — and offer a reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[soundrental] render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen grid place-items-center bg-void px-6 text-center">
        <div className="max-w-lg space-y-4">
          <p className="text-[13px] tracking-[0.34em] text-accent">AUDIOKRAFT</p>
          <h1 className="font-display text-2xl text-ivory">
            გვერდი ვერ ჩაიტვირთა
            <span className="block text-base text-muted">Something went wrong</span>
          </h1>
          <p className="text-sm text-muted">{error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-void"
          >
            გვერდის განახლება · Reload
          </button>
        </div>
      </div>
    );
  }
}
