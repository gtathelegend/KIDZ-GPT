import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

type BoyProps = {
  action?: string;
  loop?: boolean;
};

export default function Boy({ action = "idle_neutral", loop = true }: BoyProps) {
  const { scene, animations } = useGLTF("/assets/models/boy/boy.glb");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    const clipAction = actions?.[action];

    if (!clipAction) {
      console.warn(`Animation ${action} not found`);
      return;
    }

    if (loop) {
      clipAction.setLoop(THREE.LoopRepeat, Infinity);
      clipAction.clampWhenFinished = false;
    } else {
      clipAction.setLoop(THREE.LoopOnce, 1);
      clipAction.clampWhenFinished = true;
    }

    clipAction.reset().fadeIn(0.25).play();

    return () => {
      clipAction.fadeOut(0.25);
    };
  }, [action, loop, actions]);

  return <primitive object={scene} scale={1.2} position={[0, -1.5, 0]} />;
}

useGLTF.preload("/assets/models/boy/boy.glb");
