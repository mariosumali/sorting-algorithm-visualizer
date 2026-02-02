/**
 * Playback Controller
 * 
 * Manages the connection to the sorting worker and controls playback state.
 * Acts as a bridge between the UI and the Worker.
 */

import type { SortEvent } from './events';

export type PlaybackState = 'idle' | 'running' | 'paused' | 'complete';

export interface PlaybackController {
    start: (algorithm: string, array: number[], seed?: number) => void;
    pause: () => void;
    resume: () => void;
    step: () => void;
    reset: () => void;
    setSpeed: (eventsPerSecond: number) => void;
    getState: () => PlaybackState;
    onEvent: (callback: (event: SortEvent) => void) => void;
    onStateChange: (callback: (state: PlaybackState) => void) => void;
    onComplete: (callback: (sortedArray: number[]) => void) => void;
    destroy: () => void;
}

export function createPlaybackController(): PlaybackController {
    let worker: Worker | null = null;
    let state: PlaybackState = 'idle';
    let eventCallbacks: ((event: SortEvent) => void)[] = [];
    let stateCallbacks: ((state: PlaybackState) => void)[] = [];
    let completeCallbacks: ((sortedArray: number[]) => void)[] = [];
    let speed = 100; // events per second

    function setState(newState: PlaybackState) {
        state = newState;
        stateCallbacks.forEach(cb => cb(state));
    }

    function initWorker() {
        if (worker) {
            worker.terminate();
        }
        worker = new Worker(new URL('./sortWorker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
            const { type, payload } = e.data;

            switch (type) {
                case 'event':
                    eventCallbacks.forEach(cb => cb(payload as SortEvent));
                    break;
                case 'batch':
                    (payload as SortEvent[]).forEach(event => {
                        eventCallbacks.forEach(cb => cb(event));
                    });
                    break;
                case 'complete':
                    setState('complete');
                    completeCallbacks.forEach(cb => cb(payload as number[]));
                    break;
                case 'reset':
                    setState('idle');
                    break;
                case 'error':
                    console.error('Worker error:', payload);
                    break;
            }
        };

        worker.onerror = (e) => {
            console.error('Worker error:', e);
        };
    }

    return {
        start(algorithm: string, array: number[], seed?: number) {
            initWorker();
            setState('running');
            worker?.postMessage({
                type: 'start',
                payload: { algorithm, array, seed, speed }
            });
        },

        pause() {
            if (state === 'running') {
                setState('paused');
                worker?.postMessage({ type: 'pause' });
            }
        },

        resume() {
            if (state === 'paused') {
                setState('running');
                worker?.postMessage({ type: 'resume' });
            }
        },

        step() {
            if (state === 'paused') {
                worker?.postMessage({ type: 'step' });
            }
        },

        reset() {
            worker?.postMessage({ type: 'reset' });
            setState('idle');
        },

        setSpeed(eventsPerSecond: number) {
            speed = eventsPerSecond;
            worker?.postMessage({ type: 'setSpeed', payload: speed });
        },

        getState() {
            return state;
        },

        onEvent(callback: (event: SortEvent) => void) {
            eventCallbacks.push(callback);
        },

        onStateChange(callback: (state: PlaybackState) => void) {
            stateCallbacks.push(callback);
        },

        onComplete(callback: (sortedArray: number[]) => void) {
            completeCallbacks.push(callback);
        },

        destroy() {
            worker?.terminate();
            worker = null;
            eventCallbacks = [];
            stateCallbacks = [];
            completeCallbacks = [];
        }
    };
}
