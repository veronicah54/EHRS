import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Appointments = () => {
  const { user, isPatient, isDoctor } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const endpoint = isDoctor ? '/api/doctors/appointments/my' : '/api/appointments/my-appointments';
      const response = await axios.get(`${endpoint}?${params}`);
      
      setAppointments(response.data.appointments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}/status`, {
        status: newStatus
      });
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.patch(`/api/appointments/${appointmentId}/cancel`, {
          reason: 'Cancelled by user'
        });
        fetchAppointments(); // Refresh the list
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'text-blue-600 bg-blue-100',
      confirmed: 'text-green-600 bg-green-100',
      in_progress: 'text-purple-600 bg-purple-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
      no_show: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: ClockIcon,
      confirmed: CheckCircleIcon,
      in_progress: ExclamationCircleIcon,
      completed: CheckCircleIcon,
      cancelled: XCircleIcon,
      no_show: XCircleIcon
    };
    const Icon = icons[status] || ClockIcon;
    return <Icon className="w-4 h-4" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const canCancelAppointment = (appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const hoursUntil = (appointmentDate - now) / (1000 * 60 * 60);
    
    return hoursUntil >= 24 && ['scheduled', 'confirmed'].includes(appointment.status);
  };

  const filterOptions = [
    { value: 'all', label: 'All Appointments' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isPatient ? 'My Appointments' : 'Patient Appointments'}
          </h1>
          <p className="text-gray-600">
            {isPatient 
              ? 'Manage your upcoming and past appointments'
              : 'View and manage your patient appointments'
            }
          </p>
        </div>
        {isPatient && (
          <Link
            to="/book-appointment"
            className="btn-primary mt-4 sm:mt-0"
          >
            Book New Appointment
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isPatient 
                            ? `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`
                            : `${appointment.patient.firstName} ${appointment.patient.lastName}`
                          }
                        </h3>
                        <span className={`badge ml-3 ${getStatusColor(appointment.status)} capitalize`}>
                          <span className="flex items-center">
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{appointment.status.replace('_', ' ')}</span>
                          </span>
                        </span>
                        <span className={`badge ml-2 ${getPriorityColor(appointment.priority)} capitalize`}>
                          {appointment.priority}
                        </span>
                      </div>
                      
                      {isPatient && (
                        <p className="text-gray-600 mb-2">
                          Specialization: {appointment.doctor.specialization}
                        </p>
                      )}
                      
                      <p className="text-gray-700 mb-3">{appointment.reason}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-500">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <span className="text-green-600 font-medium">
                            KES {appointment.payment.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {appointment.symptoms && appointment.symptoms.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            <strong>Symptoms:</strong> {appointment.symptoms.join(', ')}
                          </p>
                        </div>
                      )}

                      {appointment.notes && appointment.notes.doctorNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Doctor's Notes:</strong> {appointment.notes.doctorNotes}
                          </p>
                        </div>
                      )}

                      {appointment.notes && appointment.notes.prescriptions && appointment.notes.prescriptions.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800 font-medium mb-2">Prescriptions:</p>
                          {appointment.notes.prescriptions.map((prescription, index) => (
                            <div key={index} className="text-sm text-green-700">
                              <strong>{prescription.medication}</strong> - {prescription.dosage} ({prescription.frequency})
                              {prescription.instructions && (
                                <p className="text-xs text-green-600 mt-1">{prescription.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
                  {isDoctor && appointment.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                      className="btn-success text-sm"
                    >
                      Confirm
                    </button>
                  )}
                  
                  {isDoctor && appointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment._id, 'in_progress')}
                      className="btn-primary text-sm"
                    >
                      Start
                    </button>
                  )}
                  
                  {isDoctor && appointment.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                      className="btn-success text-sm"
                    >
                      Complete
                    </button>
                  )}

                  {isPatient && canCancelAppointment(appointment) && (
                    <button
                      onClick={() => handleCancelAppointment(appointment._id)}
                      className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  )}

                  <Link
                    to={`/appointments/${appointment._id}`}
                    className="btn-secondary text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? isPatient 
                ? "You haven't booked any appointments yet."
                : "No patient appointments found."
              : `No ${filter} appointments found.`
            }
          </p>
          {isPatient && (
            <Link
              to="/book-appointment"
              className="btn-primary"
            >
              Book Your First Appointment
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {appointments.length} of {pagination.total} appointments
          </p>
          <div className="flex space-x-2">
            {/* Add pagination controls here if needed */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;