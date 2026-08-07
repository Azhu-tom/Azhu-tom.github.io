/**
 * Thumbnail3D - 轻量级3D缩略图组件
 *
 * 在表格/列表中显示小型3D模型预览，支持自动旋转
 * 修复版：精简依赖，提高稳定性
 */
import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * 几何体工厂 - 根据零件类型返回对应形状
 */
function PartGeometry({ type = 'default' }) {
  const meshRef = useRef();

  // 自动旋转动画
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.015;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  // 根据类型选择几何体和材质颜色
  const getGeometryAndMaterial = () => {
    const configs = {
      pump: {
        geometry: (
          <group>
            <mesh ref={meshRef}>
              <cylinderGeometry args={[0.4, 0.4, 1.2, 16]} />
              <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.7, 0]}>
              <cylinderGeometry args={[0.35, 0.5, 0.4, 16]} />
              <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )
      },
      filter: {
        geometry: (
          <group>
            <mesh ref={meshRef}>
              <cylinderGeometry args={[0.45, 0.45, 1, 24]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.25, 0.08, 12, 24]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        )
      },
      valve: {
        geometry: (
          <group>
            <mesh ref={meshRef}>
              <boxGeometry args={[0.4, 0.8, 0.4]} />
              <meshStandardMaterial color="#22c55e" metalness={0.85} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} />
              <meshStandardMaterial color="#dc2626" metalness={0.75} roughness={0.2} />
            </mesh>
          </group>
        )
      },
      fitting: {
        geometry: (
          <group>
            <mesh ref={meshRef}>
              <cylinderGeometry args={[0.3, 0.3, 0.6, 12]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.82} roughness={0.18} />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <cylinderGeometry args={[0.38, 0.32, 0.2, 12]} />
              <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.12} />
            </mesh>
          </group>
        )
      },
      adapter: {
        geometry: (
          <mesh ref={meshRef}>
            <cylinderGeometry args={[0.28, 0.35, 0.7, 10]} />
            <meshStandardMaterial color="#a855f7" metalness={0.83} roughness={0.17} />
          </mesh>
        )
      },
      screw: {
        geometry: (
          <group>
            <mesh ref={meshRef}>
              <cylinderGeometry args={[0.18, 0.18, 0.8, 6]} />
              <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.05} />
            </mesh>
            <mesh position={[0, 0.48, 0]}>
              <boxGeometry args={[0.36, 0.12, 0.08]} />
              <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.05} />
            </mesh>
          </group>
        )
      },
      default: {
        geometry: (
          <mesh ref={meshRef}>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#00d4ff" metalness={0.7} roughness={0.25} wireframe={false} />
          </mesh>
        )
      },
    };

    return configs[type] || configs.default;
  };

  const { geometry } = getGeometryAndMaterial();

  return geometry;
}

/**
 * 加载指示器
 */
function Loader() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#141832',
    }}>
      <span style={{ color: '#607d8b', fontSize: '11px' }}>3D</span>
    </div>
  );
}

/**
 * 主组件 - Thumbnail3D（精简版）
 */
export default function Thumbnail3D({ modelType = 'default', size = 64 }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '6px',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #141832 0%, #1a2050 100%)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.6)';
        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Canvas
        camera={{ position: [2, 1.8, 2], fov: 35, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 3]} intensity={0.9} castShadow />
        <pointLight position={[-2, 2, -2]} intensity={0.3} color="#00d4ff" />

        <Suspense fallback={<Loader />}>
          <PartGeometry type={modelType} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={5} />
        </Suspense>

        {/* 网格地面 */}
        <gridHelper args={[3, 6, 'rgba(0,212,255,0.1)', 'rgba(0,212,255,0.05)']} position={[0, -0.8, 0]} />
      </Canvas>
    </div>
  );
}
