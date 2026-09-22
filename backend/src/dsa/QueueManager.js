const MinHeap = require('./MinHeap');

class QueueManager {
  constructor() {
    // Map of doctorId (string) -> MinHeap instance
    this.queues = new Map();
  }

  /**
   * Retrieves or initializes a MinHeap for a given doctor.
   * @param {string} doctorId 
   * @returns {MinHeap}
   */
  getOrCreateQueue(doctorId) {
    const docIdStr = doctorId.toString();
    if (!this.queues.has(docIdStr)) {
      this.queues.set(docIdStr, new MinHeap());
    }
    return this.queues.get(docIdStr);
  }

  /**
   * Adds an entry to a doctor's queue.
   */
  addToQueue(doctorId, queueItem) {
    const heap = this.getOrCreateQueue(doctorId);
    const existingIndex = heap.heap.findIndex(
      node => node.appointmentId && node.appointmentId.toString() === queueItem.appointmentId.toString()
    );
    if (existingIndex !== -1) {
      // Already in queue
      return heap.heap[existingIndex];
    }

    // Set base position as current queue length + 1 if not set
    if (!queueItem.basePosition) {
      queueItem.basePosition = heap.size() + 1;
    }

    const insertedNode = heap.insert(queueItem);
    return insertedNode;
  }

  /**
   * Removes an entry from a doctor's queue by appointmentId.
   */
  removeFromQueue(doctorId, appointmentId) {
    const docIdStr = doctorId.toString();
    if (!this.queues.has(docIdStr)) return null;
    const heap = this.queues.get(docIdStr);
    return heap.removeByAppointmentId(appointmentId);
  }

  /**
   * Pops and returns the next highest priority patient for a doctor.
   */
  getNextPatient(doctorId) {
    const docIdStr = doctorId.toString();
    if (!this.queues.has(docIdStr)) return null;
    const heap = this.queues.get(docIdStr);
    return heap.extractMin();
  }

  /**
   * Peeks at the next patient without advancing the queue.
   */
  peekNextPatient(doctorId) {
    const docIdStr = doctorId.toString();
    if (!this.queues.has(docIdStr)) return null;
    const heap = this.queues.get(docIdStr);
    return heap.peek();
  }

  /**
   * Returns a sorted array representing the live queue for UI rendering.
   */
  toSortedList(doctorId) {
    const docIdStr = doctorId.toString();
    if (!this.queues.has(docIdStr)) return [];
    const heap = this.queues.get(docIdStr);
    heap.recalculateAndReheap(new Date());
    return heap.toSortedArray();
  }

  /**
   * Finds position (1-indexed) of a patient in a doctor's queue.
   */
  getPatientPosition(doctorId, appointmentId) {
    const sortedList = this.toSortedList(doctorId);
    const targetIdStr = appointmentId.toString();
    const index = sortedList.findIndex(
      item => item.appointmentId && item.appointmentId.toString() === targetIdStr
    );
    return index !== -1 ? index + 1 : null;
  }

  /**
   * Hydrates in-memory queues from persistent DB QueueEntry documents on server start.
   */
  async hydrateFromDB(QueueEntryModel) {
    try {
      console.log('🔄 Hydrating Doctor Queue Heaps from MongoDB...');
      this.queues.clear();
      
      const waitingEntries = await QueueEntryModel.find({ status: 'waiting' })
        .populate('patientId', 'name email isSeniorCitizen phone')
        .populate('appointmentId')
        .lean();

      let hydratedCount = 0;
      for (const entry of waitingEntries) {
        const item = {
          queueEntryId: entry._id,
          appointmentId: entry.appointmentId ? entry.appointmentId._id : entry.appointmentId,
          doctorId: entry.doctorId,
          patientId: entry.patientId ? entry.patientId._id : entry.patientId,
          patientName: entry.patientId ? entry.patientId.name : 'Walk-In Patient',
          patientPhone: entry.patientId ? entry.patientId.phone : '',
          isEmergency: entry.isEmergency,
          isSeniorCitizen: entry.isSeniorCitizen || (entry.patientId ? entry.patientId.isSeniorCitizen : false),
          joinedAt: entry.joinedAt,
          basePosition: entry.basePosition || 1,
          status: entry.status
        };

        this.addToQueue(entry.doctorId, item);
        hydratedCount++;
      }
      console.log(`✅ QueueManager successfully hydrated ${hydratedCount} waiting queue entries into heaps.`);
    } catch (error) {
      console.error('⚠️ Failed to hydrate queue from DB:', error.message);
    }
  }
}

// Singleton QueueManager instance across application
const queueManager = new QueueManager();
module.exports = queueManager;
