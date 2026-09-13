import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, FileText, LayoutDashboard, PlusCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600">
              <FileText className="w-6 h-6" />
              <span>ReportPulse</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/reports/new"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Report</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};