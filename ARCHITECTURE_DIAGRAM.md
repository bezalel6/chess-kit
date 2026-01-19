# Chess-Kit Multi-Browser Build Architecture

## Build Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOURCE CODE                               │
├─────────────────────────────────────────────────────────────────┤
│  src/                                                            │
│  ├── background.ts         (Background service worker)          │
│  ├── content_script.tsx    (Content script with React)          │
│  ├── popup.tsx             (Popup UI)                           │
│  ├── options.tsx           (Options page UI)                    │
│  ├── lib/draggable.ts      (Core draggable logic)              │
│  ├── theme.ts              (Centralized theming)                │
│  └── types.ts              (TypeScript definitions)             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WEBPACK BUILD SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│  webpack/webpack.common.js (env) ──────┬─────────────────────┐  │
│                                         │                     │  │
│  ┌──────────────────────────────────────▼───────────────┐    │  │
│  │  DefinePlugin: process.env.BROWSER = 'chrome'/'firefox' │  │
│  └──────────────────────────────────────┬───────────────┘    │  │
│                                         │                     │  │
│  ┌──────────────────────────────────────▼───────────────┐    │  │
│  │  CopyPlugin:                                          │    │  │
│  │  - Copy all from public/ except manifest*.json       │    │  │
│  │  - Copy manifest-{browser}.json → manifest.json      │    │  │
│  └──────────────────────────────────────┬───────────────┘    │  │
│                                         │                     │  │
│                    ┌────────────────────┴────────────────┐    │  │
│                    │                                     │    │  │
└────────────────────┼─────────────────────────────────────┼────┘
                     │                                     │
        env.browser='chrome'                  env.browser='firefox'
                     │                                     │
                     ▼                                     ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│      CHROME BUILD OUTPUT          │  │      FIREFOX BUILD OUTPUT         │
├──────────────────────────────────┤  ├──────────────────────────────────┤
│  dist-chrome/                     │  │  dist-firefox/                    │
│  ├── js/                          │  │  ├── js/                          │
│  │   ├── background.js            │  │  │   ├── background.js            │
│  │   ├── content_script.js        │  │  │   ├── content_script.js        │
│  │   ├── popup.js                 │  │  │   ├── popup.js                 │
│  │   ├── options.js               │  │  │   ├── options.js               │
│  │   └── vendor.js                │  │  │   └── vendor.js                │
│  ├── manifest.json   ◄─────────┐  │  │  ├── manifest.json   ◄─────────┐  │
│  ├── popup.html                │  │  │  ├── popup.html                │  │
│  ├── options.html              │  │  │  ├── options.html              │  │
│  └── [icons & assets]          │  │  │  └── [icons & assets]          │  │
└──────────────────────────────────┘  └──────────────────────────────────┘
                │                                        │
                │                                        │
                ▼                                        ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  public/manifest-chrome.json     │  │  public/manifest-firefox.json    │
│  ┌────────────────────────────┐  │  │  ┌────────────────────────────┐  │
│  │ {                          │  │  │  │ {                          │  │
│  │   "manifest_version": 3,   │  │  │  │   "manifest_version": 3,   │  │
│  │   "name": "Chess-Kit",     │  │  │  │   "name": "Chess-Kit",     │  │
│  │   "version": "1.69.1" ◄────┼──┼──┼──┼─► "version": "1.69.1"      │  │
│  │   ...                      │  │  │  │   "browser_specific_settings"│
│  │ }                          │  │  │  │   ...                      │  │
│  └────────────────────────────┘  │  │  └────────────────────────────┘  │
└──────────────────────────────────┘  └──────────────────────────────────┘
                │                      Version sync       │
                └──────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PACKAGE SCRIPT                                │
│                 scripts/build.js                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. incrementVersion()                                           │
│     - Read manifest-chrome.json                                 │
│     - Increment version (e.g., 1.69.1 → 1.69.2)                │
│     - Write back to manifest-chrome.json                        │
│                                                                  │
│  2. syncVersions()                                               │
│     - Copy version from chrome to firefox manifest              │
│                                                                  │
│  3. runWebpackBuild('chrome')                                   │
│     - Compile with env.browser='chrome'                         │
│     - Output to dist-chrome/                                    │
│                                                                  │
│  4. runWebpackBuild('firefox')                                  │
│     - Compile with env.browser='firefox'                        │
│     - Output to dist-firefox/                                   │
│                                                                  │
│  5. createZip(dist-chrome) → chrome-extension.zip              │
│  6. createZip(dist-firefox) → firefox-extension.zip            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTION PACKAGES                         │
├─────────────────────────────────────────────────────────────────┤
│  chrome-extension.zip  ──►  Chrome Web Store                    │
│  firefox-extension.zip ──►  Firefox Add-ons (AMO)               │
└─────────────────────────────────────────────────────────────────┘
```

## Command Flow

```
npm run package
      │
      ▼
scripts/build.js (all)
      │
      ├─► incrementVersion()
      │        │
      │        ├─► Read manifest-chrome.json
      │        ├─► Increment: 1.69.1 → 1.69.2
      │        └─► syncVersions() → manifest-firefox.json
      │
      ├─► runWebpackBuild('chrome')
      │        │
      │        └─► webpack --env browser=chrome
      │                 │
      │                 └─► dist-chrome/
      │
      ├─► runWebpackBuild('firefox')
      │        │
      │        └─► webpack --env browser=firefox
      │                 │
      │                 └─► dist-firefox/
      │
      ├─► createZip(dist-chrome/)
      │        │
      │        └─► chrome-extension.zip
      │
      └─► createZip(dist-firefox/)
               │
               └─► firefox-extension.zip
```

## Webpack Configuration Flow

```
webpack --env browser=chrome
      │
      ▼
webpack/webpack.prod.js(env) ──► merge with webpack.common.js(env)
      │
      ▼
webpack.common.js
      │
      ├─► env.browser = 'chrome'
      │
      ├─► outputDir = 'dist-chrome'
      │
      ├─► manifestFile = 'manifest-chrome.json'
      │
      ├─► DefinePlugin
      │        └─► process.env.BROWSER = 'chrome'
      │
      ├─► CopyPlugin
      │        ├─► Copy public/* (ignore manifest*.json)
      │        └─► Copy manifest-chrome.json → dist-chrome/manifest.json
      │
      └─► TypeScript Compilation
               └─► src/*.ts(x) → dist-chrome/js/*.js
```

## Data Flow

```
┌────────────┐
│   User     │
└─────┬──────┘
      │ interacts with
      ▼
┌────────────────────┐
│   Options Page     │ ─────► chrome.storage.sync
│   (options.tsx)    │         │
└────────────────────┘         │ selectors config
                               │
                               ▼
┌────────────────────┐    ┌──────────────────┐
│  Content Script    │◄───│ chrome.storage   │
│(content_script.tsx)│    │      .sync       │
└─────┬──────────────┘    └──────────────────┘
      │
      │ reads selectors
      ▼
┌────────────────────┐
│  makeDraggable()   │
│  (lib/draggable.ts)│
└─────┬──────────────┘
      │
      │ applies to
      ▼
┌────────────────────┐
│   DOM Elements     │
│  (chess boards)    │
└────────────────────┘
```

## Browser-Specific Paths

### Chrome
```
Source: public/manifest-chrome.json
Build:  dist-chrome/
Bundle: chrome-extension.zip
Store:  Chrome Web Store
```

### Firefox
```
Source: public/manifest-firefox.json
Build:  dist-firefox/
Bundle: firefox-extension.zip
Store:  Firefox Add-ons (AMO)
```

## Key Design Principles

1. **Single Source of Truth**: `manifest-chrome.json` version
2. **Environment Variables**: `process.env.BROWSER` for runtime detection
3. **Separation of Concerns**: Browser-specific configs, shared codebase
4. **Automated Sync**: Version consistency without manual coordination
5. **Parallel Builds**: Independent compilation for efficiency
6. **Clean Artifacts**: Separate output directories prevent conflicts
