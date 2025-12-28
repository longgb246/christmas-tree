import React, { useState, useCallback, useRef } from 'react';
import { ExperienceMode } from '@typings/index';
import type { AppState, HandData } from '@typings/index';
import HandGestureService from '@services/HandGestureService';
import LoadingScreen from '@components/UI/LoadingScreen';
import ControlPanel from '@components/UI/ControlPanel';
import Scene3D from '@components/Scene3D';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: ExperienceMode.TREE,
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
      if (handData.gesture !== prev.hand.gesture) {
        if (handData.gesture === 'PINCH') {
          newMode = ExperienceMode.FOCUS;
        } else if (handData.gesture === 'FIST') {
          newMode = ExperienceMode.TREE;
        } else if (handData.gesture === 'OPEN') {
          newMode = ExperienceMode.SCATTER;
        }
      }
      
      // 只有当手势或模式真正变化时才更新 state
      if (handData.gesture !== prev.hand.gesture || 
          handData.position.x !== prev.hand.position.x ||
          handData.position.y !== prev.hand.position.y ||
          newMode !== prev.mode) {
        return {
          ...prev,
          hand: handData,
          mode: newMode
        };
      }
      
      return prev;
    });
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && scene3DRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && scene3DRef.current) {
          scene3DRef.current.addPhoto(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
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
        hand={state.hand}
        onLoaded={handleLoaded}
      />
      
      <HandGestureService onHandUpdate={handleHandUpdate} enabled={true} />
      
      <ControlPanel
        visible={state.controlsVisible}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default App;