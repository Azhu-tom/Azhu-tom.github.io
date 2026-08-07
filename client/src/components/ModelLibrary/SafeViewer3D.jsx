/**
 * SafeViewer3D - 安全版3D模型查看器
 *
 * 设计原则:
 * 1. 仅使用 @react-three/fiber 核心 API，不依赖 drei
 * 2. 纯程序化几何体（不加载外部文件）
 * 3. 内置错误边界降级
 * 4. 最小化依赖，最大化稳定性
 */

import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'

// ==================== 几何体模型 ====================

function ModelGeometry({ type = 'default' }) {
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005
    }
  })

  // 增压泵
  if (type === 'pump') {
    return (
      <group ref={groupRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 2.0, 20]} />
          <meshStandardMaterial color="#2563eb" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0, -1.35, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.65, 0.5, 18]} />
          <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.35, 0]} castShadow>
          <cylinderGeometry args={[0.65, 0.55, 0.45, 18]} />
          <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <torusGeometry args={[0.6, 0.1, 8, 20]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.88} roughness={0.12} />
        </mesh>
      </group>
    )
  }

  // 滤芯
  if (type === 'filter') {
    return (
      <group ref={groupRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.6, 0.6, 1.6, 24]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.4} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <torusGeometry args={[0.55, 0.1, 12, 28]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.55} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.9, 0]}>
          <torusGeometry args={[0.52, 0.08, 12, 28]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.58} roughness={0.2} />
        </mesh>
      </group>
    )
  }

  // 阀门
  if (type === 'valve') {
    return (
      <group ref={groupRef}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.2, 0.75]} />
          <meshStandardMaterial color="#16a34a" metalness={0.88} roughness={0.12} />
        </mesh>
        <mesh position={[0, -0.85, 0]} castShadow>
          <boxGeometry args={[0.68, 0.15, 0.62]} />
          <meshStandardMaterial color="#15803d" metalness={0.92} roughness={0.08} />
        </mesh>
        <mesh position={[0, 0.85, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
          <meshStandardMaterial color="#dc2626" metalness={0.82} roughness={0.18} />
        </mesh>
        <mesh position={[0.55, 0.85, 0]} castShadow>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshStandardMaterial color="#ef4444" metalness={0.78} roughness={0.22} />
        </mesh>
      </group>
    )
  }

  // 管接件
  if (type === 'fitting') {
    return (
      <group ref={groupRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.9, 14]} />
          <meshStandardMaterial color="#ea580c" metalness={0.86} roughness={0.14} />
        </mesh>
        <mesh position={[0, 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.44, 0.22, 12]} />
          <meshStandardMaterial color="#c2410c" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <cylinderGeometry args={[0.44, 0.38, 0.22, 12]} />
          <meshStandardMaterial color="#c2410c" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    )
  }

  // 适配器/堵头
  if (type === 'adapter') {
    return (
      <group ref={groupRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.34, 0.42, 0.9, 12]} />
          <meshStandardMaterial color="#a855f7" metalness={0.84} roughness={0.16} />
        </mesh>
        <mesh position={[0, -0.54, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.34, 0.18, 12]} />
          <meshStandardMaterial color="#9333ea" metalness={0.89} roughness={0.11} />
        </mesh>
        <mesh position={[0, 0.54, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.38, 0.18, 12]} />
          <meshStandardMaterial color="#9333ea" metalness={0.89} roughness={0.11} />
        </mesh>
      </group>
    )
  }

  // 螺钉/卡环
  if (type === 'screw') {
    return (
      <group ref={groupRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.2, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.96} roughness={0.04} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.3, 0.2, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.96} roughness={0.04} />
        </mesh>
      </group>
    )
  }

  // 默认：通用零件（圆角方块+圆柱组合）
  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.6, 0.5]} />
        <meshStandardMaterial color="#00d4ff" metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[0.5, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 12]} />
        <meshStandardMaterial color="#0891b2" metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh position={[-0.5, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 12]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.15} />
      </mesh>
    </group>
  )
}

// ==================== 场景内容（无drei依赖） ====================

function SceneContent({ modelType }) {
  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} />
      <directionalLight position={[-3, 4, -3]} intensity={0.25} color="#8090b0" />

      {/* 模型 */}
      <ModelGeometry type={modelType} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#0c1424" transparent opacity={0.7} />
      </mesh>

      {/* 网格辅助线 */}
      <gridHelper args={[10, 20, '#1a365d', '#0d1525']} position={[0, -1.49, 0]} />
    </>
  )
}

// ==================== 主组件（含错误边界） ====================

export default function SafeViewer3D({ modelType = 'default', autoRotate = true }) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (hasError) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg, #0c1225, #141a33)',
        color: '#94a3b8',
        gap: '16px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div style={{ fontSize: '15px', fontWeight: 600 }}>3D引擎加载失败</div>
        <div style={{ fontSize: '13px', opacity: 0.7 }}>{errorMessage}</div>
        <div style={{ fontSize: '12px', opacity: 0.5 }}>可能原因：浏览器不支持WebGL / GPU加速未开启</div>

        {/* 降级：显示静态图标 */}
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0891b2 100%)',
            fontSize: '48px',
            margin: '0 auto 12px'
          }}>
            {modelType === 'pump' ? '💧' :
             modelType === 'filter' ? '🛡️' :
             modelType === 'valve' ? '🔄' :
             modelType === 'fitting' ? '🔧' :
             modelType === 'adapter' ? '🔌' :
             modelType === 'screw' ? '⚙️' : '🔷'}
          </div>
          <div style={{ fontSize: '13px' }}>静态预览模式</div>
          <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
            拖动旋转 • 滚轮缩放（需启用3D）
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary onError={(msg) => { setHasError(true); setErrorMessage(msg) }}>
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas
          camera={{
            position: [3, 2.5, 3],
            fov: 42,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
          }}
          dpr={[1, 1.5]}
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #0a1020 0%, #101830 50%, #0c1225 100%)'
          }}
        >
          <SceneContent modelType={modelType} />
        </Canvas>
      </div>
    </ErrorBoundary>
  )
}

// ==================== 错误边界组件 ====================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error?.message || String(error) }
  }

  componentDidCatch(error, info) {
    console.error('SafeViewer3D Error:', error, info)
    this.props.onError?.(error.message)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null
    }
    return this.props.children
  }
}
