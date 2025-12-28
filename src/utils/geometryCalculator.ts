/**
 * 几何计算工具
 * 提供粒子位置、旋转等几何计算功能
 */

import * as THREE from 'three';
import { TREE_MODE_CONFIG, SCATTER_MODE_CONFIG } from '@config/particles.config';
import type { GeometryCalculation } from '@typings/index';

/**
 * 计算树形模式下的粒子位置
 * 使用螺旋圆锥算法
 * 
 * @param index 粒子索引
 * @param totalCount 粒子总数
 * @returns 位置向量
 */
export function calculateTreePosition(
  index: number,
  totalCount: number
): THREE.Vector3 {
  const { heightRange, maxRadius, spiralDensity } = TREE_MODE_CONFIG;
  
  // 归一化索引 (0-1)
  const t = index / totalCount;
  
  // 计算高度（从底部到顶部线性分布）
  const y = heightRange.min + t * (heightRange.max - heightRange.min);
  
  // 计算半径（圆锥形，从底部到顶部递减）
  const radius = maxRadius * (1 - t);
  
  // 计算螺旋角度
  const angle = t * spiralDensity;
  
  // 转换为笛卡尔坐标
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * 计算散开模式下的粒子位置
 * 使用球形均匀分布算法
 * 
 * @returns 位置向量
 */
export function calculateScatterPosition(): THREE.Vector3 {
  const { radiusRange } = SCATTER_MODE_CONFIG;
  
  // 随机半径
  const radius = radiusRange.min + Math.random() * (radiusRange.max - radiusRange.min);
  
  // 使用球坐标确保均匀分布
  const phi = Math.random() * Math.PI * 2; // 方位角 0-2π
  const theta = Math.random() * Math.PI;   // 极角 0-π
  
  // 转换为笛卡尔坐标
  const x = radius * Math.sin(theta) * Math.cos(phi);
  const y = radius * Math.sin(theta) * Math.sin(phi);
  const z = radius * Math.cos(theta);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * 计算粒子的随机速度向量
 * 用于散开模式的运动
 * 
 * @returns 速度向量
 */
export function calculateRandomVelocity(): THREE.Vector3 {
  const { velocityRange } = SCATTER_MODE_CONFIG;
  
  const vx = velocityRange.min + Math.random() * (velocityRange.max - velocityRange.min);
  const vy = velocityRange.min + Math.random() * (velocityRange.max - velocityRange.min);
  const vz = velocityRange.min + Math.random() * (velocityRange.max - velocityRange.min);
  
  return new THREE.Vector3(vx, vy, vz);
}

/**
 * 计算粒子的随机旋转速度
 * 用于散开模式的自转
 * 
 * @returns 旋转欧拉角
 */
export function calculateRandomRotationVelocity(): THREE.Euler {
  const { rotationVelocityRange } = SCATTER_MODE_CONFIG;
  
  const rx = Math.random() * rotationVelocityRange.max;
  const ry = Math.random() * rotationVelocityRange.max;
  const rz = Math.random() * rotationVelocityRange.max;
  
  return new THREE.Euler(rx, ry, rz);
}

/**
 * 应用树形模式的旋转动画
 * 让整个树形结构缓慢旋转
 * 
 * @param position 原始位置
 * @param time 当前时间（秒）
 * @returns 旋转后的位置
 */
export function applyTreeRotation(
  position: THREE.Vector3,
  time: number
): THREE.Vector3 {
  const { rotationSpeed } = TREE_MODE_CONFIG;
  const angle = time * rotationSpeed;
  
  // 绕 Y 轴旋转
  const x = position.x * Math.cos(angle) - position.z * Math.sin(angle);
  const z = position.x * Math.sin(angle) + position.z * Math.cos(angle);
  
  return new THREE.Vector3(x, position.y, z);
}

/**
 * 检查粒子是否超出边界
 * 用于散开模式的边界检测
 * 
 * @param position 粒子位置
 * @returns 是否超出边界
 */
export function isOutOfBounds(position: THREE.Vector3): boolean {
  const { boundaryRadius } = SCATTER_MODE_CONFIG;
  return position.length() > boundaryRadius;
}

/**
 * 计算两点之间的距离
 * 
 * @param point1 第一个点
 * @param point2 第二个点
 * @returns 距离值
 */
export function calculateDistance(
  point1: THREE.Vector3,
  point2: THREE.Vector3
): number {
  return point1.distanceTo(point2);
}

/**
 * 计算聚焦模式下背景粒子的位置
 * 将粒子推向更远的位置
 * 
 * @param basePosition 基础位置
 * @param multiplier 距离倍数
 * @returns 新位置
 */
export function calculateBackgroundPosition(
  basePosition: THREE.Vector3,
  multiplier: number = 1.5
): THREE.Vector3 {
  return basePosition.clone().multiplyScalar(multiplier);
}

/**
 * 生成随机的初始位置
 * 用于粒子的初始化
 * 
 * @param range 位置范围
 * @returns 随机位置
 */
export function generateRandomPosition(range: number = 100): THREE.Vector3 {
  const x = (Math.random() - 0.5) * range;
  const y = (Math.random() - 0.5) * range;
  const z = (Math.random() - 0.5) * range;
  
  return new THREE.Vector3(x, y, z);
}

/**
 * 计算物体朝向目标的旋转
 * 
 * @param currentPosition 当前位置
 * @param targetPosition 目标位置
 * @returns 旋转欧拉角
 */
export function calculateLookAtRotation(
  currentPosition: THREE.Vector3,
  targetPosition: THREE.Vector3
): THREE.Euler {
  const direction = new THREE.Vector3()
    .subVectors(targetPosition, currentPosition)
    .normalize();
  
  const euler = new THREE.Euler();
  euler.setFromVector3(direction);
  
  return euler;
}

/**
 * 线性插值辅助函数
 * 
 * @param start 起始值
 * @param end 结束值
 * @param alpha 插值系数 (0-1)
 * @returns 插值结果
 */
export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

/**
 * 向量线性插值
 * 
 * @param start 起始向量
 * @param end 结束向量
 * @param alpha 插值系数 (0-1)
 * @returns 插值后的向量
 */
export function lerpVector3(
  start: THREE.Vector3,
  end: THREE.Vector3,
  alpha: number
): THREE.Vector3 {
  return new THREE.Vector3().lerpVectors(start, end, alpha);
}
