/**
 * Transformation Orchestrator - Manages the entire transformation lifecycle
 */

import { NavigationMonitor } from './navigation';
import { waitForDataReadiness } from './data-readiness';
import { transformPlayerCards, removeLayoutTransformation, injectLayoutCSS } from './layout';
import { LayoutConfig } from './layout';

enum TransformationState {
  IDLE = 'IDLE',
  WAITING_FOR_STRUCTURE = 'WAITING_FOR_STRUCTURE',
  WAITING_FOR_DATA = 'WAITING_FOR_DATA',
  TRANSFORMING = 'TRANSFORMING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class TransformationOrchestrator {
  private navigationMonitor = new NavigationMonitor();
  private state: TransformationState = TransformationState.IDLE;
  private config: LayoutConfig;
  private isActive = false;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Start the orchestrator
   */
  start(): void {
    if (this.isActive) {
      console.warn('[Chess-Kit] Orchestrator already active');
      return;
    }

    this.isActive = true;
    console.log('[Chess-Kit] Orchestrator started');

    // Monitor navigation
    this.navigationMonitor.start((url) => {
      if (this.navigationMonitor.isGamePage(url)) {
        this.handleGamePageNavigation();
      } else {
        this.cleanup();
      }
    });

    // Check if already on game page
    if (this.navigationMonitor.isGamePage(window.location.href)) {
      this.handleGamePageNavigation();
    }
  }

  /**
   * Stop the orchestrator
   */
  stop(): void {
    this.navigationMonitor.stop();
    this.cleanup();
    this.isActive = false;
    console.log('[Chess-Kit] Orchestrator stopped');
  }

  /**
   * Update configuration
   */
  updateConfig(config: LayoutConfig): void {
    this.config = config;

    if (config.enabled && this.navigationMonitor.isGamePage(window.location.href)) {
      // Re-apply transformation with new config
      this.handleGamePageNavigation();
    } else if (!config.enabled) {
      this.cleanup();
    }
  }

  /**
   * Handle game page navigation
   */
  private async handleGamePageNavigation(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    console.log('[Chess-Kit] Game page detected, starting transformation');

    // Clean up any existing transformation
    this.cleanup();
    this.state = TransformationState.WAITING_FOR_STRUCTURE;

    // Inject CSS immediately
    injectLayoutCSS(this.config);

    // Wait for DOM structure
    await this.waitForStructure();
    this.state = TransformationState.WAITING_FOR_DATA;

    // Only transform player cards if enabled
    if (!this.config.extractPlayerCards) {
      this.state = TransformationState.COMPLETED;
      return;
    }

    // Find player containers
    const playerTop = document.querySelector('#board-layout-player-top');
    const playerBottom = document.querySelector('#board-layout-player-bottom');

    if (!playerTop || !playerBottom) {
      console.warn('[Chess-Kit] Player containers not found');
      this.state = TransformationState.FAILED;
      return;
    }

    try {
      // Wait for both players' data concurrently with multi-signal detection
      console.log('[Chess-Kit] Waiting for player data...');
      await Promise.all([
        waitForDataReadiness(playerTop, 2, 10000), // Require 2 signals minimum
        waitForDataReadiness(playerBottom, 2, 10000),
      ]);

      console.log('[Chess-Kit] Player data ready, transforming...');
      this.state = TransformationState.TRANSFORMING;

      await transformPlayerCards();

      this.state = TransformationState.COMPLETED;
      console.log('[Chess-Kit] Transformation completed successfully');

    } catch (error) {
      console.error('[Chess-Kit] Transformation failed:', error);
      this.state = TransformationState.FAILED;
    }
  }

  /**
   * Wait for DOM structure to exist
   */
  private async waitForStructure(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        const sidebar = document.querySelector('#board-layout-sidebar');
        const playerTop = document.querySelector('#board-layout-player-top');
        const playerBottom = document.querySelector('#board-layout-player-bottom');

        if (sidebar && playerTop && playerBottom) {
          console.log('[Chess-Kit] DOM structure ready');
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }

  /**
   * Cleanup transformation
   */
  private cleanup(): void {
    removeLayoutTransformation();
    this.state = TransformationState.IDLE;
  }
}
