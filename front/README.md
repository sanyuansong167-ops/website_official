This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 联调状态

截至 2026-07-16，阶段一与阶段二各自尚未完成的真实后端联调，将安排在同一个后续联调窗口集中执行。当前阶段二的本地 Mock Portal E2E 已通过，但它不替代真实环境验收。

- 缺少真实 `NEXT_PUBLIC_PORTAL_API_BASE_URL` 与 `NEXT_PUBLIC_ADMIN_API_BASE_URL`。
- 缺少两个独立管理员的安全登录态（测试中以 Playwright storage state 提供，不在仓库记录账号或密码）。
- 缺少可用于回归的首页测试数据、编辑锁状态，以及允许发布/回滚测试的隔离页面。

因此可以进入阶段三的前端开发；但阶段一和阶段二都不能标记为真实联调完成，项目最终验收或发布前必须分别完成各自的真实环境 E2E 验收。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
