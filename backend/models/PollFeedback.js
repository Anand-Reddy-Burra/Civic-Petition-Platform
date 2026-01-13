import mongoose from 'mongoose';

const pollFeedbackSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Feedback reason is required'],
      trim: true,
      maxlength: [2000, 'Reason cannot exceed 2000 characters'],
    },
    improvements: {
      type: String,
      trim: true,
      maxlength: [2000, 'Improvements cannot exceed 2000 characters'],
    },
    concerns: {
      type: String,
      trim: true,
      maxlength: [2000, 'Concerns cannot exceed 2000 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },
    selectedOptionText: {
      type: String,
      trim: true,
      maxlength: [200, 'Selected option text cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

pollFeedbackSchema.index({ poll: 1, user: 1 }, { unique: true });

const PollFeedback = mongoose.model('PollFeedback', pollFeedbackSchema, 'pollfeedbacks');

export default PollFeedback;


