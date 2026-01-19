/**
 * Data Readiness Detector - Multi-signal detection for player data
 */

export interface DataSignals {
  username: boolean;
  avatar: boolean;
  rating: boolean;
  clock: boolean;
  capturedPieces: boolean;
}

/**
 * Check if element has non-empty text content
 */
function hasNonEmptyText(parent: Element, selector: string): boolean {
  const element = parent.querySelector(selector);
  return !!(element && element.textContent && element.textContent.trim().length > 0);
}

/**
 * Check if image is loaded
 */
function hasLoadedImage(parent: Element, selector: string): boolean {
  const img = parent.querySelector(selector) as HTMLImageElement | null;
  return !!(img && img.complete && img.naturalHeight > 0);
}

/**
 * Check all data signals for a player element
 */
export function checkDataSignals(playerElement: Element): DataSignals {
  return {
    username: hasNonEmptyText(playerElement, '.cc-user-username-component') ||
              hasNonEmptyText(playerElement, '.user-username-component'),
    avatar: hasLoadedImage(playerElement, '.user-avatar-component img') ||
            !!playerElement.querySelector('.user-avatar-component'),
    rating: hasNonEmptyText(playerElement, '.player-rating') ||
            hasNonEmptyText(playerElement, '.user-tagline-rating'),
    clock: !!playerElement.querySelector('.clock-component'),
    capturedPieces: !!playerElement.querySelector('wc-captured-pieces'),
  };
}

/**
 * Check if data is ready based on signal threshold
 */
export function isDataReady(signals: DataSignals, minSignals = 3): boolean {
  const count = Object.values(signals).filter(Boolean).length;
  return count >= minSignals;
}

/**
 * Wait for data readiness with timeout
 */
export async function waitForDataReadiness(
  playerElement: Element,
  minSignals = 3,
  timeout = 10000
): Promise<DataSignals> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const signals = checkDataSignals(playerElement);

      if (isDataReady(signals, minSignals)) {
        console.log('[Chess-Kit] Data ready:', signals);
        resolve(signals);
        return;
      }

      if (Date.now() - startTime > timeout) {
        console.warn('[Chess-Kit] Data readiness timeout, proceeding with partial data:', signals);
        resolve(signals); // Resolve anyway with partial data
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
}
