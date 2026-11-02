# Agent Engineering Guidelines: Sentinel Desktop

This document outlines the rules of engagement, code organization conventions, and engineering constraints for human and AI developers working on the Sentinel Desktop codebase.

---

## 1. Golden Rules of the Codebase

1. **Strict Process & Package Isolation**:
   - The React renderer (`apps/desktop/src/renderer`) must NEVER import Node.js core modules (`fs`, `child_process`, `os`, `path`), native bindings (`koffi`), or Electron main process modules.
   - All system capabilities must flow through `@sentinel/contracts` interfaces, the Electron preload script, and `window.sentinelAPI`.

2. **No Mock Telemetry in Production Components**:
   - The application must surface live operating system telemetry collected from Windows native APIs, `systeminformation`, or PowerShell/CIM providers.
   - If an API is unavailable (e.g. missing elevation, unsupported sensor), return explicit `null` / `unavailable` status with an explanation rather than synthetic mock numbers.

3. **Strict TypeScript & Zod Validation**:
   - `any` is prohibited. Use typed contracts or `unknown` with Zod schema verification.
   - Every IPC channel payload must be validated via Zod schemas defined in `@sentinel/contracts`.

4. **Resource Footprint & Backpressure**:
   - Sentinel Desktop is a monitoring tool: it must NOT consume excessive CPU or memory while observing the host system.
   - Heavy polling (CPU calculation, process iteration, hash verification) must occur in the `utilityProcess` or background workers, not on the UI main thread.
   - UI metrics charts should ingest batched snapshots throttled to human-readable refresh rates (500ms - 2000ms).

5. **Safe Native Memory & FFI Handling**:
   - When using Koffi for Win32 FFI calls, always release allocated pointers (`koffi.free`), handle `INVALID_HANDLE_VALUE`, and map Windows error codes (`GetLastError()`) to descriptive errors.

---

## 2. Directory & Module Navigation

- **Renderer UI**: `apps/desktop/src/renderer`
  - `pages/`: Page views corresponding to navigation modules (Dashboard, Performance, Processes, Hardware, Network, Services, Storage, Security, Events, Reports, Settings).
  - `components/`: UI atoms and molecules (glass cards, gauges, charts, tables).
  - `stores/`: Zustand client-side stores for active filters, selected items, and metric histories.
  - `hooks/`: Custom React hooks wrapping TanStack Query and IPC subscriptions.
- **Electron Main**: `apps/desktop/src/main`
  - `application/`: Application bootstrapper and lifecycle.
  - `windows/`: MainWindow creation with glass styling and frameless window options.
  - `ipc/`: IPC dispatchers and route registration.
- **Electron Utility**: `apps/desktop/src/utility`
  - Long-running collectors, periodic samplers, SQLite time-series storage, Koffi native bridge calls.
- **Preload**: `apps/desktop/src/preload`
  - Exposes typed `window.sentinelAPI` bridge.
- **Core Packages**: `packages/*`
  - Shared domain models, contracts, and system adapters.

---

## 3. Adding New Features

When implementing a new feature (e.g. GPU telemetry, new security rule, or service control):
1. **Define the Contract**: Add types and Zod schemas to `packages/contracts/src/<domain>/`.
2. **Implement in System Adapter**: Add the OS-level logic to `packages/system-adapter/` or `packages/native-bridge/`.
3. **Register IPC Handler**: Wire the request/response or event stream in `apps/desktop/src/main/ipc/` or utility process.
4. **Expose in Preload**: Add the typed method to `apps/desktop/src/preload/index.ts` and `window.sentinelAPI`.
5. **Implement UI Component**: Build the React view in `apps/desktop/src/renderer/` leveraging the design system.
6. **Add Unit / Integration Tests**: Write test cases in `tests/` or alongside the module.

