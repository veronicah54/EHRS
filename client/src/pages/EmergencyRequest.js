import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const EmergencyRequest = () => {
  const { user } = useAuth();
  const { emitEmergencyRequest } = useSocket();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    emergencyType: '',
    severity: 'medium',
    symptoms: [],
    description: '',
    location: {
      address: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      landmark: ''
    },
    contactInfo: {
      primaryPhone: user?.phone || '',
      alternatePhone: '',
      emergencyContact: {
        name: user?.emergencyContact?.name || '',
        phone: user?.emergencyContact?.phone || '',
        relationship: user?.emergencyContact?.relationship || ''
      }
    }
  });
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emergencyTypes = [
    { value: 'cardiac_arrest', label: 'Cardiac Arrest', severity: 'critical' },
    { value: 'stroke', label: 'Stroke', severity: 'critical' },
    { value: 'severe_bleeding', label: 'Severe Bleeding', severity: 'high' },
    { value: 'breathing_difficulty', label: 'Breathing Difficulty', severity: 'high' },
    { value: 'unconsciousness', label: 'Unconsciousness', severity: 'critical' },
    { value: 'severe_pain', label: 'Severe Pain', severity: 'medium' },
    { value: 'allergic_reaction', label: 'Allergic Reaction', severity: 'high' },
    { value: 'poisoning', label: 'Poisoning', severity: 'high' },
    { value: 'burns', label: 'Burns', severity: 'medium' },
    { value: 'fracture', label: 'Fracture/Injury', severity: 'medium' },
    { value: 'accident', label: 'Accident', severity: 'high' },
    { value: 'other', label: 'Other Emergency', severity: 'medium' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600', description: 'Non-urgent, can wait' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', description: 'Moderate urgency' },
    { value: 'high', label: 'High', color: 'text-orange-600', description: 'Urgent attention needed' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', description: 'Life-threatening' }
  ];

  const commonSymptoms = [
    'Chest pain', 'Shortness of breath', 'Dizziness', 'Nausea', 'Vomiting',
    'Severe headache', 'Confusion', 'Loss of consciousness', 'Severe bleeding',
    'Difficulty speaking', 'Numbness', 'Severe abdominal pain', 'High fever',
    'Difficulty swallowing', 'Rapid heartbeat', 'Weakness'
  ];

  useEffect(() => {
    // Auto-fill user information
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          primaryPhone: user.phone || '',
          emergencyContact: {
            name: user.emergencyContact?.name || '',
            phone: user.emergencyContact?.phone || '',
            relationship: user.emergencyContact?.relationship || ''
          }
        }
      }));
    }
  }, [user]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          // Try to get address from coordinates (reverse geocoding)
          try {
            // In a real app, you'd use a geocoding service like Google Maps API
            // For demo purposes, we'll use a placeholder
            const address = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                coordinates: { latitude, longitude },
                address: prev.location.address || address
              }
            }));
            
            toast.success('Location detected successfully');
          } catch (error) {
            console.error('Error getting address:', error);
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                coordinates: { latitude, longitude }
              }
            }));
          }
          
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please enter manually.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
      setLocationLoading(false);
    }
  };

  const handleEmergencyTypeChange = (type) => {
    const selectedType = emergencyTypes.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      emergencyType: type,
      severity: selectedType?.severity || 'medium'
    }));
  };

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.emergencyType) {
      toast.error('Please select an emergency type');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please provide a description of the emergency');
      return;
    }
    
    if (!formData.location.address.trim()) {
      toast.error('Please provide your location');
      return;
    }
    
    if (!formData.contactInfo.primaryPhone.trim()) {
      toast.error('Please provide a contact phone number');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await axios.post('/api/emergency', formData);
      const emergency = response.data.emergency;
      
      // Emit socket event for real-time updates
      emitEmergencyRequest(emergency);
      
      toast.success('Emergency request submitted successfully!');
      
      // Navigate to emergency tracking page
      navigate(`/emergency/${emergency._id}`, { 
        state: { emergency: response.data } 
      });
      
    } catch (error) {
      console.error('Error submitting emergency request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit emergency request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Warning Header */}
      <div className="bg-emergency-50 border border-emergency-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-emergency-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-emergency-800">Emergency Request</h3>
            <p className="text-emergency-700">
              For life-threatening emergencies, call 911 immediately. This form is for urgent medical assistance.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Emergency Type */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emergency Information</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Emergency *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {emergencyTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleEmergencyTypeChange(type.value)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    formData.emergencyType === type.value
                      ? 'bg-emergency-50 border-emergency-300 text-emergency-800'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className={`text-xs ${
                    type.severity === 'critical' ? 'text-red-600' :
                    type.severity === 'high' ? 'text-orange-600' :
                    type.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {type.severity} priority
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {severityLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, severity: level.value }))}
                  className={`p-2 text-center rounded-lg border transition-colors ${
                    formData.severity === level.value
                      ? 'bg-gray-100 border-gray-400'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className={`font-medium ${level.color}`}>{level.label}</div>
                  <div className="text-xs text-gray-600">{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              rows={4}
              placeholder="Please describe the emergency situation in detail..."
              required
            />
          </div>
        </div>

        {/* Symptoms */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Symptoms</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select all symptoms that apply
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    formData.symptoms.includes(symptom)
                      ? 'bg-primary-50 border-primary-300 text-primary-800'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {formData.symptoms.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Selected symptoms:</p>
              <div className="flex flex-wrap gap-2">
                {formData.symptoms.map((symptom) => (
                  <span key={symptom} className="badge badge-primary">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Information</h2>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Location *
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="btn-secondary text-sm"
              >
                {locationLoading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Getting location...
                  </div>
                ) : (
                  <>
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    Use Current Location
                  </>
                )}
              </button>
            </div>
            <textarea
              value={formData.location.address}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, address: e.target.value }
              }))}
              className="input"
              rows={2}
              placeholder="Enter your exact address or describe your location..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={formData.location.landmark}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, landmark: e.target.value }
              }))}
              className="input"
              placeholder="Nearby landmark or building..."
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Phone *
              </label>
              <input
                type="tel"
                value={formData.contactInfo.primaryPhone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, primaryPhone: e.target.value }
                }))}
                className="input"
                placeholder="Your phone number"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alternate Phone
              </label>
              <input
                type="tel"
                value={formData.contactInfo.alternatePhone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, alternatePhone: e.target.value }
                }))}
                className="input"
                placeholder="Alternate contact number"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.contactInfo.emergencyContact.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      emergencyContact: {
                        ...prev.contactInfo.emergencyContact,
                        name: e.target.value
                      }
                    }
                  }))}
                  className="input"
                  placeholder="Emergency contact name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactInfo.emergencyContact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      emergencyContact: {
                        ...prev.contactInfo.emergencyContact,
                        phone: e.target.value
                      }
                    }
                  }))}
                  className="input"
                  placeholder="Emergency contact phone"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.contactInfo.emergencyContact.relationship}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      emergencyContact: {
                        ...prev.contactInfo.emergencyContact,
                        relationship: e.target.value
                      }
                    }
                  }))}
                  className="input"
                  placeholder="Relationship"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="card bg-emergency-50 border-emergency-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-emergency-800">Ready to Submit?</h3>
              <p className="text-sm text-emergency-700">
                Emergency responders will be notified immediately upon submission.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/emergency')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-emergency"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    Submit Emergency Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmergencyRequest;