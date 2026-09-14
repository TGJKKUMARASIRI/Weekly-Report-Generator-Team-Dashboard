import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { dashboardService, type ManagerDashboardData } from '../../services/dashboardService';
import Swal from 'sweetalert2';

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const stats = await dashboardService.getManagerDashboardStats();
        setData(stats);
      } catch (err: unknown) {
        console.error('Failed to load manager dashboard', err);
        const errorMessage =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to retrieve manager analytics.';

        Swal.fire({
          icon: 'error',
          title: 'Error Loading Dashboard',
          text: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse font-bold text-lg">
        Loading Manager Insights & Analytics...
      </div>
    );
  }

  if (!data) return null;

  const { summary, charts, activityFeed } = data;
  const totalExpectedReports =
    summary.submissionCompliance.submitted +
    summary.submissionCompliance.pending +
    summary.submissionCompliance.late;

  return (
    <div className="space-y-8">
      {/* 1. TOP SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Submitted This Week */}
        <div className="card p-6 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10">
          <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Submitted This Week
            </p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">
              {summary.totalSubmittedThisWeek}
            </h3>
          </div>
        </div>

        {/* Submission Compliance Rate */}
        <div className="card p-6 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Compliance Rate
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                {summary.submissionCompliance.complianceRatePercentage}%
              </h3>
              <span className="text-xs text-gray-500">
                ({summary.submissionCompliance.submitted}/{totalExpectedReports})
              </span>
            </div>
          </div>
        </div>

        {/* Needs Correction Count */}
        <div className="card p-6 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10">
          <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Needs Correction
            </p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">
              {summary.needsCorrectionCount}
            </h3>
          </div>
        </div>

        {/* Open Blockers */}
        <div className="card p-6 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10">
          <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Open Blockers
            </p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">
              {summary.openBlockersCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. VISUAL INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart A: Tasks Completed Trend Over Time */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Tasks Completed Trend
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.tasksCompletedTrend || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="completedTasks"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Report Status by Team Member */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Report Status by Team Member
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.statusByMember || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="memberName" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="APPROVED" stackId="a" fill="#10B981" name="Approved" />
                <Bar dataKey="SUBMITTED" stackId="a" fill="#3B82F6" name="Submitted" />
                <Bar dataKey="NEEDS_CORRECTION" stackId="a" fill="#F59E0B" name="Needs Fix" />
                <Bar dataKey="DRAFT" stackId="a" fill="#9CA3AF" name="Draft" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Workload Distribution by Project */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Workload Distribution by Project (Hours)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.workloadByProject || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" stroke="#888888" fontSize={12} />
                <YAxis
                  dataKey="projectName"
                  type="category"
                  stroke="#888888"
                  fontSize={12}
                  width={110}
                />
                <Tooltip />
                <Bar dataKey="totalHours" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart D: Time Spent by Task Type */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Time Allocation by Task Type
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.timeSpentByTaskType || []}
                  dataKey="hours"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ type, name, percent }: { type?: string; name?: string; percent?: number }) =>
                    `${type || name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                >
                  {(charts.timeSpentByTaskType || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} hrs`, 'Time Spent']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. RECENT REVIEW ACTIONS & ACTIVITY FEED */}
      <div className="card p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          <Activity className="text-indigo-600 dark:text-indigo-400" size={20} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Recent Review Activity & Audits
          </h3>
        </div>

        {!activityFeed || activityFeed.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No recent review actions logged.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activityFeed.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/reports/${item.reportId}`)}
                className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.memberName}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {item.projectName}
                    </span>
                  </div>
                  {item.comment && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      "{item.comment}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      item.action === 'APPROVED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : item.action === 'NEEDS_CORRECTION'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {item.action.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};