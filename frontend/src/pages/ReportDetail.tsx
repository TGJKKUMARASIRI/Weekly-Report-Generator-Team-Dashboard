import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Edit3, CheckCircle, AlertTriangle, ArrowLeft, Trophy } from 'lucide-react';

interface BlockerItem {
  description: string;
  isKeyBlocker: boolean;
}

interface AchievementItem {
  description: string;
  isKeyAchievement: boolean;
}

export const ReportDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [reviewModal, setReviewModal] = useState<{ open: boolean; action: 'APPROVED' | 'REQUEST_CORRECTION' | null }>({
    open: false,
    action: null,
  });
  const [reviewComment, setReviewComment] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${id}`);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  const handleReviewSubmit = async () => {
    if (!reviewModal.action) return;
    try {
      await api.post(`/reports/${id}/review`, {
        action: reviewModal.action,
        comment: reviewComment,
      });
      setReviewModal({ open: false, action: null });
      setReviewComment('');
      fetchReport();
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="badge badge-success">Approved</span>;
      case 'SUBMITTED': return <span className="badge badge-info">Submitted</span>;
      case 'NEEDS_CORRECTION': return <span className="badge badge-warning">Needs Correction</span>;
      default: return <span className="badge badge-default">Draft</span>;
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading report details...</div>;
  }

  if (!report) {
    return <div className="p-12 text-center text-red-500 font-bold">Failed to load report.</div>;
  }

  const isOwner = user?.id === (report.userId?._id || report.userId);
  const isManager = user?.role === 'MANAGER';
  const canEdit = isOwner && (report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION');
  const canReview = isManager && report.status === 'SUBMITTED';

  // Normalize array/string formats for Blockers
  const normalizedBlockers: BlockerItem[] = Array.isArray(report.blockers)
    ? report.blockers
    : typeof report.blockers === 'string' && report.blockers.trim()
      ? [{ description: report.blockers, isKeyBlocker: report.keyBlocker || false }]
      : [];

  // Normalize array/string formats for Achievements
  const normalizedAchievements: AchievementItem[] = Array.isArray(report.achievements)
    ? report.achievements
    : typeof report.achievements === 'string' && report.achievements.trim()
      ? [{ description: report.achievements, isKeyAchievement: report.keyAchievement || false }]
      : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 relative">

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 dark:hover:text-purple-400 font-bold text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="page-title !mb-2">Weekly Report</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {new Date(report.weekStart).toLocaleDateString()} to {new Date(report.weekEnd).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-lg">
            {getStatusBadge(report.status)}
          </div>

          {canEdit && (
            <button
              onClick={() => navigate(`/reports/${id}/edit`)}
              className="btn-primary"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Report</span>
            </button>
          )}

          {canReview && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setReviewModal({ open: true, action: 'REQUEST_CORRECTION' })}
                className="btn-danger"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Request Correction</span>
              </button>
              <button
                onClick={() => setReviewModal({ open: true, action: 'APPROVED' })}
                className="btn-primary !bg-gradient-to-r !from-green-600 !to-emerald-600 !shadow-green-500/30"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="label-text">Team Member</span>
          <p className="font-bold text-lg">{report.userId?.name || 'Unknown'}</p>
        </div>
        <div>
          <span className="label-text">Project</span>
          <p className="font-bold text-lg">{report.projectId?.name || 'Unknown'}</p>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-200/50 dark:border-white/10">
          <h2 className="section-title !mb-0">Tasks Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">Task Name</th>
                <th className="table-header">Status</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Deliverable / Output</th>
                <th className="table-header">Progress (Actual / Planned)</th>
                <th className="table-header">Hours (Spent / Planned)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
              {report.tasks?.map((task: any, idx: number) => (
                <tr key={idx} className="table-row cursor-default">
                  <td className="table-cell font-bold">{task.taskName}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${task.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                      {task.status || 'In Progress'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs text-gray-600 dark:text-gray-400 break-words max-w-xs block">
                      {task.deliverable || '—'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.actualPercent}%` }} />
                      </div>
                      <span className="text-xs font-bold">{task.actualPercent}% / {task.plannedPercent}%</span>
                    </div>
                  </td>
                  <td className="table-cell font-bold">
                    {task.spentHours}h / {task.plannedHours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Allocation & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="section-title">Hours Allocation</h2>
          <div className="space-y-4 mt-6">
            {Object.entries(report.hoursWorked || {}).map(([category, hours]) => (
              <div key={category} className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2">
                <span className="capitalize font-bold text-gray-600 dark:text-gray-400">{category}</span>
                <span className="font-black">{Number(hours)}h</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {/* Blockers & Risks Section */}
          <div className="card p-6 border-l-4 border-orange-500">
            <h2 className="section-title text-orange-600 dark:text-orange-400 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Blockers & Risks</span>
            </h2>

            {normalizedBlockers.length === 0 ? (
              <p className="mt-3 text-gray-500 dark:text-gray-400 italic">None reported.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {normalizedBlockers.map((item, idx) => (
                  <li
                    key={idx}
                    className={`p-3 rounded-lg flex items-start justify-between gap-3 transition-colors ${item.isKeyBlocker
                      ? 'bg-orange-500/10 border border-orange-500/30 text-orange-950 dark:text-orange-200 font-semibold'
                      : 'bg-gray-500/5 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap break-words">{item.description}</p>
                    </div>
                    {item.isKeyBlocker && (
                      <span className="badge badge-warning flex-shrink-0 text-xs">Critical Blocker</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Key Achievements Section */}
          <div className="card p-6 border-l-4 border-green-500">
            <h2 className="section-title text-green-600 dark:text-green-400 flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Key Achievements</span>
            </h2>

            {normalizedAchievements.length === 0 ? (
              <p className="mt-3 text-gray-500 dark:text-gray-400 italic">None reported.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {normalizedAchievements.map((item, idx) => (
                  <li
                    key={idx}
                    className={`p-3 rounded-lg flex items-start justify-between gap-3 transition-colors ${item.isKeyAchievement
                      ? 'bg-green-500/10 border border-green-500/30 text-green-950 dark:text-green-200 font-semibold'
                      : 'bg-gray-500/5 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap break-words">{item.description}</p>
                    </div>
                    {item.isKeyAchievement && (
                      <span className="badge badge-success flex-shrink-0 text-xs">Highlight</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="section-title">Planned for Next Week</h2>
        <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.nextWeekTasks || 'None reported.'}</p>
      </div>

      {report.notes && (
        <div className="card p-6">
          <h2 className="section-title">Additional Notes</h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.notes}</p>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-panel max-w-md w-full p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {reviewModal.action === 'APPROVED' ? 'Approve Report' : 'Request Correction'}
            </h3>

            <div>
              <label className="label-text">Feedback / Notes (Required for correction)</label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="input-field resize-none"
                placeholder="Provide constructive feedback for the team member..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setReviewModal({ open: false, action: null })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                className={reviewModal.action === 'APPROVED' ? 'btn-primary !bg-gradient-to-r !from-green-600 !to-emerald-600' : 'btn-danger'}
              >
                Confirm {reviewModal.action === 'APPROVED' ? 'Approval' : 'Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};