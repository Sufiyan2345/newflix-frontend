import React, { Component } from 'react';
import SystemErrorScreen from './SystemErrorScreen';

// A render/effect throw unmounts the ENTIRE React tree, so without a boundary the user
// only ever sees a blank white page and the real error is lost. This catches it and
// shows the message plus a way back, which is what turned a one-line player bug into
// an undebuggable "blank page".
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidMount() {
    window.addEventListener('error', this.handleRuntimeError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('app-fatal-error', this.handleFatalAppError);
    // The error the screen is showing, mirrored onto window so a crash is diagnosable
    // from the console (or a remote check) instead of only being a generic message.
    this.exposeError = () => { window.__sfLastError = this.state.error ? String(this.state.error?.message || this.state.error) : null; };
    this.exposeError();
  }

  componentDidUpdate() {
    if (this.exposeError) this.exposeError();
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleRuntimeError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('app-fatal-error', this.handleFatalAppError);
  }

  // One bad hover, one failed image or one third-party embed error was enough to
  // unmount the ENTIRE app, and because `error` was never cleared the app stayed
  // bricked until a manual refresh. Two changes:
  //   - only a genuine React/lifecycle throw is fatal. A window 'error' from a
  //     third-party iframe, an image, or an extension is logged and ignored, because
  //     blowing away the whole page for someone else's console noise is wrong.
  //   - the screen is recoverable: it offers a retry that clears the state and
  //     remounts, rather than dead-ending the user on a dead page.
  handleRuntimeError = (event) => {
    if (!(event instanceof ErrorEvent)) return;
    // React surfaces its own render/lifecycle throws here too, so only skip the ones
    // that provably came from somewhere other than this app's component tree.
    const external = event.filename
      && !event.filename.includes('/src/')
      && !event.filename.includes('localhost');
    if (external) {
      console.error('Non-fatal window error (ignored):', event.error || event.message);
      return;
    }
    this.setState({ error: event.error || new Error(event.message || 'Unexpected application error') });
  };

  // A rejected promise we never awaited (a blocked embed script, a cancelled request)
  // must not blank the app. Log it and carry on; the UI already degrades gracefully
  // for these cases by design.
  handleUnhandledRejection = (event) => {
    console.error('Unhandled rejection (ignored):', event.reason);
  };

  handleFatalAppError = (event) => {
    this.setState({ error: new Error(event.detail?.message || 'The service is temporarily unavailable') });
  };

  // Clears the error and forces a remount of the tree underneath, so the user gets a
  // working app back without hunting for the refresh button.
  retry = () => {
    this.setState({ error: null, resetKey: (this.state.resetKey || 0) + 1 });
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the detail in the console so it can be traced back to a component.
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return <React.Fragment key={this.state.resetKey || 0}>{this.props.children}</React.Fragment>;
    }

    return <SystemErrorScreen error={error} onRetry={this.retry} />;
  }
}
