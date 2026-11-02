# Sentinel Desktop Security Policy & Model

This document outlines the security architecture, threat model, and defense-in-depth principles employed by Sentinel Desktop.

---

## 1. Threat Model & Trust Boundaries

Sentinel Desktop operates in a high-trust administrative and defensive security context on the user's host machine. However, the user interface and web rendering engine are treated as potentially vulnerable attack surfaces.

### Trust Tiers
1. **Tier 0: Native Operating System Kernel & Win32 APIs**
   - Direct access to process memory tokens, handles, network sockets, and hardware drivers.
2. **Tier 1: Electron Utility Process (Native Worker)**
   - Isolated worker process running Koffi FFI and SQLite persistence.
   - Communicates with Tier 2 only via structured MessagePort IPC.
3. **Tier 2: Electron Main Process (Supervisor)**
   - Manages application lifecycle, window state, and IPC dispatch.
   - Enforces Zod schema validation on all incoming calls.
4. **Tier 3: React Renderer Process (UI Presentation)**
   - Fully sandboxed Chromium environment.
   - **Zero** Node.js integration, **zero** direct filesystem access.

---

## 2. Electron Security Checklist Implementation

Sentinel Desktop complies with the OWASP Electron Security Checklist:

| Control | Status | Implementation Detail |
| :--- | :--- | :--- |
| **Context Isolation** | **Enforced** | `contextIsolation: true` in `webPreferences`. |
| **Node.js Integration** | **Disabled** | `nodeIntegration: false` in `webPreferences`. |
| **Sandbox** | **Enforced** | `sandbox: true` enabled on the renderer window. |
| **Preload Bridge** | **Hardened** | Only explicit methods exposed via `contextBridge.exposeInMainWorld('sentinelAPI', ...)`. |
| **Content Security Policy** | **Strict** | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self';` |
| **External URL Navigation** | **Blocked** | `will-navigate` and `new-window` events intercepted; links opened only via OS default browser after URL sanitization. |
| **Webview / Remote Scripts** | **Disabled** | `webviewTag: false`; no external dynamic script evaluation. |

---

## 3. Defense-in-Depth Native Call Protection

1. **Process Privilege Guarding**:
   - Sentinel Desktop never silently elevates privileges or bypasses UAC.
   - Operations requiring elevation (e.g. terminating a critical service) query the current process token. If non-elevated, the user is presented with a clear warning and instructions to relaunch as Administrator.
2. **Critical Process Immunity List**:
   - Destructive actions (e.g., `killProcess`) reject target PIDs belonging to critical Windows processes (`smss.exe`, `csrss.exe`, `wininit.exe`, `services.exe`, `lsass.exe`, `svchost.exe` core instances) to prevent blue-screen crashes (BSOD).
3. **Input Sanitization**:
   - All IPC parameters (PIDs, service names, file paths) are sanitized using Zod schemas. Path traversals (`../`) and shell injection metacharacters are rejected.
4. **Read-Only Defensive FIM**:
   - The File Integrity Monitor (FIM) reads hashes and compares snapshots against baselines. It never deletes, overwrites, or modifies target monitored binaries.

---

## 4. Reporting Vulnerabilities

If you discover a potential security vulnerability in Sentinel Desktop, please report it privately via GitHub Security Advisories or by emailing `security@sentineldesktop.org`. Please do not disclose vulnerabilities publicly until a patch has been released.
