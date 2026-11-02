# Sentinel Desktop Development Guide

This document covers local development setup, debugging, build pipelines, and testing procedures.

---

## 1. Environment Requirements

- **Operating System**: Windows 10 (Build 19041+) or Windows 11 (22H2+) x64 / ARM64.
- **Node.js**: v20.x or v22.x LTS (tested up to v24).
- **Package Manager**: `pnpm` (v9.x or v10.x).
- **C/C++ Build Tools (optional)**: Visual Studio 2022 C++ Build Tools or Windows SDK (required if rebuilding native modules from source).

---

## 2. Monorepo Setup

Sentinel Desktop is structured as a pnpm workspace orchestrated by Turborepo.

```bash
# Clone the repository
git clone https://github.com/sentinel-desktop/sentinel-desktop.git
cd sentinel-desktop

# Install all monorepo dependencies
pnpm install
```

---

## 3. Available Scripts

The following commands can be executed from the root of the monorepo:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts Vite HMR for the React renderer and launches Electron in dev mode with live reloading |
| `pnpm build` | Typechecks and bundles all packages and apps via Turborepo |
| `pnpm build:apps` | Bundles the Electron main, preload, and renderer packages |
| `pnpm test` | Runs unit tests across all workspace packages via Vitest |
| `pnpm lint` | Runs ESLint across all TypeScript packages |
| `pnpm format` | Formats all source files with Prettier |
| `pnpm typecheck` | Runs `tsc --noEmit` across all workspace projects |

---

## 4. Development Workflow

### Starting the Application in Development Mode
```bash
pnpm dev
```
This triggers:
1. Electron-Vite compiling the main process (`apps/desktop/src/main`) and preload script (`apps/desktop/src/preload`).
2. Vite starting a local development server for the renderer (`apps/desktop/src/renderer`) with React Fast Refresh.
3. Electron window launching with Chrome DevTools open.

### Running with Elevated Privileges (Administrator)
Certain security and network features (e.g. terminating foreign processes, restarting system services, querying security event logs) require Windows Administrator privileges.
To run with elevation during development:
1. Open PowerShell or Windows Terminal as **Administrator**.
2. Navigate to the project directory: `cd d:\data\Doc\.content\resource-mon-cli`.
3. Run `pnpm dev`.
Sentinel Desktop's status bar will display `Status: ELEVATED (Admin)` with appropriate badge indicators.

---

## 5. Testing & Quality Assurance

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run coverage report
pnpm test:coverage
```

### Mocking Native Providers
When running tests in non-Windows CI environments (e.g. GitHub Actions Linux runners), native Win32 FFI bindings automatically fall back to the mock system provider in `@sentinel/testing`, ensuring 100% test coverage without hardware dependency.
