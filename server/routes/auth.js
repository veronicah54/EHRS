const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { generateToken, generateRefreshToken, auth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please provide a valid phone number'),
  body('role').optional().isIn(['patient', 'doctor', 'admin', 'emergency_responder']).withMessage('Invalid role')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role = 'patient',
      dateOfBirth,
      gender,
      address,
      emergencyContact
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role
    };

    // Add patient-specific fields
    if (role === 'patient') {
      if (!dateOfBirth || !gender) {
        return res.status(400).json({ 
          message: 'Date of birth and gender are required for patients' 
        });
      }
      userData.dateOfBirth = dateOfBirth;
      userData.gender = gender;
      userData.address = address;
      userData.emergencyContact = emergencyContact;
    }

    const user = new User(userData);
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register doctor (additional doctor-specific information)
router.post('/register-doctor', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      // User fields
      firstName,
      lastName,
      email,
      password,
      phone,
      // Doctor-specific fields
      licenseNumber,
      specialization,
      yearsOfExperience,
      education,
      certifications,
      hospital,
      consultationFee,
      availability,
      bio
    } = req.body;

    // Validate doctor-specific required fields
    if (!licenseNumber || !specialization || !yearsOfExperience || !consultationFee) {
      return res.status(400).json({ 
        message: 'License number, specialization, years of experience, and consultation fee are required for doctors' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if license number already exists
    const existingDoctor = await Doctor.findOne({ licenseNumber });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor with this license number already exists' });
    }

    // Create user first
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'doctor'
    });

    await user.save();

    // Create doctor profile
    const doctor = new Doctor({
      user: user._id,
      licenseNumber,
      specialization,
      yearsOfExperience,
      education: education || [],
      certifications: certifications || [],
      hospital,
      consultationFee,
      availability: availability || [],
      bio
    });

    await doctor.save();

    // Generate tokens
    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: 'Doctor registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      doctor: {
        id: doctor._id,
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ message: 'Server error during doctor registration' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    let userProfile = req.user.toObject();

    // If user is a doctor, include doctor-specific information
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (doctorProfile) {
        userProfile.doctorInfo = doctorProfile;
      }
    }

    res.json({
      message: 'Profile retrieved successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'emergencyContact'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Change password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;