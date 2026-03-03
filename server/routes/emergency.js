const express = require('express');
const { body, validationResult } = require('express-validator');
const Emergency = require('../models/Emergency');
const Ambulance = require('../models/Ambulance');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateEmergency = [
  body('emergencyType').isIn([
    'cardiac_arrest', 'stroke', 'severe_bleeding', 'breathing_difficulty',
    'unconsciousness', 'severe_pain', 'allergic_reaction', 'poisoning',
    'burns', 'fracture', 'accident', 'other'
  ]).withMessage('Invalid emergency type'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.coordinates.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('location.coordinates.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('contactInfo.primaryPhone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Valid primary phone is required')
];

// Create emergency request
router.post('/', auth, authorize('patient'), validateEmergency, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      emergencyType,
      severity,
      symptoms,
      description,
      location,
      contactInfo,
      medicalInfo
    } = req.body;

    // Create emergency record
    const emergency = new Emergency({
      patient: req.user._id,
      emergencyType,
      severity,
      symptoms,
      description,
      location,
      contactInfo: {
        primaryPhone: contactInfo.primaryPhone,
        alternatePhone: contactInfo.alternatePhone,
        emergencyContact: contactInfo.emergencyContact
      },
      medicalInfo: medicalInfo || {}
    });

    // Calculate priority based on severity and type
    emergency.calculatePriority();

    await emergency.save();

    // Find nearest available ambulances
    const nearbyAmbulances = await Ambulance.findNearest(location.coordinates, 50000, 3);
    
    let assignedAmbulance = null;
    if (nearbyAmbulances.length > 0) {
      // Assign the nearest available ambulance
      assignedAmbulance = nearbyAmbulances[0];
      
      // Update ambulance status
      assignedAmbulance.status = 'dispatched';
      assignedAmbulance.currentAssignment = {
        emergency: emergency._id,
        assignedAt: new Date()
      };
      
      // Calculate estimated arrival
      const arrivalInfo = assignedAmbulance.estimateArrivalTime(location.coordinates);
      emergency.estimatedArrival = arrivalInfo.estimatedArrival;
      assignedAmbulance.currentAssignment.estimatedCompletion = arrivalInfo.estimatedArrival;
      
      emergency.assignedAmbulance = assignedAmbulance._id;
      emergency.status = 'dispatched';
      
      await assignedAmbulance.save();
      await emergency.save();
    }

    // Populate emergency with patient details
    await emergency.populate('patient', 'firstName lastName phone emergencyContact medicalHistory allergies');

    // Emit real-time notifications
    const io = req.app.get('io');
    
    // Notify all emergency responders
    io.to('emergency_responders').emit('new_emergency', {
      emergency,
      assignedAmbulance,
      message: `New ${severity} emergency: ${emergencyType}`,
      location: location.address
    });

    // Notify assigned ambulance crew
    if (assignedAmbulance) {
      assignedAmbulance.crew.forEach(crewMember => {
        io.to(`user_${crewMember.member}`).emit('emergency_assigned', {
          emergency,
          ambulance: assignedAmbulance,
          estimatedArrival: emergency.estimatedArrival,
          message: 'You have been assigned to a new emergency'
        });
      });
    }

    res.status(201).json({
      message: 'Emergency request created successfully',
      emergency,
      assignedAmbulance: assignedAmbulance ? {
        id: assignedAmbulance._id,
        vehicleNumber: assignedAmbulance.vehicleNumber,
        estimatedArrival: emergency.estimatedArrival,
        distance: assignedAmbulance.calculateDistanceTo(location.coordinates)
      } : null
    });

  } catch (error) {
    console.error('Emergency creation error:', error);
    res.status(500).json({ message: 'Server error creating emergency request' });
  }
});

// Get user's emergency requests
router.get('/my-emergencies', auth, authorize('patient'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { patient: req.user._id };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const emergencies = await Emergency.find(filter)
      .populate('assignedAmbulance', 'vehicleNumber type status currentLocation')
      .populate('assignedResponders.responder', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Emergency.countDocuments(filter);

    res.json({
      message: 'Emergency requests retrieved successfully',
      emergencies,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ message: 'Server error retrieving emergency requests' });
  }
});

// Get all emergency requests (for emergency responders and admins)
router.get('/', auth, authorize('emergency_responder', 'admin'), async (req, res) => {
  try {
    const { 
      status, 
      severity, 
      emergencyType, 
      page = 1, 
      limit = 20,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (emergencyType) filter.emergencyType = emergencyType;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const emergencies = await Emergency.find(filter)
      .populate('patient', 'firstName lastName phone emergencyContact')
      .populate('assignedAmbulance', 'vehicleNumber type status currentLocation crew')
      .populate('assignedResponders.responder', 'firstName lastName phone role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Emergency.countDocuments(filter);

    res.json({
      message: 'Emergency requests retrieved successfully',
      emergencies,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get all emergencies error:', error);
    res.status(500).json({ message: 'Server error retrieving emergency requests' });
  }
});

// Get specific emergency request
router.get('/:id', auth, async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('patient', 'firstName lastName phone dateOfBirth gender address emergencyContact medicalHistory allergies medications')
      .populate({
        path: 'assignedAmbulance',
        populate: {
          path: 'crew.member',
          select: 'firstName lastName phone role'
        }
      })
      .populate('assignedResponders.responder', 'firstName lastName phone')
      .populate('timeline.updatedBy', 'firstName lastName role');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    // Check permissions
    const isPatient = req.user.role === 'patient' && emergency.patient._id.toString() === req.user._id.toString();
    const isResponder = ['emergency_responder', 'admin'].includes(req.user.role);
    const isAssignedCrew = emergency.assignedAmbulance && 
      emergency.assignedAmbulance.crew.some(crew => crew.member._id.toString() === req.user._id.toString());

    if (!isPatient && !isResponder && !isAssignedCrew) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      message: 'Emergency request retrieved successfully',
      emergency
    });

  } catch (error) {
    console.error('Get emergency error:', error);
    res.status(500).json({ message: 'Server error retrieving emergency request' });
  }
});

// Update emergency status
router.patch('/:id/status', auth, authorize('emergency_responder', 'admin'), [
  body('status').isIn(['pending', 'dispatched', 'en_route', 'on_scene', 'transporting', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('vitals').optional().isObject().withMessage('Vitals must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, notes, vitals, hospitalDestination } = req.body;
    
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const oldStatus = emergency.status;
    emergency.status = status;

    // Update medical info if provided
    if (vitals) {
      emergency.medicalInfo.vitals = { ...emergency.medicalInfo.vitals, ...vitals };
    }

    if (hospitalDestination) {
      emergency.hospitalDestination = hospitalDestination;
    }

    // Add timeline entry
    emergency.timeline.push({
      status,
      timestamp: new Date(),
      notes: notes || `Status updated to ${status}`,
      updatedBy: req.user._id
    });

    // Handle status-specific logic
    if (status === 'on_scene' && !emergency.actualArrival) {
      emergency.actualArrival = new Date();
    }

    if (status === 'completed') {
      emergency.isActive = false;
      
      // Update ambulance status back to available
      if (emergency.assignedAmbulance) {
        await Ambulance.findByIdAndUpdate(emergency.assignedAmbulance, {
          status: 'available',
          $unset: { currentAssignment: 1 }
        });
      }
    }

    await emergency.save();

    // Emit real-time updates
    const io = req.app.get('io');
    
    // Notify patient
    io.to(`patient_${emergency.patient}`).emit('emergency_status_updated', {
      emergencyId: emergency._id,
      oldStatus,
      newStatus: status,
      notes,
      message: `Emergency status updated to ${status}`
    });

    // Notify emergency responders
    io.to('emergency_responders').emit('emergency_updated', {
      emergencyId: emergency._id,
      status,
      notes
    });

    res.json({
      message: 'Emergency status updated successfully',
      emergency
    });

  } catch (error) {
    console.error('Update emergency status error:', error);
    res.status(500).json({ message: 'Server error updating emergency status' });
  }
});

// Assign ambulance to emergency
router.patch('/:id/assign-ambulance', auth, authorize('emergency_responder', 'admin'), [
  body('ambulanceId').isMongoId().withMessage('Valid ambulance ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { ambulanceId } = req.body;
    
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const ambulance = await Ambulance.findById(ambulanceId).populate('crew.member', 'firstName lastName phone');
    if (!ambulance) {
      return res.status(404).json({ message: 'Ambulance not found' });
    }

    if (!ambulance.isAvailableForDispatch()) {
      return res.status(400).json({ message: 'Ambulance is not available for dispatch' });
    }

    // Update previous ambulance if any
    if (emergency.assignedAmbulance) {
      await Ambulance.findByIdAndUpdate(emergency.assignedAmbulance, {
        status: 'available',
        $unset: { currentAssignment: 1 }
      });
    }

    // Assign new ambulance
    ambulance.status = 'dispatched';
    ambulance.currentAssignment = {
      emergency: emergency._id,
      assignedAt: new Date()
    };

    // Calculate estimated arrival
    const arrivalInfo = ambulance.estimateArrivalTime(emergency.location.coordinates);
    emergency.estimatedArrival = arrivalInfo.estimatedArrival;
    ambulance.currentAssignment.estimatedCompletion = arrivalInfo.estimatedArrival;

    emergency.assignedAmbulance = ambulance._id;
    emergency.status = 'dispatched';

    await ambulance.save();
    await emergency.save();

    // Emit notifications
    const io = req.app.get('io');
    
    // Notify patient
    io.to(`patient_${emergency.patient}`).emit('ambulance_assigned', {
      emergencyId: emergency._id,
      ambulance: {
        vehicleNumber: ambulance.vehicleNumber,
        estimatedArrival: emergency.estimatedArrival
      },
      message: 'An ambulance has been assigned to your emergency'
    });

    // Notify ambulance crew
    ambulance.crew.forEach(crewMember => {
      io.to(`user_${crewMember.member._id}`).emit('emergency_assigned', {
        emergency,
        ambulance,
        message: 'You have been assigned to a new emergency'
      });
    });

    res.json({
      message: 'Ambulance assigned successfully',
      emergency,
      ambulance: {
        id: ambulance._id,
        vehicleNumber: ambulance.vehicleNumber,
        estimatedArrival: emergency.estimatedArrival,
        crew: ambulance.crew
      }
    });

  } catch (error) {
    console.error('Assign ambulance error:', error);
    res.status(500).json({ message: 'Server error assigning ambulance' });
  }
});

// Track ambulance location (for assigned crew)
router.patch('/:id/track-ambulance', auth, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('address').optional().isString().withMessage('Address must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { latitude, longitude, address } = req.body;
    
    const emergency = await Emergency.findById(req.params.id).populate('assignedAmbulance');
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    if (!emergency.assignedAmbulance) {
      return res.status(400).json({ message: 'No ambulance assigned to this emergency' });
    }

    // Check if user is part of the ambulance crew
    const isCrewMember = emergency.assignedAmbulance.crew.some(
      crew => crew.member.toString() === req.user._id.toString()
    );

    if (!isCrewMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update ambulance location
    await emergency.assignedAmbulance.updateLocation(latitude, longitude, address);

    // Emit real-time location update
    const io = req.app.get('io');
    io.to(`patient_${emergency.patient}`).emit('ambulance_location_updated', {
      emergencyId: emergency._id,
      location: {
        latitude,
        longitude,
        address,
        timestamp: new Date()
      }
    });

    res.json({
      message: 'Ambulance location updated successfully',
      location: {
        latitude,
        longitude,
        address,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Track ambulance error:', error);
    res.status(500).json({ message: 'Server error updating ambulance location' });
  }
});

// Get emergency statistics
router.get('/stats/overview', auth, authorize('admin', 'emergency_responder'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Emergency.getStats(start, end);
    
    // Get current active emergencies
    const activeEmergencies = await Emergency.countDocuments({
      status: { $in: ['pending', 'dispatched', 'en_route', 'on_scene', 'transporting'] }
    });

    // Get available ambulances
    const availableAmbulances = await Ambulance.countDocuments({
      status: 'available',
      isActive: true
    });

    res.json({
      message: 'Emergency statistics retrieved successfully',
      stats: stats[0] || {
        totalEmergencies: 0,
        avgResponseTime: 0,
        severityBreakdown: [],
        statusBreakdown: []
      },
      activeEmergencies,
      availableAmbulances,
      period: {
        startDate: start,
        endDate: end
      }
    });

  } catch (error) {
    console.error('Get emergency stats error:', error);
    res.status(500).json({ message: 'Server error retrieving emergency statistics' });
  }
});

module.exports = router;