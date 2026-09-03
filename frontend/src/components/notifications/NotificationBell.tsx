import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getUnreadCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../api/notifications';
import type { Notification } from '../../types/notification';
import { NotificationDropdown } from './NotificationDropdown';
import { Bell } from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      // Silent error during background polling
    }
  };

  const fetchRecentNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getNotifications(false, 1);
      setNotifications(data.results.slice(0, 5));
    } catch (err) {
      // Silent error during background fetch
    }
  };

  // Lightweight 12-second Polling for Unread Count
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    fetchUnreadCount();
    fetchRecentNotifications();

    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 12000); // 12 seconds polling

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!dropdownOpen) {
      fetchRecentNotifications();
      fetchUnreadCount();
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        title="Notifications"
        className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold border border-slate-950 shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={dropdownOpen}
        notifications={notifications}
        onClose={() => setDropdownOpen(false)}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
      />
    </div>
  );
};
