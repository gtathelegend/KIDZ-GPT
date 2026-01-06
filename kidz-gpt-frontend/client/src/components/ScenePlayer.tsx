import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import Ben10 from "./characters/Ben10";
import Boy from "./characters/Boy";
import Girl from "./characters/Girl";
import Oggy from "./characters/Oggy";

type CharacterId = "boy" | "girl" | "ben10" | "oggy";

type Scene = {
  scene_id?: number;
  character?: CharacterId;
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
  fallbackCharacter?: CharacterId;
  zoomLevel?: number;
};

export default function ScenePlayer({
  scenes,
  active,
  playing,
  fallbackCharacter = "girl",
  zoomLevel = 1,
}: ScenePlayerProps) {
  const safeScenes = useMemo(() => scenes ?? [], [scenes]);
  const scene = safeScenes[0];
  if (!scene) return null;

  const action = scene.animation?.action || "neutral";
  const loop = scene.animation?.loop ?? true;
  const safeFallback: CharacterId =
    fallbackCharacter === "boy" || fallbackCharacter === "ben10" || fallbackCharacter === "oggy"
      ? fallbackCharacter
      : "girl";
  const character: CharacterId =
    safeFallback
      ? safeFallback
      : scene?.character === "girl"
        ? "girl"
        : scene?.character === "boy"
          ? "boy"
          : scene?.character === "ben10"
            ? "ben10"
            : "girl";
  const subtitle =
    scene.dialogue?.text ||
    (typeof (scene as any).dialogue === "string" ? (scene as any).dialogue : "") ||
    "";
  const shouldShowSubtitle = Boolean(playing && subtitle.trim());

  // Calculate camera distance based on zoom level
  // Normal distance is 4, zoom in reduces it, zoom out increases it
  const cameraDistance = 4 / zoomLevel;

  console.log("ScenePlayer Debug:", {
    character,
    action,
    loop,
    active,
    playing,
    sceneCharacter: scene?.character,
    animation: scene.animation,
    zoomLevel,
    cameraDistance,
  });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-[280px]">
        <Canvas camera={{ position: [0, 0.8, cameraDistance], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          {character === "girl" && (
            <Girl action={action} loop={loop} active={active} playing={playing} />
          )}

          {character === "boy" && (
            <Boy action={action} loop={loop} active={active} playing={playing} />
          )}

          {character === "ben10" && (
            <Ben10 action={action} loop={loop} active={active} playing={playing} />
          )}

          {character === "oggy" && (
            <Oggy action={action} loop={loop} active={active} playing={playing} />
          )}
        </Canvas>
      </div>

      {shouldShowSubtitle ? <div className="subtitle">{subtitle}</div> : null}
    </div>
  );
}