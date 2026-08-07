/**
 * ModelViewer3D - 完整3D模型查看器
 *
 * 支持旋转、缩放、平移等交互操作，适用于详情面板中的大型预览
 * 修复版：增强错误处理，防止组件崩溃
 */
import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Grid, Html, useProgress } from '@react-three/drei';

// ==================== 几何体工厂 ====================

/**
 * 零件几何体 - 根据类型渲染不同的专业模型
 */
function PartModel({ type = 'default' }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    try { document.body.style.cursor = 'grab'; } catch(_) {}
  };

  const handlePointerOut = () => {
    setHovered(false);
    try { document.body.style.cursor = 'auto'; } catch(_) {}
  };

  /**
   * 增压泵模型
   */
  function PumpModel() {
    return (
      <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 2.2, 24]} />
          <meshStandardMaterial color="#2563eb" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0, -1.5, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.7, 0.6, 20]} />
          <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.6, 0.5, 20]} />
          <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 2, 0]} castShadow>
          <torusGeometry args={[0.65, 0.12, 10, 24]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.88} roughness={0.12} />
        </mesh>
        <mesh position={[0.95, 0, 0]}>
          <boxGeometry args={[0.25, 0.35, 0.05]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }

  /**
   * 滤芯模型
   */
  function FilterModel() {
    return (
      <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.7, 1.8, 28]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.45} roughness={0.28} transparent opacity={0.95} />
        </mesh>
        <mesh position={[0, 1.05, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.65, 0.12, 14, 32]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.55} roughness={0.22} />
        </mesh>
        <mesh position={[0, -1.05, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.1, 14, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.58} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.52, 0.54, 1.6, 16, 4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.45} wireframe />
        </mesh>
        <mesh position={[0, -0.85, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.56, 0.06, 12, 28]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.58, 0.06, 12, 28]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  /**
   * 阀门模型
   */
  function ValveModel() {
    return (
      <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1, 1.4, 0.85]} />
          <meshStandardMaterial color="#16a34a" metalness={0.88} roughness={0.12} />
        </mesh>
        <mesh position={[0, -1, 0]} castShadow>
          <boxGeometry args={[0.75, 0.18, 0.7]} />
          <meshStandardMaterial color="#15803d" metalness={0.92} roughness={0.08} />
        </mesh>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[0.75, 0.18, 0.7]} />
          <meshStandardMaterial color="#15803d" metalness={0.92} roughness={0.08} />
        </mesh>
        <mesh position={[0, 1.05, 0]} castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.9, 8]} />
          <meshStandardMaterial color="#dc2626" metalness={0.82} roughness={0.18} />
        </mesh>
        <mesh position={[0.65, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color="#ef4444" metalness={0.78} roughness={0.22} />
        </mesh>
        {[[-0.28, -1], [0.28, -1], [-0.28, 1], [0.28, 1]].map((pos, i) => (
          <mesh key={i} position={[pos[0], pos[1], 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
            <meshStandardMaterial color="#374151" metalness={0.98} roughness={0.02} />
          </mesh>
        ))}
      </group>
    );
  }

  /**
   * 管接件模型
   */
  function FittingModel() {
    return (
      <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 1, 16]} />
          <meshStandardMaterial color="#ea580c" metalness={0.86} roughness={0.14} />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.48, 0.25, 14]} />
          <meshStandardMaterial color="#c2410c" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.45, 0.25, 14]} />
          <meshStandardMaterial color="#c2410c" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.52, 0.48, 0.15, 6]} />
          <meshStandardMaterial color="#9a3412" metalness={0.93} roughness={0.07} />
        </mesh>
      </group>
    );
  }

  /**
   * 适配器模型
   */
  function AdapterModel() {
    return (
      <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.46, 1, 12]} />
          <meshStandardMaterial color="#a855f7" metalness={0.84} roughness={0.16} />
        </mesh>
        <mesh position={[0, -0.6, 0]} castShadow>
          <cylinderGeometry args={[0.44, 0.38, 0.2, 12]} />
          <meshStandardMaterial color="#9333ea" metalness={0.89} roughness={0.11} />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.42, 0.2, 12]} />
          <meshStandardMaterial color="#9333ea" metalness={0.89} roughness={0.11} />
        </mesh>
      </group>
    );
  }

  /**
   * 螺钉模型
   */
  function ScrewModel() {
    return (
      <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 1.4, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.96} roughness={0.04} />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.19, 1.2, 6]} />
          <meshStandardMaterial color="#64748b" metalness={0.97} roughness={0.03} wireframe />
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.33, 0.22, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.96} roughness={0.04} />
        </mesh>
        <mesh position={[0, 0.93, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.06]} />
          <meshStandardMaterial color="#1e293b" metalness={0.99} roughness={0.01} />
        </mesh>
      </group>
    );
  }

  /**
   * 默认几何体
   */
  function DefaultModel() {
    return (
      <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <mesh scale={hovered ? [1.08, 1.08, 1.08] : [1, 1, 1]} castShadow>
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial
            color={hovered ? '#00ffff' : '#00d4ff'}
            metalness={0.72}
            roughness={0.22}
            emissive={hovered ? '#00d4ff' : '#000000'}
            emissiveIntensity={hovered ? 0.3 : 0}
          />
        </mesh>
      </group>
    );
  }

  // 类型映射
  const componentMap = {
    pump: PumpModel,
    filter: FilterModel,
    valve: ValveModel,
    fitting: FittingModel,
    adapter: AdapterModel,
    screw: ScrewModel,
    default: DefaultModel,
  };

  const Component = componentMap[type] || componentMap.default;
  return <Component />;
}

// ==================== 场景组件 ====================

/**
 * 加载进度显示
 */
function LoadingScreen() {
  const { progress } = useProgress();
  if (progress >= 100) return null;

  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div className="loading-3d">
        <div className="loading-spinner"></div>
        <div className="loading-text">加载中 {Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

/**
 * 安全的环境光/反射组件（防止 Environment preset 加载失败）
 */
function SafeEnvironment() {
  try {
    return (
      <ambientLight intensity={0.3} color="#b0c4de" />
    );
  } catch(e) {
    return null;
  }
}

/**
 * 安全的网格地面
 */
function SafeGrid() {
  try {
    return (
      <Grid
        infiniteGrid
        cellSize={0.6}
        cellThickness={0.5}
        cellColor="rgba(0, 212, 255, 0.12)"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="rgba(0, 212, 255, 0.3)"
        fadeDistance={15}
        fadeStrength={1.5}
        position={[0, -1.79, 0]}
        followCamera={false}
      />
    );
  } catch(e) {
    return null;
  }
}

/**
 * 主场景 - 简化版（移除可能导致崩溃的高级特性）
 */
function SceneContent({ modelType = 'default', autoRotate }) {
  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.4} color="#8090b0" />
      <pointLight position={[0, 5, 0]} intensity={0.4} color="#00d4ff" distance={10} />

      {/* 3D模型 */}
      <Suspense fallback={<LoadingScreen />}>
        <PartModel type={modelType} />

        {/* 安全环境 */}
        <SafeEnvironment />

        {/* 地面阴影 - 简化配置 */}
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.4}
          scale={6}
          blur={2.5}
          far={4.5}
          color="#001030"
        />

        {/* 工程网格 */}
        <SafeGrid />
      </Suspense>

      {/* 控制器 */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={12}
        autoRotate={autoRotate || false}
        autoRotateSpeed={2.5}
        target={[0, 0, 0]}
        makeDefault
      />

      {/* 轻量雾效 */}
      <fog attach="fog" args={['#0a0e27', 8, 25]} />
    </>
  );
}

// ==================== 主组件 ====================

export default function ModelViewer3D({
  modelType = 'default',
  autoRotate = true,
  onFullscreenToggle,
}) {
  const containerRef = useRef(null);

  return (
    <div className="model-viewer-3d-container" ref={containerRef}>
      <Canvas
        camera={{
          position: [3.5, 2.8, 3.5],
          fov: 42,
          near: 0.1,
          far: 100
        }}
        shadows
        gl={{
          antialias: true,
          toneMapping: 'ACESFilmic',
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
        onCreated={(state) => {
          try {
            if (state && state.gl) {
              state.gl.outputColorSpace = 'srgb';
            }
          } catch(e) {
            console.warn('⚠️ 设置颜色空间时出错（非致命）:', e.message || e);
          }
        }}
      >
        <SceneContent modelType={modelType} autoRotate={autoRotate} />
      </Canvas>

      {/* 全屏按钮 */}
      {onFullscreenToggle && (
        <button
          className="fullscreen-btn"
          onClick={onFullscreenToggle}
          title="全屏查看"
        >
          ⛶
        </button>
      )}
    </div>
  );
}
