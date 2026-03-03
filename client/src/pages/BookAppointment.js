import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    timeSlot: {
      startTime: '',
      endTime: ''
    },
    reason: '',
    symptoms: [],
    type: 'consultation',
    priority: 'medium'
  });

  const [filters, setFilters] = useState({
    specialization: '',
    search: ''
  });

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow_up', label: 'Follow-up Visit' },
    { value: 'routine_checkup', label: 'Routine Checkup' },
    { value: 'vaccination', label: 'Vaccination' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const specializations = [
    'General Practice', 'Cardiology', 'Dermatology', 'Emergency Medicine',
    'Endocrinology', 'Gastroenterology', 'Neurology', 'Oncology',
    'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery', 'Urology'
  ];

  useEffect(() => {
    fetchDoctors();
  }, [filters]);

  useEffect(() => {
    if (selectedDoctor && formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, formData.appointmentDate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.search) params.append('search', filters.search);
      params.append('isAcceptingPatients', 'true');
      
      const response = await axios.get(`/api/doctors?${params}`);
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(
        `/api/appointments/doctor/${selectedDoctor._id}/available-slots?date=${formData.appointmentDate}`
      );
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available time slots');
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      doctor: doctor._id
    }));
    setStep(2);
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      appointmentDate: date,
      timeSlot: { startTime: '', endTime: '' }
    }));
  };

  const handleTimeSlotSelect = (startTime) => {
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = startMinute === 30 ? startHour + 1 : startHour;
    const endMinute = startMinute === 30 ? 0 : 30;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    setFormData(prev => ({
      ...prev,
      timeSlot: {
        startTime,
        endTime
      }
    }));
  };

  const handleSymptomAdd = (symptom) => {
    if (symptom.trim() && !formData.symptoms.includes(symptom.trim())) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptom.trim()]
      }));
    }
  };

  const handleSymptomRemove = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.doctor || !formData.appointmentDate || !formData.timeSlot.startTime || !formData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/appointments', formData);
      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Select Doctor</span>
          </div>
          
          <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Choose Date & Time</span>
          </div>
          
          <div className={`flex items-center ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">Appointment Details</span>
          </div>
        </div>
      </div>

      {/* Step 1: Select Doctor */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Doctor</h2>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  value={filters.specialization}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                  className="input"
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Doctor
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="input"
                  placeholder="Search by name or hospital"
                />
              </div>
            </div>

            {/* Doctors List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner w-8 h-8"></div>
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.user.firstName} {doctor.user.lastName}
                        </h3>
                        <p className="text-primary-600 font-medium">{doctor.specialization}</p>
                        <p className="text-sm text-gray-600">{doctor.yearsOfExperience} years experience</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-yellow-500 mb-1">
                          <span className="text-sm font-medium">
                            {doctor.rating.average > 0 ? doctor.rating.average.toFixed(1) : 'New'}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({doctor.rating.count} reviews)
                          </span>
                        </div>
                        <p className="text-lg font-bold text-green-600">
                          KES {doctor.consultationFee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {doctor.hospital && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {doctor.hospital.name}
                      </div>
                    )}
                    
                    {doctor.bio && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doctor.bio}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {doctor.emergencyAvailable && (
                          <span className="badge badge-danger">Emergency Available</span>
                        )}
                        <span className="badge badge-success">Accepting Patients</span>
                      </div>
                      <button className="btn-primary text-sm">
                        Select Doctor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No doctors found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Choose Date & Time */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Choose Date & Time</h2>
              <button
                onClick={() => setStep(1)}
                className="btn-secondary text-sm"
              >
                Change Doctor
              </button>
            </div>
            
            {/* Selected Doctor Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                  </h3>
                  <p className="text-primary-600">{selectedDoctor.specialization}</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  KES {selectedDoctor.consultationFee.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getTomorrowDate()}
                max={getMaxDate()}
                className="input max-w-xs"
              />
            </div>

            {/* Time Slots */}
            {formData.appointmentDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleTimeSlotSelect(slot)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          formData.timeSlot.startTime === slot
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No available slots for this date</p>
                )}
              </div>
            )}

            {formData.timeSlot.startTime && (
              <div className="mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary"
                >
                  Continue to Details
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Appointment Details */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary text-sm"
              >
                Change Date/Time
              </button>
            </div>

            {/* Appointment Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="font-medium">Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(formData.appointmentDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">{formData.timeSlot.startTime} - {formData.timeSlot.endTime}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="input"
                  required
                >
                  {appointmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="input"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="input"
                rows={3}
                placeholder="Please describe the reason for your appointment"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.symptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="badge badge-primary cursor-pointer"
                    onClick={() => handleSymptomRemove(symptom)}
                  >
                    {symptom} ×
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="input"
                placeholder="Add a symptom and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSymptomAdd(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Press Enter to add symptoms</p>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  KES {selectedDoctor.consultationFee.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Payment will be processed after appointment confirmation</p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Booking...
                  </div>
                ) : (
                  'Book Appointment'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookAppointment;