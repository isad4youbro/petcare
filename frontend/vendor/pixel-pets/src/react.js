/**
 * React wrapper:  <PetSprite config={pet.avatar} pose="walk" size={96} />
 * Pass `flashOnChange` to blink the pixels that changed when `config` updates (constructor UX).
 */
import { createElement, useEffect, useRef } from 'react';
import { PetSprite as Engine } from './sprite.js';

export function PetSprite({ config, pose = 'stand', size = 96, flashOnChange = false, className, title, paused = false }) {
  const ref = useRef(null), inst = useRef(null);
  useEffect(() => { inst.current = new Engine(ref.current, config, { pose, paused }); return () => inst.current.destroy(); }, []);
  useEffect(() => { inst.current && inst.current.setConfig(config, { flash: flashOnChange }); }, [config]);
  useEffect(() => { inst.current && inst.current.setPose(pose); }, [pose]);
  useEffect(() => { if (inst.current) paused ? inst.current.pause() : inst.current.play(); }, [paused]);
  return createElement('canvas', { ref, width: 32, height: 32, className, role: 'img', 'aria-label': title || config?.name || 'Питомец',
    style: { width: size, height: size, imageRendering: 'pixelated' } });
}
