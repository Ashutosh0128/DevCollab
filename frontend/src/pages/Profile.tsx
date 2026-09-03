import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';
import { updateProfile, addSkill, removeSkill } from '../api/auth';
import type { Skill } from '../types/auth';
import {
  User as UserIcon,
  Briefcase,
  Award,
  MapPin,
  Save,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { AxiosError } from 'axios';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    job_title: user?.job_title || '',
    experience_level: user?.experience_level || 'mid',
    location: user?.location || '',
    avatar: user?.avatar || '',
    github_url: user?.github_url || '',
    linkedin_url: user?.linkedin_url || '',
    portfolio_url: user?.portfolio_url || '',
  });

  const [skills, setSkills] = useState<Skill[]>(user?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        job_title: user.job_title || '',
        experience_level: user.experience_level || 'mid',
        location: user.location || '',
        avatar: user.avatar || '',
        github_url: user.github_url || '',
        linkedin_url: user.linkedin_url || '',
        portfolio_url: user.portfolio_url || '',
      });
      setSkills(user.skills || []);
    }
  }, [user]);

  // Profile Completion Percentage Calculation
  const calculateCompletion = (): number => {
    if (!user) return 0;
    const fields = [
      formData.first_name,
      formData.last_name,
      formData.bio,
      formData.job_title,
      formData.experience_level,
      formData.location,
      skills.length > 0 ? 'skills' : '',
      formData.github_url || formData.linkedin_url || formData.portfolio_url ? 'social' : '',
    ];
    const filledCount = fields.filter((val) => Boolean(val && String(val).trim() !== '')).length;
    return Math.round((filledCount / fields.length) * 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (successMsg) setSuccessMsg(null);
    if (errorMsg) setErrorMsg(null);
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      await updateProfile(formData);
      await refreshUser();
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      const axiosError = err as AxiosError<Record<string, string[] | string>>;
      if (axiosError.response?.data) {
        const data = axiosError.response.data;
        const newFieldErrors: Record<string, string> = {};

        Object.keys(data).forEach((key) => {
          const val = data[key];
          if (Array.isArray(val)) {
            newFieldErrors[key] = val[0];
          } else if (typeof val === 'string') {
            newFieldErrors[key] = val;
          }
        });

        setFieldErrors(newFieldErrors);
        setErrorMsg('Please correct the highlighted errors below.');
      } else {
        setErrorMsg('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSkillInput.trim();
    if (!cleanName) return;

    if (skills.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMsg(`Skill "${cleanName}" is already on your profile.`);
      return;
    }

    setIsAddingSkill(true);
    setErrorMsg(null);

    try {
      const createdSkill = await addSkill(cleanName);
      setSkills([...skills, createdSkill]);
      setNewSkillInput('');
      await refreshUser();
      setSuccessMsg(`Skill "${createdSkill.name}" added!`);
    } catch (err) {
      setErrorMsg('Failed to add skill. Please try again.');
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId: number, skillName: string) => {
    try {
      await removeSkill(skillId);
      setSkills(skills.filter((s) => s.id !== skillId));
      await refreshUser();
      setSuccessMsg(`Skill "${skillName}" removed.`);
    } catch (err) {
      setErrorMsg('Failed to remove skill.');
    }
  };

  if (!user) return null;

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Profile Header Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={user.username}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-indigo-600/25">
                    {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {formData.first_name || formData.last_name
                    ? `${formData.first_name} ${formData.last_name}`.trim()
                    : user.username}
                </h1>
                <p className="text-sm text-indigo-400 font-mono mt-0.5">@{user.username}</p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{formData.job_title || 'Developer'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formData.location || 'Remote'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Completion Indicator */}
            <div className="w-full md:w-64 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Profile Completion</span>
                </span>
                <span className="text-indigo-400 font-mono">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center space-x-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Grid: Form + Skill Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Edit Form */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-indigo-400" />
              <span>Edit Personal & Professional Information</span>
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Names Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Siddhi"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Thale"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Job Title & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="Full Stack Engineer"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="entry">Entry Level (0-2 yrs)</option>
                    <option value="mid">Mid Level (2-5 yrs)</option>
                    <option value="senior">Senior (5-8 yrs)</option>
                    <option value="lead">Lead / Staff (8+ yrs)</option>
                    <option value="principal">Principal / Architect</option>
                  </select>
                </div>
              </div>

              {/* Location & Avatar URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Mumbai, India or Remote"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Avatar Image URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Bio / Summary
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Share a short summary of your technical background and experience..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Social Links Section */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4 text-indigo-400" />
                  <span>Social & Portfolio Profiles</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">GitHub Profile URL</label>
                    <input
                      type="url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className={`w-full px-3.5 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                        fieldErrors.github_url
                          ? 'border-rose-500'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {fieldErrors.github_url && (
                      <p className="mt-1 text-xs text-rose-400">{fieldErrors.github_url}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className={`w-full px-3.5 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                        fieldErrors.linkedin_url
                          ? 'border-rose-500'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {fieldErrors.linkedin_url && (
                      <p className="mt-1 text-xs text-rose-400">{fieldErrors.linkedin_url}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Portfolio / Website URL</label>
                    <input
                      type="url"
                      name="portfolio_url"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                      className={`w-full px-3.5 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                        fieldErrors.portfolio_url
                          ? 'border-rose-500'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {fieldErrors.portfolio_url && (
                      <p className="mt-1 text-xs text-rose-400">{fieldErrors.portfolio_url}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Save Button */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Skill Tag Management Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Technical Skills Tags</span>
              </h2>

              {/* Skill Addition Form */}
              <form onSubmit={handleAddSkill} className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Add New Skill
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="e.g. Django, React..."
                    disabled={isAddingSkill}
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isAddingSkill || !newSkillInput.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Skill Chips List */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Your Skills ({skills.length})
                </h3>

                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill.id || skill.name}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium group"
                      >
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id, skill.name)}
                          title={`Remove ${skill.name}`}
                          className="text-indigo-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-slate-950 border border-slate-800/60">
                    No skills added yet. Use the input box above to add your developer skills.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
