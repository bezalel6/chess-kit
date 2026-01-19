/**
 * Chess.com Layout Transformation
 * Compacts sidebar and moves player cards above/below it (Lichess-style)
 */

export interface LayoutConfig {
  enabled: boolean;
  extractPlayerCards: boolean;
}

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

    /* Make sidebar much smaller - compact moves list */
    #board-layout-sidebar {
      --sidebarMinWidth: 250px !important;
      --sidebarMaxWidth: 280px !important;
      max-width: 280px !important;
    }

    /* Player cards container - above and below sidebar */
    .chess-kit-players-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    /* Top player card - positioned above sidebar */
    .chess-kit-player-top-wrapper {
      order: -1; /* Ensure it appears before sidebar content */
      margin-bottom: 8px;
    }

    /* Bottom player card - positioned below sidebar */
    .chess-kit-player-bottom-wrapper {
      order: 999; /* Ensure it appears after sidebar content */
      margin-top: 8px;
    }

    /* Style player cards when moved to sidebar */
    .chess-kit-players-container .board-layout-player {
      /* Reset any board-specific positioning */
      position: relative !important;
      left: auto !important;
      top: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
    }

    /* Make sidebar content area use flexbox for proper ordering */
    #board-layout-sidebar {
      display: flex !important;
      flex-direction: column !important;
    }

    /* Ensure tabs and content fit in smaller sidebar */
    #board-layout-sidebar .tabs-component {
      flex-shrink: 0;
    }

    #board-layout-sidebar .sidebar-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  `;

  document.head.appendChild(style);
}

/**
 * Extracts player cards from board area and moves them above/below sidebar
 */
export function transformPlayerCards(): void {
  const boardMain = document.querySelector('#board-layout-main');
  const sidebar = document.querySelector('#board-layout-sidebar');

  if (!boardMain || !sidebar) {
    console.warn('[Chess-Kit] Cannot find board or sidebar elements');
    return;
  }

  // Check if already transformed
  if (sidebar.hasAttribute(CHESS_KIT_TRANSFORMED_ATTR)) {
    return;
  }

  // Find player elements
  const playerTop = boardMain.querySelector('#board-layout-player-top');
  const playerBottom = boardMain.querySelector('#board-layout-player-bottom');

  if (!playerTop || !playerBottom) {
    console.warn('[Chess-Kit] Cannot find player elements');
    return;
  }

  // Clone player cards (to preserve original elements)
  const playerTopClone = playerTop.cloneNode(true) as HTMLElement;
  const playerBottomClone = playerBottom.cloneNode(true) as HTMLElement;

  // Wrap clones in wrappers for proper positioning
  const topWrapper = document.createElement('div');
  topWrapper.className = 'chess-kit-player-top-wrapper';
  topWrapper.appendChild(playerTopClone);

  const bottomWrapper = document.createElement('div');
  bottomWrapper.className = 'chess-kit-player-bottom-wrapper';
  bottomWrapper.appendChild(playerBottomClone);

  // Insert at beginning and end of sidebar
  sidebar.insertBefore(topWrapper, sidebar.firstChild);
  sidebar.appendChild(bottomWrapper);

  // Hide original player cards
  (playerTop as HTMLElement).style.display = 'none';
  (playerBottom as HTMLElement).style.display = 'none';

  // Mark sidebar as transformed
  sidebar.setAttribute(CHESS_KIT_TRANSFORMED_ATTR, 'true');

  console.log('[Chess-Kit] Player cards transformed successfully');
}

/**
 * Removes layout transformation
 */
export function removeLayoutTransformation(): void {
  // Remove injected CSS
  const style = document.getElementById(CHESS_KIT_STYLE_ID);
  if (style) style.remove();

  // Restore original player cards visibility
  const playerTop = document.querySelector('#board-layout-player-top') as HTMLElement;
  const playerBottom = document.querySelector('#board-layout-player-bottom') as HTMLElement;

  if (playerTop) playerTop.style.display = '';
  if (playerBottom) playerBottom.style.display = '';

  // Remove player card wrappers
  const topWrapper = document.querySelector('.chess-kit-player-top-wrapper');
  const bottomWrapper = document.querySelector('.chess-kit-player-bottom-wrapper');
  if (topWrapper) topWrapper.remove();
  if (bottomWrapper) bottomWrapper.remove();

  // Remove transformed attribute
  const sidebar = document.querySelector('#board-layout-sidebar');
  if (sidebar) sidebar.removeAttribute(CHESS_KIT_TRANSFORMED_ATTR);

  console.log('[Chess-Kit] Layout transformation removed');
}

/**
 * Applies complete layout transformation
 */
export function applyLayoutTransformation(config: LayoutConfig): void {
  if (!config.enabled) {
    removeLayoutTransformation();
    return;
  }

  // Inject CSS Grid override
  injectLayoutCSS(config);

  // Wait for DOM to settle, then extract player cards
  if (config.extractPlayerCards) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      transformPlayerCards();
    }, 100);
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
        if (sidebar && !sidebar.hasAttribute(CHESS_KIT_TRANSFORMED_ATTR)) {
          if (config.enabled && config.extractPlayerCards) {
            transformPlayerCards();
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
