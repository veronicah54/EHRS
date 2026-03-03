import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HeartIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      name: 'Emergency Response',
      description: 'Get immediate help during medical emergencies with real-time ambulance tracking.',
      icon: HeartIcon,
      color: 'text-emergency-600'
    },
    {
      name: '24/7 Availability',
      description: 'Access healthcare services and emergency response around the clock.',
      icon: ClockIcon,
      color: 'text-primary-600'
    },
    {
      name: 'Secure & Private',
      description: 'Your medical data is protected with enterprise-grade security.',
      icon: ShieldCheckIcon,
      color: 'text-success-600'
    },
    {
      name: 'Expert Doctors',
      description: 'Connect with verified healthcare professionals across various specializations.',
      icon: UserGroupIcon,
      color: 'text-purple-600'
    },
    {
      name: 'Easy Appointments',
      description: 'Book, reschedule, or cancel appointments with just a few clicks.',
      icon: CalendarIcon,
      color: 'text-blue-600'
    },
    {
      name: 'Instant Communication',
      description: 'Real-time updates and notifications for all your healthcare needs.',
      icon: PhoneIcon,
      color: 'text-green-600'
    }
  ];

  const stats = [
    { name: 'Registered Patients', value: '10,000+' },
    { name: 'Verified Doctors', value: '500+' },
    { name: 'Emergency Responses', value: '2,500+' },
    { name: 'Appointments Booked', value: '25,000+' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">HealthCare</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/doctors"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Find Doctors
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn-primary"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Emergency Response &
              <br />
              <span className="text-primary-200">Healthcare Appointments</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Get immediate emergency medical assistance and easily manage your healthcare appointments 
              all in one comprehensive platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started Free
                </Link>
              )}
              <Link
                to="/emergency"
                className="bg-emergency-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emergency-700 transition-colors flex items-center justify-center"
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                Emergency Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines emergency response capabilities with routine healthcare management 
              to provide you with complete medical support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">
                    {feature.name}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-200">
                  {stat.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency CTA Section */}
      <div className="py-16 bg-emergency-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <HeartIcon className="w-16 h-16 text-emergency-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Medical Emergency?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Don't wait. Get immediate medical assistance with real-time ambulance tracking 
              and direct communication with emergency responders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/emergency"
                className="btn-emergency text-lg px-8 py-3"
              >
                Request Emergency Help
              </Link>
              <Link
                to="/doctors"
                className="btn-secondary text-lg px-8 py-3"
              >
                Find a Doctor
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">HealthCare</h3>
              <p className="text-gray-400">
                Comprehensive emergency response and healthcare appointment management platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Emergency Response</li>
                <li>Doctor Appointments</li>
                <li>Telemedicine</li>
                <li>Health Records</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <p className="text-gray-400 mb-2">24/7 Emergency Hotline:</p>
              <p className="text-emergency-400 font-bold text-lg">911</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HealthCare Emergency Response System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;