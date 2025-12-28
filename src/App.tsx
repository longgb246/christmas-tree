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
  const [state, setState] = useState<AppState>({
    mode: ExperienceMode.TREE,
    text: '',
    hand: { gesture: 'NONE', position: { x: 0.5, y: 0.5 } },
    isLoading: true,
    controlsVisible: true,
  });

  const scene3DRef = useRef<{ addPhoto: (dataUrl: string) => void } | null>(null);

  const handleLoaded = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const handleHandUpdate = useCallback((handData: HandData) => {
    setState(prev => {
      // 检查手势是否变化，只有手势变化时才切换模式
      let newMode = prev.mode;
      let newText = prev.text;

      if (handData.gesture !== prev.hand.gesture) {
        switch (handData.gesture) {
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
            newText = PARTICLE_CONFIG.textMap[handData.gesture] || '';
            break;
          default:
            // NONE 或其他情况保持当前模式
            break;
        }
      }
      
      // 只有当手势或模式真正变化时才更新 state
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
      
      <GestureLegend />

      <ControlPanel
        visible={state.controlsVisible}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default App;