import { makeDraggable } from "./lib/draggable";
import { DraggableSelector } from "./types";

function applyDraggableToSelectors() {
  chrome.storage.sync.get({ selectors: [] }, (items) => {
    const selectors: DraggableSelector[] = items.selectors;

    selectors.forEach((selectorConfig) => {
      const element = document.querySelector<HTMLElement>(
        selectorConfig.selector
      );
      if (element && !(element as any).__isDraggable) {
        (element as any).__isDraggable = true; // Mark as processed
        makeDraggable(selectorConfig.selector, {
          initial: {
            x: selectorConfig.position?.x,
            y: selectorConfig.position?.y,
            size: selectorConfig.size,
          },
          onDragEnd: (position) => {
            // Read the latest selectors, update the position, and save back.
            chrome.storage.sync.get({ selectors: [] }, (currentItems) => {
              const currentSelectors: DraggableSelector[] =
                currentItems.selectors;
              const selectorToUpdate = currentSelectors.find(
                (s) => s.id === selectorConfig.id
              );
              if (selectorToUpdate) {
                selectorToUpdate.position = position;
                chrome.storage.sync.set({ selectors: currentSelectors });
              }
            });
          },
          onResizeEnd: (size) => {
            // Read the latest selectors, update the size, and save back.
            chrome.storage.sync.get({ selectors: [] }, (currentItems) => {
              const currentSelectors: DraggableSelector[] =
                currentItems.selectors;
              const selectorToUpdate = currentSelectors.find(
                (s) => s.id === selectorConfig.id
              );
              if (selectorToUpdate) {
                selectorToUpdate.size = size;
                chrome.storage.sync.set({ selectors: currentSelectors });
              }
            });
          },
          handle: (root) => {
            const h = document.createElement("div");
            h.textContent = "⤧";
            Object.assign(h.style, {
              position: "absolute",
              top: "-28px",
              right: "-28px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "rgba(0,0,0,.7)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              userSelect: "none",
              zIndex: "9998",
            });
            root.appendChild(h);
            return h;
          },
          zIndex: 9999,
        });
      }
    });
  });
}

// Run on initial load
applyDraggableToSelectors();

// And observe for future changes to the DOM
const observer = new MutationObserver(applyDraggableToSelectors);
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
