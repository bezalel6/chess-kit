import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DraggableSelector } from "./types";

const Popup = () => {
  const [allSelectors, setAllSelectors] = useState<DraggableSelector[]>([]);
  const [activeSelectors, setActiveSelectors] = useState<DraggableSelector[]>([]);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  useEffect(() => {
    // Get all configured selectors from storage
    chrome.storage.sync.get({ selectors: [], extensionEnabled: true }, (items) => {
      const selectors = items.selectors.map((s: DraggableSelector) => ({
        ...s,
        isResizable: s.isResizable !== undefined ? s.isResizable : true,
        isRepositionable: s.isRepositionable !== undefined ? s.isRepositionable : true,
      }));
      setAllSelectors(selectors);
      setIsEnabled(items.extensionEnabled);

      // Now, ask the content script which ones are active on the current page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: "getActiveSelectors" }, (response) => {
            if (chrome.runtime.lastError) {
              // Content script might not be injected yet or page is protected
              console.log(chrome.runtime.lastError.message);
              setActiveSelectors([]);
            } else {
              const active = selectors.filter((s: DraggableSelector) => response && response.includes(s.selector));
              setActiveSelectors(active);
            }
          });
        }
      });
    });
  }, []);

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  const toggleEnabled = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.sync.set({ extensionEnabled: newState });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: newState ? "enable" : "disable" });
      }
    });
  };

  const forceContentScriptRefresh = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "refresh" });
      }
    });
  }

  const resetSelector = (id: string) => {
    const newSelectors = allSelectors.map((s: DraggableSelector) => {
      if (s.id === id) {
        delete s.position;
        delete s.size;
      }
      return s;
    });
    chrome.storage.sync.set({ selectors: newSelectors }, () => {
      setAllSelectors(newSelectors);
      setActiveSelectors(activeSelectors.map((s: DraggableSelector) => {
        if (s.id === id) {
          delete s.position;
          delete s.size;
        }
        return s;
      }));
      forceContentScriptRefresh();
    });
  };

  const resetAll = () => {
    const newSelectors = allSelectors.map((s: DraggableSelector) => {
      delete s.position;
      delete s.size;
      return s;
    });
    chrome.storage.sync.set({ selectors: newSelectors }, () => {
      setAllSelectors(newSelectors);
      setActiveSelectors([]);
      forceContentScriptRefresh();
    });
  };

  return (
    <div style={{ padding: '15px', minWidth: '350px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h1 style={{ fontSize: '16px', margin: '0' }}>Chess-Kit</h1>
        <button onClick={openOptionsPage} style={{ fontSize: '12px' }}>Manage Selectors</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={isEnabled} onChange={toggleEnabled} />
          <span style={{ marginLeft: '8px' }}>Enable Extension</span>
        </label>
        <button onClick={resetAll} style={{ fontSize: '12px', color: '#c0392b' }}>Reset All</button>
      </div>

      <h2 style={{ fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>Active On This Page</h2>
      {activeSelectors.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
          {activeSelectors.map((s) => (
            <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '5px' }}>
              <code>{s.selector}</code>
              <button onClick={() => resetSelector(s.id)} style={{ fontSize: '11px', color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '12px', color: '#666' }}>No configured selectors active on this page.</p>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
