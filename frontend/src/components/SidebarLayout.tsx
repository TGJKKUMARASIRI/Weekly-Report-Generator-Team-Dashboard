import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, PlusCircle, LogOut, FileText, Menu, X, Sun, Moon, List, Folder, Users, Columns3 } from 'lucide-react';
import { AIChatWidget } from './AIChatWidget';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Report List', path: '/reports', icon: List, exact: true },
    ...(user?.role === 'TEAM_MEMBER'
      ? [{ name: 'New Report', path: '/reports/new', icon: PlusCircle }]
      : []),
    ...(user?.role === 'MANAGER' ? [{ name: 'Projects', path: '/projects', icon: Folder }] : []),
    ...(user?.role === 'MANAGER'
      ? [{ name: 'Users', path: '/users', icon: Users }]
      : []),
    ...(user?.role === 'MANAGER'
      ? [{ name: 'Weekly Summary', path: '/CrossTeamWeeklySummary', icon: Columns3 }]
      : []),
  ];

  return (
    <div className="min-h-screen flex w-full relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-4 h-[calc(100vh-2rem)] w-72 glass shadow-2xl z-50 rounded-3xl m-4 md:ml-4 md:my-4 flex flex-col border border-white/40 dark:border-white/10 transform transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'
          }`}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between p-8 h-24 border-b border-gray-200/50 dark:border-white/10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
          <Link to="/" className="flex items-center space-x-3 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm z-10">
            <FileText className="w-8 h-8 text-blue-600 dark:text-purple-400" />
            <span>ReportPulse</span>
          </Link>
          <button className="md:hidden btn-icon z-10" onClick={() => setIsMobileOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if active. If exact is true, match exactly. Otherwise, match prefix.
            const isActive = item.exact
              ? location.pathname === item.path
              : (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-purple-500 shadow-[0_0_10px_rgba(37,99,235,0.8)] dark:shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-gray-200/50 dark:border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 to-transparent pointer-events-none" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all font-bold group relative z-10"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle background effects */}
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/20 dark:bg-purple-600/20 blur-[150px] pointer-events-none -z-10 animate-pulse" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 dark:bg-blue-600/20 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Top Header */}
        <header className="h-20 glass-panel sticky top-4 z-30 mx-4 mt-4 px-8 flex items-center justify-between border border-white/40 dark:border-white/10 shadow-sm rounded-3xl">
          <div className="flex items-center">
            <button
              className="md:hidden mr-4 btn-icon"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block tracking-wide">
              {navItems.find(item => item.exact ? location.pathname === item.path : (item.path !== '/' && location.pathname.startsWith(item.path)))?.name
                || (location.pathname === '/' ? 'Dashboard' : 'Report Details')}
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={toggleTheme}
              className="btn-icon rounded-full hover:scale-110 transition-transform"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(107,33,168,0.4)]">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{user?.name}</p>
                <span className="text-xs font-bold text-blue-600 dark:text-purple-400 tracking-wider uppercase">
                  {user?.role === 'MANAGER' ? 'Manager' : 'Team Member'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* Floating AI Chat Assistant (Rendered only for Managers / Admins) */}
      {(user?.role === 'MANAGER') && <AIChatWidget />}
    </div>
  );
};