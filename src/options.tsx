import { DraggableSelector } from "./types";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const Options = () => {
  const [selectors, setSelectors] = useState<DraggableSelector[]>([]);
  const [newSelector, setNewSelector] = useState<string>("");
  const [isResizable, setIsResizable] = useState<boolean>(true);
  const [isRepositionable, setIsRepositionable] = useState<boolean>(true);

  useEffect(() => {
    chrome.storage.sync.get({ selectors: [] }, (items) => {
      const migratedSelectors = items.selectors.map((s: DraggableSelector) => ({
        ...s,
        isResizable: s.isResizable !== undefined ? s.isResizable : true,
        isRepositionable: s.isRepositionable !== undefined ? s.isRepositionable : true,
      }));
      setSelectors(migratedSelectors);
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
      isResizable,
      isRepositionable,
    };
    saveSelectors([...selectors, selector]);
    setNewSelector("");
  };

  const removeSelector = (id: string) => {
    const newSelectors = selectors.filter((s) => s.id !== id);
    saveSelectors(newSelectors);
  };

  const toggleSelectorProperty = (id: string, property: 'isResizable' | 'isRepositionable') => {
    const newSelectors = selectors.map(s => {
      if (s.id === id) {
        return { ...s, [property]: !s[property] };
      }
      return s;
    });
    saveSelectors(newSelectors);
  };

  return (
    <div style={{ padding: '20px', minWidth: '500px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>Chess-Kit Options</h1>
      <div style={{ background: '#f7f7f7', padding: '15px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '16px', marginTop: '0', marginBottom: '15px' }}>Add New Selector</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <input
            type="text"
            value={newSelector}
            onChange={(e) => setNewSelector(e.target.value)}
            placeholder="Enter a CSS selector (e.g., #my-id)"
            style={{ width: '100%', padding: '8px', marginRight: '10px', flexGrow: 1 }}
          />
          <button onClick={addSelector} style={{ padding: '8px 12px' }}>Add</button>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <label>
            <input
              type="checkbox"
              checked={isRepositionable}
              onChange={(e) => setIsRepositionable(e.target.checked)}
            />
            Repositionable
          </label>
          <label>
            <input
              type="checkbox"
              checked={isResizable}
              onChange={(e) => setIsResizable(e.target.checked)}
            />
            Resizable
          </label>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Configured Selectors</h2>
        <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
          {selectors.map((s) => (
            <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <code>{s.selector}</code>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={s.isRepositionable}
                    onChange={() => toggleSelectorProperty(s.id, 'isRepositionable')}
                  />
                  Reposition
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={s.isResizable}
                    onChange={() => toggleSelectorProperty(s.id, 'isResizable')}
                  />
                  Resize
                </label>
                <button onClick={() => removeSelector(s.id)} style={{ fontSize: '12px', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);