const MinHeap = require('./MinHeap');

console.log('--- Testing Custom MinHeap Implementation ---');

const heap = new MinHeap();
const now = new Date();

// 1. Regular patient arriving first
const patient1 = {
  appointmentId: 'apt_1',
  basePosition: 1,
  isEmergency: false,
  isSeniorCitizen: false,
  joinedAt: new Date(now.getTime() - 10 * 60 * 1000) // joined 10 mins ago
};

// 2. Senior Citizen patient arriving second
const patient2 = {
  appointmentId: 'apt_2',
  basePosition: 2,
  isEmergency: false,
  isSeniorCitizen: true,
  joinedAt: new Date(now.getTime() - 5 * 60 * 1000) // joined 5 mins ago
};

// 3. Emergency patient arriving third
const patient3 = {
  appointmentId: 'apt_3',
  basePosition: 3,
  isEmergency: true,
  isSeniorCitizen: false,
  joinedAt: new Date()
};

heap.insert(patient1);
heap.insert(patient2);
heap.insert(patient3);

console.log('Heap Size:', heap.size());

const sorted = heap.toSortedArray();
console.log('\nQueue Order (Highest priority / Lowest score first):');
sorted.forEach((item, idx) => {
  console.log(`${idx + 1}. Apt: ${item.appointmentId} | Emergency: ${item.isEmergency} | Senior: ${item.isSeniorCitizen} | Score: ${item.priorityScore}`);
});

if (sorted[0].appointmentId === 'apt_3') {
  console.log('\n✅ PASS: Emergency patient correctly placed at position 1!');
} else {
  console.error('\n❌ FAIL: Priority score formula failed!');
}

// Test removal by appointment ID
heap.removeByAppointmentId('apt_2');
console.log('\nAfter removing apt_2, Size:', heap.size());
const afterRemoval = heap.toSortedArray();
afterRemoval.forEach((item, idx) => {
  console.log(`${idx + 1}. Apt: ${item.appointmentId}`);
});

console.log('\n--- MinHeap Tests Completed ---');
