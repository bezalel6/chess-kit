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

let layoutObserver: MutationObserver | null = null;
let currentConfig: ChessKitConfig | null = null;

/**
 * Initialize the extension
 */
function init() {
  console.log('[Chess-Kit] Initializing content script');

  // Load config and apply transformation
  loadConfigAndApply();

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // Keep message channel open for async response
  });
}

/**
 * Load configuration from storage and apply layout transformation
 */
function loadConfigAndApply() {
  chrome.storage.sync.get('config', (items) => {
    const config: ChessKitConfig | undefined = items.config;

    if (!config) {
      console.warn('[Chess-Kit] No configuration found');
      return;
    }

    currentConfig = config;

    if (config.enabled) {
      applyTransformation(config);
    } else {
      removeTransformation();
    }
  });
}

/**
 * Apply layout transformation
 */
function applyTransformation(config: ChessKitConfig) {
  console.log('[Chess-Kit] Applying layout transformation', config);

  // Remove previous observer if exists
  if (layoutObserver) {
    layoutObserver.disconnect();
    layoutObserver = null;
  }

  // Apply the transformation
  applyLayoutTransformation({
    enabled: config.enabled,
    extractPlayerCards: config.extractPlayerCards,
  });

  // Start observing for dynamic DOM changes
  layoutObserver = observeLayoutChanges({
    enabled: config.enabled,
    extractPlayerCards: config.extractPlayerCards,
  });

  if (config.debugMode) {
    showDebugOverlay();
  } else {
    hideDebugOverlay();
  }
}

/**
 * Remove layout transformation
 */
function removeTransformation() {
  console.log('[Chess-Kit] Removing layout transformation');

  if (layoutObserver) {
    layoutObserver.disconnect();
    layoutObserver = null;
  }

  removeLayoutTransformation();
  hideDebugOverlay();
}

/**
 * Handle messages from popup/background
 */
function handleMessage(message: ExtensionMessage, sendResponse: (response: any) => void) {
  console.log('[Chess-Kit] Received message:', message);

  switch (message.type) {
    case 'enable':
      if (currentConfig) {
        currentConfig.enabled = true;
        applyTransformation(currentConfig);
      }
      sendResponse({ success: true });
      break;

    case 'disable':
      if (currentConfig) {
        currentConfig.enabled = false;
        removeTransformation();
      }
      sendResponse({ success: true });
      break;

    case 'refresh':
      loadConfigAndApply();
      sendResponse({ success: true });
      break;

    case 'toggleDebug':
      if (currentConfig) {
        currentConfig.debugMode = !currentConfig.debugMode;
        if (currentConfig.debugMode) {
          showDebugOverlay();
        } else {
          hideDebugOverlay();
        }
      }
      sendResponse({ success: true });
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
      🔧 Chess-Kit Debug Mode
    </div>
    <div>Enabled: ${status.enabled ? '✅' : '❌'}</div>
    <div>Player Cards Extracted: ${status.playerCardsExtracted ? '✅' : '❌'}</div>
    <div>CSS Injected: ${status.cssInjected ? '✅' : '❌'}</div>
    <div>Sidebar Compacted: ${status.cssInjected ? '✅' : '❌'}</div>
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
  const playerCardsExtracted = sidebar?.hasAttribute('data-chess-kit-transformed') ?? false;

  return {
    enabled: currentConfig?.enabled ?? false,
    playerCardsExtracted,
    cssInjected,
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
