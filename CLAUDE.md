# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chess-Kit is a Chrome extension (Manifest V3) that enables chess streamers to standardize their layouts across different websites and game modes. It provides draggable and resizable selectors that can be configured to reposition and resize DOM elements on any webpage.

## Development Commands

### Build & Development
```bash
npm run build        # Production build (creates optimized dist/)
npm run watch        # Development build with file watching
npm run package      # Increments manifest version, builds, and creates dist.zip
npm run clean        # Remove dist directory
npm run test         # Run Jest tests
npm run style        # Format TypeScript files with Prettier
```

### Testing in Chrome
1. Build the extension: `npm run build`
2. Navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` directory

## Architecture

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

### Build System

- **Webpack** with separate dev/prod configurations
- **TypeScript** compiled via `ts-loader`
- **React** for UI components (popup and options)
- **Entry Points**: `background.ts`, `content_script.tsx`, `popup.tsx`, `options.tsx`
- **Code Splitting**: Vendor chunk created for all entries except background (to keep service worker lightweight)
- **Output**: All built files go to `dist/js/`, static files copied from `public/` to `dist/`

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

## Testing

- Uses **Jest** with **ts-jest** for TypeScript support
- Test files in `src/__tests__/`
- Run tests with `npm run test` or `npx jest`
