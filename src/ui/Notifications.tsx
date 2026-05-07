import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../stores/useGameStore';
import { useEffect } from 'react';

export function Notifications() {
  const { notifications, removeNotification } = useGameStore();

  useEffect(() => {
    // If there's a new notification, start its timer
    // To avoid resetting timers, we only set a timer for the latest notification
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      const timer = setTimeout(() => {
        removeNotification(latest.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifications.length, removeNotification]);

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none items-end">
      <AnimatePresence>
        {notifications.map(n => {
          let bgColor = 'bg-black/80 border-neutral-700/50';
          let textColor = 'text-white';
          if (n.type === 'reward') {
            bgColor = 'bg-amber-900/80 border-amber-600/50';
            textColor = 'text-amber-100';
          } else if (n.type === 'quest') {
            bgColor = 'bg-blue-900/80 border-blue-600/50';
            textColor = 'text-blue-100';
          } else if (n.type === 'level') {
            bgColor = 'bg-purple-900/80 border-purple-600/50';
            textColor = 'text-purple-100';
          }

          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`min-w-[200px] border px-4 py-3 rounded shadow-xl backdrop-blur-sm font-serif ${bgColor} ${textColor}`}
            >
              {n.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
