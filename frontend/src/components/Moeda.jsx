import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import { Canvas } from '@react-three/fiber'
import Coin from './Coin'
import { OrbitControls } from '@react-three/drei'

const Coin3D = forwardRef(({onStop}, ref) => {
  const coinRef = useRef()

  useImperativeHandle(ref, () => ({
    jogarMoeda: (lado) => {
      coinRef.current?.jogarMoeda(lado)
    }
  }))

  return (
    <Canvas 
      shadows
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ height: '500px', background: '#fff' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={5} color="#ffffff" />
      <directionalLight castShadow position={[5, 10, 7]} intensity={1} />
      <directionalLight position={[-5, 5, 3]} intensity={0.9} color="#ffffee" />
      <directionalLight position={[0, 0, -5]} intensity={0.7} color="#ffffff" />

      <Coin 
      ref={coinRef}
      onStop={(lado) => {
        onStop(lado)
      }} 
      position={[0, 0, 0]} 
      rotation={[0, Math.PI / 2, Math.PI / 2]} />
      <OrbitControls></OrbitControls>
    </Canvas>
  )
})

export default Coin3D
