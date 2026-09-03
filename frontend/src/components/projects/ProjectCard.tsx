import React from 'react';
import { Link } from 'react-router-dom';
import type { Project, ProjectStatus, ProjectVisibility } from '../../types/project';
import { User, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

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

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const statusInfo = statusBadgeMap[project.status] || statusBadgeMap.planning;
  const visibilityInfo = visibilityBadgeMap[project.visibility] || visibilityBadgeMap.public;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur flex flex-col justify-between hover:border-slate-700 transition-all group">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${visibilityInfo.className}`}>
            {visibilityInfo.label}
          </span>
        </div>

        {/* Project Title */}
        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors mb-2 line-clamp-1">
          {project.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {project.short_description || project.description}
        </p>

        {/* Required Skills Chips */}
        {project.skills && project.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.skills.slice(0, 4).map((skill) => (
              <span
                key={skill.id}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
              >
                {skill.name}
              </span>
            ))}
            {project.skills.length > 4 && (
              <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium">
                +{project.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          {project.owner?.avatar ? (
            <img
              src={project.owner.avatar}
              alt={project.owner.username}
              className="w-5 h-5 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <User className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span className="font-mono text-slate-300">@{project.owner?.username}</span>
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold transition-all flex items-center space-x-1 cursor-pointer"
        >
          <span>View Project</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
