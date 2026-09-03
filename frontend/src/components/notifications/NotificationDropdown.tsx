import React from 'react';
import { Link } from 'react-router-dom';
import type { Notification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';
import { CheckCheck, ExternalLink, Bell } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden backdrop-blur">
      {/* Dropdown Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Notifications</h3>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto p-3 space-y-2.5 divide-y-0">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            You're all caught up! No notifications yet.
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1 transition-colors"
        >
          <span>View all notifications</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
