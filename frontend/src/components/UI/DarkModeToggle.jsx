import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex items-center w-[3.5rem] h-8 rounded-full border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 shadow-xs cursor-pointer shrink-0"
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 ${
          isDark ? 'translate-x-6 bg-slate-800' : 'translate-x-0 bg-indigo-50'
        }`}
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
        )}
      </span>
    </button>
  );
}