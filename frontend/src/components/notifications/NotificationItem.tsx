import React from 'react';
import type { Notification } from '../../types/notification';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  UserX,
  LogOut,
  Bell,
  Check,
  Trash2,
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const typeIconMap = {
  COLLABORATION_REQUEST: <UserPlus className="w-4 h-4 text-indigo-400" />,
  COLLABORATION_ACCEPTED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  COLLABORATION_REJECTED: <XCircle className="w-4 h-4 text-rose-400" />,
  MEMBER_REMOVED: <UserX className="w-4 h-4 text-amber-400" />,
  MEMBER_LEFT: <LogOut className="w-4 h-4 text-cyan-400" />,
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
}) => {
  const icon = typeIconMap[notification.notification_type] || <Bell className="w-4 h-4 text-indigo-400" />;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
        notification.is_read
          ? 'bg-slate-900/40 border-slate-800/60 text-slate-300'
          : 'bg-slate-900 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Actor Avatar / Icon */}
        <div className="relative shrink-0">
          {notification.actor?.avatar ? (
            <img
              src={notification.actor.avatar}
              alt={notification.actor.username}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              {notification.actor?.username
                ? notification.actor.username[0].toUpperCase()
                : 'SYS'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-slate-800">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <p className="text-xs font-medium leading-relaxed">{notification.message}</p>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span>{new Date(notification.created_at).toLocaleString()}</span>
            {!notification.is_read && (
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold text-[10px]">
                • Unread
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 shrink-0 pt-0.5">
        {!notification.is_read && onMarkRead && (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
