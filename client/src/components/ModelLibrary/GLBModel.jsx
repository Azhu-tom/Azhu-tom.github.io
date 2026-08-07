import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';  // 使用drei的预构建Hook
import * as THREE from 'three';

/**
 * GLBModel - 真实GLB模型加载器（安全版本）
 *
 * Props:
 *   url: GLB文件URL
 *   scale: 缩放比例
 *   position: 位置 [x, y, z]
 *   rotation: 旋转 [x, y, z]
 *   autoRotate: 是否自动旋转
 *   onLoad: 加载完成回调
 *   onError: 错误回调
 */
export default function GLBModel({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  autoRotate = false,
  onLoad,
  onError,
}) {
  const meshRef = useRef();

  // 安全检查：如果没有URL，不尝试加载
  if (!url) {
    console.warn('⚠️ GLBModel: 未提供URL');
    return null;
  }

  return (
    <Suspense fallback={null}>
      <GLBModelInner
        url={url}
        scale={scale}
        position={position}
        rotation={rotation}
        autoRotate={autoRotate}
        onLoad={onLoad}
        onError={onError}
        meshRef={meshRef}
      />
    </Suspense>
  );
}

/**
 * 内部组件：实际的模型加载逻辑（必须被Suspense包裹）
 */
function GLBModelInner({
  url,
  scale,
  position,
  rotation,
  autoRotate,
  onLoad,
  onError,
  meshRef,
}) {
  // 使用drei的useGLTF（更安全，内置错误处理）
  const gltf = useGLTF(url);

  useEffect(() => {
    if (gltf && gltf.scene && meshRef.current) {
      try {
        // 调整模型大小和位置
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // 居中模型
        gltf.scene.position.sub(center);

        // 自动缩放到合适大小
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = (maxDim > 0) ? (2 / maxDim) : 1; // 目标最大尺寸为2单位
        gltf.scene.scale.setScalar(scaleFactor * scale);

        // 调整位置使其位于中心上方
        gltf.scene.position.y += (size.y * scaleFactor * scale) / 2;

        if (onLoad) {
          onLoad({
            vertices: countVertices(gltf.scene),
            faces: countFaces(gltf.scene),
          });
        }

        console.log('✅ GLB模型加载成功:', url);
      } catch (err) {
        console.error('❌ 模型后处理失败:', err);
        if (onError) onError(err);
      }
    }
  }, [gltf, scale, onLoad]);

  // 自动旋转动画
  useFrame((state, delta) => {
    if (autoRotate && meshRef.current && gltf?.scene) {
      meshRef.current.rotation.y += delta * 0.5; // 0.5 rad/s
    }
  });

  if (!gltf || !gltf.scene) {
    return null;
  }

  return (
    <group ref={meshRef} position={position} rotation={rotation}>
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}

/**
 * 计算场景中的顶点数
 */
function countVertices(object) {
  let count = 0;
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const posAttr = child.geometry.attributes.position;
      if (posAttr) count += posAttr.count;
    }
  });
  return count;
}

/**
 * 计算场景中的面数
 */
function countFaces(object) {
  let count = 0;
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const index = child.geometry.index;
      if (index) {
        count += index.count / 3;
      } else if (child.geometry.attributes.position) {
        count += child.geometry.attributes.position.count / 3;
      }
    }
  });
  return Math.floor(count);
}

export { countVertices, countFaces };
