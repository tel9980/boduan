import React from 'react';
import { getPresets, type FilterPreset } from '../utils/localStorage';
import type { FilterConfig } from './FilterPanel';

interface QuickFiltersProps {
  onApplyPreset: (config: Partial<FilterConfig>) => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({ onApplyPreset }) => {
  const presets = getPresets();

  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'aggressive':
        return '🚀';
      case 'conservative':
        return '🛡️';
      case 'balanced':
        return '⚖️';
      default:
        return '📊';
    }
  };

  const getPresetColor = (id: string) => {
    switch (id) {
      case 'aggressive':
        return { bg: '#fff1f0', border: '#ff4d4f', text: '#cf1322' };
      case 'conservative':
        return { bg: '#f6ffed', border: '#52c41a', text: '#389e0d' };
      case 'balanced':
        return { bg: '#e6f7ff', border: '#1890ff', text: '#0050b3' };
      default:
        return { bg: '#fafafa', border: '#d9d9d9', text: '#595959' };
    }
  };

  return (
    <div style={{
      marginBottom: '20px',
      padding: '16px',
      background: '#fafafa',
      borderRadius: '8px',
      border: '1px solid #e8e8e8'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        ⚡ 快捷筛选
        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#999' }}>
          一键应用预设方案
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {presets.map((preset) => {
          const colors = getPresetColor(preset.id);
          return (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.config)}
              style={{
                padding: '12px',
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>{getPresetIcon(preset.id)}</span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: colors.text
                }}>
                  {preset.name}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                lineHeight: '1.5'
              }}>
                {preset.description}
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#999',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <span>涨幅: {preset.config.changeMin}~{preset.config.changeMax}%</span>
                <span>量比: {preset.config.volumeRatioMin}~{preset.config.volumeRatioMax}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#0050b3'
      }}>
        💡 提示：点击预设方案可快速应用筛选条件，您也可以在应用后手动调整参数
      </div>
    </div>
  );
};

export default QuickFilters;
