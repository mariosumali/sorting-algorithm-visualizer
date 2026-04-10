'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BarRenderer, type BarRendererHandle } from '@/components/BarRenderer';
import { ControlPanel } from '@/components/ControlPanel';
import { VerticalView } from '@/components/VerticalView';
import { EffectOverlay } from '@/components/EffectOverlay';
import { createPlaybackController, type PlaybackState } from '@/lib/playback';
import { dataGenerators, makeUnique, type DataGeneratorType } from '@/lib/generators';
import { getAudioEngine } from '@/lib/audio';
import { getDefaultTheme, type ThemeConfig } from '@/lib/themes';
import type { SortEvent } from '@/lib/events';
import {
  type ActiveEffect,
  ALGORITHM_EFFECTS,
  type AmbientEffectType,
  getBarRect,
  createDustEffect,
  createHolyBeamEffect,
  createPurgeFlashEffect,
  createRedWashEffect,
  createInfectGlowEffect,
  createSacrificeFlameEffect,
  createChaosParticlesEffect,
  createSpotlightEffect,
} from '@/lib/effects';
import styles from './page.module.css';
import effectStyles from '@/components/EffectOverlay.module.css';

type ViewMode = 'standard' | 'vertical';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('Quick Sort');
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [state, setState] = useState<PlaybackState>('idle');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig>(getDefaultTheme);
  const [verifiedIndex, setVerifiedIndex] = useState<number>(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [highlights, setHighlights] = useState({
    compare: new Set<number>(),
    swap: new Set<number>(),
    write: new Set<number>(),
    pivot: new Set<number>(),
    range: null as [number, number] | null,
  });
  const [metrics, setMetrics] = useState({
    comparisons: 0,
    swaps: 0,
  });
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [ambientEffect, setAmbientEffect] = useState<AmbientEffectType>('none');
  const [deletedSet, setDeletedSet] = useState<Set<number>>(new Set());

  const controllerRef = useRef<ReturnType<typeof createPlaybackController> | null>(null);
  const arrayRef = useRef<number[]>([]);
  const deletedSetRef = useRef<Set<number>>(new Set());
  const audioRef = useRef(getAudioEngine());
  const barRendererRef = useRef<BarRendererHandle>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const initialData = dataGenerators.random({ n: 15, seed: Date.now() });
    setArray(initialData);
    arrayRef.current = [...initialData];

    return () => {
      controllerRef.current?.destroy();
      audioRef.current.destroy();
    };
  }, []);

  const startRecording = useCallback(() => {
    const canvas = barRendererRef.current?.getCanvas();
    if (!canvas) return;

    chunksRef.current = [];
    const videoStream = canvas.captureStream(60);
    const audioStream = audioRef.current.getAudioStream();

    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...(audioStream ? audioStream.getAudioTracks() : [])
    ]);

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    let selectedMimeType = 'video/webm';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 8000000,
      audioBitsPerSecond: 128000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const ext = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
      a.download = `sorting-${Date.now()}.${ext}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleRecordClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const runVerificationSweep = useCallback(() => {
    const arr = arrayRef.current;
    const audio = audioRef.current;
    const deleted = deletedSetRef.current;
    const livingIndices = arr.map((_, i) => i).filter(i => arr[i] > 0 && !deleted.has(i));
    let pos = 0;

    const sweep = () => {
      if (pos < livingIndices.length) {
        setVerifiedIndex(livingIndices[pos]);
        audio.playWrite(arr[livingIndices[pos]]);
        pos++;
        setTimeout(sweep, 15);
      } else {
        setTimeout(() => {
          setVerifiedIndex(-1);
        }, 500);
      }
    };

    sweep();
  }, []);

  const handleEvent = useCallback((event: SortEvent) => {
    const audio = audioRef.current;

    setLastEventType(event.type);

    setMetrics(prev => ({
      comparisons: prev.comparisons + (event.type === 'compare' ? 1 : 0),
      swaps: prev.swaps + (event.type === 'swap' ? 1 : 0),
    }));

    if (event.type === 'swap') {
      const { i, j } = event;
      const valI = arrayRef.current[i];
      const valJ = arrayRef.current[j];
      [arrayRef.current[i], arrayRef.current[j]] = [valJ, valI];
      setArray([...arrayRef.current]);
      audio.playSwap(valI, valJ);

      setDeletedSet(prev => {
        const iDel = prev.has(i);
        const jDel = prev.has(j);
        if (iDel === jDel) return prev;
        const next = new Set(prev);
        if (iDel && !jDel) { next.delete(i); next.add(j); }
        else if (jDel && !iDel) { next.delete(j); next.add(i); }
        deletedSetRef.current = next;
        return next;
      });

      setHighlights(prev => ({
        ...prev,
        swap: new Set([i, j]),
        compare: new Set(),
        write: new Set(),
      }));
    } else if (event.type === 'delete') {
      arrayRef.current[event.index] = 0;
      setArray([...arrayRef.current]);
      audio.playWrite(0);

      setDeletedSet(prev => {
        const next = new Set([...prev, event.index]);
        deletedSetRef.current = next;
        return next;
      });

      setHighlights(prev => ({
        ...prev,
        write: new Set([event.index]),
        compare: new Set(),
        swap: new Set(),
      }));
    } else if (event.type === 'write') {
      arrayRef.current[event.index] = event.value;
      setArray([...arrayRef.current]);
      audio.playWrite(event.value);

      setHighlights(prev => ({
        ...prev,
        write: new Set([event.index]),
        compare: new Set(),
        swap: new Set(),
      }));
    } else if (event.type === 'compare') {
      const valI = arrayRef.current[event.i];
      const valJ = arrayRef.current[event.j];
      audio.playCompare(valI, valJ);

      setHighlights(prev => ({
        ...prev,
        compare: new Set([event.i, event.j]),
        swap: new Set(),
        write: new Set(),
      }));
    } else if (event.type === 'pivot') {
      audio.playPivot(arrayRef.current[event.index]);
      setHighlights(prev => ({
        ...prev,
        pivot: new Set([...prev.pivot, event.index]),
      }));
    } else if (event.type === 'effect') {
      const arr = arrayRef.current;
      const cw = 1000;
      const ch = 640;

      const spawnBarEffect = (
        factory: (bx: number, by: number, bw: number, bh: number) => ActiveEffect,
        indices?: number[],
        values?: number[],
      ) => {
        const idxs = indices ?? [];
        const newEffects: ActiveEffect[] = [];
        for (const idx of idxs) {
          const val = values ? values[idxs.indexOf(idx)] : arr[idx];
          if (val === undefined || val <= 0) continue;
          const rect = getBarRect(idx, val, arr.length, cw, ch, deletedSetRef.current);
          newEffects.push(factory(rect.x, rect.y, rect.width, rect.height));
        }
        if (newEffects.length > 0) {
          setActiveEffects(prev => [...prev, ...newEffects]);
        }
      };

      switch (event.effect) {
        case 'dust':
          spawnBarEffect(createDustEffect, event.indices, event.values);
          break;
        case 'holyBeam':
          setActiveEffects(prev => [...prev, createHolyBeamEffect(cw, ch)]);
          break;
        case 'purgeFlash':
          spawnBarEffect(createPurgeFlashEffect, event.indices, event.values);
          break;
        case 'redWash':
          setActiveEffects(prev => [...prev, createRedWashEffect(cw)]);
          break;
        case 'infectGlow':
          spawnBarEffect(createInfectGlowEffect, event.indices);
          break;
        case 'sacrificeFlame':
          spawnBarEffect(createSacrificeFlameEffect, event.indices, event.values);
          break;
        case 'chaosParticles':
          setActiveEffects(prev => [...prev, createChaosParticlesEffect(cw, ch)]);
          break;
        case 'spotlight':
          spawnBarEffect(
            (bx, by, bw, _bh) => createSpotlightEffect(bx, by, bw),
            event.indices,
          );
          break;
      }
    }
  }, []);

  const handleEffectsUpdate = useCallback((effects: ActiveEffect[]) => {
    setActiveEffects(effects);
  }, []);

  const handleStart = useCallback((
    algorithm: string,
    dataType: DataGeneratorType,
    n: number,
    seed: number,
    speed: number,
    uniqueValues: boolean
  ) => {
    audioRef.current.resume();
    setVerifiedIndex(-1);
    setSelectedAlgorithm(algorithm);
    setLastEventType(null);
    setActiveEffects([]);
    setDeletedSet(new Set());
    deletedSetRef.current = new Set();

    const effectConfig = ALGORITHM_EFFECTS[algorithm];
    setAmbientEffect(effectConfig?.ambient ?? 'none');

    const generator = dataGenerators[dataType];
    const rawArray = generator({ n, seed });
    const newArray = uniqueValues ? makeUnique(rawArray) : rawArray;
    setArray(newArray);
    arrayRef.current = [...newArray];
    setMetrics({ comparisons: 0, swaps: 0 });

    const controller = createPlaybackController();
    controllerRef.current = controller;

    controller.onEvent(handleEvent);
    controller.onStateChange(setState);
    controller.onComplete(() => {
      setHighlights({
        compare: new Set(),
        swap: new Set(),
        write: new Set(),
        pivot: new Set(),
        range: null,
      });
      setAmbientEffect('none');
      setTimeout(runVerificationSweep, 200);
    });

    controller.setSpeed(speed);
    controller.start(algorithm, newArray, seed);
  }, [handleEvent, runVerificationSweep]);

  const handlePause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    controllerRef.current?.resume();
  }, []);

  const handleStep = useCallback(() => {
    controllerRef.current?.step();
  }, []);

  const handleReset = useCallback(() => {
    controllerRef.current?.reset();
    setMetrics({ comparisons: 0, swaps: 0 });
    setVerifiedIndex(-1);
    setLastEventType(null);
    setActiveEffects([]);
    setAmbientEffect('none');
    setDeletedSet(new Set());
    deletedSetRef.current = new Set();
    setHighlights({
      compare: new Set(),
      swap: new Set(),
      write: new Set(),
      pivot: new Set(),
      range: null,
    });
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    controllerRef.current?.setSpeed(speed);
  }, []);

  const handleAudioToggle = useCallback((enabled: boolean) => {
    setAudioEnabled(enabled);
    audioRef.current.setEnabled(enabled);
    if (enabled) {
      audioRef.current.resume();
    }
  }, []);

  const handleThemeChange = useCallback((newTheme: ThemeConfig) => {
    setTheme(newTheme);
  }, []);

  const isVertical = viewMode === 'vertical';

  const ambientClassMap: Record<AmbientEffectType, string> = {
    none: '',
    tilt: effectStyles.ambientTilt,
    wobble: effectStyles.ambientWobble,
    shake: effectStyles.ambientShake,
    glitch: effectStyles.ambientGlitch,
    holyPulse: effectStyles.ambientHolyPulse,
    redVignette: effectStyles.ambientRedVignette,
    greenFog: effectStyles.ambientGreenFog,
  };

  const ambientClass = ambientClassMap[ambientEffect] ?? '';
  const effectConfig = ALGORITHM_EFFECTS[selectedAlgorithm];
  const tintStyle = (ambientEffect !== 'none' && effectConfig?.tint)
    ? { boxShadow: `inset 0 0 0 2000px ${effectConfig.tint}` }
    : undefined;

  return (
    <main
      className={`${styles.main} ${isVertical ? styles.mainVertical : ''}`}
      style={!isVertical ? { background: theme.pageBackground } : undefined}
    >
      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleBtn} ${!isVertical ? styles.toggleBtnActive : ''}`}
          onClick={() => setViewMode('standard')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="18" rx="1" />
          </svg>
          Standard
        </button>
        <button
          className={`${styles.toggleBtn} ${isVertical ? styles.toggleBtnActive : ''}`}
          onClick={() => setViewMode('vertical')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="7" rx="1" />
            <rect x="3" y="14" width="18" height="7" rx="1" />
          </svg>
          Code Walkthrough
        </button>
      </div>

      {!isVertical ? (
        <div className={styles.container}>
          <div className={styles.visualizerSection}>
            <div
              className={`${styles.canvas} ${ambientClass}`}
              style={{
                background: theme.canvasBackground,
                ...tintStyle,
                overflow: 'hidden',
              }}
            >
              <div className={effectStyles.effectWrapper}>
              <BarRenderer
                ref={barRendererRef}
                array={array}
                highlights={highlights}
                theme={theme}
                verifiedIndex={verifiedIndex}
                deletedIndices={deletedSet}
                width={1000}
                height={640}
              />
                <EffectOverlay
                  effects={activeEffects}
                  onEffectsUpdate={handleEffectsUpdate}
                  width={1000}
                  height={640}
                />
              </div>
            </div>

            <div className={styles.legendBar}>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.dot} style={{ background: theme.compareColor }} />
                  Compare
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.dot} style={{ background: theme.swapColor }} />
                  Swap
                </span>
              </div>

              <button
                className={`${styles.recordButton} ${isRecording ? styles.recordingActive : ''}`}
                onClick={handleRecordClick}
              >
                {isRecording ? (
                  <>
                    <span className={styles.recordDot} />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                    Record
                  </>
                )}
              </button>
            </div>
          </div>

          <ControlPanel
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStep={handleStep}
            onReset={handleReset}
            onSpeedChange={handleSpeedChange}
            onAudioToggle={handleAudioToggle}
            onThemeChange={handleThemeChange}
            onAlgorithmChange={setSelectedAlgorithm}
            state={state}
            metrics={metrics}
            audioEnabled={audioEnabled}
            theme={theme}
          />
        </div>
      ) : (
        <div className={styles.verticalLayout}>
          <VerticalView
            array={array}
            highlights={highlights}
            verifiedIndex={verifiedIndex}
            algorithmName={selectedAlgorithm}
            lastEventType={lastEventType}
            theme={theme}
            deletedIndices={deletedSet}
          />

          <ControlPanel
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStep={handleStep}
            onReset={handleReset}
            onSpeedChange={handleSpeedChange}
            onAudioToggle={handleAudioToggle}
            onThemeChange={handleThemeChange}
            onAlgorithmChange={setSelectedAlgorithm}
            state={state}
            metrics={metrics}
            audioEnabled={audioEnabled}
            theme={theme}
          />
        </div>
      )}
    </main>
  );
}
