import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-destructive">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred in the application:
            </p>
            <pre className="p-4 bg-secondary rounded-lg text-left text-xs font-mono overflow-auto max-h-[150px] border border-border">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
