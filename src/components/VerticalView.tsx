'use client';

import { useMemo } from 'react';
import { algorithmInfo } from '@/lib/algorithmInfo';
import { type ThemeConfig } from '@/lib/themes';
import { CodeStepper } from './CodeStepper';
import styles from './VerticalView.module.css';

interface VerticalViewProps {
    array: number[];
    highlights: {
        compare: Set<number>;
        swap: Set<number>;
        write: Set<number>;
        pivot: Set<number>;
        range: [number, number] | null;
    };
    verifiedIndex: number;
    algorithmName: string;
    lastEventType: string | null;
    theme: ThemeConfig;
    deletedIndices: Set<number>;
}

export function VerticalView({
    array,
    highlights,
    verifiedIndex,
    algorithmName,
    lastEventType,
    theme,
    deletedIndices,
}: VerticalViewProps) {
    const info = algorithmInfo[algorithmName];

    const displayValues = useMemo(() => {
        if (array.length === 0) return [];
        return array.map(v => Math.max(1, Math.round(v * array.length)));
    }, [array]);

    const maxValue = useMemo(() => {
        if (array.length === 0) return 1;
        return Math.max(...array, 0.001);
    }, [array]);

    const showLabels = array.length <= 30;
    const barGap = array.length <= 20 ? 4 : array.length <= 50 ? 2 : 1;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{info?.name ?? algorithmName}</h1>
                <p className={styles.description}>
                    {info?.description ?? 'Sorting algorithm visualization'}
                </p>
                {info?.complexity && (
                    <span className={styles.badge}>{info.complexity}</span>
                )}
            </div>

            <div className={styles.barsSection}>
                <div className={styles.barsContainer}>
                    {array.map((_, index) => {
                        const isDeleted = deletedIndices.has(index);
                        const heightPercent = Math.max(2, (array[index] / maxValue) * 100);

                        let barColor = theme.barColor;
                        let shadow = '';
                        let labelColor = '#a09888';

                        if (verifiedIndex >= 0 && index <= verifiedIndex) {
                            barColor = theme.verifiedColor;
                            labelColor = theme.verifiedColor;
                        } else if (highlights.pivot.has(index)) {
                            barColor = theme.pivotColor;
                            shadow = `0 2px 8px ${theme.pivotColor}59`;
                            labelColor = theme.pivotColor;
                        } else if (highlights.swap.has(index)) {
                            barColor = theme.swapColor;
                            shadow = `0 2px 8px ${theme.swapColor}59`;
                            labelColor = theme.swapColor;
                        } else if (highlights.write.has(index)) {
                            barColor = theme.writeColor;
                            shadow = `0 2px 8px ${theme.writeColor}59`;
                            labelColor = theme.writeColor;
                        } else if (highlights.compare.has(index)) {
                            barColor = theme.compareColor;
                            shadow = `0 2px 8px ${theme.compareColor}59`;
                            labelColor = theme.compareColor;
                        }

                        return (
                            <div
                                key={index}
                                className={`${styles.barWrapper} ${isDeleted ? styles.barDeleted : ''}`}
                                style={{ gap: isDeleted ? '0px' : `${barGap}px` }}
                            >
                                <div
                                    className={styles.bar}
                                    style={{
                                        height: isDeleted ? '0%' : `${heightPercent}%`,
                                        background: isDeleted ? '#ef4444' : barColor,
                                        boxShadow: shadow || undefined,
                                    }}
                                />
                                {showLabels && !isDeleted && (
                                    <span
                                        className={styles.barLabel}
                                        style={{ color: labelColor }}
                                    >
                                        {displayValues[index]}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.codeSection}>
                <CodeStepper
                    algorithmName={algorithmName}
                    activeEventType={lastEventType}
                />
            </div>
        </div>
    );
}
