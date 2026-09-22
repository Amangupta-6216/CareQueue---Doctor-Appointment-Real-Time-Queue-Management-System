import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white">404 - Page Not Found</h1>
      <p className="text-xs text-slate-400 max-w-sm">
        The requested URL does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
