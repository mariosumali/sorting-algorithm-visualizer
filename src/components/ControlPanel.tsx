'use client';

import { useState } from 'react';
import { algorithms } from '@/lib/algorithms';
import { type DataGeneratorType } from '@/lib/generators';
import styles from './ControlPanel.module.css';

const COLOR_PRESETS = [
    { name: 'Slate', value: '#cbd5e1' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Cyan', value: '#22d3d1' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'White', value: '#ffffff' },
];

interface ControlPanelProps {
    onStart: (algorithm: string, dataType: DataGeneratorType, n: number, seed: number) => void;
    onPause: () => void;
    onResume: () => void;
    onStep: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onAudioToggle: (enabled: boolean) => void;
    onColorChange: (color: string) => void;
    onRecordToggle: () => void;
    state: 'idle' | 'running' | 'paused' | 'complete';
    metrics: {
        comparisons: number;
        swaps: number;
    };
    audioEnabled: boolean;
    barColor: string;
    isRecording: boolean;
}

export function ControlPanel({
    onStart,
    onPause,
    onResume,
    onStep,
    onReset,
    onSpeedChange,
    onAudioToggle,
    onColorChange,
    onRecordToggle,
    state,
    metrics,
    audioEnabled,
    barColor,
    isRecording,
}: ControlPanelProps) {
    const [algorithm, setAlgorithm] = useState('Quick Sort');
    const [dataType, setDataType] = useState<DataGeneratorType>('random');
    const [arraySize, setArraySize] = useState(100);
    const [speed, setSpeed] = useState(200);
    const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000));

    // UI State
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isColorCollapsed, setIsColorCollapsed] = useState(true);

    const handleStart = () => {
        onStart(algorithm, dataType, arraySize, seed);
    };

    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        onSpeedChange(newSpeed);
    };

    const handleNewSeed = () => {
        setSeed(Math.floor(Math.random() * 1000000));
    };

    const handleSizeInput = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 10 && num <= 999) {
            setArraySize(num);
        }
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
                    onChange={(e) => setAlgorithm(e.target.value)}
                    disabled={isRunning}
                >
                    {Object.keys(algorithms).map((name) => (
                        <option key={name} value={name}>{name}</option>
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
            </div>

            {/* Size */}
            <div className={styles.group}>
                <label className={styles.label}>Array Size</label>
                <div className={styles.sizeRow}>
                    <input
                        type="range"
                        className={styles.range}
                        min="10"
                        max="999"
                        value={arraySize}
                        onChange={(e) => setArraySize(Number(e.target.value))}
                        disabled={isRunning}
                    />
                    <input
                        type="number"
                        className={styles.sizeInput}
                        min="10"
                        max="999"
                        value={arraySize}
                        onChange={(e) => handleSizeInput(e.target.value)}
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
                <input
                    type="range"
                    className={styles.range}
                    min="1"
                    max="1000"
                    value={speed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                />
            </div>

            {/* Seed */}
            <div className={styles.group}>
                <label className={styles.label}>Seed</label>
                <div className={styles.seedRow}>
                    <input
                        type="number"
                        className={styles.seedInput}
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
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

            {/* Bar Color (Collapsible) */}
            <div className={styles.group}>
                <button
                    className={styles.collapseHeader}
                    onClick={() => setIsColorCollapsed(!isColorCollapsed)}
                >
                    <label className={styles.label} style={{ cursor: 'pointer', pointerEvents: 'none' }}>Bar Color</label>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transform: isColorCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {!isColorCollapsed && (
                    <div className={styles.colorRow}>
                        {COLOR_PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                className={`${styles.colorSwatch} ${barColor === preset.value ? styles.colorActive : ''}`}
                                style={{ background: preset.value }}
                                onClick={() => onColorChange(preset.value)}
                                title={preset.name}
                            />
                        ))}
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

            {/* Record Toggle */}
            <div className={styles.group}>
                <div className={styles.toggleRow}>
                    <label className={styles.label}>
                        Record
                        {isRecording && <span className={styles.recordIndicator} />}
                    </label>
                    <button
                        className={`${styles.toggleButton} ${isRecording ? styles.toggleOn : ''} ${isRecording ? styles.recordingActive : ''}`}
                        onClick={onRecordToggle}
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
