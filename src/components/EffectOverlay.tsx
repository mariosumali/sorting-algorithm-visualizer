'use client';

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { ActiveEffect } from '@/lib/effects';
import { updateAndDrawEffects } from '@/lib/effects';

interface EffectOverlayProps {
  effects: ActiveEffect[];
  onEffectsUpdate: (effects: ActiveEffect[]) => void;
  width: number;
  height: number;
}

export interface EffectOverlayHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export const EffectOverlay = forwardRef<EffectOverlayHandle, EffectOverlayProps>(({
  effects,
  onEffectsUpdate,
  width,
  height,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const effectsRef = useRef<ActiveEffect[]>(effects);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  effectsRef.current = effects;

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const delta = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = now;

    const dpr = window.devicePixelRatio || 1;
    const targetW = width * dpr;
    const targetH = height * dpr;

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const currentEffects = effectsRef.current;
    if (currentEffects.length > 0) {
      const surviving = updateAndDrawEffects(ctx, currentEffects, width, height, delta);
      if (surviving.length !== currentEffects.length) {
        onEffectsUpdate(surviving);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [width, height, onEffectsUpdate]);

  useEffect(() => {
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${height}px`,
        pointerEvents: 'none',
      }}
    />
  );
});

EffectOverlay.displayName = 'EffectOverlay';
