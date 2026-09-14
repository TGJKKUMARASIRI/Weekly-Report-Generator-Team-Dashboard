import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { ReportList } from './ReportList'; // Make sure the import path matches your project structure
import { ArrowLeft, User, Mail, Shield, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'TEAM_MEMBER' | 'MANAGER';
  createdAt?: string;
}

export const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Fetches all users and finds the target user by ID from the URL param
        const users: UserProfile[] = await authService.getUsers();
        const foundUser = users.find((u) => u._id === id);

        if (foundUser) {
          setUser(foundUser);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'User Not Found',
            text: 'The requested user could not be found.',
          });
          navigate('/users');
        }
      } catch (err) {
        console.error('Failed to fetch user details', err);
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Profile',
          text: 'Failed to retrieve user information. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'MANAGER':
        return <span className="badge badge-info">Manager</span>;
      default:
        return <span className="badge badge-default">Team Member</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse font-bold">
        Loading user profile...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/users')}
        className="btn-secondary !py-2 flex items-center gap-2 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      {/* Profile Card */}
      <div className="card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <div>{getRoleBadge(user.role)}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email Address</p>
              <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <Shield size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">System Role</p>
              <p className="font-semibold text-gray-900 dark:text-white">{user.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="text-xs text-gray-500">Account Status</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Report History for this User */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report History</h2>
        <ReportList userId={user._id} />
      </div>
    </div>
  );
};