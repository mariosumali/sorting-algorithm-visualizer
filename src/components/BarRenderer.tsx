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
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

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
