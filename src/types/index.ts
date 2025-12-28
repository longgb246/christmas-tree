/**
 * 类型定义文件
 * 定义整个应用的 TypeScript 类型和接口
 */

import * as THREE from 'three';

/**
 * 体验模式枚举
 * - TREE: 圣诞树形态（粒子组成圆锥螺旋）
 * - SCATTER: 散开形态（粒子随机分布）
 * - FOCUS: 聚焦形态（选中照片放大，其他粒子后退）
 * - TEXT: 文字形态（粒子组成文字）
 */
export enum ExperienceMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS',
  TEXT = 'TEXT',
}

/**
 * 手势类型
 * - PINCH: 捏合手势（拇指和食指靠近）
 * - FIST: 握拳手势（所有手指收拢）
 * - OPEN: 张开手势（所有手指展开）
 * - ONE: 数字1手势
 * - TWO: 数字2手势
 * - THREE: 数字3手势
 * - FOUR: 数字4手势
 * - FIVE: 数字5手势
 * - NONE: 无手势识别
 */
export type GestureType = 'PINCH' | 'FIST' | 'OPEN' | 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'NONE';

/**
 * 手部数据接口
 * 包含手势类型和手掌中心位置
 */
export interface HandData {
  /** 当前识别的手势类型 */
  gesture: GestureType;
  /** 手掌中心位置（归一化坐标 0-1） */
  position: {
    x: number;
    y: number;
  };
}

/**
 * 全局应用状态接口
 */
export interface AppState {
  /** 当前体验模式 */
  mode: ExperienceMode;
  /** 当前显示的文字（仅在 TEXT 模式下有效） */
  text?: string;
  /** 手部追踪数据 */
  hand: HandData;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 控制面板是否可见 */
  controlsVisible: boolean;
}

/**
 * 粒子类型
 * - DECORATION: 装饰品（方块、球体）
 * - CANDY_CANE: 糖拐杖
 * - PHOTO: 照片相框
 */
export type ParticleType = 'DECORATION' | 'CANDY_CANE' | 'PHOTO';

/**
 * 粒子项接口
 * 表示场景中的单个粒子对象
 */
export interface ParticleItem {
  /** Three.js 网格对象 */
  mesh: THREE.Mesh;
  /** 粒子类型 */
  type: ParticleType;
  /** 目标位置 */
  targetPosition: THREE.Vector3;
  /** 基础位置（用于散开模式） */
  basePosition: THREE.Vector3;
  /** 树形位置（用于树形模式） */
  treePosition: THREE.Vector3;
  /** 目标旋转 */
  targetRotation: THREE.Euler;
  /** 目标缩放 */
  targetScale: THREE.Vector3;
  /** 速度向量（用于散开模式） */
  velocity: THREE.Vector3;
  /** 旋转速度（用于散开模式） */
  rotationVelocity: THREE.Euler;
}

/**
 * 场景配置接口
 */
export interface SceneConfig {
  /** 相机视场角 */
  cameraFOV: number;
  /** 相机初始位置 */
  cameraPosition: THREE.Vector3;
  /** 渲染器色调映射曝光度 */
  toneMappingExposure: number;
}

/**
 * 粒子配置接口
 */
export interface ParticleConfig {
  /** 主粒子数量 */
  mainParticleCount: number;
  /** 尘埃粒子数量 */
  dustParticleCount: number;
  /** 装饰品比例 */
  decorationRatio: number;
  /** 糖拐杖比例 */
  candyCaneRatio: number;
  /** 文字模式下的文字内容映射 */
  textMap: {
    [key in GestureType]?: string;
  };
}

/**
 * 光照配置接口
 */
export interface LightingConfig {
  /** 环境光强度 */
  ambientIntensity: number;
  /** 点光源强度 */
  pointLightIntensity: number;
  /** 聚光灯强度 */
  spotLightIntensity: number;
}

/**
 * 后处理配置接口
 */
export interface PostProcessingConfig {
  /** Bloom 强度 */
  bloomStrength: number;
  /** Bloom 半径 */
  bloomRadius: number;
  /** Bloom 阈值 */
  bloomThreshold: number;
}

/**
 * 手势识别配置接口
 */
export interface GestureConfig {
  /** 捏合手势距离阈值 */
  pinchThreshold: number;
  /** 握拳手势距离阈值 */
  fistThreshold: number;
  /** 张开手势距离阈值 */
  openThreshold: number;
}

/**
 * MediaPipe 手部关键点接口
 */
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

/**
 * 纹理生成器选项接口
 */
export interface TextureGeneratorOptions {
  /** 画布宽度 */
  width: number;
  /** 画布高度 */
  height: number;
}

/**
 * 几何计算结果接口
 */
export interface GeometryCalculation {
  /** 位置向量 */
  position: THREE.Vector3;
  /** 旋转欧拉角 */
  rotation: THREE.Euler;
}