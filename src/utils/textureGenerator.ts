/**
 * 纹理生成工具
 * 使用 Canvas API 动态生成各种纹理
 */

import * as THREE from 'three';
import type { TextureGeneratorOptions } from '@typings/index';

/**
 * 创建糖拐杖纹理
 * 生成红白相间的螺旋条纹纹理
 * 
 * @returns Three.js CanvasTexture 对象
 */
export function createCandyCaneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文');
  }

  // 绘制白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  // 绘制红色斜条纹
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 20;
  
  for (let i = -128; i < 256; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 128, 128);
    ctx.stroke();
  }

  // 创建纹理并设置重复模式
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  
  return texture;
}

/**
 * 创建默认照片纹理
 * 生成带有 " ` NOËL" 文字和金色边框的纹理
 * 
 * @param options 纹理生成选项
 * @returns Three.js CanvasTexture 对象
 */
export function createDefaultPhotoTexture(
  options: TextureGeneratorOptions = { width: 512, height: 512 }
): THREE.CanvasTexture {
  const { width, height } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文');
  }

  // 深色背景
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, width, height);

  // 绘制文字
  ctx.fillStyle = '#d4af37'; // 金色
  ctx.font = 'bold 40px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JOYEUX NOËL', width / 2, height / 2);

  // 绘制金色边框
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 创建纹理并设置色彩空间
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  return texture;
}

/**
 * 从图片 URL 创建纹理
 * 用于用户上传的照片
 * 改为使用 Canvas 绘制，以确保兼容性并添加相框效果
 * 
 * @param imageUrl 图片的 Data URL 或普通 URL
 * @returns Promise<THREE.Texture>
 */
export function createTextureFromImage(imageUrl: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        // 固定纹理尺寸为 512x512，与默认照片一致
        const width = 512;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('无法获取 Canvas 2D 上下文');
        }

        // 1. 绘制深色背景
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, width, height);

        // 2. 计算图片绘制尺寸（保持比例，居中显示）
        // 留出 40px 的边距给相框
        const availableWidth = width - 40;
        const availableHeight = height - 40;
        const scale = Math.min(availableWidth / img.width, availableHeight / img.height);
        
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;

        // 3. 绘制图片
        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        // 4. 绘制金色边框 (与 createDefaultPhotoTexture 风格一致)
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, width - 40, height - 40);

        // 5. 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        
        console.log('Canvas纹理生成成功，尺寸:', width, 'x', height);
        resolve(texture);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        console.error('Canvas绘制失败:', errorMessage);
        reject(new Error(`纹理生成失败: ${errorMessage}`));
      }
    };

    img.onerror = (error) => {
      console.error('图片加载失败:', error);
      reject(new Error('图片加载失败'));
    };

    img.src = imageUrl;
  });
}

/**
 * 创建渐变纹理
 * 用于特殊效果
 * 
 * @param colors 颜色数组
 * @param options 纹理选项
 * @returns THREE.CanvasTexture
 */
export function createGradientTexture(
  colors: string[],
  options: TextureGeneratorOptions = { width: 256, height: 256 }
): THREE.CanvasTexture {
  const { width, height } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文');
  }

  // 创建线性渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  
  // 添加颜色停止点
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

/**
 * 创建噪声纹理
 * 用于添加细节和变化
 * 
 * @param options 纹理选项
 * @returns THREE.CanvasTexture
 */
export function createNoiseTexture(
  options: TextureGeneratorOptions = { width: 256, height: 256 }
): THREE.CanvasTexture {
  const { width, height } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文');
  }

  // 生成随机噪声
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() * 255;
    data[i] = value;     // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
    data[i + 3] = 255;   // A
  }

  ctx.putImageData(imageData, 0, 0);

  return new THREE.CanvasTexture(canvas);
}