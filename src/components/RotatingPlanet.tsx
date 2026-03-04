import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const Planet = () => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x += delta * 0.03;
    }
  });

  return (
    <group>
      {/* Main planet */}
      <Sphere ref={meshRef} args={[2.2, 64, 64]}>
        <MeshDistortMaterial
          color="#003845"
          emissive="#00E5FF"
          emissiveIntensity={0.15}
          roughness={0.7}
          metalness={0.3}
          distort={0.25}
          speed={1.5}
        />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere args={[2.45, 64, 64]}>
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer glow */}
      <Sphere args={[2.8, 32, 32]}>
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

const RotatingPlanet = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, -3, 5]} intensity={0.4} color="#00E5FF" />
      <pointLight position={[3, 5, -5]} intensity={0.2} color="#4455ff" />
      <Planet />
    </Canvas>
  );
};

export default RotatingPlanet;
