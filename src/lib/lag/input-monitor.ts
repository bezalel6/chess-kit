/**
 * InputMonitor
 * Measures input latency by timing the gap between a pointerdown event
 * on the chess board and the subsequent DOM mutation response (piece movement).
 */

export type InputCallback = (latencyMs: number) => void;

const BOARD_SELECTOR = 'wc-chess-board';

export class InputMonitor {
  private callback: InputCallback;
  private observer: MutationObserver | null = null;
  private pendingInteraction: number | null = null;
  private running = false;

  constructor(callback: InputCallback) {
    this.callback = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    document.addEventListener('pointerdown', this.onPointerDown, true);
  }

  stop(): void {
    this.running = false;
    document.removeEventListener('pointerdown', this.onPointerDown, true);
    this.disconnectObserver();
    this.pendingInteraction = null;
  }

  private onPointerDown = (e: PointerEvent): void => {
    // Only care about interactions on/within the chess board
    const board = document.querySelector(BOARD_SELECTOR);
    if (!board) return;

    const target = e.target as Element;
    if (!board.contains(target) && target !== board) return;

    // Record interaction timestamp and start observing for DOM response
    this.pendingInteraction = performance.now();
    this.observeBoard(board);
  };

  private observeBoard(board: Element): void {
    this.disconnectObserver();

    this.observer = new MutationObserver(() => {
      if (this.pendingInteraction !== null) {
        const latency = performance.now() - this.pendingInteraction;
        this.pendingInteraction = null;
        this.disconnectObserver();
        this.callback(Math.round(latency));
      }
    });

    this.observer.observe(board, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'transform'],
    });

    // Timeout: if no mutation within 2s, discard this measurement
    setTimeout(() => {
      if (this.pendingInteraction !== null) {
        this.pendingInteraction = null;
        this.disconnectObserver();
      }
    }, 2000);
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
