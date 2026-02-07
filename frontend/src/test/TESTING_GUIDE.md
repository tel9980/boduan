# 前端测试指南

## 测试框架

本项目使用 **Vitest** + **React Testing Library** 进行单元测试。

### 为什么选择 Vitest？

- 与 Vite 完美集成
- 支持 TypeScript 开箱即用
- 快速的测试执行
- 与 Jest 兼容的 API

## 目录结构

```
frontend/
├── src/
│   ├── hooks/
│   │   ├── __tests__/          # hooks 测试
│   │   │   ├── useFilterConfig.test.ts
│   │   │   ├── useUIState.test.ts
│   │   │   └── useDisplayState.test.ts
│   │   └── ...
│   ├── test/
│   │   └── setup.ts            # 测试设置
│   └── ...
├── vite.config.ts              # 包含测试配置
└── package.json
```

## 运行测试

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 运行所有测试（监视模式）
npm test

# 运行所有测试（一次性）
npm run test:run

# 运行测试并查看覆盖率
npm run test:coverage

# 运行测试 UI（可视化界面）
npm run test:ui
```

## 编写测试

### Hook 测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilterConfig } from '../useFilterConfig'

describe('useFilterConfig', () => {
  it('应该使用默认配置初始化', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    expect(result.current.filterConfig.changeMin).toBe(-2)
    expect(result.current.filterConfig.changeMax).toBe(5)
  })

  it('应该能更新配置', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setChangeMin(-5)
    })
    
    expect(result.current.filterConfig.changeMin).toBe(-5)
  })
})
```

### 常用测试方法

#### renderHook
用于测试自定义 hooks。

```typescript
const { result, rerender, unmount } = renderHook(() => useMyHook())
```

#### act
用于包裹会触发状态更新的操作。

```typescript
act(() => {
  result.current.setSomeValue('new value')
})
```

#### 断言

```typescript
// 基本断言
expect(value).toBe(expected)
expect(value).toEqual(expected)  // 深度比较
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeDefined()

// 数组/对象
expect(array).toContain(item)
expect(array).toHaveLength(3)
expect(object).toHaveProperty('key', value)

// 异步
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()
```

## 模拟（Mocking）

### 模拟模块

```typescript
import { vi } from 'vitest'

vi.mock('../../utils/localStorage', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}))
```

### 模拟函数

```typescript
const mockFn = vi.fn()
mockFn.mockReturnValue('mocked value')
mockFn.mockResolvedValue({ data: [] })

// 验证调用
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith(arg1, arg2)
expect(mockFn).toHaveBeenCalledTimes(2)
```

### 清除模拟

```typescript
afterEach(() => {
  vi.clearAllMocks()
})
```

## 测试最佳实践

### 1. 测试描述要清晰

```typescript
// ✅ 好的描述
describe('useFilterConfig', () => {
  it('应该使用默认配置初始化', () => { ... })
  it('应该能更新 changeMin', () => { ... })
  it('应该能重置配置', () => { ... })
})

// ❌ 不好的描述
describe('hook test', () => {
  it('test 1', () => { ... })
  it('test 2', () => { ... })
})
```

### 2. 一个测试只验证一个概念

```typescript
// ✅ 好的测试
it('应该能更新 changeMin', () => {
  const { result } = renderHook(() => useFilterConfig())
  
  act(() => {
    result.current.setChangeMin(-5)
  })
  
  expect(result.current.filterConfig.changeMin).toBe(-5)
})

// ❌ 不好的测试（验证太多）
it('应该能更新所有配置', () => {
  const { result } = renderHook(() => useFilterConfig())
  
  act(() => {
    result.current.setChangeMin(-5)
    result.current.setChangeMax(10)
    result.current.setVolumeRatioMin(2)
    // ... 更多
  })
  
  // 一堆断言
})
```

### 3. 使用 describe 分组

```typescript
describe('useDisplayState', () => {
  describe('面板控制', () => {
    it('应该能打开和关闭自选股面板', () => { ... })
    it('应该能打开和关闭历史记录面板', () => { ... })
  })
  
  describe('对话框控制', () => {
    it('应该能控制保存预设对话框', () => { ... })
  })
})
```

### 4. 每个测试应该是独立的

```typescript
// ✅ 好的做法：在每个测试前重置状态
beforeEach(() => {
  vi.clearAllMocks()
})

// ❌ 不好的做法：测试之间共享状态
let sharedValue = 0

it('test 1', () => {
  sharedValue = 1
})

it('test 2', () => {
  // 依赖 sharedValue
  expect(sharedValue).toBe(0) // 可能会失败
})
```

## 覆盖率报告

运行 `npm run test:coverage` 会生成覆盖率报告：

```
Coverage report:
------------|---------|----------|---------|---------|-------------------
File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------|---------|----------|---------|---------|-------------------
All files   |   85.71 |      100 |   66.66 |   85.71 |                   
 hooks      |   85.71 |      100 |   66.66 |   85.71 |                   
  index.ts  |     100 |      100 |     100 |     100 |                   
  ...       |   82.35 |      100 |   57.14 |   82.35 | 45-50             
------------|---------|----------|---------|---------|-------------------
```

**覆盖率指标说明：**
- **Statements**: 语句覆盖率
- **Branch**: 分支覆盖率（if/else, switch等）
- **Functions**: 函数覆盖率
- **Lines**: 行覆盖率

**建议覆盖率目标：**
- Statements: > 80%
- Branch: > 70%
- Functions: > 80%
- Lines: > 80%

## 调试测试

### 使用 console.log

```typescript
it('should work', () => {
  const { result } = renderHook(() => useMyHook())
  console.log('current state:', result.current)
})
```

### 使用断点

在 VS Code 中，在测试代码行左侧点击设置断点，然后运行调试配置。

### 只运行特定测试

```typescript
// 只运行这个测试
it.only('specific test', () => { ... })

// 跳过这个测试
it.skip('skipped test', () => { ... })

// 在命令行中运行特定文件
npm test -- useFilterConfig
```

## 常见问题

### 1. "act" 警告

如果在测试中收到 "act" 警告，确保用 `act` 包裹状态更新：

```typescript
act(() => {
  result.current.setValue('new value')
})
```

### 2. 异步操作超时

如果测试超时，增加超时时间：

```typescript
it('async test', async () => {
  // 异步操作
}, 10000) // 10秒超时
```

### 3. 模拟未生效

确保在测试文件的顶部导入被模拟的模块：

```typescript
import { vi } from 'vitest'

// 模拟必须在导入实际模块之前
vi.mock('./module', () => ({
  someFunction: vi.fn()
}))

// 然后导入实际模块
import { someFunction } from './module'
```

## 下一步

1. **添加更多测试**
   - 为 `useStockScreening` 添加测试（需要模拟 API 调用）
   - 为工具函数添加测试
   - 为组件添加测试

2. **集成到 CI/CD**
   ```yaml
   # 在 GitHub Actions 中添加
   - name: Run tests
     run: |
       cd frontend
       npm test -- --run
   ```

3. **提高覆盖率**
   - 识别未覆盖的代码
   - 添加针对性测试

4. **快照测试**
   - 对于 UI 组件，考虑添加快照测试

5. **E2E 测试**
   - 考虑使用 Playwright 或 Cypress 添加端到端测试
