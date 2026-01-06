import { DraggableSelector } from "./types";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.get({ selectors: [] }, (items) => {
      if (items.selectors.length === 0) {
        const defaultSelectors: DraggableSelector[] = [
          {
            id: crypto.randomUUID(),
            selector: "#board-layout-main",
            isResizable: true,
            isRepositionable: true,
          },
          {
            id: crypto.randomUUID(),
            selector: "#board-layout-sidebar",
            isResizable: true,
            isRepositionable: true,
          },
        ];
        chrome.storage.sync.set({ selectors: defaultSelectors });
      }
    });
  }
});


function polling() {
  // console.log("polling");
  setTimeout(polling, 1000 * 30);
}

polling();