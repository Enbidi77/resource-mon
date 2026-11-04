const path = require('path');
const fs = require('fs');

if (process.platform !== 'win32') {
  process.exit(0);
}

try {
  const electronPath = require('electron');
  const icoPath = path.resolve(__dirname, '../apps/desktop/resources/icon.ico');

  if (!fs.existsSync(electronPath) || !fs.existsSync(icoPath)) {
    process.exit(0);
  }

  const { rcedit } = require('rcedit');
  rcedit(electronPath, {
    icon: icoPath,
    'version-string': {
      FileDescription: 'Sentinel Desktop',
      ProductName: 'Sentinel Desktop',
      CompanyName: 'Sentinel Security',
      OriginalFilename: 'SentinelDesktop.exe',
    },
  })
    .then(() => {
      console.log('[Sentinel] Patched electron.exe with Sentinel Desktop branding & icon.');
    })
    .catch((err) => {
      // If electron.exe is running, fail gracefully without blocking
      console.warn('[Sentinel] Notice: could not patch electron.exe (it may be running):', err.message);
    });
} catch {
  // Ignore if dependencies are not yet installed
}

