import React, { useState, useEffect } from 'react';
import { getFavorites, removeFavorite, updateFavoriteNote, type FavoriteStock } from '../utils/localStorage';

interface FavoritesPanelProps {
  onClose: () => void;
  onSelectStock?: (code: string) => void;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ onClose, onSelectStock }) => {
  const [favorites, setFavorites] = useState<FavoriteStock[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    setFavorites(getFavorites());
  };

  const handleRemove = (code: string) => {
    if (confirm('确定要删除这只自选股吗？')) {
      removeFavorite(code);
      loadFavorites();
    }
  };

  const handleSaveNote = (code: string) => {
    updateFavoriteNote(code, noteText);
    setEditingNote(null);
    loadFavorites();
  };

  const startEditNote = (favorite: FavoriteStock) => {
    setEditingNote(favorite.code);
    setNoteText(favorite.note || '');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}
    onClick={onClose}
    >
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 1
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            ⭐ 我的自选股
            <span style={{ fontSize: '14px', color: '#999', marginLeft: '12px' }}>
              ({favorites.length}只)
            </span>
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              width: '32px',
              height: '32px'
            }}
          >
            ×
          </button>
        </div>

        {/* 内容 */}
        <div style={{ padding: '20px' }}>
          {favorites.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '16px' }}>还没有自选股</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                在股票详情页点击"添加自选"即可收藏
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {favorites.map((favorite) => (
                <div key={favorite.code} style={{
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#333',
                        marginBottom: '4px',
                        cursor: onSelectStock ? 'pointer' : 'default'
                      }}
                      onClick={() => onSelectStock?.(favorite.code)}
                      >
                        {favorite.name}
                        <span style={{ fontSize: '14px', color: '#999', marginLeft: '8px' }}>
                          {favorite.code}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        添加于 {new Date(favorite.addedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => startEditNote(favorite)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid #1890ff',
                          background: '#fff',
                          color: '#1890ff',
                          cursor: 'pointer'
                        }}
                      >
                        📝 备注
                      </button>
                      <button
                        onClick={() => handleRemove(favorite.code)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid #ff4d4f',
                          background: '#fff',
                          color: '#ff4d4f',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>

                  {/* 备注编辑 */}
                  {editingNote === favorite.code ? (
                    <div style={{ marginTop: '12px' }}>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="添加备注..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #d9d9d9',
                          fontSize: '14px',
                          resize: 'vertical',
                          minHeight: '60px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setEditingNote(null)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9',
                            background: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSaveNote(favorite.code)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#1890ff',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : favorite.note ? (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: '#fff',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#666',
                      border: '1px solid #e8e8e8'
                    }}>
                      💭 {favorite.note}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPanel;
