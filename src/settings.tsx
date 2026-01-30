import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChessKitConfig } from './types';
import { theme, createStyles, rgba } from './theme';

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

type FeatureKey = keyof Pick<
  ChessKitConfig,
  'compactSidebar' | 'repositionPlayerCards' | 'lagOverlay' | 'debugMode'
>;

type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  description: string;
  dependsOn?: FeatureKey;
};

type Section = {
  id: string;
  label: string;
  features: FeatureDefinition[];
};

const SECTIONS: Section[] = [
  {
    id: 'layout',
    label: 'Layout',
    features: [
      {
        key: 'compactSidebar',
        label: 'Compact Sidebar',
        description: 'Shrink sidebar and adjust grid spacing',
      },
      {
        key: 'repositionPlayerCards',
        label: 'Reposition Player Cards',
        description: 'Move player name cards above/below the sidebar',
        dependsOn: 'compactSidebar',
      },
    ],
  },
  {
    id: 'overlay',
    label: 'Overlay',
    features: [
      {
        key: 'lagOverlay',
        label: 'Lag Telemetry',
        description: 'Floating overlay with ping, FPS, input & move latency',
      },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    features: [
      {
        key: 'debugMode',
        label: 'Debug Overlay',
        description: 'Show transformation status diagnostics on page',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Toggle switch sub-component
// ---------------------------------------------------------------------------

const TOGGLE_W = 36;
const TOGGLE_H = 20;
const KNOB_SIZE = 16;
const KNOB_OFFSET = 2;

const ToggleSwitch: React.FC<{
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}> = ({ active, disabled, onToggle, label }) => (
  <button
    style={{
      ...styles.toggle,
      ...(active ? styles.toggleActive : {}),
      ...(disabled ? styles.toggleDisabled : {}),
    }}
    onClick={disabled ? undefined : onToggle}
    aria-label={`Toggle ${label}`}
    aria-checked={active}
    role="switch"
    disabled={disabled}
  >
    <span
      style={{
        ...styles.toggleKnob,
        ...(active ? styles.toggleKnobActive : {}),
      }}
    />
  </button>
);

// ---------------------------------------------------------------------------
// Main settings component
// ---------------------------------------------------------------------------

const Settings: React.FC = () => {
  const [config, setConfig] = useState<ChessKitConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const manifestVersion = chrome.runtime.getManifest().version;

  useEffect(() => {
    chrome.storage.sync.get('config', (items) => {
      setConfig(items.config || null);
      setLoading(false);
    });
  }, []);

  const toggleFeature = (key: FeatureKey) => {
    if (!config) return;

    const newConfig = { ...config, [key]: !config[key] };

    // If turning off a parent, also turn off dependents
    if (!newConfig[key]) {
      for (const section of SECTIONS) {
        for (const feature of section.features) {
          if (feature.dependsOn === key) {
            newConfig[feature.key] = false;
          }
        }
      }
    }

    chrome.storage.sync.set({ config: newConfig }, () => {
      setConfig(newConfig);
      chrome.tabs.query({ url: '*://*.chess.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'refresh' });
          }
        });
      });
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!config) {
    return (
      <div style={styles.card}>
        <div style={styles.error}>Configuration not found</div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src="logo.png" alt="Chess-Kit" style={styles.logo} />
          <span style={styles.title}>Chess-Kit</span>
        </div>
        <span style={styles.versionBadge}>v{manifestVersion}</span>
      </header>

      {/* Sections */}
      <div style={styles.body}>
        {SECTIONS.map((section) => (
          <div key={section.id} style={styles.section}>
            <h2 style={styles.sectionLabel}>{section.label.toUpperCase()}</h2>
            <div style={styles.sectionCards}>
              {section.features.map((feature) => {
                const active = config[feature.key];
                const parentOff =
                  feature.dependsOn != null && !config[feature.dependsOn];
                const isDependent = feature.dependsOn != null;

                return (
                  <div
                    key={feature.key}
                    style={{
                      ...styles.featureRow,
                      ...(isDependent ? styles.featureRowDependent : {}),
                      ...(active && !parentOff
                        ? styles.featureRowActive
                        : {}),
                      ...(parentOff ? styles.featureRowDisabled : {}),
                    }}
                  >
                    <div style={styles.featureInfo}>
                      <span
                        style={{
                          ...styles.featureLabel,
                          ...(parentOff ? styles.featureLabelDisabled : {}),
                        }}
                      >
                        {isDependent && (
                          <span style={styles.dependentArrow}>{'\u21B3'} </span>
                        )}
                        {feature.label}
                      </span>
                      <span
                        style={{
                          ...styles.featureDescription,
                          ...(parentOff
                            ? styles.featureDescriptionDisabled
                            : {}),
                        }}
                      >
                        {feature.description}
                      </span>
                    </div>
                    <ToggleSwitch
                      active={active}
                      disabled={parentOff}
                      onToggle={() => toggleFeature(feature.key)}
                      label={feature.label}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <span style={styles.footerText}>Chess-Kit v{manifestVersion}</span>
      </footer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles({
  // Card container — 400px, works as popup or centered card
  card: {
    width: '400px',
    fontFamily: theme.typography.fontFamily,
    background: theme.gradients.background,
    color: theme.colors.white,
    borderRadius: '0px', // popup clips corners; options.html rounds via wrapper
    overflow: 'hidden',
  },

  // Loading / error
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    width: '400px',
    fontFamily: theme.typography.fontFamily,
    background: theme.gradients.background,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.danger,
    padding: theme.spacing.xl,
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: theme.gradients.header,
    borderBottom: `2px solid ${theme.colors.primary}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logo: {
    width: '28px',
    height: '28px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  versionBadge: {
    fontSize: theme.typography.fontSize.xs,
    color: rgba(theme.colors.white, 0.45),
    fontFamily: theme.typography.fontFamilyMono,
  },

  // Body
  body: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.lg,
  },

  // Section
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent,
    letterSpacing: '0.08em',
    margin: 0,
    padding: `0 ${theme.spacing.xs}`,
  },
  sectionCards: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    border: `1px solid ${rgba(theme.colors.white, 0.07)}`,
  },

  // Feature row
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    background: rgba(theme.colors.white, 0.03),
    transition: theme.transitions.fast,
  },
  featureRowActive: {
    background: rgba(theme.colors.primary, 0.08),
  },
  featureRowDependent: {
    borderLeft: `3px solid ${rgba(theme.colors.primary, 0.3)}`,
    paddingLeft: theme.spacing.md,
  },
  featureRowDisabled: {
    opacity: 0.45,
  },

  // Feature info
  featureInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    minWidth: 0,
  },
  featureLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  featureLabelDisabled: {
    color: rgba(theme.colors.white, 0.6),
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: rgba(theme.colors.white, 0.5),
    lineHeight: '1.3',
  },
  featureDescriptionDisabled: {
    color: rgba(theme.colors.white, 0.35),
  },
  dependentArrow: {
    color: rgba(theme.colors.primary, 0.6),
    marginRight: '2px',
  },

  // Toggle switch
  toggle: {
    position: 'relative' as const,
    width: `${TOGGLE_W}px`,
    height: `${TOGGLE_H}px`,
    borderRadius: `${TOGGLE_H / 2}px`,
    border: 'none',
    background: rgba(theme.colors.white, 0.15),
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    transition: 'background 0.2s ease',
  },
  toggleActive: {
    background: theme.colors.primary,
  },
  toggleDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  toggleKnob: {
    position: 'absolute' as const,
    top: `${KNOB_OFFSET}px`,
    left: `${KNOB_OFFSET}px`,
    width: `${KNOB_SIZE}px`,
    height: `${KNOB_SIZE}px`,
    borderRadius: '50%',
    background: theme.colors.white,
    transition: 'left 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  toggleKnobActive: {
    left: `${TOGGLE_W - KNOB_SIZE - KNOB_OFFSET}px`,
  },

  // Footer
  footer: {
    padding: `${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.md}`,
    borderTop: `1px solid ${rgba(theme.colors.white, 0.07)}`,
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: rgba(theme.colors.white, 0.3),
    fontFamily: theme.typography.fontFamilyMono,
  },
});

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Settings />);
}
