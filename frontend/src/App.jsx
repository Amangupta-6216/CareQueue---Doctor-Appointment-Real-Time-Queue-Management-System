import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

export const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Role Protected Dashboards */}
                <Route
                  path="/dashboard/patient"
                  element={
                    <ProtectedRoute allowedRoles={['patient', 'admin']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/receptionist"
                  element={
                    <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                      <ReceptionistDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} CareQueue Systems — Real-time Priority Doctor Queue & Booking
            </footer>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
