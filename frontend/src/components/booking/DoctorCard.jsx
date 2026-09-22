import React from 'react';
import { UserCheck, Clock, Award, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export const DoctorCard = ({ doctor, onSelect, isSelected, onViewProfile }) => {
  const name = doctor.user?.name || 'Dr. Specialist';

  const isCurrentlyOnLeave = doctor.onLeave || (doctor.leaveRequests || []).some(lr => lr.status === 'approved' && lr.date === new Date().toISOString().split('T')[0]);
  const hasApprovedLeaveThisWeek = (doctor.leaveRequests || []).some(lr => lr.status === 'approved');

  return (
    <div
      className={`glass-card p-5 rounded-2xl relative overflow-hidden transition-all ${
        isSelected
          ? 'ring-2 ring-sky-500 bg-sky-950/20 border-sky-500/50'
          : 'hover:border-slate-700'
      }`}
    >
      {/* Leave Status Indicator Badge */}
      {isCurrentlyOnLeave ? (
        <span className="absolute top-4 right-4 bg-rose-500/20 text-rose-400 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-500/30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          On Leave Today
        </span>
      ) : hasApprovedLeaveThisWeek ? (
        <span className="absolute top-4 right-4 bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Leave Scheduled
        </span>
      ) : (
        <span className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Available
        </span>
      )}

      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div
          onClick={() => onViewProfile && onViewProfile(doctor)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
          title="Click to view full doctor profile"
        >
          <UserCheck className="w-7 h-7 text-sky-400" />
        </div>

        <div className="flex-1 pr-16">
          <h3
            onClick={() => onViewProfile && onViewProfile(doctor)}
            className="text-lg font-bold text-white hover:text-sky-400 cursor-pointer transition-colors"
          >
            {name}
          </h3>
          <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mt-0.5">
            {doctor.department}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-slate-500" />
            {doctor.specialization || doctor.department}
          </p>
        </div>
      </div>

      {/* Details & Action Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-500">Fee: </span>
          <span className="font-semibold text-emerald-400">${doctor.consultationFee || 500}</span>
        </div>

        <div className="flex items-center space-x-2">
          {onViewProfile && (
            <button
              type="button"
              onClick={() => onViewProfile(doctor)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Info className="w-3 h-3 text-sky-400" />
              Profile
            </button>
          )}

          <button
            type="button"
            disabled={isCurrentlyOnLeave}
            onClick={() => !isCurrentlyOnLeave && onSelect(doctor)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isCurrentlyOnLeave
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 cursor-not-allowed'
                : isSelected
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500 hover:text-white'
            }`}
          >
            {isCurrentlyOnLeave ? 'Unavailable Today' : isSelected ? 'Selected' : 'Select Slots'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
