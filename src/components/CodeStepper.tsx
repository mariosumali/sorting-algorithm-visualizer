'use client';

import { useMemo } from 'react';
import { algorithmInfo } from '@/lib/algorithmInfo';
import styles from './CodeStepper.module.css';

interface Token {
    text: string;
    type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'function' | 'bracket' | 'plain';
}

const KEYWORDS = new Set([
    'def', 'for', 'in', 'while', 'if', 'else', 'elif', 'return',
    'and', 'or', 'not', 'True', 'False', 'None', 'range', 'len',
    'function', 'let', 'const', 'var', 'throw', 'new', 'true', 'false',
]);

function tokenizeLine(line: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < line.length) {
        if (line[i] === '#') {
            tokens.push({ text: line.slice(i), type: 'comment' });
            break;
        }

        if (line[i] === '/' && i + 1 < line.length && line[i + 1] === '/') {
            tokens.push({ text: line.slice(i), type: 'comment' });
            break;
        }

        if (line[i] === ' ') {
            let j = i;
            while (j < line.length && line[j] === ' ') j++;
            tokens.push({ text: line.slice(i, j), type: 'plain' });
            i = j;
            continue;
        }

        if (line[i] === '"' || line[i] === "'") {
            const quote = line[i];
            let j = i + 1;
            while (j < line.length && line[j] !== quote) j++;
            tokens.push({ text: line.slice(i, j + 1), type: 'string' });
            i = j + 1;
            continue;
        }

        if (/\d/.test(line[i]) && (i === 0 || /[\s(,=<>+\-*/%:[\]{}!]/.test(line[i - 1]))) {
            let j = i;
            while (j < line.length && /[\d.]/.test(line[j])) j++;
            tokens.push({ text: line.slice(i, j), type: 'number' });
            i = j;
            continue;
        }

        if (/[[\](){}]/.test(line[i])) {
            tokens.push({ text: line[i], type: 'bracket' });
            i++;
            continue;
        }

        if (/[=<>!+\-*/%:,;.&|]/.test(line[i])) {
            let j = i;
            const two = line.slice(i, i + 2);
            const three = line.slice(i, i + 3);
            if (three === '!==' || three === '===') {
                j = i + 3;
            } else if (two === '<=' || two === '>=' || two === '!=' ||
                two === '+=' || two === '-=' || two === '=>' ||
                two === '++' || two === '--' || two === '&&' || two === '||') {
                j = i + 2;
            } else {
                j = i + 1;
            }
            tokens.push({ text: line.slice(i, j), type: 'operator' });
            i = j;
            continue;
        }

        if (/[a-zA-Z_]/.test(line[i])) {
            let j = i;
            while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
            const word = line.slice(i, j);

            if (KEYWORDS.has(word)) {
                tokens.push({ text: word, type: 'keyword' });
            } else if (j < line.length && line[j] === '(') {
                tokens.push({ text: word, type: 'function' });
            } else if (word[0] === word[0].toUpperCase() && word.length > 1 && /[a-z]/.test(word.slice(1))) {
                tokens.push({ text: word, type: 'function' });
            } else {
                tokens.push({ text: word, type: 'plain' });
            }
            i = j;
            continue;
        }

        tokens.push({ text: line[i], type: 'plain' });
        i++;
    }

    return tokens;
}

interface CodeStepperProps {
    algorithmName: string;
    activeEventType: string | null;
}

export function CodeStepper({ algorithmName, activeEventType }: CodeStepperProps) {
    const info = algorithmInfo[algorithmName];

    const activeLines = useMemo(() => {
        if (!info || !activeEventType) return new Set<number>();
        const lines = info.eventLineMap[activeEventType];
        return new Set(lines || []);
    }, [info, activeEventType]);

    const tokenizedLines = useMemo(() => {
        if (!info) return [];
        return info.code.map(line => tokenizeLine(line));
    }, [info]);

    if (!info) return null;

    return (
        <div className={styles.container}>
            <div className={styles.codeBlock}>
                {tokenizedLines.map((tokens, lineIdx) => {
                    const isEmpty = info.code[lineIdx].trim() === '';
                    return (
                        <div
                            key={lineIdx}
                            className={`${styles.line} ${activeLines.has(lineIdx) ? styles.lineActive : ''} ${isEmpty ? styles.lineEmpty : ''}`}
                        >
                            <span className={styles.lineNumber}>{isEmpty ? '' : lineIdx + 1}</span>
                            <span className={styles.lineContent}>
                                {tokens.map((token, tokenIdx) => (
                                    <span
                                        key={tokenIdx}
                                        className={styles[`token_${token.type}`]}
                                    >
                                        {token.text}
                                    </span>
                                ))}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
