import { useState, useEffect } from 'react';

interface UpdateNotificationProps {
  onRefresh: () => void;
}

export function UpdateNotification({ onRefresh }: UpdateNotificationProps) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Auto-refresh after 10 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRefresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRefresh]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[var(--color-accent)] text-white p-4 shadow-lg">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="font-bold">Nouvelle version disponible!</p>
            <p className="text-sm opacity-90">
              Mise à jour automatique dans {countdown}s
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="btn bg-white text-[var(--color-accent)] font-bold px-6 py-2 rounded hover:bg-gray-100 whitespace-nowrap"
        >
          Mettre à jour maintenant
        </button>
      </div>
    </div>
  );
}
