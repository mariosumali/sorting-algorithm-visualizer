'use client';

import { useState } from 'react';
import { algorithms, algorithmGroups } from '@/lib/algorithms';
import { type DataGeneratorType } from '@/lib/generators';
import { THEME_PRESETS, THEME_KEYS, type ThemeConfig } from '@/lib/themes';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
    onStart: (algorithm: string, dataType: DataGeneratorType, n: number, seed: number, speed: number, uniqueValues: boolean) => void;
    onPause: () => void;
    onResume: () => void;
    onStep: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onAudioToggle: (enabled: boolean) => void;
    onThemeChange: (theme: ThemeConfig) => void;
    onAlgorithmChange?: (algorithm: string) => void;
    state: 'idle' | 'running' | 'paused' | 'complete';
    metrics: {
        comparisons: number;
        swaps: number;
    };
    audioEnabled: boolean;
    theme: ThemeConfig;
}

type ThemeColorKey = keyof Pick<
    ThemeConfig,
    'canvasBackground' | 'pageBackground' | 'barColor' | 'compareColor' | 'swapColor' | 'writeColor' | 'pivotColor' | 'verifiedColor'
>;

const COLOR_FIELDS: { key: ThemeColorKey; label: string }[] = [
    { key: 'pageBackground', label: 'Page' },
    { key: 'canvasBackground', label: 'Canvas' },
    { key: 'barColor', label: 'Bars' },
    { key: 'compareColor', label: 'Compare' },
    { key: 'swapColor', label: 'Swap' },
    { key: 'writeColor', label: 'Write' },
    { key: 'pivotColor', label: 'Pivot' },
    { key: 'verifiedColor', label: 'Verified' },
];

export function ControlPanel({
    onStart,
    onPause,
    onResume,
    onStep,
    onReset,
    onSpeedChange,
    onAudioToggle,
    onThemeChange,
    onAlgorithmChange,
    state,
    metrics,
    audioEnabled,
    theme,
}: ControlPanelProps) {
    const [algorithm, setAlgorithm] = useState('Quick Sort');
    const [dataType, setDataType] = useState<DataGeneratorType>('random');
    const [arraySize, setArraySize] = useState(15);
    const [speed, setSpeed] = useState(10);
    const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000));
    const [uniqueValues, setUniqueValues] = useState(false);

    const [sizeText, setSizeText] = useState('15');
    const [speedText, setSpeedText] = useState('10');
    const [seedText, setSeedText] = useState(String(seed));

    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isAppearanceCollapsed, setIsAppearanceCollapsed] = useState(true);
    const [showColorDetails, setShowColorDetails] = useState(false);

    const handleStart = () => {
        onStart(algorithm, dataType, arraySize, seed, speed, uniqueValues);
    };

    const handleSpeedSlider = (newSpeed: number) => {
        setSpeed(newSpeed);
        setSpeedText(String(newSpeed));
        onSpeedChange(newSpeed);
    };

    const handleSpeedTextChange = (value: string) => {
        setSpeedText(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 1 && num <= 1000) {
            setSpeed(num);
            onSpeedChange(num);
        }
    };

    const handleSpeedTextBlur = () => {
        setSpeedText(String(speed));
    };

    const handleSizeSlider = (value: number) => {
        setArraySize(value);
        setSizeText(String(value));
    };

    const handleSizeTextChange = (value: string) => {
        setSizeText(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 2 && num <= 999) {
            setArraySize(num);
        }
    };

    const handleSizeTextBlur = () => {
        setSizeText(String(arraySize));
    };

    const handleSeedTextChange = (value: string) => {
        setSeedText(value);
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
            setSeed(num);
        }
    };

    const handleSeedTextBlur = () => {
        setSeedText(String(seed));
    };

    const handleNewSeed = () => {
        const newSeed = Math.floor(Math.random() * 1000000);
        setSeed(newSeed);
        setSeedText(String(newSeed));
    };

    const handleThemePreset = (key: string) => {
        onThemeChange({ ...THEME_PRESETS[key] });
    };

    const handleColorField = (key: ThemeColorKey, value: string) => {
        onThemeChange({ ...theme, [key]: value });
    };

    const isRunning = state === 'running';
    const isPaused = state === 'paused';

    if (!isPanelOpen) {
        return (
            <button
                className={styles.openButton}
                onClick={() => setIsPanelOpen(true)}
                title="Open Settings"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>
        );
    }

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h2 className={styles.title}>Settings</h2>
                <button
                    className={styles.closeButton}
                    onClick={() => setIsPanelOpen(false)}
                    title="Close Settings"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Algorithm Selection */}
            <div className={styles.group}>
                <label className={styles.label}>Algorithm</label>
                <select
                    className={styles.select}
                    value={algorithm}
                    onChange={(e) => {
                        setAlgorithm(e.target.value);
                        onAlgorithmChange?.(e.target.value);
                    }}
                    disabled={isRunning}
                >
                    {algorithmGroups.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                            {group.algorithms.filter(name => name in algorithms).map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {/* Data Pattern */}
            <div className={styles.group}>
                <label className={styles.label}>Data Pattern</label>
                <select
                    className={styles.select}
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value as DataGeneratorType)}
                    disabled={isRunning}
                >
                    <option value="random">Random</option>
                    <option value="nearlySorted">Nearly Sorted</option>
                    <option value="reversed">Reversed</option>
                    <option value="sorted">Sorted</option>
                    <option value="fewUnique">Few Unique</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="sinusoid">Sinusoid</option>
                    <option value="perlin">Perlin Noise</option>
                    <option value="stairs">Stairs</option>
                    <option value="mountains">Mountains</option>
                    <option value="valley">Valley</option>
                    <option value="pipe">Pipe Organ</option>
                </select>

                <div className={styles.toggleRow}>
                    <label className={styles.subLabel}>Unique Values (1–N)</label>
                    <button
                        className={`${styles.toggleButton} ${uniqueValues ? styles.toggleOn : ''}`}
                        onClick={() => setUniqueValues(!uniqueValues)}
                        disabled={isRunning}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>
            </div>

            {/* Size */}
            <div className={styles.group}>
                <label className={styles.label}>Array Size</label>
                <div className={styles.sizeRow}>
                    <input
                        type="range"
                        className={styles.range}
                        min="2"
                        max="999"
                        value={arraySize}
                        onChange={(e) => handleSizeSlider(Number(e.target.value))}
                        disabled={isRunning}
                    />
                    <input
                        type="text"
                        inputMode="numeric"
                        className={styles.sizeInput}
                        value={sizeText}
                        onChange={(e) => handleSizeTextChange(e.target.value)}
                        onBlur={handleSizeTextBlur}
                        disabled={isRunning}
                    />
                </div>
            </div>

            {/* Speed */}
            <div className={styles.group}>
                <label className={styles.label}>
                    Speed
                    <span className={styles.value}>{speed} ops/s</span>
                </label>
                <div className={styles.sizeRow}>
                    <input
                        type="range"
                        className={styles.range}
                        min="1"
                        max="1000"
                        value={speed}
                        onChange={(e) => handleSpeedSlider(Number(e.target.value))}
                    />
                    <input
                        type="text"
                        inputMode="numeric"
                        className={styles.sizeInput}
                        value={speedText}
                        onChange={(e) => handleSpeedTextChange(e.target.value)}
                        onBlur={handleSpeedTextBlur}
                    />
                </div>
            </div>

            {/* Seed */}
            <div className={styles.group}>
                <label className={styles.label}>Seed</label>
                <div className={styles.seedRow}>
                    <input
                        type="text"
                        inputMode="numeric"
                        className={styles.seedInput}
                        value={seedText}
                        onChange={(e) => handleSeedTextChange(e.target.value)}
                        onBlur={handleSeedTextBlur}
                        disabled={isRunning}
                    />
                    <button
                        className={styles.seedButton}
                        onClick={handleNewSeed}
                        disabled={isRunning}
                        title="Generate random seed"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Appearance (Collapsible) */}
            <div className={styles.group}>
                <button
                    className={styles.collapseHeader}
                    onClick={() => setIsAppearanceCollapsed(!isAppearanceCollapsed)}
                >
                    <label className={styles.label} style={{ cursor: 'pointer', pointerEvents: 'none' }}>Appearance</label>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transform: isAppearanceCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {!isAppearanceCollapsed && (
                    <div className={styles.appearanceContent}>
                        <label className={styles.subLabel}>Theme Preset</label>
                        <div className={styles.themeGrid}>
                            {THEME_KEYS.map((key) => {
                                const preset = THEME_PRESETS[key];
                                const isActive = theme.name === preset.name;
                                return (
                                    <button
                                        key={key}
                                        className={`${styles.themeSwatch} ${isActive ? styles.themeActive : ''}`}
                                        onClick={() => handleThemePreset(key)}
                                        title={preset.name}
                                    >
                                        <span
                                            className={styles.themePreview}
                                            style={{ background: preset.canvasBackground }}
                                        >
                                            <span className={styles.themeBar} style={{ background: preset.barColor, height: '60%' }} />
                                            <span className={styles.themeBar} style={{ background: preset.compareColor, height: '80%' }} />
                                            <span className={styles.themeBar} style={{ background: preset.swapColor, height: '45%' }} />
                                            <span className={styles.themeBar} style={{ background: preset.barColor, height: '70%' }} />
                                        </span>
                                        <span className={styles.themeLabel}>{preset.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            className={styles.detailToggle}
                            onClick={() => setShowColorDetails(!showColorDetails)}
                        >
                            <span>Customize Colors</span>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ transform: showColorDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {showColorDetails && (
                            <div className={styles.colorFields}>
                                {COLOR_FIELDS.map(({ key, label }) => (
                                    <div key={key} className={styles.colorField}>
                                        <label className={styles.colorFieldLabel}>{label}</label>
                                        <div className={styles.colorInputGroup}>
                                            <input
                                                type="color"
                                                className={styles.colorPicker}
                                                value={theme[key]}
                                                onChange={(e) => handleColorField(key, e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className={styles.colorHex}
                                                value={theme[key]}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                                                        handleColorField(key, v);
                                                    }
                                                }}
                                                spellCheck={false}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sound Toggle */}
            <div className={styles.group}>
                <div className={styles.toggleRow}>
                    <label className={styles.label}>Sound</label>
                    <button
                        className={`${styles.toggleButton} ${audioEnabled ? styles.toggleOn : ''}`}
                        onClick={() => onAudioToggle(!audioEnabled)}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                {state === 'idle' || state === 'complete' ? (
                    <button className={styles.btnPrimary} onClick={handleStart}>
                        Start
                    </button>
                ) : isRunning ? (
                    <button className={styles.btnSecondary} onClick={onPause}>
                        Pause
                    </button>
                ) : (
                    <div className={styles.pausedControls}>
                        <button className={styles.btnPrimary} onClick={onResume}>
                            Resume
                        </button>
                        <button className={styles.btnStep} onClick={onStep}>
                            Step
                        </button>
                    </div>
                )}
                {(isRunning || isPaused) && (
                    <button className={styles.btnReset} onClick={onReset}>
                        Reset
                    </button>
                )}
            </div>

            {/* Metrics */}
            <div className={styles.metrics}>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>Comparisons</span>
                    <span className={styles.metricValue}>{metrics.comparisons.toLocaleString()}</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>Swaps</span>
                    <span className={styles.metricValue}>{metrics.swaps.toLocaleString()}</span>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                Created by Mario Sumali
            </div>
        </div>
    );
}
