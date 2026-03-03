import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  UserIcon,
  MapPinIcon,
  StarIcon,
  PhoneIcon,
  ClockIcon,
  HeartIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: '',
    search: '',
    emergencyAvailable: false,
    sortBy: 'rating.average',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});

  const specializations = [
    'General Practice', 'Cardiology', 'Dermatology', 'Emergency Medicine',
    'Endocrinology', 'Gastroenterology', 'Neurology', 'Oncology',
    'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery', 'Urology'
  ];

  const sortOptions = [
    { value: 'rating.average', label: 'Highest Rated' },
    { value: 'consultationFee', label: 'Lowest Fee' },
    { value: 'yearsOfExperience', label: 'Most Experienced' },
    { value: 'user.firstName', label: 'Name A-Z' }
  ];

  useEffect(() => {
    fetchDoctors();
  }, [filters]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.search) params.append('search', filters.search);
      if (filters.emergencyAvailable) params.append('emergencyAvailable', 'true');
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      params.append('isAcceptingPatients', 'true');
      
      const response = await axios.get(`/api/doctors?${params}`);
      setDoctors(response.data.doctors);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderStars = (rating, count) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="w-4 h-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIconSolid className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    
    return (
      <div className="flex items-center">
        <div className="flex">{stars}</div>
        <span className="ml-1 text-sm text-gray-600">
          {rating > 0 ? rating.toFixed(1) : 'New'} ({count} reviews)
        </span>
      </div>
    );
  };

  const formatAvailability = (availability) => {
    const availableDays = availability
      .filter(day => day.isAvailable)
      .map(day => day.day.substring(0, 3))
      .join(', ');
    
    return availableDays || 'Schedule varies';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Doctor</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse our network of verified healthcare professionals and book appointments 
          with doctors that match your needs.
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Doctors
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
                placeholder="Search by name or hospital"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <select
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
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
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.emergencyAvailable}
                onChange={(e) => handleFilterChange('emergencyAvailable', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Emergency Available</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : doctors.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Found {pagination.total} doctors
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                      <UserIcon className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Dr. {doctor.user.firstName} {doctor.user.lastName}
                      </h3>
                      <p className="text-primary-600 font-medium">{doctor.specialization}</p>
                      <p className="text-sm text-gray-600">{doctor.yearsOfExperience} years experience</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      KES {doctor.consultationFee.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Consultation fee</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-3">
                  {renderStars(doctor.rating.average, doctor.rating.count)}
                </div>

                {/* Hospital Info */}
                {doctor.hospital && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>{doctor.hospital.name}</span>
                  </div>
                )}

                {/* Contact */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  <span>{doctor.user.phone}</span>
                </div>

                {/* Availability */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>Available: {formatAvailability(doctor.availability)}</span>
                </div>

                {/* Bio */}
                {doctor.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {doctor.bio}
                  </p>
                )}

                {/* Languages */}
                {doctor.languages && doctor.languages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Languages:</strong> {doctor.languages.join(', ')}
                    </p>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {doctor.isVerified && (
                    <span className="badge badge-success">Verified</span>
                  )}
                  {doctor.isAcceptingPatients && (
                    <span className="badge badge-primary">Accepting Patients</span>
                  )}
                  {doctor.emergencyAvailable && (
                    <span className="badge badge-danger">
                      <HeartIcon className="w-3 h-3 mr-1" />
                      Emergency Available
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Link
                    to={`/doctors/${doctor._id}`}
                    className="btn-secondary flex-1 text-center"
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/book-appointment"
                    state={{ selectedDoctor: doctor }}
                    className="btn-primary flex-1 text-center"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or browse all available doctors.
          </p>
          <button
            onClick={() => setFilters({
              specialization: '',
              search: '',
              emergencyAvailable: false,
              sortBy: 'rating.average',
              sortOrder: 'desc'
            })}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Emergency CTA */}
      <div className="card bg-emergency-50 border-emergency-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-emergency-800 mb-2">
              Medical Emergency?
            </h3>
            <p className="text-emergency-700">
              Don't wait for an appointment. Get immediate emergency medical assistance.
            </p>
          </div>
          <div className="flex space-x-3">
            <a
              href="tel:911"
              className="btn-emergency"
            >
              Call 911
            </a>
            <Link
              to="/emergency"
              className="btn-secondary border-emergency-300 text-emergency-700 hover:bg-emergency-100"
            >
              Request Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;