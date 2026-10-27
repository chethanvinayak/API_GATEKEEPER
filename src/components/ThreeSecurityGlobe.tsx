import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShieldCheck, ShieldAlert, Zap, RefreshCw, Layers, Eye } from 'lucide-react';

interface ThreeSecurityGlobeProps {
  stats: any;
  events: any[];
}

export const ThreeSecurityGlobe: React.FC<ThreeSecurityGlobeProps> = ({ stats, events }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [activePreset, setActivePreset] = useState<'nexus' | 'orbit' | 'shield'>('nexus');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b14);
    scene.fog = new THREE.FogExp2(0x050b14, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 18);

    // 2. Renderer Setup (Strict adherence to Three.js r160+ and headless support)
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio PBR Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (Warm key, cool fill, hemisphere)
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 0.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = !isHeadless;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-15, -10, -10);
    scene.add(rimLight);

    // 5. Composite 3-12 Part Procedural WAF Nexus Model Group
    const nexusGroup = new THREE.Group();
    scene.add(nexusGroup);

    // Part 1: Central Core Crystal (Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(2.5, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      metalness: 0.8,
      roughness: 0.2,
      transmission: 0.6,
      ior: 1.5,
      wireframe: wireframeMode
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    nexusGroup.add(coreMesh);

    // Part 2: Inner Shield Wireframe Sphere
    const innerSphereGeo = new THREE.SphereGeometry(3.8, 24, 24);
    const innerSphereMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    nexusGroup.add(innerSphere);

    // Part 3: Outer Orbital Ring 1
    const ring1Geo = new THREE.TorusGeometry(5.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    nexusGroup.add(ring1);

    // Part 4: Outer Orbital Ring 2
    const ring2Geo = new THREE.TorusGeometry(7.0, 0.06, 16, 100);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat);
    ring2.rotation.y = Math.PI / 4;
    nexusGroup.add(ring2);

    // Part 5-12: Orbiting Threat Nodes (InstancedMesh or Group of Nodes)
    const nodeCount = 18;
    const nodeGroup = new THREE.Group();
    nexusGroup.add(nodeGroup);

    const nodeGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x0d9488,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.2
    });

    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 5.5 + (i % 3) * 0.8;
      node.position.set(
        Math.cos(angle) * radius,
        (Math.sin(i) * 2),
        Math.sin(angle) * radius
      );
      nodeGroup.add(node);
      nodes.push(node);
    }

    // Ground Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(25, 25);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.6
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -6;
    scene.add(shadowPlane);

    // 6. Animation Loop with Exponential Damping & Zero GC
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Rotate core and rings smoothly
      coreMesh.rotation.y += 0.5 * rotationSpeed * delta;
      coreMesh.rotation.x += 0.2 * rotationSpeed * delta;

      innerSphere.rotation.y -= 0.3 * rotationSpeed * delta;

      ring1.rotation.z += 0.4 * rotationSpeed * delta;
      ring2.rotation.z -= 0.5 * rotationSpeed * delta;

      nodeGroup.rotation.y += 0.25 * rotationSpeed * delta;

      // Pulsate core scale slightly
      const pulse = 1 + Math.sin(time * 3) * 0.05;
      coreMesh.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [wireframeMode, rotationSpeed]);

  return (
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-slate-800 bg-[#050b14] shadow-2xl flex flex-col">
      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-md">
        <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          API Gatekeeper 3D Threat Globe & Network Nexus
        </span>
      </div>

      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Collapsed/Expanded Unified Bottom Control Dock */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[850px] rounded-2xl border border-slate-800 bg-slate-950/90 p-4 backdrop-blur-xl shadow-2xl flex flex-col gap-3">
        {/* Dock Header & Toggle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Layers className="h-4 w-4 text-blue-400" />
            <span>Telemetry & Viewport Controls</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[11px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isCollapsed ? '▴ Show Controls' : '▾ Hide Controls'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 items-center">
            {/* View Presets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400">Viewport Preset</label>
              <div className="flex items-center gap-1.5">
                {(['nexus', 'orbit', 'shield'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                      activePreset === p
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Rotation Speed Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Simulation Speed</span>
                <span className="text-blue-400">{rotationSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.2"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Quick Actions & Wireframe */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWireframeMode(!wireframeMode)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  wireframeMode
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {wireframeMode ? 'Solid PBR' : 'Wireframe Mode'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
