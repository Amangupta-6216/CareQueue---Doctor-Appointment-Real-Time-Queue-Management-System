import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import LiveQueueList from '../components/queue/LiveQueueList';
import { UserPlus, CheckSquare, Search, AlertTriangle, HeartHandshake, Stethoscope, CheckCircle2, AlertCircle } from 'lucide-react';

export const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const { socket, joinReceptionRoom } = useSocket();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [liveQueue, setLiveQueue] = useState([]);

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    isSeniorCitizen: false,
    doctorId: '',
    isEmergency: false,
    reasonForVisit: 'Walk-In Consultation'
  });

  // Check-in lookup state
  const [searchQuery, setSearchQuery] = useState('');
  const [todayAppointments, setTodayAppointments] = useState([]);

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    joinReceptionRoom();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorQueue(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  // Socket listener for live queue updates
  useEffect(() => {
    if (!socket) return;

    socket.on('queue:update', (data) => {
      if (data.doctorId === selectedDoctorId) {
        setLiveQueue(data.queue || []);
      }
    });

    return () => {
      socket.off('queue:update');
    };
  }, [socket, selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
      if (res.data.length > 0) {
        setSelectedDoctorId(res.data[0]._id);
        setWalkInForm(prev => ({ ...prev, doctorId: res.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchDoctorQueue = async (docId) => {
    try {
      const res = await api.get(`/queue/${docId}`);
      setLiveQueue(res.data.queue || []);
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/appointments/walk-in', walkInForm);
      setMessage({ type: 'success', text: res.data.message });
      setWalkInForm({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        isSeniorCitizen: false,
        doctorId: selectedDoctorId,
        isEmergency: false,
        reasonForVisit: 'Walk-In Consultation'
      });
      fetchDoctorQueue(selectedDoctorId);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Walk-in registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyToggle = async (doctorId, appointmentId, isEmergency) => {
    try {
      await api.put(`/queue/${doctorId}/emergency/${appointmentId}`, { isEmergency });
      fetchDoctorQueue(doctorId);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update emergency status.' });
    }
  };

  const handleNoShow = async (doctorId, appointmentId) => {
    try {
      await api.put(`/queue/${doctorId}/no-show/${appointmentId}`);
      fetchDoctorQueue(doctorId);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to mark no-show.' });
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Hospital Front Desk</span>
        <h1 className="text-2xl font-black text-white mt-1">Receptionist Control Desk</h1>
        <p className="text-xs text-slate-400 mt-1">
          Register walk-in patients, manage arrivals, and handle emergency priority bumps in real-time.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Walk-In Registration Form */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              Register Walk-In Patient
            </h3>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={walkInForm.patientName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, patientName: e.target.value })}
                  placeholder="Full name"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={walkInForm.patientPhone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, patientPhone: e.target.value })}
                  placeholder="+1 555 0000"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Select Doctor *
                </label>
                <select
                  value={walkInForm.doctorId}
                  onChange={(e) => {
                    setWalkInForm({ ...walkInForm, doctorId: e.target.value });
                    setSelectedDoctorId(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.user?.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Emergency & Senior Toggles */}
              <div className="space-y-2 pt-2">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isEmergency"
                    checked={walkInForm.isEmergency}
                    onChange={(e) => setWalkInForm({ ...walkInForm, isEmergency: e.target.checked })}
                    className="w-4 h-4 text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="isEmergency" className="text-xs font-bold text-rose-300 cursor-pointer flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    EMERGENCY BUMP (Highest Priority)
                  </label>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isSenior"
                    checked={walkInForm.isSeniorCitizen}
                    onChange={(e) => setWalkInForm({ ...walkInForm, isSeniorCitizen: e.target.checked })}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="isSenior" className="text-xs font-semibold text-amber-300 cursor-pointer flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-amber-400" />
                    Senior Citizen (60+ yrs)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/30 text-sm transition-all"
              >
                {loading ? 'Processing...' : 'Add Walk-In to Priority Queue'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Cols: Live Multi-Doctor Queue Monitor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-400" />
                Live Doctor Queue Monitor
              </h3>

              <div className="w-full sm:w-auto">
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.user?.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <LiveQueueList
              queue={liveQueue}
              onEmergencyToggle={handleEmergencyToggle}
              onNoShow={handleNoShow}
              canManage={true}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceptionistDashboard;
