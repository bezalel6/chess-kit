import { makeDraggable } from "./lib/draggable";
import { DraggableSelector } from "./types";

let draggableInstances: { destroy: () => void }[] = [];

function destroyAllDraggables() {
  draggableInstances.forEach(instance => instance.destroy());
  draggableInstances = [];
  document.querySelectorAll('[data-is-draggable="true"]').forEach(el => {
    el.removeAttribute('data-is-draggable');
    el.removeAttribute('data-selector');
  });
}

function applyDraggableToSelectors() {
  chrome.storage.sync.get({ selectors: [], extensionEnabled: true }, (items) => {
    if (!items.extensionEnabled) {
      destroyAllDraggables();
      return;
    }

    const selectors: DraggableSelector[] = items.selectors;

    selectors.forEach((selectorConfig) => {
      const element = document.querySelector<HTMLElement>(selectorConfig.selector);
      if (element && element.getAttribute('data-is-draggable') !== 'true') {
        element.setAttribute('data-is-draggable', 'true');
        element.setAttribute('data-selector', selectorConfig.selector); // Store selector

        const instance = makeDraggable(selectorConfig.selector, {
          initial: {
            x: selectorConfig.position?.x,
            y: selectorConfig.position?.y,
            size: selectorConfig.size,
          },
          isRepositionable: selectorConfig.isRepositionable,
          isResizable: selectorConfig.isResizable,
          onDragEnd: (position) => {
            chrome.storage.sync.get({ selectors: [] }, (currentItems) => {
              const currentSelectors: DraggableSelector[] = currentItems.selectors;
              const selectorToUpdate = currentSelectors.find(s => s.id === selectorConfig.id);
              if (selectorToUpdate) {
                selectorToUpdate.position = position;
                chrome.storage.sync.set({ selectors: currentSelectors });
              }
            });
          },
          onResizeEnd: (size) => {
            chrome.storage.sync.get({ selectors: [] }, (currentItems) => {
              const currentSelectors: DraggableSelector[] = currentItems.selectors;
              const selectorToUpdate = currentSelectors.find(s => s.id === selectorConfig.id);
              if (selectorToUpdate) {
                selectorToUpdate.size = size;
                chrome.storage.sync.set({ selectors: currentSelectors });
              }
            });
          },
          zIndex: 9999,
        });
        draggableInstances.push(instance);
      }
    });
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "enable") {
    applyDraggableToSelectors();
  } else if (message.action === "disable") {
    destroyAllDraggables();
  } else if (message.action === "getActiveSelectors") {
    const activeSelectors = Array.from(document.querySelectorAll('[data-is-draggable="true"]'))
      .map(el => el.getAttribute('data-selector'));
    sendResponse(activeSelectors);
  } else if (message.action === "refresh") {
    destroyAllDraggables();
    applyDraggableToSelectors();
  }
  return true; // Keep the message channel open for async response
});

// Initial run
applyDraggableToSelectors();

// And observe for future changes to the DOM
const observer = new MutationObserver(applyDraggableToSelectors);
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
