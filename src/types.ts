/**
 * Main configuration stored in chrome.storage.sync
 */
export type ChessKitConfig = {
  /** Whether the extension is globally enabled */
  enabled: boolean;

  /** Whether to extract player cards and move them above/below sidebar */
  extractPlayerCards: boolean;

  /** Debug mode shows transformation status */
  debugMode: boolean;

  /** Configuration version for migrations */
  version: number;
};

/**
 * Message types for communication between extension components
 */
export type ExtensionMessage =
  | { type: 'enable' }
  | { type: 'disable' }
  | { type: 'refresh' }
  | { type: 'toggleDebug' };

/**
 * Response from content script about transformation status
 */
export type TransformationStatus = {
  enabled: boolean;
  playerCardsExtracted: boolean;
  cssInjected: boolean;
};
