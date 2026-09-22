import React from 'react';
import { Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export const SlotPicker = ({ slots, selectedSlot, onSelectSlot, selectedDate, onDateChange, isOnLeave = false }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Helper to determine if slot has passed for today
  const isPastSlot = (slotDate, startTimeStr) => {
    if (!slotDate || !startTimeStr) return false;
    if (slotDate < todayStr) return true;
    if (slotDate > todayStr) return false;

    const [hStr, mStr] = startTimeStr.split(':');
    const slotMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    return slotMinutes <= currentMinutes;
  };

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          Select Date:
        </label>
        <input
          type="date"
          min={todayStr}
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Leave Status Notice or Time Slots Grid */}
      {isOnLeave ? (
        <div className="text-center py-8 glass-card rounded-2xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-sm space-y-2 p-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
          <div className="font-bold text-base text-rose-400">Doctor Not Available</div>
          <p className="text-xs text-rose-300/80 max-w-xs mx-auto">
            This doctor is on approved leave for <span className="font-bold text-white underline">{selectedDate}</span>. Please choose a different date.
          </p>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 glass-card rounded-xl border border-slate-800 text-slate-400 text-sm">
          <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          No available slots found for this date.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {slots.map((slot) => {
            const isSelected = selectedSlot && selectedSlot._id === slot._id;
            const isBooked = Boolean(slot.isBooked);
            const isPast = isPastSlot(selectedDate, slot.startTime);
            const isDisabled = isBooked || isPast;

            return (
              <button
                key={slot._id}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelectSlot(slot)}
                title={
                  isBooked
                    ? 'Already booked by another patient'
                    : isPast
                    ? 'This time slot has passed for today'
                    : `Book ${slot.startTime}`
                }
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isDisabled
                    ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-800/60 line-through opacity-50'
                    : isSelected
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 border border-sky-400 scale-95'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-sky-950/40 hover:border-sky-500/40 border border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5 opacity-75" />
                <span>{slot.startTime}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
