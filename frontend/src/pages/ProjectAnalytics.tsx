import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectAnalyticsOverview } from '../api/analytics';
import type { ProjectAnalyticsOverview } from '../types/analytics';

export const ProjectAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const [analytics, setAnalytics] = useState<ProjectAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);

  useEffect(() => {
    if (!projectId || isNaN(projectId)) {
      setError('Invalid project ID.');
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsUnauthorized(false);
        const data = await getProjectAnalyticsOverview(projectId);
        setAnalytics(data);
      } catch (err: any) {
        if (err?.response?.status === 403 || err?.response?.status === 404) {
          setIsUnauthorized(true);
          setError('You do not have permission to view analytics for this project.');
        } else {
          setError(err?.response?.data?.detail || 'Failed to load project analytics.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#1e293b', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.25rem', color: '#94a3b8' }}>Loading project analytics...</div>
        </div>
      </div>
    );
  }

  if (isUnauthorized || error) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ padding: '2.5rem', backgroundColor: '#1e293b', borderRadius: '12px', textAlign: 'center', border: '1px solid #334155' }}>
          <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>
            {isUnauthorized ? 'Access Restricted' : 'Error Loading Analytics'}
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{error}</p>
          <Link
            to={`/projects/${projectId}`}
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Back to Project Details
          </Link>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { project, progress, tasks_by_status, overdue_tasks, contributors } = analytics;

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Project Analytics Dashboard
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#f8fafc', margin: '0.25rem 0' }}>{project.title}</h1>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Status: <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span> • Visibility: <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{project.visibility}</span>
          </div>
        </div>
        <Link
          to={`/projects/${project.id}`}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#334155',
            color: '#f8fafc',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          ← Back to Project
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Progress Card */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Overall Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{progress.percentage}%</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Completion Rate</div>
        </div>

        {/* Total Tasks Card */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Total Tasks</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>{progress.total_tasks}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>All Project Tasks</div>
        </div>

        {/* Completed Tasks Card */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Completed Tasks</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>{progress.completed_tasks}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Done / Closed</div>
        </div>

        {/* Remaining Tasks Card */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Remaining Tasks</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{progress.incomplete_tasks}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>In Progress & To Do</div>
        </div>

        {/* Overdue Tasks Card */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Overdue Tasks</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: overdue_tasks > 0 ? '#ef4444' : '#22c55e' }}>
            {overdue_tasks}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Past Due Date</div>
        </div>
      </div>

      {/* Progress & Task Breakdown Section */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginTop: 0, marginBottom: '1.25rem' }}>
          Task Status Breakdown
        </h3>

        {/* Overall Completion Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
            <span>Project Completion Progress</span>
            <span>{progress.completed_tasks} of {progress.total_tasks} tasks ({progress.percentage}%)</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#334155', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress.percentage}%`,
                backgroundColor: '#22c55e',
                borderRadius: '6px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Status Distribution Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {/* To Do */}
          <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              <span>To Do</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{tasks_by_status.todo}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress.total_tasks > 0 ? (tasks_by_status.todo / progress.total_tasks) * 100 : 0}%`,
                  backgroundColor: '#94a3b8',
                }}
              />
            </div>
          </div>

          {/* In Progress */}
          <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
              <span>In Progress</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{tasks_by_status.in_progress}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress.total_tasks > 0 ? (tasks_by_status.in_progress / progress.total_tasks) * 100 : 0}%`,
                  backgroundColor: '#3b82f6',
                }}
              />
            </div>
          </div>

          {/* Completed */}
          <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#22c55e', marginBottom: '0.5rem' }}>
              <span>Completed</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{tasks_by_status.completed}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress.total_tasks > 0 ? (tasks_by_status.completed / progress.total_tasks) * 100 : 0}%`,
                  backgroundColor: '#22c55e',
                }}
              />
            </div>
          </div>
        </div>

        {progress.total_tasks === 0 && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '8px', color: '#94a3b8', textAlign: 'center', fontSize: '0.875rem' }}>
            No tasks created for this project yet. Create tasks to track task progress and team contributions.
          </div>
        )}
      </div>

      {/* Developer Contribution Statistics Table */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginTop: 0, marginBottom: '1.25rem' }}>
          Developer Contribution Statistics
        </h3>

        {contributors.length === 0 ? (
          <div style={{ padding: '1.5rem', color: '#94a3b8', textAlign: 'center' }}>
            No contributor data recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', color: '#cbd5e1' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Developer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tasks Assigned</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tasks Completed</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {contributors.map((c) => (
                  <tr key={c.user_id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{c.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: c.role === 'Owner' ? '#3b82f620' : '#334155',
                          color: c.role === 'Owner' ? '#60a5fa' : '#94a3b8',
                          fontWeight: 500,
                        }}
                      >
                        {c.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                      {c.tasks_assigned}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#22c55e' }}>
                      {c.tasks_completed}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>
                      {c.completion_percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
