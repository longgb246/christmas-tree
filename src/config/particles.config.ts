/**
 * 粒子系统配置文件
 * 定义粒子数量、分布比例等参数
 */

import type { ParticleConfig, GestureConfig } from '@typings/index';

/**
 * 粒子数量配置
 */
export const PARTICLE_CONFIG: ParticleConfig = {
  /** 主粒子总数（装饰品 + 糖拐杖 + 照片） */
  mainParticleCount: 1500,
  
  /** 背景尘埃粒子数量 */
  dustParticleCount: 2500,
  
  /** 装饰品占比（方块和球体） */
  decorationRatio: 0.6,
  
  /** 糖拐杖占比 */
  candyCaneRatio: 0.2,
};

/**
 * 粒子尺寸配置
 */
export const PARTICLE_SIZES = {
  /** 装饰品尺寸 */
  decoration: {
    box: 0.5,
    sphere: 0.3,
  },
  
  /** 糖拐杖尺寸 */
  candyCane: {
    radius: 0.08,
    segments: 12,
  },
  
  /** 照片相框尺寸 */
  photo: {
    width: 4.2,
    height: 4.2,
    depth: 0.2,
  },
  
  /** 尘埃粒子尺寸 */
  dust: 0.05,
} as const;

/**
 * 材质颜色配置
 */
export const MATERIAL_COLORS = {
  /** 金色 */
  gold: 0xd4af37,
  
  /** 绿色 */
  green: 0x013220,
  
  /** 红色 */
  red: 0xaa0000,
  
  /** 白色（小灯光） */
  white: 0xffffff,
  
  /** 奶油色（尘埃） */
  cream: 0xfceea7,
} as const;

/**
 * 树形模式配置
 */
export const TREE_MODE_CONFIG = {
  /** 树的高度范围 */
  heightRange: {
    min: -15,
    max: 15,
  },
  
  /** 树的最大半径 */
  maxRadius: 15,
  
  /** 螺旋密度（控制旋转圈数） */
  spiralDensity: 50 * Math.PI,
  
  /** 旋转速度 */
  rotationSpeed: 0.2,
} as const;

/**
 * 散开模式配置
 */
export const SCATTER_MODE_CONFIG = {
  /** 球形分布半径范围 */
  radiusRange: {
    min: 8,
    max: 20,
  },
  
  /** 速度范围 */
  velocityRange: {
    min: -0.05,
    max: 0.05,
  },
  
  /** 旋转速度范围 */
  rotationVelocityRange: {
    min: 0,
    max: 0.02,
  },
  
  /** 边界半径（粒子超出此范围会反弹） */
  boundaryRadius: 25,
} as const;

/**
 * 聚焦模式配置
 */
export const FOCUS_MODE_CONFIG = {
  /** 聚焦照片的位置 */
  focusPosition: {
    x: 0,
    y: 2,
    z: 35,
  },
  
  /** 聚焦照片的缩放倍数 */
  focusScale: 4.5,
  
  /** 背景粒子的距离倍数 */
  backgroundDistanceMultiplier: 1.5,
  
  /** 背景粒子的缩放倍数 */
  backgroundScaleMultiplier: 0.5,
} as const;

/**
 * 手势识别配置
 */
export const GESTURE_CONFIG: GestureConfig = {
  /** 捏合手势阈值（拇指和食指距离） */
  pinchThreshold: 0.05,
  
  /** 握拳手势阈值（手指到手腕的平均距离） */
  fistThreshold: 0.25,
  
  /** 张开手势阈值（手指到手腕的平均距离） */
  openThreshold: 0.4,
};

/**
 * 手势关键点索引
 * 基于 MediaPipe Hand Landmarker 的 21 个关键点
 */
export const HAND_LANDMARKS = {
  /** 手腕 */
  WRIST: 0,
  
  /** 拇指尖 */
  THUMB_TIP: 4,
  
  /** 食指尖 */
  INDEX_TIP: 8,
  
  /** 中指尖 */
  MIDDLE_TIP: 12,
  
  /** 无名指尖 */
  RING_TIP: 16,
  
  /** 小指尖 */
  PINKY_TIP: 20,
  
  /** 手掌中心 */
  PALM_CENTER: 9,
} as const;

/**
 * 尘埃粒子配置
 */
export const DUST_CONFIG = {
  /** 分布范围 */
  distributionRange: {
    x: 80,
    y: 60,
    z: 60,
  },
  
  /** 不透明度 */
  opacity: 0.5,
  
  /** 旋转速度 */
  rotationSpeed: 0.05,
} as const;
