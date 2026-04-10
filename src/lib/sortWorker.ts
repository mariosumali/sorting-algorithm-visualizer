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

let loopStartTime = 0;
let totalSteps = 0;

function resetTiming() {
    loopStartTime = performance.now();
    totalSteps = 0;
}

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

            emit({
                type: 'start',
                algorithmName: algorithm,
                arrayLength: currentArray.length,
                seed,
            } as Omit<StartEvent, 'id'>);

            const sortFn = algorithms[algorithm];
            if (!sortFn) {
                self.postMessage({ type: 'error', payload: `Unknown algorithm: ${algorithm}` });
                return;
            }

            const helpers = createHelpers(currentArray, emit);
            generator = sortFn(helpers);

            resetTiming();
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
                resetTiming();
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
            resetTiming();
            break;
        }
    }
};

function runLoop() {
    if (!generator || !isRunning || isPaused) return;

    const now = performance.now();
    const elapsed = now - loopStartTime;
    const targetSteps = Math.floor(elapsed * eventsPerSecond / 1000);

    const maxPerTick = Math.max(1, Math.ceil(eventsPerSecond / 30));
    let processed = 0;

    while (totalSteps < targetSteps && processed < maxPerTick && !isPaused && isRunning) {
        const result = generator!.next();
        if (result.done) {
            finish();
            return;
        }
        totalSteps++;
        processed++;
    }

    if (!isPaused && isRunning) {
        const nextStepDue = (totalSteps + 1) * 1000 / eventsPerSecond;
        const nowElapsed = performance.now() - loopStartTime;
        const waitMs = Math.max(1, Math.ceil(nextStepDue - nowElapsed));
        setTimeout(runLoop, waitMs);
    }
}

function finish() {
    emit({ type: 'done' } as Omit<DoneEvent, 'id'>);
    isRunning = false;
    generator = null;
    self.postMessage({ type: 'complete', payload: currentArray });
}

export { }; // Make this a module
