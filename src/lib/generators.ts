/**
 * Array Data Generators
 */

export interface GeneratorOptions {
    n: number;
    seed?: number;
}

/** Seeded random number generator (xorshift128) */
function createRng(seed: number) {
    let s = seed;
    return () => {
        s ^= s << 13;
        s ^= s >> 17;
        s ^= s << 5;
        return (s >>> 0) / 4294967295;
    };
}

export function generateRandom(options: GeneratorOptions): number[] {
    const { n, seed = Date.now() } = options;
    const rng = createRng(seed);
    return Array.from({ length: n }, () => rng());
}

export function generateNearlySorted(options: GeneratorOptions, swaps = 5): number[] {
    const { n, seed = Date.now() } = options;
    const arr = Array.from({ length: n }, (_, i) => i / (n - 1));
    const rng = createRng(seed);
    const numSwaps = Math.max(1, Math.floor(n * 0.05)); // 5% swaps
    for (let i = 0; i < numSwaps; i++) {
        const a = Math.floor(rng() * n);
        const b = Math.floor(rng() * n);
        [arr[a], arr[b]] = [arr[b], arr[a]];
    }
    return arr;
}

export function generateReversed(options: GeneratorOptions): number[] {
    const { n } = options;
    return Array.from({ length: n }, (_, i) => 1 - i / (n - 1));
}

export function generateSorted(options: GeneratorOptions): number[] {
    const { n } = options;
    return Array.from({ length: n }, (_, i) => i / (n - 1));
}

export function generateFewUnique(options: GeneratorOptions, uniqueCount = 5): number[] {
    const { n, seed = Date.now() } = options;
    const rng = createRng(seed);
    const values = Array.from({ length: uniqueCount }, (_, i) => i / (uniqueCount - 1));
    return Array.from({ length: n }, () => values[Math.floor(rng() * uniqueCount)]);
}

export function generateSawtooth(options: GeneratorOptions, periods = 4): number[] {
    const { n } = options;
    const periodLength = Math.floor(n / periods);
    return Array.from({ length: n }, (_, i) => (i % periodLength) / periodLength);
}

export function generateSinusoid(options: GeneratorOptions, periods = 2): number[] {
    const { n } = options;
    return Array.from({ length: n }, (_, i) =>
        0.5 + 0.5 * Math.sin((i / n) * periods * 2 * Math.PI)
    );
}

export function generatePerlin(options: GeneratorOptions): number[] {
    const { n, seed = Date.now() } = options;
    const rng = createRng(seed);

    // Simple 1D perlin-like noise
    const octaves = 4;
    const result: number[] = [];

    for (let i = 0; i < n; i++) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let o = 0; o < octaves; o++) {
            const sampleX = (i / n) * frequency * 8;
            const noise = Math.sin(sampleX * (seed % 100) + rng() * 0.1);
            value += noise * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        result.push((value / maxValue + 1) / 2);
    }

    return result;
}

export function generateStairs(options: GeneratorOptions, steps = 8): number[] {
    const { n } = options;
    const stepSize = Math.floor(n / steps);
    return Array.from({ length: n }, (_, i) => Math.floor(i / stepSize) / (steps - 1));
}

export function generateMountains(options: GeneratorOptions): number[] {
    const { n } = options;
    const mid = n / 2;
    return Array.from({ length: n }, (_, i) => {
        const dist = Math.abs(i - mid) / mid;
        return 1 - dist;
    });
}

export function generateValley(options: GeneratorOptions): number[] {
    const { n } = options;
    const mid = n / 2;
    return Array.from({ length: n }, (_, i) => {
        const dist = Math.abs(i - mid) / mid;
        return dist;
    });
}

export function generatePipeOrgan(options: GeneratorOptions): number[] {
    const { n } = options;
    const mid = Math.floor(n / 2);
    const result: number[] = [];

    for (let i = 0; i < n; i++) {
        if (i < mid) {
            result.push(i / mid);
        } else {
            result.push(1 - (i - mid) / (n - mid));
        }
    }

    return result;
}

export const dataGenerators: Record<DataGeneratorType, (opts: GeneratorOptions) => number[]> = {
    random: generateRandom,
    nearlySorted: (opts) => generateNearlySorted(opts, 5),
    reversed: generateReversed,
    sorted: generateSorted,
    fewUnique: (opts) => generateFewUnique(opts, 5),
    sawtooth: (opts) => generateSawtooth(opts, 4),
    sinusoid: (opts) => generateSinusoid(opts, 2),
    perlin: generatePerlin,
    stairs: (opts) => generateStairs(opts, 8),
    mountains: generateMountains,
    valley: generateValley,
    pipe: generatePipeOrgan,
};

export type DataGeneratorType =
    | 'random'
    | 'nearlySorted'
    | 'reversed'
    | 'sorted'
    | 'fewUnique'
    | 'sawtooth'
    | 'sinusoid'
    | 'perlin'
    | 'stairs'
    | 'mountains'
    | 'valley'
    | 'pipe';
