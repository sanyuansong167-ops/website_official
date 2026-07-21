import { expect, test } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

const mockApiUrl = "http://127.0.0.1:6124";
const mockAppUrl = "http://127.0.0.1:6123";
let appProcess: ChildProcess | undefined;
let apiProcess: ChildProcess | undefined;

test.beforeAll(async () => {
  const nextMode = existsSync(".next/BUILD_ID") ? "start" : "dev";
  apiProcess = spawn(process.execPath, ["tests/e2e/support/mock-portal-api.mjs"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  appProcess = spawn(process.execPath, [
    "node_modules/next/dist/bin/next",
    nextMode,
    "--hostname",
    "127.0.0.1",
    "--port",
    "6123",
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_ADMIN_API_BASE_URL: mockApiUrl,
      NEXT_PUBLIC_PORTAL_API_BASE_URL: mockApiUrl,
    },
    stdio: "ignore",
  });

  await Promise.all([
    waitForServer(`${mockApiUrl}/__health`),
    waitForServer(mockAppUrl),
  ]);
});

test.afterAll(async () => {
  await Promise.all([stopServer(appProcess), stopServer(apiProcess)]);
});

test.beforeEach(async ({ page, request }) => {
  await request.get(`${mockApiUrl}/__control?page=ready`);
  await mockCdnImages(page);
});

test("首页在桌面端保持受控渲染并通过视觉回归", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/");
  await waitForHomepage(page);

  await expect(page.locator('[data-render-mode="portal"]')).toBeVisible();
  await expect(page.locator("[data-block-id]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "让组织拥有持续进化的数字智能能力" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "从数字化到智能化" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "从一次交流开始" })).toBeVisible();
  await expect(page.locator("img:not([alt])")).toHaveCount(0);
  await prepareVisualCapture(page);
  await expect(page).toHaveScreenshot("homepage-desktop.png", { fullPage: true });
});

test("企业实力页通过已发布 Schema 渲染荣誉、客户和实力指标", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/strength");

  await expect(page.locator('[data-render-mode="portal"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "十余年的行业积累，是持续创新的基础" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "资质与荣誉" })).toBeVisible();
  await expect(page.getByRole("heading", { exact: true, name: "服务客户" })).toBeVisible();
  await expect(page.getByRole("img", { name: "能源行业客户" })).toBeVisible();
  await expect(page.getByText("100+")).toBeVisible();
  await expect(page.locator("[data-block-id]")).toHaveCount(0);
});

test("AI 战略页渲染已发布卡片，并安全传递合作方向上下文", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/ai-strategy");

  await expect(page.locator('[data-render-mode="portal"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "让 AI 能力可靠地进入业务现场" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "企业知识库" })).toBeVisible();
  await expect(page.getByText("Knowledge")).toBeVisible();
  const contactLink = page.getByRole("link", { name: "与 AI 专家交流" });
  await expect(contactLink).toHaveAttribute("href", /\/contact\?direction=/);
  await expect(contactLink).not.toHaveAttribute("href", /name=|email=|phone=/);
  await expect(page.locator("[data-block-id]")).toHaveCount(0);
});

test("核心能力页按已发布顺序展示分类和非交互子项", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/capabilities");

  await expect(page.locator('[data-render-mode="portal"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "把数据能力转化为可持续的业务竞争力" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "企业经营管理能力" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "数据智能平台能力" })).toBeVisible();
  await expect(page.getByText("数据治理")).toBeVisible();
  await expect(page.getByRole("link", { name: "数据治理" })).toHaveCount(0);
  await expect(page.locator("[data-block-id]")).toHaveCount(0);
});

test("产品矩阵页展示已发布产品，并提供详情与 404 展示壳", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/products");

  await expect(page.getByRole("heading", { level: 1, name: "可组合、可持续演进的数据智能产品" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "数据治理平台" })).toBeVisible();
  await expect(page.getByText("已发布", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "查看详情" }).first().click();
  await expect(page).toHaveURL(/\/products\/1$/);
  await expect(page.getByRole("heading", { level: 1, name: "数据治理平台" })).toBeVisible();
  await expect(page.getByRole("link", { name: "返回产品矩阵" })).toHaveAttribute("href", "/products");

  await page.goto("/products/999");
  await expect(page.getByRole("heading", { level: 1, name: "页面不存在或已下线" })).toBeVisible();
});

test("首页移动端无横向溢出且菜单支持键盘关闭", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");
  await waitForHomepage(page);

  const menuButton = page.locator('button[aria-controls="mobile-navigation"]');
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "移动端主导航" })).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "移动端主导航" })).toHaveCount(0);
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  expect(await menuButton.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await prepareVisualCapture(page);
  await expect(page).toHaveScreenshot("homepage-mobile.png", { fullPage: true });
});

test("首页主要导航具备可见的键盘焦点", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/");
  await waitForHomepage(page);

  await page.keyboard.press("Tab");
  const brand = page.getByRole("link", { name: "云台数据首页" });
  await expect(brand).toBeFocused();
  expect(await brand.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "首页" })).toBeFocused();
});

test("媒体失败和 Portal 网络失败均提供安全降级", async ({ page, request }) => {
  await page.route("https://cdn.example.com/team.svg", (route) => route.abort());
  await page.goto("/");
  await waitForHomepage(page);
  await expect(page.getByRole("img", { name: "云台数据团队进行方案研讨（图片暂不可用）" })).toBeVisible();

  await request.get(`${mockApiUrl}/__control?page=error`);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "官网内容暂时不可用" })).toBeVisible();
  await expect(page.getByText("请稍后刷新页面重试。")).toBeVisible();
  await expect(page.locator('[data-render-mode="portal"]')).toHaveCount(0);
});

test("industry solution page links to its public detail shell and handles not found", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/solutions");

  await expect(page.locator('[data-render-mode="portal"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "让数据智能贴近每一个行业的真实问题" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "能源行业解决方案" })).toBeVisible();
  await expect(page.getByText("央企", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "查看详情" }).first().click();
  await expect(page).toHaveURL(/\/solutions\/11$/);
  await expect(page.getByRole("heading", { level: 1, name: "能源行业解决方案" })).toBeVisible();
  await expect(page.getByRole("link", { name: "返回解决方案" })).toHaveAttribute("href", "/solutions");

  await page.goto("/solutions/999");
  await expect(page.getByRole("heading", { level: 1, name: "页面不存在或已下线" })).toBeVisible();
  await expect(page.locator("[data-block-id]")).toHaveCount(0);
});

test("footer legal links render configured published route paths", async ({ page }) => {
  await page.goto("/");

  const legalNavigation = page.getByRole("navigation", { name: "页脚法务信息" });
  await expect(legalNavigation.getByRole("link", { name: "隐私政策" })).toHaveAttribute("href", "/legal/privacy");
  await expect(legalNavigation.getByRole("link", { name: "服务条款" })).toHaveAttribute("href", "/legal/terms");
  await expect(legalNavigation.getByRole("link", { name: "鄂ICP备00000000号" })).toHaveAttribute("href", "https://beian.miit.gov.cn");

  await legalNavigation.getByRole("link", { name: "隐私政策" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "隐私政策" })).toBeVisible();
});

test("case page links published cases to a public detail shell and handles not found", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/cases");

  await expect(page.getByRole("heading", { level: 1, name: "以真实业务成果验证数据智能的价值" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "大型制造集团数据智能实践" })).toBeVisible();
  await expect(page.getByText("制造业", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "查看详情" }).first().click();
  await expect(page).toHaveURL(/\/cases\/21$/);
  await expect(page.getByRole("heading", { level: 1, name: "大型制造集团数据智能实践" })).toBeVisible();
  await expect(page.getByText("大型制造集团", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "项目成果" })).toBeVisible();
  await expect(page.getByRole("link", { name: "返回客户案例" })).toHaveAttribute("href", "/cases");

  await page.goto("/cases/999");
  await expect(page.getByRole("heading", { level: 1, name: "页面不存在或已下线" })).toBeVisible();
});

test("about page renders published research, partners, timeline and values in server order", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/about");

  await expect(page.locator('[data-render-mode="portal"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "以数据智能，让组织持续进化" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "合作高校与科研伙伴" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "重点研发方向" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "发展历程" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "我们的价值观与承诺" })).toBeVisible();
  await expect(page.getByRole("list", { name: "发展历程" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.locator("[data-block-id]")).toHaveCount(0);
});

test("main navigation exposes all nine published top-level routes and contact remains public-only", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "主导航" });
  const expectedRoutes = [
    ["首页", "/"],
    ["企业实力", "/strength"],
    ["AI 战略", "/ai-strategy"],
    ["核心能力", "/capabilities"],
    ["产品矩阵", "/products"],
    ["解决方案", "/solutions"],
    ["标杆案例", "/cases"],
    ["关于我们", "/about"],
    ["联系我们", "/contact"],
  ] as const;

  for (const [name, href] of expectedRoutes) {
    await expect(navigation.getByRole("link", { name })).toHaveAttribute("href", href);
  }

  await page.goto("/contact?direction=数据治理");
  await expect(page.getByRole("heading", { level: 1, name: "让数据能力更贴近您的业务" })).toBeVisible();
  await expect(page.getByLabel("联系信息").getByText("027-8888 8888", { exact: true })).toBeVisible();
  await expect(page.locator("[data-block-id]")).toHaveCount(0);
});

test("about and contact stay responsive on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });

  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: "以数据智能，让组织持续进化" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1, name: "让数据能力更贴近您的业务" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

async function waitForHomepage(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { level: 1, name: "让组织拥有持续进化的数字智能能力" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
}

async function prepareVisualCapture(page: import("@playwright/test").Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += window.innerHeight) {
      window.scrollTo({ behavior: "instant", top });
      await new Promise((resolve) => setTimeout(resolve, 75));
    }
    window.scrollTo({ behavior: "instant", top: 0 });
  });
  await expect.poll(() => page.locator("img").evaluateAll((images) =>
    images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
  ), { timeout: 10_000 }).toBe(true);
  await page.getByLabel(/Next\.js Dev Tools/).evaluateAll((buttons) => {
    buttons.forEach((button) => button.setAttribute("hidden", ""));
  });
}

async function mockCdnImages(page: import("@playwright/test").Page) {
  await page.route("https://cdn.example.com/**", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1)?.replace(".svg", "") ?? "media";
    const label = escapeXml(name.replaceAll("-", " "));
    const image = name === "logo"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100"><rect width="100" height="100" rx="20" fill="#2f63e9"/><text x="50" y="65" text-anchor="middle" fill="white" font-size="42" font-family="Arial">云</text><text x="122" y="62" fill="#10213f" font-size="38" font-family="Arial">云台数据</text></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" rx="32" fill="#e9f2ff"/><circle cx="480" cy="230" r="120" fill="#2f63e9" opacity="0.14"/><rect x="380" y="130" width="200" height="200" rx="40" fill="#2f63e9"/><text x="480" y="245" text-anchor="middle" fill="white" font-size="34" font-family="Arial">YUNTAI</text><text x="480" y="390" text-anchor="middle" fill="#1f4fca" font-size="28" font-family="Arial">${label}</text></svg>`;
    await route.fulfill({
      body: image,
      contentType: "image/svg+xml",
      status: 200,
    });
  });
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "\"": "&quot;",
    "&": "&amp;",
    "'": "&apos;",
    "<": "&lt;",
    ">": "&gt;",
  })[character] ?? character);
}

async function waitForServer(url: string) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

function stopServer(child: ChildProcess | undefined) {
  if (!child || child.exitCode !== null) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const forceTimer = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 3_000);
    child.once("exit", () => {
      clearTimeout(forceTimer);
      resolve();
    });
    child.kill("SIGTERM");
  });
}
