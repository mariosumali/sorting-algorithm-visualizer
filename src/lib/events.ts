/**
 * Core Event Types for Sorting Algorithm Visualizer
 * 
 * The event system is the common "protocol" between the Worker (producer)
 * and the Renderer/Audio engine (consumers).
 */

// --- Event Type Discriminator ---
export type EventType =
  // Structural (Mutation)
  | 'swap'
  | 'write'
  | 'copy'
  | 'bulkWrite'
  // Read & Comparison
  | 'compare'
  | 'read'
  | 'scan'
  // Semantic Markers
  | 'pivot'
  | 'select'
  | 'partition'
  | 'range'
  | 'merge'
  | 'heapify'
  | 'bucket'
  | 'pass'
  // Lifecycle
  | 'start'
  | 'checkpoint'
  | 'done';

// --- Base Event Interface ---
interface BaseEvent {
  type: EventType;
  /** Monotonically increasing event ID */
  id: number;
}

// --- Structural Events ---
export interface SwapEvent extends BaseEvent {
  type: 'swap';
  i: number;
  j: number;
}

export interface WriteEvent extends BaseEvent {
  type: 'write';
  index: number;
  value: number;
}

export interface CopyEvent extends BaseEvent {
  type: 'copy';
  from: number;
  to: number;
}

export interface BulkWriteEvent extends BaseEvent {
  type: 'bulkWrite';
  startIndex: number;
  values: number[];
}

// --- Comparison & Read Events ---
export interface CompareEvent extends BaseEvent {
  type: 'compare';
  i: number;
  j: number;
  /** Result: -1 if arr[i] < arr[j], 0 if equal, 1 if greater */
  result?: -1 | 0 | 1;
}

export interface ReadEvent extends BaseEvent {
  type: 'read';
  index: number;
  value?: number;
}

export interface ScanEvent extends BaseEvent {
  type: 'scan';
  index: number;
}

// --- Semantic Marker Events ---
export interface PivotEvent extends BaseEvent {
  type: 'pivot';
  index: number;
}

export interface SelectEvent extends BaseEvent {
  type: 'select';
  index: number;
}

export interface PartitionEvent extends BaseEvent {
  type: 'partition';
  lo: number;
  hi: number;
}

export interface RangeEvent extends BaseEvent {
  type: 'range';
  lo: number;
  hi: number;
  label?: string;
}

export interface MergeEvent extends BaseEvent {
  type: 'merge';
  lo: number;
  mid: number;
  hi: number;
}

export interface HeapifyEvent extends BaseEvent {
  type: 'heapify';
  index: number;
  heapSize: number;
}

export interface BucketEvent extends BaseEvent {
  type: 'bucket';
  bucketIndex: number;
  indices?: number[];
}

export interface PassEvent extends BaseEvent {
  type: 'pass';
  passNumber: number;
  label?: string;
}

// --- Lifecycle Events ---
export interface StartEvent extends BaseEvent {
  type: 'start';
  algorithmName: string;
  arrayLength: number;
  seed?: number;
}

export interface CheckpointEvent extends BaseEvent {
  type: 'checkpoint';
  label: string;
}

export interface DoneEvent extends BaseEvent {
  type: 'done';
}

// --- Union Type ---
export type SortEvent =
  | SwapEvent
  | WriteEvent
  | CopyEvent
  | BulkWriteEvent
  | CompareEvent
  | ReadEvent
  | ScanEvent
  | PivotEvent
  | SelectEvent
  | PartitionEvent
  | RangeEvent
  | MergeEvent
  | HeapifyEvent
  | BucketEvent
  | PassEvent
  | StartEvent
  | CheckpointEvent
  | DoneEvent;

// --- Event Family (for toggling) ---
export type EventFamily = 'structural' | 'comparison' | 'marker' | 'lifecycle';

export function getEventFamily(type: EventType): EventFamily {
  switch (type) {
    case 'swap':
    case 'write':
    case 'copy':
    case 'bulkWrite':
      return 'structural';
    case 'compare':
    case 'read':
    case 'scan':
      return 'comparison';
    case 'pivot':
    case 'select':
    case 'partition':
    case 'range':
    case 'merge':
    case 'heapify':
    case 'bucket':
    case 'pass':
      return 'marker';
    case 'start':
    case 'checkpoint':
    case 'done':
      return 'lifecycle';
    default:
      return 'lifecycle';
  }
}
