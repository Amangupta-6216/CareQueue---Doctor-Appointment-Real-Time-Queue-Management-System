import React from 'react';
import { UserCheck, Award, Clock, DollarSign, Calendar, AlertCircle, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DoctorProfileModal = ({ doctor, isOpen, onClose, onSelectForBooking }) => {
  if (!isOpen || !doctor) return null;

  const isCurrentlyOnLeave = doctor.onLeave || (doctor.leaveRequests || []).some(lr => lr.status === 'approved' && lr.date === new Date().toISOString().split('T')[0]);
  const approvedLeaveDates = (doctor.leaveRequests || []).filter(lr => lr.status === 'approved').map(lr => lr.date);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel p-6 rounded-3xl border border-slate-700 max-w-lg w-full space-y-6 relative shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Doctor Header */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
            <UserCheck className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{doctor.user?.name || 'Dr. Specialist'}</h2>
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mt-0.5">{doctor.department}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              {doctor.qualification || 'MBBS, MD'} • {doctor.specialization || doctor.department}
            </p>
          </div>
        </div>

        {/* Leave Status Indicator */}
        {isCurrentlyOnLeave ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-rose-400">Unavailable / On Approved Leave Today</span>
              <p className="text-[11px] text-rose-300/80">Regular consultation slots are temporarily suspended.</p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-400">Available for Appointments</span>
              <p className="text-[11px] text-emerald-300/80">Accepting online & walk-in bookings today.</p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Consultation Fee</span>
            <div className="text-base font-bold text-emerald-400">${doctor.consultationFee || 500}</div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Slot Duration</span>
            <div className="text-base font-bold text-sky-400">30 Minutes</div>
          </div>
        </div>

        {/* Approved Leave Dates Calendar */}
        {approvedLeaveDates.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              Scheduled Approved Leave Dates
            </span>
            <div className="flex flex-wrap gap-2">
              {approvedLeaveDates.map((d, i) => (
                <span key={i} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold">
                  📅 {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            onSelectForBooking(doctor);
            onClose();
          }}
          className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 text-sm transition-all"
        >
          Proceed to Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorProfileModal;
