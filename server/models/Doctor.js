const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    enum: [
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
    ]
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Years of experience cannot be negative']
  },
  education: [{
    degree: String,
    institution: String,
    graduationYear: Number
  }],
  certifications: [String],
  hospital: {
    name: String,
    address: String,
    phone: String
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String, // Format: "09:00"
    endTime: String,   // Format: "17:00"
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  timeSlotDuration: {
    type: Number,
    default: 30, // minutes
    min: [15, 'Time slot duration must be at least 15 minutes']
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isAcceptingPatients: {
    type: Boolean,
    default: true
  },
  emergencyAvailable: {
    type: Boolean,
    default: false
  },
  languages: [String],
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ 'hospital.name': 1 });
doctorSchema.index({ isAcceptingPatients: 1 });
doctorSchema.index({ emergencyAvailable: 1 });
doctorSchema.index({ 'rating.average': -1 });

// Update rating when a new review is added
doctorSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
};

// Get available time slots for a specific date
doctorSchema.methods.getAvailableSlots = function(date) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayAvailability = this.availability.find(av => av.day === dayName && av.isAvailable);
  
  if (!dayAvailability) return [];
  
  const slots = [];
  const startTime = new Date(`${date.toDateString()} ${dayAvailability.startTime}`);
  const endTime = new Date(`${date.toDateString()} ${dayAvailability.endTime}`);
  
  let currentTime = new Date(startTime);
  while (currentTime < endTime) {
    slots.push(currentTime.toTimeString().slice(0, 5));
    currentTime.setMinutes(currentTime.getMinutes() + this.timeSlotDuration);
  }
  
  return slots;
};

module.exports = mongoose.model('Doctor', doctorSchema);