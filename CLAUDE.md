# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chess-Kit is a multi-browser extension (Manifest V3) that enables chess streamers to standardize their layouts across different websites and game modes. It provides draggable and resizable selectors that can be configured to reposition and resize DOM elements on any webpage. The extension supports both Chrome and Firefox with browser-specific builds.

## Development Commands

### Build & Development
```bash
# Development builds with file watching
npm run watch              # Chrome (default, backwards compatible)
npm run watch:chrome       # Chrome with live reload
npm run watch:firefox      # Firefox with live reload

# Production builds (optimized, no source maps)
npm run build              # Build both Chrome and Firefox
npm run build:chrome       # Build Chrome only
npm run build:firefox      # Build Firefox only

# Package for distribution (increments version, builds, creates zips)
npm run package            # Package both browsers
npm run package:chrome     # Package Chrome only
npm run package:firefox    # Package Firefox only

# Clean build artifacts
npm run clean              # Remove all dist folders and zips
npm run clean:chrome       # Remove Chrome build only
npm run clean:firefox      # Remove Firefox build only

# Testing & formatting
npm run test               # Run Jest tests
npm run style              # Format TypeScript files with Prettier
```

### Testing in Browsers

**Chrome**
1. Build: `npm run build:chrome`
2. Navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `dist-chrome/` directory

**Firefox**
1. Build: `npm run build:firefox`
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in `dist-firefox/` (e.g., `manifest.json`)

## Architecture

### Multi-Browser Build System

The project uses a sophisticated build system that generates separate extensions for Chrome and Firefox:

**Key Files:**
- `public/manifest-chrome.json` - Chrome Manifest V3 (version source of truth)
- `public/manifest-firefox.json` - Firefox Manifest V3 with `browser_specific_settings`
- `webpack/webpack.common.js` - Environment-aware webpack configuration
- `scripts/build.js` - Multi-browser build and packaging script

**Build Outputs:**
- `dist-chrome/` and `chrome-extension.zip` - Chrome extension
- `dist-firefox/` and `firefox-extension.zip` - Firefox extension

**Version Management:**
- `manifest-chrome.json` is the single source of truth for version numbers
- Package scripts automatically sync version to `manifest-firefox.json`
- Both extensions always have matching version numbers

**Browser Detection:**
```typescript
// Runtime browser detection (injected by webpack)
if (process.env.BROWSER === 'firefox') {
  // Firefox-specific code
} else {
  // Chrome-specific code
}
```

For comprehensive build system documentation, see `BUILD_SYSTEM.md`.

### Chrome Extension Components

**Background Service Worker** (`src/background.ts`)
- Runs independently in the background
- Initializes default selectors on first install (e.g., `#board-layout-main`, `#board-layout-sidebar`)
- Uses `chrome.storage.sync` to persist selector configurations across devices

**Content Script** (`src/content_script.tsx`)
- Injected into all pages via manifest `content_scripts` with `<all_urls>` match pattern
- Applies draggable behavior to configured selectors on page load
- Uses `MutationObserver` to handle dynamically added DOM elements
- Maintains `draggableInstances` array to track and clean up active instances
- Listens for messages: `enable`, `disable`, `refresh`, `getActiveSelectors`
- Marks active elements with `data-is-draggable="true"` and `data-selector` attributes

**Popup** (`src/popup.tsx`)
- React UI shown when clicking the extension icon
- Displays active selectors on the current page
- Toggle extension on/off for current page
- Reset individual selector positions/sizes or reset all
- Links to options page

**Options Page** (`src/options.tsx`)
- React UI for managing selector configurations
- Add/remove CSS selectors
- Configure `isResizable` and `isRepositionable` properties per selector
- All changes saved to `chrome.storage.sync`

### Core Library

**Draggable System** (`src/lib/draggable.ts`)
- `makeDraggable(selector, opts)` is the core function that makes elements draggable/resizable
- Prevents elements from jumping by capturing their initial `getBoundingClientRect()` before applying styles
- Creates an overlay `controlsContainer` with drag handle and resize handles
- Uses `position: absolute` with `top`/`left` for positioning
- Supports 8-direction resizing (n, ne, e, se, s, sw, w, nw) plus a drag handle
- Callbacks: `onDragEnd(position)` and `onResizeEnd(size)` to persist changes
- Returns a `destroy()` method to clean up event listeners and DOM modifications

**Theme System** (`src/theme.ts`)
- **Centralized styling**: All colors, spacing, typography, and other design tokens in one place
- **Easy customization**: Change the entire color scheme by modifying values in `theme.colors`
- **Helper functions**:
  - `rgba(color, opacity)`: Converts hex colors to rgba with specified opacity
  - `createStyles()`: Type-safe style object creation helper
- **Key theme properties**:
  - `colors`: Primary, secondary, accent, status, and neutral colors
  - `gradients`: Pre-defined gradient combinations
  - `spacing`: Consistent spacing scale (xs to xxxl)
  - `borderRadius`: Border radius values for different components
  - `shadows`: Shadow definitions for depth and elevation
  - `typography`: Font families, sizes, and weights
  - `transitions`: Consistent animation timings
  - `icons`: Unicode escape sequences for icons (avoids emoji encoding issues)

**Types** (`src/types.ts`)
- `DraggableSelector`: Defines selector configuration structure
  - `id`: Unique identifier
  - `selector`: CSS selector string
  - `position`: Optional `{x, y}` coordinates
  - `size`: Optional `{width, height}` dimensions
  - `isResizable`: Boolean flag
  - `isRepositionable`: Boolean flag

### Data Flow

1. User configures selectors in Options page → Saved to `chrome.storage.sync`
2. Content script loads on page → Reads selectors from storage
3. For each selector, content script queries DOM and applies `makeDraggable()`
4. User interacts with element → Drag/resize events fire callbacks
5. Callbacks update `chrome.storage.sync` with new position/size
6. Changes sync across devices via Chrome's sync storage

### Storage Schema

```typescript
chrome.storage.sync: {
  selectors: DraggableSelector[],  // Array of configured selectors
  extensionEnabled: boolean        // Global enable/disable state
}
```

### Build System Details

- **Webpack** with environment-aware configurations (dev/prod, chrome/firefox)
- **TypeScript** compiled via `ts-loader`
- **React** for UI components (popup and options)
- **Entry Points**: `background.ts`, `content_script.tsx`, `popup.tsx`, `options.tsx`
- **Code Splitting**: Vendor chunk created for all entries except background (to keep service worker lightweight)
- **Output**: Built files go to `dist-chrome/js/` or `dist-firefox/js/`, static files copied from `public/`
- **Manifest Handling**: Browser-specific manifests copied and renamed to `manifest.json` during build

## Customizing the Theme

To change the color scheme or styling across the entire extension:

1. **Edit `src/theme.ts`** - All design tokens are centralized here
2. **Primary color change**: Modify `theme.colors.primary` (default: `#4a7c59`)
3. **Secondary color change**: Modify `theme.colors.secondary` (default: `#8b6f47`)
4. **Components automatically update**: All UI components (`popup.tsx`, `options.tsx`, `draggable.ts`) import and use the theme

Example - Change to a blue theme:
```typescript
// In src/theme.ts
colors: {
  primary: '#2196F3',        // Blue instead of green
  primaryLight: '#42A5F5',
  primaryDark: '#1976D2',
  // ... other colors
}
```

All buttons, borders, handles, and accents will update automatically.

## Important Patterns

### Preventing Element Jumps
When `makeDraggable()` is called without stored position/size, it captures the element's current geometry via `getBoundingClientRect()` before applying any styles. This prevents the element from jumping to a different position or changing size unexpectedly.

### Message Passing
Content script communicates with popup/background via `chrome.runtime.onMessage` and `chrome.tabs.sendMessage`. Always check `chrome.runtime.lastError` when sending messages to handle cases where content script isn't injected (e.g., chrome:// pages, PDF viewer).

### Cleanup Pattern
`makeDraggable()` returns a `destroy()` function. Content script maintains an array of instances and calls `destroy()` on all of them before re-applying selectors (e.g., when refreshing or disabling).

### Browser Compatibility
Both Chrome and Firefox support the `chrome.*` API namespace, so most extension code works identically across browsers. Use `process.env.BROWSER` only when browser-specific behavior is required.

## Testing

- Uses **Jest** with **ts-jest** for TypeScript support
- Test files in `src/__tests__/`
- Run tests with `npm run test` or `npx jest`

## Distribution

### Release Process

1. **Package both browsers**: `npm run package`
2. **Upload to stores**:
   - Chrome Web Store: Upload `chrome-extension.zip`
   - Firefox Add-ons: Upload `firefox-extension.zip`

### Important Notes

- Update Firefox extension ID in `public/manifest-firefox.json` before publishing:
  ```json
  "browser_specific_settings": {
    "gecko": {
      "id": "your-addon-id@your-domain.com"
    }
  }
  ```
- Version numbers are automatically synced between browsers
- Both builds are created from the same source code with browser-specific manifests
