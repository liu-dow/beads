# 珠序 · Bead Atelier

珠序是面向真实客户的珠饰设计工作台。用户可以先以游客身份在当前浏览器创作，也可以使用邮箱账户登录并跨设备同步；Google 登录入口会在 OAuth 配置完成后启用。账户作品、制作进度和导出统计保存在 Supabase Postgres 中，并通过行级安全策略按账户隔离。

## 本地运行

要求 Node.js `>=22.13.0`。

1. 复制 `.env.example` 为 `.dev.vars`。
2. 填写 Supabase 项目 URL 和 publishable key。不要使用 secret 或 service-role key。
3. 运行 `npm run dev`。

本地页面：

- 游客及账户工作台：`http://localhost:5173/studio`
- 登录与注册：`http://localhost:5173/login`
- 品牌首页：`http://localhost:5173/`

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
APP_ORIGIN=http://localhost:5173
GOOGLE_AUTH_ENABLED=false
```

本地环境可以省略 `APP_ORIGIN`，应用会使用当前 localhost 来源。生产环境必须设置为网站的规范来源。

## 账户配置

游客作品和制作进度保存在浏览器 `localStorage` 中，不会写入客户数据库；清除浏览器数据会删除这些本地记录。

邮箱注册、登录、邮箱验证、忘记密码和重置密码由 Supabase Auth 提供。面向客户发送邮件前，需要在 Supabase Dashboard 配置自有 SMTP，并将下列地址加入 Auth URL allow list：

- `https://your-domain.example/auth/callback`
- 本地开发使用的 `http://localhost:5173/auth/callback`

启用 Google 登录时，在 Google Cloud 创建 Web OAuth 客户端，将 Supabase 提供的 callback URL 填入 Google 的 authorized redirect URI，再把客户端 ID 和密钥配置到 Supabase Auth。完成后设置 `GOOGLE_AUTH_ENABLED=true`，页面才会显示 Google 登录按钮。

## 数据库与权限

数据库迁移位于 `supabase/migrations/`。迁移创建 `designs`、`making_progress` 和 `exports`，所有客户表都启用 RLS。应用只使用 publishable key，并通过服务端路由验证当前用户；浏览器不能提交或改写 `owner_id`。

创建迁移：

```sh
npm run db:migration:new -- migration_name
```

数据库隔离测试使用 PGlite 执行实际迁移：

```sh
npm run db:test
```

## 验证与构建

```sh
npm run lint
npm test
```

`npm test` 会先生成 Cloudflare Sites 构建产物，再运行账户 API、数据库 RLS、设计操作和界面组件测试。部署环境需要设置与 `.env.example` 相同的四个运行时变量。
