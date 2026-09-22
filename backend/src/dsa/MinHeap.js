/**
 * Custom Min-Heap Implementation for Priority Doctor Queue Management.
 * 
 * Score Formula:
 * priorityScore = basePosition - (isEmergency ? 1000 : 0) - (isSeniorCitizen ? 50 : 0) - (waitingTimeMinutes * 0.5)
 * 
 * Lower priority score = higher urgency / seen sooner.
 */

class MinHeap {
  constructor() {
    this.heap = [];
  }

  /**
   * Calculates the priority score for a queue item.
   * @param {Object} item - Queue node
   * @param {Date} [now=new Date()] - Reference timestamp
   * @returns {number} Calculated priority score
   */
  static calculateScore(item, now = new Date()) {
    const basePosition = item.basePosition || 0;
    const isEmergencyBonus = item.isEmergency ? 1000 : 0;
    const isSeniorBonus = item.isSeniorCitizen ? 50 : 0;
    
    const joinedAtTime = new Date(item.joinedAt).getTime();
    const currentTime = new Date(now).getTime();
    const waitingTimeMinutes = Math.max(0, (currentTime - joinedAtTime) / (1000 * 60));
    const waitingTimeBonus = waitingTimeMinutes * 0.5;

    return basePosition - isEmergencyBonus - isSeniorBonus - waitingTimeBonus;
  }

  /**
   * Helper: Parent index in binary tree
   */
  getParentIndex(i) {
    return Math.floor((i - 1) / 2);
  }

  /**
   * Helper: Left child index
   */
  getLeftChildIndex(i) {
    return 2 * i + 1;
  }

  /**
   * Helper: Right child index
   */
  getRightChildIndex(i) {
    return 2 * i + 2;
  }

  /**
   * Helper: Swap elements in internal array
   */
  swap(i1, i2) {
    const temp = this.heap[i1];
    this.heap[i1] = this.heap[i2];
    this.heap[i2] = temp;
  }

  /**
   * Sift-up balancing step
   */
  siftUp(index) {
    let currentIndex = index;
    while (
      currentIndex > 0 &&
      this.heap[currentIndex].priorityScore < this.heap[this.getParentIndex(currentIndex)].priorityScore
    ) {
      const parentIndex = this.getParentIndex(currentIndex);
      this.swap(currentIndex, parentIndex);
      currentIndex = parentIndex;
    }
  }

  /**
   * Sift-down balancing step
   */
  siftDown(index) {
    let currentIndex = index;
    let minIndex = currentIndex;
    const size = this.heap.length;

    while (true) {
      const leftIndex = this.getLeftChildIndex(currentIndex);
      const rightIndex = this.getRightChildIndex(currentIndex);

      if (
        leftIndex < size &&
        this.heap[leftIndex].priorityScore < this.heap[minIndex].priorityScore
      ) {
        minIndex = leftIndex;
      }

      if (
        rightIndex < size &&
        this.heap[rightIndex].priorityScore < this.heap[minIndex].priorityScore
      ) {
        minIndex = rightIndex;
      }

      if (currentIndex !== minIndex) {
        this.swap(currentIndex, minIndex);
        currentIndex = minIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Inserts an entry into the heap.
   * @param {Object} item 
   */
  insert(item) {
    const score = item.priorityScore !== undefined 
      ? item.priorityScore 
      : MinHeap.calculateScore(item);

    const node = {
      ...item,
      priorityScore: score
    };

    this.heap.push(node);
    this.siftUp(this.heap.length - 1);
    return node;
  }

  /**
   * Returns and removes the item with highest priority (lowest score).
   */
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.siftDown(0);
    return min;
  }

  /**
   * Peeks at the top priority item without removing it.
   */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Removes an entry by appointmentId (used for cancellations or manual overrides).
   */
  removeByAppointmentId(appointmentId) {
    const targetIdStr = appointmentId.toString();
    const index = this.heap.findIndex(
      node => node.appointmentId && node.appointmentId.toString() === targetIdStr
    );

    if (index === -1) return null;

    if (index === this.heap.length - 1) {
      return this.heap.pop();
    }

    const removedNode = this.heap[index];
    this.heap[index] = this.heap.pop();
    
    // Balance node at index
    this.siftUp(index);
    this.siftDown(index);
    return removedNode;
  }

  /**
   * Recalculates all priority scores based on current timestamp and rebuilds heap.
   */
  recalculateAndReheap(now = new Date()) {
    for (let i = 0; i < this.heap.length; i++) {
      this.heap[i].priorityScore = MinHeap.calculateScore(this.heap[i], now);
    }
    // Re-heapify from last non-leaf node down to root
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.siftDown(i);
    }
  }

  /**
   * Returns array of nodes sorted by priority (top of queue first) without mutating heap.
   */
  toSortedArray() {
    const clone = new MinHeap();
    clone.heap = this.heap.map(node => ({ ...node }));
    const result = [];
    while (!clone.isEmpty()) {
      result.push(clone.extractMin());
    }
    return result;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  size() {
    return this.heap.length;
  }
}

module.exports = MinHeap;
