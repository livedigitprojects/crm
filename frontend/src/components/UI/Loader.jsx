import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/* Thin brand progress bar pinned to the top of the screen */
export function TopProgress({ active }) {
  if (!active) return null;
  return (
    <div className="fixed top-0 left-0 right-0 h-0.75 z-200 overflow-hidden bg-indigo-500/10 pointer-events-none">
      <div className="loader-bar h-full w-1/3 brand-gradient rounded-full" />
    </div>
  );
}

/* Three bouncing dots — for small inline waits */
export function DotsLoader({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-label="Loading">
      <span className="loader-dot w-1.5 h-1.5 rounded-full bg-indigo-500" />
      <span className="loader-dot w-1.5 h-1.5 rounded-full bg-indigo-500" />
      <span className="loader-dot w-1.5 h-1.5 rounded-full bg-indigo-500" />
    </span>
  );
}

/* Branded splash / workspace loader.
   fullScreen=true  → whole-page session loader
   fullScreen=false → inline loader with dashboard skeleton underneath */
export function BrandLoader({ label = 'Loading...', fullScreen = false, showSkeleton = false }) {
  const mark = (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <span className="loader-ring absolute inset-0 rounded-full border-2 border-indigo-500/40" />
        <span className="loader-ring delay absolute inset-0 rounded-full border-2 border-indigo-500/40" />
        <svg className="loader-orbit absolute inset-0" viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5f64f3" />
              <stop offset="100%" stopColor="#9b5cf0" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="37" stroke="url(#orbitGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 120" />
        </svg>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [1, 1.08, 1], opacity: 1 }}
          transition={{ scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.4 } }}
          className="brand-gradient w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/40"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">{label}</span>
        <div className="w-40 h-1 rounded-full bg-indigo-500/10 overflow-hidden">
          <div className="loader-bar h-full w-1/3 brand-gradient rounded-full" />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white"
      >
        {mark}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
      <div className="flex items-center justify-center py-14">{mark}</div>
      {showSkeleton && <DashboardSkeleton />}
    </motion.div>
  );
}

/* Generic dashboard skeleton: stat cards + table rows */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 opacity-80" aria-hidden="true">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-7 w-2/3" />
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="skeleton h-4 w-1/4" />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default BrandLoader;