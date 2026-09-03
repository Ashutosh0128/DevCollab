import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getProjects } from '../api/projects';
import type { Project, ProjectFilters as FiltersType } from '../types/project';
import { useAuth } from '../hooks/useAuth';
import { Plus, FolderKanban, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export const Projects: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FiltersType>({ page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects(filters);
      setProjects(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError('Failed to fetch projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const totalPages = Math.ceil(totalCount / 10);
  const currentPage = filters.page || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters({ ...filters, page: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Header Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 shadow-xl backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <FolderKanban className="w-8 h-8 text-indigo-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Project Discovery</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Explore public developer projects, find interesting tech stacks, or share your own project with the community.
            </p>
          </div>

          {isAuthenticated && (
            <Link
              to="/projects/new"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          )}
        </div>

        {/* Filters */}
        <ProjectFilters filters={filters} onFilterChange={setFilters} />

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-3 mb-8">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Content Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" message="Loading projects..." />
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  Showing page <span className="font-semibold text-slate-200">{currentPage}</span> of{' '}
                  <span className="font-semibold text-slate-200">{totalPages}</span> ({totalCount} projects)
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto my-12">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-200 mb-2">No Projects Found</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {filters.mine
                ? "You haven't created any projects yet. Start by creating your first project!"
                : 'No projects match your current search or filter criteria. Try resetting filters.'}
            </p>
            {isAuthenticated && (
              <Link
                to="/projects/new"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Project</span>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
