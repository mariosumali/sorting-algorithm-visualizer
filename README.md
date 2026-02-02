# Sorting Algorithm Visualizer

![Sorting Visualizer](/public/thumbnail.png)

A modern, high-performance sorting algorithm visualizer built with Next.js, TypeScript, and Web Audio API.

## Features

- **Real-time Visualization**: Watch algorithms sort arrays of up to 999 elements in real-time.
- **Audio Feedback**: Listen to the sorting process with deterministic audio synthesis (Web Audio API).
- **Multiple Algorithms**:
  - Bubble Sort
  - Insertion Sort
  - Selection Sort
  - Quick Sort
  - Merge Sort
  - Heap Sort
- **Data Patterns**: Random, Nearly Sorted, Reversed, Sorted, Few Unique, Sawtooth, Sinusoid, Perlin Noise, Stairs, Mountains, Valley, Pipe Organ.
- **Professional UI**:
  - Collapsible settings panel
  - Customizable bar colors with presets
  - Scalable canvas rendering
  - Dark mode visualization with light mode controls
- **Interactive Controls**:
  - Adjustable speed (1-1000 ops/s)
  - Array size control (10-999)
  - Seeded random generation for reproducible runs
  - Step-by-step execution mode

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Audio**: Web Audio API (Oscillators, Gain Nodes, Compressor)
- **State Management**: React Hooks + Web Workers (for off-main-thread processing)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/mariosumali/sorting-algorithm-visualizer.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

- **Event-Driven**: The sorting logic runs in a Web Worker and emits events (Compare, Swap, Write, Pivot) to the main thread.
- **Generator Functions**: Algorithms are implemented as generators, allowing for pausing, stepping, and speed control without blocking the UI.
- **Canvas Rendering**: Optimized canvas renderer handles large datasets smoothly.

## Credits

Created by Mario Sumali.
