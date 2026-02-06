import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  progress?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '加载中...', progress }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      background: '#fafafa',
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      {/* 旋转动画 */}
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #f0f0f0',
        borderTop: '4px solid #1890ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        fontSize: '16px',
        color: '#333',
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        {message}
      </div>

      {progress && (
        <div style={{
          fontSize: '14px',
          color: '#999',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          {progress}
        </div>
      )}

      {/* 提示信息 */}
      <div style={{
        marginTop: '16px',
        padding: '12px 20px',
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#0050b3',
        textAlign: 'center'
      }}>
        💡 首次加载需要扫描全市场股票，预计需要1-2分钟
      </div>
    </div>
  );
};

export default LoadingSpinner;
