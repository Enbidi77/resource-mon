# Agent Engineering Guidelines: Sentinel Desktop

This document is the authoritative architectural and operational specification for AI agents and human engineers working on the Sentinel Desktop codebase. It reflects the full codebase structure, conventions, engineering constraints, and development workflows.

---

## 1. Project Mission & Tech Stack

**Sentinel Desktop** is an enterprise-grade, high-performance system resource monitor and cybersecurity workstation for Windows environments. It bridges low-level Win32 native APIs with a modern Apple Glass UI desktop experience.

### Core Stack
- **Monorepo Management**: [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) workspaces
- **Desktop Runtime**: [Electron 32](https://www.electronjs.org/) with multi-process architecture (Main, Context-Isolated Preload, React Renderer)
- **UI Framework**: [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/) (`@electron-vite`), [Tailwind CSS](https://tailwindcss.com/)
- **Design Language**: Apple Glass UI (Liquid Glass aesthetics, specular borders, backdrop blur, soft shadows, dark/light themes)
- **State & Data Visualization**: [Zustand](https://github.com/pmndrs/zustand), [TanStack Query](https://tanstack.com/query), [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/)
- **Native OS FFI**: [Koffi 3.3](https://koffi.dev/) (fast C-call Win32 bindings to `kernel32.dll`, `advapi32.dll`, `pdh.dll`, `wintrust.dll`)
- **System Telemetry**: Native FFI + Win32 PDH + `systeminformation` + PowerShell CIM/WMI fallback
- **Storage & Validation**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), [Zod 3](https://zod.dev/), [Pino 9](https://getpino.io/)
- **Testing**: [Vitest 3](https://vitest.dev/)

---

## 2. Monorepo Architecture & Directory Map

```
resource-mon-cli/
├── apps/
│   └── desktop/                           # Electron Desktop Application
│       ├── electron.vite.config.ts        # Multi-target Vite bundler (main, preload, renderer)
│       ├── package.json
│       ├── electron/
│       │   ├── main/
│       │   │   └── index.ts               # Electron lifecycle, window creation, IPC dispatcher
│       │   └── preload/
│       │       └── index.ts               # Context-isolated window.sentinelAPI bridge
│       └── renderer/
│           ├── index.html
│           └── src/
│               ├── app/                   # App shell, routing, global providers
│               ├── components/
│               │   ├── common/            # Shared UI utilities
│               │   ├── glass/             # Apple Glass UI component design system
│               │   └── layout/            # TitleBar, Sidebar, StatusBar, RightDrawer
│               ├── pages/                 # 11 workstation navigation modules
│               ├── stores/                # Zustand client state stores
│               └── styles/                # Apple Glass design tokens & Tailwind imports
│
├── packages/                              # Modular Shared Libraries
│   ├── config/                            # App settings schema & configuration defaults
│   ├── contracts/                         # Single source of truth: Zod schemas, types, IPC channels
│   ├── core/                              # Central SentinelCoreService, EventReader, ReportGenerator
│   ├── logger/                            # Pino structured JSON logger
│   ├── monitoring/                        # RingBuffer history & SystemCollector
│   ├── native-bridge/                     # Koffi Win32 FFI bindings (Kernel32, Advapi32, PDH, Authenticode)
│   ├── security/                          # FIM engine, posture evaluator, process auditor, rule engine
│   ├── shared/                            # Pure utilities (formatters, time, numbers)
│   ├── storage/                           # SQLite time-series storage (better-sqlite3)
│   ├── system-adapter/                    # OS telemetry adapters (Windows, Linux, macOS, Factory)
│   └── testing/                           # Mock system adapters and test fixtures
│
├── tests/                                 # Monorepo unit & integration test suites
├── pnpm-workspace.yaml                    # Workspace packages definition
├── turbo.json                             # Turborepo task pipeline configuration
└── package.json                           # Root scripts and dev dependencies
```

---

## 3. Package Responsibilities

| Package | Role & Contents |
| :--- | :--- |
| **`@sentinel/contracts`** | **Single Source of Truth**. Defines Zod schemas and TypeScript types for all data exchanged across processes (`system`, `process`, `network`, `security`, `services`, `events`, `hardware`, `reports`, and `ipc` channels). |
| **`@sentinel/native-bridge`** | **Win32 Native FFI**. Koffi bindings to Windows native DLLs: `Kernel32Bridge` (CPU times, memory status, process handles), `Advapi32Bridge` (token elevation, Windows services), `PdhBridge` (Performance Data Helper disk I/O), and `AuthenticodeVerifier` (digital signatures & SHA-256). |
| **`@sentinel/system-adapter`** | **OS Abstraction Layer**. Implements `ISystemAdapter`. `WindowsSystemAdapter` aggregates native FFI calls, PDH counters, and `systeminformation` with caching and multi-tier fallbacks. |
| **`@sentinel/core`** | **Orchestration Service**. `SentinelCoreService` coordinates the adapter, security engine, event log reader (`EventLogReader`), and PDF/JSON report generator (`ReportGenerator`). |
| **`@sentinel/security`** | **Cybersecurity Subsystem**. Real-time File Integrity Monitoring (`FimEngine`), CIS-inspired security posture evaluation (`PostureEvaluator`), and process anomaly detection (`ProcessAuditor`, `SecurityEngine`). |
| **`@sentinel/monitoring`** | **Telemetry Streamer**. `SystemCollector` manages scheduled polling loops, backpressure, and `RingBuffer` time-series history storage. |
| **`@sentinel/storage`** | **Local Persistence**. `TelemetryDatabase` manages SQLite time-series telemetry storage with automatic schema initialization and retention pruning. |
| **`@sentinel/config`** | **Configuration Management**. Validates user preferences, theme, sampling intervals, and security policies via `AppSettingsSchema`. |
| **`@sentinel/logger`** | **Structured Logging**. High-throughput Pino logger with contextual metadata (PID, hostname, timestamps). |
| **`@sentinel/shared`** | **Formatters & Math**. Pure utility functions: `formatBytes`, `formatPercentage`, `formatSpeed`, `formatUptime`, `truncateHash`. |
| **`@sentinel/testing`** | **Test Fixtures**. Provides `MockSystemAdapter` and mock fixtures for CI and headless testing without requiring Windows APIs. |

---

## 4. Golden Rules of the Codebase

1. **Strict Process & Package Isolation**:
   - The React renderer (`apps/desktop/renderer`) must **NEVER** import Node.js core modules (`fs`, `child_process`, `os`, `path`), native bindings (`koffi`), or Electron main process modules.
   - All system capabilities must flow through `@sentinel/contracts` interfaces, the Electron preload script (`apps/desktop/electron/preload/index.ts`), and `window.sentinelAPI`.

2. **No Mock Telemetry in Production Components**:
   - The application must surface live operating system telemetry collected from Windows native APIs (Koffi/PDH), `systeminformation`, or PowerShell/CIM providers.
   - If an API or metric is unavailable (e.g. missing administrator elevation, unsupported sensor), return explicit `null` / `unavailable` status with an explanation rather than synthetic placeholder numbers.

3. **Strict TypeScript & Zod Validation**:
   - `any` is prohibited. Use typed contracts or `unknown` verified through Zod schemas.
   - Every IPC channel request and response payload must be defined and validated in `@sentinel/contracts`.

4. **Resource Footprint & Backpressure**:
   - Sentinel Desktop is a monitoring tool: it must **NOT** consume excessive CPU or memory while observing the host system.
   - Prefer native Win32 FFI (`koffi`) and PDH (`pdh.dll`) over spawning PowerShell child processes. Native calls take microseconds, while child processes take hundreds of milliseconds and spike CPU.
   - UI metrics charts must ingest batched snapshots throttled to human-readable refresh rates (500ms – 2000ms).

5. **Safe Native Memory & FFI Handling**:
   - When using Koffi for Win32 FFI calls, always release allocated pointers (`koffi.free`), handle `INVALID_HANDLE_VALUE`, and map Windows error codes (`GetLastError()`) to descriptive errors.
   - Remember that PDH English counter paths must start with a single backslash (`\\PhysicalDisk(_Total)\\...` in JS literal, NOT double `\\\\` which indicates a remote UNC computer name).

---

## 5. Apple Glass UI Design System

Sentinel Desktop uses the **Apple Glass UI** design language (inspired by macOS / visionOS Liquid Glass):

### Recommended Tokens (`apps/desktop/renderer/src/styles/index.css`)
| Token | Dark Appearance (Default) | Light Appearance (Frosted) |
| :--- | :--- | :--- |
| Canvas Background | `#101114` | `#F5F5F7` |
| Glass Surface | `rgba(40, 40, 45, 0.60)` | `rgba(255, 255, 255, 0.62)` |
| Subtle Surface | `rgba(30, 32, 38, 0.45)` | `rgba(255, 255, 255, 0.42)` |
| Elevated Surface | `rgba(48, 52, 62, 0.75)` | `rgba(255, 255, 255, 0.88)` |
| Solid Surface | `#13161f` | `#FFFFFF` |
| Glass Border | `rgba(255, 255, 255, 0.12)` | `rgba(255, 255, 255, 0.75)` |
| Subtle Border | `rgba(255, 255, 255, 0.06)` | `rgba(0, 0, 0, 0.07)` |
| Specular Highlight | `inset 0 1px 0 0 rgba(255, 255, 255, 0.18)` | `inset 0 1px 0 0 rgba(255, 255, 255, 0.95)` |
| Primary Text | `#F5F5F7` | `#1D1D1F` |
| Secondary Text | `#A1A1A6` | `#86868B` |
| Tertiary Text | `#6E6E73` | `#9E9EA7` |
| Backdrop Blur | `24px` | `24px` |
| Corner Radius | `20px` | `20px` |

### Glass Components (`apps/desktop/renderer/src/components/glass/`)
Use the unified Apple Glass UI component primitives instead of raw HTML:
- **`GlassCard`**: Translucent cards with specular highlight, optional glow (`cyan`, `emerald`, `purple`, `blue`, `amber`, `red`), and hover lift effects.
- **`GlassSurface`**: Layered glass background surfaces with controlled elevation (`base`, `subtle`, `elevated`, `solid`).
- **`GlassButton`**: Interactive spring buttons with variants (`primary`, `glass`, `secondary`, `danger`, `ghost`).
- **`GlassBadge`**: Status indicators with animated pulse dots (`default`, `success`, `warning`, `danger`, `info`, `cyan`, `purple`).
- **`GlassInput`**: Input fields with glass background and glowing focus borders.
- **`GlassModal`**: Floating frosted modal dialogs with backdrop blur.
- **`GlassSegmentedControl`**: Apple-style sliding pill segmented controls.
- **`GlassTableContainer`**: Glass container tailored for dense data tables with readable contrast.

---

## 6. How to Add New Features

When adding new capabilities (e.g. GPU telemetry, new security rule, or service control):

1. **Define the Contract**:
   Add Zod schemas and inferred TypeScript types in `packages/contracts/src/<domain>/`. Export them from `packages/contracts/src/index.ts`.
2. **Implement Native / System Logic**:
   - If calling Win32 C APIs, add Koffi function declarations in `packages/native-bridge/src/bindings/`.
   - Implement the OS-level logic in `packages/system-adapter/src/windows/WindowsSystemAdapter.ts` (with safe fallback for non-Windows).
3. **Wire Core Service**:
   Expose the method in `SentinelCoreService` (`packages/core/src/services/SentinelCoreService.ts`).
4. **Register IPC Handler**:
   - Add the channel name constant to `packages/contracts/src/ipc/channels.ts`.
   - Register the handler in `apps/desktop/electron/main/index.ts` via `ipcMain.handle(IPC_CHANNELS.MY_CHANNEL, ...)`.
5. **Expose in Preload**:
   Update `ISentinelAPI` in `packages/contracts/src/ipc/api.ts` and add the implementation to `apps/desktop/electron/preload/index.ts`.
6. **Implement UI View**:
   Build or update the React view in `apps/desktop/renderer/src/pages/` using the Glass UI components and Zustand stores.
7. **Verify & Test**:
   Ensure `npm run typecheck`, `npm test`, and `npm run build` pass with zero errors.

---

## 7. Development & Build Commands

Always run commands from the repository root:

```bash
# Install dependencies
pnpm install

# Run typecheck across all 12 packages in the monorepo
pnpm run typecheck

# Run unit and integration tests via Vitest
pnpm run test

# Build all packages and the Electron app
pnpm run build

# Start development mode with Vite hot reloading
pnpm run dev

# Format code with Prettier
pnpm run format
```
