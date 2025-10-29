import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';

// Create d-orbital geometry using mathematical equations
function makeDOrbitalGeometry(type, scale = 1, samples = 80) {
  const func = (u, v, target) => {
    // Convert u,v to θ and φ
    const theta = Math.PI * u;      // 0 → π
    const phi = 2 * Math.PI * v;    // 0 → 2π

    let f = 0;
    switch (type) {
      case 'dz2':
        f = 3 * Math.cos(theta)**2 - 1;
        break;
      case 'dx2y2':
        f = Math.sin(theta)**2 * Math.cos(2 * phi);
        break;
      case 'dxy':
        f = Math.sin(theta)**2 * Math.sin(2 * phi);
        break;
      case 'dxz':
        f = Math.sin(2 * theta) * Math.cos(phi);
        break;
      case 'dyz':
        f = Math.sin(2 * theta) * Math.sin(phi);
        break;
    }

    const r = Math.abs(f) * scale;
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);
    target.set(x, y, z);
  };

  return new ParametricGeometry(func, samples, samples);
}

// D-orbital component with proper mathematical geometry
function DOrbital({ type, position, rotation, color, opacity = 0.4, scale = 1 }) {
  const geometry = useMemo(() => {
    return makeDOrbitalGeometry(type, scale, 80);
  }, [type, scale]);

  return (
    <mesh position={position} rotation={rotation}>
      <primitive object={geometry} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={opacity}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
}

// Central metal ion
function MetalIon() {
  return (
    <Sphere args={[0.3, 16, 16]} position={[0, 0, 0]}>
      <meshPhongMaterial 
        color="#ffd700" 
        emissive="#ffaa00" 
        emissiveIntensity={0.2}
        shininess={100}
      />
    </Sphere>
  );
}

// Ligand sphere
function Ligand({ position, color }) {
  return (
    <Sphere args={[0.2, 12, 12]} position={position}>
      <meshPhongMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.1}
        shininess={50}
      />
    </Sphere>
  );
}

// D-orbital visualization using mathematical equations
function DOrbitals({ showOrbitals, distance, orbitalStates, orbitalScales }) {
  if (!showOrbitals) return null;

  const orbitalColor = '#4fc3f7';
  const opacity = Math.max(0.1, 0.4 - distance * 0.1);
  const baseScale = Math.max(0.5, 1.2 - distance * 0.2); // Base scale based on distance

  return (
    <group>
      {/* dxy orbital - four lobes in xy-plane rotated 45° */}
      {orbitalStates.dxy && (
        <DOrbital 
          type="dxy"
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          color={orbitalColor}
          opacity={opacity}
          scale={baseScale * orbitalScales.dxy}
        />
      )}
      
      {/* dxz orbital - lobes in xz-plane */}
      {orbitalStates.dxz && (
        <DOrbital 
          type="dxz"
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          color={orbitalColor}
          opacity={opacity}
          scale={baseScale * orbitalScales.dxz}
        />
      )}
      
      {/* dyz orbital - lobes in yz-plane */}
      {orbitalStates.dyz && (
        <DOrbital 
          type="dyz"
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          color={orbitalColor}
          opacity={opacity}
          scale={baseScale * orbitalScales.dyz}
        />
      )}
      
      {/* dz² orbital - two lobes along z-axis with torus in xy-plane */}
      {orbitalStates.dz2 && (
        <DOrbital 
          type="dz2"
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          color={orbitalColor}
          opacity={opacity}
          scale={baseScale * orbitalScales.dz2}
        />
      )}
      
      {/* dx²-y² orbital - four lobes in xy-plane */}
      {orbitalStates.dx2y2 && (
        <DOrbital 
          type="dx2y2"
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          color={orbitalColor}
          opacity={opacity}
          scale={baseScale * orbitalScales.dx2y2}
        />
      )}
    </group>
  );
}

// Octahedral ligand positions
function getOctahedralPositions(distance) {
  return [
    [distance, 0, 0],    // +x
    [-distance, 0, 0],   // -x
    [0, distance, 0],    // +y
    [0, -distance, 0],   // -y
    [0, 0, distance],    // +z
    [0, 0, -distance],   // -z
  ];
}

// Square planar ligand positions
function getSquarePlanarPositions(distance) {
  return [
    [distance, 0, 0],    // +x
    [-distance, 0, 0],   // -x
    [0, distance, 0],    // +y
    [0, -distance, 0],   // -y
  ];
}

// Billboard text component that always faces the camera while maintaining upright orientation
function BillboardText({ position, children, isDarkMode, ...props }) {
  const textRef = useRef<any>(null);
  
  useFrame(({ camera }) => {
    if (!textRef.current || !position) return;
    
    // drei Text component - try to access the mesh or group
    const obj = textRef.current;
    
    // Get the actual mesh - drei Text might be a group or directly a mesh
    let mesh: any = null;
    if (obj instanceof THREE.Group && obj.children.length > 0) {
      // It's a group, get the first child (should be a mesh)
      mesh = obj.children[0];
    } else if (obj instanceof THREE.Mesh || obj instanceof THREE.Object3D) {
      // It's directly a mesh or Object3D
      mesh = obj;
    }
    
    if (!mesh || !(mesh instanceof THREE.Object3D)) return;
    
    // Get text world position
    const posArray = Array.isArray(position) ? position : [position.x || position[0], position.y || position[1], position.z || position[2]];
    const textWorldPos = new THREE.Vector3(posArray[0], posArray[1], posArray[2]);
    
    // Get camera position
    const cameraPos = camera.position.clone();
    
    // Project camera position onto horizontal plane (XY plane, since Z is up)
    // This keeps the text upright by only rotating in the horizontal plane
    const lookAtTarget = new THREE.Vector3(
      cameraPos.x,
      cameraPos.y,
      textWorldPos.z // Same Z as text position - keeps text upright
    );
    
    // Calculate direction vector for horizontal rotation
    const direction = lookAtTarget.clone().sub(textWorldPos);
    if (direction.length() > 0) {
      direction.normalize();
      const horizontalAngle = Math.atan2(direction.y, direction.x);
      
      // Set rotation to keep text upright:
      // drei Text uses Y-up by default, rotate to Z-up coordinate system
      // -Math.PI / 2 keeps text visible but upside down
      // Solution: Use scale to flip vertically while keeping the rotation that makes it visible
      mesh.rotation.set(
        -Math.PI / 2, // Keep this value (makes text visible)
        horizontalAngle, // Face camera horizontally
        0  // No roll - keep upright
      );
      // Flip text vertically using scale to make it right-side up
      mesh.scale.set(1, -1, 1); // Negative Y scale flips text vertically
    }
  });
  
  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.5}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.05}
      outlineColor={isDarkMode ? '#000000' : '#ffffff'}
      {...props}
    >
      {children}
    </Text>
  );
}

// Axis labels component
function AxisLabels({ maxDistance, isDarkMode = true }) {
  // Position labels beyond the maximum ligand distance
  const labelOffset = Math.max(4.5, maxDistance * 1.3);
  const axisColor = isDarkMode ? '#ffffff' : '#000000';
  const lineColor = isDarkMode ? '#888888' : '#cccccc';
  const lineLength = labelOffset * 0.8;
  
  return (
    <group>
      {/* X-axis label and line */}
      <BillboardText
        position={[labelOffset + 0.5, 0, 0]}
        color={axisColor}
        isDarkMode={isDarkMode}
      >
        X
      </BillboardText>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, lineLength, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} opacity={0.6} transparent />
      </line>
      
      {/* Y-axis label and line */}
      <BillboardText
        position={[0, labelOffset + 0.5, 0]}
        color={axisColor}
        isDarkMode={isDarkMode}
      >
        Y
      </BillboardText>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, lineLength, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} opacity={0.6} transparent />
      </line>
      
      {/* Z-axis label and line */}
      <BillboardText
        position={[0, 0, labelOffset + 0.5]}
        color={axisColor}
        isDarkMode={isDarkMode}
      >
        Z
      </BillboardText>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, lineLength])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} opacity={0.6} transparent />
      </line>
    </group>
  );
}

export default function MetalComplexScene({ 
  geometryType, 
  distance, 
  showOrbitals, 
  ligandColor,
  orbitalStates,
  orbitalScales,
  isDarkMode = true
}) {
  const ligandPositions = useMemo(() => {
    if (geometryType === 'octahedral') {
      return getOctahedralPositions(distance);
    } else {
      return getSquarePlanarPositions(distance);
    }
  }, [geometryType, distance]);

  // Animate orbital rotation
  useFrame((state) => {
    // Optional: Add subtle rotation to orbitals
  });

  return (
    <group>
      {/* Central metal ion */}
      <MetalIon />
      
      {/* D-orbitals */}
      <DOrbitals 
        showOrbitals={showOrbitals} 
        distance={distance}
        orbitalStates={orbitalStates}
        orbitalScales={orbitalScales}
      />
      
      {/* Ligands */}
      {ligandPositions.map((position, index) => (
        <Ligand 
          key={index} 
          position={position} 
          color={ligandColor}
        />
      ))}
      
      {/* Connection lines to show coordination */}
      {ligandPositions.map((position, index) => (
        <line key={`line-${index}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, ...position])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#666" opacity={0.5} transparent />
        </line>
      ))}
      
      {/* Axis labels and lines */}
      <AxisLabels maxDistance={distance} isDarkMode={isDarkMode} />
    </group>
  );
}
