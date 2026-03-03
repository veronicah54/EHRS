const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateAppointment = [
  body('doctor').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeSlot.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM format)'),
  body('timeSlot.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM format)'),
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('type').optional().isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup', 'vaccination']).withMessage('Invalid appointment type')
];

// Book new appointment
router.post('/', auth, authorize('patient'), validateAppointment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      reason,
      symptoms = [],
      type = 'consultation',
      priority = 'medium'
    } = req.body;

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ message: 'Appointment date must be in the future' });
    }

    // Check if doctor exists and is accepting patients
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!doctor.isAcceptingPatients) {
      return res.status(400).json({ message: 'Doctor is not currently accepting new patients' });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDateTime.toDateString()),
        $lt: new Date(new Date(appointmentDateTime.toDateString()).getTime() + 24 * 60 * 60 * 1000)
      },
      'timeSlot.startTime': timeSlot.startTime,
      status: { $nin: ['cancelled', 'no_show'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate: appointmentDateTime,
      timeSlot,
      reason,
      symptoms,
      type,
      priority,
      payment: {
        amount: doctor.consultationFee,
        status: 'pending'
      }
    });

    await appointment.save();

    // Populate appointment with patient and doctor details
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', populate: { path: 'user', select: 'firstName lastName' } }
    ]);

    // Emit real-time notification to doctor
    const io = req.app.get('io');
    io.to(`doctor_${doctorId}`).emit('new_appointment', {
      appointment: appointment,
      message: `New appointment booked by ${req.user.fullName}`
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ message: 'Server error booking appointment' });
  }
});

// Get user's appointments
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'appointmentDate', sortOrder = 'asc' } = req.query;
    
    const filter = {};
    
    // Set filter based on user role
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      filter.doctor = doctor._id;
    }

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      message: 'Appointments retrieved successfully',
      appointments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error retrieving appointments' });
  }
});

// Get specific appointment
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender address emergencyContact medicalHistory allergies')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email phone' }
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to view this appointment
    const isPatient = req.user.role === 'patient' && appointment.patient._id.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor' && appointment.doctor.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      message: 'Appointment retrieved successfully',
      appointment
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error retrieving appointment' });
  }
});

// Update appointment status (for doctors and admins)
router.patch('/:id/status', auth, authorize('doctor', 'admin'), [
  body('status').isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, notes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if doctor owns this appointment
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    appointment.status = status;
    if (notes) {
      appointment.notes.doctorNotes = notes;
    }

    await appointment.save();

    // Emit real-time notification to patient
    const io = req.app.get('io');
    io.to(`patient_${appointment.patient}`).emit('appointment_updated', {
      appointmentId: appointment._id,
      status,
      message: `Your appointment status has been updated to ${status}`
    });

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error updating appointment status' });
  }
});

// Reschedule appointment
router.patch('/:id/reschedule', auth, [
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeSlot.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('timeSlot.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { appointmentDate, timeSlot, reason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const isPatient = req.user.role === 'patient' && appointment.patient.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor';
    
    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if appointment can be rescheduled
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Appointment cannot be rescheduled in current status' });
    }

    // Validate new appointment date is in the future
    const newAppointmentDate = new Date(appointmentDate);
    if (newAppointmentDate <= new Date()) {
      return res.status(400).json({ message: 'New appointment date must be in the future' });
    }

    // Check if new time slot is available
    const conflictingAppointment = await Appointment.findOne({
      doctor: appointment.doctor,
      appointmentDate: {
        $gte: new Date(newAppointmentDate.toDateString()),
        $lt: new Date(new Date(newAppointmentDate.toDateString()).getTime() + 24 * 60 * 60 * 1000)
      },
      'timeSlot.startTime': timeSlot.startTime,
      status: { $nin: ['cancelled', 'no_show'] },
      _id: { $ne: appointment._id }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ message: 'New time slot is already booked' });
    }

    // Update appointment
    appointment.appointmentDate = newAppointmentDate;
    appointment.timeSlot = timeSlot;
    appointment.status = 'scheduled'; // Reset to scheduled
    
    if (reason) {
      const rescheduleNote = `Rescheduled by ${req.user.role}: ${reason}`;
      appointment.notes.doctorNotes = appointment.notes.doctorNotes 
        ? `${appointment.notes.doctorNotes}\n${rescheduleNote}`
        : rescheduleNote;
    }

    await appointment.save();

    // Emit notifications
    const io = req.app.get('io');
    const targetRole = req.user.role === 'patient' ? 'doctor' : 'patient';
    const targetId = req.user.role === 'patient' ? appointment.doctor : appointment.patient;
    
    io.to(`${targetRole}_${targetId}`).emit('appointment_rescheduled', {
      appointmentId: appointment._id,
      newDate: appointmentDate,
      newTimeSlot: timeSlot,
      message: `Appointment has been rescheduled`
    });

    res.json({
      message: 'Appointment rescheduled successfully',
      appointment
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ message: 'Server error rescheduling appointment' });
  }
});

// Cancel appointment
router.patch('/:id/cancel', auth, [
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const isPatient = req.user.role === 'patient' && appointment.patient.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor';
    
    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Appointment cannot be cancelled less than 24 hours before scheduled time or if already completed' 
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancellation = {
      cancelledBy: req.user.role,
      reason: reason || 'No reason provided',
      cancelledAt: new Date()
    };

    // Handle refund logic (simplified)
    if (appointment.payment.status === 'paid') {
      appointment.payment.status = 'refunded';
      appointment.cancellation.refundAmount = appointment.payment.amount;
    }

    await appointment.save();

    // Emit notifications
    const io = req.app.get('io');
    const targetRole = req.user.role === 'patient' ? 'doctor' : 'patient';
    const targetId = req.user.role === 'patient' ? appointment.doctor : appointment.patient;
    
    io.to(`${targetRole}_${targetId}`).emit('appointment_cancelled', {
      appointmentId: appointment._id,
      cancelledBy: req.user.role,
      reason,
      message: `Appointment has been cancelled`
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error cancelling appointment' });
  }
});

// Add appointment notes/prescription (doctors only)
router.patch('/:id/notes', auth, authorize('doctor'), [
  body('diagnosis').optional().isString().withMessage('Diagnosis must be a string'),
  body('prescriptions').optional().isArray().withMessage('Prescriptions must be an array'),
  body('followUpRequired').optional().isBoolean().withMessage('Follow up required must be boolean'),
  body('followUpDate').optional().isISO8601().withMessage('Valid follow up date required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { diagnosis, prescriptions, followUpRequired, followUpDate, doctorNotes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if doctor owns this appointment
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update notes
    if (diagnosis) appointment.notes.diagnosis = diagnosis;
    if (prescriptions) appointment.notes.prescriptions = prescriptions;
    if (followUpRequired !== undefined) appointment.notes.followUpRequired = followUpRequired;
    if (followUpDate) appointment.notes.followUpDate = new Date(followUpDate);
    if (doctorNotes) appointment.notes.doctorNotes = doctorNotes;

    await appointment.save();

    res.json({
      message: 'Appointment notes updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Update appointment notes error:', error);
    res.status(500).json({ message: 'Server error updating appointment notes' });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/doctor/:doctorId/available-slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const requestedDate = new Date(date);
    const availableSlots = doctor.getAvailableSlots(requestedDate);

    // Get booked appointments for this date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(requestedDate.toDateString()),
        $lt: new Date(new Date(requestedDate.toDateString()).getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $nin: ['cancelled', 'no_show'] }
    }).select('timeSlot.startTime');

    const bookedTimes = bookedAppointments.map(apt => apt.timeSlot.startTime);
    const freeSlots = availableSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({
      message: 'Available slots retrieved successfully',
      date,
      availableSlots: freeSlots,
      totalSlots: availableSlots.length,
      bookedSlots: bookedTimes.length
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error retrieving available slots' });
  }
});

module.exports = router;