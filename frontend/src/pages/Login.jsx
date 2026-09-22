import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data);

      // Redirect to appropriate dashboard based on role
      switch (res.data.role) {
        case 'patient': navigate('/dashboard/patient'); break;
        case 'doctor': navigate('/dashboard/doctor'); break;
        case 'receptionist': navigate('/dashboard/receptionist'); break;
        case 'admin': navigate('/dashboard/admin'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login Helper for Testing
  const quickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 w-full max-w-md space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Sign In to CareQueue</h2>
          <p className="text-xs text-slate-400">Access your personalized portal and live appointments</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.com"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            Quick Fill Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => quickFill('patient@hospital.com', 'Password123')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 font-medium text-left truncate"
            >
              👤 Patient
            </button>
            <button
              onClick={() => quickFill('sharma@hospital.com', 'Password123')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 font-medium text-left truncate"
            >
              👨‍⚕️ Doctor (Sharma)
            </button>
            <button
              onClick={() => quickFill('receptionist@hospital.com', 'Recep@123')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-lg border border-slate-700 font-medium text-left truncate"
            >
              📋 Receptionist
            </button>
            <button
              onClick={() => quickFill('admin@hospital.com', 'Admin@123')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 font-medium text-left truncate"
            >
              ⚡ Admin
            </button>
          </div>
        </div>

        <div className="text-center pt-2 text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-400 font-semibold hover:underline">
            Register as Patient
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
