import React, { useState, useCallback, useRef } from 'react';
import { ExperienceMode } from '@typings/index';
import type { AppState, HandData, GestureType } from '@typings/index';
import { PARTICLE_CONFIG } from '@config/particles.config';
import HandGestureService from '@services/HandGestureService';
import LoadingScreen from '@components/UI/LoadingScreen';
import ControlPanel from '@components/UI/ControlPanel';
import GestureLegend from '@components/UI/GestureLegend';
import Scene3D from '@components/Scene3D';

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { hoverGesture: GestureType | null }>({
    mode: ExperienceMode.TREE,
    text: '',
    hand: { gesture: 'NONE', position: { x: 0.5, y: 0.5 } },
    isLoading: true,
    controlsVisible: true,
    hoverGesture: null,
  });

  const scene3DRef = useRef<{ addPhoto: (dataUrl: string) => void } | null>(null);

  const handleLoaded = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  // 辅助函数：根据手势获取模式和文本
  const getModeAndTextFromGesture = (gesture: GestureType, currentMode: ExperienceMode, currentText: string) => {
    let newMode = currentMode;
    let newText = currentText;

    switch (gesture) {
      case 'PINCH':
        newMode = ExperienceMode.FOCUS;
        break;
      case 'FIST':
        newMode = ExperienceMode.TREE;
        break;
      case 'OPEN':
        newMode = ExperienceMode.SCATTER;
        break;
      case 'ONE':
      case 'TWO':
      case 'THREE':
      case 'FOUR':
      case 'FIVE':
        newMode = ExperienceMode.TEXT;
        newText = PARTICLE_CONFIG.textMap[gesture] || '';
        break;
      default:
        // NONE 不改变模式
        break;
    }
    return { newMode, newText };
  };

  const handleHandUpdate = useCallback((handData: HandData) => {
    setState(prev => {
      // 优先级逻辑：
      // 1. 如果有有效的摄像头手势 (非 NONE)，优先使用它
      // 2. 如果摄像头手势为 NONE，且有悬停手势，使用悬停手势
      // 3. 否则保持当前模式 (或根据之前的逻辑)

      const effectiveGesture = handData.gesture !== 'NONE' ? handData.gesture : (prev.hoverGesture || 'NONE');
      
      // 只有当有效手势发生变化，或者手势数据本身发生变化时，才重新计算模式
      // 注意：这里我们需要比较 effectiveGesture 与之前的 effectiveGesture (推导出的)
      // 但为了简单，我们每次都计算目标模式，然后看是否变了
      
      const { newMode, newText } = getModeAndTextFromGesture(effectiveGesture, prev.mode, prev.text || '');

      // 只有当状态真正变化时才更新
      if (handData.gesture !== prev.hand.gesture || 
          handData.position.x !== prev.hand.position.x ||
          handData.position.y !== prev.hand.position.y ||
          newMode !== prev.mode ||
          newText !== prev.text) {
        return {
          ...prev,
          hand: handData,
          mode: newMode,
          text: newText
        };
      }
      
      return prev;
    });
  }, []);

  const handleHoverGesture = useCallback((gesture: GestureType | null) => {
    setState(prev => {
      // 如果当前 hover 手势没变，直接返回
      if (gesture === prev.hoverGesture) return prev;

      // 优先级逻辑：
      // 如果当前有有效的摄像头手势，悬停手势的变化不应影响模式（但需要更新 hoverGesture 状态）
      // 如果当前摄像头手势为 NONE，悬停手势的变化应触发模式切换

      const effectiveGesture = prev.hand.gesture !== 'NONE' ? prev.hand.gesture : (gesture || 'NONE');
      const { newMode, newText } = getModeAndTextFromGesture(effectiveGesture, prev.mode, prev.text || '');

      return {
        ...prev,
        hoverGesture: gesture,
        mode: newMode,
        text: newText
      };
    });
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log('文件选择事件触发，文件数:', files?.length);
    
    if (files && files.length > 0 && scene3DRef.current) {
      // 遍历所有选择的文件
      Array.from(files).forEach((file, index) => {
        console.log(`开始读取第 ${index + 1} 个文件:`, file.name, file.type, file.size);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && scene3DRef.current) {
            console.log(`文件 ${file.name} 读取完成，长度:`, (e.target.result as string).length);
            scene3DRef.current.addPhoto(e.target.result as string);
          } else {
            console.error(`文件 ${file.name} 读取失败或 scene3DRef 为空`);
          }
        };
        reader.onerror = (e) => {
          console.error(`文件 ${file.name} 读取错误:`, e);
        };
        reader.readAsDataURL(file);
      });
    } else {
      console.warn('未选择文件或 scene3DRef 未就绪');
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'h') {
      setState(prev => ({ ...prev, controlsVisible: !prev.controlsVisible }));
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
      <LoadingScreen visible={state.isLoading} />
      
      <Scene3D
        ref={scene3DRef}
        mode={state.mode}
        text={state.text}
        hand={state.hand}
        onLoaded={handleLoaded}
      />
      
      <HandGestureService onHandUpdate={handleHandUpdate} enabled={true} />
      
      <GestureLegend onHoverGesture={handleHoverGesture} />

      <ControlPanel
        visible={state.controlsVisible}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default App;