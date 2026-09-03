import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getProject, deleteProject } from '../api/projects';
import type { Project, ProjectStatus, ProjectVisibility } from '../types/project';
import { useAuth } from '../hooks/useAuth';
import {
  FolderKanban,
  Code2,
  ExternalLink,
  Edit3,
  Trash2,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { AxiosError } from 'axios';

const statusBadgeMap: Record<ProjectStatus, { label: string; className: string }> = {
  planning: { label: 'Planning', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  in_progress: { label: 'In Progress', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  on_hold: { label: 'On Hold', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const visibilityBadgeMap: Record<ProjectVisibility, { label: string; className: string }> = {
  public: { label: 'Public', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  private: { label: 'Private', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getProject(Number(id));
        setProject(data);
      } catch (err) {
        const axiosErr = err as AxiosError<{ detail?: string }>;
        if (axiosErr.response?.status === 403 || axiosErr.response?.status === 404) {
          setError("You don't have permission to view this project or it does not exist.");
        } else {
          setError('Failed to load project details.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!project) return;
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      navigate('/projects');
    } catch (err) {
      setError('Failed to delete project.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 py-20 flex justify-center items-center">
          <LoadingSpinner size="lg" message="Loading project details..." />
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
            <h2 className="text-xl font-bold text-slate-200 mb-2">Access Error</h2>
            <p className="text-xs text-slate-400 mb-6">{error || 'Project not found.'}</p>
            <Link
              to="/projects"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Projects</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = user && user.id === project.owner?.id;
  const statusInfo = statusBadgeMap[project.status] || statusBadgeMap.planning;
  const visibilityInfo = visibilityBadgeMap[project.visibility] || visibilityBadgeMap.public;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Back Link */}
        <Link
          to="/projects"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Discovery</span>
        </Link>

        {/* Project Header Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-0.5 rounded-full border text-xs font-semibold ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
                <span className={`px-3 py-0.5 rounded-full border text-xs font-semibold ${visibilityInfo.className}`}>
                  {visibilityInfo.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{project.title}</h1>
              {project.short_description && (
                <p className="text-sm text-indigo-300 mt-2 font-medium">{project.short_description}</p>
              )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
                <Link
                  to={`/projects/${project.id}/edit`}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Project</span>
                </Link>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Repository & Demo Links */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-800">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-medium transition-all flex items-center space-x-2"
              >
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}

            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs text-indigo-300 font-medium transition-all flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </div>

        {/* Main Grid: Details + Owner Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detailed Project Description */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-indigo-400" />
                <span>Project Description</span>
              </h2>
              <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                {project.description}
              </div>
            </div>

            {/* Required Technologies */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <span>Required Skills & Technologies</span>
              </h2>

              {project.skills && project.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific skills listed for this project.</p>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Owner Information Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Project Owner</h2>
              <div className="flex items-center space-x-4">
                {project.owner?.avatar ? (
                  <img
                    src={project.owner.avatar}
                    alt={project.owner.username}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg">
                    {project.owner?.username[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {project.owner?.full_name || project.owner?.username}
                  </h3>
                  <p className="text-xs text-indigo-400 font-mono">@{project.owner?.username}</p>
                  <p className="text-xs text-slate-400 mt-1">{project.owner?.job_title || 'Developer'}</p>
                </div>
              </div>
            </div>

            {/* Meta Metadata */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur text-xs space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Created</span>
                <span className="text-slate-200">{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-slate-200">{new Date(project.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Delete Project?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-white">"{project.title}"</span>?
                This action cannot be undone.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Project'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
