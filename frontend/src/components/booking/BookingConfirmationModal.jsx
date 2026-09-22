import React from 'react';
import { Calendar, Clock, DollarSign, UserCheck, HeartHandshake, CheckCircle2, X } from 'lucide-react';

export const BookingConfirmationModal = ({ doctor, slot, date, isSeniorCitizen, isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen || !doctor || !slot) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel p-6 rounded-3xl border border-sky-500/40 max-w-md w-full space-y-6 relative shadow-2xl bg-gradient-to-b from-slate-900 via-sky-950/20 to-slate-950">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Confirm Booking Details</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Details Box */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Dr. {doctor.user?.name}</h4>
              <p className="text-xs text-sky-400 font-semibold">{doctor.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>{date}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{slot.startTime} - {slot.endTime}</span>
            </div>
          </div>

          {isSeniorCitizen && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Senior Citizen Priority Score Enabled</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="text-slate-400">Total Consultation Fee:</span>
            <span className="text-sm font-bold text-emerald-400">${doctor.consultationFee || 500}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/30 transition-all"
          >
            {loading ? 'Confirming...' : 'Yes, Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationModal;
