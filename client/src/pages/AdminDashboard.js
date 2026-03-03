import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  HeartIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [emergencyStats, emergenciesRes, usersRes] = await Promise.all([
        axios.get('/api/emergency/stats/overview'),
        axios.get('/api/emergency?limit=5'),
        axios.get('/api/users?limit=5')
      ]);
      
      setStats({
        ...emergencyStats.data,
        totalUsers: usersRes.data.pagination.total
      });
      
      setEmergencies(emergenciesRes.data.emergencies);
      
      // Combine recent activity
      setRecentActivity([
        ...emergenciesRes.data.emergencies.map(emergency => ({
          type: 'emergency',
          title: `Emergency: ${emergency.emergencyType.replace('_', ' ')}`,
          description: `${emergency.severity} priority - ${emergency.patient.firstName} ${emergency.patient.lastName}`,
          date: emergency.createdAt,
          status: emergency.status,
          id: emergency._id
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      dispatched: 'text-blue-600 bg-blue-100',
      en_route: 'text-purple-600 bg-purple-100',
      on_scene: 'text-orange-600 bg-orange-100',
      transporting: 'text-indigo-600 bg-indigo-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };

  const formatEmergencyType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-primary-100">
          Monitor system activity, manage users, and oversee emergency responses
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Emergencies</p>
              <p className="text-3xl font-bold text-emergency-600">{stats.activeEmergencies || 0}</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-emergency-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Ambulances</p>
              <p className="text-3xl font-bold text-blue-600">{stats.availableAmbulances || 0}</p>
            </div>
            <HeartIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalUsers || 0}</p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.stats?.avgResponseTime ? `${Math.round(stats.stats.avgResponseTime)}m` : 'N/A'}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Emergency Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Emergencies */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Emergencies</h2>
            <span className="badge badge-danger">{emergencies.filter(e => e.status !== 'completed' && e.status !== 'cancelled').length} Active</span>
          </div>
          
          {emergencies.length > 0 ? (
            <div className="space-y-3">
              {emergencies.slice(0, 5).map((emergency) => (
                <div key={emergency._id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {formatEmergencyType(emergency.emergencyType)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Patient: {emergency.patient.firstName} {emergency.patient.lastName}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`badge capitalize ${getSeverityColor(emergency.severity)}`}>
                        {emergency.severity}
                      </span>
                      <span className={`badge capitalize ${getStatusColor(emergency.status)}`}>
                        {emergency.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>Location: {emergency.location.address}</p>
                    <p>Time: {new Date(emergency.createdAt).toLocaleString()}</p>
                    {emergency.responseTime && (
                      <p>Response Time: {emergency.responseTime} minutes</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No active emergencies</p>
            </div>
          )}
        </div>

        {/* System Statistics */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Total Emergencies (30 days)</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {stats.stats?.totalEmergencies || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Average Response Time</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {stats.stats?.avgResponseTime ? `${Math.round(stats.stats.avgResponseTime)} min` : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Completed Emergencies</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {emergencies.filter(e => e.status === 'completed').length}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <XCircleIcon className="w-5 h-5 text-red-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Cancelled Emergencies</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {emergencies.filter(e => e.status === 'cancelled').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </button>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getStatusColor(activity.status)} capitalize`}>
                  {activity.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <UserGroupIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600">View and manage user accounts</p>
          </div>
        </div>
        
        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <HeartIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Manage Doctors</h3>
            <p className="text-sm text-gray-600">Verify and manage doctor profiles</p>
          </div>
        </div>
        
        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center">
            <ChartBarIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">View Reports</h3>
            <p className="text-sm text-gray-600">Generate system reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;