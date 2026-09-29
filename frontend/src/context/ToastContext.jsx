import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  X,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

let toastCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options) => {
    const id = ++toastCounter;
    const duration = options.duration !== undefined ? options.duration : 4500;
    const newToast = {
      id,
      type: options.type || 'info', // 'success' | 'error' | 'warning' | 'info'
      title: options.title || '',
      message: options.message || '',
      badge: options.badge || '',
      duration,
      createdAt: Date.now(),
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  // Callable toast object with convenience methods
  const toast = useCallback((message, options = {}) => {
    return addToast({ message, ...options });
  }, [addToast]);

  toast.success = useCallback((message, title = 'Success', options = {}) => {
    return addToast({ type: 'success', message, title, ...options });
  }, [addToast]);

  toast.error = useCallback((message, title = 'Error', options = {}) => {
    return addToast({ type: 'error', message, title, duration: 6000, ...options });
  }, [addToast]);

  toast.warning = useCallback((message, title = 'Warning', options = {}) => {
    return addToast({ type: 'warning', message, title, duration: 5500, ...options });
  }, [addToast]);

  toast.info = useCallback((message, title = 'Notice', options = {}) => {
    return addToast({ type: 'info', message, title, ...options });
  }, [addToast]);

  // Specialized Smart Solar Microgrid rule toasts
  toast.sevenDayRule = useCallback((customMessage, options = {}) => {
    return addToast({
      type: 'warning',
      badge: '7-Day Policy',
      title: 'Seven-Day Scheduling Rule',
      message:
        customMessage ||
        'Reservations and energy slots must be scheduled within 7 days from today to ensure grid stability and fair market pricing.',
      duration: 7000,
      iconType: 'calendar',
      ...options,
    });
  }, [addToast]);

  toast.cancellationNotice = useCallback((customMessage, hoursRemaining = null, options = {}) => {
    const noticeText =
      customMessage ||
      (hoursRemaining !== null
        ? `Cancellation policy notice: Energy trades require advance notice (12h-24h). Time remaining before slot starts: ${hoursRemaining.toFixed ? hoursRemaining.toFixed(1) : hoursRemaining} hours.`
        : 'Cancellations require at least 24 hours advance notice (minimum 12 hours before slot begins). Late cancellations impact reliability scores.');
    return addToast({
      type: 'warning',
      badge: 'Notice Window',
      title: 'Advance Notice Requirement',
      message: noticeText,
      duration: 7000,
      iconType: 'clock',
      ...options,
    });
  }, [addToast]);

  toast.confirm = useCallback((message, title = 'Action Confirmed', options = {}) => {
    return addToast({
      type: 'success',
      badge: 'Confirmed',
      title,
      message,
      duration: 5000,
      ...options,
    });
  }, [addToast]);

  toast.cancellation = useCallback((message, title = 'Cancelled', options = {}) => {
    return addToast({
      type: 'info',
      badge: 'Cancelled',
      title,
      message,
      duration: 5000,
      ...options,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Toast Container positioned fixed at top-right
 */
const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      className="toast-container"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={() => onRemove(item.id)} />
      ))}
    </aside>
  );
};

/**
 * Individual Toast notification card with timer progress bar and pause-on-hover
 */
const ToastItem = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);

  React.useEffect(() => {
    if (toast.duration <= 0) return;

    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const duration = remainingTimeRef.current;
    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * (remainingTimeRef.current / toast.duration * 100));
      setProgress(pct);

      if (pct > 0 && !isPaused) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, toast.duration, onDismiss]);

  const handleMouseEnter = () => {
    if (toast.duration > 0) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (toast.duration > 0) {
      setIsPaused(false);
    }
  };

  const getIcon = () => {
    if (toast.iconType === 'calendar') return <Calendar size={18} />;
    if (toast.iconType === 'clock') return <Clock size={18} />;
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div
      className={`toast-card toast-${toast.type}`}
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="toast-icon-wrapper">
        {getIcon()}
      </div>

      <div className="toast-content">
        <div className="toast-header-row">
          {toast.badge && <span className="toast-badge">{toast.badge}</span>}
          {toast.title && <strong className="toast-title">{toast.title}</strong>}
        </div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>

      <button
        type="button"
        className="toast-close-btn"
        onClick={onDismiss}
        aria-label="Close notification"
      >
        <X size={15} />
      </button>

      {toast.duration > 0 && (
        <div className="toast-progress-bar">
          <div
            className="toast-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
