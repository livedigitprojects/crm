import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import usePolling from './hooks/usePolling';
import ToastContainer from './components/UI/Toast';
import DarkModeToggle from './components/UI/DarkModeToggle';
import Button from './components/UI/Button';
import { Lock, Eye, EyeOff, HelpCircle, Sparkles, BarChart3, ShieldCheck, Users, User as UserIcon, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { BrandLoader, TopProgress } from './components/UI/Loader';

// Lazy-loaded Portals for performance & code-splitting
const loadSalesPortal = () => import('./components/Portals/SalesPortal');
const loadAdminPortal = () => import('./components/Portals/AdminPortal');
const loadTechnicalPortal = () => import('./components/Portals/TechnicalPortal');

const SalesPortal = React.lazy(loadSalesPortal);
const AdminPortal = React.lazy(loadAdminPortal);
const TechnicalPortal = React.lazy(loadTechnicalPortal);

// Start downloading the portal code as soon as login succeeds
const PORTAL_LOADERS = {
  salesperson: loadSalesPortal,
  technical: loadTechnicalPortal,
  admin: loadAdminPortal,
};

const ROLE_LABELS = {
  salesperson: 'Sales',
  technical: 'Technical',
  admin: 'Admin',
};

const FEATURES = [
  { icon: Users, title: 'One workspace for every team', text: 'Sales, technical and admin portals working from the same live lead data.' },
  { icon: BarChart3, title: 'Pipeline clarity', text: 'Track leads, payments and daily reports from first call to delivery.' },
  { icon: ShieldCheck, title: 'Secure, role-based access', text: 'Every user sees exactly what their role requires — nothing more.' },
];

const fieldCls =
  'w-full rounded-xl border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 py-3 text-sm bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-xs outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15';

export default function App() {
  const { user, logout, login, loading, authFetch } = useAuth();
  const [theme, setTheme] = useLocalStorage('theme_v2', 'light');
  const [toasts, setToasts] = useState([]);

  // Real-time alert notifications state
  const [notifications, setNotifications] = useLocalStorage('crm_notifications', []);

  // Username/Password login form inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('salesperson');

  // Theme application
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Fetch notifications from server
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const lastRead = Number(localStorage.getItem('crm_notifications_last_read') || 0);
        const mapped = data.map(n => ({
          id: n._id || n.id,
          message: n.message,
          type: n.type || 'info',
          timestamp: n.timestamp || n.createdAt,
          unread: new Date(n.timestamp || n.createdAt).getTime() > lastRead
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Poll notifications every 60s (paused while tab is hidden) when logged in
  usePolling(fetchNotifications, 60000, { enabled: !!user });

  // Toast System Actions
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const addNotification = async (message, type = 'info') => {
    try {
      await authFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type })
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error posting notification:', err);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim();
    if (!cleanUsername || !passwordInput) {
      addToast('Validation Error', 'Please enter your username and password.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const result = await login(cleanUsername, passwordInput, selectedRole);
    setIsSubmitting(false);

    if (result.success) {
      addToast('Access Granted', `Welcome back, ${result.user.name}!`, 'success');
      (PORTAL_LOADERS[result.user.role] || loadAdminPortal)();
      setUsernameInput('');
      setPasswordInput('');
    } else {
      addToast('Access Denied', result.error || 'Invalid username or password.', 'error');
    }
  };

  if (loading) {
    return <BrandLoader fullScreen label="Loading portal session..." />;
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-slate-100 flex flex-col transition-colors duration-300 pb-12">
      <TopProgress active={isSubmitting} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Top Banner Navigation */}
      <header className="app-header sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="brand-gradient w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight leading-none brand-text">Livedigit</h1>
              <p className="hidden sm:block text-[10px] text-gray-500 dark:text-gray-400 tracking-[0.14em] font-semibold uppercase mt-1">
                Digital Marketing Services
              </p>
            </div>
          </div>

          {/* Global Toolbar */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 shadow-xs">
                <div className="w-7 h-7 rounded-full brand-gradient text-white text-xs font-bold flex items-center justify-center uppercase">
                  {(user.name || user.username || 'U').charAt(0)}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white max-w-[9rem] truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                </div>
              </div>
            )}
            <DarkModeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      </header>

      {/* Portals Render Target */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-6 flex-1">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="login-gate"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="py-4 sm:py-10"
            >
              <div className="glass-panel rounded-3xl overflow-hidden grid lg:grid-cols-2 max-w-5xl mx-auto">
                {/* Brand panel (desktop) */}
                <div className="hidden lg:flex relative brand-gradient text-white p-10 xl:p-12 flex-col justify-between overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl animate-float-slow" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm">
                      <Sparkles className="w-3.5 h-3.5" /> Livedigit CRM
                    </div>
                    <h2 className="mt-6 text-3xl xl:text-4xl font-extrabold leading-tight">
                      Turn every lead into a lasting client.
                    </h2>
                    <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-sm">
                      The all-in-one workspace for your sales, technical and admin teams.
                    </p>
                  </div>
                  <ul className="relative space-y-5 mt-10">
                    {FEATURES.map(({ icon: Icon, title, text }) => (
                      <li key={title} className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{title}</p>
                          <p className="text-xs text-white/75 mt-0.5 leading-relaxed">{text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Login form */}
                <div className="p-6 sm:p-10 xl:p-12 flex flex-col justify-center">
                  <form onSubmit={handleLoginSubmit} className="stagger space-y-5 w-full max-w-sm mx-auto">
                    <div>
                      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center ring-1 ring-indigo-500/20">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h2 className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white">Welcome back</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Log in with your administrator or representative credentials.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select Role</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-slate-900/70 border border-gray-200/70 dark:border-slate-800">
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSelectedRole(value)}
                            aria-pressed={selectedRole === value}
                            className={`py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                              selectedRole === value
                                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Username</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="e.g. admin or sales person"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          required
                          autoComplete="username"
                          className={`${fieldCls} pl-10 pr-3.5`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          required
                          autoComplete="current-password"
                          className={`${fieldCls} pl-10 pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                      Sign In to Portal
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={user.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <React.Suspense fallback={<BrandLoader label="Loading Workspace..." showSkeleton />}>
                {user.role === 'salesperson' ? (
                  <SalesPortal
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onAddToast={addToast}
                    onAddNotification={addNotification}
                  />
                ) : user.role === 'technical' ? (
                  <TechnicalPortal
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onAddToast={addToast}
                    onAddNotification={addNotification}
                  />
                ) : (
                  <AdminPortal
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onAddToast={addToast}
                    onAddNotification={addNotification}
                  />
                )}
              </React.Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Forgot Password Instructions Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-150 overflow-y-auto animate-in"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-indigo-500/20">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Forgot Password?</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">How to request a password reset</p>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
                <p>
                  To reset your password, please request a reset from your <strong>administrator</strong> directly (via email, slack, or in-person).
                </p>
                <p>
                  The administrator can securely update your password from the <strong>Salesforce Directory</strong> in the Admin Dashboard.
                </p>
                <p>
                  Once the administrator has updated your password, you will be able to log in immediately with your new credentials.
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                <Button variant="primary" size="sm" onClick={() => setShowForgotModal(false)}>
                  Got It
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}