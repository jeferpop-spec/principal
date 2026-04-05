import { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Notification({ type, message, duration = 4000, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
    },
  };

  const current = config[type];
  const Icon = current.icon;

  return (
    <div
      className={`fixed bottom-6 right-6 max-w-md rounded-lg border ${current.bg} ${current.border} p-4 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50`}
    >
      <Icon className={`flex-shrink-0 ${current.iconColor}`} size={20} />
      <p className={`text-sm font-medium ${current.text} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
}
