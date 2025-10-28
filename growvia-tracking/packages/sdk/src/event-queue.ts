/**
 * Event Queue for Offline Support and Batching
 */

import type { TrackEventRequest } from '@growvia/shared';

const STORAGE_KEY = '_growvia_queue';
const MAX_QUEUE_SIZE = 100;

export class EventQueue {
  private queue: TrackEventRequest[] = [];
  private processing = false;

  constructor(private sendFn: (events: TrackEventRequest[]) => Promise<void>) {
    this.loadFromStorage();
  }

  /**
   * Add event to queue
   */
  add(event: TrackEventRequest): void {
    this.queue.push(event);
    
    // Limit queue size
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }
    
    this.saveToStorage();
  }

  /**
   * Process queue
   */
  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      const eventsToSend = [...this.queue];
      await this.sendFn(eventsToSend);
      
      // Clear sent events
      this.queue = [];
      this.saveToStorage();
    } catch (error) {
      // Keep events in queue for retry
      console.error('Failed to send events:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }
}
