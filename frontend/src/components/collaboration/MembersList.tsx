import React from 'react';
import type { ProjectOwner } from '../../types/project';
import type { ProjectMembership } from '../../types/collaboration';
import { Crown, UserCheck, Trash2, Users } from 'lucide-react';

interface MembersListProps {
  owner: ProjectOwner;
  members: ProjectMembership[];
  isOwner: boolean;
  onRemoveMember?: (userId: number, username: string) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  owner,
  members,
  isOwner,
  onRemoveMember,
}) => {
  const totalCount = members.length + 1; // 1 for owner

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>Project Team ({totalCount})</span>
        </h2>
      </div>

      <div className="space-y-3">
        {/* Owner Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {owner.avatar ? (
              <img
                src={owner.avatar}
                alt={owner.username}
                className="w-10 h-10 rounded-xl object-cover border border-indigo-500/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {owner.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">{owner.full_name || owner.username}</span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                  <Crown className="w-3 h-3" />
                  <span>Owner</span>
                </span>
              </div>
              <span className="text-[11px] text-indigo-400 font-mono">@{owner.username}</span>
            </div>
          </div>
        </div>

        {/* Members List */}
        {members.map((member) => (
          <div
            key={member.id}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              {member.user.avatar ? (
                <img
                  src={member.user.avatar}
                  alt={member.user.username}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-300 font-bold text-sm">
                  {member.user.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-200">
                    {member.user.full_name || member.user.username}
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold">
                    <UserCheck className="w-3 h-3" />
                    <span>Member</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">@{member.user.username}</span>
              </div>
            </div>

            {/* Owner Remove Action */}
            {isOwner && onRemoveMember && (
              <button
                type="button"
                onClick={() => onRemoveMember(member.user.id, member.user.username)}
                title={`Remove ${member.user.username} from project`}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
