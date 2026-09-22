import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, ShieldCheck, Clock, Zap, Heart, Award, ArrowRight, UserPlus, CalendarCheck } from 'lucide-react';

export const Home = () => {
  const departments = [
    { name: 'General Medicine', icon: '🩺', desc: 'Comprehensive care for adults, chronic condition management & general health.' },
    { name: 'Cardiology', icon: '🫀', desc: 'Advanced heart health, ECG monitoring & cardiovascular treatments.' },
    { name: 'Orthopedics', icon: '🦴', desc: 'Joint replacement, bone health, spine care & sports injuries.' },
    { name: 'Pediatrics', icon: '👶', desc: 'Specialized healthcare, immunizations & growth tracking for infants & kids.' },
    { name: 'Dermatology', icon: '✨', desc: 'Skin care, clinical dermatology & cosmetic consultations.' },
    { name: 'ENT', icon: '👂', desc: 'Ear, Nose & Throat diagnosis, hearing tests & sinus care.' }
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-4 h-4 text-sky-400" />
          <span>Real-Time Smart Priority Queue</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          No More Endless Waiting Rooms.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-teal-300">
            Priority Queue Management.
          </span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Book appointments online, track live doctor queue positions in real-time on your phone, and enjoy fair weighted prioritization for emergency and senior citizen care.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-xl shadow-sky-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-5 h-5" />
            Book Patient Appointment
          </Link>
          <Link
            to="/login"
            className="glass-card hover:bg-slate-800 text-slate-200 font-semibold px-7 py-3.5 rounded-2xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            Staff & Doctor Portal
            <ArrowRight className="w-4 h-4 text-sky-400" />
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-sky-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Live Real-Time Queue</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            WebSocket powered live position badges. Know exact estimated wait times without sitting in crowded waiting rooms.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Min-Heap Priority Score</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Custom algorithmic min-heap automatically prioritizes emergency walk-ins and senior citizens fairly.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6 text-teal-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Atomic Conflict Guard</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Database-level atomic slot locking guarantees zero double-booking across online and receptionist channels.
          </p>
        </div>
      </div>

      {/* Departments Section */}
      <div className="max-w-7xl mx-auto space-y-8 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Hospital Departments</h2>
          <p className="text-xs text-slate-400">Excellence across specialized healthcare disciplines</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, idx) => (
            <div key={idx} className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800">
              <div className="text-3xl">{dept.icon}</div>
              <h3 className="text-lg font-bold text-white">{dept.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{dept.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
