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

// --- ADHD Sort ---
export function* adhdSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    const i = 0;
    let sorted = 0;
    let s = n * 2654435761 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };
    const randIdx = () => Math.floor(rand() * n);

    while (sorted < n) {
        for (let j = i + 1; j < n; j++) {
            if (h.compare(j, i) < 0) {
                h.swap(i, j);
            }
            yield;
        }
        sorted++;
        if (rand() < 0.4) {
            const a = randIdx();
            const b = randIdx();
            if (a !== b) {
                h.swap(a, b);
                yield;
            }
        }
    }
}

// --- Anxiety Sort ---
export function* anxietySort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    const values: number[] = [];
    for (let i = 0; i < n; i++) {
        values.push(h.read(i));
    }
    values.sort((a, b) => a - b);
    for (let i = 0; i < n; i++) {
        h.write(i, values[i]);
        yield;
    }

    let checks = 0;
    while (checks < 20) {
        for (let i = 0; i < n - 1; i++) {
            h.compare(i, i + 1);
            yield;
        }
        checks++;
    }
}

// --- 6/7 Sort ---
export function* sixSevenSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    for (let i = n - 1; i >= 0; i--) {
        const val = h.read(i);
        const displayVal = Math.round(val * n);
        if (displayVal !== 6 && displayVal !== 7) {
            h.delete(i);
        }
        yield;
    }

    let isSorted = false;
    let passes = 0;
    while (!isSorted && passes < n) {
        isSorted = true;
        for (let i = 0; i < n - 1; i++) {
            if (h.compare(i, i + 1) > 0) {
                h.swap(i, i + 1);
                isSorted = false;
            }
            yield;
        }
        passes++;
    }
}

// --- Freak Sort ---
export function* freakSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - 1; j++) {
            h.read(j);
            h.read(j + 1);
            yield;
            if (h.compare(j, j + 1) > 0) {
                h.swap(j, j + 1);
            }
            yield;
        }
    }

    for (let i = 0; i < n; i++) {
        h.read(i);
        yield;
    }
}

// --- Unsort ---
export function* unsortAlgo(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    let alreadySorted = true;
    for (let i = 0; i < n - 1; i++) {
        if (h.compare(i, i + 1) > 0) {
            alreadySorted = false;
        }
        yield;
    }

    if (alreadySorted) return;

    let s = n * 1337 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (h.compare(i, j) < 0 && rand() < 0.15) {
                h.swap(i, j);
            }
            yield;
        }
    }
}

// --- Uranium Sort ---
export function* uraniumSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    let s = n * 7919 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    const radioactiveIdx = Math.floor(rand() * n);
    const contaminated = new Set<number>();
    contaminated.add(radioactiveIdx);
    h.pivot(radioactiveIdx);
    yield;

    let isSorted = false;
    let passes = 0;
    while (!isSorted && passes < n) {
        isSorted = true;
        for (let j = 0; j < n - 1; j++) {
            if (h.compare(j, j + 1) > 0) {
                h.swap(j, j + 1);
                isSorted = false;

                if (contaminated.has(j) || contaminated.has(j + 1)) {
                    if (!contaminated.has(j)) {
                        contaminated.add(j);
                        h.pivot(j);
                    }
                    if (!contaminated.has(j + 1)) {
                        contaminated.add(j + 1);
                        h.pivot(j + 1);
                    }
                }
            }
            yield;
        }
        passes++;
    }
}

// --- Bogo Sort ---
export function* bogoSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let s = n * 48271 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    let attempts = 0;
    const maxAttempts = n * n * 2;

    while (attempts < maxAttempts) {
        let sorted = true;
        for (let i = 0; i < n - 1; i++) {
            if (h.compare(i, i + 1) > 0) {
                sorted = false;
                break;
            }
            yield;
        }
        if (sorted) return;

        if (attempts % 3 === 0) {
            h.effect('chaosParticles');
        }
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            h.swap(i, j);
            yield;
        }
        attempts++;
    }

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (h.compare(j, j + 1) > 0) h.swap(j, j + 1);
            yield;
        }
    }
}

// --- Stalin Sort ---
export function* stalinSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let max = h.read(0);
    h.range(0, 0, 'approved');
    yield;

    for (let i = 1; i < n; i++) {
        const val = h.read(i);
        if (val >= max) {
            max = val;
            h.range(0, i, 'approved');
        } else {
            h.effect('purgeFlash', { indices: [i], values: [val] });
            h.delete(i);
        }
        yield;
    }
}

// --- Thanos Sort ---
export function* thanosSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let s = n * 999049 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    let snaps = 0;
    while (snaps < 4) {
        let sorted = true;
        for (let i = 0; i < n - 1; i++) {
            if (h.compare(i, i + 1) > 0) {
                sorted = false;
                break;
            }
            yield;
        }
        if (sorted) return;

        for (let i = 0; i < n; i++) {
            if (rand() < 0.5) {
                h.pivot(i);
                yield;
                h.effect('dust', { indices: [i], values: [h.read(i)] });
                h.delete(i);
                yield;
            }
        }
        snaps++;
    }

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (h.compare(j, j + 1) > 0) h.swap(j, j + 1);
            yield;
        }
    }
}

// --- Communism Sort ---
export function* communismSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += h.read(i);
        yield;
    }
    h.effect('redWash');
    const avg = sum / n;
    for (let i = 0; i < n; i++) {
        h.write(i, avg);
        yield;
    }
}

// --- Drunk Sort ---
export function* drunkSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let s = n * 31337 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    for (let pass = 0; pass < n * 2; pass++) {
        for (let j = 0; j < n - 1; j++) {
            const cmp = h.compare(j, j + 1);
            if (rand() < 0.2) {
                if (cmp <= 0) h.swap(j, j + 1);
            } else {
                if (cmp > 0) h.swap(j, j + 1);
            }
            yield;
        }
    }
}

// --- Miracle Sort ---
export function* miracleSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let prayers = 0;

    while (prayers < 15) {
        let sorted = true;
        for (let i = 0; i < n - 1; i++) {
            if (h.compare(i, i + 1) > 0) {
                sorted = false;
            }
            yield;
        }
        if (sorted) return;
        prayers++;
    }

    h.effect('holyBeam');

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (h.compare(j, j + 1) > 0) h.swap(j, j + 1);
            yield;
        }
    }
}

// --- Sacrifice Sort ---
export function* sacrificeSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    for (let pass = 0; pass < Math.floor(n / 3); pass++) {
        let maxIdx = 0;
        for (let i = 1; i < n; i++) {
            if (h.compare(i, maxIdx) > 0) {
                maxIdx = i;
            }
            yield;
        }
        h.pivot(maxIdx);
        yield;
        h.effect('sacrificeFlame', { indices: [maxIdx], values: [h.read(maxIdx)] });
        h.delete(maxIdx);
        yield;
    }

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (h.compare(j, j + 1) > 0) h.swap(j, j + 1);
            yield;
        }
    }
}

// --- Gravity Sort ---
export function* gravitySort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    for (let drop = 0; drop < n; drop++) {
        for (let i = n - 1; i > 0; i--) {
            if (h.compare(i - 1, i) > 0) {
                h.swap(i - 1, i);
            }
            yield;
        }
    }
}

// --- Procrastination Sort ---
export function* procrastinationSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let s = n * 80021 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    for (let stall = 0; stall < n; stall++) {
        const a = Math.floor(rand() * n);
        const b = Math.floor(rand() * n);
        h.read(a);
        h.read(b);
        h.compare(a, b);
        yield;
    }

    for (let i = 1; i < n; i++) {
        const keyVal = h.read(i);
        let j = i - 1;
        while (j >= 0 && h.compare(j, j + 1) > 0) {
            j--;
            yield;
        }
        const val = h.read(i);
        for (let k = i; k > j + 1; k--) {
            h.write(k, h.read(k - 1));
            yield;
        }
        h.write(j + 1, val);
        yield;
    }
}

// --- Paranoid Sort ---
export function* paranoidSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            h.compare(j, j + 1);
            yield;
            h.compare(j, j + 1);
            yield;
            h.compare(j, j + 1);
            yield;
            if (h.compare(j, j + 1) > 0) {
                h.swap(j, j + 1);
            }
            yield;
        }
    }
}

// --- Influencer Sort ---
export function* influencerSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    const topK = Math.max(1, Math.floor(n * 0.1));

    for (let i = 0; i < topK; i++) {
        let maxIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (h.compare(j, maxIdx) > 0) {
                maxIdx = j;
            }
            yield;
        }
        h.swap(i, maxIdx);
        h.pivot(i);
        h.effect('spotlight', { indices: [i] });
        yield;
    }

    for (let i = topK; i < n; i++) {
        h.read(i);
        yield;
    }
}

// --- Spaghetti Sort ---
export function* spaghettiSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 3) || (gap === 1 ? 0 : 1)) {
        for (let offset = 0; offset < gap; offset++) {
            for (let i = offset + gap; i < n; i += 1) {
                for (let j = i; j >= gap; j -= gap) {
                    if (h.compare(j - gap, j) > 0) {
                        h.swap(j - gap, j);
                    } else {
                        break;
                    }
                    yield;
                }
            }
        }
    }
}

// --- Zombie Sort ---
export function* zombieSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let s = n * 66613 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    for (let wave = 0; wave < 5; wave++) {
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (h.compare(j, j + 1) > 0) h.swap(j, j + 1);
                yield;
            }
        }

        if (wave < 4) {
            const resurrections = Math.floor(n * 0.15);
            for (let r = 0; r < resurrections; r++) {
                const a = Math.floor(rand() * n);
                const b = Math.floor(rand() * n);
                if (a !== b) {
                    h.effect('infectGlow', { indices: [a, b] });
                    h.pivot(a);
                    h.pivot(b);
                    h.swap(a, b);
                    yield;
                }
            }
        }
    }
}

// --- Gaslighting Sort ---
export function* gaslightingSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;
    let s = n * 54321 | 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };

    for (let cycle = 0; cycle < 4; cycle++) {
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (h.compare(j, j + 1) > 0) h.swap(j, j + 1);
                yield;
            }
        }

        if (cycle < 3) {
            const nudges = Math.floor(n * 0.1);
            for (let r = 0; r < nudges; r++) {
                const idx = Math.floor(rand() * (n - 1));
                h.swap(idx, idx + 1);
                yield;
            }
        }
    }
}

// --- Optimist Sort ---
export function* optimistSort(h: SortHelpers): Generator<void, void, unknown> {
    const n = h.length;

    for (let j = 0; j < n - 1; j++) {
        if (h.compare(j, j + 1) > 0) {
            h.swap(j, j + 1);
        }
        yield;
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
    'ADHD Sort': adhdSort,
    'Anxiety Sort': anxietySort,
    '6/7 Sort': sixSevenSort,
    'Freak Sort': freakSort,
    'Unsort': unsortAlgo,
    'Uranium Sort': uraniumSort,
    'Bogo Sort': bogoSort,
    'Stalin Sort': stalinSort,
    'Thanos Sort': thanosSort,
    'Communism Sort': communismSort,
    'Drunk Sort': drunkSort,
    'Miracle Sort': miracleSort,
    'Sacrifice Sort': sacrificeSort,
    'Gravity Sort': gravitySort,
    'Procrastination Sort': procrastinationSort,
    'Paranoid Sort': paranoidSort,
    'Influencer Sort': influencerSort,
    'Spaghetti Sort': spaghettiSort,
    'Zombie Sort': zombieSort,
    'Gaslighting Sort': gaslightingSort,
    'Optimist Sort': optimistSort,
};

export const algorithmGroups: { label: string; algorithms: string[] }[] = [
    {
        label: 'Standard',
        algorithms: ['Bubble Sort', 'Insertion Sort', 'Selection Sort', 'Quick Sort', 'Merge Sort', 'Heap Sort'],
    },
    {
        label: 'Esoteric',
        algorithms: ['ADHD Sort', 'Anxiety Sort', '6/7 Sort', 'Freak Sort', 'Unsort', 'Uranium Sort'],
    },
    {
        label: 'Unhinged',
        algorithms: [
            'Bogo Sort', 'Stalin Sort', 'Thanos Sort', 'Communism Sort', 'Drunk Sort',
            'Miracle Sort', 'Sacrifice Sort', 'Gravity Sort', 'Procrastination Sort',
            'Paranoid Sort', 'Influencer Sort', 'Spaghetti Sort', 'Zombie Sort',
            'Gaslighting Sort', 'Optimist Sort',
        ],
    },
];
