import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  /** Render a compact inline fallback suitable for wrapping a page section. */
  section?: boolean
  /** Optional label shown in the section fallback. */
  label?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.section) {
      return (
        <div className="bg-surface border border-danger/30 rounded-xl p-6 text-center my-3">
          <p className="text-text-primary font-medium mb-1">
            {this.props.label ?? 'This section failed to load.'}
          </p>
          <p className="text-text-secondary text-sm mb-4">The rest of the page is still available.</p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="bg-elevated border border-border rounded-lg p-3 text-left text-[11px] text-danger font-mono mb-4 overflow-x-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.reset}
            className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
          <p className="text-text-secondary mb-6">
            An unexpected error occurred. Your writing sessions are safe in your account.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="bg-elevated border border-border rounded-xl p-4 text-left text-xs text-danger font-mono mb-6 overflow-x-auto max-h-40">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-xl transition-all text-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
