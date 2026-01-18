import { DraggableSelector } from "./types";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { theme, createStyles, rgba } from "./theme";

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

  const styles = createStyles({
    container: {
      minHeight: '100vh',
      fontFamily: theme.typography.fontFamily,
      background: theme.gradients.background,
      color: theme.colors.lightGray,
      padding: '0',
      margin: '0',
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    },
    header: {
      background: theme.gradients.header,
      padding: `${theme.spacing.xxxl} 24px`,
      borderBottom: `3px solid ${theme.colors.primary}`,
      boxShadow: theme.shadows.lg,
      boxSizing: 'border-box',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xl,
    },
    logo: {
      width: '64px',
      height: '64px',
      borderRadius: theme.borderRadius.xl,
      boxShadow: theme.shadows.xl,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.fontSize.huge,
      fontWeight: theme.typography.fontWeight.bold,
      margin: `0 0 ${theme.spacing.sm} 0`,
      color: theme.colors.white,
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
    subtitle: {
      fontSize: theme.typography.fontSize.lg,
      color: rgba(theme.colors.white, theme.opacity.secondary),
      margin: '0',
      fontWeight: theme.typography.fontWeight.normal,
    },
    content: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 24px',
      boxSizing: 'border-box',
    },
    section: {
      background: rgba(theme.colors.white, 0.03),
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xxl,
      marginBottom: theme.spacing.xxxl,
      border: `1px solid ${rgba(theme.colors.white, theme.opacity.border)}`,
      boxShadow: theme.shadows.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: theme.spacing.xl,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    inputGroup: {
      display: 'flex',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      alignItems: 'stretch',
    },
    input: {
      flex: 1,
      padding: `${theme.spacing.lg} ${theme.spacing.lg}`,
      background: rgba(theme.colors.white, 0.08),
      border: `1px solid ${rgba(theme.colors.white, 0.2)}`,
      borderRadius: theme.borderRadius.lg,
      color: theme.colors.lightGray,
      fontSize: theme.typography.fontSize.lg,
      outline: 'none',
      transition: theme.transitions.normal,
    },
    button: {
      padding: `${theme.spacing.lg} ${theme.spacing.xxl}`,
      background: theme.gradients.primary,
      color: theme.colors.white,
      border: 'none',
      borderRadius: theme.borderRadius.lg,
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      transition: theme.transitions.normal,
      boxShadow: theme.shadows.primary,
    },
    checkboxGroup: {
      display: 'flex',
      gap: theme.spacing.xxl,
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      background: rgba(theme.colors.white, theme.opacity.overlay),
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${rgba(theme.colors.white, theme.opacity.border)}`,
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
      whiteSpace: 'nowrap',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: theme.colors.primary,
    },
    selectorList: {
      listStyle: 'none',
      padding: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.md,
    },
    selectorItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      background: rgba(theme.colors.white, theme.opacity.overlay),
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${rgba(theme.colors.primary, 0.3)}`,
      transition: theme.transitions.normal,
      gap: theme.spacing.md,
      flexWrap: 'wrap',
    },
    selectorCode: {
      fontFamily: theme.typography.fontFamilyMono,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.primary,
      background: rgba(theme.colors.primary, 0.15),
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      borderRadius: theme.borderRadius.md,
      fontWeight: theme.typography.fontWeight.medium,
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      flex: '1 1 auto',
      minWidth: '0',
    },
    selectorControls: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
      flexShrink: 0,
      flexWrap: 'nowrap',
    },
    buttonDanger: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      background: 'transparent',
      color: theme.colors.danger,
      border: `1px solid ${theme.colors.danger}`,
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      transition: theme.transitions.normal,
      whiteSpace: 'nowrap',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 20px',
      color: rgba(theme.colors.white, theme.opacity.disabled),
      fontSize: theme.typography.fontSize.lg,
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: theme.spacing.lg,
      opacity: 0.3,
    },
    hint: {
      fontSize: theme.typography.fontSize.base,
      color: rgba(theme.colors.white, theme.opacity.hint),
      marginTop: theme.spacing.sm,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <img src="logo.png" alt="Chess-Kit Logo" style={styles.logo} />
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>Chess-Kit Settings</h1>
            <p style={styles.subtitle}>Configure draggable selectors for your streaming layout</p>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>{theme.icons.add}</span>
            <span>Add New Selector</span>
          </h2>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={newSelector}
              onChange={(e) => setNewSelector(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSelector()}
              placeholder="Enter a CSS selector (e.g., #board-layout-main, .game-container)"
              style={styles.input}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
                e.currentTarget.style.background = rgba(theme.colors.white, 0.1);
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = rgba(theme.colors.white, 0.2);
                e.currentTarget.style.background = rgba(theme.colors.white, 0.08);
              }}
            />
            <button
              onClick={addSelector}
              style={styles.button}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = theme.shadows.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = theme.shadows.primary;
              }}
            >
              Add Selector
            </button>
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isRepositionable}
                onChange={(e) => setIsRepositionable(e.target.checked)}
                style={styles.checkbox}
              />
              <span>{theme.icons.reposition} Repositionable</span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isResizable}
                onChange={(e) => setIsResizable(e.target.checked)}
                style={styles.checkbox}
              />
              <span>{theme.icons.resize} Resizable</span>
            </label>
          </div>
          <div style={styles.hint}>
            <span>{theme.icons.lightbulb}</span>
            <span>Use CSS selectors like #id, .class, or element[attribute] to target specific elements on web pages</span>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>{theme.icons.list}</span>
            <span>Configured Selectors</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: theme.typography.fontSize.base,
              background: selectors.length > 0 ? theme.colors.primary : rgba(theme.colors.white, theme.opacity.border),
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              borderRadius: theme.borderRadius.pill,
              fontWeight: theme.typography.fontWeight.bold,
            }}>
              {selectors.length} {selectors.length === 1 ? 'Selector' : 'Selectors'}
            </span>
          </h2>
          {selectors.length > 0 ? (
            <ul style={styles.selectorList}>
              {selectors.map((s) => (
                <li
                  key={s.id}
                  style={styles.selectorItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = rgba(theme.colors.primary, 0.1);
                    e.currentTarget.style.borderColor = rgba(theme.colors.primary, 0.5);
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = rgba(theme.colors.white, theme.opacity.overlay);
                    e.currentTarget.style.borderColor = rgba(theme.colors.primary, 0.3);
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <code style={styles.selectorCode} title={s.selector}>{s.selector}</code>
                  <div style={styles.selectorControls}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={s.isRepositionable}
                        onChange={() => toggleSelectorProperty(s.id, 'isRepositionable')}
                        style={styles.checkbox}
                      />
                      <span style={{ fontSize: theme.typography.fontSize.md }}>Reposition</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={s.isResizable}
                        onChange={() => toggleSelectorProperty(s.id, 'isResizable')}
                        style={styles.checkbox}
                      />
                      <span style={{ fontSize: theme.typography.fontSize.md }}>Resize</span>
                    </label>
                    <button
                      onClick={() => removeSelector(s.id)}
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
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>{theme.icons.pawn}</div>
              <div>No selectors configured yet</div>
              <div style={{ fontSize: theme.typography.fontSize.base, marginTop: theme.spacing.sm, opacity: 0.6 }}>
                Add your first selector above to get started with customizing your streaming layout
              </div>
            </div>
          )}
        </div>
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
