import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ExperienceMode, type HandData, type ParticleItem } from '@typings/index';
import { SCENE_CONFIG, LIGHTING_CONFIG, LIGHT_POSITIONS, LIGHT_COLORS, POST_PROCESSING_CONFIG, ANIMATION_CONFIG, RENDERER_CONFIG } from '@config/scene.config';
import { PARTICLE_CONFIG, PARTICLE_SIZES, MATERIAL_COLORS, FOCUS_MODE_CONFIG } from '@config/particles.config';
import { createCandyCaneTexture, createDefaultPhotoTexture, createTextureFromImage } from '@utils/textureGenerator';
import { calculateTreePosition, calculateScatterPosition, calculateRandomVelocity, calculateRandomRotationVelocity, applyTreeRotation, isOutOfBounds, calculateBackgroundPosition, calculateTextPositions } from '@utils/geometryCalculator';

interface Scene3DProps {
  mode: ExperienceMode;
  text?: string;
  hand: HandData;
  onLoaded: () => void;
}

const Scene3D = forwardRef<{ addPhoto: (dataUrl: string) => void }, Scene3DProps>(
  ({ mode, text, hand, onLoaded }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<ParticleItem[]>([]);
    const photoParticlesRef = useRef<ParticleItem[]>([]);
    const focusedPhotoRef = useRef<ParticleItem | null>(null);
    const defaultPhotoParticleRef = useRef<ParticleItem | null>(null);
    const mainGroupRef = useRef<THREE.Group | null>(null);
    const previousModeRef = useRef<ExperienceMode>(mode);
    const previousTextRef = useRef<string | undefined>(text);
    const textPositionsRef = useRef<THREE.Vector3[]>([]);
    const addPhotoToSceneRef = useRef<((texture: THREE.Texture) => void) | null>(null);
    
    // 使用 ref 存储最新的 hand 和 mode 值，避免重新创建场景
    const handRef = useRef<HandData>(hand);
    const modeRef = useRef<ExperienceMode>(mode);
    const textRef = useRef<string | undefined>(text);
    
    // 每次渲染时更新 ref
    handRef.current = hand;
    modeRef.current = mode;
    textRef.current = text;

    useImperativeHandle(ref, () => ({
      addPhoto: async (dataUrl: string) => {
        try {
          console.log('开始处理上传照片...');
          const texture = await createTextureFromImage(dataUrl);
          
          // 如果存在默认占位图，则移除它
          if (defaultPhotoParticleRef.current) {
            const defaultParticle = defaultPhotoParticleRef.current;
            console.log('检测到默认占位图，正在移除...');
            
            // 从场景中移除 Mesh
            if (mainGroupRef.current) {
              mainGroupRef.current.remove(defaultParticle.mesh);
            }
            
            // 从粒子数组中移除
            particlesRef.current = particlesRef.current.filter(p => p !== defaultParticle);
            photoParticlesRef.current = photoParticlesRef.current.filter(p => p !== defaultParticle);
            
            // 清理几何体和材质资源
            if (defaultParticle.mesh.geometry) defaultParticle.mesh.geometry.dispose();
            // 注意：材质可能是共享的，这里只清理独享的 photoMat (children[0].material)
            // frameMesh 的材质是 goldMat (共享)，不应清理
            const photoMesh = defaultParticle.mesh.children[0] as THREE.Mesh;
            if (photoMesh && photoMesh.material) {
              (photoMesh.material as THREE.Material).dispose();
            }
            
            defaultPhotoParticleRef.current = null;
            console.log('默认占位图已移除');
          }

          if (addPhotoToSceneRef.current) {
            console.log('调用 addPhotoToScene 添加照片到场景');
            addPhotoToSceneRef.current(texture);
          } else {
            console.error('addPhotoToSceneRef.current 为空');
          }
        } catch (error) {
          console.error('添加照片失败:', error);
        }
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        SCENE_CONFIG.cameraFOV,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.copy(SCENE_CONFIG.cameraPosition);

      const renderer = new THREE.WebGLRenderer({
        antialias: RENDERER_CONFIG.antialias,
        alpha: RENDERER_CONFIG.alpha,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER_CONFIG.maxPixelRatio));
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = SCENE_CONFIG.toneMappingExposure;
      containerRef.current.appendChild(renderer.domElement);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

      const mainGroup = new THREE.Group();
      scene.add(mainGroup);
      mainGroupRef.current = mainGroup;

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(
        new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          POST_PROCESSING_CONFIG.bloomStrength,
          POST_PROCESSING_CONFIG.bloomRadius,
          POST_PROCESSING_CONFIG.bloomThreshold
        )
      );

      const ambientLight = new THREE.AmbientLight(LIGHT_COLORS.ambient, LIGHTING_CONFIG.ambientIntensity);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(LIGHT_COLORS.pointLight, LIGHTING_CONFIG.pointLightIntensity);
      pointLight.position.copy(LIGHT_POSITIONS.pointLight);
      scene.add(pointLight);

      const goldSpot = new THREE.SpotLight(LIGHT_COLORS.goldSpotLight, LIGHTING_CONFIG.spotLightIntensity);
      goldSpot.position.copy(LIGHT_POSITIONS.goldSpotLight);
      goldSpot.angle = Math.PI / 6;
      goldSpot.penumbra = 1;
      scene.add(goldSpot);

      const blueSpot = new THREE.SpotLight(LIGHT_COLORS.blueSpotLight, LIGHTING_CONFIG.spotLightIntensity * 0.5);
      blueSpot.position.copy(LIGHT_POSITIONS.blueSpotLight);
      blueSpot.angle = Math.PI / 6;
      blueSpot.penumbra = 1;
      scene.add(blueSpot);

      const goldMat = new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.gold, metalness: 0.9, roughness: 0.1 });
      const greenMat = new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.green, metalness: 0.4, roughness: 0.5 });
      const redMat = new THREE.MeshPhysicalMaterial({ color: MATERIAL_COLORS.red, clearcoat: 1.0, clearcoatRoughness: 0.1, metalness: 0.5 });
      const candyCaneTexture = createCandyCaneTexture();
      
      // 创建文字模式专用的高亮材质
      const textMat = new THREE.MeshBasicMaterial({ 
        color: 0xffdd44, // 明亮的金黄色
        toneMapped: false // 忽略色调映射，使其看起来更亮（配合 Bloom）
      });

      const addPhotoToScene = (texture: THREE.Texture, isDefault: boolean = false) => {
        console.log('正在创建照片 Mesh...');
        // 检查纹理是否有效
        if (texture.image) {
          console.log('纹理图片尺寸:', texture.image.width, 'x', texture.image.height);
        } else {
          console.warn('纹理图片对象为空');
        }

        const frameGeo = new THREE.BoxGeometry(PARTICLE_SIZES.photo.width, PARTICLE_SIZES.photo.height, PARTICLE_SIZES.photo.depth);
        const photoGeo = new THREE.PlaneGeometry(PARTICLE_SIZES.photo.width - 0.2, PARTICLE_SIZES.photo.height - 0.2);
        const frameMesh = new THREE.Mesh(frameGeo, goldMat);
        
        // 禁用视锥体剔除，防止照片在某些角度被错误剔除导致不可见
        frameMesh.frustumCulled = false;
        
        // 使用 DoubleSide 确保照片正反面都可见，防止因旋转导致不可见
        // 添加白色底色，如果纹理加载失败至少能看到白板
        const photoMat = new THREE.MeshBasicMaterial({ 
          map: texture,
          side: THREE.DoubleSide,
          color: 0xffffff
        });
        const photoMesh = new THREE.Mesh(photoGeo, photoMat);
        
        // 同样禁用视锥体剔除
        photoMesh.frustumCulled = false;
        
        // 增加 Z 轴偏移，防止 Z-fighting
        photoMesh.position.z = 0.21;
        frameMesh.add(photoMesh);

        const basePos = calculateScatterPosition();
        frameMesh.position.copy(basePos);
        
        // 显式更新矩阵，确保变换立即生效
        frameMesh.updateMatrix();
        photoMesh.updateMatrix();

        // 使用随机索引来计算树上的位置，确保照片随机分布在树身范围内，而不是堆积在顶部
        // 范围取 0.1 到 0.9 避免太靠近顶部或底部
        const randomTreeIndex = Math.floor((0.1 + Math.random() * 0.8) * PARTICLE_CONFIG.mainParticleCount);
        const treePos = calculateTreePosition(randomTreeIndex, PARTICLE_CONFIG.mainParticleCount);
        
        const particle: ParticleItem = {
          mesh: frameMesh,
          type: 'PHOTO',
          targetPosition: basePos.clone(),
          basePosition: basePos.clone(),
          treePosition: treePos,
          targetRotation: new THREE.Euler(0, -Math.PI / 4, 0),
          targetScale: new THREE.Vector3(1, 1, 1),
          velocity: calculateRandomVelocity(),
          rotationVelocity: calculateRandomRotationVelocity(),
        };

        if (isDefault) {
          defaultPhotoParticleRef.current = particle;
        }

        particlesRef.current.push(particle);
        photoParticlesRef.current.push(particle);
        mainGroup.add(frameMesh);
        
        console.log('照片 Mesh 已添加到 mainGroup，当前 mainGroup 子对象数量:', mainGroup.children.length);
        console.log('当前粒子总数:', particlesRef.current.length);
      };

      // 将函数存储到 ref 中，供外部调用
      // @ts-ignore - 忽略类型不匹配，因为我们修改了函数签名但 ref 类型定义没变
      addPhotoToSceneRef.current = addPhotoToScene;

      for (let i = 0; i < PARTICLE_CONFIG.mainParticleCount; i++) {
        let geo: THREE.BufferGeometry, mat: THREE.Material;
        const rand = Math.random();

        if (rand < PARTICLE_CONFIG.decorationRatio * 0.5) {
          geo = new THREE.BoxGeometry(PARTICLE_SIZES.decoration.box, PARTICLE_SIZES.decoration.box, PARTICLE_SIZES.decoration.box);
          mat = Math.random() > 0.5 ? goldMat : greenMat;
        } else if (rand < PARTICLE_CONFIG.decorationRatio) {
          geo = new THREE.SphereGeometry(PARTICLE_SIZES.decoration.sphere, 16, 16);
          mat = Math.random() > 0.5 ? goldMat : redMat;
        } else if (rand < PARTICLE_CONFIG.decorationRatio + PARTICLE_CONFIG.candyCaneRatio) {
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0.3, 1.3, 0),
            new THREE.Vector3(0.6, 1.1, 0),
          ]);
          geo = new THREE.TubeGeometry(curve, PARTICLE_SIZES.candyCane.segments, PARTICLE_SIZES.candyCane.radius, 8, false);
          mat = new THREE.MeshStandardMaterial({ map: candyCaneTexture });
        } else {
          geo = new THREE.SphereGeometry(0.2, 8, 8);
          mat = new THREE.MeshBasicMaterial({ color: MATERIAL_COLORS.white });
        }

        const mesh = new THREE.Mesh(geo, mat);
        const basePos = calculateScatterPosition();
        mesh.position.copy(basePos);

        const particle: ParticleItem = {
          mesh,
          type: rand < PARTICLE_CONFIG.decorationRatio + PARTICLE_CONFIG.candyCaneRatio ? 'CANDY_CANE' : 'DECORATION',
          targetPosition: basePos.clone(),
          basePosition: basePos.clone(),
          treePosition: calculateTreePosition(i, PARTICLE_CONFIG.mainParticleCount),
          targetRotation: new THREE.Euler(),
          targetScale: new THREE.Vector3(1, 1, 1),
          velocity: calculateRandomVelocity(),
          rotationVelocity: calculateRandomRotationVelocity(),
        };

        particlesRef.current.push(particle);
        mainGroup.add(mesh);
      }

      addPhotoToScene(createDefaultPhotoTexture(), true);

      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(PARTICLE_CONFIG.dustParticleCount * 3);
      for (let i = 0; i < PARTICLE_CONFIG.dustParticleCount * 3; i++) {
        dustPos[i] = (Math.random() - 0.5) * 80;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({ color: MATERIAL_COLORS.cream, size: PARTICLE_SIZES.dust, transparent: true, opacity: 0.5 });
      const dust = new THREE.Points(dustGeo, dustMat);
      scene.add(dust);

      const clock = new THREE.Clock();

      const animate = () => {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // 检测模式切换，重置聚焦照片（与原始HTML的switchMode逻辑一致）
        if (modeRef.current !== previousModeRef.current || (modeRef.current === ExperienceMode.TEXT && textRef.current !== previousTextRef.current)) {
          
          // 处理材质切换：进入/离开 TEXT 模式
          if (modeRef.current === ExperienceMode.TEXT && previousModeRef.current !== ExperienceMode.TEXT) {
            // 进入 TEXT 模式：保存原始材质并应用高亮材质
            // 注意：只替换非图片粒子的材质，图片粒子保持原样
            particlesRef.current.forEach(p => {
              if (p.type !== 'PHOTO') {
                if (!p.mesh.userData.originalMaterial) {
                  p.mesh.userData.originalMaterial = p.mesh.material;
                }
                p.mesh.material = textMat;
              }
            });
          } else if (modeRef.current !== ExperienceMode.TEXT && previousModeRef.current === ExperienceMode.TEXT) {
            // 离开 TEXT 模式：恢复原始材质
            particlesRef.current.forEach(p => {
              if (p.mesh.userData.originalMaterial) {
                p.mesh.material = p.mesh.userData.originalMaterial;
              }
            });
          }

          previousModeRef.current = modeRef.current;
          previousTextRef.current = textRef.current;
          
          if (modeRef.current === ExperienceMode.FOCUS) {
            // 进入FOCUS模式时选择新照片
            if (photoParticlesRef.current.length > 0) {
              focusedPhotoRef.current = photoParticlesRef.current[Math.floor(Math.random() * photoParticlesRef.current.length)];
            }
          } else {
            // 离开FOCUS模式时清空聚焦照片
            focusedPhotoRef.current = null;
          }

          // 如果进入文字模式，计算文字位置
          if (modeRef.current === ExperienceMode.TEXT && textRef.current) {
            // 统计非图片粒子的数量
            const nonPhotoCount = particlesRef.current.filter(p => p.type !== 'PHOTO').length;
            // 只使用 90% 的非图片粒子来组成文字，剩下的 10% 和图片粒子一起在周围浮动
            const textParticleCount = Math.floor(nonPhotoCount * 0.9);
            textPositionsRef.current = calculateTextPositions(textRef.current, textParticleCount);
          }
        }

        // 手势控制场景旋转
        // 在 TEXT 和 FOCUS 模式下，强制回正视角，忽略手势旋转
        let targetRotationY = 0;
        let targetRotationX = 0;

        if (modeRef.current !== ExperienceMode.TEXT && modeRef.current !== ExperienceMode.FOCUS) {
          targetRotationY = handRef.current.position.x * ANIMATION_CONFIG.gestureRotationSensitivity;
          targetRotationX = handRef.current.position.y * (ANIMATION_CONFIG.gestureRotationSensitivity * 0.5);
        }
        
        mainGroup.rotation.y = THREE.MathUtils.lerp(
          mainGroup.rotation.y,
          targetRotationY,
          ANIMATION_CONFIG.rotationLerpSpeed
        );
        mainGroup.rotation.x = THREE.MathUtils.lerp(
          mainGroup.rotation.x,
          targetRotationX,
          ANIMATION_CONFIG.rotationLerpSpeed
        );

        particlesRef.current.forEach((p, i) => {
          if (modeRef.current === ExperienceMode.TREE) {
            p.targetPosition.copy(applyTreeRotation(p.treePosition, time));
            p.targetScale.set(1, 1, 1);

            // 如果是照片粒子，让它始终面向树的径向外侧
            // 这样当树旋转时，照片也会跟着自转，始终展示正面给外部
            // if (p.type === 'PHOTO') {
            //   const angle = Math.atan2(p.targetPosition.x, p.targetPosition.z);
            //   p.targetRotation.set(0, angle, 0);
            // }
          } else if (modeRef.current === ExperienceMode.SCATTER) {
            p.basePosition.add(p.velocity);
            if (isOutOfBounds(p.basePosition)) {
              p.velocity.multiplyScalar(-1);
            }
            p.targetPosition.copy(p.basePosition);
            p.mesh.rotation.x += p.rotationVelocity.x;
            p.mesh.rotation.y += p.rotationVelocity.y;
            p.mesh.rotation.z += p.rotationVelocity.z;
          } else if (modeRef.current === ExperienceMode.FOCUS) {
            // 聚焦照片已在模式切换时选择，这里直接使用
            if (p === focusedPhotoRef.current) {
              p.targetPosition.set(FOCUS_MODE_CONFIG.focusPosition.x, FOCUS_MODE_CONFIG.focusPosition.y, FOCUS_MODE_CONFIG.focusPosition.z);
              p.targetScale.set(FOCUS_MODE_CONFIG.focusScale, FOCUS_MODE_CONFIG.focusScale, FOCUS_MODE_CONFIG.focusScale);
            } else {
              p.targetPosition.copy(calculateBackgroundPosition(p.basePosition, FOCUS_MODE_CONFIG.backgroundDistanceMultiplier));
              p.targetScale.set(FOCUS_MODE_CONFIG.backgroundScaleMultiplier, FOCUS_MODE_CONFIG.backgroundScaleMultiplier, FOCUS_MODE_CONFIG.backgroundScaleMultiplier);
            }
          } else if (modeRef.current === ExperienceMode.TEXT) {
            // 文字模式逻辑
            // 只有非图片粒子，且在文字粒子数量范围内的，才参与组成文字
            // 图片粒子和多余的普通粒子在周围浮动
            
            // 注意：这里我们需要一个外部计数器来追踪已分配的文字粒子数量
            // 但由于 forEach 无法方便地共享外部计数器（在 React 闭包中），
            // 我们利用粒子数组的顺序：普通粒子在前，图片粒子在后。
            // 只要不是 PHOTO 类型，且索引在 textPositionsRef.current.length 范围内（近似），就可以分配。
            // 但为了更精确，我们还是应该用逻辑判断。
            
            // 更好的方式是：如果是 PHOTO，直接浮动。
            // 如果不是 PHOTO，看是否还有文字位置可用。
            // 由于我们无法在 forEach 中简单维护一个全局计数器（每一帧都会重置），
            // 我们可以利用 i 和 textPositionsRef.current.length 的关系，
            // 但因为中间可能夹杂 PHOTO（虽然目前逻辑是追加在末尾，但为了鲁棒性），
            // 我们假设普通粒子都在前部。
            
            const isPhoto = p.type === 'PHOTO';
            // 只有普通粒子才有可能成为文字
            // 且索引必须在文字位置数量范围内（假设普通粒子紧凑排列在前）
            // 如果后续有图片插入中间，这个逻辑可能略有偏差，但视觉上无伤大雅。
            // 为了更严谨，我们可以简单地判断：如果 i < textPositionsRef.current.length 且不是 PHOTO
            // 但 textPositionsRef.current.length 是 nonPhotoCount * 0.9
            // 所以只要 i < textPositionsRef.current.length，它大概率是普通粒子（因为图片在最后）。
            // 如果 i 处恰好是图片（极少见），它会浮动，导致文字少一个点，这也没关系。
            
            if (!isPhoto && i < textPositionsRef.current.length) {
              p.targetPosition.copy(textPositionsRef.current[i]);
              p.targetScale.set(0.5, 0.5, 0.5); // 稍微缩小粒子以适应文字细节
              
              // 确保使用高亮材质
              if (!p.mesh.userData.originalMaterial) {
                p.mesh.userData.originalMaterial = p.mesh.material;
              }
              p.mesh.material = textMat;
            } else {
              // 图片粒子，或者多余的普通粒子 -> 浮动模式
              // 恢复原始材质（如果是普通粒子）
              if (!isPhoto && p.mesh.userData.originalMaterial) {
                p.mesh.material = p.mesh.userData.originalMaterial;
              }
              
              // 浮动逻辑
              p.basePosition.add(p.velocity);
              if (isOutOfBounds(p.basePosition)) {
                p.velocity.multiplyScalar(-1);
              }
              p.targetPosition.copy(p.basePosition);
            }
          }

          // 平滑插值更新位置、旋转和缩放
          p.mesh.position.lerp(p.targetPosition, ANIMATION_CONFIG.positionLerpSpeed);
          p.mesh.rotation.x = THREE.MathUtils.lerp(p.mesh.rotation.x, p.targetRotation.x, ANIMATION_CONFIG.rotationLerpSpeed);
          p.mesh.rotation.y = THREE.MathUtils.lerp(p.mesh.rotation.y, p.targetRotation.y, ANIMATION_CONFIG.rotationLerpSpeed);
          p.mesh.rotation.z = THREE.MathUtils.lerp(p.mesh.rotation.z, p.targetRotation.z, ANIMATION_CONFIG.rotationLerpSpeed);
          p.mesh.scale.lerp(p.targetScale, ANIMATION_CONFIG.scaleLerpSpeed);
          
          // FOCUS模式下，聚焦的照片始终朝向相机（在lerp之后执行）
          if (modeRef.current === ExperienceMode.FOCUS && p === focusedPhotoRef.current) {
            p.mesh.lookAt(camera.position);
          }
        });

        composer.render();
      };

      animate();
      onLoaded();

      return () => {
        renderer.dispose();
        composer.dispose();
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    }, [onLoaded]);  // 只依赖 onLoaded，避免重新创建场景

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
  }
);

export default Scene3D;