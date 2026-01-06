import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type OggyProps = {
  action?: string;
  loop?: boolean;
  active?: boolean;
  playing?: boolean;
};

export default function Oggy({
  action = "idle",
  loop = true,
  active = false,
  playing = false,
}: OggyProps) {
  const { scene, animations } = useGLTF("/assets/models/oggy/oggy.glb");
  const { actions } = useAnimations(animations, scene);
  const previousAction = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (animations && animations.length > 0) {
      console.log(
        "Oggy animations available:",
        animations.map((a) => a.name),
      );
    }
  }, [animations]);

  useEffect(() => {
    let clipAction = actions?.[action];

    if (!clipAction && actions) {
      const availableActions = Object.keys(actions);
      console.warn(
        `Animation "${action}" not found for Oggy. Available:`,
        availableActions,
      );
      if (availableActions.length > 0) {
        clipAction = actions[availableActions[0]];
        console.log(`Using fallback animation: ${availableActions[0]}`);
      }
    }

    if (!clipAction) {
      return;
    }

    if (previousAction.current && previousAction.current !== clipAction) {
      previousAction.current.fadeOut(0.25);
    }

    if (loop) {
      clipAction.setLoop(THREE.LoopRepeat, Infinity);
      clipAction.clampWhenFinished = false;
    } else {
      clipAction.setLoop(THREE.LoopOnce, 1);
      clipAction.clampWhenFinished = true;
    }

    clipAction.enabled = true;
    clipAction.paused = !playing;
    clipAction.reset().fadeIn(0.25).play();
    previousAction.current = clipAction;

    return () => {
      clipAction.fadeOut(0.25);
    };
  }, [action, loop, actions, playing]);

  useEffect(() => {
    const clipAction = actions?.[action];
    if (!clipAction) return;

    clipAction.enabled = true;
    clipAction.paused = !playing;
    if (playing) clipAction.play();
  }, [playing, action, actions]);

  return (
    <primitive object={scene} scale={active ? 1.2 : 0} position={[0, -1.5, 0]} />
  );
}

useGLTF.preload("/assets/models/oggy/oggy.glb");
