import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChessKitConfig } from './types';
import { theme, rgba, createStyles } from './theme';

const Options: React.FC = () => {
  const [config, setConfig] = useState<ChessKitConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    chrome.storage.sync.get('config', (items) => {
      setConfig(items.config || null);
      setLoading(false);
    });
  };

  const saveConfig = (newConfig: ChessKitConfig) => {
    chrome.storage.sync.set({ config: newConfig }, () => {
      setConfig(newConfig);
      // Notify content script to refresh
      chrome.tabs.query({ url: '*://*.chess.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'refresh' });
          }
        });
      });
    });
  };

  const togglePlayerCards = () => {
    if (!config) return;
    const newConfig = { ...config };
    newConfig.extractPlayerCards = !newConfig.extractPlayerCards;
    saveConfig(newConfig);
  };

  const toggleDebugMode = () => {
    if (!config) return;
    const newConfig = { ...config };
    newConfig.debugMode = !newConfig.debugMode;
    saveConfig(newConfig);
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!config) {
    return <div style={styles.error}>Failed to load configuration</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <img src="logo.png" alt="Chess-Kit Logo" style={styles.logo} />
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>Chess-Kit Configuration</h1>
            <p style={styles.subtitle}>
              Transform Chess.com to Lichess-style layout
            </p>
          </div>
        </div>
      </header>

      <div style={styles.content}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Layout Options</h2>

          <div style={styles.optionCard}>
            <div style={styles.optionHeader}>
              <div>
                <h3 style={styles.optionTitle}>Compact Sidebar Layout</h3>
                <p style={styles.optionDescription}>
                  Make sidebar smaller and move player cards above/below it (Lichess-style)
                </p>
              </div>
              <button
                style={{
                  ...styles.button,
                  ...(config.extractPlayerCards ? styles.buttonActive : {}),
                }}
                onClick={togglePlayerCards}
              >
                {config.extractPlayerCards ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Debug Options</h2>

          <div style={styles.optionCard}>
            <div style={styles.optionHeader}>
              <div>
                <h3 style={styles.optionTitle}>Debug Mode</h3>
                <p style={styles.optionDescription}>
                  Show transformation status overlay on Chess.com pages
                </p>
              </div>
              <button
                style={{
                  ...styles.button,
                  ...(config.debugMode ? styles.buttonActive : {}),
                }}
                onClick={toggleDebugMode}
              >
                {config.debugMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Chess-Kit v{config.version} • Navigate to Chess.com to see changes
        </p>
      </footer>
    </div>
  );
};

const styles = createStyles({
  container: {
    minHeight: '100vh',
    background: theme.gradients.background,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.white,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.danger,
  },
  header: {
    background: theme.gradients.header,
    padding: `${theme.spacing.xxxl} 24px`,
    borderBottom: `3px solid ${theme.colors.primary}`,
    boxShadow: theme.shadows.lg,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xl,
    maxWidth: '1200px',
    margin: '0 auto',
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
    color: theme.colors.white,
    margin: `0 0 ${theme.spacing.sm} 0`,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: rgba(theme.colors.white, 0.7),
    margin: 0,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  section: {
    background: rgba(theme.colors.white, 0.03),
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.xxxl,
    border: `1px solid ${rgba(theme.colors.white, 0.1)}`,
    boxShadow: theme.shadows.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accent,
    margin: `0 0 ${theme.spacing.lg} 0`,
  },
  optionCard: {
    background: rgba(theme.colors.darkGray, 0.8),
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    border: `1px solid ${rgba(theme.colors.white, 0.1)}`,
    marginBottom: theme.spacing.md,
    transition: theme.transitions.normal,
  },
  optionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    margin: `0 0 ${theme.spacing.xs} 0`,
  },
  optionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: rgba(theme.colors.white, 0.7),
    margin: 0,
  },
  button: {
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    background: rgba(theme.colors.white, 0.2),
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: theme.transitions.normal,
    boxShadow: theme.shadows.md,
    minWidth: '140px',
  },
  buttonActive: {
    background: theme.colors.success,
  },
  footer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `${theme.spacing.lg} 24px`,
    borderTop: `1px solid ${rgba(theme.colors.white, 0.1)}`,
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: rgba(theme.colors.white, 0.5),
    margin: 0,
  },
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
