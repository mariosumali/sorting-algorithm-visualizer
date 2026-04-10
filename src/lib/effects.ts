/**
 * Visual Effects Engine
 *
 * Particle systems, screen-space effects, and ambient animation configs
 * for esoteric/unhinged sorting algorithms.
 */

import type { VisualEffectType } from './events';

// --- Particle ---

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

// --- Active Effect Instance ---

export interface ActiveEffect {
  id: number;
  type: VisualEffectType;
  startTime: number;
  duration: number;
  particles: Particle[];
  /** Screen-space flash: color + alpha curve */
  flashColor?: string;
  flashIntensity?: number;
  /** Bar indices this effect targets */
  indices?: number[];
  /** Normalized bar values for positioning */
  values?: number[];
}

// --- Ambient Effect (CSS-based, per algorithm) ---

export type AmbientEffectType =
  | 'tilt'
  | 'wobble'
  | 'shake'
  | 'glitch'
  | 'holyPulse'
  | 'redVignette'
  | 'greenFog'
  | 'none';

export interface AlgorithmEffectConfig {
  ambient: AmbientEffectType;
  /** Canvas-background tint overlay color (rgba) applied during sort */
  tint?: string;
}

export const ALGORITHM_EFFECTS: Record<string, AlgorithmEffectConfig> = {
  'Thanos Sort': { ambient: 'none', tint: 'rgba(147, 51, 234, 0.06)' },
  'Gravity Sort': { ambient: 'tilt' },
  'Miracle Sort': { ambient: 'holyPulse', tint: 'rgba(250, 204, 21, 0.04)' },
  'Stalin Sort': { ambient: 'redVignette', tint: 'rgba(239, 68, 68, 0.05)' },
  'Communism Sort': { ambient: 'none', tint: 'rgba(220, 38, 38, 0.08)' },
  'Drunk Sort': { ambient: 'wobble' },
  'Bogo Sort': { ambient: 'shake' },
  'Zombie Sort': { ambient: 'greenFog', tint: 'rgba(34, 197, 94, 0.06)' },
  'Sacrifice Sort': { ambient: 'redVignette', tint: 'rgba(153, 27, 27, 0.06)' },
  'Paranoid Sort': { ambient: 'glitch' },
  'Gaslighting Sort': { ambient: 'wobble' },
};

// --- Particle Factories ---

let effectIdCounter = 0;

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Thanos dust: particles disintegrate from bar positions
 */
export function createDustEffect(
  barX: number,
  barY: number,
  barWidth: number,
  barHeight: number,
): ActiveEffect {
  const particles: Particle[] = [];
  const count = Math.max(20, Math.min(60, Math.floor(barHeight / 3)));

  for (let i = 0; i < count; i++) {
    const spawnX = barX + randomInRange(0, barWidth);
    const spawnY = barY + randomInRange(0, barHeight);
    particles.push({
      x: spawnX,
      y: spawnY,
      vx: randomInRange(-2.5, 2.5),
      vy: randomInRange(-3, -0.5),
      life: 1,
      maxLife: randomInRange(0.6, 1.4),
      color: Math.random() > 0.5 ? '#c084fc' : '#f97316',
      size: randomInRange(1.5, 4),
      rotation: randomInRange(0, Math.PI * 2),
      rotationSpeed: randomInRange(-0.1, 0.1),
    });
  }

  return {
    id: effectIdCounter++,
    type: 'dust',
    startTime: performance.now(),
    duration: 1400,
    particles,
  };
}

/**
 * Holy beam: golden/white light rays from above
 */
export function createHolyBeamEffect(canvasWidth: number, canvasHeight: number): ActiveEffect {
  const particles: Particle[] = [];
  const rayCount = 30;

  for (let i = 0; i < rayCount; i++) {
    particles.push({
      x: randomInRange(canvasWidth * 0.1, canvasWidth * 0.9),
      y: -10,
      vx: randomInRange(-0.3, 0.3),
      vy: randomInRange(3, 8),
      life: 1,
      maxLife: randomInRange(0.5, 1.2),
      color: Math.random() > 0.3 ? '#fef3c7' : '#ffffff',
      size: randomInRange(2, 6),
      rotation: 0,
      rotationSpeed: 0,
    });
  }

  return {
    id: effectIdCounter++,
    type: 'holyBeam',
    startTime: performance.now(),
    duration: 2000,
    particles,
    flashColor: '#fef9c3',
    flashIntensity: 0.6,
  };
}

/**
 * Stalin purge: red flash + particles emanating from purged bar
 */
export function createPurgeFlashEffect(
  barX: number,
  barY: number,
  barWidth: number,
  barHeight: number,
): ActiveEffect {
  const particles: Particle[] = [];
  const count = 15;

  for (let i = 0; i < count; i++) {
    const spawnX = barX + barWidth / 2;
    const spawnY = barY + barHeight / 2;
    const angle = randomInRange(0, Math.PI * 2);
    const speed = randomInRange(1, 4);
    particles.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: randomInRange(0.3, 0.8),
      color: Math.random() > 0.4 ? '#ef4444' : '#991b1b',
      size: randomInRange(2, 5),
      rotation: 0,
      rotationSpeed: randomInRange(-0.2, 0.2),
    });
  }

  return {
    id: effectIdCounter++,
    type: 'purgeFlash',
    startTime: performance.now(),
    duration: 800,
    particles,
    flashColor: '#dc2626',
    flashIntensity: 0.15,
  };
}

/**
 * Red wash: communist red sweep across all bars
 */
export function createRedWashEffect(canvasWidth: number): ActiveEffect {
  return {
    id: effectIdCounter++,
    type: 'redWash',
    startTime: performance.now(),
    duration: 1200,
    particles: [],
    flashColor: '#dc2626',
    flashIntensity: 0.25,
  };
}

/**
 * Zombie infection glow: sickly green particles
 */
export function createInfectGlowEffect(
  barX: number,
  barY: number,
  barWidth: number,
  barHeight: number,
): ActiveEffect {
  const particles: Particle[] = [];
  const count = 12;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: barX + randomInRange(0, barWidth),
      y: barY + randomInRange(0, barHeight),
      vx: randomInRange(-1, 1),
      vy: randomInRange(-2, -0.5),
      life: 1,
      maxLife: randomInRange(0.5, 1.0),
      color: Math.random() > 0.5 ? '#4ade80' : '#166534',
      size: randomInRange(2, 5),
      rotation: 0,
      rotationSpeed: 0,
    });
  }

  return {
    id: effectIdCounter++,
    type: 'infectGlow',
    startTime: performance.now(),
    duration: 900,
    particles,
  };
}

/**
 * Sacrifice flame: upward-drifting fire particles
 */
export function createSacrificeFlameEffect(
  barX: number,
  barY: number,
  barWidth: number,
  barHeight: number,
): ActiveEffect {
  const particles: Particle[] = [];
  const count = 25;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: barX + randomInRange(0, barWidth),
      y: barY + barHeight,
      vx: randomInRange(-1.5, 1.5),
      vy: randomInRange(-5, -2),
      life: 1,
      maxLife: randomInRange(0.4, 1.0),
      color: ['#ef4444', '#f97316', '#fbbf24'][Math.floor(Math.random() * 3)],
      size: randomInRange(2, 6),
      rotation: 0,
      rotationSpeed: randomInRange(-0.15, 0.15),
    });
  }

  return {
    id: effectIdCounter++,
    type: 'sacrificeFlame',
    startTime: performance.now(),
    duration: 1000,
    particles,
    flashColor: '#991b1b',
    flashIntensity: 0.12,
  };
}

/**
 * Bogo chaos: random particles flying everywhere
 */
export function createChaosParticlesEffect(canvasWidth: number, canvasHeight: number): ActiveEffect {
  const particles: Particle[] = [];
  const count = 40;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: randomInRange(0, canvasWidth),
      y: randomInRange(0, canvasHeight),
      vx: randomInRange(-6, 6),
      vy: randomInRange(-6, 6),
      life: 1,
      maxLife: randomInRange(0.3, 0.7),
      color: ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7'][Math.floor(Math.random() * 5)],
      size: randomInRange(1, 4),
      rotation: randomInRange(0, Math.PI * 2),
      rotationSpeed: randomInRange(-0.3, 0.3),
    });
  }

  return {
    id: effectIdCounter++,
    type: 'chaosParticles',
    startTime: performance.now(),
    duration: 600,
    particles,
  };
}

/**
 * Influencer spotlight: golden sparkle on selected bars
 */
export function createSpotlightEffect(
  barX: number,
  barY: number,
  barWidth: number,
): ActiveEffect {
  const particles: Particle[] = [];
  const count = 8;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: barX + randomInRange(0, barWidth),
      y: barY - randomInRange(5, 20),
      vx: randomInRange(-1, 1),
      vy: randomInRange(-2, -0.5),
      life: 1,
      maxLife: randomInRange(0.4, 0.8),
      color: Math.random() > 0.5 ? '#fbbf24' : '#fef3c7',
      size: randomInRange(1.5, 3.5),
      rotation: 0,
      rotationSpeed: randomInRange(-0.2, 0.2),
    });
  }

  return {
    id: effectIdCounter++,
    type: 'spotlight',
    startTime: performance.now(),
    duration: 700,
    particles,
  };
}

// --- Rendering ---

export function updateAndDrawEffects(
  ctx: CanvasRenderingContext2D,
  effects: ActiveEffect[],
  canvasWidth: number,
  canvasHeight: number,
  deltaSeconds: number,
): ActiveEffect[] {
  const now = performance.now();
  const surviving: ActiveEffect[] = [];

  for (const effect of effects) {
    const elapsed = now - effect.startTime;
    const progress = Math.min(1, elapsed / effect.duration);

    if (progress >= 1) continue;
    surviving.push(effect);

    // Flash overlay
    if (effect.flashColor && effect.flashIntensity) {
      const flashProgress = effect.type === 'holyBeam'
        ? Math.sin(progress * Math.PI)  // bell curve
        : Math.max(0, 1 - progress * 3); // quick fade
      const alpha = effect.flashIntensity * flashProgress;
      if (alpha > 0.005) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = effect.flashColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    }

    // Holy beam: vertical light rays
    if (effect.type === 'holyBeam') {
      const beamAlpha = Math.sin(progress * Math.PI) * 0.4;
      if (beamAlpha > 0.01) {
        const gradient = ctx.createLinearGradient(
          canvasWidth / 2, 0,
          canvasWidth / 2, canvasHeight,
        );
        gradient.addColorStop(0, `rgba(254, 243, 199, ${beamAlpha})`);
        gradient.addColorStop(0.5, `rgba(254, 249, 195, ${beamAlpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(254, 249, 195, 0)');
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    }

    // Red wash: horizontal sweep
    if (effect.type === 'redWash') {
      const sweepX = progress * canvasWidth * 1.3;
      const sweepAlpha = Math.sin(progress * Math.PI) * 0.2;
      if (sweepAlpha > 0.01) {
        const gradient = ctx.createLinearGradient(0, 0, sweepX, 0);
        gradient.addColorStop(0, `rgba(220, 38, 38, ${sweepAlpha})`);
        gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    }

    // Particles
    for (const p of effect.particles) {
      p.x += p.vx * deltaSeconds * 60;
      p.y += p.vy * deltaSeconds * 60;
      p.life -= deltaSeconds / p.maxLife;
      p.rotation += p.rotationSpeed;

      if (effect.type === 'dust') {
        p.vy -= 0.02; // slight upward drift
        p.vx *= 0.99;
      }

      if (p.life <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life) * (effect.type === 'dust' ? 0.8 : 1);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (effect.type === 'dust') {
        // Irregular dust shapes
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (effect.type === 'spotlight') {
        // Star/sparkle shape
        drawSparkle(ctx, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  return surviving;
}

function drawSparkle(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

// --- Bar position calculator (shared with BarRenderer logic) ---

export function getBarRect(
  index: number,
  value: number,
  arrayLength: number,
  canvasWidth: number,
  canvasHeight: number,
  deletedIndices?: Set<number>,
): { x: number; y: number; width: number; height: number } {
  const padding = 16;
  const availableWidth = canvasWidth - padding * 2;
  const maxHeight = canvasHeight - padding * 2;

  let visualCount = arrayLength;
  let visualPos = index;

  if (deletedIndices && deletedIndices.size > 0) {
    visualCount = arrayLength - deletedIndices.size;
    visualPos = 0;
    for (let i = 0; i < index; i++) {
      if (!deletedIndices.has(i)) visualPos++;
    }
  }

  const n = Math.max(1, visualCount);
  const barWidth = Math.max(1, availableWidth / n);
  const gap = n > 200 ? 0 : n > 100 ? 0.5 : Math.min(1, barWidth * 0.1);

  const barHeight = Math.max(1, value * maxHeight);
  const x = padding + visualPos * barWidth + gap / 2;
  const y = canvasHeight - padding - barHeight;
  const w = Math.max(0.5, barWidth - gap);

  return { x, y, width: w, height: barHeight };
}
