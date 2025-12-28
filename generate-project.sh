#!/bin/bash

# 圣诞树项目自动生成脚本
# 用于快速创建剩余的项目文件

set -e

echo "🎄 开始生成圣诞树项目剩余文件..."

# 创建目录结构
mkdir -p src/components/UI
mkdir -p src/components/Scene3D

# 1. 创建 LoadingScreen 组件
cat > src/components/UI/LoadingScreen.tsx << 'EOF'
/**
 * 加载屏幕组件
 * 显示加载动画和提示文字
 */

import React from 'react';

interface LoadingScreenProps {
  visible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        transition: 'opacity 1s ease',
      }}
    >
      {/* 旋转动画 */}
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(212, 175, 55, 0.3)',
          borderTop: '4px solid #d4af37',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px',
        }}
      />
      
      {/* 加载文字 */}
      <p
        style={{
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.2em',
          fontSize: '14px',
          color: '#d4af37',
          textTransform: 'uppercase',
        }}
      >
        Loading Holiday Magic
      </p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
EOF

# 2. 创建 ControlPanel 组件
cat > src/components/UI/ControlPanel.tsx << 'EOF'
/**
 * 控制面板组件
 * 包含标题、上传按钮和提示信息
 */

import React from 'react';

interface ControlPanelProps {
  visible: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ visible, onFileUpload }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        transition: 'opacity 0.5s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* 标题 */}
      <header style={{ marginTop: '48px', textAlign: 'center', userSelect: 'none' }}>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
            fontFamily: 'Cinzel, serif',
            fontWeight: 'bold',
            background: 'linear-gradient(to bottom, #ffffff, #d4af37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.5))',
            marginBottom: '8px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Merry Christmas
        </h1>
        <p
          style={{
            color: '#fceea7',
            opacity: 0.6,
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          A Generative Holiday Experience
        </p>
      </header>

      {/* 控制按钮 */}
      <div
        style={{
          marginTop: 'auto',
          marginBottom: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          pointerEvents: 'auto',
        }}
      >
        <label
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #d4af37',
            color: '#d4af37',
            fontFamily: 'Cinzel, serif',
            padding: '12px 32px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: '9999px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Add Memories
          <input
            type="file"
            accept="image/*"
            onChange={onFileUpload}
            style={{ display: 'none' }}
          />
        </label>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Press 'H' to Hide Controls
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '9px', textTransform: 'uppercase' }}>
            Fist: Tree | Open Hand: Scatter | Pinch: Focus
          </p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
EOF

echo "✅ UI 组件创建完成"
echo "📦 项目文件已生成到 christmas-tree-app 目录"
echo ""
echo "接下来的步骤："
echo "1. cd christmas-tree-app"
echo "2. npm install"
echo "3. npm run dev"
echo ""
echo "🎄 圣诞快乐！"
EOF

chmod +x christmas-tree-app/generate-project.sh

echo "✅ 项目生成脚本已创建"
</tool_command>