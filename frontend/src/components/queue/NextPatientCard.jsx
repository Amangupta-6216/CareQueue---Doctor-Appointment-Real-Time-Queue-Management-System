import React from 'react';
import { UserCheck, CheckCircle2, UserX, AlertTriangle, Phone, Activity } from 'lucide-react';

export const NextPatientCard = ({ inProgressPatient, nextInQueue, onCallNext, onMarkDone, onNoShow }) => {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-sky-500/30 relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
          <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
            Active Consultation Room
          </h3>
        </div>
        {inProgressPatient && (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full">
            In Progress
          </span>
        )}
      </div>

      {inProgressPatient ? (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Currently Seeing</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {inProgressPatient.patientId?.name || inProgressPatient.patientName || 'Patient'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                {inProgressPatient.patientId?.phone || 'No phone provided'}
              </p>
            </div>

            {inProgressPatient.isEmergency && (
              <span className="bg-rose-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-rose-500/30 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                Emergency Case
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onMarkDone()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark Consultation Done & Call Next
            </button>

            <button
              onClick={() => onNoShow(inProgressPatient.appointmentId)}
              className="bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 font-semibold py-3 px-4 rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
            >
              <UserX className="w-5 h-5" />
              Patient Absent (No-Show)
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Activity className="w-12 h-12 text-sky-500/40 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">No Consultation In Progress</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {nextInQueue
              ? `Next patient in queue is ${nextInQueue.patientName} (Position #1).`
              : 'The queue is currently clear.'}
          </p>

          <button
            onClick={() => onCallNext()}
            disabled={!nextInQueue}
            className={`mt-5 px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 mx-auto transition-all ${
              nextInQueue
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Call Next Patient Now
          </button>
        </div>
      )}
    </div>
  );
};

export default NextPatientCard;
