const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket Client Connected: ${socket.id}`);

    // Join room based on doctor ID
    socket.on('join:doctor', (doctorId) => {
      if (doctorId) {
        const roomName = `doctor:${doctorId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Join room based on patient ID
    socket.on('join:patient', (patientId) => {
      if (patientId) {
        const roomName = `patient:${patientId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Join general hospital live monitor room
    socket.on('join:reception', () => {
      socket.join('room:reception');
      console.log(`Socket ${socket.id} joined room:reception`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Emits live queue updates to doctor room, reception room, and listening clients.
 */
const emitQueueUpdate = (doctorId, queueData) => {
  if (!io) return;
  const roomName = `doctor:${doctorId}`;
  io.to(roomName).to('room:reception').emit('queue:update', {
    doctorId,
    queue: queueData,
    timestamp: new Date()
  });
};

/**
 * Emits status changes to a specific patient.
 */
const emitPatientStatusChange = (patientId, appointmentData) => {
  if (!io) return;
  const roomName = `patient:${patientId}`;
  io.to(roomName).emit('appointment:statusChange', appointmentData);
};

/**
 * Pushes next patient alert to a doctor's dashboard.
 */
const emitDoctorNextPatient = (doctorId, patientData) => {
  if (!io) return;
  const roomName = `doctor:${doctorId}`;
  io.to(roomName).emit('doctor:nextPatient', patientData);
};

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate,
  emitPatientStatusChange,
  emitDoctorNextPatient
};
