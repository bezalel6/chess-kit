const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const webpack = require('webpack');
const webpackProdConfig = require('../webpack/webpack.prod.js');

const manifestPath = path.resolve(__dirname, '../public/manifest.json');
const distPath = path.resolve(__dirname, '../dist');
const zipPath = path.resolve(__dirname, '../dist.zip');

async function buildAndZip() {
  // 1. Read and increment manifest version
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const versionParts = manifest.version.split('.').map(Number);
  versionParts[versionParts.length - 1]++; // Increment the last part
  manifest.version = versionParts.join('.');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest version incremented to: ${manifest.version}`);

  // 2. Run webpack build
  console.log('Starting webpack build...');
  await new Promise((resolve, reject) => {
    webpack(webpackProdConfig, (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        return reject(err);
      }
      if (stats.hasErrors()) {
        console.error(stats.toString({ colors: true }));
        return reject(new Error('Webpack build failed with errors.'));
      }
      console.log(stats.toString({ colors: true }));
      console.log('Webpack build finished.');
      resolve();
    });
  });

  // 3. Zip the dist directory
  console.log(`Creating zip archive: ${zipPath}`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  output.on('close', function() {
    console.log(`Zip archive created: ${archive.pointer()} total bytes`);
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);
  archive.directory(distPath, false); // Append dist directory to archive
  await archive.finalize();
  console.log('Build and zipping process completed successfully!');
}

buildAndZip().catch(err => {
  console.error('Build and zipping process failed:', err);
  process.exit(1);
});
