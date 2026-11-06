import { describe, it, expect } from "vitest";
import {
  CompactSettingsSchema,
  DEFAULT_COMPACT_SETTINGS,
  CompactSpecIdSchema,
  CompactLayoutModeSchema,
  CompactDisplayDensitySchema,
  CompactVisualGaugeSchema,
  CompactAccentColorSchema,
  IPC_CHANNELS,
  type CompactSpecId,
} from "../packages/contracts/src/index.js";

describe("Compact HUD Settings Contracts & Schemas", () => {
  it("validates DEFAULT_COMPACT_SETTINGS conforming to CompactSettingsSchema", () => {
    const result = CompactSettingsSchema.safeParse(DEFAULT_COMPACT_SETTINGS);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.layoutMode).toBe("vertical");
    expect(result.data.density).toBe("compact");
    expect(result.data.gaugeStyle).toBe("bar");
    expect(result.data.opacity).toBe(90);
    expect(result.data.alwaysOnTop).toBe(true);
    expect(result.data.accentColor).toBe("cyan");
    expect(result.data.showTitleBar).toBe(true);
    expect(result.data.pinned).toBe(true);
    expect(result.data.clickThrough).toBe(false);
  });

  it("includes all 9 core spec IDs in the default configuration", () => {
    const expectedSpecs: CompactSpecId[] = [
      "cpu",
      "memory",
      "gpu",
      "network",
      "disk",
      "security",
      "battery",
      "processes",
      "system",
    ];

    for (const spec of expectedSpecs) {
      expect(DEFAULT_COMPACT_SETTINGS.specs[spec]).toBeDefined();
      expect(typeof DEFAULT_COMPACT_SETTINGS.specs[spec].enabled).toBe("boolean");
      expect(typeof DEFAULT_COMPACT_SETTINGS.specs[spec].order).toBe("number");
    }
  });

  it("validates spec ID schema values", () => {
    expect(CompactSpecIdSchema.safeParse("cpu").success).toBe(true);
    expect(CompactSpecIdSchema.safeParse("memory").success).toBe(true);
    expect(CompactSpecIdSchema.safeParse("network").success).toBe(true);
    expect(CompactSpecIdSchema.safeParse("invalid-metric").success).toBe(false);
  });

  it("validates layout mode enum", () => {
    expect(CompactLayoutModeSchema.safeParse("vertical").success).toBe(true);
    expect(CompactLayoutModeSchema.safeParse("horizontal").success).toBe(true);
    expect(CompactLayoutModeSchema.safeParse("grid").success).toBe(true);
    expect(CompactLayoutModeSchema.safeParse("diagonal").success).toBe(false);
  });

  it("validates display density options", () => {
    expect(CompactDisplayDensitySchema.safeParse("ultra-compact").success).toBe(true);
    expect(CompactDisplayDensitySchema.safeParse("compact").success).toBe(true);
    expect(CompactDisplayDensitySchema.safeParse("detailed").success).toBe(true);
    expect(CompactDisplayDensitySchema.safeParse("huge").success).toBe(false);
  });

  it("validates visual gauge styles", () => {
    expect(CompactVisualGaugeSchema.safeParse("bar").success).toBe(true);
    expect(CompactVisualGaugeSchema.safeParse("sparkline").success).toBe(true);
    expect(CompactVisualGaugeSchema.safeParse("gauge").success).toBe(true);
    expect(CompactVisualGaugeSchema.safeParse("minimal").success).toBe(true);
    expect(CompactVisualGaugeSchema.safeParse("pie").success).toBe(false);
  });

  it("validates accent color options", () => {
    expect(CompactAccentColorSchema.safeParse("cyan").success).toBe(true);
    expect(CompactAccentColorSchema.safeParse("emerald").success).toBe(true);
    expect(CompactAccentColorSchema.safeParse("purple").success).toBe(true);
    expect(CompactAccentColorSchema.safeParse("blue").success).toBe(true);
    expect(CompactAccentColorSchema.safeParse("amber").success).toBe(true);
    expect(CompactAccentColorSchema.safeParse("rose").success).toBe(true);
    expect(CompactAccentColorSchema.safeParse("neon-green").success).toBe(false);
  });

  it("enforces opacity range (min 30, max 100)", () => {
    expect(CompactSettingsSchema.safeParse({ opacity: 50 }).success).toBe(true);
    expect(CompactSettingsSchema.safeParse({ opacity: 100 }).success).toBe(true);
    expect(CompactSettingsSchema.safeParse({ opacity: 30 }).success).toBe(true);
    expect(CompactSettingsSchema.safeParse({ opacity: 15 }).success).toBe(false);
    expect(CompactSettingsSchema.safeParse({ opacity: 105 }).success).toBe(false);
  });

  it("allows custom overrides of spec toggles and configurations", () => {
    const custom = CompactSettingsSchema.parse({
      layoutMode: "horizontal",
      density: "ultra-compact",
      gaugeStyle: "sparkline",
      opacity: 80,
      alwaysOnTop: false,
      accentColor: "emerald",
      specs: {
        cpu: { enabled: true, order: 1, showSparkline: true },
        memory: { enabled: false, order: 2, showSparkline: false },
      },
    });

    expect(custom.layoutMode).toBe("horizontal");
    expect(custom.density).toBe("ultra-compact");
    expect(custom.gaugeStyle).toBe("sparkline");
    expect(custom.opacity).toBe(80);
    expect(custom.alwaysOnTop).toBe(false);
    expect(custom.accentColor).toBe("emerald");
    expect(custom.specs.cpu.enabled).toBe(true);
    expect(custom.specs.memory.enabled).toBe(false);
  });
});

describe("Compact HUD IPC Channels", () => {
  it("defines standard IPC channel constants for always-on-top window management", () => {
    expect(IPC_CHANNELS.COMPACT_WINDOW_OPEN).toBe("sentinel:compact:open");
    expect(IPC_CHANNELS.COMPACT_WINDOW_CLOSE).toBe("sentinel:compact:close");
    expect(IPC_CHANNELS.COMPACT_WINDOW_TOGGLE).toBe("sentinel:compact:toggle");
    expect(IPC_CHANNELS.COMPACT_WINDOW_IS_OPEN).toBe("sentinel:compact:is-open");
    expect(IPC_CHANNELS.COMPACT_WINDOW_SET_ALWAYS_ON_TOP).toBe("sentinel:compact:set-always-on-top");
    expect(IPC_CHANNELS.COMPACT_WINDOW_GET_ALWAYS_ON_TOP).toBe("sentinel:compact:get-always-on-top");
    expect(IPC_CHANNELS.COMPACT_WINDOW_SET_CLICK_THROUGH).toBe("sentinel:compact:set-click-through");
    expect(IPC_CHANNELS.WINDOW_RESTORE_MAIN).toBe("sentinel:window:restore-main");
    expect(IPC_CHANNELS.THEME_GET).toBe("sentinel:theme:get");
    expect(IPC_CHANNELS.THEME_SET).toBe("sentinel:theme:set");
    expect(IPC_CHANNELS.THEME_STREAM).toBe("sentinel:theme:stream");
  });
});

