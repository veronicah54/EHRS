const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  timeSlot: {
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required']
    }
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  symptoms: [String],
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow_up', 'emergency', 'routine_checkup', 'vaccination'],
    default: 'consultation'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    doctorNotes: String,
    patientNotes: String,
    prescriptions: [{
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    diagnosis: String,
    followUpRequired: Boolean,
    followUpDate: Date
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'mobile_money']
    },
    transactionId: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    }
  }],
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'admin']
    },
    reason: String,
    cancelledAt: Date,
    refundAmount: Number
  },
  rating: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    patientFeedback: String,
    doctorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    doctorFeedback: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ priority: 1 });

// Validate that appointment time doesn't conflict with existing appointments
appointmentSchema.pre('save', async function(next) {
  if (!this.isModified('appointmentDate') && !this.isModified('timeSlot')) {
    return next();
  }
  
  const conflictingAppointment = await this.constructor.findOne({
    doctor: this.doctor,
    appointmentDate: {
      $gte: new Date(this.appointmentDate.toDateString()),
      $lt: new Date(new Date(this.appointmentDate.toDateString()).getTime() + 24 * 60 * 60 * 1000)
    },
    'timeSlot.startTime': this.timeSlot.startTime,
    status: { $nin: ['cancelled', 'no_show'] },
    _id: { $ne: this._id }
  });
  
  if (conflictingAppointment) {
    const error = new Error('Time slot is already booked');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

// Calculate appointment duration
appointmentSchema.virtual('duration').get(function() {
  if (!this.timeSlot.startTime || !this.timeSlot.endTime) return 0;
  
  const start = new Date(`2000-01-01 ${this.timeSlot.startTime}`);
  const end = new Date(`2000-01-01 ${this.timeSlot.endTime}`);
  
  return (end - start) / (1000 * 60); // duration in minutes
});

// Check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentTime = new Date(`${this.appointmentDate.toDateString()} ${this.timeSlot.startTime}`);
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  return hoursUntilAppointment >= 24 && ['scheduled', 'confirmed'].includes(this.status);
};

// Send reminder notifications
appointmentSchema.methods.sendReminder = async function(type = 'email') {
  // Implementation would depend on notification service
  this.reminders.push({
    type,
    sentAt: new Date(),
    status: 'sent'
  });
  
  await this.save();
};

module.exports = mongoose.model('Appointment', appointmentSchema);