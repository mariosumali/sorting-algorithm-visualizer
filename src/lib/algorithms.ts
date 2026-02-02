/**
 * Built-in Sorting Algorithms
 * 
 * Each algorithm is a generator function that yields control back
 * periodically to allow for cancellation and smooth playback.
 */

import type { SortHelpers } from './helpers';

export type SortAlgorithm = (helpers: SortHelpers) => Generator<void, void, unknown>;

// --- Bubble Sort ---
export function* bubbleSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    for (let i = 0; i < n - 1; i++) {
        h.range(0, n - i - 1, 'unsorted');
        for (let j = 0; j < n - i - 1; j++) {
            if (h.compare(j, j + 1) > 0) {
                h.swap(j, j + 1);
            }
            yield; // Yield after each comparison for smooth playback
        }
    }
}

// --- Insertion Sort ---
export function* insertionSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    for (let i = 1; i < n; i++) {
        h.range(0, i, 'sorted');
        const key = h.read(i);
        let j = i - 1;
        while (j >= 0 && h.compare(j, i) > 0) {
            // Note: we need to handle this differently since we're comparing with moving position
            j--;
            yield;
        }
        // Shift elements
        const keyVal = h.read(i);
        for (let k = i; k > j + 1; k--) {
            h.write(k, h.read(k - 1));
            yield;
        }
        h.write(j + 1, keyVal);
        yield;
    }
}

// --- Selection Sort ---
export function* selectionSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    for (let i = 0; i < n - 1; i++) {
        h.range(i, n - 1, 'unsorted');
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (h.compare(j, minIdx) < 0) {
                minIdx = j;
            }
            yield;
        }
        if (minIdx !== i) {
            h.swap(i, minIdx);
        }
        yield;
    }
}

// --- Quick Sort ---
export function* quickSort(h: SortHelpers): Generator<void, void, unknown> {
    yield* quickSortHelper(h, 0, h.length - 1);
}

function* quickSortHelper(h: SortHelpers, low: number, high: number): Generator<void, void, unknown> {
    if (low < high) {
        h.partition(low, high);
        const pivotIdx = yield* partition(h, low, high);
        yield* quickSortHelper(h, low, pivotIdx - 1);
        yield* quickSortHelper(h, pivotIdx + 1, high);
    }
}

function* partition(h: SortHelpers, low: number, high: number): Generator<void, number, unknown> {
    h.pivot(high);
    let i = low - 1;
    for (let j = low; j < high; j++) {
        if (h.compare(j, high) < 0) {
            i++;
            h.swap(i, j);
        }
        yield;
    }
    h.swap(i + 1, high);
    yield;
    return i + 1;
}

// --- Merge Sort ---
export function* mergeSort(h: SortHelpers): Generator<void, void, unknown> {
    const aux: number[] = new Array(h.length);
    yield* mergeSortHelper(h, aux, 0, h.length - 1);
}

function* mergeSortHelper(h: SortHelpers, aux: number[], lo: number, hi: number): Generator<void, void, unknown> {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    h.range(lo, hi, 'divide');
    yield;
    yield* mergeSortHelper(h, aux, lo, mid);
    yield* mergeSortHelper(h, aux, mid + 1, hi);
    yield* mergeArrays(h, aux, lo, mid, hi);
}

function* mergeArrays(h: SortHelpers, aux: number[], lo: number, mid: number, hi: number): Generator<void, void, unknown> {
    h.merge(lo, mid, hi);
    // Copy to auxiliary
    for (let k = lo; k <= hi; k++) {
        aux[k] = h.read(k);
    }
    let i = lo, j = mid + 1;
    for (let k = lo; k <= hi; k++) {
        if (i > mid) {
            h.write(k, aux[j++]);
        } else if (j > hi) {
            h.write(k, aux[i++]);
        } else if (h.compareValues(aux[j], aux[i], j, i) >= 0) {
            // Note: We use j, i order and >= 0 to match stable sort preference (if aux[i] <= aux[j], take i)
            // Actually simpler: if (aux[i] <= aux[j]) -> take i.
            // h.compareValues(aux[i], aux[j], i, j) <= 0

            h.write(k, aux[i++]);
        } else {
            // OR we can add a valueCompare helper.

            // However, h.compare takes indices. 
            // In standard merge sort visualization, we are comparing the values at the front of the two subarrays.
            // These values conceptually come from indices i and j (relative to the merge step).
            // But wait, i and j are indices into 'aux', which matches 'arr' snapshot.
            // So we can check if h.compare(i, j) would be valid? 
            // No, because 'arr' is being overwritten.

            // Actually, standard implementation copies to aux, then merges back.
            // We can emit a comparison event. 

            // Let's manually emit a comparison for the UI visualization highlights
            // The values we are comparing are aux[i] and aux[j].
            // To be strictly correct with visualization, we should highlight indices i and j if possible.
            // But i and j are indices in the MAIN array range too (since aux is 1:1 map).
            // Even though we are writing collecting into k, the source is i and j.
            // EXCEPT we are overwriting the main array as we go, so arr[i] might be overwritten if i < k?
            // Wait, in merge sort, i (left pointer) is always >= k? 
            // k starts at lo. i starts at lo. 
            // If we take from left, i increments, k increments. i == k.
            // If we take from right, j increments, k increments. 
            // So arr[i] is NOT overwritten yet usually?
            // Actually, we copy ALL to aux first. So 'arr' IS free to be written.
            // But h.compare() reads from 'arr'. NOT 'aux'.
            // So we can't use h.compare(i, j) because 'arr' might have been partially overwritten at index i or j by previous steps k.

            // SOLUTION: We need a way to count comparison without reading from array.
            // Or just allow comparing values directly.

            // Let's add compareValues(valA, valB) to helpers? 
            // Using existing helpers: We can just manually compare and emit a special event?
            // Or just perform the check and let it slide? 
            // User specifically asked for ACCURACY.

            // Since we can't use h.compare(i, j) safely, we will just perform the comparison
            // but we'll manually trigger the event logic if possible.
            // But helpers.ts is strict about indices.

            // Simplest fix for now: compare aux values, and assume it counts as a comparison.
            // We can add a specialized raw 'compare' helper or just modify the interface.

            if (aux[j] < aux[i]) {
                h.write(k, aux[j++]);
            } else {
                h.write(k, aux[i++]);
            }
            // Wait, this doesn't count it.

            // To properly track comparisons we need to modify helpers or the logic.
            // Let's modify helpers to support comparison of values for metrics?
            // Or just map it to an index comparison?
            // Actually, we can use a "Metric only" comparison?

            // Let's just compare the values and emit a comparison for indices i and j
            // knowing that the visualizer highlights might show "wrong" values if arr[i] was overwritten.
            // But for metrics it will count 1.
            // Let's rely on the fact that for standard merge sort, we "read" from aux.
            // If we want to be perfect, merge sort is hard to visualize 1:1 with in-place swaps.

            // Let's try: h.compare(i, j) ? 
            // If we use h.compare(i, j), it reads arr[i] and arr[j].
            // But arr[i] might be overwritten.

            // Alternative: use custom event for value comparison.
            // But that requires changing the whole event structure.

            // Workaround: We really just want to increment the counter.
            // But we also want the visual "blip".

            // Let's modify the comparison to be:
            // if (h.compare(i, j) <= 0) ... doesn't work with aux.

            // What if we don't use aux for the comparison logic?
            // We need aux for correctness of the write.

            // Correct fix: Add `h.compareVal(v1, v2, i1, i2)` to helpers.
            // Let's check helpers.ts again.
        }
        yield;
    }
}

// --- Heap Sort ---
export function* heapSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* heapify(h, n, i);
    }
    // Extract elements
    for (let i = n - 1; i > 0; i--) {
        h.swap(0, i);
        yield;
        yield* heapify(h, i, 0);
    }
}

function* heapify(h: SortHelpers, heapSize: number, i: number): Generator<void, void, unknown> {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < heapSize && h.compare(left, largest) > 0) {
        largest = left;
    }
    yield;
    if (right < heapSize && h.compare(right, largest) > 0) {
        largest = right;
    }
    yield;
    if (largest !== i) {
        h.swap(i, largest);
        yield* heapify(h, heapSize, largest);
    }
}

// --- Algorithm Registry ---
export const algorithms: Record<string, SortAlgorithm> = {
    'Bubble Sort': bubbleSort,
    'Insertion Sort': insertionSort,
    'Selection Sort': selectionSort,
    'Quick Sort': quickSort,
    'Merge Sort': mergeSort,
    'Heap Sort': heapSort,
};
