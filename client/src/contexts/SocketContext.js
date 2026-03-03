import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        
        // Join user-specific room
        newSocket.emit('join_room', `${user.role}_${user.id}`);
        
        // Join role-specific rooms
        if (user.role === 'emergency_responder' || user.role === 'admin') {
          newSocket.emit('join_room', 'emergency_responders');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Emergency-related events
      newSocket.on('new_emergency', (data) => {
        if (user.role === 'emergency_responder' || user.role === 'admin') {
          toast.error(`New Emergency: ${data.message}`, {
            duration: 6000,
            icon: '🚨'
          });
        }
      });

      newSocket.on('emergency_assigned', (data) => {
        toast.success(`Emergency Assigned: ${data.message}`, {
          duration: 5000,
          icon: '🚑'
        });
      });

      newSocket.on('emergency_status_updated', (data) => {
        toast.success(`Emergency Update: ${data.message}`, {
          duration: 4000,
          icon: '📋'
        });
      });

      newSocket.on('ambulance_assigned', (data) => {
        toast.success(`Ambulance Assigned: ${data.message}`, {
          duration: 5000,
          icon: '🚑'
        });
      });

      newSocket.on('ambulance_location_updated', (data) => {
        // Handle ambulance location updates (could update a map component)
        console.log('Ambulance location updated:', data);
      });

      // Appointment-related events
      newSocket.on('new_appointment', (data) => {
        if (user.role === 'doctor') {
          toast.success(`New Appointment: ${data.message}`, {
            duration: 4000,
            icon: '📅'
          });
        }
      });

      newSocket.on('appointment_updated', (data) => {
        toast.success(`Appointment Update: ${data.message}`, {
          duration: 4000,
          icon: '📅'
        });
      });

      newSocket.on('appointment_cancelled', (data) => {
        toast.error(`Appointment Cancelled: ${data.message}`, {
          duration: 4000,
          icon: '❌'
        });
      });

      newSocket.on('appointment_rescheduled', (data) => {
        toast.success(`Appointment Rescheduled: ${data.message}`, {
          duration: 4000,
          icon: '📅'
        });
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error occurred');
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  // Helper functions
  const emitEmergencyRequest = (emergencyData) => {
    if (socket) {
      socket.emit('emergency_request', emergencyData);
    }
  };

  const joinRoom = (room) => {
    if (socket) {
      socket.emit('join_room', room);
    }
  };

  const leaveRoom = (room) => {
    if (socket) {
      socket.emit('leave_room', room);
    }
  };

  const value = {
    socket,
    connected,
    emitEmergencyRequest,
    joinRoom,
    leaveRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};