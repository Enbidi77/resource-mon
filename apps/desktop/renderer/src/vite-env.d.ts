/// <reference types="vite/client" />
import type { ISentinelAPI } from '@sentinel/contracts';

declare global {
  interface Window {
    sentinelAPI: ISentinelAPI;
  }
}

