import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import DoctorCard from '../components/booking/DoctorCard';
import SlotPicker from '../components/booking/SlotPicker';
import DoctorProfileModal from '../components/booking/DoctorProfileModal';
import BookingConfirmationModal from '../components/booking/BookingConfirmationModal';
import RescheduleModal from '../components/booking/RescheduleModal';
import { Calendar, Clock, Stethoscope, CheckCircle2, AlertCircle, Activity, UserCheck, RefreshCw, XCircle } from 'lucide-react';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { socket, joinPatientRoom } = useSocket();

  const [doctors, setDoctors] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Modals state
  const [profileDoctor, setProfileDoctor] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState(null);

  const departments = ['All', 'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'ENT'];

  useEffect(() => {
    fetchDoctors();
    fetchMyAppointments();
    if (user) {
      joinPatientRoom(user._id);
    }
  }, [selectedDept, user]);

  // Socket listener for live status and slot availability updates
  useEffect(() => {
    if (!socket) return;

    const handleSlotUpdate = (data) => {
      if (selectedDoctor && (data.doctorId === selectedDoctor._id || !data.doctorId)) {
        fetchSlots(selectedDoctor._id, selectedDate);
      }
    };

    socket.on('appointment:statusChange', () => {
      fetchMyAppointments();
    });

    socket.on('queue:update', () => {
      fetchMyAppointments();
      if (selectedDoctor) fetchSlots(selectedDoctor._id, selectedDate);
    });

    socket.on('slot:update', handleSlotUpdate);

    return () => {
      socket.off('appointment:statusChange');
      socket.off('queue:update');
      socket.off('slot:update', handleSlotUpdate);
    };
  }, [socket, selectedDoctor, selectedDate]);


  useEffect(() => {
    if (selectedDoctor) {
      fetchSlots(selectedDoctor._id, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get(`/doctors${selectedDept !== 'All' ? `?department=${selectedDept}` : ''}`);
      setDoctors(res.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId, dateStr) => {
    try {
      const res = await api.get(`/doctors/${doctorId}/slots?date=${dateStr}`);
      setSlots(res.data.slots || []);
      setIsOnLeave(Boolean(res.data.onLeave));
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setSlots([]);
      setIsOnLeave(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot) return;

    setBookingLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/appointments/book', {
        doctorId: selectedDoctor._id,
        slotId: selectedSlot._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        reasonForVisit
      });

      setMessage({ type: 'success', text: '🎉 Appointment booked successfully!' });
      setSelectedSlot(null);
      setShowConfirmModal(false);
      setReasonForVisit('');
      fetchMyAppointments();
      fetchSlots(selectedDoctor._id, selectedDate);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Booking failed.' });
    } finally {
      setBookingLoading(false);
    }
  };


  const handleCheckIn = async (aptId) => {
    try {
      const res = await api.put(`/appointments/${aptId}/check-in`);
      setMessage({ type: 'success', text: res.data.message });
      fetchMyAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Check-in failed.' });
    }
  };

  const handleCancel = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${aptId}/cancel`);
      setMessage({ type: 'success', text: 'Appointment cancelled and slot freed.' });
      fetchMyAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Cancellation failed.' });
    }
  };

  const activeAppointments = appointments.filter(a => ['booked', 'checked-in', 'in-queue', 'in-progress'].includes(a.status));
  const pastAppointments = appointments.filter(a => ['done', 'cancelled', 'no-show'].includes(a.status));

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Patient Workspace</span>
          <h1 className="text-2xl font-black text-white mt-1">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.isSeniorCitizen ? '⭐ Senior Citizen Priority Account Active' : 'Standard Patient Account'}
          </p>
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

      {/* FRONT-AND-CENTER: Active / Upcoming Appointment Hero Card */}
      {activeAppointments.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-sky-500/40 bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
              Active & Upcoming Appointments (Live Real-Time Tracker)
            </h3>
            <span className="text-xs text-slate-400">Auto-updating via Socket.io</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAppointments.map(apt => {
              const pos = apt.queuePosition;
              const estWait = pos ? (pos - 1) * 15 : null;

              return (
                <div key={apt._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                        <UserCheck className="w-6 h-6 text-sky-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Dr. {apt.doctor?.user?.name || 'Specialist'}</h4>
                        <p className="text-xs text-sky-400 font-semibold">{apt.doctor?.department}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      apt.status === 'in-queue' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-pulse' :
                      apt.status === 'in-progress' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {apt.status === 'in-queue' ? `In Queue (#${pos || 1})` : apt.status}
                    </span>
                  </div>

                  {/* Date & Live Queue Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Slot Time</span>
                      <span className="text-white font-medium">{apt.date} @ {apt.startTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimated Wait</span>
                      <span className="text-sky-400 font-bold">{estWait !== null ? `~${estWait} mins` : 'Check in to see wait time'}</span>
                    </div>
                  </div>


                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    {apt.status === 'booked' && (
                      <button
                        onClick={() => handleCheckIn(apt._id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Join Queue / Check-In
                      </button>
                    )}

                    <button
                      onClick={() => setRescheduleApt(apt)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                      Reschedule
                    </button>

                    <button
                      onClick={() => handleCancel(apt._id)}
                      className="px-3 py-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700 hover:border-rose-500/40 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Booking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Doctor Browser */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Find & Book Doctor</h2>
            
            {/* Department Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedDept === dept
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctors.map(doc => (
              <DoctorCard
                key={doc._id}
                doctor={doc}
                isSelected={selectedDoctor?._id === doc._id}
                onSelect={(d) => {
                  setSelectedDoctor(d);
                  setSelectedSlot(null);
                }}
                onViewProfile={(d) => setProfileDoctor(d)}
              />
            ))}
          </div>
        </div>

        {/* Right Col: Slot Picker & Booking Form */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              {selectedDoctor ? `Book with Dr. ${selectedDoctor.user?.name}` : 'Select a Doctor to View Slots'}
            </h3>

            {selectedDoctor ? (
              <>
                <SlotPicker
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  isOnLeave={isOnLeave}
                />

                {!isOnLeave && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Reason for Visit
                    </label>
                    <input
                      type="text"
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      placeholder="e.g. General checkup, Fever, Consultation"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!selectedSlot || bookingLoading || isOnLeave}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                    selectedSlot && !bookingLoading && !isOnLeave
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  {isOnLeave ? 'Doctor On Leave (Booking Blocked)' : 'Review & Confirm Booking'}
                </button>
              </>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                Select any doctor on the left to browse available date slots.
              </div>
            )}
          </div>

          {/* Past Appointment History */}
          {pastAppointments.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Past Appointment History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pastAppointments.map(apt => (
                  <div key={apt._id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">Dr. {apt.doctor?.user?.name}</div>
                      <div className="text-slate-400">{apt.date} • {apt.startTime}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      apt.status === 'done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      apt.status === 'no-show' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {apt.status}
                    </span>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Doctor Full Profile Modal */}
      <DoctorProfileModal
        doctor={profileDoctor}
        isOpen={Boolean(profileDoctor)}
        onClose={() => setProfileDoctor(null)}
        onSelectForBooking={(doc) => {
          setSelectedDoctor(doc);
          setSelectedSlot(null);
        }}
      />

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal
        doctor={selectedDoctor}
        slot={selectedSlot}
        date={selectedDate}
        isSeniorCitizen={user?.isSeniorCitizen}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        loading={bookingLoading}
      />



      {/* Reschedule Modal */}
      <RescheduleModal
        appointment={rescheduleApt}
        isOpen={Boolean(rescheduleApt)}
        onClose={() => setRescheduleApt(null)}
        onRescheduleSuccess={() => {
          setMessage({ type: 'success', text: 'Appointment rescheduled successfully!' });
          fetchMyAppointments();
        }}
      />
    </div>
  );
};

export default PatientDashboard;
