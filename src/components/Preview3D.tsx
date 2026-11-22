"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { drawableShape, footprint, sideProfile } from "@/lib/geometry";
import type { Dims, ShapeId } from "@/lib/types";

/** Bygger överdragets volym från samma mått och mallar som 2D-vyerna. Normaliserad till ~2 enheter. */
function buildGeometry(shapeIn: ShapeId, dims: Dims) {
  const shape = drawableShape(shapeIn, dims);
  const w = dims.w?.value ?? 1, d = dims.d?.value ?? 1, h = dims.h?.value ?? 1;
  const max = Math.max(w, d, h);
  const bevel = max * 0.012;
  const opts = { bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 48 };
  let geo: THREE.ExtrudeGeometry;

  if (shape === "sloped") {
    const s = new THREE.Shape(sideProfile(shape, dims).map(([x, y]) => new THREE.Vector2(x, y)));
    geo = new THREE.ExtrudeGeometry(s, { ...opts, depth: w });
    geo.rotateY(Math.PI / 2);
  } else {
    const s = new THREE.Shape();
    if (shape === "cylinder") s.absellipse(w / 2, d / 2, w / 2, d / 2, 0, Math.PI * 2, false, 0);
    else s.setFromPoints(footprint(shape, dims).map(([x, y]) => new THREE.Vector2(x, y)));
    geo = new THREE.ExtrudeGeometry(s, { ...opts, depth: h });
    geo.rotateX(-Math.PI / 2);
  }
  geo.center();
  const k = 2 / max;
  geo.scale(k, k, k);
  geo.computeBoundingBox();
  return { geo, floor: geo.boundingBox!.min.y };
}

export default function Preview3D({
  shape, dims, color = "#3d6b5f", autoRotate = false, className = "",
}: { shape: ShapeId; dims: Dims; color?: string; autoRotate?: boolean; className?: string }) {
  const key = JSON.stringify([shape, dims.w?.value, dims.d?.value, dims.h?.value, dims.h2?.value, dims.cw?.value, dims.cd?.value]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { geo, floor } = useMemo(() => buildGeometry(shape, dims), [key]);
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <div className={className} style={{ touchAction: "none" }}>
      <Canvas camera={{ position: [2.6, 1.9, 3.2], fov: 38 }} dpr={[1, 2]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 3]} intensity={2.2} />
        <directionalLight position={[-4, 2, -3]} intensity={0.6} />
        <mesh geometry={geo}>
          <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floor - 0.005, 0]}>
          <circleGeometry args={[2.2, 64]} />
          <meshBasicMaterial color="#ebe5d9" />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} autoRotate={autoRotate} autoRotateSpeed={1.2}
          minPolarAngle={0.3} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
}
