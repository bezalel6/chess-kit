/**
 * Navigation Monitor - Detects SPA navigation on Chess.com
 */

export type NavigationCallback = (url: string) => void;

export class NavigationMonitor {
  private currentUrl = window.location.href;
  private pollInterval: number | null = null;
  private callbacks: NavigationCallback[] = [];

  /**
   * Start monitoring for navigation changes
   */
  start(onNavigate: NavigationCallback): void {
    this.callbacks.push(onNavigate);

    // URL polling every 500ms (lightweight for SPA detection)
    this.pollInterval = window.setInterval(() => {
      const newUrl = window.location.href;
      if (newUrl !== this.currentUrl) {
        console.log('[Chess-Kit] Navigation detected:', this.currentUrl, '→', newUrl);
        this.currentUrl = newUrl;
        this.notifyCallbacks(newUrl);
      }
    }, 500);

    // Also listen to popstate for back/forward navigation
    window.addEventListener('popstate', this.handlePopState);

    console.log('[Chess-Kit] Navigation monitor started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pollInterval !== null) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    window.removeEventListener('popstate', this.handlePopState);
    this.callbacks = [];

    console.log('[Chess-Kit] Navigation monitor stopped');
  }

  /**
   * Check if URL is a Chess.com game page
   */
  isGamePage(url: string): boolean {
    return /chess\.com\/(play|game|analysis|daily)/.test(url);
  }

  /**
   * Handle popstate event
   */
  private handlePopState = (): void => {
    const newUrl = window.location.href;
    if (newUrl !== this.currentUrl) {
      this.currentUrl = newUrl;
      this.notifyCallbacks(newUrl);
    }
  };

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(url: string): void {
    this.callbacks.forEach(callback => callback(url));
  }
}
