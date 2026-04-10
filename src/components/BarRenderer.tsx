'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { ThemeConfig } from '@/lib/themes';

interface BarRendererProps {
    array: number[];
    highlights: {
        compare: Set<number>;
        swap: Set<number>;
        write: Set<number>;
        pivot: Set<number>;
        range: [number, number] | null;
    };
    theme: ThemeConfig;
    verifiedIndex?: number;
    deletedIndices: Set<number>;
    width?: number;
    height?: number;
}

export interface BarRendererHandle {
    getCanvas: () => HTMLCanvasElement | null;
}

interface DyingBar {
    value: number;
    x: number;
    w: number;
    startTime: number;
}

const DEATH_DURATION_MS = 280;
const LERP_FACTOR = 0.18;

export const BarRenderer = forwardRef<BarRendererHandle, BarRendererProps>(({
    array,
    highlights,
    theme,
    verifiedIndex = -1,
    deletedIndices,
    width = 1000,
    height = 500
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const barXRef = useRef<Map<number, number>>(new Map());
    const barWRef = useRef<Map<number, number>>(new Map());
    const dyingBarsRef = useRef<Map<number, DyingBar>>(new Map());
    const prevArrayRef = useRef<number[]>([]);
    const prevDeletedRef = useRef<Set<number>>(new Set());
    const rafRef = useRef<number>(0);

    const latestProps = useRef({
        array, highlights, theme, verifiedIndex, deletedIndices, width, height
    });
    latestProps.current = {
        array, highlights, theme, verifiedIndex, deletedIndices, width, height
    };

    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current
    }));

    useEffect(() => {
        const prev = prevArrayRef.current;
        const curr = array;
        const prevDel = prevDeletedRef.current;

        for (let i = 0; i < curr.length; i++) {
            const wasAlive = i < prev.length && prev[i] > 0 && !prevDel.has(i);
            const isDeleted = deletedIndices.has(i);

            if (wasAlive && isDeleted && !dyingBarsRef.current.has(i)) {
                dyingBarsRef.current.set(i, {
                    value: prev[i],
                    x: barXRef.current.get(i) ?? 0,
                    w: barWRef.current.get(i) ?? 0,
                    startTime: performance.now(),
                });
            }
        }

        prevArrayRef.current = [...curr];
        prevDeletedRef.current = new Set(deletedIndices);
    }, [array, deletedIndices]);

    useEffect(() => {
        const prev = prevArrayRef.current;
        const curr = latestProps.current.array;

        for (let i = 0; i < curr.length; i++) {
            if (curr[i] > 0 && (i >= prev.length || prev[i] === 0)) {
                for (const delta of [-1, 1, -2, 2]) {
                    const from = i + delta;
                    if (
                        from >= 0 && from < prev.length &&
                        prev[from] > 0 && curr[from] === 0 &&
                        barXRef.current.has(from)
                    ) {
                        barXRef.current.set(i, barXRef.current.get(from)!);
                        barWRef.current.set(i, barWRef.current.get(from)!);
                        barXRef.current.delete(from);
                        barWRef.current.delete(from);
                        break;
                    }
                }
            }
        }
    }, [array]);

    useEffect(() => {
        let running = true;

        function draw() {
            if (!running) return;

            const {
                array: arr, highlights: hl, theme: th,
                verifiedIndex: vi, deletedIndices: delSet,
                width: w, height: h
            } = latestProps.current;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            const tW = w * dpr;
            const tH = h * dpr;

            if (canvas.width !== tW || canvas.height !== tH) {
                canvas.width = tW;
                canvas.height = tH;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.fillStyle = th.canvasBackground;
            ctx.fillRect(0, 0, w, h);

            if (arr.length === 0) return;

            const livingIndices: number[] = [];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] > 0 && !delSet.has(i)) livingIndices.push(i);
            }

            const n = Math.max(1, livingIndices.length);
            const padding = 16;
            const availableWidth = w - padding * 2;
            const barWidth = Math.max(1, availableWidth / n);
            const maxHeight = h - padding * 2;
            const gap = n > 200 ? 0 : n > 100 ? 0.5 : Math.min(1, barWidth * 0.1);

            let stillAnimating = false;

            for (let pos = 0; pos < livingIndices.length; pos++) {
                const idx = livingIndices[pos];
                const targetX = padding + pos * barWidth + gap / 2;
                const targetW = Math.max(0.5, barWidth - gap);

                let x: number, bw: number;
                if (barXRef.current.has(idx)) {
                    const prevX = barXRef.current.get(idx)!;
                    const prevW = barWRef.current.get(idx)!;
                    x = prevX + (targetX - prevX) * LERP_FACTOR;
                    bw = prevW + (targetW - prevW) * LERP_FACTOR;
                    if (Math.abs(x - targetX) > 0.3 || Math.abs(bw - targetW) > 0.2) {
                        stillAnimating = true;
                    } else {
                        x = targetX;
                        bw = targetW;
                    }
                } else {
                    x = targetX;
                    bw = targetW;
                }

                barXRef.current.set(idx, x);
                barWRef.current.set(idx, bw);

                const value = arr[idx];
                const barHeight = Math.max(1, value * maxHeight);
                const y = h - padding - barHeight;

                let color = th.barColor;
                if (vi >= 0 && idx <= vi) {
                    color = th.verifiedColor;
                } else if (hl.pivot.has(idx)) {
                    color = th.pivotColor;
                } else if (hl.swap.has(idx)) {
                    color = th.swapColor;
                } else if (hl.write.has(idx)) {
                    color = th.writeColor;
                } else if (hl.compare.has(idx)) {
                    color = th.compareColor;
                }

                ctx.fillStyle = color;
                if (bw > 2) {
                    const radius = Math.min(2, bw / 4);
                    ctx.beginPath();
                    ctx.roundRect(x, y, bw, barHeight, [radius, radius, 0, 0]);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, bw, barHeight);
                }
            }

            const now = performance.now();
            const toRemove: number[] = [];

            dyingBarsRef.current.forEach((bar, idx) => {
                const elapsed = now - bar.startTime;
                const progress = Math.min(1, elapsed / DEATH_DURATION_MS);

                if (progress >= 1) {
                    toRemove.push(idx);
                    return;
                }

                stillAnimating = true;

                const ease = 1 - Math.pow(1 - progress, 3);
                const scale = 1 - ease;
                const opacity = 1 - ease;

                const barHeight = Math.max(0, bar.value * maxHeight * scale);
                const y = h - padding - barHeight;

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.fillStyle = '#ef4444';
                if (bar.w > 2) {
                    const radius = Math.min(2, bar.w / 4);
                    ctx.beginPath();
                    ctx.roundRect(bar.x, y, bar.w, barHeight, [radius, radius, 0, 0]);
                    ctx.fill();
                } else {
                    ctx.fillRect(bar.x, y, bar.w, barHeight);
                }
                ctx.restore();
            });

            for (const idx of toRemove) {
                dyingBarsRef.current.delete(idx);
                barXRef.current.delete(idx);
                barWRef.current.delete(idx);
            }

            if (stillAnimating) {
                rafRef.current = requestAnimationFrame(draw);
            }
        }

        draw();
        return () => {
            running = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [array, highlights, theme, verifiedIndex, deletedIndices, width, height]);

    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: '100%',
                height: `${height}px`,
                maxWidth: `${width}px`,
            }}
        />
    );
});

BarRenderer.displayName = 'BarRenderer';
