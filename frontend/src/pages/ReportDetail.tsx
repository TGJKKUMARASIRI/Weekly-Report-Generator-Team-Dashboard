import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Edit3, CheckCircle, AlertTriangle, ArrowLeft, Trophy, History } from 'lucide-react';

interface BlockerItem {
  description: string;
  isKeyBlocker: boolean;
}

interface AchievementItem {
  description: string;
  isKeyAchievement: boolean;
}

interface User {
  _id: string; // or mongoose.Types.ObjectId
  name: string;
  email: string;
  role: 'TEAM_MEMBER' | 'MANAGER' | 'ADMIN';
}

interface ReportVersion {
  versionNumber: number;
  snapshot: any;
  submittedAt: string;
}

interface ReportReview {
  action: 'APPROVED' | 'REQUEST_CORRECTION';
  comment?: string;
  versionNumber?: number;
  createdAt: string;
}

const formatDateTime = (date: string) => new Date(date).toLocaleString();

const VersionSummary: React.FC<{ report: any; title: string; submittedAt?: string }> = ({ report, title, submittedAt }) => (
  <div className="card-panel h-full space-y-4">
    <div className="flex items-start justify-between gap-4 border-b border-gray-200/50 dark:border-white/10 pb-3">
      <div>
        <h3 className="font-black text-gray-900 dark:text-white">{title}</h3>
        {submittedAt && (
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
            Submitted {formatDateTime(submittedAt)}
          </p>
        )}
      </div>
      {report?.status && <span>{report.status === 'SUBMITTED' ? 'Submitted' : report.status}</span>}
    </div>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <span className="label-text">Tasks</span>
        <p className="font-black">{report?.tasks?.length || 0}</p>
      </div>
      <div>
        <span className="label-text">Hours</span>
        <p className="font-black">
          {Object.values(report?.hoursWorked || {}).reduce((total: number, hours) => total + Number(hours), 0)}h
        </p>
      </div>
    </div>
    <div>
      <span className="label-text">Task Summary</span>
      {report?.tasks?.length ? (
        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {report.tasks.slice(0, 4).map((task: any, index: number) => (
            <li key={index} className="truncate">{task.taskName || 'Untitled task'}</li>
          ))}
          {report.tasks.length > 4 && <li className="text-xs font-semibold text-gray-500">+{report.tasks.length - 4} more tasks</li>}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No tasks recorded.</p>
      )}
    </div>
    <div>
      <span className="label-text">Blockers & Achievements</span>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {report?.blockers?.length || 0} blocker(s), {report?.achievements?.length || 0} achievement(s)
      </p>
    </div>
    <div>
      <span className="label-text">Planned Next Week</span>
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
        {report?.nextWeekTasks || 'None recorded.'}
      </p>
    </div>
  </div>
);

export const ReportDetail: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() as { user: User | null };

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);

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
      const versions = res.data.versions || [];
      setSelectedVersionNumber(versions.length > 1 ? versions[versions.length - 2].versionNumber : null);
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

  const isOwner = user?._id === (report.userId?._id || report.userId);
  const isManager = user?.role === 'MANAGER';
  const canEdit = user?.role === 'TEAM_MEMBER'
    && isOwner
    && (report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION');
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

  const versions: ReportVersion[] = report.versions || [];
  const previousVersions = versions.slice(0, -1);
  const selectedVersion = previousVersions.find((version) => version.versionNumber === selectedVersionNumber);
  const reviews: ReportReview[] = report.reviews || [];
  const correctionReviews = reviews.filter((review) => review.action === 'REQUEST_CORRECTION');
  const latestCorrection = correctionReviews[correctionReviews.length - 1];
  const showVersionHistory = versions.length > 1 && (report.status === 'SUBMITTED' || report.status === 'NEEDS_CORRECTION' || report.status === 'APPROVED');

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

      {report.status === 'NEEDS_CORRECTION' && latestCorrection && (
        <div className="card p-6 border-l-4 border-orange-500 bg-orange-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <h2 className="section-title !mb-1 text-orange-700 dark:text-orange-300">Correction requested</h2>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Version {latestCorrection.versionNumber || versions.length || 1} reviewed on {formatDateTime(latestCorrection.createdAt)}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-gray-800 dark:text-gray-100">
                {latestCorrection.comment || 'The manager requested corrections without additional comments.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {showVersionHistory && (
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-white/10 dark:hover:bg-white/20"
        >
          <History className="w-5 h-5 text-blue-600 dark:text-purple-400" />
          <span className="section-title !mb-0">
            {showHistory ? "Hide Report Version History" : "Show Report Version History"}
          </span>
        </button>
      )}

      {showVersionHistory && selectedVersion && showHistory && (
        <section className="space-y-4">
          {/* <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-purple-400" />
            <h2 className="section-title !mb-0">Report Version History</h2>
          </div> */}
          <div className="flex flex-wrap gap-2">
            {previousVersions.map((version) => (
              <button
                key={version.versionNumber}
                type="button"
                onClick={() => setSelectedVersionNumber(version.versionNumber)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedVersionNumber === version.versionNumber
                  ? 'bg-blue-600 text-white dark:bg-purple-600'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20'
                  }`}
              >
                Version {version.versionNumber} · {new Date(version.submittedAt).toLocaleDateString()}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VersionSummary
              report={selectedVersion.snapshot}
              title={`Previous Version ${selectedVersion.versionNumber}`}
              submittedAt={selectedVersion.submittedAt}
            />
            <VersionSummary report={report} title="Current Version Under Review" />
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="font-black text-gray-900 dark:text-white">Review comments by version</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No review comments recorded.</p>
            ) : (
              reviews.map((review, index) => (
                <div key={`${review.createdAt}-${index}`} className="border-l-2 border-gray-300 dark:border-white/20 pl-3">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Version {review.versionNumber || 'legacy'} · {review.action === 'APPROVED' ? 'Approved' : 'Correction requested'} · {formatDateTime(review.createdAt)}
                  </p>
                  {review.comment && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </section>
      )}

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