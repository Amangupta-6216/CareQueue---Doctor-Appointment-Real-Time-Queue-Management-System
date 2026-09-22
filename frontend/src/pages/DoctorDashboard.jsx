import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import NextPatientCard from '../components/queue/NextPatientCard';
import LiveQueueList from '../components/queue/LiveQueueList';
import { Stethoscope, Users, CheckCircle2, Clock, Calendar, AlertCircle, PlaneTakeoff } from 'lucide-react';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { socket, joinDoctorRoom } = useSocket();

  const [doctorInfo, setDoctorInfo] = useState(null);
  const [queue, setQueue] = useState([]);
  const [inProgressPatient, setInProgressPatient] = useState(null);
  const [stats, setStats] = useState({ seenToday: 0, waiting: 0 });
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  // Fetch doctor record & queue on mount
  useEffect(() => {
    fetchDoctorProfile();
  }, [user]);

  useEffect(() => {
    if (doctorInfo) {
      fetchLiveQueue(doctorInfo._id);
      joinDoctorRoom(doctorInfo._id);
    }
  }, [doctorInfo]);

  // Socket listener for live queue updates
  useEffect(() => {
    if (!socket) return;

    socket.on('queue:update', (data) => {
      if (doctorInfo && data.doctorId === doctorInfo._id) {
        fetchLiveQueue(doctorInfo._id);
      }
    });

    socket.on('doctor:nextPatient', () => {
      if (doctorInfo) fetchLiveQueue(doctorInfo._id);
    });

    return () => {
      socket.off('queue:update');
      socket.off('doctor:nextPatient');
    };
  }, [socket, doctorInfo]);

  const fetchDoctorProfile = async () => {
    try {
      const res = await api.get('/doctors');
      const myDoc = res.data.find(d => d.user?._id === user?._id);
      if (myDoc) {
        setDoctorInfo(myDoc);
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveQueue = async (docId) => {
    try {
      const res = await api.get(`/queue/${docId}`);
      setQueue(res.data.queue || []);
      setInProgressPatient(res.data.inProgressPatient || null);
      setStats({
        waiting: res.data.count || 0,
        seenToday: stats.seenToday
      });
    } catch (err) {
      console.error('Error fetching live queue:', err);
    }
  };

  const handleCallNext = async () => {
    if (!doctorInfo) return;
    try {
      const res = await api.put(`/queue/${doctorInfo._id}/next`);
      setMessage({ type: 'success', text: res.data.message });
      setStats(prev => ({ ...prev, seenToday: prev.seenToday + 1 }));
      fetchLiveQueue(doctorInfo._id);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error calling next patient' });
    }
  };

  const handleMarkDone = async () => {
    handleCallNext(); // Automatically marks current done and advances
  };

  const handleNoShow = async (appointmentId) => {
    if (!doctorInfo || !appointmentId) return;
    try {
      await api.put(`/queue/${doctorInfo._id}/no-show/${appointmentId}`);
      setMessage({ type: 'success', text: 'Patient marked as No-Show.' });
      fetchLiveQueue(doctorInfo._id);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error marking no-show.' });
    }
  };

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    if (!doctorInfo) return;
    try {
      const res = await api.post(`/doctors/${doctorInfo._id}/leave-request`, {
        date: leaveDate,
        reason: leaveReason
      });
      setMessage({ type: 'success', text: 'Leave request submitted for admin approval.' });
      setLeaveReason('');
      if (res.data.doctor) {
        setDoctorInfo(res.data.doctor);
      } else {
        fetchDoctorProfile();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to submit leave request.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Doctor Dashboard</span>
          <h1 className="text-2xl font-black text-white mt-1">Welcome, Dr. {user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Department: <span className="text-sky-400 font-semibold">{doctorInfo?.department || 'General Medicine'}</span>
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 rounded-2xl border border-slate-800 text-center">
            <span className="block text-xl font-bold text-white">{queue.length}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Waiting</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-2xl border border-slate-800 text-center">
            <span className="block text-xl font-bold text-emerald-400">{stats.seenToday}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Seen Today</span>
          </div>
        </div>
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

      {/* Hero Active Room Card */}
      <NextPatientCard
        inProgressPatient={inProgressPatient}
        nextInQueue={queue[0] || null}
        onCallNext={handleCallNext}
        onMarkDone={handleMarkDone}
        onNoShow={handleNoShow}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live MinHeap Priority Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Live Waiting Queue (Min-Heap Priority Order)
            </h3>
            <span className="text-xs text-slate-400">{queue.length} Patients Waiting</span>
          </div>

          <LiveQueueList
            queue={queue}
            onNoShow={handleNoShow}
            canManage={true}
          />
        </div>

        {/* Right Col: Leave Request & Availability Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlaneTakeoff className="w-5 h-5 text-amber-400" />
              Request Leave / Schedule Off
            </h3>
            
            <form onSubmit={handleLeaveRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Leave Date
                </label>
                <input
                  type="date"
                  required
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Medical conference, personal emergency..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-amber-600/20 text-xs transition-all"
              >
                Submit Leave Request
              </button>
            </form>

            {/* List of Doctor's Submitted Leave Requests */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">My Submitted Leave Requests</h4>
              {!doctorInfo?.leaveRequests || doctorInfo.leaveRequests.length === 0 ? (
                <p className="text-xs text-slate-500">No leave requests submitted yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {doctorInfo.leaveRequests.map((req, idx) => (
                    <div key={req._id || idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{req.date}</div>
                        <div className="text-slate-400 text-[11px]">{req.reason}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        req.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


export default DoctorDashboard;
