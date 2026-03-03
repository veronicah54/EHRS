const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    required: [true, 'Ambulance type is required'],
    enum: ['basic', 'advanced', 'critical_care', 'air_ambulance']
  },
  status: {
    type: String,
    enum: ['available', 'dispatched', 'en_route', 'on_scene', 'transporting', 'out_of_service', 'maintenance'],
    default: 'available'
  },
  currentLocation: {
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    address: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  baseStation: {
    name: {
      type: String,
      required: [true, 'Base station name is required']
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  crew: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['driver', 'paramedic', 'emt', 'nurse', 'doctor'],
      required: true
    },
    shiftStart: Date,
    shiftEnd: Date
  }],
  equipment: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['medical', 'safety', 'communication', 'transport']
    },
    status: {
      type: String,
      enum: ['functional', 'needs_maintenance', 'out_of_order'],
      default: 'functional'
    },
    lastChecked: Date
  }],
  capacity: {
    patients: {
      type: Number,
      default: 1,
      min: 1
    },
    crew: {
      type: Number,
      default: 3,
      min: 2
    }
  },
  specifications: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String,
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid']
    },
    mileage: Number
  },
  maintenance: [{
    type: {
      type: String,
      enum: ['routine', 'repair', 'inspection', 'equipment_check']
    },
    description: String,
    scheduledDate: Date,
    completedDate: Date,
    cost: Number,
    performedBy: String,
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  }],
  currentAssignment: {
    emergency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Emergency'
    },
    assignedAt: Date,
    estimatedCompletion: Date
  },
  responseHistory: [{
    emergency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Emergency'
    },
    dispatchTime: Date,
    arrivalTime: Date,
    completionTime: Date,
    responseTime: Number, // in minutes
    distance: Number // in kilometers
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastServiceDate: Date,
  nextServiceDue: Date,
  insuranceExpiry: Date,
  registrationExpiry: Date
}, {
  timestamps: true
});

// Indexes for better query performance
ambulanceSchema.index({ status: 1 });
ambulanceSchema.index({ 'currentLocation.coordinates': '2dsphere' });
ambulanceSchema.index({ type: 1 });
ambulanceSchema.index({ 'baseStation.name': 1 });
ambulanceSchema.index({ isActive: 1 });

// Update location with timestamp
ambulanceSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.currentLocation = {
    coordinates: { latitude, longitude },
    address,
    lastUpdated: new Date()
  };
  return this.save();
};

// Check if ambulance is available for dispatch
ambulanceSchema.methods.isAvailableForDispatch = function() {
  return this.status === 'available' && 
         this.isActive && 
         this.crew.length >= 2 &&
         this.equipment.every(eq => eq.status === 'functional');
};

// Calculate distance to emergency location
ambulanceSchema.methods.calculateDistanceTo = function(targetCoordinates) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (targetCoordinates.latitude - this.currentLocation.coordinates.latitude) * Math.PI / 180;
  const dLon = (targetCoordinates.longitude - this.currentLocation.coordinates.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.currentLocation.coordinates.latitude * Math.PI / 180) * 
    Math.cos(targetCoordinates.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Estimate arrival time based on distance and traffic
ambulanceSchema.methods.estimateArrivalTime = function(targetCoordinates, averageSpeed = 60) {
  const distance = this.calculateDistanceTo(targetCoordinates);
  const timeInHours = distance / averageSpeed;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  const estimatedArrival = new Date();
  estimatedArrival.setMinutes(estimatedArrival.getMinutes() + timeInMinutes);
  
  return {
    distance,
    estimatedTime: timeInMinutes,
    estimatedArrival
  };
};

// Find nearest available ambulances
ambulanceSchema.statics.findNearest = function(coordinates, maxDistance = 50000, limit = 5) {
  return this.find({
    status: 'available',
    isActive: true,
    'currentLocation.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance
      }
    }
  }).limit(limit);
};

// Get ambulance performance statistics
ambulanceSchema.methods.getPerformanceStats = function(startDate, endDate) {
  return this.model('Emergency').aggregate([
    {
      $match: {
        assignedAmbulance: this._id,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalResponses: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        completedEmergencies: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Ambulance', ambulanceSchema);