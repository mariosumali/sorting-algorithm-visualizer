'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BarRenderer, type BarRendererHandle } from '@/components/BarRenderer';
import { ControlPanel } from '@/components/ControlPanel';
import { createPlaybackController, type PlaybackState } from '@/lib/playback';
import { dataGenerators, type DataGeneratorType } from '@/lib/generators';
import { getAudioEngine } from '@/lib/audio';
import type { SortEvent } from '@/lib/events';
import styles from './page.module.css';

export default function Home() {
  const [array, setArray] = useState<number[]>([]);
  const [state, setState] = useState<PlaybackState>('idle');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [barColor, setBarColor] = useState('#cbd5e1');
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

  const controllerRef = useRef<ReturnType<typeof createPlaybackController> | null>(null);
  const arrayRef = useRef<number[]>([]);
  const audioRef = useRef(getAudioEngine());
  const barRendererRef = useRef<BarRendererHandle>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const initialData = dataGenerators.random({ n: 100, seed: Date.now() });
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
    const stream = canvas.captureStream(60); // 60 fps
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000, // 5 Mbps for quality
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sorting-${Date.now()}.webm`;
      a.click();
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

  const runVerificationSweep = useCallback(() => {
    const arr = arrayRef.current;
    const audio = audioRef.current;
    let index = 0;

    const sweep = () => {
      if (index < arr.length) {
        setVerifiedIndex(index);
        audio.playWrite(arr[index]); // Play sound for each bar
        index++;
        setTimeout(sweep, 15); // Fast sweep
      } else {
        // Sweep complete
        setTimeout(() => {
          setVerifiedIndex(-1);
          // Auto-stop recording after verification sweep
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            setTimeout(stopRecording, 500);
          }
        }, 500);
      }
    };

    sweep();
  }, [stopRecording]);

  const handleEvent = useCallback((event: SortEvent) => {
    const audio = audioRef.current;

    // Update metrics
    setMetrics(prev => ({
      comparisons: prev.comparisons + (event.type === 'compare' ? 1 : 0),
      swaps: prev.swaps + (event.type === 'swap' ? 1 : 0),
    }));

    // Apply event
    if (event.type === 'swap') {
      const { i, j } = event;
      const valI = arrayRef.current[i];
      const valJ = arrayRef.current[j];
      [arrayRef.current[i], arrayRef.current[j]] = [valJ, valI];
      setArray([...arrayRef.current]);
      audio.playSwap(valI, valJ);

      setHighlights(prev => ({
        ...prev,
        swap: new Set([i, j]),
        compare: new Set(),
        write: new Set(),
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
        pivot: new Set([event.index]),
      }));
    }
  }, []);

  const handleStart = useCallback((
    algorithm: string,
    dataType: DataGeneratorType,
    n: number,
    seed: number
  ) => {
    // Initialize audio on user gesture
    audioRef.current.resume();
    setVerifiedIndex(-1);

    const generator = dataGenerators[dataType];
    const newArray = generator({ n, seed });
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
      // Run verification sweep after sorting completes
      setTimeout(runVerificationSweep, 200);
    });

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
    setHighlights({
      compare: new Set(),
      swap: new Set(),
      write: new Set(),
      pivot: new Set(),
      range: null,
    });
    // Stop recording if active
    stopRecording();
  }, [stopRecording]);

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

  const handleColorChange = useCallback((color: string) => {
    setBarColor(color);
  }, []);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.visualizerSection}>
          <div className={styles.canvas}>
            <BarRenderer
              ref={barRendererRef}
              array={array}
              highlights={highlights}
              barColor={barColor}
              verifiedIndex={verifiedIndex}
              width={1000}
              height={640}
            />
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.dot} style={{ background: '#3b82f6' }} />
              Compare
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dot} style={{ background: '#ef4444' }} />
              Swap
            </span>
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
          onColorChange={handleColorChange}
          onRecordToggle={handleRecordToggle}
          state={state}
          metrics={metrics}
          audioEnabled={audioEnabled}
          barColor={barColor}
          isRecording={isRecording}
        />
      </div>
    </main>
  );
}
