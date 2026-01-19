import { ChessKitConfig } from './types';

const CURRENT_VERSION = 2;

function getDefaultConfig(): ChessKitConfig {
  return {
    enabled: true,
    extractPlayerCards: true,
    debugMode: false,
    version: CURRENT_VERSION,
  };
}

function initializeConfig() {
  chrome.storage.sync.get('config', (items) => {
    const existingConfig = items.config as ChessKitConfig | undefined;

    // If no config exists, or it's from an old version, initialize/migrate
    if (!existingConfig || existingConfig.version !== CURRENT_VERSION) {
      console.log('[Chess-Kit] Initializing/migrating configuration...');

      const newConfig: ChessKitConfig = {
        enabled: existingConfig?.enabled ?? true,
        extractPlayerCards: existingConfig?.extractPlayerCards ?? true,
        debugMode: existingConfig?.debugMode ?? false,
        version: CURRENT_VERSION,
      };

      chrome.storage.sync.set({ config: newConfig }, () => {
        console.log('[Chess-Kit] Configuration initialized:', newConfig);
      });
    } else {
      console.log('[Chess-Kit] Configuration already up to date');
    }
  });
}

// Initialize on install or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Chess-Kit] Extension installed/updated:', details.reason);
  initializeConfig();
});

// Also initialize on startup (in case onInstalled didn't fire)
chrome.runtime.onStartup.addListener(() => {
  console.log('[Chess-Kit] Extension starting up');
  initializeConfig();
});

// Initialize immediately when background script loads
initializeConfig();

// Keep service worker alive
function polling() {
  setTimeout(polling, 1000 * 30);
}

polling();
