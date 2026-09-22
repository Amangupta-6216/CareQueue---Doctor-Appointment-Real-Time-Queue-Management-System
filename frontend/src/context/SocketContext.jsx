import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to Socket.io backend
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket Connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket Disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinDoctorRoom = (doctorId) => {
    if (socket && doctorId) {
      socket.emit('join:doctor', doctorId);
    }
  };

  const joinPatientRoom = (patientId) => {
    if (socket && patientId) {
      socket.emit('join:patient', patientId);
    }
  };

  const joinReceptionRoom = () => {
    if (socket) {
      socket.emit('join:reception');
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinDoctorRoom,
        joinPatientRoom,
        joinReceptionRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
