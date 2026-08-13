import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

let _show = null;

/**
 * Programmatically show a toast from anywhere.
 * @param {string} message
 * @param {'success'|'info'|'error'} [type]
 */
export const showToast = (message, type = 'info') => {
  if (_show) _show({ message, type });
};

/**
 * Mount this once at the app root. It listens for showToast() calls.
 */
const Toast = () => {
  const [toast, setToast] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    _show = ({ message, type }) => {
      setLeaving(false);
      setToast({ message, type });
    };
    return () => { _show = null; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => setToast(null), 200);
    }, 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast ${leaving ? 'animate-fade-out' : 'animate-toast-in'}`}
    >
      {toast.type === 'success' && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
          <Check size={12} strokeWidth={2.5} />
        </span>
      )}
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;
