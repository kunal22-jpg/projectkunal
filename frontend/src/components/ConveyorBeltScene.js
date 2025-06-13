import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, Plane, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Simple sound effect for transformation
const createSparkSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.log('Audio not available');
  }
};

// Individual cube component
const MovingCube = ({ position, cubeIndex }) => {
  const meshRef = useRef();
  const [hasTransformed, setHasTransformed] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Move along the conveyor belt
      meshRef.current.position.z += 0.02;
      
      // Reset position when cube goes off screen
      if (meshRef.current.position.z > 15) {
        meshRef.current.position.z = -15;
        setHasTransformed(false);
      }
      
      // Check for transformation at the energy screen
      if (meshRef.current.position.z > -0.5 && meshRef.current.position.z < 0.5 && !hasTransformed) {
        setHasTransformed(true);
        createSparkSound();
      }
      
      // Apply transformation effects
      if (hasTransformed) {
        // Add floating motion for robot cubes
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + cubeIndex) * 0.03;
        // Add rotation for robot cubes
        meshRef.current.rotation.y += 0.01;
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Box args={[0.8, 0.8, 0.8]} castShadow receiveShadow>
        <meshStandardMaterial
          color={hasTransformed ? '#4f46e5' : '#6b7280'}
          metalness={0.8}
          roughness={hasTransformed ? 0.2 : 0.4}
          emissive={hasTransformed ? '#1e1b4b' : '#000000'}
          emissiveIntensity={hasTransformed ? 0.3 : 0}
        />
      </Box>
      
      {/* AI Robot features */}
      {hasTransformed && (
        <group>
          {/* Glowing eyes */}
          <Sphere args={[0.05]} position={[-0.2, 0.2, 0.4]}>
            <meshBasicMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
          </Sphere>
          <Sphere args={[0.05]} position={[0.2, 0.2, 0.4]}>
            <meshBasicMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
          </Sphere>
          
          {/* Antennas */}
          <Box args={[0.02, 0.6, 0.02]} position={[-0.3, 0.7, 0]}>
            <meshStandardMaterial color="#ffffff" emissive="#4f46e5" emissiveIntensity={0.8} />
          </Box>
          <Box args={[0.02, 0.6, 0.02]} position={[0.3, 0.7, 0]}>
            <meshStandardMaterial color="#ffffff" emissive="#4f46e5" emissiveIntensity={0.8} />
          </Box>
          
          {/* Electric sparks */}
          <ElectricSparks position={[-0.3, 1, 0]} />
          <ElectricSparks position={[0.3, 1, 0]} />
        </group>
      )}
    </group>
  );
};

// Electric sparks component
const ElectricSparks = ({ position }) => {
  const sparkGroupRef = useRef();
  
  useFrame((state) => {
    if (sparkGroupRef.current) {
      sparkGroupRef.current.children.forEach((spark, i) => {
        if (spark.material) {
          spark.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 8 + i) * 0.3;
        }
      });
    }
  });
  
  return (
    <group ref={sparkGroupRef} position={position}>
      {[...Array(6)].map((_, i) => (
        <Sphere key={i} args={[0.01]} position={[
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.1
        ]}>
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </Sphere>
      ))}
    </group>
  );
};

// Energy screen component
const EnergyScreen = ({ onClick, onHover, isHovered }) => {
  const screenRef = useRef();
  const [sparkles] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 3.5,
      y: (Math.random() - 0.5) * 5.5,
      z: (Math.random() - 0.5) * 0.2,
    }))
  );
  
  useFrame((state) => {
    if (screenRef.current) {
      screenRef.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]} onClick={onClick} onPointerEnter={onHover} onPointerLeave={onHover}>
      {/* Main energy screen */}
      <Plane ref={screenRef} args={[4, 6]} rotation={[0, 0, 0]}>
        <meshBasicMaterial
          color="#0088ff"
          transparent
          opacity={0.5}
        />
      </Plane>
      
      {/* Energy sparkles */}
      {sparkles.map((sparkle) => (
        <Sphere key={sparkle.id} args={[0.02]} position={[sparkle.x, sparkle.y, sparkle.z]}>
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </Sphere>
      ))}
      
      {/* Hover indicator */}
      {isHovered && (
        <Text
          position={[0, 3.5, 0.1]}
          fontSize={0.3}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          🤖 Click to Chat with AI
        </Text>
      )}
    </group>
  );
};

// Conveyor belt component
const ConveyorBelt = () => {
  const beltRef = useRef();
  
  useFrame(() => {
    if (beltRef.current && beltRef.current.material.map) {
      beltRef.current.material.map.offset.z += 0.02;
    }
  });
  
  const beltTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create metallic belt pattern
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, '#2d3748');
    gradient.addColorStop(0.5, '#4a5568');
    gradient.addColorStop(1, '#2d3748');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add rivets
    ctx.fillStyle = '#1a202c';
    for (let i = 0; i < 256; i += 32) {
      ctx.fillRect(i - 2, 125, 4, 6);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10);
    return texture;
  }, []);
  
  return (
    <Plane ref={beltRef} args={[30, 4]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <meshStandardMaterial
        map={beltTexture}
        metalness={0.8}
        roughness={0.3}
      />
    </Plane>
  );
};

// Main scene component
const Scene = ({ onEnergyScreenClick }) => {
  const { camera } = useThree();
  const [cubes] = useState(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      position: [0, 0, -15 + i * 4],
    }))
  );
  const [isEnergyScreenHovered, setIsEnergyScreenHovered] = useState(false);
  
  useEffect(() => {
    // Position camera for diagonal overhead view
    camera.position.set(10, 8, 12);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  const handleEnergyScreenHover = () => {
    setIsEnergyScreenHovered(!isEnergyScreenHovered);
  };

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8} 
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 5, 0]} intensity={1} color="#0088ff" />
      
      {/* Floor */}
      <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <meshStandardMaterial
          color="#1a202c"
          metalness={0.9}
          roughness={0.1}
        />
      </Plane>
      
      {/* Conveyor belt */}
      <ConveyorBelt />
      
      {/* Moving cubes */}
      {cubes.map((cube, index) => (
        <MovingCube
          key={cube.id}
          position={cube.position}
          cubeIndex={index}
        />
      ))}
      
      {/* Energy transformation screen */}
      <EnergyScreen
        onClick={onEnergyScreenClick}
        onHover={handleEnergyScreenHover}
        isHovered={isEnergyScreenHovered}
      />
    </group>
  );
};

// Main component
const ConveyorBeltScene = ({ onChatOpen }) => {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900/10 to-slate-900 relative">
      {/* TRACITY Header */}
      <motion.div
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold gradient-text">
            TRACITY
          </h1>
        </div>
        <p className="text-xl text-slate-300 text-center">
          Your AI Data Companion
        </p>
      </motion.div>
      
      {/* 3D Scene */}
      <Canvas 
        shadows
        camera={{ fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene onEnergyScreenClick={onChatOpen} />
      </Canvas>
      
      {/* Instructions */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <div className="bg-slate-900/70 backdrop-blur-md border border-purple-500/30 rounded-lg px-6 py-3">
          <p className="text-slate-300 text-sm text-center">
            Watch the transformation • Click the blue screen to chat with AI
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ConveyorBeltScene;