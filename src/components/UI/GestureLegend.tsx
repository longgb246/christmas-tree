import React from 'react';
import { PARTICLE_CONFIG } from '@config/particles.config';

const GestureLegend: React.FC = () => {
  const legendItems = [
    { gesture: '✊ 握拳', action: '圣诞树模式' },
    { gesture: '🖐 张开', action: '散开模式' },
    { gesture: '👌 捏合', action: '聚焦模式' },
    // 移除 1 和 5，因为已取消识别
    { gesture: '✌️ 数字2', action: PARTICLE_CONFIG.textMap.TWO },
    { gesture: '🤟 数字3', action: PARTICLE_CONFIG.textMap.THREE },
    { gesture: '🖖 数字4', action: PARTICLE_CONFIG.textMap.FOUR },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '15px',
        borderRadius: '12px',
        color: 'white',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        pointerEvents: 'none', // 防止阻挡鼠标事件
        zIndex: 100,
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#d4af37' }}>手势说明</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px' }}>
        {legendItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px', width: '60px' }}>{item.gesture}</span>
            <span style={{ color: '#ccc' }}>→</span>
            <span style={{ marginLeft: '10px' }}>{item.action}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GestureLegend;