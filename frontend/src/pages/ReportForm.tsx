import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, Trash2, Save, Send, AlertCircle, AlertTriangle, Trophy, Calendar } from 'lucide-react';
import { getWeekOptions, type WeekOption } from '../utils/dateUtils';

interface Task {
  taskName: string;
  priority: 'Low' | 'Medium' | 'High';
  plannedPercent: number;
  actualPercent: number;
  status: string;
  plannedHours: number;
  spentHours: number;
  deliverable: string;
}

interface BlockerItem {
  description: string;
  isKeyBlocker: boolean;
}

interface AchievementItem {
  description: string;
  isKeyAchievement: boolean;
}

interface Project {
  _id: string;
  name: string;
}

export const ReportForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const weekOptions = getWeekOptions();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');

  // Default to current week or the first generated option
  const [selectedWeek, setSelectedWeek] = useState<WeekOption>(
    weekOptions.find((w) => w.label.includes('(Current Week)')) || weekOptions[0]
  );

  const [nextWeekTasks, setNextWeekTasks] = useState('');
  const [notes, setNotes] = useState('');

  // Dynamic Arrays for Blockers and Achievements
  const [blockers, setBlockers] = useState<BlockerItem[]>([
    { description: '', isKeyBlocker: false }
  ]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([
    { description: '', isKeyAchievement: false }
  ]);

  const [hoursWorked, setHoursWorked] = useState({
    development: 0,
    testing: 0,
    meetings: 0,
    documentation: 0,
  });

  const [tasks, setTasks] = useState<Task[]>([
    {
      taskName: '',
      priority: 'Medium',
      plannedPercent: 100,
      actualPercent: 0,
      status: 'In Progress',
      plannedHours: 0,
      spentHours: 0,
      deliverable: '',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
        if (res.data.length > 0 && !projectId) {
          setProjectId(res.data[0]._id);
        }
      } catch (err) {
        setError('Failed to load active projects');
      }
    };

    fetchProjects();

    if (id) {
      const fetchReport = async () => {
        try {
          const res = await api.get(`/reports/${id}`);
          const r = res.data;
          setProjectId(r.projectId._id || r.projectId);

          // Match existing report dates to an available week option, or create custom fallback
          const fetchedStart = r.weekStart.split('T')[0];
          const matchedOption = weekOptions.find((w) => w.weekStart === fetchedStart);
          if (matchedOption) {
            setSelectedWeek(matchedOption);
          } else {
            const fetchedEnd = r.weekEnd.split('T')[0];
            setSelectedWeek({
              label: `${fetchedStart} - ${fetchedEnd}`,
              weekStart: fetchedStart,
              weekEnd: fetchedEnd,
              weekIdentifier: r.weekIdentifier || fetchedStart,
            });
          }

          setTasks(r.tasks || []);
          setHoursWorked(r.hoursWorked || { development: 0, testing: 0, meetings: 0, documentation: 0 });
          setNextWeekTasks(r.nextWeekTasks || '');

          // Backward Compatibility & Array Safety
          if (Array.isArray(r.blockers) && r.blockers.length > 0) {
            setBlockers(r.blockers);
          } else if (typeof r.blockers === 'string' && r.blockers) {
            setBlockers([{ description: r.blockers, isKeyBlocker: r.keyBlocker || false }]);
          }

          if (Array.isArray(r.achievements) && r.achievements.length > 0) {
            setAchievements(r.achievements);
          } else if (typeof r.achievements === 'string' && r.achievements) {
            setAchievements([{ description: r.achievements, isKeyAchievement: r.keyAchievement || false }]);
          }

          setNotes(r.notes || '');
        } catch (err) {
          setError('Failed to load report details');
        }
      };
      fetchReport();
    }
  }, [id]);

  // Week Selector Handler
  const handleWeekSelect = (identifier: string) => {
    const found = weekOptions.find((w) => w.weekIdentifier === identifier);
    if (found) {
      setSelectedWeek(found);
    }
  };

  // Task Handlers
  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
        taskName: '',
        priority: 'Medium',
        plannedPercent: 100,
        actualPercent: 0,
        status: 'In Progress',
        plannedHours: 0,
        spentHours: 0,
        deliverable: '',
      },
    ]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, field: keyof Task, value: any) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  // Blocker Handlers
  const handleAddBlocker = () => {
    setBlockers([...blockers, { description: '', isKeyBlocker: false }]);
  };

  const handleRemoveBlocker = (index: number) => {
    setBlockers(blockers.filter((_, i) => i !== index));
  };

  const handleBlockerTextChange = (index: number, text: string) => {
    const updated = [...blockers];
    updated[index].description = text;
    setBlockers(updated);
  };

  const handleToggleKeyBlocker = (index: number) => {
    const updated = blockers.map((item, i) => ({
      ...item,
      isKeyBlocker: i === index ? !item.isKeyBlocker : false,
    }));
    setBlockers(updated);
  };

  // Achievement Handlers
  const handleAddAchievement = () => {
    setAchievements([...achievements, { description: '', isKeyAchievement: false }]);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleAchievementTextChange = (index: number, text: string) => {
    const updated = [...achievements];
    updated[index].description = text;
    setAchievements(updated);
  };

  const handleToggleKeyAchievement = (index: number) => {
    const updated = achievements.map((item, i) => ({
      ...item,
      isKeyAchievement: i === index ? !item.isKeyAchievement : false,
    }));
    setAchievements(updated);
  };

  const handleSubmit = async (isSubmit: boolean) => {
    setError('');
    setLoading(true);

    const cleanBlockers = blockers.filter((b) => b.description.trim() !== '');
    const cleanAchievements = achievements.filter((a) => a.description.trim() !== '');

    const payload = {
      projectId,
      weekStart: selectedWeek.weekStart,
      weekEnd: selectedWeek.weekEnd,
      weekIdentifier: selectedWeek.weekIdentifier,
      tasks,
      hoursWorked,
      nextWeekTasks,
      blockers: cleanBlockers,
      achievements: cleanAchievements,
      notes,
      isSubmit,
    };

    try {
      if (id) {
        await api.put(`/reports/${id}`, payload);
      } else {
        await api.post('/reports', payload);
      }
      navigate('/reports');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="card p-6 md:p-10">
        <h1 className="page-title">
          {id ? 'Edit Weekly Report' : 'Create Weekly Report'}
        </h1>

        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center space-x-3 shadow-sm backdrop-blur-sm">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Project & Unified Week Selection */}
          <div className="card-panel grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label-text">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="input-field"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>Report Week</span>
              </label>
              <select
                value={selectedWeek.weekIdentifier}
                onChange={(e) => handleWeekSelect(e.target.value)}
                className="input-field"
              >
                {weekOptions.map((w) => (
                  <option key={w.weekIdentifier} value={w.weekIdentifier}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Breakdown */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="section-title !mb-0">Tasks Breakdown</h2>
              <button
                type="button"
                onClick={handleAddTask}
                className="btn-secondary"
              >
                <Plus className="w-5 h-5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="space-y-4">
              {tasks.map((task, idx) => (
                <div key={idx} className="p-6 card-panel space-y-4 relative group transition-all hover:shadow-lg">
                  {/* Row 1: Task Name & Delete Action */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <label className="label-text uppercase tracking-wider text-xs">Task Name</label>
                      <input
                        type="text"
                        placeholder="Task title or narrative description..."
                        value={task.taskName}
                        onChange={(e) => handleTaskChange(idx, 'taskName', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all absolute right-4 top-4 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Row 2: Deliverable / Output Produced */}
                  <div>
                    <label className="label-text uppercase tracking-wider text-xs">Output / Deliverable Produced</label>
                    <input
                      type="text"
                      placeholder="e.g. PR #402 merged, API documentation published, design spec completed..."
                      value={task.deliverable || ''}
                      onChange={(e) => handleTaskChange(idx, 'deliverable', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  {/* Row 3: Metrics & Selectors */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Status</label>
                      <select
                        value={task.status || 'In Progress'}
                        onChange={(e) => handleTaskChange(idx, 'status', e.target.value)}
                        className="input-field"
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Priority</label>
                      <select
                        value={task.priority}
                        onChange={(e) => handleTaskChange(idx, 'priority', e.target.value)}
                        className="input-field"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Planned %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.plannedPercent}
                        onChange={(e) => handleTaskChange(idx, 'plannedPercent', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Actual %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.actualPercent}
                        onChange={(e) => handleTaskChange(idx, 'actualPercent', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Plan Hrs</label>
                      <input
                        type="number"
                        min="0"
                        value={task.plannedHours}
                        onChange={(e) => handleTaskChange(idx, 'plannedHours', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Spent Hrs</label>
                      <input
                        type="number"
                        min="0"
                        value={task.spentHours}
                        onChange={(e) => handleTaskChange(idx, 'spentHours', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hours Allocation */}
          <div>
            <h2 className="section-title">Hours Allocation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 card-panel">
              <div>
                <label className="label-text">Development</label>
                <input
                  type="number"
                  value={hoursWorked.development}
                  onChange={(e) => setHoursWorked({ ...hoursWorked, development: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Testing</label>
                <input
                  type="number"
                  value={hoursWorked.testing}
                  onChange={(e) => setHoursWorked({ ...hoursWorked, testing: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Meetings</label>
                <input
                  type="number"
                  value={hoursWorked.meetings}
                  onChange={(e) => setHoursWorked({ ...hoursWorked, meetings: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Documentation</label>
                <input
                  type="number"
                  value={hoursWorked.documentation}
                  onChange={(e) => setHoursWorked({ ...hoursWorked, documentation: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Key Achievements & Dynamic Blockers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Blockers & Risks Dynamic Section */}
            <div className="card-panel border-orange-200/50 dark:border-orange-500/20 space-y-4">
              <div className="flex justify-between items-center">
                <label className="section-title !mb-0 text-orange-600 dark:text-orange-400 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Blockers & Risks</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddBlocker}
                  className="text-xs text-orange-600 dark:text-orange-400 font-semibold flex items-center space-x-1 hover:bg-orange-500/10 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Blocker</span>
                </button>
              </div>

              <div className="space-y-3">
                {blockers.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/40 dark:bg-black/20 rounded-xl border border-orange-200/40 dark:border-orange-500/20 space-y-2 relative group">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleBlockerTextChange(idx, e.target.value)}
                        placeholder={`Blocker #${idx + 1}...`}
                        className="input-field text-sm py-1.5"
                      />
                      {blockers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBlocker(idx)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-orange-600 dark:text-orange-400">
                        <input
                          type="checkbox"
                          checked={item.isKeyBlocker}
                          onChange={() => handleToggleKeyBlocker(idx)}
                          className="rounded text-orange-600 focus:ring-orange-500 bg-transparent border-orange-300"
                        />
                        <span>Flag as Key Blocker</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Dynamic Section */}
            <div className="card-panel border-green-200/50 dark:border-green-500/20 space-y-4">
              <div className="flex justify-between items-center">
                <label className="section-title !mb-0 text-green-600 dark:text-green-400 flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Key Achievements</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center space-x-1 hover:bg-green-500/10 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Achievement</span>
                </button>
              </div>

              <div className="space-y-3">
                {achievements.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/40 dark:bg-black/20 rounded-xl border border-green-200/40 dark:border-green-500/20 space-y-2 relative group">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleAchievementTextChange(idx, e.target.value)}
                        placeholder={`Achievement #${idx + 1}...`}
                        className="input-field text-sm py-1.5"
                      />
                      {achievements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAchievement(idx)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-green-600 dark:text-green-400">
                        <input
                          type="checkbox"
                          checked={item.isKeyAchievement}
                          onChange={() => handleToggleKeyAchievement(idx)}
                          className="rounded text-green-600 focus:ring-green-500 bg-transparent border-green-300"
                        />
                        <span>Flag as Highlight</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Week tasks & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-panel">
              <label className="section-title block">Planned for Next Week</label>
              <textarea
                rows={5}
                value={nextWeekTasks}
                onChange={(e) => setNextWeekTasks(e.target.value)}
                className="input-field resize-none"
                placeholder="Outline key objectives for next week..."
              />
            </div>

            <div className="card-panel">
              <label className="section-title block">Additional Notes</label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none"
                placeholder="Any extra comments or explanations..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-200/50 dark:border-white/10">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="btn-secondary"
            >
              <Save className="w-5 h-5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="btn-primary"
            >
              <Send className="w-5 h-5" />
              <span>Submit Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};