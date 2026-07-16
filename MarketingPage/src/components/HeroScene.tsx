import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';

function Sculpture() {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * .1;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * .35) * .08;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * .65) * .08;
  });
  return <group ref={ref} rotation={[.1, -.35, -.08]}>
    {Array.from({ length: 9 }, (_, i) => {
      const x = (i % 3 - 1) * 1.12;
      const y = (Math.floor(i / 3) - 1) * 1.12;
      const height = .28 + ((i * 7) % 5) * .11;
      return <mesh key={i} position={[x, y, Math.sin(i * 1.7) * .3]}>
        <boxGeometry args={[.88, .88, height]} />
        <meshStandardMaterial color={i === 4 || i === 8 ? '#e3aa13' : '#e7e7e3'} roughness={.42} metalness={.08} />
      </mesh>;
    })}
  </group>;
}

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    setDpr(matchMedia('(pointer: coarse)').matches ? 1.15 : 1.5);
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting && !document.hidden), { rootMargin: '120px' });
    const onVisibility = () => {
      const rect = host.current?.getBoundingClientRect();
      setActive(!document.hidden && Boolean(rect && rect.bottom > 0 && rect.top < innerHeight));
    };
    if (host.current) observer.observe(host.current);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  return <div ref={host} className="hero-scene" aria-hidden="true">
    <div className="scene-fallback"><span/><span/><span/><span/><span/><span/><span/><span/><span/></div>
    <Canvas dpr={[1, dpr]} camera={{ position: [0, 0, 6], fov: 42 }} frameloop={active ? 'always' : 'never'}>
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 5, 5]} intensity={3} color="#fff8df" />
      <directionalLight position={[-3, -2, 4]} intensity={1.2} color="#aeb5c3" />
      <Sculpture />
    </Canvas>
  </div>;
}
