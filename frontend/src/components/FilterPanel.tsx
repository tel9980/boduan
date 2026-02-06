import React from 'react';

export interface FilterConfig {
  changeMin: number;
  changeMax: number;
  volumeRatioMin: number;
  volumeRatioMax: number;
  marketCapMin: number;
  marketCapMax: number;
  includeKcbCyb: boolean;
  requireMargin: boolean;  // 新增：是否要求融资融券
  preferTailInflow: boolean;
  strictRiskControl: boolean;
  isBandTradingMode: boolean;
}

interface FilterPanelProps {
  config: FilterConfig;
  onConfigChange: (newConfig: Partial<FilterConfig>) => void;
  onScreen: () => void;
  onFilter: () => void;
  onCancel: () => void;
  onShowFinalPick: () => void;
  appState: string; // 'idle' | 'screening' | 'screened' | 'filtering' | 'filtered'
  screenedCount: number;
  filterProgress: string;
  hasFinalPick: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  config,
  onConfigChange,
  onScreen,
  onFilter,
  onCancel,
  onShowFinalPick,
  appState,
  screenedCount,
  filterProgress,
  hasFinalPick
}) => {
  const handleChange = (key: keyof FilterConfig, value: any) => {
    onConfigChange({ [key]: value });
  };

  return (
    <section className="criteria-section">
      <div className="criteria-card screen-criteria">
        <div className="criteria-header">
          <span className="criteria-icon">🔍</span>
          <h3>第一步：初步筛选</h3>
        </div>
        
        <div className="mode-toggle" style={{ marginBottom: '15px', padding: '0 15px' }}>
          <div style={{ display: 'flex', gap: '10px', background: '#f5f5f5', padding: '4px', borderRadius: '6px' }}>
             <button
               onClick={() => {
                 onConfigChange({
                   isBandTradingMode: false,
                   changeMin: 2,
                   changeMax: 6,
                   marketCapMax: 350
                 });
               }}
               style={{
                 flex: 1,
                 padding: '6px',
                 border: 'none',
                 borderRadius: '4px',
                 background: !config.isBandTradingMode ? '#fff' : 'transparent',
                 boxShadow: !config.isBandTradingMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                 cursor: 'pointer',
                 fontWeight: !config.isBandTradingMode ? 'bold' : 'normal',
                 color: !config.isBandTradingMode ? '#1677ff' : '#666'
               }}
             >
               默认模式
             </button>
             <button
               onClick={() => {
                 onConfigChange({
                   isBandTradingMode: true,
                   changeMin: -2,
                   changeMax: 5,
                   marketCapMax: 160
                 });
               }}
               style={{
                 flex: 1,
                 padding: '6px',
                 border: 'none',
                 borderRadius: '4px',
                 background: config.isBandTradingMode ? '#fff' : 'transparent',
                 boxShadow: config.isBandTradingMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                 cursor: 'pointer',
                 fontWeight: config.isBandTradingMode ? 'bold' : 'normal',
                 color: config.isBandTradingMode ? '#1677ff' : '#666'
               }}
             >
               波段交易
             </button>
          </div>
        </div>

        <div className="criteria-list">
          <div className="criteria-item">
            <span className="label">涨幅范围</span>
            <span className="value">
              <input
                type="number"
                className="criteria-input"
                value={config.changeMin}
                onChange={(e) => handleChange('changeMin', Number(e.target.value) || 0)}
                disabled={appState === 'screening' || appState === 'filtering'}
              />
              <span className="divider">%-</span>
              <input
                type="number"
                className="criteria-input"
                value={config.changeMax}
                onChange={(e) => handleChange('changeMax', Number(e.target.value) || 0)}
                disabled={appState === 'screening' || appState === 'filtering'}
              />
              <span className="unit">%</span>
            </span>
          </div>
          <div className="criteria-item">
            <span className="label">量比范围</span>
            <span className="value">
              <input
                type="number"
                step="0.1"
                className="criteria-input"
                value={config.volumeRatioMin}
                onChange={(e) => handleChange('volumeRatioMin', Number(e.target.value) || 0)}
                disabled={appState === 'screening' || appState === 'filtering'}
              />
              <span className="divider">-</span>
              <input
                type="number"
                step="0.1"
                className="criteria-input"
                value={config.volumeRatioMax}
                onChange={(e) => handleChange('volumeRatioMax', Number(e.target.value) || 0)}
                disabled={appState === 'screening' || appState === 'filtering'}
              />
            </span>
          </div>
          <div className="criteria-item">
            <span className="label">流通市值</span>
            <span className="value">
              <input
                type="number"
                className="criteria-input"
                value={config.marketCapMin}
                onChange={(e) => handleChange('marketCapMin', Number(e.target.value) || 0)}
                disabled={appState === 'screening' || appState === 'filtering' || config.isBandTradingMode}
              />
              <span className="divider">-</span>
              <input
                type="number"
                className="criteria-input"
                value={config.marketCapMax}
                onChange={(e) => handleChange('marketCapMax', Number(e.target.value) || 0)}
                disabled={appState === 'screening' || appState === 'filtering'}
              />
              <span className="unit">亿</span>
            </span>
          </div>
          <div className="criteria-item toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={config.includeKcbCyb}
                onChange={(e) => handleChange('includeKcbCyb', e.target.checked)}
                disabled={appState === 'screening' || appState === 'filtering' || config.isBandTradingMode}
              />
              <span className="toggle-text">包含创业板（排除科创板）</span>
            </label>
          </div>
          <div className="criteria-item toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={config.preferTailInflow}
                onChange={(e) => handleChange('preferTailInflow', e.target.checked)}
                disabled={appState === 'screening' || appState === 'filtering' || config.isBandTradingMode}
              />
              <span className="toggle-text">尾盘30分钟主力净流入为正（默认）</span>
            </label>
          </div>
        </div>
        <button
          className={`action-btn screen-btn ${appState === 'screening' ? 'loading' : ''}`}
          onClick={onScreen}
          disabled={appState === 'screening' || appState === 'filtering'}
        >
          {appState === 'screening' ? (
            <>
              <span className="spinner"></span>
              筛选中...
            </>
          ) : (
            <>
              <span className="btn-icon">🎯</span>
              开始筛选
            </>
          )}
        </button>
      </div>

      <div className="criteria-arrow">→</div>

      <div className={`criteria-card filter-criteria ${screenedCount === 0 ? 'disabled' : ''}`}>
        <div className="criteria-header">
          <span className="criteria-icon">⚡</span>
          <h3>第二步：精选过滤</h3>
        </div>
        <div className="criteria-list">
          <div className="criteria-item">
            <span className="label">量价形态</span>
            <span className="value">阶梯式放量</span>
          </div>
          <div className="criteria-item">
            <span className="label">技术位置</span>
            <span className="value">站稳5日线+近期高点</span>
          </div>
          <div className="criteria-item">
            <span className="label">热门板块</span>
            <span className="value">优先数字经济（加分项）</span>
          </div>
          <div className="criteria-item toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={config.strictRiskControl}
                onChange={(e) => handleChange('strictRiskControl', e.target.checked)}
                disabled={appState === 'screening' || appState === 'filtering'}
              />
              <span className="toggle-text">阶段涨幅 + 集中度限制（默认）</span>
            </label>
          </div>
        </div>

        {/* 过滤按钮和取消按钮 */}
        <div className="action-buttons">
          <button
            className={`action-btn filter-btn ${appState === 'filtering' ? 'loading' : ''}`}
            onClick={onFilter}
            disabled={screenedCount === 0 || appState === 'filtering' || appState === 'screening'}
          >
            {appState === 'filtering' ? (
              <>
                <span className="spinner"></span>
                分析中...
              </>
            ) : (
              <>
                <span className="btn-icon">✨</span>
                精选过滤
              </>
            )}
          </button>

          {/* 取消按钮 */}
          {appState === 'filtering' && (
            <button
              className="action-btn cancel-btn"
              onClick={onCancel}
            >
              <span className="btn-icon">⏹</span>
              取消分析
            </button>
          )}

          {/* 最终精选按钮 */}
          {hasFinalPick && appState === 'filtered' && (
            <button
              className="action-btn final-pick-btn"
              onClick={onShowFinalPick}
            >
              <span className="btn-icon">🏆</span>
              最终精选一只标的
            </button>
          )}
        </div>

        {/* 进度提示 */}
        {filterProgress && (
          <div className="progress-tip">
            <span className="progress-icon">⏳</span>
            <span>{filterProgress}</span>
            <span className="progress-note">（预计需要 1-3 分钟，请耐心等待）</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default FilterPanel;
