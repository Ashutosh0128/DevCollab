import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getProjectRequests, acceptRequest, rejectRequest } from '../api/collaboration';
import { getProject } from '../api/projects';
import type { CollaborationRequest } from '../types/collaboration';
import type { Project } from '../types/project';
import { useAuth } from '../hooks/useAuth';
import {
  FolderKanban,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const ProjectRequests: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectAndRequests = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const projData = await getProject(Number(id));
      setProject(projData);

      if (user && projData.owner?.id !== user.id) {
        setError('Only the project owner can view incoming collaboration requests.');
        return;
      }

      const reqData = await getProjectRequests(Number(id));
      setRequests(reqData);
    } catch (err) {
      setError('Failed to load project collaboration requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndRequests();
  }, [id, user]);

  const handleAccept = async (requestId: number) => {
    setActionLoadingId(requestId);
    setError(null);
    try {
      const updated = await acceptRequest(requestId);
      setRequests(requests.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      setError('Failed to accept request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoadingId(requestId);
    setError(null);
    try {
      const updated = await rejectRequest(requestId);
      setRequests(requests.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      setError('Failed to reject request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 py-20 flex justify-center items-center">
          <LoadingSpinner size="lg" message="Loading collaboration requests..." />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center shadow-xl">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-200 mb-2">Access Denied</h2>
            <p className="text-xs text-slate-400 mb-6">{error || 'Project not found.'}</p>
            <Link
              to={id ? `/projects/${id}` : '/projects'}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Project</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const pastRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Back Link */}
        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project Details</span>
        </Link>

        {/* Header Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 shadow-xl backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <FolderKanban className="w-7 h-7 text-indigo-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Collaboration Requests</h1>
            </div>
            <p className="text-xs text-slate-400">
              Project: <span className="text-indigo-300 font-semibold">{project.title}</span>
            </p>
          </div>
        </div>

        {/* Pending Requests Section */}
        <div className="space-y-6 mb-10">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Pending Requests ({pendingRequests.length})</span>
          </h2>

          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-start space-x-4">
                    {req.requester.avatar ? (
                      <img
                        src={req.requester.avatar}
                        alt={req.requester.username}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {req.requester.username[0].toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white">
                          {req.requester.full_name || req.requester.username}
                        </h3>
                        <span className="text-xs font-mono text-indigo-400">@{req.requester.username}</span>
                      </div>
                      <p className="text-xs text-slate-400">{req.requester.job_title || 'Developer'}</p>

                      {req.message && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic">
                          "{req.message}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAccept(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoadingId === req.id ? 'Processing...' : 'Accept'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
              No pending collaboration requests for this project.
            </div>
          )}
        </div>

        {/* Past Requests Section */}
        {pastRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Request History</h2>
            <div className="space-y-3">
              {pastRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-200">@{req.requester.username}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{new Date(req.updated_at).toLocaleDateString()}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                      req.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {req.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
