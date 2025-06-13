import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, Plane, Text, Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Enhanced sound effects
const createSparkSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for richer sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Mix the oscillators
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Electric spark characteristics
    oscillator1.type = 'sawtooth';
    oscillator2.type = 'square';
    oscillator3.type = 'triangle';
    
    // Different frequencies for harmonic richness
    oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.08);
    
    oscillator2.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.1);
    
    oscillator3.frequency.setValueAtTime(2400, audioContext.currentTime);
    oscillator3.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.06);
    
    // Subtle volume for non-intrusive effect
    gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime + 0.01);
    oscillator3.start(audioContext.currentTime + 0.005);
    
    oscillator1.stop(audioContext.currentTime + 0.12);
    oscillator2.stop(audioContext.currentTime + 0.13);
    oscillator3.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Fail silently if audio context is not available
    console.log('Audio not available');
  }
};

// Individual cube component
const MovingCube = ({ position, isTransformed, transformProgress, onTransform, cubeIndex }) => {
  const meshRef = useRef();
  const [hasTransformed, setHasTransformed] = useState(false);
  const [transformationPhase, setTransformationPhase] = useState(0);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Move along the conveyor belt
      meshRef.current.position.z += 0.015; // Slightly slower for better observation
      
      // Reset position when cube goes off screen
      if (meshRef.current.position.z > 15) {
        meshRef.current.position.z = -15;
        setHasTransformed(false);
        setTransformationPhase(0);
      }
      
      // Check for transformation at the energy screen
      if (meshRef.current.position.z > -0.5 && meshRef.current.position.z < 0.5 && !hasTransformed) {
        setHasTransformed(true);
        setTransformationPhase(1);
        onTransform();
        // Delayed sound effect for variety
        setTimeout(() => createSparkSound(), cubeIndex * 100);
      }
      
      // Apply transformation effects
      if (hasTransformed) {
        // Smooth floating motion for AI robots
        const floatOffset = Math.sin(state.clock.elapsedTime * 3 + cubeIndex) * 0.03;
        meshRef.current.position.y = position[1] + floatOffset;
        
        // Gentle rotation for robot cubes
        meshRef.current.rotation.y += 0.008;
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        
        // Color transition effect
        if (transformationPhase < 2) {
          setTransformationPhase(prev => Math.min(prev + 0.02, 2));
        }
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Box args={[0.8, 0.8, 0.8]}>
        <meshStandardMaterial
          color={hasTransformed ? 
            `hsl(${240 + Math.sin(transformationPhase * Math.PI) * 30}, 70%, ${50 + transformationPhase * 10}%)` : 
            '#6b7280'
          }
          metalness={0.9}
          roughness={hasTransformed ? 0.1 : 0.3}
          emissive={hasTransformed ? '#1e1b4b' : '#000000'}
          emissiveIntensity={hasTransformed ? 0.2 + Math.sin(transformationPhase * Math.PI) * 0.1 : 0}
        />
      </Box>
      
      {/* AI Robot features */}
      {hasTransformed && (
        <group>
          {/* Glowing eyes */}
          <Sphere args={[0.06]} position={[-0.2, 0.2, 0.4]}>
            <meshBasicMaterial 
              color="#00ffff" 
              emissive="#00ffff"
              emissiveIntensity={0.8 + Math.sin(transformationPhase * Math.PI * 4) * 0.2}
            />
          </Sphere>
          <Sphere args={[0.06]} position={[0.2, 0.2, 0.4]}>
            <meshBasicMaterial 
              color="#00ffff" 
              emissive="#00ffff"
              emissiveIntensity={0.8 + Math.sin(transformationPhase * Math.PI * 4) * 0.2}
            />
          </Sphere>
          
          {/* Enhanced antennas with energy flow */}
          <Box args={[0.03, 0.6, 0.03]} position={[-0.3, 0.7, 0]}>
            <meshStandardMaterial 
              color="#ffffff" 
              emissive="#4f46e5" 
              emissiveIntensity={0.6 + Math.sin(transformationPhase * Math.PI * 6) * 0.3} 
            />
          </Box>
          <Box args={[0.03, 0.6, 0.03]} position={[0.3, 0.7, 0]}>
            <meshStandardMaterial 
              color="#ffffff" 
              emissive="#4f46e5" 
              emissiveIntensity={0.6 + Math.sin(transformationPhase * Math.PI * 6) * 0.3} 
            />
          </Box>
          
          {/* Enhanced electric sparks with animation */}
          <ElectricSparks position={[-0.3, 1, 0]} phase={transformationPhase} />
          <ElectricSparks position={[0.3, 1, 0]} phase={transformationPhase} />
          
          {/* Energy core in center */}
          <Sphere args={[0.15]} position={[0, 0, 0]}>
            <meshBasicMaterial 
              color="#4f46e5" 
              transparent 
              opacity={0.6}
              emissive="#4f46e5"
              emissiveIntensity={0.4 + Math.sin(transformationPhase * Math.PI * 8) * 0.2}
            />
          </Sphere>
        </group>
      )}
    </group>
  );
};

// Enhanced electric sparks component
const ElectricSparks = ({ position, phase = 1 }) => {
  const sparkGroupRef = useRef();
  const sparks = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      offset: [
        (Math.random() - 0.5) * 0.15,
        Math.random() * 0.15,
        (Math.random() - 0.5) * 0.15
      ],
      delay: i * 0.1,
      intensity: 0.7 + Math.random() * 0.3
    })), []
  );
  
  useFrame((state) => {
    if (sparkGroupRef.current) {
      // Animate the entire spark group
      sparkGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 4) * 0.2;
      
      // Animate individual sparks
      sparkGroupRef.current.children.forEach((spark, i) => {
        if (spark.material) {
          const sparkData = sparks[i];
          const time = state.clock.elapsedTime * 12 + sparkData.delay;
          spark.material.opacity = (0.4 + Math.sin(time) * 0.4) * sparkData.intensity * phase;
          spark.position.y = sparkData.offset[1] + Math.sin(time * 0.8) * 0.05;
          spark.scale.setScalar(0.5 + Math.sin(time * 1.5) * 0.3);
        }
      });
    }
  });
  
  return (
    <group ref={sparkGroupRef} position={position}>
      {sparks.map((spark) => (
        <Sphere key={spark.id} args={[0.01]} position={spark.offset}>
          <meshBasicMaterial 
            color="#00ffff" 
            transparent 
            opacity={0.8}
            emissive="#00ffff"
            emissiveIntensity={1}
          />
        </Sphere>
      ))}
      
      {/* Energy tendrils */}
      {Array.from({ length: 3 }, (_, i) => (
        <Box 
          key={`tendril-${i}`} 
          args={[0.005, 0.1, 0.005]} 
          position={[
            Math.sin(i * Math.PI * 2 / 3) * 0.08,
            i * 0.03,
            Math.cos(i * Math.PI * 2 / 3) * 0.08
          ]}
        >
          <meshBasicMaterial 
            color="#8b5cf6" 
            transparent 
            opacity={0.6}
            emissive="#8b5cf6"
            emissiveIntensity={0.8}
          />
        </Box>
      ))}
    </group>
  );
};

// Enhanced energy screen component
const EnergyScreen = ({ onClick, onHover, isHovered }) => {
  const screenRef = useRef();
  const effectsRef = useRef();
  const [sparkles, setSparkles] = useState([]);
  const [energyWaves, setEnergyWaves] = useState([]);
  
  useEffect(() => {
    // Generate sparkle positions
    const newSparkles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 3.5,
      y: (Math.random() - 0.5) * 5.5,
      z: (Math.random() - 0.5) * 0.2,
      speed: 0.5 + Math.random() * 1.5,
      size: 0.01 + Math.random() * 0.02
    }));
    setSparkles(newSparkles);
    
    // Generate energy wave positions
    const newWaves = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      y: -2.5 + i * 1,
      delay: i * 0.3
    }));
    setEnergyWaves(newWaves);
  }, []);
  
  useFrame((state) => {
    if (screenRef.current) {
      // Dynamic opacity with breathing effect
      const breathe = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      screenRef.current.material.transmission = 0.85 + breathe;
      screenRef.current.material.thickness = 0.1 + breathe * 0.05;
    }
    
    if (effectsRef.current) {
      // Rotate the entire effects group for dynamic movement
      effectsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]} onClick={onClick} onPointerEnter={onHover} onPointerLeave={onHover}>
      {/* Main energy screen with enhanced materials */}
      <Plane ref={screenRef} args={[4, 6]} rotation={[0, 0, 0]}>
        <MeshTransmissionMaterial
          color="#0088ff"
          thickness={0.1}
          transmission={0.9}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
          ior={1.4}
          transparent
          opacity={0.6}
          distortion={0.1}
          distortionScale={0.5}
          temporalDistortion={0.1}
        />
      </Plane>
      
      {/* Enhanced visual effects */}
      <group ref={effectsRef}>
        {/* Animated energy sparkles */}
        {sparkles.map((sparkle) => (
          <Sphere key={sparkle.id} args={[sparkle.size]} position={[sparkle.x, sparkle.y, sparkle.z]}>
            <meshBasicMaterial 
              color="#00ddff" 
              transparent 
              opacity={0.9}
              emissive="#00ddff"
              emissiveIntensity={1.2}
            />
          </Sphere>
        ))}
        
        {/* Flowing energy waves */}
        {energyWaves.map((wave) => (
          <Plane 
            key={wave.id} 
            args={[3.8, 0.1]} 
            position={[0, wave.y, 0.05]}
          >
            <meshBasicMaterial 
              color="#4dd2ff" 
              transparent 
              opacity={0.4}
              emissive="#4dd2ff"
              emissiveIntensity={0.8}
            />
          </Plane>
        ))}
        
        {/* Central energy core */}
        <Sphere args={[0.3]} position={[0, 0, 0]}>
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.3}
            emissive="#00aaff"
            emissiveIntensity={1.5}
          />
        </Sphere>
      </group>
      
      {/* Interactive hover indicator */}
      {isHovered && (
        <group>
          <Text
            position={[0, 3.8, 0.2]}
            fontSize={0.35}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            🤖 Click to Chat with AI
          </Text>
          
          {/* Pulsing ring around screen */}
          <mesh rotation={[0, 0, 0]} position={[0, 0, 0.1]}>
            <ringGeometry args={[2.2, 2.4, 32]} />
            <meshBasicMaterial 
              color="#00ffff" 
              transparent 
              opacity={0.6}
              emissive="#00ffff"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Enhanced conveyor belt component
const ConveyorBelt = () => {
  const beltRef = useRef();
  const [isVisible, setIsVisible] = useState(true);
  
  useFrame((state) => {
    if (beltRef.current && isVisible) {
      // Animate belt texture to show movement
      beltRef.current.material.map.offset.z += 0.015;
      
      // Add subtle belt bounce
      beltRef.current.position.y = -1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
    }
  });
  
  const beltTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create enhanced metallic belt pattern
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, '#1a202c');
    gradient.addColorStop(0.3, '#4a5568');
    gradient.addColorStop(0.5, '#2d3748');
    gradient.addColorStop(0.7, '#4a5568');
    gradient.addColorStop(1, '#1a202c');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add metallic rivets and details
    ctx.fillStyle = '#0f1419';
    for (let i = 0; i < 512; i += 48) {
      ctx.fillRect(i - 3, 250, 6, 12);
      ctx.fillRect(i - 2, 248, 4, 16);
    }
    
    // Add wear patterns
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 200);
      ctx.lineTo(i, 312);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 8);
    return texture;
  }, []);
  
  return (
    <group>
      {/* Main belt surface */}
      <Plane ref={beltRef} args={[30, 4]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <meshStandardMaterial
          map={beltTexture}
          metalness={0.9}
          roughness={0.3}
          normalScale={[0.5, 0.5]}
        />
      </Plane>
      
      {/* Belt supports */}
      {Array.from({ length: 6 }, (_, i) => (
        <Box 
          key={i} 
          args={[0.3, 0.8, 0.3]} 
          position={[-12 + i * 5, -1.5, 0]}
        >
          <meshStandardMaterial
            color="#1a202c"
            metalness={0.8}
            roughness={0.4}
          />
        </Box>
      ))}
      
      {/* Belt edges */}
      <Box args={[30, 0.1, 0.1]} position={[0, -0.9, 2]} />
      <Box args={[30, 0.1, 0.1]} position={[0, -0.9, -2]} />
    </group>
  );
};

// Main scene component
const Scene = ({ onEnergyScreenClick }) => {
  const { camera } = useThree();
  const [cubes, setCubes] = useState([]);
  const [isEnergyScreenHovered, setIsEnergyScreenHovered] = useState(false);
  
  useEffect(() => {
    // Position camera for diagonal overhead view
    camera.position.set(8, 6, 10);
    camera.lookAt(0, 0, 0);
    
    // Initialize cubes
    const initialCubes = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      position: [0, 0, -15 + i * 4],
      isTransformed: false,
    }));
    setCubes(initialCubes);
  }, [camera]);
  
  const handleTransform = () => {
    // Transformation handled by individual cubes
  };
  
  const handleEnergyScreenHover = () => {
    setIsEnergyScreenHovered(!isEnergyScreenHovered);
  };

  return (
    <group>
      {/* Environment and lighting */}
      <Environment preset="night" />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#0066ff" />
      
      {/* Floor with reflections */}
      <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
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
          isTransformed={cube.isTransformed}
          onTransform={handleTransform}
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
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900/10 to-slate-900">
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
      <Canvas shadows>
        <Scene onEnergyScreenClick={onChatOpen} />
      </Canvas>
      
      {/* Subtle UI overlay */}
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