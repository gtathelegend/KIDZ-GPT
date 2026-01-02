import { Canvas } from "@react-three/fiber";
import Boy from "./characters/Boy";
import { useMemo } from "react";

type Scene = {
  scene_id?: number;
  animation?: {
    action?: string;
    loop?: boolean;
  };
  dialogue?: {
    text?: string;
  };
  // Allow backend storyboard shape too
  scene?: number;
  dialogue_text?: string;
  dialogueString?: string;
  dialogueRaw?: unknown;
};

type ScenePlayerProps = {
  scenes: Scene[];
  active: boolean;
  playing: boolean;
};

export default function ScenePlayer({
  scenes,
  active,
  playing,
}: ScenePlayerProps) {
  const safeScenes = useMemo(() => scenes ?? [], [scenes]);
  const scene = safeScenes[0];
  if (!scene) return null;

  const action = scene.animation?.action || "neutral";
  const loop = scene.animation?.loop ?? true;
  const subtitle =
    scene.dialogue?.text ||
    (typeof (scene as any).dialogue === "string" ? (scene as any).dialogue : "") ||
    "";

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-[280px]">
        <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <Boy
            action={action}
            loop={loop}
            active={active}
            playing={playing}
          />
        </Canvas>
      </div>

      <div className="subtitle">{subtitle}</div>
    </div>
  );
}
