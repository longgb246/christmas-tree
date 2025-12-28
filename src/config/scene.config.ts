/**
 * 场景配置文件
 * 定义 Three.js 场景的各项参数
 */

import * as THREE from 'three';
import type { SceneConfig, LightingConfig, PostProcessingConfig } from '@typings/index';

/**
 * 场景基础配置
 */
export const SCENE_CONFIG: SceneConfig = {
  /** 相机视场角（度） */
  cameraFOV: 45,
  
  /** 相机初始位置 */
  cameraPosition: new THREE.Vector3(0, 2, 50),
  
  /** 色调映射曝光度 */
  toneMappingExposure: 2.2,
};

/**
 * 光照配置
 */
export const LIGHTING_CONFIG: LightingConfig = {
  /** 环境光强度 */
  ambientIntensity: 0.6,
  
  /** 中心点光源强度 */
  pointLightIntensity: 2,
  
  /** 聚光灯强度 */
  spotLightIntensity: 1200,
};

/**
 * 光源位置配置
 */
export const LIGHT_POSITIONS = {
  /** 中心点光源位置 */
  pointLight: new THREE.Vector3(0, 5, 0),
  
  /** 金色聚光灯位置 */
  goldSpotLight: new THREE.Vector3(30, 40, 40),
  
  /** 蓝色聚光灯位置 */
  blueSpotLight: new THREE.Vector3(-30, 20, -30),
} as const;

/**
 * 光源颜色配置
 */
export const LIGHT_COLORS = {
  /** 环境光颜色 */
  ambient: 0xffffff,
  
  /** 点光源颜色（暖橙色） */
  pointLight: 0xff7700,
  
  /** 金色聚光灯 */
  goldSpotLight: 0xd4af37,
  
  /** 蓝色聚光灯 */
  blueSpotLight: 0x0077ff,
} as const;

/**
 * 后处理效果配置
 */
export const POST_PROCESSING_CONFIG: PostProcessingConfig = {
  /** Bloom 泛光强度 */
  bloomStrength: 0.45,
  
  /** Bloom 半径 */
  bloomRadius: 0.4,
  
  /** Bloom 阈值（只有亮度超过此值的区域才会发光） */
  bloomThreshold: 0.7,
};

/**
 * 动画配置
 */
export const ANIMATION_CONFIG = {
  /** 位置插值速度 */
  positionLerpSpeed: 0.05,
  
  /** 旋转插值速度 */
  rotationLerpSpeed: 0.05,
  
  /** 缩放插值速度 */
  scaleLerpSpeed: 0.05,
  
  /** 手势控制旋转灵敏度 */
  gestureRotationSensitivity: 2,
} as const;

/**
 * 渲染器配置
 */
export const RENDERER_CONFIG = {
  /** 是否开启抗锯齿 */
  antialias: true,
  
  /** 是否开启透明背景 */
  alpha: true,
  
  /** 最大像素比（防止高分辨率设备性能问题） */
  maxPixelRatio: 2,
} as const;
