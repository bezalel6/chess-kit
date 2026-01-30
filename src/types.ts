/**
 * Main configuration stored in chrome.storage.sync
 */
export type ChessKitConfig = {
  /** Whether to inject CSS that compacts the sidebar */
  compactSidebar: boolean;

  /** Whether to move player cards above/below the sidebar */
  repositionPlayerCards: boolean;

  /** Whether lag telemetry overlay is shown */
  lagOverlay: boolean;

  /** Whether debug overlay is shown */
  debugMode: boolean;

  /** Configuration version for migrations */
  version: number;
};

/**
 * Message types for communication between extension components.
 * All feature toggles save config then send 'refresh'.
 */
export type ExtensionMessage =
  | { type: 'refresh' }
  | { type: 'getStatus' };

/**
 * Response from content script about current feature status
 */
export type TransformationStatus = {
  compactSidebar: boolean;
  playerCardsRepositioned: boolean;
  lagOverlayActive: boolean;
  debugOverlayActive: boolean;
};
