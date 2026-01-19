const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const webpack = require('webpack');
const webpackProdConfig = require('../webpack/webpack.prod.js');

const manifestChromePath = path.resolve(__dirname, '../public/manifest-chrome.json');
const manifestFirefoxPath = path.resolve(__dirname, '../public/manifest-firefox.json');
const distChromePath = path.resolve(__dirname, '../dist-chrome');
const distFirefoxPath = path.resolve(__dirname, '../dist-firefox');

async function syncVersions() {
  // Read Chrome manifest (source of truth)
  const chromeManifest = JSON.parse(fs.readFileSync(manifestChromePath, 'utf8'));

  // Read Firefox manifest
  const firefoxManifest = JSON.parse(fs.readFileSync(manifestFirefoxPath, 'utf8'));

  // Sync version
  firefoxManifest.version = chromeManifest.version;

  // Write back Firefox manifest
  fs.writeFileSync(manifestFirefoxPath, JSON.stringify(firefoxManifest, null, 2));

  console.log(`Version synced: ${chromeManifest.version}`);
  return chromeManifest.version;
}

async function incrementVersion() {
  // Read and increment Chrome manifest version (source of truth)
  const manifest = JSON.parse(fs.readFileSync(manifestChromePath, 'utf8'));
  const versionParts = manifest.version.split('.').map(Number);
  versionParts[versionParts.length - 1]++; // Increment the last part
  manifest.version = versionParts.join('.');
  fs.writeFileSync(manifestChromePath, JSON.stringify(manifest, null, 2));
  console.log(`Chrome manifest version incremented to: ${manifest.version}`);

  // Sync to Firefox
  await syncVersions();

  return manifest.version;
}

async function runWebpackBuild(browser) {
  console.log(`Starting webpack build for ${browser}...`);
  const config = webpackProdConfig({ browser });

  await new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        return reject(err);
      }
      if (stats.hasErrors()) {
        console.error(stats.toString({ colors: true }));
        return reject(new Error(`Webpack build for ${browser} failed with errors.`));
      }
      console.log(stats.toString({ colors: true, chunks: false }));
      console.log(`Webpack build for ${browser} finished.`);
      resolve();
    });
  });
}

async function createZip(distPath, zipPath, browser) {
  console.log(`Creating zip archive for ${browser}: ${zipPath}`);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  return new Promise((resolve, reject) => {
    output.on('close', function() {
      console.log(`${browser} zip archive created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('error', function(err) {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(distPath, false); // Append dist directory to archive
    archive.finalize();
  });
}

async function buildBrowser(browser, skipVersionIncrement = false) {
  const distPath = browser === 'firefox' ? distFirefoxPath : distChromePath;
  const zipPath = path.resolve(__dirname, `../${browser}-extension.zip`);

  if (!skipVersionIncrement) {
    await incrementVersion();
  } else {
    await syncVersions();
  }

  await runWebpackBuild(browser);
  await createZip(distPath, zipPath, browser);

  console.log(`${browser} build and zipping process completed successfully!`);
}

async function buildAll() {
  console.log('Building all browser extensions...');

  // Increment version once
  await incrementVersion();

  // Build both browsers
  await runWebpackBuild('chrome');
  await runWebpackBuild('firefox');

  // Create zips
  await createZip(distChromePath, path.resolve(__dirname, '../chrome-extension.zip'), 'chrome');
  await createZip(distFirefoxPath, path.resolve(__dirname, '../firefox-extension.zip'), 'firefox');

  console.log('All builds completed successfully!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const browser = args[0]; // 'chrome', 'firefox', or undefined for 'all'

async function main() {
  try {
    if (browser === 'chrome') {
      await buildBrowser('chrome');
    } else if (browser === 'firefox') {
      await buildBrowser('firefox');
    } else if (browser === 'all' || !browser) {
      await buildAll();
    } else {
      console.error(`Unknown browser: ${browser}`);
      console.log('Usage: node build.js [chrome|firefox|all]');
      process.exit(1);
    }
  } catch (err) {
    console.error('Build and zipping process failed:', err);
    process.exit(1);
  }
}

main();
