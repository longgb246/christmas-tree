/**
 * 手势识别服务组件
 * 使用 MediaPipe HandLandmarker 进行实时手势识别
 */

import React, { useEffect, useRef } from 'react';
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
 * 4. 识别手势类型（捏合、握拳、张开）
 * 5. 通过回调函数向父组件传递手势数据
 */
const HandGestureService: React.FC<HandGestureServiceProps> = ({
  onHandUpdate,
  enabled = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);

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
      
      if (pinchDistance < GESTURE_CONFIG.pinchThreshold) {
        gesture = 'PINCH';
      } else if (avgDistanceToWrist < GESTURE_CONFIG.fistThreshold) {
        gesture = 'FIST';
      } else if (avgDistanceToWrist > GESTURE_CONFIG.openThreshold) {
        gesture = 'OPEN';
      }

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
     * 计算两点之间的 3D 距离
     */
    const calculateDistance3D = (
      point1: HandLandmark,
      point2: HandLandmark
    ): number => {
      const dx = point1.x - point2.x;
      const dy = point1.y - point2.y;
      const dz = point1.z - point2.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
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

  // 渲染隐藏的视频元素
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <video
        ref={videoRef}
        width={160}
        height={120}
        playsInline
        muted
      />
    </div>
  );
};

export default HandGestureService;