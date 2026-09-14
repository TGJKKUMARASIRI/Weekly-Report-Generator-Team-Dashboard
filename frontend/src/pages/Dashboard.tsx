import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ManagerDashboard } from '../components/dashboard/ManagerDashboard';
import { TeamMemberDashboard } from '../components/dashboard/TeamMemberDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const isManager = user?.role === 'MANAGER';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isManager ? 'Manager Insights & Analytics' : 'My Work Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isManager
              ? 'Overview of team compliance, weekly metrics, and project workload.'
              : 'Track your weekly report status and recent submissions.'}
          </p>
        </div>
      </div>

      {/* Role-based Dashboard View */}
      {isManager ? <ManagerDashboard /> : <TeamMemberDashboard />}
    </div>
  );
};