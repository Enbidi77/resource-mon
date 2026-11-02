# IPC Contracts Specification

This document details the strongly typed Inter-Process Communication (IPC) contracts connecting the React Renderer, Electron Main Process, and Utility Worker Process in Sentinel Desktop.

---

## 1. IPC Protocol Design

All communication adheres to either:
1. **Request / Response (`ipcRenderer.invoke` -> `ipcMain.handle`)**: Used for queries and commands (e.g. `getProcesses`, `terminateProcess`, `getSystemInfo`).
2. **Push Streams (`webContents.send` -> `ipcRenderer.on`)**: Used for high-frequency telemetry snapshots and real-time security alerts.

All channel names and schemas are centralized in the `@sentinel/contracts` package.

---

## 2. Channel Catalog

### 2.1 System & Telemetry Channels
| Channel | Type | Payload (Request) | Response / Stream Event | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:system:get-overview` | Request/Response | `void` | `SystemOverviewDTO` | Static system info (OS, CPU model, total RAM, hostname) |
| `sentinel:system:get-metrics` | Request/Response | `void` | `SystemMetricsSnapshotDTO` | Instantaneous metrics snapshot |
| `sentinel:stream:system-metrics`| Stream (Push) | `void` | `SystemMetricsSnapshotDTO` | Periodic metric broadcast (default 1000ms) |
| `sentinel:stream:toggle-metrics`| Request/Response | `{ enabled: boolean, intervalMs?: number }` | `{ success: boolean }` | Starts or pauses metric stream |

### 2.2 Process Explorer Channels
| Channel | Type | Payload (Request) | Response / Stream Event | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:processes:list` | Request/Response | `void` | `ProcessInfoDTO[]` | List all running processes with CPU, memory, PIDs |
| `sentinel:processes:get-details`| Request/Response| `{ pid: number }` | `ProcessDetailDTO` | Comprehensive detail (threads, path, hash, signature) |
| `sentinel:processes:terminate` | Request/Response | `{ pid: number, force?: boolean }` | `{ success: boolean, error?: string }` | Terminate specified process |
| `sentinel:processes:verify-sig`| Request/Response | `{ filePath: string }` | `SignatureVerificationResultDTO` | Verify Authenticode signature |

### 2.3 Network Monitor Channels
| Channel | Type | Payload (Request) | Response / Stream Event | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:network:get-connections`| Request/Response | `void` | `NetworkConnectionDTO[]` | Active TCP/UDP socket table mapped to PIDs |
| `sentinel:network:get-interfaces` | Request/Response | `void` | `NetworkInterfaceDTO[]` | Network adapter configurations and stats |

### 2.4 Windows Services Channels
| Channel | Type | Payload (Request) | Response / Stream Event | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:services:list` | Request/Response | `void` | `WindowsServiceDTO[]` | List all Windows services with status and startup |
| `sentinel:services:control` | Request/Response | `{ name: string, action: 'start' \| 'stop' \| 'restart' }` | `{ success: boolean, error?: string }` | Control service state |

### 2.5 Security Center Channels
| Channel | Type | Payload (Request) | Response / Stream Event | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:security:get-posture` | Request/Response | `void` | `SecurityPostureDTO` | Firewall, Defender, UAC elevation status |
| `sentinel:security:get-alerts` | Request/Response | `void` | `SecurityAlertDTO[]` | Generated detection alerts |
| `sentinel:security:run-fim-scan`| Request/Response | `{ directoryPath?: string }` | `FimScanResultDTO` | Run File Integrity Monitor hash baseline scan |

### 2.6 Windows Event Viewer Channels
| Channel | Type | Payload (Request) | Response / Stream Event | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:events:query` | Request/Response | `{ logName: 'System' \| 'Application' \| 'Security', limit?: number }` | `WindowsEventLogEntryDTO[]` | Query recent Windows events |

### 2.7 Reports & Export Channels
| Channel | Type | Payload (Request) | Response / Stream Event | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:reports:generate` | Request/Response | `ReportConfigDTO` | `GeneratedReportDTO` | Generates JSON/CSV/HTML report |

### 2.8 Window Control Channels
| Channel | Type | Payload (Request) | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentinel:window:minimize` | Request/Response | `void` | `void` | Minimize desktop window |
| `sentinel:window:maximize` | Request/Response | `void` | `{ isMaximized: boolean }` | Toggle window maximize/restore |
| `sentinel:window:close` | Request/Response | `void` | `void` | Close application window |

