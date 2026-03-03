import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  HomeIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ChartBarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isPatient, isDoctor, isAdmin, isEmergencyResponder } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Profile', href: '/profile', icon: UserIcon },
    ];

    if (isPatient) {
      return [
        ...baseItems,
        { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
        { name: 'Book Appointment', href: '/book-appointment', icon: CalendarIcon },
        { name: 'Emergency', href: '/emergency', icon: ExclamationTriangleIcon, emergency: true },
        { name: 'Find Doctors', href: '/doctors', icon: UserGroupIcon },
      ];
    }

    if (isDoctor) {
      return [
        ...baseItems,
        { name: 'My Appointments', href: '/appointments', icon: CalendarIcon },
        { name: 'My Patients', href: '/patients', icon: UserGroupIcon },
        { name: 'Schedule', href: '/schedule', icon: CalendarIcon },
      ];
    }

    if (isAdmin) {
      return [
        ...baseItems,
        { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
        { name: 'Doctors', href: '/admin/doctors', icon: HeartIcon },
        { name: 'Emergencies', href: '/admin/emergencies', icon: ExclamationTriangleIcon },
        { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
        { name: 'Admin Panel', href: '/admin', icon: Cog6ToothIcon },
      ];
    }

    if (isEmergencyResponder) {
      return [
        ...baseItems,
        { name: 'Active Emergencies', href: '/emergencies', icon: ExclamationTriangleIcon },
        { name: 'Ambulances', href: '/ambulances', icon: ExclamationTriangleIcon },
        { name: 'Response History', href: '/response-history', icon: ChartBarIcon },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">HealthCare</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isCurrentPath(item.href)
                    ? 'bg-primary-100 text-primary-700'
                    : item.emergency
                    ? 'text-emergency-600 hover:bg-emergency-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${item.emergency ? 'text-emergency-600' : ''}`} />
                {item.name}
                {item.emergency && (
                  <span className="ml-auto">
                    <span className="status-emergency"></span>
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">HealthCare</h1>
            <div className="ml-auto flex items-center">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success-500' : 'bg-gray-400'}`}></div>
              <span className="ml-2 text-xs text-gray-500">
                {connected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isCurrentPath(item.href)
                    ? 'bg-primary-100 text-primary-700'
                    : item.emergency
                    ? 'text-emergency-600 hover:bg-emergency-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${item.emergency ? 'text-emergency-600' : ''}`} />
                {item.name}
                {item.emergency && (
                  <span className="ml-auto">
                    <span className="status-emergency"></span>
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigationItems.find(item => isCurrentPath(item.href))?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              {/* Connection status */}
              <div className="flex items-center gap-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* User avatar */}
              <div className="flex items-center gap-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;