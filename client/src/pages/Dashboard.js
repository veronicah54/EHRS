import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  CalendarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isPatient, isDoctor, isAdmin, isEmergencyResponder } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isPatient) {
        // Fetch patient dashboard data
        const [appointmentsRes, emergenciesRes] = await Promise.all([
          axios.get('/api/appointments/my-appointments?limit=5'),
          axios.get('/api/emergency/my-emergencies?limit=3')
        ]);
        
        setStats({
          totalAppointments: appointmentsRes.data.pagination.total,
          upcomingAppointments: appointmentsRes.data.appointments.filter(apt => 
            new Date(apt.appointmentDate) > new Date() && apt.status === 'scheduled'
          ).length,
          completedAppointments: appointmentsRes.data.appointments.filter(apt => 
            apt.status === 'completed'
          ).length,
          emergencyRequests: emergenciesRes.data.pagination.total
        });
        
        setRecentActivity([
          ...appointmentsRes.data.appointments.map(apt => ({
            type: 'appointment',
            title: `Appointment with Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
            date: apt.appointmentDate,
            status: apt.status,
            id: apt._id
          })),
          ...emergenciesRes.data.emergencies.map(emergency => ({
            type: 'emergency',
            title: `Emergency: ${emergency.emergencyType.replace('_', ' ')}`,
            date: emergency.createdAt,
            status: emergency.status,
            id: emergency._id
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5));
        
      } else if (isDoctor) {
        // Fetch doctor dashboard data
        const [appointmentsRes, statsRes] = await Promise.all([
          axios.get('/api/doctors/appointments/my?limit=5'),
          axios.get('/api/doctors/stats/my')
        ]);
        
        setStats(statsRes.data.stats);
        setRecentActivity(appointmentsRes.data.appointments.map(apt => ({
          type: 'appointment',
          title: `Appointment with ${apt.patient.firstName} ${apt.patient.lastName}`,
          date: apt.appointmentDate,
          status: apt.status,
          id: apt._id
        })));
        
      } else if (isAdmin || isEmergencyResponder) {
        // Fetch admin/responder dashboard data
        const [emergenciesRes, statsRes] = await Promise.all([
          axios.get('/api/emergency?limit=10'),
          axios.get('/api/emergency/stats/overview')
        ]);
        
        setStats(statsRes.data);
        setRecentActivity(emergenciesRes.data.emergencies.map(emergency => ({
          type: 'emergency',
          title: `Emergency: ${emergency.emergencyType.replace('_', ' ')} - ${emergency.severity}`,
          date: emergency.createdAt,
          status: emergency.status,
          patient: `${emergency.patient.firstName} ${emergency.patient.lastName}`,
          id: emergency._id
        })));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'text-blue-600 bg-blue-100',
      confirmed: 'text-green-600 bg-green-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
      pending: 'text-yellow-600 bg-yellow-100',
      dispatched: 'text-blue-600 bg-blue-100',
      en_route: 'text-purple-600 bg-purple-100',
      on_scene: 'text-orange-600 bg-orange-100',
      transporting: 'text-indigo-600 bg-indigo-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: ClockIcon,
      confirmed: CheckCircleIcon,
      completed: CheckCircleIcon,
      cancelled: XCircleIcon,
      pending: ClockIcon,
      dispatched: ExclamationTriangleIcon,
      en_route: ExclamationTriangleIcon,
      on_scene: HeartIcon,
      transporting: HeartIcon
    };
    const Icon = icons[status] || ClockIcon;
    return <Icon className="w-4 h-4" />;
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-primary-100">
          {isPatient && "Manage your appointments and access emergency services."}
          {isDoctor && "View your appointments and manage patient care."}
          {isAdmin && "Monitor system activity and manage users."}
          {isEmergencyResponder && "Respond to emergencies and coordinate medical assistance."}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isPatient && (
          <>
            <Link
              to="/book-appointment"
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Book</p>
                  <p className="text-lg font-semibold text-gray-900">Appointment</p>
                </div>
              </div>
            </Link>
            
            <Link
              to="/emergency"
              className="card hover:shadow-md transition-shadow cursor-pointer border-emergency-200 hover:border-emergency-300"
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-emergency-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Emergency</p>
                  <p className="text-lg font-semibold text-emergency-600">Help</p>
                </div>
              </div>
            </Link>
            
            <Link
              to="/doctors"
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Find</p>
                  <p className="text-lg font-semibold text-gray-900">Doctors</p>
                </div>
              </div>
            </Link>
            
            <Link
              to="/appointments"
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">My</p>
                  <p className="text-lg font-semibold text-gray-900">Appointments</p>
                </div>
              </div>
            </Link>
          </>
        )}

        {isDoctor && (
          <>
            <Link
              to="/appointments"
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">My</p>
                  <p className="text-lg font-semibold text-gray-900">Appointments</p>
                </div>
              </div>
            </Link>
            
            <div className="card">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-semibold text-gray-900">Patients</p>
                </div>
              </div>
            </div>
          </>
        )}

        {(isAdmin || isEmergencyResponder) && (
          <>
            <div className="card">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-emergency-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-lg font-semibold text-gray-900">Emergencies</p>
                  <p className="text-2xl font-bold text-emergency-600">{stats.activeEmergencies || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <HeartIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-lg font-semibold text-gray-900">Ambulances</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.availableAmbulances || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isPatient && (
          <>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments || 0}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.upcomingAppointments || 0}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedAppointments || 0}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Emergency Requests</p>
                  <p className="text-2xl font-bold text-emergency-600">{stats.emergencyRequests || 0}</p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-emergency-600" />
              </div>
            </div>
          </>
        )}

        {isDoctor && (
          <>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments || 0}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedAppointments || 0}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue (KES)</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue?.toLocaleString() || 0}</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.avgRating?.toFixed(1) || 'N/A'}</p>
                </div>
                <HeartIcon className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link
            to={isPatient ? "/appointments" : isDoctor ? "/appointments" : "/admin"}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    {activity.patient && (
                      <p className="text-xs text-gray-600">Patient: {activity.patient}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()} at{' '}
                      {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    </div>
  );
};

export default Dashboard;