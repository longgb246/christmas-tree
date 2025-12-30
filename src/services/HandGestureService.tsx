/**
 * 手势识别服务组件
 * 使用 MediaPipe HandLandmarker 进行实时手势识别
 */

import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GESTURE_CONFIG, HAND_LANDMARKS } from '@config/particles.config';
import type { HandData, GestureType, HandLandmark } from '@typings/index';

/**
 * 组件 Props 接口
 */
interface HandGestureServiceProps {
  /** 手势数据更新回调 */
  onHandUpdate: (handData: HandData) => void;
  /** 是否启用服务 */
  enabled?: boolean;
}

/**
 * 手势识别服务组件
 * 
 * 功能：
 * 1. 初始化 MediaPipe HandLandmarker
 * 2. 获取摄像头视频流
 * 3. 实时检测手部关键点
 * 4. 识别手势类型（捏合、握拳、张开、数字2-4）
 * 5. 通过回调函数向父组件传递手势数据
 * 6. 在左下角显示摄像头预览和识别状态
 */
const HandGestureService: React.FC<HandGestureServiceProps> = ({
  onHandUpdate,
  enabled = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('NONE');

  useEffect(() => {
    if (!enabled) return;

    let isActive = true;

    /**
     * 初始化 MediaPipe 和摄像头
     */
    const initialize = async () => {
      try {
        console.log('[HandGestureService] 开始初始化 MediaPipe...');
        
        // 1. 加载 MediaPipe Vision Tasks
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        console.log('[HandGestureService] MediaPipe Vision Tasks 加载成功');

        // 2. 创建 HandLandmarker 实例
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU', // 使用 GPU 加速
          },
          runningMode: 'VIDEO', // 视频模式
          numHands: 1, // 只检测一只手
        });

        handLandmarkerRef.current = landmarker;
        console.log('[HandGestureService] HandLandmarker 创建成功');

        // 3. 获取摄像头权限和视频流
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // 前置摄像头
          },
        });
        console.log('[HandGestureService] 摄像头视频流获取成功');

        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
          
          // 4. 等待视频数据加载完成后再开始检测
          videoRef.current.addEventListener('loadeddata', () => {
            if (videoRef.current && isActive) {
              videoRef.current.play();
              console.log('[HandGestureService] 视频开始播放，开始手势检测');
              startDetection();
            }
          }, { once: true });
        }
      } catch (error) {
        console.error('[HandGestureService] 手势识别服务初始化失败:', error);
        // 即使失败也要通知父组件（重置位置）
        onHandUpdate({
          gesture: 'NONE',
          position: { x: 0, y: 0 },
        });
      }
    };

    /**
     * 开始手势检测循环
     */
    const startDetection = () => {
      const detect = async () => {
        if (!isActive || !videoRef.current || !handLandmarkerRef.current) {
          return;
        }

        // 确保视频已准备好
        if (videoRef.current.readyState >= 2) {
          try {
            // 执行手势检测
            const startTimeMs = performance.now();
            const results = handLandmarkerRef.current.detectForVideo(
              videoRef.current,
              startTimeMs
            );

            // 处理检测结果
            if (results.landmarks && results.landmarks.length > 0) {
              const handData = processLandmarks(results.landmarks[0]);
              onHandUpdate(handData);
            } else {
              // 未检测到手部，重置旋转位置为中心（与原始HTML一致）
              onHandUpdate({
                gesture: 'NONE',
                position: { x: 0.5, y: 0.5 },
              });
            }
          } catch (error) {
            console.error('[HandGestureService] 手势检测错误:', error);
          }
        }

        // 继续下一帧检测
        animationFrameRef.current = requestAnimationFrame(detect);
      };

      detect();
    };

    /**
     * 处理手部关键点数据
     * 识别手势类型和手掌位置
     */
    const processLandmarks = (landmarks: HandLandmark[]): HandData => {
      // 提取关键点
      const wrist = landmarks[HAND_LANDMARKS.WRIST];
      const thumbTip = landmarks[HAND_LANDMARKS.THUMB_TIP];
      const indexTip = landmarks[HAND_LANDMARKS.INDEX_TIP];
      const middleTip = landmarks[HAND_LANDMARKS.MIDDLE_TIP];
      const ringTip = landmarks[HAND_LANDMARKS.RING_TIP];
      const pinkyTip = landmarks[HAND_LANDMARKS.PINKY_TIP];
      const palmCenter = landmarks[HAND_LANDMARKS.PALM_CENTER];

      // 1. 计算捏合手势（拇指和食指距离）- 使用 2D 距离更稳定
      const pinchDistance = calculateDistance2D(thumbTip, indexTip);

      // 2. 计算握拳手势（手指到手腕的平均距离）
      const fingerTips = [indexTip, middleTip, ringTip, pinkyTip];
      const avgDistanceToWrist =
        fingerTips.reduce(
          (sum, tip) => sum + calculateDistance2D(tip, wrist),
          0
        ) / fingerTips.length;

      // 3. 识别手势类型
      let gesture: GestureType = 'NONE';
      
      // 计算伸出的手指数量 (基于比例，具有尺度不变性，更鲁棒)
      const extendedFingers = countExtendedFingers(landmarks);
      
      // 优先检测捏合 (PINCH)
      if (pinchDistance < GESTURE_CONFIG.pinchThreshold) {
        gesture = 'PINCH';
      } else {
        // 根据伸出的手指数量进行判断
        if (extendedFingers === 0) {
          // 只有当没有手指伸出时，才检测握拳 (FIST)
          // 这样避免了距离较远时，数字手势被误判为握拳
          if (avgDistanceToWrist < GESTURE_CONFIG.fistThreshold) {
            gesture = 'FIST';
          }
        } else {
          // 有手指伸出，判断数字手势
          switch (extendedFingers) {
            case 2:
              gesture = 'TWO';
              break;
            case 3:
              gesture = 'THREE';
              break;
            case 4:
              gesture = 'FOUR';
              break;
            default:
              // 如果没有明确的数字手势 (如 1 或 5)，但距离较大，则为 OPEN
              // 注意：这里也放宽了 OPEN 的判断，只要手指够多且距离够大
              if (avgDistanceToWrist > GESTURE_CONFIG.openThreshold || extendedFingers >= 5) {
                gesture = 'OPEN';
              }
              break;
          }
        }
      }

      setCurrentGesture(gesture);

      // 4. 返回手势数据
      return {
        gesture,
        position: {
          x: palmCenter.x,
          y: palmCenter.y,
        },
      };
    };

    /**
     * 计算伸出的手指数量
     */
    const countExtendedFingers = (landmarks: HandLandmark[]): number => {
      let count = 0;
      const wrist = landmarks[HAND_LANDMARKS.WRIST];

      // 拇指检测：比较拇指指尖和指关节的 x 坐标（假设右手，左手需反转逻辑，或者使用距离判断）
      // 更通用的方法：检查指尖是否比指关节离手腕更远
      const thumbTip = landmarks[HAND_LANDMARKS.THUMB_TIP];
      const thumbIp = landmarks[3]; // 拇指指间关节
      
      // 拇指判断比较复杂，简化为：指尖到小指根部的距离 > 指关节到小指根部的距离
      const pinkyMcp = landmarks[17];
      if (calculateDistance2D(thumbTip, pinkyMcp) > calculateDistance2D(thumbIp, pinkyMcp)) {
        count++;
      }

      // 其他四指：比较指尖到手腕的距离是否大于指关节到手腕的距离
      const fingerIndices = [
        { tip: 8, pip: 6 },  // 食指
        { tip: 12, pip: 10 }, // 中指
        { tip: 16, pip: 14 }, // 无名指
        { tip: 20, pip: 18 }  // 小指
      ];

      fingerIndices.forEach(({ tip, pip }) => {
        if (calculateDistance2D(landmarks[tip], wrist) > calculateDistance2D(landmarks[pip], wrist) * 1.2) { // 1.2 为阈值系数
          count++;
        }
      });

      return count;
    };


    /**
     * 计算两点之间的 2D 距离（忽略 Z 轴）
     */
    const calculateDistance2D = (
      point1: HandLandmark,
      point2: HandLandmark
    ): number => {
      const dx = point1.x - point2.x;
      const dy = point1.y - point2.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // 启动服务
    initialize();

    // 清理函数
    return () => {
      isActive = false;
      
      // 取消动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // 关闭 HandLandmarker
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }

      // 停止视频流
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enabled, onHandUpdate]);

  // 渲染左下角的摄像头预览和控制组件
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '14px',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease',
        }}
      >
        {isExpanded ? '隐藏摄像头' : '显示摄像头'}
      </button>

      {/* 视频预览框 */}
      <div
        style={{
          width: '240px',
          height: '180px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: isExpanded ? 'block' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // 镜像显示
          }}
          playsInline
          muted
        />
        
        {/* 手势状态显示 */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            padding: '8px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            color: 'white',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          当前手势: {currentGesture === 'NONE' ? '未检测' : currentGesture}
        </div>
      </div>
    </div>
  );
};

export default HandGestureService;