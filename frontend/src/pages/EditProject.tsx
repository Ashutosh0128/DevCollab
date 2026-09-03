import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { SkillSelector } from '../components/projects/SkillSelector';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getProject, updateProject } from '../api/projects';
import type { ProjectStatus, ProjectVisibility } from '../types/project';
import { useAuth } from '../hooks/useAuth';
import { FolderKanban, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';

export const EditProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    status: 'planning' as ProjectStatus,
    visibility: 'public' as ProjectVisibility,
    github_url: '',
    demo_url: '',
    cover_image: '',
  });

  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await getProject(Number(id));
        if (user && data.owner?.id !== user.id) {
          setErrorMsg('You do not have permission to edit this project.');
          return;
        }

        setFormData({
          title: data.title || '',
          short_description: data.short_description || '',
          description: data.description || '',
          status: data.status || 'planning',
          visibility: data.visibility || 'public',
          github_url: data.github_url || '',
          demo_url: data.demo_url || '',
          cover_image: data.cover_image || '',
        });

        if (data.skills) {
          setSelectedSkillIds(data.skills.map((s) => s.id));
        }
      } catch (err) {
        setErrorMsg('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg(null);
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSaving(true);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      const payload = {
        ...formData,
        skills: selectedSkillIds,
      };
      await updateProject(Number(id), payload);
      navigate(`/projects/${id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<Record<string, string[] | string>>;
      if (axiosErr.response?.data) {
        const data = axiosErr.response.data;
        const newFieldErrors: Record<string, string> = {};
        Object.keys(data).forEach((key) => {
          const val = data[key];
          newFieldErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setFieldErrors(newFieldErrors);
        setErrorMsg('Please fix the highlighted errors below.');
      } else {
        setErrorMsg('Failed to update project. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 py-20 flex justify-center items-center">
          <LoadingSpinner size="lg" message="Loading project for editing..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {/* Back Link */}
        <Link
          to={`/projects/${id}`}
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project Details</span>
        </Link>

        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
            <FolderKanban className="w-7 h-7 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Edit Project</h1>
              <p className="text-xs text-slate-400">Update project requirements, visibility, or skills.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Project Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  fieldErrors.title ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.title && <p className="mt-1 text-xs text-rose-400">{fieldErrors.title}</p>}
            </div>

            {/* Short Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Short Tagline / Summary
              </label>
              <input
                type="text"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  fieldErrors.description ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.description && <p className="mt-1 text-xs text-rose-400">{fieldErrors.description}</p>}
            </div>

            {/* Status & Visibility Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Visibility Mode
                </label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="public">Public (Discoverable by everyone)</option>
                  <option value="private">Private (Only visible to you)</option>
                </select>
              </div>
            </div>

            {/* Skill Selector Component */}
            <SkillSelector selectedSkillIds={selectedSkillIds} onChange={setSelectedSkillIds} />

            {/* URLs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    fieldErrors.github_url ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                  }`}
                />
                {fieldErrors.github_url && <p className="mt-1 text-xs text-rose-400">{fieldErrors.github_url}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Live Demo URL
                </label>
                <input
                  type="url"
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    fieldErrors.demo_url ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                  }`}
                />
                {fieldErrors.demo_url && <p className="mt-1 text-xs text-rose-400">{fieldErrors.demo_url}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
