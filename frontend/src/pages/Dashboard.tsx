import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';
import { User as UserIcon, Briefcase, Award, MapPin, Globe, Shield, LogOut, CheckCircle2, Code2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Welcome Header */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 shadow-xl backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/25 shrink-0">
              {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome back, {user.first_name || user.username} 👋
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  Authenticated
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 flex items-center space-x-2">
                <span>@{user.username}</span>
                <span>•</span>
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 text-sm font-medium transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Developer Profile Overview Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-indigo-400" />
                <span>Developer Overview</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Job Title</span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">
                    {user.job_title || 'Software Engineer'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span>Experience Level</span>
                  </div>
                  <div className="text-sm font-medium text-slate-200 capitalize">
                    {user.experience_level || 'Mid Level'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Location</span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">
                    {user.location || 'Remote'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Availability</span>
                  </div>
                  <div className="text-sm font-medium text-emerald-400 capitalize">
                    {user.availability ? user.availability.replace('_', ' ') : 'Available'}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {user.bio && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About Bio</h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/60">
                    {user.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Developer Skills Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Technical Skills</span>
              </h2>

              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <span
                      key={skill.id || skill.name}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 text-xs text-slate-400 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>No skills tagged yet. You can update your skills via profile settings.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info Card */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4">Account Information</h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">User ID</span>
                  <span className="font-mono text-slate-200">#{user.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Username</span>
                  <span className="font-mono text-slate-200">@{user.username}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Email</span>
                  <span className="font-mono text-slate-200">{user.email}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Joined</span>
                  <span className="text-slate-200">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4">Social & Profiles</h2>
              <div className="space-y-2.5">
                {user.github_url ? (
                  <a
                    href={user.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{user.github_url}</span>
                  </a>
                ) : (
                  <div className="text-xs text-slate-500 italic">No GitHub link provided</div>
                )}

                {user.linkedin_url ? (
                  <a
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{user.linkedin_url}</span>
                  </a>
                ) : null}

                {user.portfolio_url ? (
                  <a
                    href={user.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{user.portfolio_url}</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
