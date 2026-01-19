/**
 * Chess.com Layout Transformation
 * Compacts sidebar and moves player cards above/below it (Lichess-style)
 */

export interface LayoutConfig {
  enabled: boolean;
  extractPlayerCards: boolean;
}

interface ElementRestoreData {
  element: HTMLElement;
  originalParent: HTMLElement;
  nextSibling: Node | null;
}

interface TransformationState {
  topPlayerCard: ElementRestoreData | null;
  bottomPlayerCard: ElementRestoreData | null;
  topClock: ElementRestoreData | null;
  bottomClock: ElementRestoreData | null;
  wrappers: {
    topPlayer: HTMLElement | null;
    bottomPlayer: HTMLElement | null;
    topClock: HTMLElement | null;
    bottomClock: HTMLElement | null;
  };
}

let transformationState: TransformationState = {
  topPlayerCard: null,
  bottomPlayerCard: null,
  topClock: null,
  bottomClock: null,
  wrappers: {
    topPlayer: null,
    bottomPlayer: null,
    topClock: null,
    bottomClock: null,
  },
};

const CHESS_KIT_STYLE_ID = 'chess-kit-layout-override';
const CHESS_KIT_TRANSFORMED_ATTR = 'data-chess-kit-transformed';

/**
 * Injects CSS to make sidebar smaller and prepare for player cards
 */
export function injectLayoutCSS(config: LayoutConfig): void {
  // Remove existing styles if present
  const existing = document.getElementById(CHESS_KIT_STYLE_ID);
  if (existing) existing.remove();

  if (!config.enabled) return;

  const style = document.createElement('style');
  style.id = CHESS_KIT_STYLE_ID;

  style.textContent = `
    /* Chess-Kit Layout Override */

    /* Make sidebar much smaller - compact width and height */
    #board-layout-sidebar {
      --sidebarMinWidth: 250px !important;
      --sidebarMaxWidth: 500px !important;
      min-width: 250px !important;
      max-width: 500px !important;
      min-height: 400px !important;
      max-height: 800px !important;
      overflow: auto !important;
      margin-left: auto !important;
      margin-right: auto !important;
      position: relative !important; /* For resize handle positioning */
    }

    /* Custom resize handle */
    .chess-kit-resize-handle {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      z-index: 10000;
      background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(128, 128, 128, 0.5) 50%, rgba(128, 128, 128, 0.5) 100%);
      border-bottom-right-radius: inherit;
    }

    .chess-kit-resize-handle:hover {
      background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(100, 100, 200, 0.7) 50%, rgba(100, 100, 200, 0.7) 100%);
    }

    /* Clock displays - separate rows before player cards */
    .chess-kit-clock-top-wrapper {
      order: -2; /* Appears before top player card */
      margin-bottom: 4px;
      flex-shrink: 0;
      width: 100%;
    }

    .chess-kit-clock-bottom-wrapper {
      order: 1000; /* Appears after bottom player card */
      margin-top: 4px;
      flex-shrink: 0;
      width: 100%;
    }

    /* Clock component styling */
    .chess-kit-clock-top-wrapper .clock-component,
    .chess-kit-clock-bottom-wrapper .clock-component {
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      padding: 4px 8px !important;
    }

    /* Top player card - positioned after its clock */
    .chess-kit-player-top-wrapper {
      order: -1; /* Ensure it appears before sidebar content */
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    /* Bottom player card - positioned before its clock */
    .chess-kit-player-bottom-wrapper {
      order: 999; /* Ensure it appears after sidebar content */
      margin-top: 8px;
      flex-shrink: 0;
    }

    /* Style player cards when moved to sidebar */
    .chess-kit-player-top-wrapper .board-layout-player,
    .chess-kit-player-bottom-wrapper .board-layout-player {
      /* Reset any board-specific positioning */
      position: relative !important;
      left: auto !important;
      top: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }

    /* Allow player card children to reflow */
    .chess-kit-player-top-wrapper .board-layout-player *,
    .chess-kit-player-bottom-wrapper .board-layout-player * {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    /* Ensure player info containers can wrap/flex properly */
    .chess-kit-player-top-wrapper .player-component,
    .chess-kit-player-bottom-wrapper .player-component {
      width: 100% !important;
      max-width: 100% !important;
      display: flex !important;
      flex-wrap: wrap !important;
      overflow: hidden !important;
    }

    /* Make captured pieces and other elements responsive */
    .chess-kit-player-top-wrapper .captured-pieces-cpiece,
    .chess-kit-player-bottom-wrapper .captured-pieces-cpiece,
    .chess-kit-player-top-wrapper wc-captured-pieces,
    .chess-kit-player-bottom-wrapper wc-captured-pieces {
      max-width: 100% !important;
      overflow: visible !important;
    }

    /* Ensure captured pieces children render */
    .chess-kit-player-top-wrapper wc-captured-pieces > *,
    .chess-kit-player-bottom-wrapper wc-captured-pieces > * {
      max-width: 100% !important;
    }

    /* Ensure avatar and username area can shrink */
    .chess-kit-player-top-wrapper .user-username-component,
    .chess-kit-player-bottom-wrapper .user-username-component {
      max-width: calc(100% - 60px) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* Country flags and other icons */
    .chess-kit-player-top-wrapper .country-flags-component,
    .chess-kit-player-bottom-wrapper .country-flags-component {
      flex-shrink: 0 !important;
    }

    /* Make sidebar content area use flexbox for proper ordering */
    #board-layout-sidebar {
      display: flex !important;
      flex-direction: column !important;
    }

    /* Ensure tabs stay at top and don't scroll */
    #board-layout-sidebar .tabs-component {
      flex-shrink: 0;
    }

    /* Main sidebar content area - scrollable */
    #board-layout-sidebar .sidebar-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }

    /* Compact move list spacing */
    #board-layout-sidebar .move-list {
      font-size: 13px !important;
    }

    /* Make evaluation settings more compact */
    #board-layout-sidebar .evaluation-settings-component {
      padding: 4px 8px !important;
      font-size: 12px !important;
    }

    /* Compact ECO opening display */
    #board-layout-sidebar .eco-opening-component {
      padding: 4px 8px !important;
      font-size: 12px !important;
    }

    /* Compact tabs */
    #board-layout-sidebar .tabs-tab {
      font-size: 12px !important;
      padding: 6px 8px !important;
    }

    /* Compact underlined tabs */
    #board-layout-sidebar .underlined-tabs-tab {
      font-size: 12px !important;
      padding: 6px 12px !important;
    }
  `;

  document.head.appendChild(style);
}

/**
 * Capture element's current position for later restoration
 */
function captureElementPosition(element: HTMLElement): ElementRestoreData {
  return {
    element,
    originalParent: element.parentElement as HTMLElement,
    nextSibling: element.nextSibling,
  };
}

/**
 * Restore element to its original position
 */
function restoreElement(restoreData: ElementRestoreData): void {
  const { element, originalParent, nextSibling } = restoreData;

  if (nextSibling && nextSibling.parentNode === originalParent) {
    // Insert before the next sibling
    originalParent.insertBefore(element, nextSibling);
  } else {
    // Append to parent (was last child or next sibling no longer exists)
    originalParent.appendChild(element);
  }
}

/**
 * Wait for player card to be fully populated with actual player data
 */
function waitForPlayerData(playerElement: Element): Promise<void> {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkPlayerData = () => {
      attempts++;

      // Check if player has actual username (not just placeholder)
      const username = playerElement.querySelector('.cc-user-username-component');
      const hasUsername = username && username.textContent && username.textContent.trim().length > 0;

      // Check if captured pieces component exists and has rendered
      const capturedPieces = playerElement.querySelector('wc-captured-pieces');

      // If we have username data, consider it loaded
      if (hasUsername) {
        // Give a tiny bit more time for web components to fully render
        setTimeout(() => resolve(), 50);
        return;
      }

      // If we've tried too many times, give up and resolve anyway
      if (attempts >= maxAttempts) {
        console.warn('[Chess-Kit] Player data did not load in time, proceeding anyway');
        resolve();
        return;
      }

      // Try again in 100ms
      setTimeout(checkPlayerData, 100);
    };

    checkPlayerData();
  });
}

/**
 * Moves player cards from board area to sidebar (preserving live functionality)
 */
export async function transformPlayerCards(): Promise<void> {
  const boardMain = document.querySelector('#board-layout-main');
  const sidebar = document.querySelector('#board-layout-sidebar') as HTMLElement;

  if (!boardMain || !sidebar) {
    console.warn('[Chess-Kit] Cannot find board or sidebar elements');
    return;
  }

  // Check if already transformed
  if (sidebar.hasAttribute(CHESS_KIT_TRANSFORMED_ATTR)) {
    console.warn('[Chess-Kit] Already transformed, skipping');
    return;
  }

  // Mark sidebar as transformed BEFORE making changes to prevent MutationObserver feedback loops
  sidebar.setAttribute(CHESS_KIT_TRANSFORMED_ATTR, 'true');

  // Set initial sidebar dimensions (not in CSS to allow resizing)
  sidebar.style.setProperty('width', '280px', 'important');
  sidebar.style.setProperty('height', '500px', 'important');
  sidebar.style.setProperty('--sidebarMinWidth', '280px', 'important');
  sidebar.style.setProperty('--sidebarMaxWidth', '280px', 'important');

  // Find player elements
  const playerTop = boardMain.querySelector('#board-layout-player-top') as HTMLElement;
  const playerBottom = boardMain.querySelector('#board-layout-player-bottom') as HTMLElement;

  if (!playerTop || !playerBottom) {
    console.warn('[Chess-Kit] Cannot find player elements');
    sidebar.removeAttribute(CHESS_KIT_TRANSFORMED_ATTR);
    return;
  }

  // Wait for player data to fully load
  await waitForPlayerData(playerTop);
  await waitForPlayerData(playerBottom);

  // Capture original positions BEFORE moving anything
  const topPlayerData = captureElementPosition(playerTop);
  const bottomPlayerData = captureElementPosition(playerBottom);

  // Extract clocks from player cards BEFORE moving player cards
  const clockTopElement = playerTop.querySelector('.clock-component') as HTMLElement;
  const clockBottomElement = playerBottom.querySelector('.clock-component') as HTMLElement;

  let topClockData: ElementRestoreData | null = null;
  let bottomClockData: ElementRestoreData | null = null;

  // Create clock wrappers
  const topClockWrapper = document.createElement('div');
  topClockWrapper.className = 'chess-kit-clock-top-wrapper';

  const bottomClockWrapper = document.createElement('div');
  bottomClockWrapper.className = 'chess-kit-clock-bottom-wrapper';

  // Move clocks to wrappers (if they exist) - LIVE MOVE preserves timers
  if (clockTopElement) {
    topClockData = captureElementPosition(clockTopElement);
    topClockWrapper.appendChild(clockTopElement); // appendChild MOVES element, preserving event listeners
  }

  if (clockBottomElement) {
    bottomClockData = captureElementPosition(clockBottomElement);
    bottomClockWrapper.appendChild(clockBottomElement); // appendChild MOVES element
  }

  // Create player card wrappers
  const topWrapper = document.createElement('div');
  topWrapper.className = 'chess-kit-player-top-wrapper';

  const bottomWrapper = document.createElement('div');
  bottomWrapper.className = 'chess-kit-player-bottom-wrapper';

  // Move player cards to wrappers - LIVE MOVE preserves all functionality
  topWrapper.appendChild(playerTop); // appendChild MOVES element, keeping web components alive
  bottomWrapper.appendChild(playerBottom); // appendChild MOVES element

  // Insert wrappers into sidebar
  // Order: clock (top) → player card (top) → sidebar content → player card (bottom) → clock (bottom)
  sidebar.insertBefore(topWrapper, sidebar.firstChild);
  sidebar.insertBefore(topClockWrapper, topWrapper); // Insert clock before player card
  sidebar.appendChild(bottomWrapper);
  sidebar.appendChild(bottomClockWrapper);

  // Store transformation state for restoration
  transformationState = {
    topPlayerCard: topPlayerData,
    bottomPlayerCard: bottomPlayerData,
    topClock: topClockData,
    bottomClock: bottomClockData,
    wrappers: {
      topPlayer: topWrapper,
      bottomPlayer: bottomWrapper,
      topClock: topClockWrapper,
      bottomClock: bottomClockWrapper,
    },
  };

  // Add resize handle to sidebar
  addResizeHandle(sidebar as HTMLElement);

  console.log('[Chess-Kit] Player cards moved successfully (live elements preserved)');
}

/**
 * Add custom resize handle to sidebar with centered positioning
 */
function addResizeHandle(sidebar: HTMLElement): void {
  // Remove existing handle if present
  const existingHandle = sidebar.querySelector('.chess-kit-resize-handle');
  if (existingHandle) existingHandle.remove();

  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'chess-kit-resize-handle';

  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  const onMouseDown = (e: MouseEvent) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = sidebar.offsetWidth;
    startHeight = sidebar.offsetHeight;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Calculate new dimensions
    let newWidth = startWidth + deltaX;
    let newHeight = startHeight + deltaY;

    // Apply min/max constraints
    newWidth = Math.max(250, Math.min(500, newWidth));
    newHeight = Math.max(400, Math.min(800, newHeight));

    // Apply new dimensions (use setProperty with 'important' to override CSS)
    sidebar.style.setProperty('width', `${newWidth}px`, 'important');
    sidebar.style.setProperty('height', `${newHeight}px`, 'important');

    // Update CSS custom properties as well
    sidebar.style.setProperty('--sidebarMinWidth', `${newWidth}px`, 'important');
    sidebar.style.setProperty('--sidebarMaxWidth', `${newWidth}px`, 'important');
  };

  const onMouseUp = () => {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  resizeHandle.addEventListener('mousedown', onMouseDown);

  // Add handle to sidebar
  sidebar.appendChild(resizeHandle);
}

/**
 * Removes layout transformation and restores all elements to original positions
 */
export function removeLayoutTransformation(): void {
  console.log('[Chess-Kit] Removing layout transformation');

  // Remove injected CSS
  const style = document.getElementById(CHESS_KIT_STYLE_ID);
  if (style) style.remove();

  // Restore clocks to their original positions first (they're nested in player cards)
  if (transformationState.topClock) {
    restoreElement(transformationState.topClock);
  }

  if (transformationState.bottomClock) {
    restoreElement(transformationState.bottomClock);
  }

  // Restore player cards to their original positions
  if (transformationState.topPlayerCard) {
    restoreElement(transformationState.topPlayerCard);
  }

  if (transformationState.bottomPlayerCard) {
    restoreElement(transformationState.bottomPlayerCard);
  }

  // Remove wrappers (now empty after elements moved out)
  if (transformationState.wrappers.topPlayer) {
    transformationState.wrappers.topPlayer.remove();
  }

  if (transformationState.wrappers.bottomPlayer) {
    transformationState.wrappers.bottomPlayer.remove();
  }

  if (transformationState.wrappers.topClock) {
    transformationState.wrappers.topClock.remove();
  }

  if (transformationState.wrappers.bottomClock) {
    transformationState.wrappers.bottomClock.remove();
  }

  // Reset transformation state
  transformationState = {
    topPlayerCard: null,
    bottomPlayerCard: null,
    topClock: null,
    bottomClock: null,
    wrappers: {
      topPlayer: null,
      bottomPlayer: null,
      topClock: null,
      bottomClock: null,
    },
  };

  // Remove transformed attribute and resize handle
  const sidebar = document.querySelector('#board-layout-sidebar') as HTMLElement;
  if (sidebar) {
    sidebar.removeAttribute(CHESS_KIT_TRANSFORMED_ATTR);

    // Remove resize handle
    const resizeHandle = sidebar.querySelector('.chess-kit-resize-handle');
    if (resizeHandle) resizeHandle.remove();

    // Reset sidebar dimensions (remove inline styles)
    sidebar.style.removeProperty('width');
    sidebar.style.removeProperty('height');
    sidebar.style.removeProperty('--sidebarMinWidth');
    sidebar.style.removeProperty('--sidebarMaxWidth');
  }

  console.log('[Chess-Kit] Layout transformation removed, elements restored');
}

/**
 * Applies complete layout transformation
 */
export function applyLayoutTransformation(config: LayoutConfig): void {
  if (!config.enabled) {
    removeLayoutTransformation();
    return;
  }

  // Clean up any existing transformation first (DOM elements only, not CSS)
  if (transformationState.topPlayerCard || transformationState.bottomPlayerCard) {
    console.log('[Chess-Kit] Cleaning up existing transformation before re-applying');
    removeLayoutTransformation();
  }

  // Inject CSS Grid override
  injectLayoutCSS(config);

  // Wait for DOM to settle, then move player cards
  if (config.extractPlayerCards) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(async () => {
      await transformPlayerCards();
    }, 150);
  }
}

/**
 * Observes DOM for changes and re-applies transformation if needed
 */
export function observeLayoutChanges(config: LayoutConfig): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check if sidebar was added/modified
      if (mutation.type === 'childList') {
        const sidebar = document.querySelector('#board-layout-sidebar');

        // Only transform if sidebar exists, not already transformed, and elements are in original positions
        if (sidebar && !sidebar.hasAttribute(CHESS_KIT_TRANSFORMED_ATTR)) {
          const playerTop = document.querySelector('#board-layout-player-top');
          const playerBottom = document.querySelector('#board-layout-player-bottom');

          // Check if player cards are back in board-layout-main (indicating reset)
          const boardMain = document.querySelector('#board-layout-main');
          const cardsInBoard = boardMain?.contains(playerTop || null) && boardMain?.contains(playerBottom || null);

          if (config.enabled && config.extractPlayerCards && cardsInBoard) {
            // Wait for DOM to settle before transforming
            setTimeout(async () => {
              await transformPlayerCards();
            }, 150);
          }
        }
      }
    }
  });

  // Observe body for structural changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}
