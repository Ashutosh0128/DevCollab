import React, { useState, useEffect } from 'react';
import type { ProjectFilters as FiltersType } from '../../types/project';
import { getGlobalSkills } from '../../api/projects';
import type { Skill } from '../../types/auth';
import { Search, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ProjectFiltersProps {
  filters: FiltersType;
  onFilterChange: (newFilters: FiltersType) => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({ filters, onFilterChange }) => {
  const { isAuthenticated } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skillsData = await getGlobalSkills();
        setSkills(skillsData);
      } catch (err) {
        console.error('Failed to fetch filter skills', err);
      }
    };
    fetchSkills();
  }, []);

  // Debounced search handling
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== searchInput) {
        onFilterChange({ ...filters, search: searchInput, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 mb-8 shadow-xl backdrop-blur flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search projects by title, keyword, or description..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Selectors & Toggles */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined, page: 1 })}
          className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>

        {/* Skill Filter */}
        <select
          value={filters.skill || ''}
          onChange={(e) => onFilterChange({ ...filters, skill: e.target.value || undefined, page: 1 })}
          className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">All Skills</option>
          {skills.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        {/* My Projects Toggle */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, mine: !filters.mine, page: 1 })}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
              filters.mine
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Projects</span>
          </button>
        )}
      </div>
    </div>
  );
};
