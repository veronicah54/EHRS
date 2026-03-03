const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emergencyType: {
    type: String,
    required: [true, 'Emergency type is required'],
    enum: [
      'cardiac_arrest',
      'stroke',
      'severe_bleeding',
      'breathing_difficulty',
      'unconsciousness',
      'severe_pain',
      'allergic_reaction',
      'poisoning',
      'burns',
      'fracture',
      'accident',
      'other'
    ]
  },
  severity: {
    type: String,
    required: [true, 'Severity level is required'],
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  symptoms: {
    type: [String],
    required: [true, 'Symptoms are required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        required: true,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    landmark: String
  },
  contactInfo: {
    primaryPhone: {
      type: String,
      required: [true, 'Primary phone is required']
    },
    alternatePhone: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'en_route', 'on_scene', 'transporting', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedAmbulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance'
  },
  assignedResponders: [{
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['paramedic', 'emt', 'driver', 'doctor']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  estimatedArrival: Date,
  actualArrival: Date,
  responseTime: Number, // in minutes
  hospitalDestination: {
    name: String,
    address: String,
    phone: String,
    estimatedArrival: Date
  },
  medicalInfo: {
    vitals: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      oxygenSaturation: Number,
      respiratoryRate: Number
    },
    consciousness: {
      type: String,
      enum: ['alert', 'verbal', 'pain', 'unresponsive']
    },
    allergies: [String],
    medications: [String],
    medicalHistory: [String],
    treatmentGiven: [String]
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  images: [String], // URLs to uploaded images
  audio: String, // URL to audio recording if any
  isActive: {
    type: Boolean,
    default: true
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
emergencySchema.index({ status: 1 });
emergencySchema.index({ severity: 1 });
emergencySchema.index({ priority: -1 });
emergencySchema.index({ 'location.coordinates': '2dsphere' });
emergencySchema.index({ createdAt: -1 });
emergencySchema.index({ patient: 1 });

// Calculate response time when status changes to 'on_scene'
emergencySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'on_scene' && !this.responseTime) {
    const createdTime = this.createdAt || new Date();
    const currentTime = new Date();
    this.responseTime = Math.round((currentTime - createdTime) / (1000 * 60)); // in minutes
  }
  next();
});

// Add timeline entry when status changes
emergencySchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

// Calculate priority based on severity and emergency type
emergencySchema.methods.calculatePriority = function() {
  const severityWeights = {
    'critical': 5,
    'high': 4,
    'medium': 3,
    'low': 2
  };
  
  const typeWeights = {
    'cardiac_arrest': 5,
    'stroke': 5,
    'severe_bleeding': 4,
    'breathing_difficulty': 4,
    'unconsciousness': 4,
    'severe_pain': 3,
    'allergic_reaction': 3,
    'poisoning': 4,
    'burns': 3,
    'fracture': 2,
    'accident': 3,
    'other': 2
  };
  
  const severityScore = severityWeights[this.severity] || 3;
  const typeScore = typeWeights[this.emergencyType] || 2;
  
  this.priority = Math.min(5, Math.max(1, Math.round((severityScore + typeScore) / 2)));
};

// Find nearby emergencies
emergencySchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: { $in: ['pending', 'dispatched', 'en_route'] }
  });
};

// Get emergency statistics
emergencySchema.statics.getStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalEmergencies: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        severityBreakdown: {
          $push: '$severity'
        },
        statusBreakdown: {
          $push: '$status'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Emergency', emergencySchema);