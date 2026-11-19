import React from 'react';

export default function Card({ children, className = '', title, subtitle, icon: Icon, ...props }) {
  return (
    <div className={`glass-panel rounded-2xl p-5 sm:p-7 md:p-8 ${className}`} {...props}>
      {(title || Icon) && (
        <div className="flex items-center gap-3.5 border-b border-gray-200/70 dark:border-slate-800 pb-4 mb-6">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/15">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            {title && (
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}