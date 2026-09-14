import React, { useState, useEffect } from 'react';
import { reportService, type CrossTeamMemberSummary } from '../services/reportService';
import { api } from '../lib/api';
import { getWeekOptions, type WeekOption } from '../utils/dateUtils';
import { 
  Calendar, 
  Filter, 
  AlertTriangle, 
  Award, 
  CheckSquare, 
  CalendarPlus, 
  Clock, 
  User, 
  Folder 
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Project {
  _id: string;
  name: string;
}

type SectionTab = 'blockers' | 'achievements' | 'tasks' | 'nextWeek';

export const CrossTeamWeeklySummary: React.FC = () => {
  const weekOptions = getWeekOptions();
  
  // Find current week or default to first available week option
  const currentWeekOption = weekOptions.find((w) => w.label.includes('(Current Week)')) || weekOptions[0];

  const [selectedWeek, setSelectedWeek] = useState<string>(currentWeekOption.weekIdentifier);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState<SectionTab>('blockers');
  const [projects, setProjects] = useState<Project[]>([]);
  const [summaryData, setSummaryData] = useState<CrossTeamMemberSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch project list once on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get<Project[]>('/projects');
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to load projects list', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch cross-team summary data when week or project filter changes
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await reportService.getCrossTeamSummary(selectedWeek, selectedProject);
        setSummaryData(res.data);
      } catch (err) {
        console.error('Failed to fetch cross-team summary:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Data',
          text: 'Failed to retrieve team summary for the selected week.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [selectedWeek, selectedProject]);

  const getStatusBadge = (status: CrossTeamMemberSummary['status']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">Approved</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">Submitted</span>;
      case 'NEEDS_CORRECTION':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full">Needs Correction</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">HIGH</span>;
      case 'Medium':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">MED</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded">LOW</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cross-Team Weekly Summary
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Compare key report sections side-by-side across all submitted team members.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Week Selector */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              {weekOptions.map((w: WeekOption) => (
                <option key={w.weekIdentifier} value={w.weekIdentifier} className="dark:bg-gray-800">
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-gray-800">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id} className="dark:bg-gray-800">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section View Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('blockers')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'blockers'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Blockers</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'achievements'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Achievements</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tasks'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks Completed</span>
          </button>

          <button
            onClick={() => setActiveTab('nextWeek')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'nextWeek'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Next Week Plans</span>
          </button>
        </nav>
      </div>

      {/* Main Content Side-by-Side Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : summaryData.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Submitted Reports</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No team members have submitted reports for {selectedWeek} yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryData.map((member) => (
            <div
              key={member.reportId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
            >
              {/* Card Top / User Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {member.user.name}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Folder className="w-3 h-3 text-gray-400" />
                      {member.project.name}
                    </span>
                  </div>
                </div>
                {getStatusBadge(member.status)}
              </div>

              {/* Card Body - Dynamic Section Display */}
              <div className="p-4 flex-1 space-y-3">
                {/* 1. BLOCKERS VIEW */}
                {activeTab === 'blockers' && (
                  <div>
                    {member.blockers.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No blockers reported.</p>
                    ) : (
                      <ul className="space-y-2">
                        {member.blockers.map((b, idx) => (
                          <li
                            key={b._id || idx}
                            className={`p-2.5 rounded-lg text-xs leading-relaxed border ${
                              b.isKeyBlocker
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-300 font-medium'
                                : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {b.isKeyBlocker && (
                              <span className="inline-block px-1.5 py-0.5 mb-1 text-[9px] font-bold bg-red-600 text-white rounded uppercase tracking-wider">
                                Key Blocker
                              </span>
                            )}
                            <p>{b.description}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* 2. ACHIEVEMENTS VIEW */}
                {activeTab === 'achievements' && (
                  <div>
                    {member.achievements.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No achievements reported.</p>
                    ) : (
                      <ul className="space-y-2">
                        {member.achievements.map((a, idx) => (
                          <li
                            key={a._id || idx}
                            className={`p-2.5 rounded-lg text-xs leading-relaxed border ${
                              a.isKeyAchievement
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 font-medium'
                                : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {a.isKeyAchievement && (
                              <span className="inline-block px-1.5 py-0.5 mb-1 text-[9px] font-bold bg-emerald-600 text-white rounded uppercase tracking-wider">
                                Key Achievement
                              </span>
                            )}
                            <p>{a.description}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* 3. TASKS COMPLETED VIEW */}
                {activeTab === 'tasks' && (
                  <div>
                    {member.tasks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No tasks logged.</p>
                    ) : (
                      <div className="space-y-2">
                        {member.tasks.map((t, idx) => (
                          <div
                            key={t._id || idx}
                            className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {t.taskName}
                              </span>
                              {getPriorityBadge(t.priority)}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                              <span>Status: {t.status}</span>
                              <span>{t.spentHours} hrs ({t.actualPercent}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. NEXT WEEK PLANS VIEW */}
                {activeTab === 'nextWeek' && (
                  <div>
                    {!member.nextWeekTasks ? (
                      <p className="text-xs text-gray-400 italic">No plans detailed for next week.</p>
                    ) : (
                      <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800 whitespace-pre-wrap leading-relaxed">
                        {member.nextWeekTasks}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};