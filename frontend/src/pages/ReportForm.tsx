import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';

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

interface Project {
  _id: string;
  name: string;
}

export const ReportForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [weekStart, setWeekStart] = useState('2026-09-07');
  const [weekEnd, setWeekEnd] = useState('2026-09-13');
  const [nextWeekTasks, setNextWeekTasks] = useState('');
  const [blockers, setBlockers] = useState('');
  const [keyBlocker, setKeyBlocker] = useState(false);
  const [achievements, setAchievements] = useState('');
  const [keyAchievement, setKeyAchievement] = useState(false);
  const [notes, setNotes] = useState('');
  
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
          setWeekStart(r.weekStart.split('T')[0]);
          setWeekEnd(r.weekEnd.split('T')[0]);
          setTasks(r.tasks || []);
          setHoursWorked(r.hoursWorked || { development: 0, testing: 0, meetings: 0, documentation: 0 });
          setNextWeekTasks(r.nextWeekTasks || '');
          setBlockers(r.blockers || '');
          setKeyBlocker(r.keyBlocker || false);
          setAchievements(r.achievements || '');
          setKeyAchievement(r.keyAchievement || false);
          setNotes(r.notes || '');
        } catch (err) {
          setError('Failed to load report details');
        }
      };
      fetchReport();
    }
  }, [id]);

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

  const handleSubmit = async (isSubmit: boolean) => {
    setError('');
    setLoading(true);

    const payload = {
      projectId,
      weekStart,
      weekEnd,
      tasks,
      hoursWorked,
      nextWeekTasks,
      blockers,
      keyBlocker,
      achievements,
      keyAchievement,
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
          {/* Project & Dates */}
          <div className="card-panel grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <label className="label-text">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Week End</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="input-field"
              />
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

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                        value={task.plannedPercent}
                        onChange={(e) => handleTaskChange(idx, 'plannedPercent', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Actual %</label>
                      <input
                        type="number"
                        value={task.actualPercent}
                        onChange={(e) => handleTaskChange(idx, 'actualPercent', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Plan Hrs</label>
                      <input
                        type="number"
                        value={task.plannedHours}
                        onChange={(e) => handleTaskChange(idx, 'plannedHours', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label-text uppercase tracking-wider text-xs">Spent Hrs</label>
                      <input
                        type="number"
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

          {/* Next Week & Blockers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-panel">
              <label className="section-title block">Planned for Next Week</label>
              <textarea
                rows={4}
                value={nextWeekTasks}
                onChange={(e) => setNextWeekTasks(e.target.value)}
                className="input-field resize-none"
                placeholder="Outline key objectives for next week..."
              />
            </div>

            <div className="card-panel border-orange-200/50 dark:border-orange-500/20">
              <div className="flex justify-between items-center mb-3">
                <label className="section-title !mb-0 text-orange-600 dark:text-orange-400">Blockers & Risks</label>
                <label className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400 font-bold cursor-pointer bg-orange-500/10 px-3 py-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={keyBlocker}
                    onChange={(e) => setKeyBlocker(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 bg-transparent border-orange-300"
                  />
                  <span>Flag as Critical</span>
                </label>
              </div>
              <textarea
                rows={4}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                className="input-field resize-none"
                placeholder="Describe any issues or external dependencies blocking work..."
              />
            </div>
          </div>

          {/* Key Achievements & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-panel border-green-200/50 dark:border-green-500/20">
              <div className="flex justify-between items-center mb-3">
                <label className="section-title !mb-0 text-green-600 dark:text-green-400">Key Achievements</label>
                <label className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 font-bold cursor-pointer bg-green-500/10 px-3 py-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={keyAchievement}
                    onChange={(e) => setKeyAchievement(e.target.checked)}
                    className="rounded text-green-600 focus:ring-green-500 bg-transparent border-green-300"
                  />
                  <span>Flag as Highlight</span>
                </label>
              </div>
              <textarea
                rows={4}
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                className="input-field resize-none"
                placeholder="Summarize milestones or wins reached..."
              />
            </div>

            <div className="card-panel">
              <label className="section-title block">Additional Notes</label>
              <textarea
                rows={4}
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