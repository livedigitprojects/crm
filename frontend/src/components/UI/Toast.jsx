import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const accents = {
  success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  error: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  info: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
};

const bars = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
};

export default function ToastContainer({ toasts = [], removeToast }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 max-w-md w-[calc(100%-2rem)] sm:w-[440px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const type = toast.type || 'info';
          const Icon = icons[type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              exit={{ opacity: 0, y: -20, scale: 0.92, transition: { duration: 0.2 } }}
              layout
              className="pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 pl-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200/90 dark:border-slate-700/80 shadow-2xl w-full"
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${bars[type]}`} />
              <motion.span
                className={`absolute left-0 bottom-0 h-0.5 ${bars[type]} opacity-60`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
              <div className={`p-1.5 rounded-lg shrink-0 ${accents[type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                {toast.title && (
                  <h4 className="text-sm font-bold leading-tight text-gray-900 dark:text-white">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs mt-1 text-gray-600 dark:text-gray-300 leading-normal break-words font-medium">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 rounded-lg p-1 cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}