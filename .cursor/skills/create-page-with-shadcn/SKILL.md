---
name: create-page-with-shadcn
description: 使用 shadcn/ui + Tailwind CSS 创建符合设计标准的后台页面
---

# Skill: Create Page with shadcn/ui

## 使用场景

创建任何新页面时使用此 Skill，确保页面符合 AWCC Design Token 标准和 shadcn/ui 组件规范。

---

## 技术栈

| 工具 | 用途 |
|------|------|
| Tailwind CSS v4 | 原子化样式 |
| shadcn/ui | UI 组件库（Button、Card、Table、Sheet、Dialog、Badge、Tabs、Input、Select、Checkbox、Switch、Skeleton、Tooltip、Command） |
| Lucide React | 图标（统一使用 Lucide，禁止 emoji） |
| react-hook-form + zod | 表单管理与校验 |
| sonner | Toast 通知 |
| Recharts | 数据图表 |

---

## Design Token 引用

设计标准来源：`src/core/design/design-tokens.json`

### 色彩

```
主色：primary-500 #3b82f6      主色悬停：primary-600 #2563eb
成功：success #22c55e           警告：warning #f59e0b
危险：danger #ef4444             信息：info #3b82f6
正文：foreground #0f172a         次要：muted-foreground #475569
辅助：subtle #94a3b8            边框：border #e2e8f0
卡片底：card #ffffff             内容区底：background #f8fafc
侧边栏底：sidebar-bg #0f1219
```

### 间距

```
页面内衬：px-6 py-6（24px）
区块间距：space-y-6（24px）
卡片内衬：p-5（20px）
表单行间距：space-y-4（16px）
表格行高：h-12（48px）
```

### 圆角

```
按钮/输入框：rounded-md（6px）
卡片：rounded-lg（8px）
Badge：rounded-full（9999px）
弹窗：rounded-xl（12px）
```

### 阴影

```
卡片：shadow-xs（0 1px 2px rgba(0,0,0,0.04)）
弹窗/抽屉：shadow-lg（0 8px 24px rgba(0,0,0,0.12)）
悬停卡片：shadow-sm（0 2px 4px rgba(0,0,0,0.06)）
```

---

## 页面模板

### 列表页结构

```tsx
export default function XxxListPage() {
  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">页面标题</h1>
          <p className="mt-1 text-sm text-muted-foreground">页面说明</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />新建</Button>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex items-center gap-3">
        <Input placeholder="搜索..." className="w-64" />
        <Select>...</Select>
      </div>

      {/* 表格 */}
      <Card>
        <Table>...</Table>
      </Card>

      {/* 分页 */}
      <Pagination />
    </div>
  )
}
```

### 详情工作台结构

```tsx
export default function XxxDetailPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-0">
      {/* 返回条 */}
      <div className="flex items-center gap-2 px-6 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">父级 / 当前页</span>
      </div>

      {/* 摘要条 */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{name}</h1>
            <Badge variant="success">状态</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">编辑</Button>
            <Button variant="destructive" size="sm">删除</Button>
          </div>
        </div>
        <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
          <span>字段1: 值</span>
          <span>字段2: 值</span>
        </div>
      </div>

      {/* Tab 导航 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="px-6 border-b">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>
        <div className="p-6">
          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
```

---

## 表单标准

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, '请输入名称'),
  status: z.enum(['active', 'disabled']),
})

function XxxForm() {
  const form = useForm({ resolver: zodResolver(schema) })

  return (
    <Form {...form}>
      <FormField name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>名称</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </Form>
  )
}
```

---

## 操作反馈

```tsx
import { toast } from 'sonner'

// 成功
toast.success('创建成功')

// 错误
toast.error('删除失败：该资源仍被引用')

// 删除确认
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>确认删除</DialogTitle>
      <DialogDescription>
        确定要删除「{name}」吗？此操作不可撤销。
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">取消</Button>
      <Button variant="destructive">确认删除</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 状态标签映射

```tsx
// Badge variant 对应
const statusVariantMap = {
  active: 'success',
  enabled: 'success',
  completed: 'success',
  draft: 'warning',
  pending: 'warning',
  disabled: 'secondary',
  archived: 'secondary',
  failed: 'destructive',
  error: 'destructive',
}
```

---

## 禁止行为

- 禁止使用 `.module.css` 或 `styled-components`
- 禁止使用 `style={{}}` 内联样式
- 禁止使用 `alert()` / `window.confirm()`
- 禁止使用 emoji 替代 Lucide 图标
- 禁止在组件内硬编码中文（集中到 labels.ts）
- 禁止硬编码色值（引用 design token / Tailwind 变量）
- 禁止 shadow-lg 以上用于非弹窗元素
- 禁止手动 useState 管理复杂表单（用 react-hook-form）

---

## 完成后自检

```
□ 使用 shadcn/ui 组件（Button、Card、Table、Sheet、Dialog、Badge 等）
□ 使用 Tailwind 类名，无 .module.css
□ 图标使用 Lucide React
□ 表单使用 react-hook-form + zod
□ Toast 使用 sonner
□ 色彩引用 design token
□ 页面说明和状态使用中文
□ 空状态使用 EmptyState
□ 删除有 Dialog 二次确认
```
