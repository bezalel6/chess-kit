# Build System Quick Reference

## Most Common Commands

```bash
# Development (with live reload)
npm run watch:chrome     # Develop for Chrome
npm run watch:firefox    # Develop for Firefox

# Release both browsers
npm run package          # Increments version, builds both, creates zips

# Build without version increment
npm run build:chrome     # Just build Chrome
npm run build:firefox    # Just build Firefox
```

## File Locations

```
Source Code:              src/
Chrome Manifest:          public/manifest-chrome.json  (version source of truth)
Firefox Manifest:         public/manifest-firefox.json (auto-synced version)

Chrome Build:             dist-chrome/
Firefox Build:            dist-firefox/

Chrome Package:           chrome-extension.zip
Firefox Package:          firefox-extension.zip
```

## Version Management

- Edit `public/manifest-chrome.json` for version changes
- Run `npm run package` to auto-sync to Firefox and build
- Both extensions always have matching versions

## Testing

**Chrome**: Load unpacked from `dist-chrome/`
**Firefox**: Load temporary add-on from `dist-firefox/`

## Distribution

1. `npm run package` - Creates both zips with incremented version
2. Upload `chrome-extension.zip` to Chrome Web Store
3. Upload `firefox-extension.zip` to Firefox Add-ons

## Browser-Specific Code

```typescript
if (process.env.BROWSER === 'firefox') {
  // Firefox-specific
} else {
  // Chrome-specific
}
```

## Troubleshooting

**Wrong manifest?** Check `webpack/webpack.common.js` manifest file logic
**Version mismatch?** Run `npm run build` to sync versions
**Old builds?** Run `npm run clean` then rebuild
