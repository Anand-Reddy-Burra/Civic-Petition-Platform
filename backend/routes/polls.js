import express from 'express';
import Poll from '../models/Poll.js';
import PollFeedback from '../models/PollFeedback.js';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/polls
// @desc    Get all polls (with optional filtering)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      location,
      active,
      my,
      voted,
      closed,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by user's polls FIRST (show all polls created by user, regardless of status)
    // This must come before other filters to ensure "My Polls" shows all statuses
    if (my === 'true' && req.user) {
      query.createdBy = req.user._id;
      // Don't apply any status or approval filters for "my" tab
      // This allows users to see all their polls including under_review
    } else {
      // Only apply these filters if NOT in "My Polls" tab
      
      // Filter by status
      if (active === 'true') {
        query.isClosed = false;
        query.isActive = true;
        query.isApproved = true;
        query.status = 'active';
      }

      if (closed === 'true') {
        query.isClosed = true;
      }
      
      // Filter by status
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      // For non-officials, only show approved polls
      if (!req.user || req.user.role !== 'official') {
        query.isApproved = true;
        query.status = { $ne: 'rejected' };
      }
    }

    // Filter by polls user voted on
    if (voted === 'true' && req.user) {
      query.votedBy = req.user._id;
    }

    // Search in question and description
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const polls = await Poll.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Poll.countDocuments(query);

    res.json({
      success: true,
      data: {
        polls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching polls'
    });
  }
});

// @route   GET /api/polls/:id
// @desc    Get single poll by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('votedBy', 'name email');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      data: { poll }
    });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching poll'
    });
  }
});

// @route   POST /api/polls
// @desc    Create a new poll
// @access  Private (authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      question,
      description,
      options,
      category,
      location,
      closesOn
    } = req.body;

    // Validation
    if (!question || !options || !category || !location || !closesOn) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Poll must have at least 2 options'
      });
    }

    // Validate options
    const validOptions = options
      .filter(opt => opt && opt.trim())
      .map(opt => ({
        text: typeof opt === 'string' ? opt.trim() : opt.text?.trim(),
        votes: 0
      }));

    if (validOptions.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Poll must have at least 2 valid options'
      });
    }

    // Validate closing date
    const closingDate = new Date(closesOn);
    if (closingDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Closing date must be in the future'
      });
    }

    const poll = new Poll({
      question: question.trim(),
      description: description?.trim() || '',
      options: validOptions,
      category,
      location: location.trim(),
      closesOn: closingDate,
      createdBy: req.user._id,
      progress: 0,
      status: 'under_review',
      isApproved: false,
      isActive: false
    });

    await poll.save();

    const populatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const pollObj = populatedPoll.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (pollObj.createdBy) {
      pollObj.createdBy = {
        _id: pollObj.createdBy._id,
        name: pollObj.createdBy.name,
        email: pollObj.createdBy.email,
        role: pollObj.createdBy.role
      };
    }

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: { poll: pollObj }
    });
  } catch (error) {
    console.error('Create poll error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating poll'
    });
  }
});

// @route   POST /api/polls/:id/vote
// @desc    Vote on a poll
// @access  Private (authenticated users)
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const { optionId } = req.body;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }

    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (poll.isClosed) {
      return res.status(400).json({
        success: false,
        message: 'Poll is closed'
      });
    }

    if (poll.hasUserVoted(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this poll'
      });
    }

    await poll.addVote(optionId, req.user._id);

    const updatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const pollObj = updatedPoll.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (pollObj.createdBy) {
      pollObj.createdBy = {
        _id: pollObj.createdBy._id,
        name: pollObj.createdBy.name,
        email: pollObj.createdBy.email,
        role: pollObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: { poll: pollObj }
    });
  } catch (error) {
    console.error('Vote error:', error);
    
    if (error.message === 'Poll is closed' || 
        error.message === 'User has already voted' ||
        error.message === 'Option not found') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while recording vote'
    });
  }
});

// @route   POST /api/polls/:id/feedback
// @desc    Submit feedback for a poll (only voters can submit; one entry per user)
// @access  Private (authenticated users)
router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const { reason, improvements, concerns, rating, selectedOptionText } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for feedback is required'
      });
    }

    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Only users who voted on this poll can submit feedback
    if (!poll.hasUserVoted(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You must vote on this poll before submitting feedback'
      });
    }

    // Normalise rating
    let safeRating = Number(rating) || 4;
    if (safeRating < 1) safeRating = 1;
    if (safeRating > 5) safeRating = 5;

    const trimmedReason = reason.trim();
    const trimmedImprovements = improvements?.trim() || '';
    const trimmedConcerns = concerns?.trim() || '';
    const trimmedSelectedOptionText = selectedOptionText?.trim() || '';

    const update = {
      poll: poll._id,
      user: req.user._id,
      reason: trimmedReason,
      improvements: trimmedImprovements,
      concerns: trimmedConcerns,
      rating: safeRating,
      selectedOptionText: trimmedSelectedOptionText || undefined
    };

    // Upsert into pollfeedbacks collection (one per poll+user)
    await PollFeedback.findOneAndUpdate(
      { poll: poll._id, user: req.user._id },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Submit poll feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback'
    });
  }
});

// @route   GET /api/polls/:id/feedback
// @desc    Get feedback for a poll
//          Visible to: voters of this poll, poll author, and officials only
// @access  Private (authenticated users)
router.get('/:id/feedback', authenticate, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate(
      'createdBy',
      'name email role'
    );

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const isAuthor =
      poll.createdBy &&
      poll.createdBy._id.toString() === req.user._id.toString();
    const isOfficial = req.user.role === 'official';
    const hasVoted = poll.hasUserVoted(req.user._id);

    if (!isAuthor && !isOfficial && !hasVoted) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to view feedback for this poll'
      });
    }

    const feedbackDocs = await PollFeedback.find({ poll: poll._id })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        feedback: feedbackDocs
      }
    });
  } catch (error) {
    console.error('Get poll feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching poll feedback'
    });
  }
});

// @route   PUT /api/polls/:id
// @desc    Update a poll (only by creator)
// @access  Private (authenticated users, creator only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if user is the creator
    if (poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own polls'
      });
    }

    const {
      question,
      description,
      category,
      location,
      closesOn
    } = req.body;

    if (question) poll.question = question.trim();
    if (description !== undefined) poll.description = description.trim();
    if (category) poll.category = category;
    if (location) poll.location = location.trim();
    if (closesOn) {
      const closingDate = new Date(closesOn);
      if (closingDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Closing date must be in the future'
        });
      }
      poll.closesOn = closingDate;
    }

    // If poll was approved and is being updated, it needs re-approval
    if (poll.isApproved) {
      poll.isApproved = false;
      poll.status = 'under_review';
      poll.isActive = false;
    }

    await poll.save();

    const updatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const pollObj = updatedPoll.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (pollObj.createdBy) {
      pollObj.createdBy = {
        _id: pollObj.createdBy._id,
        name: pollObj.createdBy.name,
        email: pollObj.createdBy.email,
        role: pollObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Poll updated successfully',
      data: { poll: pollObj }
    });
  } catch (error) {
    console.error('Update poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating poll'
    });
  }
});

// @route   PUT /api/polls/:id/approve
// @desc    Approve a poll (officials only)
// @access  Private (officials only)
router.put('/:id/approve', authenticate, authorize('official'), async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    poll.isApproved = true;
    poll.isActive = true;
    poll.status = 'active';
    await poll.save();

    const updatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const pollObj = updatedPoll.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (pollObj.createdBy) {
      pollObj.createdBy = {
        _id: pollObj.createdBy._id,
        name: pollObj.createdBy.name,
        email: pollObj.createdBy.email,
        role: pollObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Poll approved successfully',
      data: { poll: pollObj }
    });
  } catch (error) {
    console.error('Approve poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving poll'
    });
  }
});

// @route   PUT /api/polls/:id/reject
// @desc    Reject a poll (officials only)
// @access  Private (officials only)
router.put('/:id/reject', authenticate, authorize('official'), async (req, res) => {
  try {
    const { reason } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    poll.isApproved = false;
    poll.isActive = false;
    poll.status = 'rejected';
    poll.rejectionReason = reason || '';
    await poll.save();

    const updatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const pollObj = updatedPoll.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (pollObj.createdBy) {
      pollObj.createdBy = {
        _id: pollObj.createdBy._id,
        name: pollObj.createdBy.name,
        email: pollObj.createdBy.email,
        role: pollObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Poll rejected successfully',
      data: { poll: pollObj }
    });
  } catch (error) {
    console.error('Reject poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting poll'
    });
  }
});

// @route   DELETE /api/polls/:id
// @desc    Delete a poll (only by creator or official)
// @access  Private (authenticated users)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if user is the creator or an official
    const isCreator = poll.createdBy.toString() === req.user._id.toString();
    const isOfficial = req.user.role === 'official';

    if (!isCreator && !isOfficial) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own polls or must be an official'
      });
    }

    await poll.deleteOne();

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting poll'
    });
  }
});

export default router;

