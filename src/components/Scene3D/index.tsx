import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ExperienceMode, type HandData, type ParticleItem } from '@typings/index';
import { SCENE_CONFIG, LIGHTING_CONFIG, LIGHT_POSITIONS, LIGHT_COLORS, POST_PROCESSING_CONFIG, ANIMATION_CONFIG, RENDERER_CONFIG } from '@config/scene.config';
import { PARTICLE_CONFIG, PARTICLE_SIZES, MATERIAL_COLORS, TREE_MODE_CONFIG, SCATTER_MODE_CONFIG, FOCUS_MODE_CONFIG } from '@config/particles.config';
import { createCandyCaneTexture, createDefaultPhotoTexture, createTextureFromImage } from '@utils/textureGenerator';
import { calculateTreePosition, calculateScatterPosition, calculateRandomVelocity, calculateRandomRotationVelocity, applyTreeRotation, isOutOfBounds, calculateBackgroundPosition } from '@utils/geometryCalculator';

interface Scene3DProps {
  mode: ExperienceMode;
  hand: HandData;
  onLoaded: () => void;
}

const Scene3D = forwardRef<{ addPhoto: (dataUrl: string) => void }, Scene3DProps>(
  ({ mode, hand, onLoaded }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<ParticleItem[]>([]);
    const photoParticlesRef = useRef<ParticleItem[]>([]);
    const focusedPhotoRef = useRef<ParticleItem | null>(null);
    const mainGroupRef = useRef<THREE.Group | null>(null);
    const previousModeRef = useRef<ExperienceMode>(mode);
    const addPhotoToSceneRef = useRef<((texture: THREE.Texture) => void) | null>(null);
    
    // 使用 ref 存储最新的 hand 和 mode 值，避免重新创建场景
    const handRef = useRef<HandData>(hand);
    const modeRef = useRef<ExperienceMode>(mode);
    
    // 每次渲染时更新 ref
    handRef.current = hand;
    modeRef.current = mode;

    useImperativeHandle(ref, () => ({
      addPhoto: async (dataUrl: string) => {
        try {
          const texture = await createTextureFromImage(dataUrl);
          if (addPhotoToSceneRef.current) {
            addPhotoToSceneRef.current(texture);
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

      const addPhotoToScene = (texture: THREE.Texture) => {
        const frameGeo = new THREE.BoxGeometry(PARTICLE_SIZES.photo.width, PARTICLE_SIZES.photo.height, PARTICLE_SIZES.photo.depth);
        const photoGeo = new THREE.PlaneGeometry(PARTICLE_SIZES.photo.width - 0.2, PARTICLE_SIZES.photo.height - 0.2);
        const frameMesh = new THREE.Mesh(frameGeo, goldMat);
        const photoMesh = new THREE.Mesh(photoGeo, new THREE.MeshBasicMaterial({ map: texture }));
        photoMesh.position.z = 0.11;
        frameMesh.add(photoMesh);

        const basePos = calculateScatterPosition();
        frameMesh.position.copy(basePos);

        const particle: ParticleItem = {
          mesh: frameMesh,
          type: 'PHOTO',
          targetPosition: basePos.clone(),
          basePosition: basePos.clone(),
          treePosition: calculateTreePosition(particlesRef.current.length, PARTICLE_CONFIG.mainParticleCount),
          targetRotation: new THREE.Euler(),
          targetScale: new THREE.Vector3(1, 1, 1),
          velocity: calculateRandomVelocity(),
          rotationVelocity: calculateRandomRotationVelocity(),
        };

        particlesRef.current.push(particle);
        photoParticlesRef.current.push(particle);
        mainGroup.add(frameMesh);
      };

      // 将函数存储到 ref 中，供外部调用
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

      addPhotoToScene(createDefaultPhotoTexture());

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
        if (modeRef.current !== previousModeRef.current) {
          previousModeRef.current = modeRef.current;
          if (modeRef.current === ExperienceMode.FOCUS) {
            // 进入FOCUS模式时选择新照片
            if (photoParticlesRef.current.length > 0) {
              focusedPhotoRef.current = photoParticlesRef.current[Math.floor(Math.random() * photoParticlesRef.current.length)];
            }
          } else {
            // 离开FOCUS模式时清空聚焦照片
            focusedPhotoRef.current = null;
          }
        }

        // 手势控制场景旋转（与原始HTML完全一致的映射逻辑）
        const targetRotationY = handRef.current.position.x * ANIMATION_CONFIG.gestureRotationSensitivity;
        const targetRotationX = handRef.current.position.y * (ANIMATION_CONFIG.gestureRotationSensitivity * 0.5);
        
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

        particlesRef.current.forEach((p) => {
          if (modeRef.current === ExperienceMode.TREE) {
            p.targetPosition.copy(applyTreeRotation(p.treePosition, time));
            p.targetScale.set(1, 1, 1);
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
          }

          p.mesh.position.lerp(p.targetPosition, ANIMATION_CONFIG.positionLerpSpeed);
          p.mesh.scale.lerp(p.targetScale, ANIMATION_CONFIG.scaleLerpSpeed);
          
          // FOCUS模式下，聚焦的照片始终朝向相机（在lerp之后执行）
          if (modeRef.current === ExperienceMode.FOCUS && p === focusedPhotoRef.current) {
            p.mesh.lookAt(camera.position);
          }
        });

        composer.render();
      };

      animate();

      setTimeout(() => onLoaded(), 1000);

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        composer.dispose();
      };
    }, [onLoaded]);  // 只依赖 onLoaded，避免重新创建场景

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
  }
);

export default Scene3D;