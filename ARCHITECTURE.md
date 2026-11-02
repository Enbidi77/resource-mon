# Sentinel Desktop Architecture Specification

## 1. Architectural Philosophy & Principles

Sentinel Desktop is engineered with four non-negotiable architectural tenets:
1. **Renderer Isolation**: The presentation layer (React 19) is strictly a passive, sandboxed view with no access to Node.js APIs, native bindings, or filesystem handles. All state updates are received via strongly typed, immutable IPC messages.
2. **Crash Resilience via Native Utility Process**: High-frequency system calls, native C/C++ FFI bindings (Koffi), and potentially unstable low-level APIs execute in an isolated Electron `utilityProcess`. Should a native call fault or leak, the main application shell and UI remain unharmed.
3. **Strict Domain-Driven Boundaries**: Business logic (detection rules, process hierarchy calculation, metric aggregation) is encapsulated inside decoupled packages (`@sentinel/core`, `@sentinel/security`, `@sentinel/monitoring`) independent of Electron or React.
4. **First-Class Windows Internals with Cross-Platform Abstraction**: The core uses an abstract `SystemAdapter` interface with a concrete `WindowsSystemAdapter` leveraging Win32 APIs, while providing clean extension points for Linux (`/proc`, `sysfs`, `ebpf`) and macOS (`libproc`, `sysctl`).

---

## 2. Process Topology

```
+-------------------------------------------------------------------------------+
|                               RENDERER PROCESS                                |
|  - React 19 UI Components                                                     |
|  - Zustand Stores (Global state & live buffers)                               |
|  - TanStack Query (Async queries & caching)                                   |
|  - Recharts & Virtualized Lists                                               |
|  - Lucide Icons & Tailwind CSS / Glass Tokens                                 |
+-------------------------------------------------------------------------------+
                                        │
                         IPC Event Bridge (contextBridge)
                         Typed Channels & Zod Schema Validation
                                        │
+-------------------------------------------------------------------------------+
|                              ELECTRON MAIN PROCESS                            |
|  - Application Lifecycle & Window Management                                  |
|  - Power Monitor & Tray Management                                            |
|  - IPC Dispatcher & Route Security                                            |
|  - Utility Process Supervisor (Spawn, Heartbeat, Restart)                     |
+-------------------------------------------------------------------------------+
                                        │
                           Utility Process IPC MessagePort
                                        │
+-------------------------------------------------------------------------------+
|                            UTILITY PROCESS (DAEMON)                           |
|  - Metric Samplers (Fast 1s, Standard 3s, Slow 10s)                          |
|  - Koffi Win32 FFI Bindings (Kernel32, Psapi, IpHlpApi, Advapi32, Wevtapi)    |
|  - SQLite Database (better-sqlite3) & Time-Series History Retention          |
|  - Host Security Engine (FIM, Process Rule Evaluator, Port Auditor)          |
|  - Event Log Listener & WMI/CIM Query Provider                                |
+-------------------------------------------------------------------------------+
```

---

## 3. Package Boundaries & Responsibilities

The monorepo organizes responsibilities into discrete, self-contained packages:

```
packages/
├── contracts/
│   ├── src/
│   │   ├── ipc/           # IPC Channel definitions & type-safe request/response pairs
│   │   ├── system/        # CPU, RAM, Disk, OS telemetry DTOs & Zod schemas
│   │   ├── process/       # Process entity schemas, hierarchy, flags, hashes
│   │   ├── network/       # TCP/UDP connection, interface, and DNS schemas
│   │   ├── security/      # Security alerts, FIM baselines, rule definitions
│   │   └── services/      # Windows Service status, config, and control DTOs
│   └── package.json
│
├── core/
│   ├── src/
│   │   ├── domain/        # Pure business entities and domain events
│   │   ├── application/   # Use cases and orchestration
│   │   ├── services/      # In-memory tree builders, calculations
│   │   └── events/        # Event bus interfaces
│   └── package.json
│
├── system-adapter/
│   ├── src/
│   │   ├── interfaces/    # ISystemAdapter, IProcessAdapter, INetworkAdapter
│   │   ├── windows/       # WindowsSystemAdapter (Koffi + SI + PowerShell)
│   │   ├── linux/         # LinuxSystemAdapter (Future /proc parser)
│   │   ├── darwin/        # DarwinSystemAdapter (Future sysctl parser)
│   │   └── factory/       # AdapterFactory (Platform detection)
│   └── package.json
│
├── native-bridge/
│   ├── src/
│   │   ├── koffi/         # Koffi instance configuration & library loaders
│   │   ├── bindings/      # kernel32, psapi, iphlpapi, advapi32, wintrust
│   │   ├── types/         # Native struct definitions & C-type mappings
│   │   └── wrappers/      # Safe memory handling, error code translators
│   └── package.json
│
├── monitoring/
│   ├── src/
│   │   ├── collectors/    # CpuCollector, MemoryCollector, DiskCollector, etc.
│   │   ├── samplers/      # Timer-based periodic tick orchestrator
│   │   ├── aggregators/   # Rolling averages, peak detectors, p95 calculations
│   │   └── history/       # Ring buffers for time-series chart data
│   └── package.json
│
├── security/
│   ├── src/
│   │   ├── auditing/      # ProcessExecutionAuditor, PortAuditor
│   │   ├── detection/     # Heuristic and signature-based detection engine
│   │   ├── rules/         # Built-in security rules (e.g., unsigned temp binaries)
│   │   ├── integrity/     # File Integrity Monitoring (FIM) engine
│   │   └── events/        # Security alert models and dispatchers
│   └── package.json
│
├── storage/
│   ├── src/
│   │   ├── sqlite/        # better-sqlite3 database connection & migrations
│   │   ├── repositories/  # MetricRepository, SecurityAlertRepository, SettingsRepo
│   │   └── schemas/       # SQL table schemas & index configurations
│   └── package.json
│
├── config/
│   ├── src/
│   │   ├── defaults/      # Default settings for intervals, theme, thresholds
│   │   ├── schemas/       # Zod validation schemas for user preferences
│   │   └── store/         # Persistent configuration manager
│   └── package.json
│
├── logger/
│   ├── src/
│   │   └── index.ts       # Structured Pino logger with log level control
│   └── package.json
│
├── shared/
│   ├── src/
│   │   ├── formatters/    # Format bytes, frequencies, dates, durations, IPs
│   │   ├── helpers/       # Deep clone, debounce, throttle, hash utilities
│   │   └── errors/        # Custom error hierarchies (SystemError, SecurityError)
│   └── package.json
│
└── ui/
    ├── src/
    │   ├── theme/         # Color palettes, glass tokens, typography
    │   ├── components/    # Reusable atoms (GlassCard, Badge, Button, Input)
    │   └── icons/         # Icon aliases and graphics
    └── package.json
```

---

## 4. IPC Architecture & Message Flow

All communication between the React Renderer and the Electron Main/Utility processes uses strongly typed request/response channels and push event streams.

### Channel Naming Convention
- `sentinel:<domain>:<action>` for request/response (e.g., `sentinel:processes:list`)
- `sentinel:stream:<domain>` for push streams (e.g., `sentinel:stream:system-metrics`)

### End-to-End Metric Flow
```
1. Utility Process Timer triggers CpuCollector.collect()
2. Koffi invokes GetSystemTimes() in Kernel32.dll
3. Metric is pushed into rolling memory RingBuffer in Utility Process
4. Utility Process dispatches snapshot to Main Process via MessagePort
5. Main Process dispatches `sentinel:stream:system-metrics` to BrowserWindow
6. Preload bridge exposes `api.onSystemMetrics(callback)`
7. Zustand store `useMetricsStore` receives metric and updates chart state
8. React Recharts component re-renders with zero IPC serialization overhead
```

---

## 5. Security Architecture

1. **Preload Security**: Preload script does not expose raw `ipcRenderer`. Only explicitly declared methods on `window.sentinelAPI` are made accessible to the window context.
2. **Payload Validation**: All incoming requests and parameters (e.g. PID to kill, service name to restart) are validated with Zod schemas in the main process before reaching native layers.
3. **Privilege Awareness**: Windows operations requiring administrative elevation (e.g. terminating protected processes, restarting system services) check current process token privileges (`TOKEN_QUERY`, `TOKEN_ELEVATION`) and prompt the user gracefully rather than failing silently.

---

## 6. Extensibility & Future OS Targets

The `SystemAdapter` interface abstracts platform-specific telemetry collection:
- `ISystemAdapter.getSystemMetrics(): Promise<SystemMetricsSnapshot>`
- `IProcessAdapter.listProcesses(): Promise<ProcessInfo[]>`
- `INetworkAdapter.getActiveConnections(): Promise<NetworkConnection[]>`

When running on Windows, the `WindowsSystemAdapter` is instantiated. When targeting Linux or macOS in future releases, `LinuxSystemAdapter` and `DarwinSystemAdapter` satisfy the identical interface contracts, enabling the UI and core services to remain 100% untouched.
