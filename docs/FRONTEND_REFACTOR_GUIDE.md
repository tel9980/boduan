# 前端架构重构指南

## 背景

`App.tsx` 目前有 **3,786 行**，包含几十个 `useState`，状态管理混乱，难以维护。

## 解决方案

已将状态拆分为 4 个独立的自定义 Hooks：

### 1. useFilterConfig - 筛选配置管理

**用途**: 管理所有筛选相关的配置状态

**状态**:
- `filterConfig` - 完整的筛选配置对象
- 单独的 setter 函数（如 `setChangeMin`, `setChangeMax` 等）

**使用示例**:
```typescript
import { useFilterConfig } from './hooks';

function App() {
  const {
    filterConfig,
    setFilterConfig,
    setChangeMin,
    setChangeMax,
    setVolumeRatioMin,
    resetFilterConfig,
  } = useFilterConfig();

  // 使用
  const handleChangeMin = (value: number) => {
    setChangeMin(value);
  };

  return (
    <FilterPanel
      config={filterConfig}
      onChangeMinChange={setChangeMin}
    />
  );
}
```

### 2. useUIState - UI 状态管理

**用途**: 管理主题、字体、表格密度等 UI 相关状态

**状态**:
- `theme` - 主题（light/dark）
- `fontSize` - 字体大小
- `tableDensity` - 表格密度
- `cacheExpiry` - 缓存过期时间
- `showSettings` - 是否显示设置面板

**使用示例**:
```typescript
import { useUIState } from './hooks';

function App() {
  const {
    theme,
    toggleThemeMode,
    fontSize,
    setFontSize,
    showSettings,
    setShowSettings,
  } = useUIState();

  return (
    <button onClick={toggleThemeMode}>
      切换主题 (当前: {theme})
    </button>
  );
}
```

### 3. useDisplayState - 显示状态管理

**用途**: 管理各种面板、对话框的显示状态

**状态**:
- `showFavorites` - 自选股面板
- `showHistory` - 历史记录面板
- `showComparison` - 对比模式
- `showAlertCenter` - 提醒中心
- `showPortfolio` - 持仓追踪
- `showAddAlert` - 添加提醒对话框
- `showAddPosition` - 添加持仓对话框
- `editingPosition` - 正在编辑的持仓

**使用示例**:
```typescript
import { useDisplayState } from './hooks';

function App() {
  const {
    showFavorites,
    setShowFavorites,
    showAlertCenter,
    showAddAlert,
    setShowAddAlert,
    closeAllPanels,  // 一键关闭所有面板
    togglePanel,     // 切换面板（互斥）
  } = useDisplayState();

  // 打开自选股面板
  const openFavorites = () => {
    togglePanel('favorites');
  };

  return (
    <>
      <button onClick={openFavorites}>自选股</button>
      {showFavorites && <FavoritesPanel />}
    </>
  );
}
```

### 4. useStockScreening - 股票筛选逻辑

**用途**: 管理筛选过程、结果、错误等状态

**状态**:
- `state` - 当前状态（idle/screening/screened/filtering/filtered）
- `error` - 错误信息
- `progress` - 进度提示
- `screenedStocks` - 筛选结果
- `marketEnv` - 市场环境
- `finalPick` - 精选股票
- `finalPicks` - 精选候选列表

**使用示例**:
```typescript
import { useStockScreening } from './hooks';

function App() {
  const {
    state,
    error,
    progress,
    screenedStocks,
    marketEnv,
    finalPicks,
    handleScreen,
    clearResults,
  } = useStockScreening({ cacheExpiry: 5 });

  // 执行筛选
  const onScreenClick = () => {
    handleScreen(filterConfig);
  };

  return (
    <div>
      {state === 'screening' && <LoadingSpinner message={progress} />}
      {state === 'screened' && <StockList stocks={screenedStocks} />}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
```

## 重构 App.tsx 的步骤

### 步骤 1: 替换筛选配置状态

**重构前**:
```typescript
const [filterConfig, setFilterConfig] = useState<FilterConfig>({
  changeMin: -2,
  changeMax: 5,
  // ...
});
const setChangeMin = (val: number) => setFilterConfigValue('changeMin', val);
```

**重构后**:
```typescript
import { useFilterConfig } from './hooks';

const {
  filterConfig,
  setChangeMin,
  setChangeMax,
  // ...
} = useFilterConfig();
```

### 步骤 2: 替换 UI 状态

**重构前**:
```typescript
const [theme, setTheme] = useState<'light' | 'dark'>(getSettings().theme);
const [fontSize, setFontSize] = useState(getSettings().fontSize);
```

**重构后**:
```typescript
import { useUIState } from './hooks';

const {
  theme,
  toggleThemeMode,
  fontSize,
  setFontSize,
  // ...
} = useUIState();
```

### 步骤 3: 替换显示状态

**重构前**:
```typescript
const [showFavorites, setShowFavorites] = useState(false);
const [showHistory, setShowHistory] = useState(false);
const [showComparison, setShowComparison] = useState(false);
// ... 十几个状态
```

**重构后**:
```typescript
import { useDisplayState } from './hooks';

const {
  showFavorites,
  showHistory,
  showComparison,
  setShowFavorites,
  closeAllPanels,
  togglePanel,
  // ...
} = useDisplayState();
```

### 步骤 4: 替换筛选逻辑

**重构前**:
```typescript
const [state, setState] = useState<AppState>('idle');
const [screenedStocks, setScreenedStocks] = useState<ScreenedStock[]>([]);
const [error, setError] = useState<string | null>(null);
const [marketEnv, setMarketEnv] = useState<MarketEnvironment | null>(null);

const handleScreen = async () => {
  setState('screening');
  // ... 复杂的筛选逻辑
};
```

**重构后**:
```typescript
import { useStockScreening } from './hooks';

const {
  state,
  screenedStocks,
  error,
  marketEnv,
  handleScreen,
} = useStockScreening({ cacheExpiry });

// 直接调用 handleScreen(filterConfig)
```

## 完整重构示例

```typescript
import { useFilterConfig, useUIState, useDisplayState, useStockScreening } from './hooks';

function App() {
  // 使用新的 hooks
  const filter = useFilterConfig();
  const ui = useUIState();
  const display = useDisplayState();
  const screening = useStockScreening({ cacheExpiry: ui.cacheExpiry });

  // 简化的渲染逻辑
  return (
    <div className={`app theme-${ui.theme}`}>
      <FilterPanel
        config={filter.filterConfig}
        onChangeMinChange={filter.setChangeMin}
        onChangeMaxChange={filter.setChangeMax}
        // ...
      />
      
      <button onClick={() => screening.handleScreen(filter.filterConfig)}>
        开始筛选
      </button>
      
      {screening.state === 'screening' && (
        <LoadingSpinner message={screening.progress} />
      )}
      
      {screening.state === 'screened' && (
        <StockList stocks={screening.screenedStocks} />
      )}
      
      {display.showFavorites && <FavoritesPanel />}
      {display.showPortfolio && <PortfolioTracker />}
    </div>
  );
}
```

## 优势

1. **代码量减少**: App.tsx 从 3,786 行减少到约 500-800 行
2. **职责分离**: 每个 hook 只负责一类状态
3. **可测试性**: 可以单独测试每个 hook
4. **可复用性**: hooks 可以在其他组件中使用
5. **类型安全**: 完整的 TypeScript 类型支持

## 注意事项

1. **渐进式重构**: 不要一次性替换所有状态，先替换一部分，测试通过后再继续
2. **保持兼容性**: 确保重构后 API 调用和组件 props 不变
3. **测试验证**: 每次修改后运行测试，确保功能正常

## 下一步建议

1. 先在一个小分支上尝试重构
2. 逐个 hook 替换，每次替换后测试
3. 确保所有功能正常后再合并到主分支
4. 考虑使用状态管理库（如 Zustand）进一步优化
