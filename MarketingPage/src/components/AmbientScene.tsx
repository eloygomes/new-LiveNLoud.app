import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';

type Variant = 'product' | 'flow' | 'lab' | 'live';

function ProductObjects() {
  const group = useRef<Group>(null);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * .18;
    group.current.rotation.x = pointer.y * .1 + Math.sin(clock.elapsedTime * .35) * .08;
    group.current.position.y = Math.sin(clock.elapsedTime * .55) * .12;
  });

  return <group ref={group} rotation={[.18, -.35, -.12]}>
    {Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      return <mesh key={i} position={[Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, Math.sin(i * 1.4) * .45]} rotation={[angle * .25, angle, angle * .12]}>
        <boxGeometry args={[.58, .58, .2 + (i % 3) * .12]} />
        <meshStandardMaterial color={i === 1 || i === 4 ? '#e3aa13' : '#313136'} roughness={.35} metalness={.35} />
      </mesh>;
    })}
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.95, .018, 8, 96]} />
      <meshBasicMaterial color="#e3aa13" transparent opacity={.42} />
    </mesh>
  </group>;
}

function FlowObjects() {
  const group = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return;
    group.current.rotation.z += delta * .08;
    group.current.rotation.y = pointer.x * .16;
    if (pulse.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 1.5) * .12;
      pulse.current.scale.setScalar(scale);
    }
  });

  return <group ref={group} rotation={[.55, 0, -.25]}>
    {[0, 1, 2].map((i) => <group key={i} rotation={[0, 0, i * (Math.PI * 2 / 3)]}>
      <mesh position={[0, 1.65, i * .08]}>
        <sphereGeometry args={[i === 1 ? .28 : .2, 24, 24]} />
        <meshStandardMaterial color={i === 1 ? '#e3aa13' : '#d8d8d4'} roughness={.22} metalness={.25} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.65, .014, 8, 96]} />
        <meshBasicMaterial color={i === 1 ? '#e3aa13' : '#999b9d'} transparent opacity={i === 1 ? .5 : .2} />
      </mesh>
    </group>)}
    <mesh ref={pulse}>
      <icosahedronGeometry args={[.55, 1]} />
      <meshStandardMaterial color="#111111" roughness={.3} metalness={.45} />
    </mesh>
  </group>;
}

function LabObjects() {
  const group = useRef<Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    group.current.rotation.x = -.5 + pointer.y * .08;
    group.current.rotation.z = -.18 + pointer.x * .08;
    group.current.children.forEach((child, i) => {
      child.position.z = Math.sin(clock.elapsedTime * 1.35 + i * .52) * .22;
    });
  });

  return <group ref={group} rotation={[-.5, 0, -.18]}>
    {Array.from({ length: 24 }, (_, i) => {
      const x = (i % 8 - 3.5) * .52;
      const y = (Math.floor(i / 8) - 1) * .52;
      const hit = [0, 3, 4, 8, 10, 12, 15, 16, 19, 20, 22].includes(i);
      return <mesh key={i} position={[x, y, 0]}>
        <boxGeometry args={[.4, .4, .16]} />
        <meshStandardMaterial color={hit ? '#e3aa13' : '#27272b'} roughness={.38} metalness={.18} />
      </mesh>;
    })}
  </group>;
}

function LiveObjects() {
  const group = useRef<Group>(null);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return;
    group.current.rotation.z += delta * .06;
    group.current.rotation.x = pointer.y * .08;
    group.current.children.forEach((child, i) => {
      const scale = 1 + Math.sin(clock.elapsedTime * 1.1 - i * .7) * .035;
      child.scale.setScalar(scale);
    });
  });

  return <group ref={group} rotation={[.35, -.12, 0]}>
    {[.7, 1.2, 1.72, 2.25].map((radius, i) => <mesh key={radius} rotation={[Math.PI / 2, 0, i * .22]}>
      <torusGeometry args={[radius, i === 0 ? .032 : .018, 10, 120]} />
      <meshBasicMaterial color="#e3aa13" transparent opacity={.5 - i * .08} />
    </mesh>)}
    <mesh>
      <sphereGeometry args={[.16, 24, 24]} />
      <meshBasicMaterial color="#68d080" />
    </mesh>
  </group>;
}

function SceneObjects({ variant }: { variant: Variant }) {
  if (variant === 'flow') return <FlowObjects />;
  if (variant === 'lab') return <LabObjects />;
  if (variant === 'live') return <LiveObjects />;
  return <ProductObjects />;
}

export default function AmbientScene({ variant }: { variant: Variant }) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [dpr, setDpr] = useState(1.25);

  useEffect(() => {
    setDpr(matchMedia('(pointer: coarse)').matches ? 1 : 1.35);
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting && !document.hidden), { rootMargin: '160px' });
    const onVisibility = () => {
      const rect = host.current?.getBoundingClientRect();
      setActive(!document.hidden && Boolean(rect && rect.bottom > -160 && rect.top < innerHeight + 160));
    };
    if (host.current) observer.observe(host.current);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <div ref={host} className={`ambient-scene ambient-scene-${variant}`} aria-hidden="true">
    <Canvas dpr={[1, dpr]} camera={{ position: [0, 0, variant === 'lab' ? 5.5 : 5], fov: 44 }} frameloop={active ? 'always' : 'never'} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[4, 5, 6]} intensity={2.3} color="#fff8df" />
      <pointLight position={[-3, -2, 3]} intensity={1.4} color="#e3aa13" />
      <SceneObjects variant={variant} />
    </Canvas>
  </div>;
}
