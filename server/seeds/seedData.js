const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Emergency = require('../models/Emergency');
const Ambulance = require('../models/Ambulance');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency_healthcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  // Patients
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'patient@demo.com',
    password: 'password123',
    phone: '+254712345678',
    role: 'patient',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'male',
    address: {
      street: '123 Main Street',
      city: 'Nairobi',
      state: 'Nairobi County',
      zipCode: '00100',
      country: 'Kenya'
    },
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+254712345679',
      relationship: 'Spouse'
    },
    medicalHistory: [
      {
        condition: 'Hypertension',
        diagnosedDate: new Date('2020-01-15'),
        status: 'active'
      }
    ],
    allergies: ['Penicillin', 'Peanuts']
  },
  {
    firstName: 'Mary',
    lastName: 'Smith',
    email: 'mary.smith@demo.com',
    password: 'password123',
    phone: '+254723456789',
    role: 'patient',
    dateOfBirth: new Date('1985-08-22'),
    gender: 'female',
    address: {
      street: '456 Oak Avenue',
      city: 'Mombasa',
      state: 'Mombasa County',
      zipCode: '80100',
      country: 'Kenya'
    },
    emergencyContact: {
      name: 'Peter Smith',
      phone: '+254723456790',
      relationship: 'Husband'
    },
    allergies: ['Shellfish']
  },
  {
    firstName: 'David',
    lastName: 'Johnson',
    email: 'david.johnson@demo.com',
    password: 'password123',
    phone: '+254734567890',
    role: 'patient',
    dateOfBirth: new Date('1992-12-10'),
    gender: 'male',
    address: {
      street: '789 Pine Road',
      city: 'Kisumu',
      state: 'Kisumu County',
      zipCode: '40100',
      country: 'Kenya'
    },
    emergencyContact: {
      name: 'Sarah Johnson',
      phone: '+254734567891',
      relationship: 'Sister'
    }
  },
  // Doctors
  {
    firstName: 'Dr. Sarah',
    lastName: 'Wilson',
    email: 'doctor@demo.com',
    password: 'password123',
    phone: '+254745678901',
    role: 'doctor'
  },
  {
    firstName: 'Dr. Michael',
    lastName: 'Brown',
    email: 'michael.brown@demo.com',
    password: 'password123',
    phone: '+254756789012',
    role: 'doctor'
  },
  {
    firstName: 'Dr. Emily',
    lastName: 'Davis',
    email: 'emily.davis@demo.com',
    password: 'password123',
    phone: '+254767890123',
    role: 'doctor'
  },
  // Admin
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@demo.com',
    password: 'password123',
    phone: '+254778901234',
    role: 'admin'
  },
  // Emergency Responders
  {
    firstName: 'James',
    lastName: 'Miller',
    email: 'responder1@demo.com',
    password: 'password123',
    phone: '+254789012345',
    role: 'emergency_responder'
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'responder2@demo.com',
    password: 'password123',
    phone: '+254790123456',
    role: 'emergency_responder'
  }
];

const sampleDoctors = [
  {
    licenseNumber: 'MD001234',
    specialization: 'General Practice',
    yearsOfExperience: 8,
    education: [
      {
        degree: 'Doctor of Medicine',
        institution: 'University of Nairobi',
        graduationYear: 2015
      }
    ],
    certifications: ['Board Certified in Family Medicine'],
    hospital: {
      name: 'Nairobi General Hospital',
      address: '123 Hospital Road, Nairobi',
      phone: '+254701234567'
    },
    consultationFee: 2500,
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true }
    ],
    isVerified: true,
    isAcceptingPatients: true,
    emergencyAvailable: true,
    languages: ['English', 'Swahili'],
    bio: 'Experienced general practitioner with a focus on preventive care and family medicine.'
  },
  {
    licenseNumber: 'MD005678',
    specialization: 'Cardiology',
    yearsOfExperience: 12,
    education: [
      {
        degree: 'Doctor of Medicine',
        institution: 'Kenyatta University',
        graduationYear: 2011
      },
      {
        degree: 'Cardiology Fellowship',
        institution: 'Aga Khan University',
        graduationYear: 2014
      }
    ],
    certifications: ['Board Certified in Cardiology', 'Advanced Cardiac Life Support'],
    hospital: {
      name: 'Heart Center Nairobi',
      address: '456 Cardiac Avenue, Nairobi',
      phone: '+254702345678'
    },
    consultationFee: 5000,
    availability: [
      { day: 'Monday', startTime: '08:00', endTime: '16:00', isAvailable: true },
      { day: 'Tuesday', startTime: '08:00', endTime: '16:00', isAvailable: true },
      { day: 'Wednesday', startTime: '08:00', endTime: '16:00', isAvailable: true },
      { day: 'Thursday', startTime: '08:00', endTime: '16:00', isAvailable: true }
    ],
    isVerified: true,
    isAcceptingPatients: true,
    emergencyAvailable: false,
    languages: ['English', 'Swahili'],
    bio: 'Specialized cardiologist with expertise in interventional cardiology and heart disease prevention.'
  },
  {
    licenseNumber: 'MD009012',
    specialization: 'Emergency Medicine',
    yearsOfExperience: 6,
    education: [
      {
        degree: 'Doctor of Medicine',
        institution: 'Moi University',
        graduationYear: 2017
      }
    ],
    certifications: ['Emergency Medicine Board Certification', 'Trauma Life Support'],
    hospital: {
      name: 'Emergency Medical Center',
      address: '789 Emergency Lane, Mombasa',
      phone: '+254703456789'
    },
    consultationFee: 3500,
    availability: [
      { day: 'Monday', startTime: '00:00', endTime: '23:59', isAvailable: true },
      { day: 'Tuesday', startTime: '00:00', endTime: '23:59', isAvailable: true },
      { day: 'Wednesday', startTime: '00:00', endTime: '23:59', isAvailable: true },
      { day: 'Thursday', startTime: '00:00', endTime: '23:59', isAvailable: true },
      { day: 'Friday', startTime: '00:00', endTime: '23:59', isAvailable: true },
      { day: 'Saturday', startTime: '00:00', endTime: '23:59', isAvailable: true },
      { day: 'Sunday', startTime: '00:00', endTime: '23:59', isAvailable: true }
    ],
    isVerified: true,
    isAcceptingPatients: true,
    emergencyAvailable: true,
    languages: ['English', 'Swahili'],
    bio: 'Emergency medicine specialist available 24/7 for urgent medical care and trauma cases.'
  }
];

const sampleAmbulances = [
  {
    vehicleNumber: 'AMB001',
    type: 'advanced',
    status: 'available',
    currentLocation: {
      coordinates: {
        latitude: -1.2921,
        longitude: 36.8219
      },
      address: 'Nairobi CBD, Kenya',
      lastUpdated: new Date()
    },
    baseStation: {
      name: 'Nairobi Central Station',
      address: 'Central Business District, Nairobi',
      coordinates: {
        latitude: -1.2921,
        longitude: 36.8219
      }
    },
    equipment: [
      { name: 'Defibrillator', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'Oxygen Tank', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'Stretcher', category: 'transport', status: 'functional', lastChecked: new Date() },
      { name: 'First Aid Kit', category: 'medical', status: 'functional', lastChecked: new Date() }
    ],
    specifications: {
      make: 'Toyota',
      model: 'Hiace',
      year: 2022,
      licensePlate: 'KCA 001A',
      fuelType: 'diesel'
    },
    isActive: true
  },
  {
    vehicleNumber: 'AMB002',
    type: 'basic',
    status: 'available',
    currentLocation: {
      coordinates: {
        latitude: -4.0435,
        longitude: 39.6682
      },
      address: 'Mombasa City, Kenya',
      lastUpdated: new Date()
    },
    baseStation: {
      name: 'Mombasa General Station',
      address: 'Mombasa Island, Mombasa',
      coordinates: {
        latitude: -4.0435,
        longitude: 39.6682
      }
    },
    equipment: [
      { name: 'Basic First Aid Kit', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'Oxygen Tank', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'Stretcher', category: 'transport', status: 'functional', lastChecked: new Date() }
    ],
    specifications: {
      make: 'Nissan',
      model: 'Urvan',
      year: 2021,
      licensePlate: 'KBZ 002B',
      fuelType: 'petrol'
    },
    isActive: true
  },
  {
    vehicleNumber: 'AMB003',
    type: 'critical_care',
    status: 'available',
    currentLocation: {
      coordinates: {
        latitude: -0.0917,
        longitude: 34.7680
      },
      address: 'Kisumu City, Kenya',
      lastUpdated: new Date()
    },
    baseStation: {
      name: 'Kisumu Medical Station',
      address: 'Kisumu Central, Kisumu',
      coordinates: {
        latitude: -0.0917,
        longitude: 34.7680
      }
    },
    equipment: [
      { name: 'Advanced Defibrillator', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'Ventilator', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'Cardiac Monitor', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'IV Equipment', category: 'medical', status: 'functional', lastChecked: new Date() },
      { name: 'Stretcher', category: 'transport', status: 'functional', lastChecked: new Date() }
    ],
    specifications: {
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      licensePlate: 'KCB 003C',
      fuelType: 'diesel'
    },
    isActive: true
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Emergency.deleteMany({});
    await Ambulance.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users`);

    // Create doctors
    const doctorUsers = createdUsers.filter(user => user.role === 'doctor');
    const createdDoctors = [];
    
    for (let i = 0; i < doctorUsers.length && i < sampleDoctors.length; i++) {
      const doctorData = {
        ...sampleDoctors[i],
        user: doctorUsers[i]._id
      };
      const doctor = new Doctor(doctorData);
      await doctor.save();
      createdDoctors.push(doctor);
    }
    console.log(`Created ${createdDoctors.length} doctor profiles`);

    // Create ambulances with crew assignments
    const responderUsers = createdUsers.filter(user => user.role === 'emergency_responder');
    const createdAmbulances = [];
    
    for (let i = 0; i < sampleAmbulances.length; i++) {
      const ambulanceData = {
        ...sampleAmbulances[i],
        crew: responderUsers.slice(i * 2, (i + 1) * 2).map((responder, index) => ({
          member: responder._id,
          role: index === 0 ? 'driver' : 'paramedic',
          shiftStart: new Date(),
          shiftEnd: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hour shift
        }))
      };
      const ambulance = new Ambulance(ambulanceData);
      await ambulance.save();
      createdAmbulances.push(ambulance);
    }
    console.log(`Created ${createdAmbulances.length} ambulances`);

    // Create sample appointments
    const patientUsers = createdUsers.filter(user => user.role === 'patient');
    const sampleAppointments = [];
    
    for (let i = 0; i < Math.min(patientUsers.length, createdDoctors.length); i++) {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + i + 1); // Future dates
      
      const appointment = {
        patient: patientUsers[i]._id,
        doctor: createdDoctors[i % createdDoctors.length]._id,
        appointmentDate,
        timeSlot: {
          startTime: '10:00',
          endTime: '10:30'
        },
        reason: 'Regular checkup and consultation',
        symptoms: ['General wellness check'],
        type: 'consultation',
        priority: 'medium',
        status: 'scheduled',
        payment: {
          amount: createdDoctors[i % createdDoctors.length].consultationFee,
          status: 'pending'
        }
      };
      
      const newAppointment = new Appointment(appointment);
      await newAppointment.save();
      sampleAppointments.push(newAppointment);
    }
    console.log(`Created ${sampleAppointments.length} sample appointments`);

    // Create sample emergency (completed)
    const sampleEmergency = {
      patient: patientUsers[0]._id,
      emergencyType: 'chest_pain',
      severity: 'high',
      symptoms: ['Chest pain', 'Shortness of breath', 'Dizziness'],
      description: 'Patient experiencing severe chest pain and difficulty breathing',
      location: {
        address: '123 Main Street, Nairobi, Kenya',
        coordinates: {
          latitude: -1.2921,
          longitude: 36.8219
        },
        landmark: 'Near City Hall'
      },
      contactInfo: {
        primaryPhone: patientUsers[0].phone,
        emergencyContact: patientUsers[0].emergencyContact
      },
      status: 'completed',
      assignedAmbulance: createdAmbulances[0]._id,
      priority: 4,
      responseTime: 12, // 12 minutes
      actualArrival: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      medicalInfo: {
        vitals: {
          bloodPressure: '140/90',
          heartRate: 95,
          temperature: 37.2,
          oxygenSaturation: 96
        },
        consciousness: 'alert',
        treatmentGiven: ['Oxygen therapy', 'IV fluids', 'Pain medication']
      },
      hospitalDestination: {
        name: 'Nairobi General Hospital',
        address: '123 Hospital Road, Nairobi',
        phone: '+254701234567'
      },
      isActive: false
    };

    const emergency = new Emergency(sampleEmergency);
    emergency.calculatePriority();
    await emergency.save();
    console.log('Created sample emergency record');

    console.log('Database seeding completed successfully!');
    console.log('\n=== Demo Account Credentials ===');
    console.log('Patient: patient@demo.com / password123');
    console.log('Doctor: doctor@demo.com / password123');
    console.log('Admin: admin@demo.com / password123');
    console.log('Emergency Responder: responder1@demo.com / password123');
    console.log('================================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding if called directly
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = { seedDatabase, connectDB };