import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [200, 'Option text cannot exceed 200 characters']
  },
  votes: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: true });

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Poll question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  options: {
    type: [pollOptionSchema],
    required: [true, 'Poll must have at least 2 options'],
    validate: {
      validator: function(options) {
        return options && options.length >= 2;
      },
      message: 'Poll must have at least 2 options'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['infrastructure', 'education', 'healthcare', 'environment', 'safety', 'transportation', 'Parks & Recreation', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  closesOn: {
    type: Date,
    required: [true, 'Closing date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Closing date must be in the future'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
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
    default: false // Polls need approval before going live
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
  isClosed: {
    type: Boolean,
    default: false
  },
  // Feedback from voters
  feedback: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reason: {
        type: String,
        required: [true, 'Feedback reason is required'],
        trim: true,
        maxlength: [2000, 'Reason cannot exceed 2000 characters']
      },
      improvements: {
        type: String,
        trim: true,
        maxlength: [2000, 'Improvements cannot exceed 2000 characters']
      },
      concerns: {
        type: String,
        trim: true,
        maxlength: [2000, 'Concerns cannot exceed 2000 characters']
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 4
      },
      selectedOptionText: {
        type: String,
        trim: true,
        maxlength: [200, 'Selected option text cannot exceed 200 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total votes
pollSchema.virtual('totalVotes').get(function() {
  return this.options.reduce((sum, option) => sum + (option.votes || 0), 0);
});

// Virtual for days remaining
pollSchema.virtual('daysRemaining').get(function() {
  if (this.isClosed) return 0;
  const now = new Date();
  const diff = this.closesOn - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Indexes for better performance
pollSchema.index({ createdBy: 1 });
pollSchema.index({ category: 1 });
pollSchema.index({ location: 1 });
pollSchema.index({ closesOn: 1 });
pollSchema.index({ isActive: 1, isClosed: 1 });
pollSchema.index({ createdAt: -1 });

// Method to check if user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  return this.votedBy.some(id => id.toString() === userId.toString());
};

// Method to add vote
pollSchema.methods.addVote = function(optionId, userId) {
  if (this.isClosed) {
    throw new Error('Poll is closed');
  }
  
  if (this.hasUserVoted(userId)) {
    throw new Error('User has already voted');
  }

  const option = this.options.id(optionId);
  if (!option) {
    throw new Error('Option not found');
  }

  option.votes += 1;
  this.votedBy.push(userId);
  
  // Update progress (10% per vote, capped at 100%)
  this.progress = Math.min(100, this.progress + 10);
  
  return this.save();
};

// Pre-save middleware to check if poll should be closed
pollSchema.pre('save', function(next) {
  if (this.closesOn && this.closesOn <= new Date() && !this.isClosed) {
    this.isClosed = true;
    if (this.status === 'active') {
      this.status = 'closed';
    }
  }
  next();
});

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;

