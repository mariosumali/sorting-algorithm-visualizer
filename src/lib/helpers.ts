/**
 * Helper API for Sorting Algorithms
 * 
 * Algorithms use these helpers to interact with the array.
 * Each helper automatically emits the corresponding event.
 */

import type { SortEvent, SwapEvent, CompareEvent, WriteEvent, ReadEvent, PivotEvent, PartitionEvent, RangeEvent, MergeEvent, StartEvent, DoneEvent, CheckpointEvent } from './events';

export type EmitFn = (event: Omit<SortEvent, 'id'>) => void;

export interface SortHelpers {
    /** Compare arr[i] and arr[j]. Returns -1, 0, or 1. Emits 'compare'. */
    compare(i: number, j: number): number;
    /** Compare two values directly. Used when indices are not reliable (e.g. merge sort aux). Emits 'compare' for visualization. */
    compareValues(v1: number, v2: number, i1: number, i2: number): number;
    /** Swap arr[i] and arr[j]. Emits 'swap'. */
    swap(i: number, j: number): void;
    /** Read arr[i]. Emits 'read'. Returns value. */
    read(i: number): number;
    /** Write value to arr[i]. Emits 'write'. */
    write(i: number, value: number): void;
    /** Mark index as pivot. Emits 'pivot'. */
    pivot(i: number): void;
    /** Mark partition range. Emits 'partition'. */
    partition(lo: number, hi: number): void;
    /** Mark active range. Emits 'range'. */
    range(lo: number, hi: number, label?: string): void;
    /** Mark merge segment. Emits 'merge'. */
    merge(lo: number, mid: number, hi: number): void;
    /** Emit checkpoint for stepping. */
    checkpoint(label: string): void;
    /** Get current array length */
    length: number;
}

export function createHelpers(arr: number[], emit: EmitFn): SortHelpers {
    return {
        compare(i: number, j: number): number {
            const result = arr[i] < arr[j] ? -1 : arr[i] > arr[j] ? 1 : 0;
            emit({ type: 'compare', i, j, result } as Omit<CompareEvent, 'id'>);
            return result;
        },
        compareValues(v1: number, v2: number, i1: number, i2: number): number {
            const result = v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
            // We emit distinct event or reuse compare? Reuse compare for now to trigger metrics/visuals
            emit({ type: 'compare', i: i1, j: i2, result } as Omit<CompareEvent, 'id'>);
            return result;
        },
        swap(i: number, j: number): void {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            emit({ type: 'swap', i, j } as Omit<SwapEvent, 'id'>);
        },
        read(i: number): number {
            const value = arr[i];
            emit({ type: 'read', index: i, value } as Omit<ReadEvent, 'id'>);
            return value;
        },
        write(i: number, value: number): void {
            arr[i] = value;
            emit({ type: 'write', index: i, value } as Omit<WriteEvent, 'id'>);
        },
        pivot(i: number): void {
            emit({ type: 'pivot', index: i } as Omit<PivotEvent, 'id'>);
        },
        partition(lo: number, hi: number): void {
            emit({ type: 'partition', lo, hi } as Omit<PartitionEvent, 'id'>);
        },
        range(lo: number, hi: number, label?: string): void {
            emit({ type: 'range', lo, hi, label } as Omit<RangeEvent, 'id'>);
        },
        merge(lo: number, mid: number, hi: number): void {
            emit({ type: 'merge', lo, mid, hi } as Omit<MergeEvent, 'id'>);
        },
        checkpoint(label: string): void {
            emit({ type: 'checkpoint', label } as Omit<CheckpointEvent, 'id'>);
        },
        get length() {
            return arr.length;
        }
    };
}
