import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface Report {
  _id: string;
  userId: { _id: string; name: string; email: string };
  projectId: { _id: string; name: string };
  weekStart: string;
  weekEnd: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
  createdAt: string;
}

export const ReportList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
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
    fetchReports();
  }, [statusFilter]);

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success">Approved</span>;
      case 'SUBMITTED':
        return <span className="badge badge-info">Submitted</span>;
      case 'NEEDS_CORRECTION':
        return <span className="badge badge-warning">Needs Correction</span>;
      default:
        return <span className="badge badge-default">Draft</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="page-title !mb-0">All Reports</h1>
        
        <div className="card px-4 py-2 flex items-center space-x-3 w-full md:w-auto">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field !p-2 !bg-transparent border-none shadow-none focus:ring-0 w-auto"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse font-bold">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-bold">
            No reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Member</th>
                  <th className="table-header">Project</th>
                  <th className="table-header">Week Duration</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                {reports.map((report) => (
                  <tr 
                    key={report._id} 
                    className="table-row"
                    onClick={() => navigate(`/reports/${report._id}`)}
                  >
                    <td className="table-cell font-bold text-gray-900 dark:text-white">
                      {report.userId?.name || 'Unknown'}
                    </td>
                    <td className="table-cell font-bold">
                      {report.projectId?.name || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {new Date(report.weekStart).toLocaleDateString()} -{' '}
                      {new Date(report.weekEnd).toLocaleDateString()}
                    </td>
                    <td className="table-cell">{getStatusBadge(report.status)}</td>
                    <td className="table-cell text-xs font-semibold text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
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
