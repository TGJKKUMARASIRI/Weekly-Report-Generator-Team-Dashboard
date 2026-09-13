import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setReports(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'APPROVED': return <span className="badge badge-success">Approved</span>;
      case 'SUBMITTED': return <span className="badge badge-info">Submitted</span>;
      case 'NEEDS_CORRECTION': return <span className="badge badge-warning">Needs Correction</span>;
      default: return <span className="badge badge-default">Draft</span>;
    }
  };

  const recentReports = reports.slice(0, 5); // Show only top 5 recent

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center space-x-4 transition-transform hover:-translate-y-1">
          <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{reports.length}</h3>
          </div>
        </div>

        <div className="card p-6 flex items-center space-x-4 transition-transform hover:-translate-y-1">
          <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">
              {reports.filter((r) => r.status === 'APPROVED').length}
            </h3>
          </div>
        </div>

        <div className="card p-6 flex items-center space-x-4 transition-transform hover:-translate-y-1">
          <div className="p-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">
              {reports.filter((r) => r.status === 'SUBMITTED').length}
            </h3>
          </div>
        </div>

        <div className="card p-6 flex items-center space-x-4 transition-transform hover:-translate-y-1 border-orange-500/30">
          <div className="p-4 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Needs Fix</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">
              {reports.filter((r) => r.status === 'NEEDS_CORRECTION').length}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="section-title !mb-0">Recent Reports</h2>
        {user?.role === 'TEAM_MEMBER' && (
          <Link to="/reports/new" className="btn-primary">
            + New Report
          </Link>
        )}
      </div>

      {/* Recent Report List Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse font-bold">
            Loading...
          </div>
        ) : recentReports.length === 0 ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                {recentReports.map((report) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reports.length > 5 && (
          <div className="p-4 bg-gray-50/50 dark:bg-black/20 text-center border-t border-gray-200/50 dark:border-white/10">
            <Link to="/reports" className="text-blue-600 dark:text-purple-400 font-bold hover:underline">
              View All Reports
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};