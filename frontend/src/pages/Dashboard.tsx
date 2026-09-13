import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { FileText, CheckCircle, Clock, AlertTriangle, Edit3, Eye } from 'lucide-react';

interface Report {
  _id: string;
  userId: { _id: string; name: string; email: string };
  projectId: { _id: string; name: string };
  weekStart: string;
  weekEnd: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [reviewModal, setReviewModal] = useState<{ open: boolean; reportId: string | null }>({
    open: false,
    reportId: null,
  });
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REQUEST_CORRECTION'>('APPROVED');
  const [reviewComment, setReviewComment] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/reports?status=${statusFilter}` : '/reports';
      const res = await api.get(url);
      setReports(res.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleReviewSubmit = async () => {
    if (!reviewModal.reportId) return;
    try {
      await api.post(`/reports/${reviewModal.reportId}/review`, {
        action: reviewAction,
        comment: reviewComment,
      });
      setReviewModal({ open: false, reportId: null });
      setReviewComment('');
      fetchReports();
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Approved</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Submitted</span>;
      case 'NEEDS_CORRECTION':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Needs Correction</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Draft</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <h3 className="text-2xl font-bold text-gray-900">{reports.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {reports.filter((r) => r.status === 'APPROVED').length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {reports.filter((r) => r.status === 'SUBMITTED').length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Needs Correction</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {reports.filter((r) => r.status === 'NEEDS_CORRECTION').length}
              </h3>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-700">Filter Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="NEEDS_CORRECTION">Needs Correction</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          <Link
            to="/reports/new"
            className="w-full md:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + New Report
          </Link>
        </div>

        {/* Report List Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No reports found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Member</th>
                    <th className="py-3 px-6">Project</th>
                    <th className="py-3 px-6">Week Duration</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {report.userId?.name || 'Unknown'}
                      </td>
                      <td className="py-4 px-6">{report.projectId?.name || 'N/A'}</td>
                      <td className="py-4 px-6">
                        {new Date(report.weekStart).toLocaleDateString()} -{' '}
                        {new Date(report.weekEnd).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(report.status)}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {/* Manager Review Action */}
                        {user?.role !== 'TEAM_MEMBER' && report.status === 'SUBMITTED' && (
                          <button
                            onClick={() => setReviewModal({ open: true, reportId: report._id })}
                            className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold"
                          >
                            Review
                          </button>
                        )}

                        {/* Edit Action for Member */}
                        {(report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION') &&
                          report.userId?._id === user?.id && (
                            <Link
                              to={`/reports/${report._id}/edit`}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Link>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Manager Report Review</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
              <select
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              >
                <option value="APPROVED">Approve Report</option>
                <option value="REQUEST_CORRECTION">Request Correction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Notes</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder="Provide feedback for team member..."
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setReviewModal({ open: false, reportId: null })}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};