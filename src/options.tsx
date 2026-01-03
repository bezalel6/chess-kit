import { DraggableSelector } from "./types";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const Options = () => {
  const [selectors, setSelectors] = useState<DraggableSelector[]>([]);
  const [newSelector, setNewSelector] = useState<string>("");

  useEffect(() => {
    chrome.storage.sync.get({ selectors: [] }, (items) => {
      setSelectors(items.selectors);
    });
  }, []);

  const saveSelectors = (newSelectors: DraggableSelector[]) => {
    chrome.storage.sync.set({ selectors: newSelectors }, () => {
      setSelectors(newSelectors);
    });
  };

  const addSelector = () => {
    if (newSelector.trim() === "") return;
    const newId = Date.now().toString();
    const selector: DraggableSelector = {
      id: newId,
      selector: newSelector.trim(),
    };
    saveSelectors([...selectors, selector]);
    setNewSelector("");
  };

  const removeSelector = (id: string) => {
    const newSelectors = selectors.filter((s) => s.id !== id);
    saveSelectors(newSelectors);
  };

  return (
    <div style={{ padding: '10px', minWidth: '400px' }}>
      <h2>Draggable Selectors</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={newSelector}
          onChange={(e) => setNewSelector(e.target.value)}
          placeholder="Enter a CSS selector (e.g., #my-id)"
          style={{ width: '300px', marginRight: '10px' }}
        />
        <button onClick={addSelector}>Add</button>
      </div>
      <ul>
        {selectors.map((s) => (
          <li key={s.id} style={{ marginBottom: '5px' }}>
            <code>{s.selector}</code>
            <button onClick={() => removeSelector(s.id)} style={{ marginLeft: '10px' }}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);