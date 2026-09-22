import React from 'react';
import { AlertTriangle, Clock, UserCheck, ShieldAlert, HeartHandshake } from 'lucide-react';

export const LiveQueueList = ({ queue, onNoShow, onEmergencyToggle, canManage = false }) => {
  if (!queue || queue.length === 0) {
    return (
      <div className="text-center py-10 glass-card rounded-2xl border border-slate-800 text-slate-400">
        <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-medium">Queue is currently empty.</p>
        <p className="text-xs text-slate-500 mt-1">Checked-in patients will appear here in priority order.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((item, index) => {
        const isEmergency = item.isEmergency;
        const isSenior = item.isSeniorCitizen;

        return (
          <div
            key={item.appointmentId || index}
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              isEmergency
                ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/30'
                : index === 0
                ? 'bg-sky-950/30 border-sky-500/40'
                : 'glass-card border-slate-800'
            }`}
          >
            {/* Position & Patient Info */}
            <div className="flex items-center space-x-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  isEmergency
                    ? 'bg-rose-500 text-white animate-pulse'
                    : index === 0
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                #{index + 1}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white">
                    {item.patientName || 'Patient'}
                  </h4>

                  {isEmergency && (
                    <span className="flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full animate-bounce">
                      <AlertTriangle className="w-3 h-3" />
                      Emergency
                    </span>
                  )}

                  {isSenior && (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full">
                      <HeartHandshake className="w-3 h-3" />
                      Senior Citizen
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    Est Wait: ~{item.estimatedWaitMinutes || index * 15} mins
                  </span>
                  <span>•</span>
                  <span>Score: {item.priorityScore ? item.priorityScore.toFixed(1) : 0}</span>
                </div>
              </div>
            </div>

            {/* Admin/Receptionist Actions */}
            {canManage && (
              <div className="flex items-center space-x-2">
                {onEmergencyToggle && (
                  <button
                    onClick={() => onEmergencyToggle(item.doctorId, item.appointmentId, !isEmergency)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isEmergency
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white'
                    }`}
                  >
                    {isEmergency ? 'Remove Emergency' : 'Flag Emergency'}
                  </button>
                )}

                {onNoShow && (
                  <button
                    onClick={() => onNoShow(item.doctorId, item.appointmentId)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                  >
                    No-Show
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LiveQueueList;
