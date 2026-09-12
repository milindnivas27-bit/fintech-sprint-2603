'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 40;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Generate points
    const COUNT = 130;
    const positions: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < COUNT; i++) {
      positions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 20,
      ));
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.01,
      ));
    }

    // Points geometry
    const pointGeo = new THREE.BufferGeometry();
    const pointPositions = new Float32Array(COUNT * 3);
    pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));

    const pointMat = new THREE.PointsMaterial({
      color: 0xf0efec,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(pointGeo, pointMat);
    scene.add(points);

    // Lines geometry (dynamic)
    const MAX_LINES = 400;
    const linePositions = new Float32Array(MAX_LINES * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xe5484d,
      transparent: true,
      opacity: 0.12,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Animation loop
    let raf = 0;
    const LINK_DIST = 12;

    const animate = () => {
      // Update positions
      for (let i = 0; i < COUNT; i++) {
        const p = positions[i];
        const v = velocities[i];
        p.x += v.x;
        p.y += v.y;
        p.z += v.z;
        if (Math.abs(p.x) > 42) v.x *= -1;
        if (Math.abs(p.y) > 24) v.y *= -1;
        if (Math.abs(p.z) > 12) v.z *= -1;
        pointPositions[i * 3] = p.x;
        pointPositions[i * 3 + 1] = p.y;
        pointPositions[i * 3 + 2] = p.z;
      }
      pointGeo.attributes.position.needsUpdate = true;

      // Build lines for close pairs
      let lineIdx = 0;
      for (let i = 0; i < COUNT && lineIdx < MAX_LINES; i++) {
        for (let j = i + 1; j < COUNT && lineIdx < MAX_LINES; j++) {
          const d = positions[i].distanceTo(positions[j]);
          if (d < LINK_DIST) {
            const base = lineIdx * 6;
            linePositions[base] = positions[i].x;
            linePositions[base + 1] = positions[i].y;
            linePositions[base + 2] = positions[i].z;
            linePositions[base + 3] = positions[j].x;
            linePositions[base + 4] = positions[j].y;
            linePositions[base + 5] = positions[j].z;
            lineIdx++;
          }
        }
      }
      // Zero out unused lines
      for (let k = lineIdx; k < MAX_LINES; k++) {
        const base = k * 6;
        for (let m = 0; m < 6; m++) linePositions[base + m] = 0;
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.setDrawRange(0, lineIdx * 2);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      pointGeo.dispose();
      pointMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ opacity: 0.9 }}
    />
  );
}