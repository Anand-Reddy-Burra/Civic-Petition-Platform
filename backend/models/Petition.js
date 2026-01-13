import mongoose from 'mongoose';

const petitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Petition title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['education', 'healthcare', 'environment', 'infrastructure', 'safety', 'transportation', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  goal: {
    type: Number,
    required: [true, 'Signature goal is required'],
    min: [1, 'Goal must be at least 1'],
    max: [10000000, 'Goal cannot exceed 10 million']
  },
  signatures: {
    type: Number,
    default: 0,
    min: 0
  },
  signedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  trending: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false // Petitions need approval before going live
  },
  status: {
    type: String,
    enum: ['active', 'under_review', 'closed', 'rejected'],
    default: 'under_review',
    required: true
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  closesOn: {
    type: Date,
    required: [true, 'Closing date is required'],
    validate: {
      validator: function(value) {
        // Check if date is valid
        if (!value || isNaN(value.getTime())) {
          return false;
        }
        // Allow a small buffer (1 second) to account for timing differences
        return value > new Date(Date.now() - 1000);
      },
      message: 'Closing date must be a valid future date'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
petitionSchema.virtual('progressPercentage').get(function() {
  if (this.goal === 0) return 0;
  return Math.min(100, Math.round((this.signatures / this.goal) * 100));
});

// Virtual for days remaining
petitionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diff = this.closesOn - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Virtual for isClosed
petitionSchema.virtual('isClosed').get(function() {
  if (this.status === 'closed' || this.status === 'rejected') return true;
  const now = new Date();
  return this.closesOn <= now;
});

// Pre-save middleware to update status based on conditions
petitionSchema.pre('save', function(next) {
  const now = new Date();
  
  // If petition is rejected, set status to rejected
  if (!this.isActive && !this.isApproved) {
    this.status = 'rejected';
  }
  // If petition is approved and active, set status to active
  else if (this.isApproved && this.isActive) {
    // Check if closing date has passed
    if (this.closesOn <= now) {
      this.status = 'closed';
    } else {
      this.status = 'active';
    }
  }
  // If petition is not approved yet, set status to under_review
  else if (!this.isApproved) {
    this.status = 'under_review';
  }
  
  next();
});

// Indexes for better performance
petitionSchema.index({ createdBy: 1 });
petitionSchema.index({ category: 1 });
petitionSchema.index({ location: 1 });
petitionSchema.index({ isActive: 1, isApproved: 1 });
petitionSchema.index({ signatures: -1 });
petitionSchema.index({ createdAt: -1 });

// Method to check if user has signed
petitionSchema.methods.hasUserSigned = function(userId) {
  return this.signedBy.some(id => id.toString() === userId.toString());
};

// Method to add signature
petitionSchema.methods.addSignature = function(userId) {
  if (this.hasUserSigned(userId)) {
    throw new Error('User has already signed this petition');
  }

  if (!this.isApproved) {
    throw new Error('Petition is not approved yet');
  }

  this.signatures += 1;
  this.signedBy.push(userId);
  
  return this.save();
};

const Petition = mongoose.model('Petition', petitionSchema);

export default Petition;

