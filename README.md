# AI Work Control Center

企业级 AI 工作中控后台 - 控制平面骨架。

## 技术栈

- React 18 + TypeScript
- Vite 6
- React Router 6

## 本地运行

```bash
npm install
npm run dev
```

浏览器访问 http://localhost:5173 。

## Phase 1 使用说明

1. **登录**：在登录页下拉选择「平台管理员」或「租户用户」后点击「进入后台」。
2. **平台管理员**：进入 `/platform`，侧边栏为平台工作台、租户管理、平台用户等。
3. **租户用户**：进入 `/tenant`，侧边栏为工作台、项目中心、任务执行等；顶栏显示当前租户「演示租户」。
4. **退出**：点击顶栏「退出」回到登录页。

## 目录结构

- `src/app` - 路由入口
- `src/core` - 身份态、菜单配置、权限守卫、常量与类型
- `src/components` - 通用布局与 UI（Layout、Sidebar、TopBar、PageContainer、EmptyState）
- `src/modules` - 认证、平台壳、租户壳及占位页

## 架构文档

见 `docs/architecture/` 与 `docs/standards/cursor-collaboration-guide.md`。
