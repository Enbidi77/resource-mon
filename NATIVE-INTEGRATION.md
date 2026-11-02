# Native Windows Integration Guide

This document describes the native integration mechanisms used by Sentinel Desktop to communicate with Windows OS internals using **Koffi FFI**, **Win32 DLLs**, **systeminformation**, and **PowerShell / CIM**.

---

## 1. Koffi FFI Architecture

Sentinel Desktop uses **Koffi** (fast C FFI for Node.js) to call Win32 system APIs directly from the isolated `utilityProcess`.

### Loaded Native Libraries

| Library | Exported Functions / Capabilities | Use Case |
| :--- | :--- | :--- |
| `Kernel32.dll` | `GetSystemTimes`, `GlobalMemoryStatusEx`, `GetTickCount64`, `GetCurrentProcess`, `OpenProcess`, `CloseHandle`, `GetSystemInfo` | High-frequency CPU, memory, uptime, and process handle management |
| `Psapi.dll` | `EnumProcesses`, `GetProcessMemoryInfo`, `GetModuleFileNameExW` | Low-overhead process enumeration and working set memory inspection |
| `IpHlpApi.dll` | `GetExtendedTcpTable`, `GetExtendedUdpTable`, `GetIfTable2` | High-speed active socket enumeration and process-to-connection attribution |
| `Advapi32.dll` | `OpenSCManagerW`, `EnumServicesStatusExW`, `ControlService`, `StartServiceW`, `OpenProcessToken`, `GetTokenInformation` | Windows Service management and process token privilege detection |
| `Wintrust.dll` | `WinVerifyTrust` | Cryptographic Authenticode digital signature validation |
| `Crypt32.dll` | `CertGetNameStringW`, `CryptQueryObject` | Extracting signer subject name from PE binary certificate tables |

---

## 2. Memory Safety & Pointer Management

When calling Win32 APIs via Koffi:
1. **Explicit Memory Allocation & Free**: Any pointers or native structs allocated via `koffi.alloc()` must be explicitly freed or enclosed in `try...finally` blocks.
2. **Buffer Sizing for Strings**: Win32 Unicode functions (`*W`) require `WCHAR` arrays. Buffers are sized to `MAX_PATH` (260) or extended length (32,767) to prevent buffer overflows.
3. **Struct Alignment**: All Win32 structs (such as `MEMORYSTATUSEX`, `PROCESS_MEMORY_COUNTERS_EX`, `MIB_TCPROW_OWNER_PID`) have exact byte packing matching 64-bit Windows ABI.

---

## 3. Fallback & Cross-Platform Tiering

Native operations are structured in three resilient tiers:

```
Tier 1: Koffi Win32 FFI (Sub-millisecond latency, zero process spawning)
           ↓ (if FFI unavailable or permission denied)
Tier 2: Node.js systeminformation (Native C++ bindings / WMI cross-platform parser)
           ↓ (if deep Windows configuration details required)
Tier 3: PowerShell / CIM Commands (Structured JSON output via child_process)
```

This multi-tiered approach ensures that:
- Core metrics are ultra-fast and low-impact.
- The application never crashes if a specific Win32 API is restricted by group policy.
- Linux and macOS environments gracefully execute Tier 2 without throwing native Windows errors.

