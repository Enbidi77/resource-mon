# Sentinel Desktop: Microsoft Store AppX Packaging & Submission Guide

This comprehensive guide details the architecture, configuration, build commands, asset requirements, and Microsoft Partner Center submission process for packaging **Sentinel Desktop** as a Windows Store AppX (`.appx`) package.

---

## Table of Contents

1. [Overview & Prerequisites](#1-overview--prerequisites)
2. [Monorepo Packaging Architecture](#2-monorepo-packaging-architecture)
3. [Product Identity & Manifest Configuration](#3-product-identity--manifest-configuration)
4. [Step-by-Step Build Commands](#4-step-by-step-build-commands)
5. [Visual Assets & Store Logos](#5-visual-assets--store-logos)
6. [Microsoft Partner Center Submission Checklist](#6-microsoft-partner-center-submission-checklist)
7. [Restricted Capabilities (`runFullTrust`) Approval](#7-restricted-capabilities-runfulltrust-approval)
8. [Troubleshooting & Common Validation Errors](#8-troubleshooting--common-validation-errors)

---

## 1. Overview & Prerequisites

Sentinel Desktop packages its Electron application and native C/Win32 FFI bindings into an AppX package for seamless ingestion into the Microsoft Store.

### Prerequisites

| Tool | Version Requirement | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (LTS recommended) | Desktop build runtime |
| **pnpm** | `>= 10.0.0` | Workspace package manager |
| **Python** | `>= 3.9` with `Pillow` (`pip install Pillow`) | Automated store tile & icon rendering |
| **Operating System** | Windows 10 (Build 17763+) or Windows 11 | Target execution environment |

---

## 2. Monorepo Packaging Architecture

The packaging pipeline bridges Turborepo workspace compilation with `electron-builder`:

```
resource-mon-cli/
├── apps/desktop/
│   ├── build/
│   │   ├── icon.ico                     # Windows executable icon (256x256)
│   │   ├── icon.png                     # Master high-res icon (2048x2048)
│   │   └── appx/                        # Embedded package visual assets
│   │       ├── Square44x44Logo.png
│   │       ├── Square50x50Logo.png
│   │       ├── Square150x150Logo.png
│   │       ├── Square310x310Logo.png
│   │       ├── Wide310x150Logo.png
│   │       ├── StoreLogo.png
│   │       └── BadgeLogo.png
│   ├── electron-builder.json            # Electron builder manifest & AppX config
│   └── package.json                     # Desktop app metadata
├── packages/                            # Compiled workspace packages
├── release/                             # Generated AppX output & store assets
│   ├── Sentinel Desktop 1.0.0.appx
│   ├── Sentinel Desktop 1.0.0.appx.sha256
│   └── store-assets/                    # Store listing logos and poster art
└── scripts/
    ├── release-appx.js                  # Automated release orchestrator
    └── generate-store-assets.py         # Store promotional artwork generator
```

### Native Binary Unpacking (`asarUnpack`)

Sentinel Desktop utilizes native C libraries via **Koffi** (Win32 FFI) and **better-sqlite3** (local storage). Because native `.node` and `.dll` binaries cannot execute directly from within an Electron `.asar` archive, they are explicitly unpacked in `apps/desktop/electron-builder.json`:

```json
"asar": true,
"asarUnpack": [
  "**/node_modules/koffi/**",
  "**/node_modules/better-sqlite3/**"
]
```

---

## 3. Product Identity & Manifest Configuration

To pass Microsoft Store ingestion, the AppX package identity **must exactly match** the values assigned on your Microsoft Partner Center Product Identity page.

### Current Configured Identity

| Partner Center Property | Manifest Key | Production Value |
| :--- | :--- | :--- |
| **Package/Identity/Name** | `identityName` | `Enbidi.SentinelDesktop` |
| **Package/Identity/Publisher** | `publisher` | `CN=7D350121-9482-4DA4-B852-3D95D4F0BF11` |
| **Package/Properties/PublisherDisplayName** | `publisherDisplayName` | `Enbidi` |
| **Application ID** | `applicationId` | `SentinelDesktop` |

### Configuration Locations

1. **`apps/desktop/electron-builder.json`**:
   ```json
   "appx": {
     "identityName": "Enbidi.SentinelDesktop",
     "publisher": "CN=7D350121-9482-4DA4-B852-3D95D4F0BF11",
     "publisherDisplayName": "Enbidi",
     "applicationId": "SentinelDesktop",
     "backgroundColor": "#070913",
     "showNameOnTiles": true,
     "addAutoLaunchExtension": false
   }
   ```

2. **Environment Variable Overrides (Optional)**:
   You can override identity settings without modifying files:
   - `MS_STORE_IDENTITY_NAME`
   - `MS_STORE_PUBLISHER`
   - `MS_STORE_PUBLISHER_DISPLAY_NAME`
   - `MS_STORE_APP_ID`

---

## 4. Step-by-Step Build Commands

All commands are executed from the repository root.

### 1. Dry Run (Validate configuration without packaging)

```bash
pnpm run release:appx --dry-run
```

### 2. Standard Production Build

Compiles all 12 monorepo packages, generates missing tile assets, assembles the Electron distribution, builds the `.appx` package, and calculates its SHA-256 checksum:

```bash
pnpm run release:appx
```

### 3. Version Bump & Architecture Options

```bash
# Increment patch version (e.g. 1.0.0 -> 1.0.1) and package
pnpm run release:appx patch

# Increment minor version (e.g. 1.0.0 -> 1.1.0) and package
pnpm run release:appx minor

# Build with an explicit version string
pnpm run release:appx 1.0.2

# Explicit architecture targeting
pnpm run release:appx --arch x64
```

### Output Files

Upon successful completion, artifacts are written to `release/`:
- `release/Sentinel Desktop <version>.appx` — The binary uploaded to Partner Center.
- `release/Sentinel Desktop <version>.appx.sha256` — Integrity verification checksum.

---

## 5. Visual Assets & Store Logos

Microsoft Partner Center requires two categories of visual assets:
1. **In-Package Tile Assets** (bundled inside the `.appx`).
2. **Store Listing Promotional Images** (uploaded to the web dashboard).

### Generating All Store Promotional Artwork

Run the automated artwork generator:

```bash
python scripts/generate-store-assets.py
```

This creates pixel-perfect artwork in `release/store-assets/`:

| Asset Type | Dimensions | Output File | Usage |
| :--- | :--- | :--- | :--- |
| **9:16 Poster Art** | `720 x 1080`<br>`1440 x 2160` | `PosterArt-720x1080.png`<br>`PosterArt-1440x2160.png` | Main product card on Windows 10/11 & Xbox |
| **1:1 Box Art** | `1080 x 1080`<br>`2160 x 2160` | `BoxArt-1080x1080.png`<br>`BoxArt-2160x2160.png` | Search results and collection grids |
| **1:1 App Tile Icon** | `300 x 300` | `AppTileIcon-300x300.png` | Windows 10/11 Store search tile |
| **1:1 Store Display** | `150 x 150` | `StoreLogo-150x150.png` | Small store tile |
| **1:1 Store Display** | `71 x 71` | `StoreLogo-71x71.png` | Minimal store badge |

---

## 6. Microsoft Partner Center Submission Checklist

When submitting Sentinel Desktop at [partner.microsoft.com/dashboard](https://partner.microsoft.com/dashboard):

### 1. Packages
- Delete any previously failed `.appx` uploads.
- Upload `release/Sentinel Desktop <version>.appx`.
- Wait for ingestion verification to display green checkmarks.

### 2. Store Listings (English - US)
- **Product Name**: `Sentinel Desktop`
- **Description**: Highlight live Win32 telemetry, process auditing, CIS security checks, and zero-cloud privacy.
- **Product Features**:
  1. `Sub-second real-time telemetry for CPU, RAM, GPU, Disk I/O, and Network`
  2. `Deep Process Explorer with executable path, thread, and handle inspection`
  3. `Authenticode digital signature and SHA-256 hash verification for running binaries`
  4. `Cybersecurity auditing with CIS hardening checks and persistence detection`
  5. `Active TCP/UDP network socket mapping with process attribution`
  6. `Windows System Services manager with start, stop, and configure controls`
  7. `Real-time Windows Event Log streaming and severity filtering`
  8. `Real-time File Integrity Monitoring (FIM) for critical system folders`
  9. `Apple Glass UI aesthetic with customizable liquid glass themes`
  10. `100% private and on-device: zero external cloud telemetry or tracking`
- **System Requirements**:
  - **Memory**: Minimum `2 GB` | Recommended `4 GB`
  - **DirectX**: `Not specified` | `Not specified`
  - **Video Memory**: `Not specified` | `Not specified` *(Do NOT set to 6 GB)*
  - **Processor**: `1.6 GHz dual-core 64-bit processor` | `2.0 GHz quad-core processor or better`

### 3. Privacy Policy
- Select **Provide privacy policy text**.
- Paste the verified policy declaring local SQLite storage and zero remote data collection.

---

## 7. Restricted Capabilities (`runFullTrust`) Approval

Because Sentinel Desktop is a desktop utility using Win32 C APIs, Partner Center will display a declaration prompt for `runFullTrust`.

### Approved Declaration Text (< 500 characters)

> "Sentinel Desktop is an Electron desktop app for system resource monitoring and cybersecurity. It requires 'runFullTrust' because reading hardware telemetry (CPU, RAM, PDH disk I/O counters) and inspecting processes/digital signatures requires native Win32 APIs (pdh.dll, kernel32.dll, wintrust.dll) unavailable in the sandboxed UWP container. All operations run locally in user mode."

---

## 8. Troubleshooting & Common Validation Errors

### Error: `PublisherDisplayName element does not match your publisher display name`
- **Root Cause**: The manifest has an outdated publisher name (e.g. `Sentinel Security` instead of `Enbidi`).
- **Resolution**: Verify `apps/desktop/electron-builder.json` has `"publisherDisplayName": "Enbidi"`. Rebuild using `pnpm run release:appx`.

### Error: `Video memory requirement prevents installations`
- **Root Cause**: Inadvertently setting "Video memory: 6 GB" in System Requirements blocks machines with integrated GPUs.
- **Resolution**: Set **Video memory** back to **Not specified**.

### Notice: `AppX is not signed (reason=Windows Store only build)`
- **Status**: **Normal behavior**.
- **Explanation**: You do not need a commercial code-signing certificate for Microsoft Store submissions. Microsoft's ingestion pipeline validates the package and cryptographically signs it with Microsoft's official root certificate upon ingestion.

