/**
 * Chess-Kit Content Script
 * Transforms Chess.com layout to Lichess-style
 */

import { ChessKitConfig, ExtensionMessage, TransformationStatus } from './types';
import {
  applyLayoutTransformation,
  observeLayoutChanges,
  removeLayoutTransformation,
} from './lib/layout';
import { LagTelemetry } from './lib/lag/lag-telemetry';

let layoutObserver: MutationObserver | null = null;
let currentConfig: ChessKitConfig | null = null;
let lagTelemetry: LagTelemetry | null = null;

/**
 * Initialize the extension
 */
function init() {
  console.log('[Chess-Kit] Initializing content script');

  loadConfigAndApply();

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true;
  });
}

/**
 * Load configuration from storage and apply all features
 */
function loadConfigAndApply() {
  chrome.storage.sync.get('config', (items) => {
    const config: ChessKitConfig | undefined = items.config;

    if (!config) {
      console.warn('[Chess-Kit] No configuration found');
      return;
    }

    currentConfig = config;
    applyAllFeatures(config);
  });
}

/**
 * Apply all features based on current config flags
 */
function applyAllFeatures(config: ChessKitConfig) {
  console.log('[Chess-Kit] Applying features', config);

  // --- Layout ---
  if (layoutObserver) {
    layoutObserver.disconnect();
    layoutObserver = null;
  }

  if (config.compactSidebar) {
    applyLayoutTransformation({
      compactSidebar: config.compactSidebar,
      repositionPlayerCards: config.repositionPlayerCards,
    });

    layoutObserver = observeLayoutChanges({
      compactSidebar: config.compactSidebar,
      repositionPlayerCards: config.repositionPlayerCards,
    });
  } else {
    removeLayoutTransformation();
  }

  // --- Lag telemetry ---
  if (config.lagOverlay) {
    if (!lagTelemetry) {
      lagTelemetry = new LagTelemetry();
    }
    if (!lagTelemetry.getIsRunning()) {
      lagTelemetry.start();
    }
  } else {
    if (lagTelemetry) {
      lagTelemetry.stop();
    }
  }

  // --- Debug overlay ---
  if (config.debugMode) {
    showDebugOverlay();
  } else {
    hideDebugOverlay();
  }
}

/**
 * Handle messages from popup/options
 */
function handleMessage(message: ExtensionMessage, sendResponse: (response: any) => void) {
  console.log('[Chess-Kit] Received message:', message);

  switch (message.type) {
    case 'refresh':
      loadConfigAndApply();
      sendResponse({ success: true });
      break;

    case 'getStatus':
      sendResponse(getTransformationStatus());
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

/**
 * Show debug overlay with transformation status
 */
function showDebugOverlay() {
  const existingOverlay = document.getElementById('chess-kit-debug-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'chess-kit-debug-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    padding: 12px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
    border: 2px solid #00ff00;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  `;

  const status = getTransformationStatus();

  overlay.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px; color: #00ff00;">
      Chess-Kit Debug
    </div>
    <div>Compact Sidebar: ${status.compactSidebar ? 'YES' : 'NO'}</div>
    <div>Player Cards Repositioned: ${status.playerCardsRepositioned ? 'YES' : 'NO'}</div>
    <div>Lag Overlay Active: ${status.lagOverlayActive ? 'YES' : 'NO'}</div>
    <div>Debug Overlay: ${status.debugOverlayActive ? 'YES' : 'NO'}</div>
    <div style="margin-top: 8px; font-size: 10px; color: #888;">
      Click to close
    </div>
  `;

  overlay.addEventListener('click', () => {
    overlay.remove();
  });

  document.body.appendChild(overlay);
}

/**
 * Hide debug overlay
 */
function hideDebugOverlay() {
  const overlay = document.getElementById('chess-kit-debug-overlay');
  if (overlay) overlay.remove();
}

/**
 * Get current transformation status
 */
function getTransformationStatus(): TransformationStatus {
  const cssInjected = !!document.getElementById('chess-kit-layout-override');
  const sidebar = document.querySelector('#board-layout-sidebar');
  const playerCardsRepositioned = sidebar?.hasAttribute('data-chess-kit-transformed') ?? false;

  return {
    compactSidebar: cssInjected,
    playerCardsRepositioned,
    lagOverlayActive: lagTelemetry?.getIsRunning() ?? false,
    debugOverlayActive: currentConfig?.debugMode ?? false,
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
