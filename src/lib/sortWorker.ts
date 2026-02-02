/**
 * Sorting Worker
 * 
 * Runs sorting algorithms off the main thread and posts events back.
 * Speed is controlled by delaying between event batches.
 */

import type { SortEvent, StartEvent, DoneEvent } from './events';
import { createHelpers, type EmitFn } from './helpers';
import { algorithms } from './algorithms';

let eventId = 0;
let currentArray: number[] = [];
let generator: Generator<void, void, unknown> | null = null;
let isPaused = false;
let isRunning = false;
let eventsPerSecond = 200;

function emit(event: Omit<SortEvent, 'id'>) {
    const fullEvent = { ...event, id: eventId++ } as SortEvent;
    self.postMessage({ type: 'event', payload: fullEvent });
}

self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'start': {
            const { algorithm, array, seed, speed } = payload;
            currentArray = [...array];
            eventId = 0;
            isPaused = false;
            isRunning = true;
            eventsPerSecond = speed || 200;

            // Emit start event
            emit({
                type: 'start',
                algorithmName: algorithm,
                arrayLength: currentArray.length,
                seed,
            } as Omit<StartEvent, 'id'>);

            // Get algorithm
            const sortFn = algorithms[algorithm];
            if (!sortFn) {
                self.postMessage({ type: 'error', payload: `Unknown algorithm: ${algorithm}` });
                return;
            }

            const helpers = createHelpers(currentArray, emit);
            generator = sortFn(helpers);

            // Start running
            runLoop();
            break;
        }

        case 'step': {
            if (generator && isPaused) {
                const result = generator.next();
                if (result.done) {
                    finish();
                }
            }
            break;
        }

        case 'pause': {
            isPaused = true;
            break;
        }

        case 'resume': {
            isPaused = false;
            if (isRunning) {
                runLoop();
            }
            break;
        }

        case 'reset': {
            generator = null;
            isRunning = false;
            isPaused = false;
            eventId = 0;
            self.postMessage({ type: 'reset' });
            break;
        }

        case 'setSpeed': {
            eventsPerSecond = payload;
            break;
        }
    }
};

function runLoop() {
    if (!generator || !isRunning || isPaused) return;

    // Calculate how many events to process based on speed
    // At 60fps, we want eventsPerSecond / 60 events per frame
    const eventsPerFrame = Math.max(1, Math.ceil(eventsPerSecond / 60));

    // Calculate delay between batches (in ms)
    // Higher speed = smaller delay
    const delayMs = Math.max(1, Math.floor(1000 / eventsPerSecond * eventsPerFrame));

    let count = 0;
    while (!isPaused && isRunning && count < eventsPerFrame) {
        const result = generator.next();
        if (result.done) {
            finish();
            return;
        }
        count++;
    }

    if (!isPaused && isRunning) {
        setTimeout(runLoop, delayMs);
    }
}

function finish() {
    emit({ type: 'done' } as Omit<DoneEvent, 'id'>);
    isRunning = false;
    generator = null;
    self.postMessage({ type: 'complete', payload: currentArray });
}

export { }; // Make this a module
