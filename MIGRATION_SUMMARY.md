# Multi-Browser Build System - Migration Summary

## What Changed

### Before
- Single `public/manifest.json` for Chrome only
- Build output to `dist/`
- Single `dist.zip` package
- Webpack config static, no browser awareness

### After
- Browser-specific manifests: `manifest-chrome.json` and `manifest-firefox.json`
- Separate build directories: `dist-chrome/` and `dist-firefox/`
- Separate packages: `chrome-extension.zip` and `firefox-extension.zip`
- Environment-aware webpack with browser parameter
- Unified build script supporting both targets

## New Files Created

```
public/manifest-chrome.json          - Chrome Manifest V3 (replaces manifest.json)
public/manifest-firefox.json         - Firefox Manifest V3 with browser_specific_settings
BUILD_SYSTEM.md                      - Comprehensive build system documentation
BUILD_QUICK_REFERENCE.md             - Quick command reference
MIGRATION_SUMMARY.md                 - This file
```

## Modified Files

```
webpack/webpack.common.js            - Now exports function accepting env parameter
webpack/webpack.dev.js               - Passes env to common config
webpack/webpack.prod.js              - Passes env to common config
scripts/build.js                     - Complete rewrite for multi-browser support
package.json                         - New build/watch/package/clean scripts
.gitignore                           - Added dist-chrome/, dist-firefox/, *.zip
CLAUDE.md                            - Updated with multi-browser documentation
```

## Deleted Files

```
public/manifest.json                 - Replaced by browser-specific versions
```

## Key Architectural Changes

### 1. Environment-Aware Webpack

**Before:**
```javascript
module.exports = {
  entry: { ... },
  output: {
    path: path.join(__dirname, "../dist/js")
  }
}
```

**After:**
```javascript
module.exports = (env = {}) => {
  const browser = env.browser || 'chrome';
  const outputDir = browser === 'firefox' ? 'dist-firefox' : 'dist-chrome';

  return {
    entry: { ... },
    output: {
      path: path.join(__dirname, `../${outputDir}/js`)
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.BROWSER': JSON.stringify(browser)
      })
    ]
  };
};
```

### 2. Smart Manifest Handling

CopyWebpackPlugin now:
- Ignores all `manifest*.json` files in blanket copy
- Copies specific browser manifest and renames to `manifest.json`
- Ensures correct manifest for each build

### 3. Unified Build Script

`scripts/build.js` now handles:
- Single browser builds: `node scripts/build.js chrome`
- Multi-browser builds: `node scripts/build.js all`
- Version synchronization between manifests
- Parallel builds for efficiency
- Browser-specific zip creation

### 4. Version Management

- `manifest-chrome.json` is the single source of truth
- `manifest-firefox.json` version auto-synced on every build
- No manual version coordination needed
- Both extensions always ship with matching versions

## Command Migration Guide

| Old Command | New Command(s) |
|------------|----------------|
| `npm run watch` | `npm run watch:chrome` or `npm run watch:firefox` |
| `npm run build` | `npm run build` (now builds both) or `npm run build:chrome` |
| `npm run package` | `npm run package` (now packages both) |
| `npm run clean` | `npm run clean` (now cleans both) |

**Note:** Old commands are backwards compatible where possible.

## Firefox-Specific Additions

### Manifest Field

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

**Action Required:** Update `id` field before publishing to Firefox Add-ons.

### Minimum Version

Firefox 109+ required for Manifest V3 support.

## Runtime Browser Detection

New capability injected by webpack:

```typescript
// Available in all source files
if (process.env.BROWSER === 'firefox') {
  // Firefox-specific behavior
} else {
  // Chrome-specific behavior
}
```

**Note:** Both browsers support `chrome.*` API namespace, so most code works identically.

## Breaking Changes

None for existing development workflow. The build system is additive:
- Old `dist/` folder no longer used (new: `dist-chrome/`, `dist-firefox/`)
- Old `dist.zip` no longer created (new: `chrome-extension.zip`, `firefox-extension.zip`)

## Testing Impact

### Before
Load unpacked from `dist/`

### After
**Chrome:** Load unpacked from `dist-chrome/`
**Firefox:** Load temporary add-on from `dist-firefox/`

## Deployment Impact

### Before
- Single zip file for Chrome Web Store

### After
- `chrome-extension.zip` for Chrome Web Store
- `firefox-extension.zip` for Firefox Add-ons
- Both created with single command: `npm run package`

## Next Steps

1. **Update Firefox Extension ID**
   Edit `public/manifest-firefox.json` and replace placeholder ID:
   ```json
   "id": "your-actual-addon-id@your-domain.com"
   ```

2. **Test Both Builds**
   ```bash
   npm run build
   # Load dist-chrome/ in Chrome
   # Load dist-firefox/ in Firefox
   ```

3. **Create Release**
   ```bash
   npm run package
   # Upload chrome-extension.zip to Chrome Web Store
   # Upload firefox-extension.zip to Firefox Add-ons
   ```

## Benefits

1. **Multi-Browser Support**: Single codebase, multiple browser targets
2. **Automatic Version Sync**: No manual coordination needed
3. **Browser-Specific Customization**: Separate manifests allow per-browser configuration
4. **Efficient Builds**: Parallel compilation, optimized output
5. **Future-Proof**: Easy to add Safari or Edge-specific builds
6. **Developer-Friendly**: Clear commands, comprehensive documentation

## Support

For questions or issues:
- Build system details: See `BUILD_SYSTEM.md`
- Quick commands: See `BUILD_QUICK_REFERENCE.md`
- Project architecture: See `CLAUDE.md`
