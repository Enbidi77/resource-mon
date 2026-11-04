# Agent Engineering Guidelines: Sentinel Desktop

This document is the authoritative architectural and operational specification for AI agents and human engineers working on the Sentinel Desktop codebase. It reflects the full codebase structure, conventions, engineering constraints, and development workflows.

---

## 1. Project Mission & Tech Stack

**Sentinel Desktop** is an enterprise-grade, high-performance system resource monitor and cybersecurity workstation for Windows environments. It bridges low-level Win32 native APIs with a modern Apple Glass UI desktop experience.

### Core Stack

- **Monorepo Management**: [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) workspaces
- **Desktop Runtime**: [Electron 32](https://www.electronjs.org/) with multi-process architecture (Main, Context-Isolated Preload, React Renderer)
  - Frameless custom workstation window (`frame: false`), transparent base (`transparent: true`, `backgroundColor: "#00000000"`), custom 20px rounded window shell with specular borders, and macOS Vibrancy (`vibrancy: "under-window"`)
- **UI Framework**: [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/) (`@electron-vite`), [Tailwind CSS](https://tailwindcss.com/)
- **Design Language**: Apple Glass UI (Liquid Glass aesthetics, specular borders, backdrop blur, ambient mesh gradients, soft shadows, dark/light themes)
- **State & Data Visualization**: [Zustand](https://github.com/pmndrs/zustand), [TanStack Query](https://tanstack.com/query), [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/)
- **Native OS FFI**: [Koffi 3.3](https://koffi.dev/) (fast C-call Win32 bindings to `kernel32.dll`, `advapi32.dll`, `pdh.dll`, `wintrust.dll`)
  - Offloaded non-blocking asynchronous execution via libuv worker threads (`promisifyKoffi` on `koffi.async`) preventing main-thread event loop freezes
- **System Telemetry**: Sub-second streaming engine (< 4ms snapshot latency) combining native Win32 FFI + Win32 PDH disk I/O throughput + native `os.cpus()` deltas + non-blocking background telemetry caches for GPU and network statistics
- **Resource Lifecycle & Cleanup**: TypeScript 5.2+ Explicit Resource Management (`Disposable`, `AsyncDisposable`, `Symbol.dispose`, `Symbol.asyncDispose`, `using`, `await using`)
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
│       │   │   └── index.ts               # Electron lifecycle, acrylic window, IPC dispatcher
│       │   └── preload/
│       │       └── index.ts               # Context-isolated window.sentinelAPI bridge
│       └── renderer/
│           ├── index.html
│           └── src/
│               ├── app/                   # App shell, routing, global providers
│               ├── components/
│               │   ├── common/            # ArcGauge, CommandPalette, ErrorBoundary
│               │   ├── glass/             # Apple Glass UI component system (Tabs, Card, Badge, etc.)
│               │   └── layout/            # TitleBar, Sidebar, StatusBar, RightDrawer
│               ├── pages/                 # 11 workstation navigation modules & security analyzer
│               ├── stores/                # Zustand client state stores (useAppStore, useMetricsStore)
│               └── styles/                # Apple Glass design tokens & Tailwind imports
│
├── packages/                              # Modular Shared Libraries
│   ├── config/                            # App settings schema & configuration defaults
│   ├── contracts/                         # Single source of truth: Zod schemas, types, IPC channels
│   ├── core/                              # Central SentinelCoreService, EventReader, ReportGenerator
│   ├── logger/                            # Pino structured JSON logger
│   ├── monitoring/                        # RingBuffer history & SystemCollector (Disposable timer/subscribers)
│   ├── native-bridge/                     # Koffi Win32 FFI bindings (Kernel32, Advapi32, PDH [Disposable], Authenticode)
│   ├── security/                          # SecurityAnalyzer, FIM engine, posture evaluator, process auditor
│   ├── shared/                            # Pure utilities (formatters, math, and Disposable/AsyncDisposable helpers)
│   ├── storage/                           # SQLite time-series storage (SentinelDatabase [Disposable, AsyncDisposable])
│   ├── system-adapter/                    # OS telemetry adapters (WindowsSystemAdapter [Disposable], Linux, macOS, Factory)
│   └── testing/                           # Mock system adapters and test fixtures
│
├── tests/                                 # Monorepo unit & integration test suites
│   ├── core.test.ts                       # Core service, adapter, and collector integration tests
│   ├── security.test.ts                   # SecurityAnalyzer contract & vulnerability detection tests
│   └── disposable.test.ts                 # Explicit Resource Management (using/await using) test suite
├── pnpm-workspace.yaml                    # Workspace packages definition
├── turbo.json                             # Turborepo task pipeline configuration
└── package.json                           # Root scripts and dev dependencies
```

---

## 3. Package Responsibilities

| Package                        | Role & Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :----------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@sentinel/contracts`**      | **Single Source of Truth**. Defines Zod schemas and TypeScript types for all data exchanged across processes (`system`, `process`, `network`, `security` [including `SecurityAuditReportSchema` and `BinaryInspectionResultSchema`], `services`, `events`, `hardware`, `reports`, and `ipc` channels/interfaces).                                                                                                                                                                                    |
| **`@sentinel/native-bridge`**  | **Win32 Native FFI**. Koffi bindings to Windows native DLLs with synchronous and non-blocking asynchronous (`koffi.async`) execution: `Kernel32Bridge` (CPU times, memory status via `GlobalMemoryStatusEx`, process handles), `Advapi32Bridge` (token elevation, Windows services, registry), `PdhBridge` (Performance Data Helper disk I/O throughput counters, implementing `Disposable` and `AsyncDisposable`), and `AuthenticodeVerifier` (`WinVerifyTrust` digital signatures & SHA-256 hash). |
| **`@sentinel/system-adapter`** | **OS Abstraction Layer**. Implements `ISystemAdapter`. High-speed `WindowsSystemAdapter` (< 4ms latency, implementing `Disposable` and `AsyncDisposable`) aggregates non-blocking native FFI calls, PDH counters, `os.cpus()` deltas, and throttled background worker caches for slower providers (GPU via `systeminformation` and network adapters).                                                                                                                                                |
| **`@sentinel/core`**           | **Orchestration Service**. `SentinelCoreService` (implementing `Disposable` and `AsyncDisposable`) coordinates the adapter, security engine (`SecurityEngine`, `SecurityAnalyzer`), event log reader (`EventLogReader`), and PDF/JSON report generator (`ReportGenerator`).                                                                                                                                                                                                                          |
| **`@sentinel/security`**       | **Cybersecurity Subsystem**. Comprehensive vulnerability and threat evaluation with `SecurityAnalyzer` (automated CIS hardening checks, CWE-428 unquoted service inspection, exposed port detection, autostart persistence hunter, and Shannon entropy analysis for packed binaries), real-time File Integrity Monitoring (`FimEngine`), CIS-inspired security posture evaluation (`PostureEvaluator`), and process anomaly detection (`ProcessAuditor`, `SecurityEngine`).                          |
| **`@sentinel/monitoring`**     | **Telemetry Streamer**. `SystemCollector` (implementing `Disposable`) manages scheduled polling loops, backpressure, sub-second intervals, hybrid `SubscriptionDisposable` subscriptions, and `RingBuffer` time-series history storage.                                                                                                                                                                                                                                                              |
| **`@sentinel/storage`**        | **Local Persistence**. `SentinelDatabase` (implementing `Disposable` and `AsyncDisposable`) manages SQLite and persistent WAL time-series telemetry storage with graceful stream flushing and idempotent disposal.                                                                                                                                                                                                                                                                                   |
| **`@sentinel/config`**         | **Configuration Management**. Validates user preferences, theme, sampling intervals, and security policies via `AppSettingsSchema`.                                                                                                                                                                                                                                                                                                                                                                  |
| **`@sentinel/logger`**         | **Structured Logging**. High-throughput Pino logger with contextual metadata (PID, hostname, timestamps).                                                                                                                                                                                                                                                                                                                                                                                            |
| **`@sentinel/shared`**         | **Formatters, Math & Disposables**. Pure utility functions: `formatBytes`, `formatPercentage`, `formatSpeed`, `formatUptime`, `truncateHash`, and Explicit Resource Management helpers (`toDisposable`, `toAsyncDisposable`, `createSubscriptionDisposable`, `disposeSafely`, `disposeSafelyAsync`).                                                                                                                                                                                                 |
| **`@sentinel/testing`**        | **Test Fixtures**. Provides `MockSystemAdapter` and mock fixtures for CI and headless testing without requiring Windows APIs.                                                                                                                                                                                                                                                                                                                                                                        |

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

4. **Resource Footprint & Sub-Second Latency**:
   - Sentinel Desktop is a monitoring tool: it must **NOT** consume excessive CPU or memory while observing the host system.
   - Fast telemetry snapshots (`getMetricsSnapshot()`) must complete in under 5ms.
   - Prefer native Win32 FFI (`koffi`) and PDH (`pdh.dll`) over spawning PowerShell child processes. Native calls take microseconds, while child processes take hundreds of milliseconds and spike CPU.
   - Slower data providers (such as GPU queries or network interface listing via `systeminformation`) must be fetched asynchronously in background worker caches rather than blocking the telemetry tick loop.
   - UI metrics charts must ingest batched snapshots throttled to human-readable refresh rates (250ms – 2000ms), and time-series history buffers must dynamically scale capacity to maintain a rolling window (e.g. ~30 seconds) across all sampling rates.

5. **Safe Native Memory & Non-Blocking Async FFI Execution**:
   - When using Koffi for Win32 FFI calls, always release allocated pointers (`koffi.free`), handle `INVALID_HANDLE_VALUE`, and map Windows error codes (`GetLastError()`) to descriptive errors.
   - For I/O-intensive or cryptographic/verification operations (e.g. `WinVerifyTrust`, `GetSystemTimes`, `PdhCollectQueryData`, SHA-256 computation, directory file walks), always use non-blocking asynchronous execution (`promisifyKoffi(fn.async)` or worker threads) to prevent freezing the Electron main process event loop.
   - PDH English counter paths must start with a single backslash (`\\PhysicalDisk(_Total)\\...` in JS literal, NOT double `\\\\` which indicates a remote UNC computer name).

6. **Fault Tolerance, Graceful Degradation & Error Boundaries**:
   - Workstation renderer modules and heavy sub-views must be wrapped in `ErrorBoundary` components to catch unexpected runtime UI errors and allow interactive recovery without crashing the whole application.
   - Native FFI bridges and platform adapters must provide safe fallbacks for missing DLLs, non-Windows platforms, or insufficient administrative privileges without throwing unhandled exceptions.

7. **Explicit Resource Management & Deterministic Disposal (`using` / `await using`)**:
   - Resources that manage native operating system handles (PDH queries, process handles), filesystem write streams, polling intervals, or event subscriptions must implement TypeScript's standard `Disposable` (`[Symbol.dispose]()`) or `AsyncDisposable` (`[Symbol.asyncDispose]()`).
   - Prefer `using` or `await using` for deterministic cleanup at scope boundaries rather than relying on garbage collection or loose `finally` blocks.
   - Event and telemetry subscriptions (e.g. `collector.subscribe(...)` and `window.sentinelAPI.onSystemMetrics(...)`) must return a `SubscriptionDisposable` hybrid that can be cleaned up either via direct callback invocation `unsub()` or via `using unsub = ...`.
   - All disposal operations must be idempotent: repeated calls to `dispose()` or `[Symbol.dispose]()` must safely no-op without re-executing teardown or throwing unhandled errors.

---

## 5. Apple Glass UI Design System

Sentinel Desktop uses the **Apple Glass UI** design language (inspired by macOS / visionOS Liquid Glass):

### Design Tokens (`apps/desktop/renderer/src/styles/index.css`)

| Token              | Dark Appearance (Default)                   | Light Appearance (Frosted Liquid Glass)     |
| :----------------- | :------------------------------------------ | :------------------------------------------ |
| Canvas Background  | `#070913`                                   | `#F0F2F6`                                   |
| Glass Surface      | `rgba(255, 255, 255, 0.04)`                 | `rgba(255, 255, 255, 0.72)`                 |
| Subtle Surface     | `rgba(255, 255, 255, 0.025)`                | `rgba(255, 255, 255, 0.45)`                 |
| Elevated Surface   | `rgba(255, 255, 255, 0.075)`                | `rgba(255, 255, 255, 0.90)`                 |
| Solid Surface      | `#0c0e18`                                   | `#FFFFFF`                                   |
| Glass Border       | `rgba(255, 255, 255, 0.10)`                 | `rgba(255, 255, 255, 0.85)`                 |
| Subtle Border      | `rgba(255, 255, 255, 0.06)`                 | `rgba(0, 0, 0, 0.06)`                       |
| Specular Highlight | `inset 0 1px 0 0 rgba(255, 255, 255, 0.22)` | `inset 0 1px 0 0 rgba(255, 255, 255, 0.95)` |
| Primary Text       | `#FFFFFF`                                   | `#1D1D1F`                                   |
| Secondary Text     | `rgba(255, 255, 255, 0.65)`                 | `#52525B`                                   |
| Tertiary Text      | `rgba(255, 255, 255, 0.42)`                 | `#8E8E93`                                   |
| Backdrop Blur      | `28px`                                      | `28px`                                      |
| Corner Radius      | `20px`                                      | `20px`                                      |

### Glass Component Suite (`apps/desktop/renderer/src/components/glass/`)

Use the unified Apple Glass UI component primitives instead of raw HTML:

- **`GlassCard`**: Translucent cards with specular highlight, optional glow (`cyan`, `emerald`, `purple`, `blue`, `amber`, `red`), and hover lift effects.
- **`GlassSurface`**: Layered glass background surfaces with controlled elevation (`base`, `subtle`, `elevated`, `solid`).
- **`GlassButton`**: Interactive spring buttons with variants (`primary`, `glass`, `secondary`, `danger`, `ghost`).
- **`GlassBadge`**: Status indicators with animated pulse dots (`default`, `success`, `warning`, `danger`, `info`, `cyan`, `purple`).
- **`GlassInput`**: Input fields with glass background and glowing focus borders.
- **`GlassModal`**: Floating frosted modal dialogs with backdrop blur.
- **`GlassSegmentedControl`**: Apple-style sliding pill segmented controls.
- **`GlassTabs` & `GlassTabPanel`**: Apple-style tabbed navigation with animated liquid glass active pill indicator, optional counter badges, and icons.
- **`GlassTableContainer`**: Glass container tailored for dense data tables with readable contrast, frosted glass header styling, and sticky scrollbars.

### Shared Common Primitives (`apps/desktop/renderer/src/components/common/`)

- **`ArcGauge`**: Circular and semicircular liquid glass gauges for CPU, memory, and system integrity visualization.
- **`CommandPalette`**: Global keyboard-driven (`Ctrl+K`) search and workstation navigation launcher.
- **`ErrorBoundary`**: High-resilience UI fault handler providing interactive recovery without crashing the application shell.

---

## 6. How to Add New Features

When adding new capabilities (e.g. GPU telemetry, new security rule, or service control):

1. **Define the Contract**:
   Add Zod schemas and inferred TypeScript types in `packages/contracts/src/<domain>/index.ts`. Export them from `packages/contracts/src/index.ts`.
2. **Implement Native / System Logic**:
   - If calling Win32 C APIs, add Koffi function declarations in `packages/native-bridge/src/bindings/`. For any non-trivial or I/O operation, provide a promisified asynchronous wrapper via `promisifyKoffi`.
   - Implement the OS-level logic in `packages/system-adapter/src/windows/WindowsSystemAdapter.ts` (with safe fallbacks for non-Windows and non-elevated permissions). If managing handles, implement `Disposable` or `AsyncDisposable`.
3. **Wire Core Service**:
   Expose the method in `SentinelCoreService` (`packages/core/src/services/SentinelCoreService.ts`).
4. **Register IPC Handler**:
   - Add the channel name constant to `IPC_CHANNELS` and the method to `ISentinelAPI` in `packages/contracts/src/ipc/index.ts`.
   - Register the handler in `apps/desktop/electron/main/index.ts` via `ipcMain.handle(IPC_CHANNELS.MY_CHANNEL, ...)`.
5. **Expose in Preload**:
   Implement the bridge call in `apps/desktop/electron/preload/index.ts` onto `sentinelAPI`.
6. **Implement UI View & Store**:
   Build or update the React view in `apps/desktop/renderer/src/pages/` using the Glass UI components and Zustand stores. Wrap complex views in `ErrorBoundary`.
7. **Verify & Test**:
   Ensure `pnpm run typecheck`, `pnpm test`, and `pnpm run build` pass with zero errors.

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

# Start development mode with VS Code main process debugging
pnpm run dev:debug

# Format code with Prettier
pnpm run format
```
