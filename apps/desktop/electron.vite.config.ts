import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Ensure Electron spawns as a full GUI application even if parent shell has ELECTRON_RUN_AS_NODE set
delete process.env.ELECTRON_RUN_AS_NODE;

const workspacePackages = [
  '@sentinel/contracts',
  '@sentinel/core',
  '@sentinel/system-adapter',
  '@sentinel/native-bridge',
  '@sentinel/monitoring',
  '@sentinel/security',
  '@sentinel/storage',
  '@sentinel/config',
  '@sentinel/logger',
  '@sentinel/shared',
];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
    build: {
      rollupOptions: {
        external: ['koffi', 'better-sqlite3', 'pino', 'systeminformation'],
        input: {
          index: resolve(__dirname, 'electron/main/index.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload/index.ts'),
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'renderer'),
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'renderer/index.html'),
        },
      },
    },
  },
});

