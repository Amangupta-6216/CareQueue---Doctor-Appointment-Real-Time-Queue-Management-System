import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Bell, LogOut, Stethoscope, LayoutDashboard, CheckCircle2, AlertCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket || !user) return;

    const handleStatusChange = (data) => {
      const msg = `Appointment status updated: ${data.status.toUpperCase()}`;
      addNotification(msg);
    };

    const handleNextPatient = (data) => {
      if (user.role === 'doctor' || user.role === 'admin') {
        addNotification(`Now seeing patient: ${data.appointment?.patient?.name || 'Patient'}`);
      }
    };

    socket.on('appointment:statusChange', handleStatusChange);
    socket.on('doctor:nextPatient', handleNextPatient);

    return () => {
      socket.off('appointment:statusChange', handleStatusChange);
      socket.off('doctor:nextPatient', handleNextPatient);
    };
  }, [socket, user]);

  const addNotification = (text) => {
    const newNotif = {
      id: Date.now(),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 7)]);
    setUnreadCount((prev) => prev + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'patient': return '/dashboard/patient';
      case 'doctor': return '/dashboard/doctor';
      case 'receptionist': return '/dashboard/receptionist';
      case 'admin': return '/dashboard/admin';
      default: return '/';
    }
  };

  const roleColors = {
    patient: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    doctor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    receptionist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    admin: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-sky-400">
              CareQueue
            </span>
            <span className="block text-[10px] uppercase font-semibold text-sky-400 tracking-wider">
              Smart Hospital Queue
            </span>
          </div>
        </Link>

        {/* Live Socket Status */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 glass-card px-3 py-1.5 rounded-full border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
          <span>{connected ? 'Real-Time Sync Active' : 'Connecting...'}</span>
        </div>

        {/* Nav Links & User Controls */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to={getDashboardPath()}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setUnreadCount(0);
                  }}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors"
                  title="Live Notifications"
                >
                  <Bell className="w-5 h-5 text-sky-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-72 glass-panel p-4 rounded-2xl border border-slate-700 shadow-2xl space-y-3 z-50 bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Live Status Alerts</span>
                      <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500">No new alerts yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-2.5 bg-slate-800/80 rounded-xl text-xs space-y-0.5 border border-slate-700/50">
                            <div className="text-slate-200 font-medium">{n.text}</div>
                            <div className="text-[10px] text-slate-400">{n.time}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Role Badge */}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border uppercase tracking-wider ${roleColors[user.role]}`}>
                {user.role}
              </span>

              {/* User Profile */}
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-sky-600/25 transition-all transform hover:-translate-y-0.5"
              >
                Register as Patient
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
