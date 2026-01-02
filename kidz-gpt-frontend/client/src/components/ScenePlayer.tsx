import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import Boy from "./characters/Boy";

type Scene = {
  scene_id?: number;
  animation: {
    action: string;
    loop?: boolean;
  };
  dialogue: {
    text: string;
  };
  duration: number;
};

type ScenePlayerProps = {
  scenes: Scene[];
};

export default function ScenePlayer({ scenes }: ScenePlayerProps) {
  const safeScenes = useMemo(() => scenes ?? [], [scenes]);
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    if (safeScenes.length === 0) return;
    if (currentScene >= safeScenes.length) setCurrentScene(0);
  }, [safeScenes.length, currentScene]);

  useEffect(() => {
    if (safeScenes.length === 0) return;

    const scene = safeScenes[currentScene];
    const ms = Math.max(0.25, Number(scene?.duration ?? 0)) * 1000;

    const timer = window.setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % safeScenes.length);
    }, ms);

    return () => window.clearTimeout(timer);
  }, [currentScene, safeScenes]);

  const scene = safeScenes[currentScene];
  if (!scene) return null;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-[280px]">
        <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <Boy action={scene.animation.action} loop={scene.animation.loop ?? true} />
        </Canvas>
      </div>

      <div className="subtitle">{scene.dialogue.text}</div>
    </div>
  );
}
