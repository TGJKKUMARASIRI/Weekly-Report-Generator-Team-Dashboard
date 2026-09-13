import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Navbar } from '../components/Navbar';
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
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {id ? 'Edit Weekly Report' : 'Create Weekly Report'}
          </h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Project & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Week Start</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Week End</label>
                <input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            {/* Task Breakdown */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Tasks Breakdown</h2>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="flex items-center space-x-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>

              <div className="space-y-4">
                {tasks.map((task, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 uppercase">Task Name</label>
                        <input
                          type="text"
                          placeholder="Task title or narrative description..."
                          value={task.taskName}
                          onChange={(e) => handleTaskChange(idx, 'taskName', e.target.value)}
                          className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white"
                        />
                      </div>
                      {tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(idx)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase">Priority</label>
                        <select
                          value={task.priority}
                          onChange={(e) => handleTaskChange(idx, 'priority', e.target.value)}
                          className="mt-1 w-full border border-gray-300 rounded-md p-1.5 bg-white text-sm"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase">Planned %</label>
                        <input
                          type="number"
                          value={task.plannedPercent}
                          onChange={(e) => handleTaskChange(idx, 'plannedPercent', Number(e.target.value))}
                          className="mt-1 w-full border border-gray-300 rounded-md p-1.5 bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase">Actual %</label>
                        <input
                          type="number"
                          value={task.actualPercent}
                          onChange={(e) => handleTaskChange(idx, 'actualPercent', Number(e.target.value))}
                          className="mt-1 w-full border border-gray-300 rounded-md p-1.5 bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase">Planned Hours</label>
                        <input
                          type="number"
                          value={task.plannedHours}
                          onChange={(e) => handleTaskChange(idx, 'plannedHours', Number(e.target.value))}
                          className="mt-1 w-full border border-gray-300 rounded-md p-1.5 bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase">Spent Hours</label>
                        <input
                          type="number"
                          value={task.spentHours}
                          onChange={(e) => handleTaskChange(idx, 'spentHours', Number(e.target.value))}
                          className="mt-1 w-full border border-gray-300 rounded-md p-1.5 bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hours Allocation */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Hours Allocation</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Development</label>
                  <input
                    type="number"
                    value={hoursWorked.development}
                    onChange={(e) => setHoursWorked({ ...hoursWorked, development: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Testing</label>
                  <input
                    type="number"
                    value={hoursWorked.testing}
                    onChange={(e) => setHoursWorked({ ...hoursWorked, testing: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meetings</label>
                  <input
                    type="number"
                    value={hoursWorked.meetings}
                    onChange={(e) => setHoursWorked({ ...hoursWorked, meetings: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Documentation</label>
                  <input
                    type="number"
                    value={hoursWorked.documentation}
                    onChange={(e) => setHoursWorked({ ...hoursWorked, documentation: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Next Week & Blockers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Tasks for Next Week</label>
                <textarea
                  rows={3}
                  value={nextWeekTasks}
                  onChange={(e) => setNextWeekTasks(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Outline key objectives for next week..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Blockers & Risks</label>
                  <label className="flex items-center space-x-2 text-xs text-red-600 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keyBlocker}
                      onChange={(e) => setKeyBlocker(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>Flag as Critical Blocker</span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe any issues or external dependencies blocking work..."
                />
              </div>
            </div>

            {/* Key Achievements & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Key Achievements</label>
                  <label className="flex items-center space-x-2 text-xs text-green-600 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keyAchievement}
                      onChange={(e) => setKeyAchievement(e.target.checked)}
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span>Flag as Highlight Achievement</span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Summarize milestones or wins reached..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any extra comments or explanations..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(false)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(true)}
                className="flex items-center space-x-2 px-5 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};