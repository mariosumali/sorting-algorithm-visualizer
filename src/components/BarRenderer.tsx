'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface BarRendererProps {
    array: number[];
    highlights: {
        compare: Set<number>;
        swap: Set<number>;
        write: Set<number>;
        pivot: Set<number>;
        range: [number, number] | null;
    };
    barColor?: string;
    verifiedIndex?: number;
    width?: number;
    height?: number;
}

export interface BarRendererHandle {
    getCanvas: () => HTMLCanvasElement | null;
}

export const BarRenderer = forwardRef<BarRendererHandle, BarRendererProps>(({
    array,
    highlights,
    barColor = '#cbd5e1',
    verifiedIndex = -1,
    width = 1000,
    height = 500
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current
    }));

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const targetWidth = width * dpr;
        const targetHeight = height * dpr;

        // Only resize if dimensions changed to avoid clearing the canvas
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.scale(dpr, dpr);
        } else {
            // If we didn't resize (which clears), we need to manually clear
            // Note: context state (scale) is preserved if we don't resize? 
            // Actually, resizing resets the context state (including scale).
            // If we don't resize, the previous scale is still active?
            // No, it's safer to always reset transform if we are not sure, 
            // but if we don't resize, we retain the context state.
            // However, let's just make sure we clear correctly.
            // Wait, if we DON'T resize, the scale is preserved from the last time we DID resize or set it.
            // BUT, safely, we should probably just clear the rect.
            // Actually, `ctx.scale` is likely cumulative if not reset, but here we are in a draw loop.
            // Standard practice: if not resizing, just clear.
            // But wait, if page reloads or something? 
            // Let's assume the context state is persistent if we don't resize.
            // Actually, let's just ensure scale is correct. 
            // If we don't resize, we don't need to re-call scale IF it persists. 
            // To be debugging-safe, maybe we should save/restore or setTransform?
            // Let's stick to the minimal change: check size.
            // If size matches, we still need to clear for the new frame.
        }

        // Re-applying scale might be needed if we assume state is lost or we want to be safe,
        // but resizing definitely resets state.
        // If we DON'T resize, state is KEPT.
        // So we just need to clear.

        // However, to be absolutely safe against state drift or external meddling:
        // ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // This sets absolute scale

        // Let's go with the resize check first.

        if (Math.abs(canvas.width - targetWidth) > 1 || Math.abs(canvas.height - targetHeight) > 1) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.scale(dpr, dpr);
        } else {
            // Ensure we are working with a clean slate even without resize
            // We can't easily check current transform without advanced APIs or tracking it.
            // But since we control this canvas uniquely here, it should be fine.
            // Let's just reset the transform to be sure.
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        // Clear with dark background for recording
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        if (array.length === 0) return;

        const n = array.length;
        const padding = 16;
        const availableWidth = width - padding * 2;
        const barWidth = Math.max(1, availableWidth / n);
        const maxHeight = height - padding * 2;
        const gap = n > 200 ? 0 : n > 100 ? 0.5 : Math.min(1, barWidth * 0.1);

        // Draw bars
        for (let i = 0; i < n; i++) {
            const value = array[i];
            const barHeight = Math.max(1, value * maxHeight);
            const x = padding + i * barWidth + gap / 2;
            const y = height - padding - barHeight;
            const w = Math.max(0.5, barWidth - gap);

            // Determine color
            let color = barColor;

            // Verification sweep (green wave)
            if (verifiedIndex >= 0 && i <= verifiedIndex) {
                color = '#22c55e'; // Green for verified
            } else if (highlights.pivot.has(i)) {
                color = '#f97316'; // Orange
            } else if (highlights.swap.has(i)) {
                color = '#ef4444'; // Red
            } else if (highlights.write.has(i)) {
                color = '#22c55e'; // Green
            } else if (highlights.compare.has(i)) {
                color = '#3b82f6'; // Blue
            }

            ctx.fillStyle = color;

            if (barWidth > 2) {
                // Rounded corners for visible bars
                const radius = Math.min(2, barWidth / 4);
                ctx.beginPath();
                ctx.roundRect(x, y, w, barHeight, [radius, radius, 0, 0]);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, w, barHeight);
            }
        }
    }, [array, highlights, barColor, verifiedIndex, width, height]);

    useEffect(() => {
        draw();
    }, [draw]);

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
