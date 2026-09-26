import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Cpu, Lightbulb, ShieldCheck } from 'lucide-react';
import { getProjectMatch } from '../../api/matching';
import type { ProjectMatchResponse } from '../../types/matching';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProjectMatchCardProps {
  projectId: number;
}

export const ProjectMatchCard: React.FC<ProjectMatchCardProps> = ({ projectId }) => {
  const [matchData, setMatchData] = useState<ProjectMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMatch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjectMatch(projectId);
        if (isMounted) setMatchData(data);
      } catch (err) {
        if (isMounted) setError("Unable to evaluate project match alignment.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMatch();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <LoadingSpinner message="Evaluating developer-project match alignment..." />
      </div>
    );
  }

  if (error || !matchData) return null;

  const scoreColor =
    matchData.match_score >= 80
      ? 'from-emerald-500 to-teal-400 text-emerald-400 border-emerald-500/30'
      : matchData.match_score >= 50
      ? 'from-indigo-500 to-blue-400 text-indigo-400 border-indigo-500/30'
      : 'from-amber-500 to-orange-400 text-amber-400 border-amber-500/30';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Skill Match Analysis
              {matchData.is_ai_generated ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Cpu className="w-3 h-3" /> Local AI Powered (Ollama)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  <ShieldCheck className="w-3 h-3" /> Deterministic Summary
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Authoritative skill alignment score and customized fit advice</p>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className={`px-4 py-2 rounded-xl bg-slate-950/80 border text-center font-mono font-extrabold text-xl shadow-inner ${scoreColor}`}>
            {matchData.match_score}%
          </div>
        </div>
      </div>

      {/* Skills Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Skills */}
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 space-y-2">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Matched Skills ({matchData.matched_skills.length})
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {matchData.matched_skills.length > 0 ? (
              matchData.matched_skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No matching skills identified.</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 space-y-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-slate-400" /> Missing Skills ({matchData.missing_skills.length})
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {matchData.missing_skills.length > 0 ? (
              matchData.missing_skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 text-xs font-medium">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-400 font-medium italic">100% skill match — No missing requirements!</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Fit Explanation */}
      <div className="space-y-3 bg-slate-950/40 border border-slate-800/50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> AI Alignment Summary
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">{matchData.explanation}</p>
      </div>

      {/* Recommendations & Skill Gap Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchData.recommendations && matchData.recommendations.length > 0 && (
          <div className="space-y-2 bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4">
            <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-indigo-400" /> Recommendations
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {matchData.recommendations.map((rec, index) => (
                <li key={index} className="leading-normal">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {matchData.skill_gap_advice && (
          <div className="space-y-2 bg-slate-950/30 border border-slate-800/50 rounded-xl p-4">
            <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Skill-Gap Advice
            </h5>
            <p className="text-xs text-slate-300 leading-normal">{matchData.skill_gap_advice}</p>
          </div>
        )}
      </div>
    </div>
  );
};
