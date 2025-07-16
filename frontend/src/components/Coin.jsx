import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'


const Coin = forwardRef((props, ref) => {
  const meshRef = useRef()
  const [caraTexture, coroaTexture] = useTexture([
    '/textures/cara.png',
    '/textures/coroa.png'
  ])

  const rotationSpeed = useRef(0)
  const targetRotation = useRef(null)
  const direction = useRef(1)

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (targetRotation.current !== null) {
        const currentY = meshRef.current.rotation.y
        const diff = targetRotation.current - currentY

        if (Math.abs(diff) > 0.01) {
          meshRef.current.rotation.y += diff * 0.05
        } else {
          meshRef.current.rotation.y = targetRotation.current
          targetRotation.current = null
          rotationSpeed.current = 0
          // Chama o callback quando a moeda para
          if (props.onStop) {
            const lado = Math.abs(meshRef.current.rotation.y % (2 * Math.PI)) < Math.PI/2 ? "coroa" : "cara"
            props.onStop(lado)
          }
        }
      } else {
        meshRef.current.rotation.y += rotationSpeed.current * delta
      }
    }
  })

  useImperativeHandle(ref, () => ({
    jogarMoeda: (lado = "cara") => {
      // Gira várias vezes (entre 4 e 7 rotações completas)
      const voltas = Math.floor(Math.random() * 30 + 4)
      let destino = -Math.PI / 2

      // lado "cara" (material-0) deve parar em frente, portanto 0 rad
      // lado "coroa" (material-2) está oposto, então π rad
      if (lado === "coroa") {
        destino = Math.PI / 2;
      }

      // Aponta o destino com múltiplas voltas
      targetRotation.current = 2 * Math.PI * voltas + destino
      rotationSpeed.current = 10 // velocidade inicial
    }
  }))

  return (
    <mesh ref={meshRef} castShadow receiveShadow {...props}>
      <cylinderGeometry args={[1, 1, 0.2, 64]} />
      
      {/* Topo - Cara */}
      <meshStandardMaterial
        attach="material-1"
        map={coroaTexture}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={0.5}
      />
      
      {/* Base - Coroa */}
      <meshStandardMaterial
        attach="material-0"
        color="#c9b037"
        metalness={0.9}
        roughness={0.3}
      />
      
      {/* Lateral - Borda */}
      <meshStandardMaterial
        attach="material-2"
        map={caraTexture}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={0.5}
      />
    </mesh>
  )
})

export default Coin
