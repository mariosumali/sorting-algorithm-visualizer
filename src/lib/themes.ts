export interface ThemeConfig {
  name: string;
  canvasBackground: string;
  pageBackground: string;
  barColor: string;
  compareColor: string;
  swapColor: string;
  writeColor: string;
  pivotColor: string;
  verifiedColor: string;
}

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  default: {
    name: 'Default',
    canvasBackground: '#0f172a',
    pageBackground: '#f8fafc',
    barColor: '#cbd5e1',
    compareColor: '#3b82f6',
    swapColor: '#ef4444',
    writeColor: '#22c55e',
    pivotColor: '#f97316',
    verifiedColor: '#22c55e',
  },
  midnight: {
    name: 'Midnight',
    canvasBackground: '#030712',
    pageBackground: '#111827',
    barColor: '#6366f1',
    compareColor: '#818cf8',
    swapColor: '#f43f5e',
    writeColor: '#34d399',
    pivotColor: '#fbbf24',
    verifiedColor: '#34d399',
  },
  neon: {
    name: 'Neon',
    canvasBackground: '#09090b',
    pageBackground: '#18181b',
    barColor: '#22d3ee',
    compareColor: '#a855f7',
    swapColor: '#f43f5e',
    writeColor: '#4ade80',
    pivotColor: '#facc15',
    verifiedColor: '#4ade80',
  },
  ocean: {
    name: 'Ocean',
    canvasBackground: '#0c1222',
    pageBackground: '#e0f2fe',
    barColor: '#38bdf8',
    compareColor: '#2dd4bf',
    swapColor: '#fb7185',
    writeColor: '#a3e635',
    pivotColor: '#fbbf24',
    verifiedColor: '#a3e635',
  },
  sunset: {
    name: 'Sunset',
    canvasBackground: '#1c1017',
    pageBackground: '#fef2f2',
    barColor: '#fb923c',
    compareColor: '#f472b6',
    swapColor: '#fbbf24',
    writeColor: '#a3e635',
    pivotColor: '#e879f9',
    verifiedColor: '#a3e635',
  },
  monochrome: {
    name: 'Mono',
    canvasBackground: '#000000',
    pageBackground: '#e5e5e5',
    barColor: '#d4d4d4',
    compareColor: '#a3a3a3',
    swapColor: '#ffffff',
    writeColor: '#737373',
    pivotColor: '#e5e5e5',
    verifiedColor: '#737373',
  },
  forest: {
    name: 'Forest',
    canvasBackground: '#052e16',
    pageBackground: '#f0fdf4',
    barColor: '#86efac',
    compareColor: '#67e8f9',
    swapColor: '#fca5a5',
    writeColor: '#fde047',
    pivotColor: '#c084fc',
    verifiedColor: '#fde047',
  },
  candy: {
    name: 'Candy',
    canvasBackground: '#1e1b4b',
    pageBackground: '#fdf2f8',
    barColor: '#f9a8d4',
    compareColor: '#c4b5fd',
    swapColor: '#fda4af',
    writeColor: '#86efac',
    pivotColor: '#fde68a',
    verifiedColor: '#86efac',
  },
};

export const THEME_KEYS = Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[];

export function getDefaultTheme(): ThemeConfig {
  return { ...THEME_PRESETS.default };
}
