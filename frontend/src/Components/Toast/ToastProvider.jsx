import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import './Toast.css';

const ToastContext = createContext({
  show: () => null,
  showToast: () => null,
  success: () => null,
  error: () => null,
  info: () => null,
  warning: () => null,
  remove: () => null,
});

let toastIdCounter = 0;

const normalizeMessage = (message) => {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (message instanceof Error && message.message) return message.message;
  try {
    return String(message);
  } catch {
    return '';
  }
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, title, variant = 'info', duration = 4200 }) => {
    const normalizedMessage = normalizeMessage(message);
    if (!normalizedMessage) return null;

    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, title, message: normalizedMessage, variant }]);

    if (duration !== Infinity) {
      const timeout = Number.isFinite(duration) ? duration : 4200;
      window.setTimeout(() => removeToast(id), timeout);
    }

    return id;
  }, [removeToast]);

  const contextValue = useMemo(() => ({
    show: showToast,
    showToast,
    success: (message, options = {}) => showToast({ message, variant: 'success', ...options }),
    error: (message, options = {}) => showToast({ message, variant: 'error', ...options }),
    info: (message, options = {}) => showToast({ message, variant: 'info', ...options }),
    warning: (message, options = {}) => showToast({ message, variant: 'warning', ...options }),
    remove: removeToast,
  }), [removeToast, showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.variant}`}>
            <div className="toast__content">
              {toast.title ? <div className="toast__title">{toast.title}</div> : null}
              <div className="toast__message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastProvider;
