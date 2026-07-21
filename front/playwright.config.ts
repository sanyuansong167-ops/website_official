import { defineConfig } from "@playwright/test";

const realEnvironmentEnabled = process.env.PLAYWRIGHT_REAL_ENV === "1";
const mockAppUrl = "http://127.0.0.1:6123";

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    },
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  testDir: "./tests/e2e",
  testIgnore: realEnvironmentEnabled ? /homepage\.spec\.ts/ : /editor-boundary\.spec\.ts/,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? (realEnvironmentEnabled ? "http://127.0.0.1:3000" : mockAppUrl),
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    trace: "retain-on-failure",
  },
  workers: 1,
});
