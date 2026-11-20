import React, { forwardRef } from 'react';

const labelCls = 'text-xs font-semibold text-gray-700 dark:text-gray-300';
const fieldBase =
  'w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-xs';
const fieldOk =
  'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15';
const fieldErr = 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/15';

// Reusable text, number, date, url inputs
export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  helperText,
  required,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className={`${labelCls} flex items-center gap-1`}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`${fieldBase} ${Icon ? 'pl-10' : ''} ${error ? fieldErr : fieldOk}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</span>}
      {helperText && !error && <span className="text-xs text-gray-400 dark:text-gray-500">{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';

// Reusable select dropdowns
export const Select = forwardRef(({
  label,
  error,
  options = [],
  className = '',
  required,
  placeholder = 'Select an option',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className={labelCls}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`${fieldBase} cursor-pointer ${error ? fieldErr : fieldOk}`}
        {...props}
      >
        <option value="" className="text-gray-400 dark:bg-slate-900">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

// Reusable textareas
export const TextArea = forwardRef(({
  label,
  error,
  className = '',
  required,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className={labelCls}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={3}
        className={`${fieldBase} resize-none ${error ? fieldErr : fieldOk}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</span>}
    </div>
  );
});

TextArea.displayName = 'TextArea';

// Reusable styled checkbox cards
export const Checkbox = forwardRef(({
  label,
  icon: Icon,
  className = '',
  checked,
  ...props
}, ref) => {
  return (
    <label className={`
      flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer select-none transition-all
      ${checked
        ? 'border-indigo-500 bg-indigo-500/6 dark:bg-indigo-500/12 text-indigo-950 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
        : 'border-gray-200 dark:border-slate-700 bg-white/60 hover:bg-white dark:bg-slate-900/30 dark:hover:bg-slate-900/60 hover:border-gray-300 text-gray-700 dark:text-gray-300'
      }
      ${className}
    `}>
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        className="w-4.5 h-4.5 rounded-sm border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
        {...props}
      />
      {Icon && <Icon className={`w-5 h-5 ${checked ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />}
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
});

Checkbox.displayName = 'Checkbox';