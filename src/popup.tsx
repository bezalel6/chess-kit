import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DraggableSelector } from "./types";
import { theme, createStyles, rgba } from "./theme";

const Popup = () => {
  const [allSelectors, setAllSelectors] = useState<DraggableSelector[]>([]);
  const [activeSelectors, setActiveSelectors] = useState<DraggableSelector[]>([]);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  useEffect(() => {
    chrome.storage.sync.get({ selectors: [], extensionEnabled: true }, (items) => {
      const selectors = items.selectors.map((s: DraggableSelector) => ({
        ...s,
        isResizable: s.isResizable !== undefined ? s.isResizable : true,
        isRepositionable: s.isRepositionable !== undefined ? s.isRepositionable : true,
      }));
      setAllSelectors(selectors);
      setIsEnabled(items.extensionEnabled);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: "getActiveSelectors" }, (response) => {
            if (chrome.runtime.lastError) {
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

  const styles = createStyles({
    container: {
      width: '380px',
      minHeight: '200px',
      fontFamily: theme.typography.fontFamily,
      background: theme.gradients.background,
      color: theme.colors.lightGray,
    },
    header: {
      background: theme.gradients.header,
      padding: theme.spacing.xl,
      borderBottom: `3px solid ${theme.colors.primary}`,
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    logo: {
      width: '48px',
      height: '48px',
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.md,
    },
    title: {
      fontSize: theme.typography.fontSize.xxxl,
      fontWeight: theme.typography.fontWeight.bold,
      margin: '0',
      color: theme.colors.white,
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
    subtitle: {
      fontSize: theme.typography.fontSize.base,
      color: rgba(theme.colors.white, theme.opacity.secondary),
      margin: '0',
      fontWeight: theme.typography.fontWeight.normal,
    },
    controls: {
      display: 'flex',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    content: {
      padding: theme.spacing.xl,
    },
    toggleSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      background: rgba(theme.colors.white, theme.opacity.overlay),
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
      border: `1px solid ${rgba(theme.colors.white, theme.opacity.border)}`,
    },
    toggleLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: theme.colors.primary,
    },
    button: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      background: theme.gradients.primary,
      color: theme.colors.white,
      border: 'none',
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      transition: theme.transitions.normal,
      boxShadow: theme.shadows.sm,
    },
    buttonSecondary: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      background: 'transparent',
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.primary}`,
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      transition: theme.transitions.normal,
    },
    buttonDanger: {
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      background: 'transparent',
      color: theme.colors.danger,
      border: `1px solid ${theme.colors.danger}`,
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      transition: theme.transitions.normal,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: theme.spacing.md,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    selectorList: {
      listStyle: 'none',
      padding: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.sm,
    },
    selectorItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      background: rgba(theme.colors.white, theme.opacity.overlay),
      borderRadius: theme.borderRadius.md,
      border: `1px solid ${rgba(theme.colors.primary, 0.3)}`,
      transition: theme.transitions.normal,
    },
    selectorCode: {
      fontFamily: theme.typography.fontFamilyMono,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.primary,
      background: rgba(theme.colors.primary, 0.1),
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: theme.borderRadius.sm,
      maxWidth: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    emptyState: {
      textAlign: 'center',
      padding: `${theme.spacing.xxxl} ${theme.spacing.xl}`,
      color: rgba(theme.colors.white, theme.opacity.disabled),
      fontSize: theme.typography.fontSize.md,
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: theme.spacing.md,
      opacity: 0.3,
    },
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <img src="logo.png" alt="Chess-Kit Logo" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Chess-Kit</h1>
            <p style={styles.subtitle}>Streamer Layout Toolkit</p>
          </div>
        </div>
        <div style={styles.controls}>
          <button
            onClick={openOptionsPage}
            style={styles.buttonSecondary}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = rgba(theme.colors.primary, 0.1);
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {theme.icons.settings} Manage Selectors
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.toggleSection}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={toggleEnabled}
              style={styles.checkbox}
            />
            <span>{isEnabled ? `${theme.icons.checkmark} Extension Enabled` : `${theme.icons.cross} Extension Disabled`}</span>
          </label>
          <button
            onClick={resetAll}
            style={styles.buttonDanger}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = rgba(theme.colors.danger, 0.1);
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {theme.icons.reset} Reset All
          </button>
        </div>

        <div style={styles.sectionTitle}>
          <span>{theme.icons.location}</span>
          <span>Active On This Page</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: theme.typography.fontSize.sm,
            background: activeSelectors.length > 0 ? theme.colors.primary : rgba(theme.colors.white, theme.opacity.border),
            padding: `2px ${theme.spacing.sm}`,
            borderRadius: theme.borderRadius.pill,
            fontWeight: theme.typography.fontWeight.bold,
          }}>
            {activeSelectors.length}
          </span>
        </div>

        {activeSelectors.length > 0 ? (
          <ul style={styles.selectorList}>
            {activeSelectors.map((s) => (
              <li
                key={s.id}
                style={styles.selectorItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = rgba(theme.colors.primary, 0.1);
                  e.currentTarget.style.borderColor = rgba(theme.colors.primary, 0.5);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = rgba(theme.colors.white, theme.opacity.overlay);
                  e.currentTarget.style.borderColor = rgba(theme.colors.primary, 0.3);
                }}
              >
                <code style={styles.selectorCode} title={s.selector}>{s.selector}</code>
                <button
                  onClick={() => resetSelector(s.id)}
                  style={{
                    ...styles.buttonDanger,
                    fontSize: theme.typography.fontSize.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = rgba(theme.colors.danger, 0.1);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Reset
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>{theme.icons.pawn}</div>
            <div>No configured selectors active on this page.</div>
            <div style={{ fontSize: theme.typography.fontSize.sm, marginTop: theme.spacing.sm, opacity: 0.6 }}>
              Visit a chess streaming site or add selectors in settings.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
