import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ExclamationTriangleIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  HeartIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const Emergency = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'patient') {
      fetchEmergencies();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchEmergencies = async () => {
    try {
      const response = await axios.get('/api/emergency/my-emergencies');
      setEmergencies(response.data.emergencies);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
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
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100';
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
      {/* Emergency Header */}
      <div className="bg-gradient-to-r from-emergency-600 to-emergency-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 mr-3" />
              Emergency Services
            </h1>
            <p className="text-emergency-100">
              Get immediate medical assistance when you need it most
            </p>
          </div>
          <div className="text-right">
            <p className="text-emergency-200 text-sm">Emergency Hotline</p>
            <p className="text-2xl font-bold">911</p>
          </div>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-emergency-200 hover:border-emergency-300 transition-colors">
          <div className="text-center">
            <div className="w-16 h-16 bg-emergency-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-emergency-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Emergency Help</h3>
            <p className="text-gray-600 mb-4">
              Submit an emergency request with your location and get immediate assistance
            </p>
            {isAuthenticated ? (
              <Link
                to="/emergency/request"
                className="btn-emergency w-full"
              >
                Request Help Now
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-emergency w-full"
              >
                Login to Request Help
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Emergency Services</h3>
            <p className="text-gray-600 mb-4">
              For immediate life-threatening emergencies, call emergency services directly
            </p>
            <a
              href="tel:911"
              className="btn-primary w-full"
            >
              Call 911
            </a>
          </div>
        </div>

        <div className="card">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Nearby Hospitals</h3>
            <p className="text-gray-600 mb-4">
              Locate the nearest hospitals and medical facilities in your area
            </p>
            <button className="btn-secondary w-full">
              Find Hospitals
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Types Guide */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">When to Request Emergency Help</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-emergency-600 mb-3">Critical Emergencies</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-emergency-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Cardiac arrest or severe chest pain
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-emergency-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Stroke symptoms (face drooping, arm weakness, speech difficulty)
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-emergency-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Severe bleeding that won't stop
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-emergency-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Difficulty breathing or choking
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-emergency-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Unconsciousness or unresponsiveness
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-orange-600 mb-3">Urgent Situations</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Severe allergic reactions
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Suspected poisoning
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Severe burns
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Suspected fractures or serious injuries
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Motor vehicle accidents
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Emergency Requests */}
      {isAuthenticated && user?.role === 'patient' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Emergency Requests</h2>
            {emergencies.length > 0 && (
              <Link
                to="/emergency/history"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            )}
          </div>

          {emergencies.length > 0 ? (
            <div className="space-y-4">
              {emergencies.slice(0, 3).map((emergency) => (
                <div key={emergency._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {formatEmergencyType(emergency.emergencyType)}
                        </h3>
                        <span className={`badge ml-3 ${getSeverityColor(emergency.severity)} capitalize`}>
                          {emergency.severity}
                        </span>
                        <span className={`badge ml-2 ${getStatusColor(emergency.status)} capitalize`}>
                          {emergency.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{emergency.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-500">
                          <MapPinIcon className="w-4 h-4 mr-2" />
                          {emergency.location.address}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          {new Date(emergency.createdAt).toLocaleString()}
                        </div>
                        {emergency.assignedAmbulance && (
                          <div className="flex items-center text-blue-600">
                            <TruckIcon className="w-4 h-4 mr-2" />
                            Ambulance: {emergency.assignedAmbulance.vehicleNumber}
                          </div>
                        )}
                      </div>

                      {emergency.estimatedArrival && emergency.status !== 'completed' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <ClockIcon className="w-4 h-4 inline mr-1" />
                            Estimated arrival: {new Date(emergency.estimatedArrival).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No emergency requests found</p>
              <Link
                to="/emergency/request"
                className="btn-emergency"
              >
                Request Emergency Help
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Emergency Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Emergency Preparedness Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Before an Emergency</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Keep emergency contacts readily available</li>
              <li>• Know your medical conditions and medications</li>
              <li>• Have a basic first aid kit at home</li>
              <li>• Know the location of nearest hospitals</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">During an Emergency</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Stay calm and assess the situation</li>
              <li>• Call emergency services if life-threatening</li>
              <li>• Provide clear location information</li>
              <li>• Follow dispatcher instructions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;