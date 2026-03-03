const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { 
      specialization, 
      isAcceptingPatients, 
      emergencyAvailable,
      page = 1, 
      limit = 20,
      search,
      sortBy = 'rating.average',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isVerified: true };
    
    if (specialization) filter.specialization = specialization;
    if (isAcceptingPatients !== undefined) filter.isAcceptingPatients = isAcceptingPatients === 'true';
    if (emergencyAvailable !== undefined) filter.emergencyAvailable = emergencyAvailable === 'true';

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let query = Doctor.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Add search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const userIds = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      }).distinct('_id');

      filter.$or = [
        { user: { $in: userIds } },
        { specialization: searchRegex },
        { 'hospital.name': searchRegex }
      ];
      
      query = Doctor.find(filter)
        .populate('user', 'firstName lastName email phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
    }

    const doctors = await query;
    const total = await Doctor.countDocuments(filter);

    res.json({
      message: 'Doctors retrieved successfully',
      doctors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error retrieving doctors' });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('reviews.patient', 'firstName lastName');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({
      message: 'Doctor retrieved successfully',
      doctor
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ message: 'Server error retrieving doctor' });
  }
});

// Update doctor profile (doctor only)
router.put('/profile', auth, authorize('doctor'), async (req, res) => {
  try {
    const {
      specialization,
      yearsOfExperience,
      education,
      certifications,
      hospital,
      consultationFee,
      availability,
      bio,
      isAcceptingPatients,
      emergencyAvailable,
      languages
    } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Update allowed fields
    if (specialization) doctor.specialization = specialization;
    if (yearsOfExperience !== undefined) doctor.yearsOfExperience = yearsOfExperience;
    if (education) doctor.education = education;
    if (certifications) doctor.certifications = certifications;
    if (hospital) doctor.hospital = hospital;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (availability) doctor.availability = availability;
    if (bio) doctor.bio = bio;
    if (isAcceptingPatients !== undefined) doctor.isAcceptingPatients = isAcceptingPatients;
    if (emergencyAvailable !== undefined) doctor.emergencyAvailable = emergencyAvailable;
    if (languages) doctor.languages = languages;

    await doctor.save();

    res.json({
      message: 'Doctor profile updated successfully',
      doctor
    });

  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ message: 'Server error updating doctor profile' });
  }
});

// Get doctor's appointments
router.get('/appointments/my', auth, authorize('doctor'), async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const filter = { doctor: doctor._id };
    
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender medicalHistory allergies')
      .sort({ appointmentDate: 1, 'timeSlot.startTime': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      message: 'Doctor appointments retrieved successfully',
      appointments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ message: 'Server error retrieving doctor appointments' });
  }
});

// Add review for doctor
router.post('/:id/reviews', auth, authorize('patient'), [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { rating, comment } = req.body;
    
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if patient has had an appointment with this doctor
    const hasAppointment = await Appointment.findOne({
      patient: req.user._id,
      doctor: doctor._id,
      status: 'completed'
    });

    if (!hasAppointment) {
      return res.status(400).json({ 
        message: 'You can only review doctors you have had completed appointments with' 
      });
    }

    // Check if patient has already reviewed this doctor
    const existingReview = doctor.reviews.find(
      review => review.patient.toString() === req.user._id.toString()
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.date = new Date();
    } else {
      // Add new review
      doctor.reviews.push({
        patient: req.user._id,
        rating,
        comment,
        date: new Date()
      });
    }

    // Update doctor's overall rating
    doctor.updateRating();
    await doctor.save();

    await doctor.populate('reviews.patient', 'firstName lastName');

    res.json({
      message: existingReview ? 'Review updated successfully' : 'Review added successfully',
      doctor: {
        id: doctor._id,
        rating: doctor.rating,
        reviews: doctor.reviews
      }
    });

  } catch (error) {
    console.error('Add doctor review error:', error);
    res.status(500).json({ message: 'Server error adding review' });
  }
});

// Get doctor statistics (doctor only)
router.get('/stats/my', auth, authorize('doctor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          noShowAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$payment.amount', 0] }
          },
          avgRating: { $avg: '$rating.patientRating' }
        }
      }
    ]);

    const upcomingAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    res.json({
      message: 'Doctor statistics retrieved successfully',
      stats: stats[0] || {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        totalRevenue: 0,
        avgRating: 0
      },
      upcomingAppointments,
      doctorRating: doctor.rating,
      period: { startDate: start, endDate: end }
    });

  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({ message: 'Server error retrieving doctor statistics' });
  }
});

// Verify doctor (admin only)
router.patch('/:id/verify', auth, authorize('admin'), [
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { isVerified } = req.body;
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({
      message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`,
      doctor
    });

  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({ message: 'Server error verifying doctor' });
  }
});

// Get specializations list
router.get('/meta/specializations', (req, res) => {
  const specializations = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Emergency Medicine',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'Urology',
    'Other'
  ];

  res.json({
    message: 'Specializations retrieved successfully',
    specializations
  });
});

module.exports = router;