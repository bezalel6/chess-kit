// Chess-Kit Theme Configuration
// Centralized color scheme and styling for easy customization

export const theme = {
  // Primary Colors - Enhanced visibility theme
  colors: {
    // Main brand colors - Brighter teal/cyan for better contrast
    primary: '#14b8a6',      // Vibrant teal
    primaryLight: '#2dd4bf',
    primaryDark: '#0d9488',

    // Secondary colors - Warmer orange/amber
    secondary: '#f59e0b',    // Bright amber
    secondaryDark: '#d97706',

    // Accent colors
    accent: '#fbbf24',       // Gold/yellow accent for headings

    // Status colors
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',

    // Debug mode colors
    debugFound: '#4CAF50',      // Green for found elements
    debugNotFound: '#f44336',   // Red for missing elements
    debugOverlay: 'rgba(76, 175, 80, 0.1)',
    debugOverlayMissing: 'rgba(244, 67, 54, 0.1)',

    // Neutral colors - Better contrast
    dark: '#0f172a',         // Darker slate
    darkGray: '#1e293b',
    lightGray: '#f1f5f9',
    white: '#ffffff',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    primaryHover: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    header: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },

  // Opacity values
  opacity: {
    disabled: 0.4,
    hint: 0.5,
    secondary: 0.7,
    overlay: 0.05,
    border: 0.1,
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },

  // Border radius
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    round: '50%',
    pill: '999px',
  },

  // Shadows
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    md: '0 2px 8px rgba(0, 0, 0, 0.3)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.3)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.4)',
    primary: '0 2px 8px rgba(74, 124, 89, 0.3)',
    primaryHover: '0 4px 12px rgba(74, 124, 89, 0.4)',
  },

  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: '"Fira Code", "Courier New", monospace',

    fontSize: {
      xs: '10px',
      sm: '11px',
      base: '12px',
      md: '13px',
      lg: '14px',
      xl: '16px',
      xxl: '18px',
      xxxl: '24px',
      huge: '32px',
    },

    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Transitions
  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },

  // Icons - Using text instead of emojis to avoid encoding issues
  icons: {
    settings: '\u2699\uFE0F',      // ⚙️
    checkmark: '\u2713',            // ✓
    cross: '\u2717',                // ✗
    reset: '\u21BB',                // ↻
    location: '\uD83D\uDCCD',       // 📍
    add: '\u002B',                  // +
    list: '\uD83D\uDCCB',           // 📋
    lightbulb: '\uD83D\uDCA1',      // 💡
    pawn: '\u265F',                 // ♟
    reposition: '\uD83D\uDD04',     // 🔄
    resize: '\u2194\uFE0F',         // ↔️
  },
};

// Helper function to create RGBA colors
export const rgba = (color: string, opacity: number): string => {
  // Simple hex to rgba converter
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to create styles with theme
export const createStyles = <T extends Record<string, React.CSSProperties>>(
  styles: T
): T => styles;
