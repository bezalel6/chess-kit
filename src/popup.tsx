import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChessKitConfig, TransformationStatus } from './types';
import { theme, createStyles, rgba } from './theme';

const Popup: React.FC = () => {
  const [config, setConfig] = useState<ChessKitConfig | null>(null);
  const [status, setStatus] = useState<TransformationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    chrome.storage.sync.get('config', (items) => {
      const cfg: ChessKitConfig | undefined = items.config;
      setConfig(cfg || null);
      setLoading(false);

      // Get transformation status from current tab
      if (cfg) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { type: 'getStatus' },
              (response: TransformationStatus) => {
                if (chrome.runtime.lastError) {
                  console.log('[Chess-Kit] Error:', chrome.runtime.lastError.message);
                  setStatus(null);
                } else {
                  setStatus(response);
                }
              }
            );
          }
        });
      }
    });
  };

  const toggleExtension = () => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.enabled = !newConfig.enabled;

    chrome.storage.sync.set({ config: newConfig }, () => {
      setConfig(newConfig);

      // Notify content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: newConfig.enabled ? 'enable' : 'disable',
          });
        }
      });
    });
  };

  const toggleDebugMode = () => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.debugMode = !newConfig.debugMode;

    chrome.storage.sync.set({ config: newConfig }, () => {
      setConfig(newConfig);

      // Notify content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'toggleDebug' });
        }
      });
    });
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!config) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Configuration not found</p>
          <button style={styles.button} onClick={openOptionsPage}>
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <img src="logo.png" alt="Chess-Kit Logo" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Chess-Kit</h1>
            <p style={styles.subtitle}>Lichess-style Layout for Chess.com</p>
          </div>
        </div>
      </header>

      <div style={styles.content}>
        <section style={styles.section}>
          <div style={styles.toggleGroup}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={toggleExtension}
                style={styles.checkbox}
              />
              <span>
                {config.enabled ? '✓ Extension Enabled' : '✗ Extension Disabled'}
              </span>
            </label>

            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={config.debugMode}
                onChange={toggleDebugMode}
                style={styles.checkbox}
              />
              <span>{config.debugMode ? '✓ Debug Mode' : 'Debug Mode'}</span>
            </label>
          </div>
        </section>

        {status && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Transformation Status</h2>
            <div style={styles.statusList}>
              <div style={styles.statusItem}>
                <span style={styles.statusIcon}>
                  {status.cssInjected ? '✓' : '✗'}
                </span>
                <span style={styles.statusName}>CSS Grid Injected</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusIcon}>
                  {status.playerCardsExtracted ? '✓' : '✗'}
                </span>
                <span style={styles.statusName}>Player Cards Moved</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusIcon}>
                  {status.cssInjected ? '✓' : '✗'}
                </span>
                <span style={styles.statusName}>Sidebar Compacted</span>
              </div>
            </div>
          </section>
        )}

        <section style={styles.section}>
          <div style={styles.actionButtons}>
            <button style={styles.button} onClick={openOptionsPage}>
              ⚙ Settings
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const styles = createStyles({
  container: {
    width: '360px',
    minHeight: '200px',
    fontFamily: theme.typography.fontFamily,
    background: theme.gradients.background,
    color: theme.colors.white,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
  },
  error: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.danger,
  },
  header: {
    background: theme.gradients.header,
    padding: theme.spacing.lg,
    borderBottom: `2px solid ${theme.colors.primary}`,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    margin: 0,
    color: theme.colors.white,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: rgba(theme.colors.white, 0.7),
    margin: 0,
  },
  content: {
    padding: theme.spacing.lg,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.md,
  },
  section: {
    background: rgba(theme.colors.white, 0.03),
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    border: `1px solid ${rgba(theme.colors.white, 0.1)}`,
  },
  toggleGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.sm,
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accent,
    margin: `0 0 ${theme.spacing.sm} 0`,
  },
  statusList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.xs,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    background: rgba(theme.colors.success, 0.1),
    borderRadius: theme.borderRadius.sm,
  },
  statusIcon: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statusName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    background: theme.gradients.primary,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: theme.transitions.normal,
  },
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
