import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  HeartIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateProfile, changePassword, isPatient, isDoctor } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || 'Kenya'
    },
    emergencyContact: {
      name: user?.emergencyContact?.name || '',
      phone: user?.emergencyContact?.phone || '',
      relationship: user?.emergencyContact?.relationship || ''
    }
  });

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: UserIcon },
    { id: 'medical', name: 'Medical Info', icon: HeartIcon },
    { id: 'security', name: 'Security', icon: KeyIcon }
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateProfile(profileData);
    if (result.success) {
      // Profile updated successfully
    }
    
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setLoading(true);
    
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (result.success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mr-6">
            <span className="text-2xl font-bold text-primary-700">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-500">
              Member since {formatDate(user?.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{user?.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                {isPatient && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-600">{formatDate(user?.dateOfBirth)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Date of birth cannot be changed</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <span className="text-gray-600 capitalize">{user?.gender || 'Not specified'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address.street}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileData.address.city}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/County
                      </label>
                      <input
                        type="text"
                        value={profileData.address.state}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={profileData.address.zipCode}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, zipCode: e.target.value }
                        }))}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isPatient && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={profileData.emergencyContact.name}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileData.emergencyContact.phone}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                        }))}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={profileData.emergencyContact.relationship}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                        }))}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="spinner mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Medical Information Tab */}
          {activeTab === 'medical' && isPatient && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
                
                {user?.medicalHistory && user.medicalHistory.length > 0 ? (
                  <div className="space-y-3">
                    {user.medicalHistory.map((condition, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{condition.condition}</h4>
                            <p className="text-sm text-gray-600">
                              Diagnosed: {formatDate(condition.diagnosedDate)}
                            </p>
                          </div>
                          <span className={`badge ${
                            condition.status === 'active' ? 'badge-danger' :
                            condition.status === 'resolved' ? 'badge-success' :
                            'badge-warning'
                          } capitalize`}>
                            {condition.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No medical history recorded</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Allergies</h3>
                
                {user?.allergies && user.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.allergies.map((allergy, index) => (
                      <span key={index} className="badge badge-warning">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No allergies recorded</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Medications</h3>
                
                {user?.medications && user.medications.length > 0 ? (
                  <div className="space-y-3">
                    {user.medications.map((medication, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{medication.name}</h4>
                        <p className="text-sm text-gray-600">
                          {medication.dosage} - {medication.frequency}
                        </p>
                        <p className="text-xs text-gray-500">
                          Started: {formatDate(medication.startDate)}
                          {medication.endDate && ` | Ends: ${formatDate(medication.endDate)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No current medications</p>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="spinner mr-2"></div>
                        Changing...
                      </div>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </form>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`badge ${user?.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="text-gray-900">
                      {user?.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="text-gray-900">{formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;