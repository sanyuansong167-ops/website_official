import { expect, test } from "@playwright/test";

const realEnvironmentEnabled = process.env.PLAYWRIGHT_REAL_ENV === "1";
const adminStorageState = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE;
const secondAdminStorageState = process.env.PLAYWRIGHT_SECOND_ADMIN_STORAGE_STATE;
const editorRoutePath = process.env.PLAYWRIGHT_EDITOR_ROUTE_PATH ?? "/";
const emptyDraftRoutePath = process.env.PLAYWRIGHT_EMPTY_DRAFT_ROUTE_PATH;
const lifecycleMutationsEnabled = process.env.PLAYWRIGHT_LIFECYCLE_MUTATIONS === "1";

test.describe("编辑器真实环境生命周期边界", () => {
  test.skip(!realEnvironmentEnabled, "需要设置 PLAYWRIGHT_REAL_ENV=1 并启动真实 Portal/Admin API。 ");

  test("公开 Portal 不暴露编辑器标记", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("[data-block-id]")).toHaveCount(0);
    await expect(page.locator('[data-render-mode="portal"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /保存草稿|预览草稿|强制解锁/ })).toHaveCount(0);
  });

  test("管理员可以进入受保护编辑器并获得可操作状态", async ({ browser }) => {
    test.skip(!adminStorageState, "需要 PLAYWRIGHT_ADMIN_STORAGE_STATE 指向管理员登录态文件。");

    const context = await browser.newContext({ storageState: adminStorageState });
    const page = await context.newPage();
    await page.goto(getEditorUrl(editorRoutePath));

    await expect(page.getByRole("button", { name: "保存草稿" })).toBeVisible();
    await expect(page.getByRole("main", { name: "页面编辑画布" })).toBeVisible();
    await context.close();
  });

  test("管理员可发布首页并从历史版本生成回滚版本", async ({ browser }) => {
    test.skip(
      !adminStorageState || !lifecycleMutationsEnabled,
      "需要管理员登录态和 PLAYWRIGHT_LIFECYCLE_MUTATIONS=1，测试会真实发布并回滚测试页面。",
    );

    const context = await browser.newContext({ storageState: adminStorageState });
    const page = await context.newPage();
    await page.goto(getEditorUrl(editorRoutePath));

    const publishButton = page.getByRole("button", { name: "发布页面" });
    await expect(publishButton).toBeEnabled();
    await publishButton.click();
    await page.getByLabel("发布说明").fill("Playwright 发布链路验证");
    await page.getByRole("button", { name: "确认发布" }).click();
    await expect(page.getByText(/版本 \d+ 已发布/).first()).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "历史版本" }).click();
    const rollbackButtons = page.getByRole("button", { name: "回滚到此版本" });
    await expect.poll(() => rollbackButtons.count()).toBeGreaterThan(1);
    await expect(rollbackButtons.nth(1)).toBeEnabled();
    await rollbackButtons.nth(1).click();
    await page.getByLabel("回滚说明").fill("Playwright 回滚链路验证");
    await page.getByRole("button", { name: "确认回滚" }).click();
    await expect(page.getByText(/已从历史版本 \d+ 生成并发布版本 \d+/).first()).toBeVisible();

    await context.close();
  });

  test("第二名管理员不能同时编辑同一页面", async ({ browser }) => {
    test.skip(
      !adminStorageState || !secondAdminStorageState,
      "需要两份独立管理员登录态文件验证锁冲突。",
    );

    const firstContext = await browser.newContext({ storageState: adminStorageState });
    const secondContext = await browser.newContext({ storageState: secondAdminStorageState });
    const firstPage = await firstContext.newPage();
    const secondPage = await secondContext.newPage();

    await firstPage.goto(getEditorUrl(editorRoutePath));
    await expect(firstPage.getByRole("button", { name: "保存草稿" })).toBeVisible();

    await secondPage.goto(getEditorUrl(editorRoutePath));
    await expect(secondPage.locator('[data-status="warning"]')).toContainText(/正在编辑|锁/);
    await expect(secondPage.getByRole("button", { name: "保存草稿" })).toBeDisabled();

    await secondContext.close();
    await firstContext.close();
  });

  test("空 Schema 草稿进入安全阻断状态", async ({ browser }) => {
    test.skip(
      !adminStorageState || !emptyDraftRoutePath,
      "需要 PLAYWRIGHT_EMPTY_DRAFT_ROUTE_PATH 指向 schemaJson=null 的测试页面。",
    );
    if (!emptyDraftRoutePath) return;

    const context = await browser.newContext({ storageState: adminStorageState });
    const page = await context.newPage();
    await page.goto(getEditorUrl(emptyDraftRoutePath));

    await expect(page.getByRole("heading", { name: "草稿尚未安全初始化" })).toBeVisible();
    await expect(page.getByRole("button", { name: "保存草稿" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "预览草稿" })).toBeDisabled();
    await context.close();
  });
});

function getEditorUrl(routePath: string) {
  return `/admin/editor?${new URLSearchParams({ routePath })}`;
}
