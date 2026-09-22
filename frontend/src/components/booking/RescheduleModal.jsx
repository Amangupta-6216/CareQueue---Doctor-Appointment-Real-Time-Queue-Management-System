import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import SlotPicker from './SlotPicker';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';

export const RescheduleModal = ({ appointment, isOpen, onClose, onRescheduleSuccess }) => {
  if (!isOpen || !appointment) return null;

  const [selectedDate, setSelectedDate] = useState(appointment.date || new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doctorId = appointment.doctor?._id || appointment.doctor;
  const doctorName = appointment.doctor?.user?.name || 'Doctor';

  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchSlots(doctorId, selectedDate);
    }
  }, [doctorId, selectedDate]);

  const fetchSlots = async (docId, dateStr) => {
    try {
      const res = await api.get(`/doctors/${docId}/slots?date=${dateStr}`);
      setSlots(res.data.slots || []);
      setIsOnLeave(Boolean(res.data.onLeave));
      setSelectedSlot(null);
    } catch (err) {
      console.error('Failed to fetch slots for reschedule:', err);
      setSlots([]);
      setIsOnLeave(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError('');

    try {
      await api.put(`/appointments/${appointment._id}/reschedule`, {
        newSlotId: selectedSlot._id,
        newDate: selectedDate,
        newStartTime: selectedSlot.startTime
      });

      onRescheduleSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Reschedule failed. Please try another slot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel p-6 rounded-3xl border border-sky-500/40 max-w-lg w-full space-y-5 relative shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Reschedule Appointment</h3>
            <p className="text-xs text-sky-400">Dr. {doctorName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <SlotPicker
          slots={slots}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isOnLeave={isOnLeave}
        />

        <div className="flex items-center space-x-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmReschedule}
            disabled={!selectedSlot || loading || isOnLeave}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
              selectedSlot && !loading && !isOnLeave
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
