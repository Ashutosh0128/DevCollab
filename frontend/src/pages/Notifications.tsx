import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { NotificationItem } from '../components/notifications/NotificationItem';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../api/notifications';
import type { Notification } from '../types/notification';
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotificationsData = async (filterUnread: boolean, pageNum: number) => {
    setLoading(true);
    try {
      const data = await getNotifications(filterUnread, pageNum);
      setNotifications(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 10) || 1);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationsData(unreadOnly, page);
  }, [unreadOnly, page]);

  const handleFilterChange = (filterUnread: boolean) => {
    setUnreadOnly(filterUnread);
    setPage(1);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {/* Header */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 shadow-xl backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <Bell className="w-7 h-7 text-indigo-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Notifications</h1>
            </div>
            <p className="text-xs text-slate-400">
              Activity updates and collaboration event history.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={!notifications.some((n) => !n.is_read)}
            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleFilterChange(false)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !unreadOnly
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange(true)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                unreadOnly
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread Only
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono">Total: {totalCount}</span>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner size="lg" message="Loading notifications..." />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3 mb-8">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center my-8 shadow-xl">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200 mb-1">You're all caught up!</h3>
            <p className="text-xs text-slate-500">No notifications found.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-50 transition-all flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-slate-400">
              Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalPages}</span>
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-50 transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
