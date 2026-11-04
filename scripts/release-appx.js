#!/usr/bin/env node
/**
 * Sentinel Desktop - Microsoft Store AppX Release Builder
 *
 * Usage:
 *   node scripts/release-appx.js [version] [options]
 *   pnpm run release:appx [version] [options]
 *
 * Examples:
 *   pnpm run release:appx 1.0.1
 *   pnpm run release:appx patch
 *   pnpm run release:appx minor
 *   pnpm run release:appx --arch x64
 *
 * Environment Variables (optional, for Microsoft Partner Center):
 *   MS_STORE_IDENTITY_NAME            e.g. "Enbidi.SentinelDesktop"
 *   MS_STORE_PUBLISHER                e.g. "CN=7D350121-9482-4DA4-B852-3D95D4F0BF11"
 *   MS_STORE_PUBLISHER_DISPLAY_NAME   e.g. "Enbidi"
 *   MS_STORE_APP_ID                   e.g. "SentinelDesktop"
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DESKTOP_DIR = path.join(ROOT_DIR, 'apps/desktop');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const ASSETS_DIR = path.join(DESKTOP_DIR, 'build/appx');
const ICON_PATH = path.join(DESKTOP_DIR, 'resources/icon.png');
const DESKTOP_PKG_PATH = path.join(DESKTOP_DIR, 'package.json');
const ROOT_PKG_PATH = path.join(ROOT_DIR, 'package.json');

// Parse CLI Arguments
const args = process.argv.slice(2);
let targetVersion = null;
let arch = 'x64';
let dryRun = false;
let skipBuild = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--arch' && args[i + 1]) {
    arch = args[++i];
  } else if (arg === '--dry-run') {
    dryRun = true;
  } else if (arg === '--skip-build') {
    skipBuild = true;
  } else if (!arg.startsWith('-') && !targetVersion) {
    targetVersion = arg;
  }
}

// 1. Resolve and Validate Version
const desktopPkg = JSON.parse(fs.readFileSync(DESKTOP_PKG_PATH, 'utf-8'));
const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG_PATH, 'utf-8'));
const currentVersion = desktopPkg.version || '1.0.0';

function bumpVersion(current, bumpType) {
  const parts = current.split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  if (bumpType === 'major') {
    return `${parts[0] + 1}.0.0`;
  } else if (bumpType === 'minor') {
    return `${parts[0]}.${parts[1] + 1}.0`;
  } else if (bumpType === 'patch') {
    return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
  return bumpType;
}

if (!targetVersion) {
  targetVersion = currentVersion;
} else if (['major', 'minor', 'patch'].includes(targetVersion)) {
  targetVersion = bumpVersion(currentVersion, targetVersion);
}

// Clean and format version
const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const fourPartRegex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;

let semverVersion = targetVersion;
let appxVersion = `${targetVersion}.0`;

if (fourPartRegex.test(targetVersion)) {
  const parts = targetVersion.split('.');
  semverVersion = `${parts[0]}.${parts[1]}.${parts[2]}`;
  appxVersion = targetVersion;
} else if (semverRegex.test(targetVersion)) {
  const match = targetVersion.match(semverRegex);
  semverVersion = `${match[1]}.${match[2]}.${match[3]}`;
  appxVersion = `${match[1]}.${match[2]}.${match[3]}.0`;
} else {
  console.error(`[ERROR] Invalid version format: "${targetVersion}". Expected semver (e.g. 1.0.1) or 4-part quad (e.g. 1.0.1.0).`);
  process.exit(1);
}

console.log('\n======================================================');
console.log('   Sentinel Desktop - Microsoft Store AppX Release   ');
console.log('======================================================');
console.log(`• Target Semver:     ${semverVersion}`);
console.log(`• Windows Store Ver: ${appxVersion}`);
console.log(`• Target Arch:       ${arch}`);
console.log(`• Release Dir:       ${RELEASE_DIR}\n`);

// 2. Microsoft Store Partner Center Config
const identityName = process.env.MS_STORE_IDENTITY_NAME || 'Enbidi.SentinelDesktop';
const publisher = process.env.MS_STORE_PUBLISHER || 'CN=7D350121-9482-4DA4-B852-3D95D4F0BF11';
const publisherDisplayName = process.env.MS_STORE_PUBLISHER_DISPLAY_NAME || 'Enbidi';
const applicationId = process.env.MS_STORE_APP_ID || 'SentinelDesktop';

if (publisher === 'CN=00000000-0000-0000-0000-000000000000') {
  console.log('ℹ Notice: Using default placeholder Publisher CN.');
  console.log('  For final Store submission, set MS_STORE_PUBLISHER & MS_STORE_IDENTITY_NAME');
  console.log('  matching your Microsoft Partner Center Product Identity page.\n');
}

// 3. Ensure AppX Tile Assets
function ensureTileAssets() {
  const requiredAssets = [
    'Square44x44Logo.png',
    'Square50x50Logo.png',
    'StoreLogo.png',
    'Square150x150Logo.png',
    'Square310x310Logo.png',
    'Wide310x150Logo.png',
    'BadgeLogo.png',
  ];

  const allExist = requiredAssets.every((f) => fs.existsSync(path.join(ASSETS_DIR, f)));
  if (allExist) {
    console.log('✓ Microsoft Store visual tile assets verified in apps/desktop/build/appx/');
    return;
  }

  console.log('• Generating Microsoft Store tile assets from resources/icon.png...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const pyScript = `
import os
from PIL import Image

src_icon = r"${ICON_PATH}"
out_dir = r"${ASSETS_DIR}"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_icon).convert("RGBA")

assets = {
    "Square44x44Logo.png": (44, 44),
    "Square50x50Logo.png": (50, 50),
    "StoreLogo.png": (50, 50),
    "Square150x150Logo.png": (150, 150),
    "Square310x310Logo.png": (310, 310),
    "Wide310x150Logo.png": (310, 150),
    "BadgeLogo.png": (24, 24),
}

for name, (w, h) in assets.items():
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pad = int(min(w, h) * 0.1)
    target_side = min(w, h) - 2 * pad
    resized = img.resize((target_side, target_side), Image.Resampling.LANCZOS)
    offset_x = (w - target_side) // 2
    offset_y = (h - target_side) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    canvas.save(os.path.join(out_dir, name))
`;

  try {
    execSync(`python -c "${pyScript.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
    console.log('✓ Successfully generated all Microsoft Store tile assets.');
  } catch (err) {
    console.warn('⚠ Could not run Python PIL to generate tile assets:', err.message);
  }
}

ensureTileAssets();

// 4. Update Version in package.json files
if (!dryRun && semverVersion !== currentVersion) {
  console.log(`• Updating version to ${semverVersion} in package.json files...`);
  desktopPkg.version = semverVersion;
  rootPkg.version = semverVersion;
  fs.writeFileSync(DESKTOP_PKG_PATH, JSON.stringify(desktopPkg, null, 2) + '\n');
  fs.writeFileSync(ROOT_PKG_PATH, JSON.stringify(rootPkg, null, 2) + '\n');
  console.log('✓ Version updated.');
}

// 5. Build Workspace Packages and Electron Assets
if (!skipBuild && !dryRun) {
  console.log('\n• Building monorepo workspace packages and Electron bundle...');
  execSync('turbo run build', { cwd: ROOT_DIR, stdio: 'inherit' });
  console.log('✓ Build complete.');
}

// 6. Write / Update electron-builder.json Configuration
const builderConfig = {
  $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: 'com.sentinel.desktop',
  productName: 'Sentinel Desktop',
  directories: {
    output: '../../release',
    buildResources: 'build',
  },
  files: ['out/**/*', 'resources/**/*', 'package.json'],
  asar: true,
  asarUnpack: ['**/node_modules/koffi/**', '**/node_modules/better-sqlite3/**'],
  win: {
    target: [
      {
        target: 'appx',
        arch: [arch],
      },
    ],
    icon: 'resources/icon.ico',
  },
  appx: {
    identityName,
    publisher,
    publisherDisplayName,
    applicationId,
    backgroundColor: '#070913',
    showNameOnTiles: true,
    addAutoLaunchExtension: false,
  },
};

const builderConfigPath = path.join(DESKTOP_DIR, 'electron-builder.json');
fs.writeFileSync(builderConfigPath, JSON.stringify(builderConfig, null, 2) + '\n');

// 7. Execute electron-builder
if (dryRun) {
  console.log('\n[DRY RUN] Would execute electron-builder targeting AppX. Skipping package assembly.');
  process.exit(0);
}

console.log('\n• Assembling Windows Store AppX package with electron-builder...');
const builderCmd = `npx electron-builder --project apps/desktop --win appx --${arch}`;
execSync(builderCmd, { cwd: ROOT_DIR, stdio: 'inherit' });

// 8. Locate Output AppX, Compute Checksum, and Output Summary
const expectedFileName = `Sentinel Desktop ${semverVersion}.appx`;
const appxPath = path.join(RELEASE_DIR, expectedFileName);

if (!fs.existsSync(appxPath)) {
  // Check if electron-builder produced a file with slightly different naming
  const files = fs.readdirSync(RELEASE_DIR).filter((f) => f.endsWith('.appx'));
  if (files.length > 0) {
    const latestFile = path.join(RELEASE_DIR, files[0]);
    computeAndReport(latestFile);
  } else {
    console.error(`\n[ERROR] AppX output not found in ${RELEASE_DIR}`);
    process.exit(1);
  }
} else {
  computeAndReport(appxPath);
}

function computeAndReport(filePath) {
  const fileBytes = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');
  const sizeMb = (fileBytes.length / (1024 * 1024)).toFixed(2);
  const checksumPath = `${filePath}.sha256`;

  fs.writeFileSync(checksumPath, `${sha256} *${path.basename(filePath)}\n`);

  console.log('\n======================================================');
  console.log('   🎉 Microsoft Store AppX Release Build Complete!   ');
  console.log('======================================================');
  console.log(`• Package File:    ${path.basename(filePath)}`);
  console.log(`• Package Path:    ${filePath}`);
  console.log(`• Package Size:    ${sizeMb} MB`);
  console.log(`• AppX Version:    ${appxVersion}`);
  console.log(`• Target Arch:     ${arch}`);
  console.log(`• SHA-256 Hash:    ${sha256}`);
  console.log(`• Checksum File:   ${checksumPath}`);
  console.log('\n======================================================');
  console.log('   Microsoft Partner Center Submission Instructions   ');
  console.log('======================================================');
  console.log('1. Sign in to https://partner.microsoft.com/dashboard');
  console.log('2. Navigate to "Apps and games" -> Select "Sentinel Desktop"');
  console.log('3. Start a new submission or update an existing one.');
  console.log('4. Under "Packages", upload the generated .appx file:');
  console.log(`   ${filePath}`);
  console.log('5. Microsoft Store will validate the package and sign it with');
  console.log('   the official Microsoft Store Certificate upon ingestion.');
  console.log('======================================================\n');
}

