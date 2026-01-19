# Multi-Browser Build System

## Overview

Chess-Kit now supports building separate extensions for Chrome and Firefox with browser-specific manifests and configurations. The build system uses Webpack with environment-aware configurations to produce optimized builds for each browser.

## Architecture

### File Structure

```
chess-kit/
├── public/
│   ├── manifest-chrome.json    # Chrome Manifest V3
│   ├── manifest-firefox.json   # Firefox Manifest V3 with browser_specific_settings
│   └── [other static files]
├── webpack/
│   ├── webpack.common.js       # Shared config with browser environment support
│   ├── webpack.dev.js          # Development mode config
│   └── webpack.prod.js         # Production mode config
├── scripts/
│   └── build.js                # Multi-browser build and package script
├── dist-chrome/                # Chrome build output (gitignored)
├── dist-firefox/               # Firefox build output (gitignored)
├── chrome-extension.zip        # Chrome packaged extension (gitignored)
└── firefox-extension.zip       # Firefox packaged extension (gitignored)
```

### Key Components

**1. Browser-Specific Manifests**

- `manifest-chrome.json`: Standard Manifest V3 for Chrome
- `manifest-firefox.json`: Manifest V3 with Firefox-specific fields:
  - `browser_specific_settings.gecko.id`: Extension ID for Firefox
  - `browser_specific_settings.gecko.strict_min_version`: Minimum Firefox version (109.0 for MV3 support)

**2. Environment-Aware Webpack**

`webpack.common.js` now exports a function that accepts an `env` parameter:
- `env.browser`: Determines target browser ('chrome' or 'firefox')
- Dynamically sets output directory (`dist-chrome/` or `dist-firefox/`)
- Copies correct manifest file and renames to `manifest.json`
- Injects `process.env.BROWSER` for runtime browser detection

**3. Unified Build Script**

`scripts/build.js` handles:
- Version management (Chrome manifest as source of truth)
- Version synchronization to Firefox manifest
- Webpack compilation for each browser
- Zip archive creation for distribution

## Build Commands

### Development Builds (with source maps)

```bash
# Build for Chrome (dev mode)
npm run watch:chrome

# Build for Firefox (dev mode)
npm run watch:firefox

# Build for Chrome (default, backwards compatible)
npm run watch
```

### Production Builds (optimized, no source maps)

```bash
# Build Chrome only
npm run build:chrome

# Build Firefox only
npm run build:firefox

# Build both browsers
npm run build
```

### Package for Distribution

```bash
# Package Chrome only (increments version, builds, creates zip)
npm run package:chrome

# Package Firefox only (increments version, builds, creates zip)
npm run package:firefox

# Package both browsers (increments version once, builds both, creates both zips)
npm run package
```

### Clean Build Artifacts

```bash
# Clean all build artifacts
npm run clean

# Clean Chrome build only
npm run clean:chrome

# Clean Firefox build only
npm run clean:firefox
```

## Version Management

### Single Source of Truth

- `public/manifest-chrome.json` is the version source of truth
- All package commands sync version to `manifest-firefox.json` automatically
- Both extensions always have matching version numbers

### Version Increment Strategy

When running `npm run package:*`:
1. Chrome manifest version is incremented (last number in semver)
2. Firefox manifest version is synced to match
3. Both manifests are saved
4. Builds proceed with new version

### Manual Version Changes

If you manually edit `manifest-chrome.json` version:
- Run `npm run build` or `npm run package` to sync to Firefox
- Or manually update `manifest-firefox.json` to match

## Manifest Differences

### Chrome (manifest-chrome.json)

Standard Manifest V3 with no browser-specific fields.

### Firefox (manifest-firefox.json)

Includes additional `browser_specific_settings` field:

```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "chess-kit@example.com",
      "strict_min_version": "109.0"
    }
  }
}
```

**Important**: Update `id` to your actual Firefox extension ID before publishing.

## Runtime Browser Detection

If you need to detect browser at runtime in your code:

```typescript
// This is injected by webpack.DefinePlugin
if (process.env.BROWSER === 'firefox') {
  // Firefox-specific code
} else {
  // Chrome-specific code
}
```

Note: Both browsers support the `chrome.*` API namespace, so most code doesn't need browser-specific logic.

## Testing in Browsers

### Chrome

1. Build: `npm run build:chrome`
2. Navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `dist-chrome/` directory

### Firefox

1. Build: `npm run build:firefox`
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in `dist-firefox/` directory (e.g., `manifest.json`)

## Distribution Workflow

### Initial Setup

1. Update Firefox extension ID in `public/manifest-firefox.json`:
   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "your-addon-id@your-domain.com"
     }
   }
   ```

### Release Process

1. **Package both browsers**:
   ```bash
   npm run package
   ```
   This creates `chrome-extension.zip` and `firefox-extension.zip`

2. **Upload to stores**:
   - Chrome Web Store: Upload `chrome-extension.zip`
   - Firefox Add-ons: Upload `firefox-extension.zip`

### Hotfix for Single Browser

If you need to release a fix for only one browser:

```bash
# Chrome hotfix
npm run package:chrome

# Firefox hotfix
npm run package:firefox
```

Note: This increments version for both manifests (maintains version parity).

## Common Patterns

### Adding Browser-Specific Features

**Option 1: Runtime Detection**
```typescript
if (process.env.BROWSER === 'firefox') {
  // Use Firefox-specific API
} else {
  // Use Chrome-specific API
}
```

**Option 2: Separate Manifest Permissions**

Edit `manifest-chrome.json` and `manifest-firefox.json` separately if browsers need different permissions.

### Updating Manifest Fields

To update shared fields across both browsers:
1. Update `manifest-chrome.json`
2. Update `manifest-firefox.json` with same changes
3. Version will auto-sync on build

To update browser-specific fields:
- Edit only the relevant manifest file

## Troubleshooting

### Build fails with "Cannot find module"

Ensure all dependencies are installed:
```bash
npm install
```

### Wrong manifest in build output

Check that `webpack.common.js` is correctly filtering manifest files:
```javascript
globOptions: {
  ignore: ["**/manifest*.json"],
}
```

### Version out of sync

Run a build to sync versions:
```bash
npm run build
```

### Both browsers in same dist folder

Check `webpack.common.js` output path logic:
```javascript
const outputDir = browser === 'firefox' ? 'dist-firefox' : 'dist-chrome';
```

## Migration from Single-Browser Setup

The old `dist/` folder is no longer used. If you have old builds:

```bash
# Clean old artifacts
npm run clean

# Build new structure
npm run build
```

Your existing `manifest.json` has been split into `manifest-chrome.json` and `manifest-firefox.json`.

## Future Enhancements

Potential improvements to the build system:

- Safari support (requires different manifest format)
- Automated store deployment scripts
- Source map upload for error tracking
- Build-time manifest validation
- Automated browser compatibility testing
