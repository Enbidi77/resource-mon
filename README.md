# Sentinel Desktop

> **Advanced System Resource Monitoring & Cybersecurity Management Workstation**
> Built for cybersecurity engineers, system administrators, IT infrastructure specialists, and security researchers.

![Sentinel Desktop Banner](https://raw.githubusercontent.com/sentinel-desktop/sentinel-desktop/main/docs/assets/banner.png)

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2011%20%2F%2010-0078d4.svg?style=flat-square&logo=windows)](https://microsoft.com/windows)
[![Electron](https://img.shields.io/badge/Electron-35.x-47848F.svg?style=flat-square&logo=electron)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 1. Executive Summary & Vision

**Sentinel Desktop** is a unified, high-performance desktop workstation designed to bridge the gap between traditional system administration utilities (Windows Task Manager, Process Explorer, Resource Monitor, Services Manager) and professional host-level security operations (EDR telemetry, network connection auditing, file integrity monitoring, and digital signature verification).

Rather than relying on disjointed tools or mock dashboards, Sentinel Desktop interacts directly with live operating system internals through Windows Native APIs (**Win32 via Koffi FFI**), **systeminformation**, **PowerShell / CIM**, and **Windows Event Log** subscriptions, while isolating native operations in a dedicated Electron `utilityProcess`.

### Core Capabilities

- 📊 **Real-Time Resource Telemetry**: High-frequency, low-overhead monitoring of CPU (per-core breakdown, clock speeds, temperatures), Physical & Virtual Memory, GPU load/VRAM, Disk I/O throughput/IOPS, and Network bandwidth.
- 🔍 **Deep Process Explorer**: Interactive process hierarchy tree, thread/handle metrics, command-line arguments, working set memory, executable paths, SHA-256 hash calculation, digital signature verification (Authenticode), and process termination/suspension.
- 🛡️ **Host Security Center**: Defensive host-level auditing including unsigned executable detection, abnormal execution paths (`\Temp\`, `\AppData\`), suspicious parent-child process chains, unusual listening ports, and File Integrity Monitoring (FIM).
- 🌐 **Network Administrator & Connection Map**: Active TCP/UDP socket table, process-to-socket attribution, local and remote port resolution, DNS lookup, IP classification, and interface packet statistics.
- ⚙️ **Windows Services Manager**: Direct query, start, stop, restart, enable, and disable controls for Windows System Services with dependency trees and service account inspection.
- 💾 **Storage & Partition Inspector**: Physical disk health (S.M.A.R.T.), volume capacity, filesystem types, storage distribution, and read/write throughput analytics.
- 📑 **Windows Event Viewer & Audit Logs**: Real-time event log streaming (System, Application, Security) with severity filtering, event correlation, and export capabilities.
- 📄 **Auditable Compliance Reports**: Generation of comprehensive hardware inventory, security audit, and performance snapshot reports in JSON, CSV, HTML, and PDF formats.

---

## 2. Architecture Overview

Sentinel Desktop follows a strict multi-tier, multi-process architecture ensuring isolation, memory safety, and high rendering responsiveness:

```
+---------------------------------------------------------------------+
|                      React 19 Renderer (UI)                         |
|  Zustand Stores | TanStack Query | TanStack Table | Recharts | Glass |
+---------------------------------------------------------------------+
                                 ▲
                         IPC (ContextBridge)
                         Typed Zod Contracts
                                 ▼
+---------------------------------------------------------------------+
|                     Electron Main Process                           |
|  App Lifecycle | Window Management | IPC Dispatcher | Security Policy|
+---------------------------------------------------------------------+
                                 ▲
                     utilityProcess IPC Channel
                                 ▼
+---------------------------------------------------------------------+
|                  Electron Utility Process (Worker)                  |
|  Koffi Win32 FFI | SystemInformation | Samplers | Ring Buffers      |
+---------------------------------------------------------------------+
                                 ▲
                                 ▼
+---------------------------------------------------------------------+
|          Shared System & Security Core / Native Adapters            |
|  Kernel32 | Psapi | IpHlpApi | Advapi32 | SQLite DB | FIM Engine     |
+---------------------------------------------------------------------+
```

For detailed architectural diagrams and process boundaries, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Shell** | Electron 35+, `electron-vite`, TypeScript, Electron `utilityProcess` |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS, Radix UI, Lucide Icons, Motion for React |
| **Data & State** | Zustand, TanStack Query, TanStack Table, Recharts, React Hook Form, Zod |
| **Native Integration** | Koffi (Win32 FFI), `systeminformation`, PowerShell / WMI / CIM |
| **Storage & Persistence**| `better-sqlite3`, WAL mode, Pino structured logging |
| **Testing** | Vitest, React Testing Library, fast-check, Playwright |
| **Workspace & Tooling** | pnpm workspaces, Turborepo, TypeScript Strict Mode, ESLint, Prettier |

---

## 4. Monorepo Structure

```text
sentinel-desktop/
├── apps/
│   └── desktop/                # Main Electron application (main, preload, utility, renderer)
├── packages/
│   ├── contracts/              # Shared IPC types, DTOs, and Zod schemas
│   ├── core/                   # Domain models, entities, and business logic
│   ├── system-adapter/         # OS abstraction layer (Windows, Linux, Darwin)
│   ├── native-bridge/          # Koffi Win32 FFI bindings & safe wrappers
│   ├── monitoring/             # Metric collectors, samplers, and aggregators
│   ├── security/               # Detection rules, process/network auditing, FIM
│   ├── storage/                # SQLite database and persistence layer
│   ├── config/                 # Application configuration schemas & defaults
│   ├── logger/                 # Pino logger configuration
│   ├── shared/                 # Utilities, unit formatters, helpers
│   ├── ui/                     # Design system tokens and shared UI components
│   └── testing/                # Test fixtures, mock providers, and harnesses
├── docs/                       # Comprehensive documentation & ADRs
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 5. Getting Started

### Prerequisites

- **Windows 10 / 11** (x64 or ARM64)
- **Node.js** >= 20.x (Recommended: Node.js 22 LTS or 24)
- **pnpm** >= 9.x / 10.x
- **Build Tools**: Visual Studio Build Tools with C++ workload (for optional native compilation fallback)

### Installation

```bash
# Clone the repository
git clone https://github.com/sentinel-desktop/sentinel-desktop.git
cd sentinel-desktop

# Install monorepo dependencies
pnpm install

# Run build across all packages
pnpm build

# Start desktop app in development mode
pnpm dev

# Build Microsoft Store AppX package
pnpm run release:appx
```

For complete packaging, asset generation, and Partner Center submission guidelines, see the [Microsoft Store AppX Packaging Guide](docs/APPX_BUILD_GUIDE.md).

---

## 6. Key Features Guide

### Process Explorer
- Inspect running processes sorted by CPU, Working Set Memory, PIDs, and handles.
- View real-time parent-child process tree relationships.
- Examine executable file metadata, digital signature validity (Authenticode), and SHA-256 checksums.
- Graceful actions: inspect memory details, copy paths/hashes, open explorer folder, suspend, resume, or terminate processes.

### Host Security Center
- **Execution Path Auditing**: Flags binaries executing from unusual locations like temporary folders or user profiles.
- **Unsigned Binary Detection**: Highlights running executables lacking valid digital signatures.
- **File Integrity Monitoring (FIM)**: Calculate SHA-256 baselines of critical system paths and detect unauthorized modifications or creations.
- **Security Posture Score**: Evaluates Windows Defender status, Windows Firewall profiles, and User Account Control (UAC) elevation.

### Network Monitor
- Real-time enumeration of TCP active connections and UDP listening sockets.
- Direct mapping of network connections to running process PIDs and executable names.
- Interface throughput charts (bytes received/transmitted per second).

---

## 7. Security & Compliance

Sentinel Desktop adheres strictly to the Electron Security Checklist:
- `contextIsolation: true` and `nodeIntegration: false` across all web contents.
- Strict Content Security Policy (`CSP`).
- Sandboxed renderer with typed IPC channels validated with Zod.
- All native FFI calls isolated within a dedicated background worker process (`utilityProcess`).
- No arbitrary remote script execution or unrestricted filesystem access.

---

## 8. License

Distributed under the MIT License. See `LICENSE` for more information.

