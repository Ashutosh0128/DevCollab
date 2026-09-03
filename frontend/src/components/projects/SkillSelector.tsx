import React, { useState, useEffect } from 'react';
import { getGlobalSkills } from '../../api/projects';
import type { Skill } from '../../types/auth';
import { Check, Plus, X, Code2 } from 'lucide-react';

interface SkillSelectorProps {
  selectedSkillIds: number[];
  onChange: (skillIds: number[]) => void;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({ selectedSkillIds, onChange }) => {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skillsData = await getGlobalSkills();
        setAllSkills(skillsData);
      } catch (err) {
        console.error('Failed to load global skills', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const toggleSkill = (id: number) => {
    if (selectedSkillIds.includes(id)) {
      onChange(selectedSkillIds.filter((sId) => sId !== id));
    } else {
      onChange([...selectedSkillIds, id]);
    }
  };

  const selectedSkills = allSkills.filter((s) => selectedSkillIds.includes(s.id));
  const filteredSkills = allSkills.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Required Project Skills
      </label>

      {/* Selected Skill Tags */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSkills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className="text-indigo-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Selector Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white flex items-center justify-between transition-all cursor-pointer"
        >
          <span className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>
              {selectedSkills.length === 0
                ? 'Select required technologies...'
                : `${selectedSkills.length} skill(s) selected`}
            </span>
          </span>
          <Plus className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-45' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute z-20 mt-2 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 max-h-60 overflow-y-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-2"
            />

            {loading ? (
              <div className="text-xs text-slate-400 p-2 text-center">Loading skills...</div>
            ) : filteredSkills.length > 0 ? (
              <div className="space-y-1">
                {filteredSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{skill.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-500 p-2 text-center">No matching skills found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
