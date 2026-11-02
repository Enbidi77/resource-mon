# Sentinel Desktop Development Roadmap

This document outlines the multi-phase implementation roadmap for Sentinel Desktop, from core architecture to cross-platform expansion.

---

## Phase 1 — Monorepo & Core Foundation (Completed)
- [x] Turborepo + pnpm monorepo structure
- [x] Electron 35+ / Vite integration with TypeScript
- [x] Secure Preload bridge with typed IPC contracts and Zod validation
- [x] Design system foundation: Apple Liquid Glass, dark charcoal theme, Fluent Design, Tailwind CSS
- [x] Pino logging infrastructure and SQLite database setup

## Phase 2 — Real-Time Visual Dashboard (Completed)
- [x] Live system telemetry overview (CPU, RAM, GPU, Disks, Network)
- [x] High-precision radial arc gauges for System Integrity & Resource Utilization
- [x] Predictive Threat Modeling and real-time activity trend charts
- [x] Connected systems/nodes summary and security posture indicator
- [x] Live interactive map / network topography widget

## Phase 3 — Deep Process Explorer (Completed)
- [x] Running process enumeration with PID, Parent PID, CPU, and Working Set Memory
- [x] Dynamic parent-child process tree view
- [x] Executable path, digital signature verification (Authenticode), and SHA-256 hash tracking
- [x] Action capabilities: Process termination, suspension, and folder location viewing
- [x] Critical system process protection and multi-column sorting/search

## Phase 4 — Hardware & Performance Inspector (Completed)
- [x] Detailed CPU core topology, per-core utilization bars, frequencies, and temperatures
- [x] Memory metrics: physical RAM, available, cached, committed, and page file usage
- [x] GPU metrics: model name, core load %, VRAM utilization, and driver version
- [x] Storage devices: physical drive models, read/write speeds, and partition usage
- [x] Network interfaces: adapter details, MAC addresses, IPv4/IPv6, and live bandwidth

## Phase 5 — Network Administration & Port Auditor (Completed)
- [x] Active TCP connection table and listening UDP endpoints
- [x] Process-to-network socket correlation (mapping sockets to PIDs and executables)
- [x] Local and remote IP classification, port inspection, and protocol tracking
- [x] Live upload/download bandwidth monitoring per interface

## Phase 6 — Native Windows Integration (Completed)
- [x] Koffi Win32 FFI bindings for `Kernel32.dll`, `Psapi.dll`, and `IpHlpApi.dll`
- [x] Windows Services Manager: query status, start, stop, restart, and inspect service accounts
- [x] Windows Event Log integration (System, Security, Application logs)
- [x] Digital signature verification via Win32 Authenticode APIs

## Phase 7 — Defensive Host Security Center (Completed)
- [x] Execution path auditing (flagging temp/appdata execution)
- [x] Unsigned executable detection and anomalous parent-child relationship alerting
- [x] File Integrity Monitoring (FIM): SHA-256 baseline creation and change detection
- [x] Host Security Posture assessment: Windows Defender, Firewall, and UAC elevation status
- [x] Explainable rule-based alert engine with severity levels and mitigation steps

## Phase 8 — Advanced Reporting & Cross-Platform Expansion (In Progress)
- [x] Exportable audit reports in JSON, CSV, and formatted HTML
- [ ] Direct headless PDF report compilation
- [ ] Linux system adapter implementation (`/proc`, `sysfs`, `ebpf`)
- [ ] macOS system adapter implementation (`libproc`, `sysctl`)
- [ ] Third-party plugin capability sandbox

