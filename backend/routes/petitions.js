import express from 'express';
import Petition from '../models/Petition.js';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/petitions
// @desc    Get all petitions (with optional filtering)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      location,
      my,
      signed,
      search,
      approved,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Filter by user's petitions FIRST (show all petitions created by user, regardless of status)
    // This must come before other filters to ensure "My Petitions" shows all statuses including rejected
    if (my === 'true' && req.user) {
      query.createdBy = req.user._id;
      // Don't apply any status or approval filters for "my" tab
      // This allows users to see all their petitions including rejected
    } else {
      // Only apply these filters if NOT in "My Petitions" tab
      
      // Filter by status
      if (status && status !== 'all') {
        query.status = status;
        // Only officials can see rejected petitions
        if (status === 'rejected' && req.user?.role !== 'official') {
          query.status = { $ne: 'rejected' };
        }
      } else if (approved === 'true' || (approved === undefined && req.user?.role !== 'official')) {
        // For public users, only show active petitions by default
        query.status = 'active';
        query.isApproved = true;
        query.isActive = true;
      } else if (approved === 'false') {
        query.status = 'under_review';
        query.isApproved = false;
        query.isActive = true; // Only show active pending petitions
      } else if (!status && !approved) {
        // Default: exclude rejected and inactive petitions for public users
        if (req.user?.role !== 'official') {
          query.status = { $ne: 'rejected' };
          query.isActive = true;
        }
      }
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by location
    if (location && location !== 'all') {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by petitions user signed
    if (signed === 'true' && req.user) {
      query.signedBy = req.user._id;
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const petitions = await Petition.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Petition.countDocuments(query);

    res.json({
      success: true,
      data: {
        petitions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get petitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching petitions'
    });
  }
});

// @route   GET /api/petitions/:id
// @desc    Get single petition by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('signedBy', 'name email');

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    res.json({
      success: true,
      data: { petition }
    });
  } catch (error) {
    console.error('Get petition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching petition'
    });
  }
});

// @route   POST /api/petitions
// @desc    Create a new petition
// @access  Private (authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      goal,
      tags,
      closesOn
    } = req.body;

    // Validation
    if (!title || !description || !category || !location || !goal || !closesOn) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate goal - convert to number first
    const goalNum = typeof goal === 'string' ? parseInt(goal, 10) : Number(goal);
    if (isNaN(goalNum) || goalNum < 1 || !Number.isInteger(goalNum)) {
      return res.status(400).json({
        success: false,
        message: 'Goal must be a positive integer'
      });
    }

    // Validate closing date
    const closingDate = new Date(closesOn);
    if (isNaN(closingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use yyyy-mm-dd format.'
      });
    }
    
    if (closingDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Closing date must be in the future'
      });
    }

    // Process tags
    const processedTags = Array.isArray(tags) 
      ? tags.filter(tag => tag && tag.trim()).map(tag => tag.trim())
      : [];

    // Add location and creator name to tags
    // Ensure user name exists, fallback to email or 'User'
    const userName = req.user?.name || req.user?.email?.split('@')[0] || 'User';
    const finalTags = [
      category,
      location,
      `by ${userName}`
    ].concat(processedTags);

    const petition = new Petition({
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      goal: goalNum,
      tags: finalTags,
      closesOn: closingDate,
      createdBy: req.user._id,
      signatures: 0,
      isApproved: false, // Requires approval
      status: 'under_review' // Initial status
    });

    await petition.save();

    const populatedPetition = await Petition.findById(petition._id)
      .populate('createdBy', 'name email role location');
    
    // Convert to plain object to avoid virtual issues
    const petitionObj = populatedPetition.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (petitionObj.createdBy) {
      petitionObj.createdBy = {
        _id: petitionObj.createdBy._id,
        name: petitionObj.createdBy.name,
        email: petitionObj.createdBy.email,
        role: petitionObj.createdBy.role,
        location: petitionObj.createdBy.location
      };
    }

    res.status(201).json({
      success: true,
      message: 'Petition created successfully and submitted for review',
      data: { petition: petitionObj }
    });
  } catch (error) {
    console.error('Create petition error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
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

    // Return more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Server error while creating petition'
      : 'Server error while creating petition';

    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   POST /api/petitions/:id/sign
// @desc    Sign a petition
// @access  Private (authenticated users)
router.post('/:id/sign', authenticate, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    if (!petition.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Petition is not approved yet'
      });
    }

    if (petition.hasUserSigned(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already signed this petition'
      });
    }

    await petition.addSignature(req.user._id);

    const updatedPetition = await Petition.findById(petition._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const petitionObj = updatedPetition.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (petitionObj.createdBy) {
      petitionObj.createdBy = {
        _id: petitionObj.createdBy._id,
        name: petitionObj.createdBy.name,
        email: petitionObj.createdBy.email,
        role: petitionObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Petition signed successfully',
      data: { petition: petitionObj }
    });
  } catch (error) {
    console.error('Sign petition error:', error);
    
    if (error.message === 'User has already signed this petition' ||
        error.message === 'Petition is not approved yet') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while signing petition'
    });
  }
});

// @route   PUT /api/petitions/:id/approve
// @desc    Approve a petition (officials only)
// @access  Private (officials only)
router.put('/:id/approve', authenticate, authorize('official'), async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    petition.isApproved = true;
    petition.isActive = true;
    petition.status = 'active';
    await petition.save();

    const updatedPetition = await Petition.findById(petition._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const petitionObj = updatedPetition.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (petitionObj.createdBy) {
      petitionObj.createdBy = {
        _id: petitionObj.createdBy._id,
        name: petitionObj.createdBy.name,
        email: petitionObj.createdBy.email,
        role: petitionObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Petition approved successfully',
      data: { petition: petitionObj }
    });
  } catch (error) {
    console.error('Approve petition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving petition'
    });
  }
});

// @route   PUT /api/petitions/:id/reject
// @desc    Reject a petition (officials only)
// @access  Private (officials only)
router.put('/:id/reject', authenticate, authorize('official'), async (req, res) => {
  try {
    const { reason } = req.body;
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    petition.isApproved = false;
    petition.isActive = false;
    petition.status = 'rejected';
    petition.rejectionReason = reason || '';
    await petition.save();

    const updatedPetition = await Petition.findById(petition._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const petitionObj = updatedPetition.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (petitionObj.createdBy) {
      petitionObj.createdBy = {
        _id: petitionObj.createdBy._id,
        name: petitionObj.createdBy.name,
        email: petitionObj.createdBy.email,
        role: petitionObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Petition rejected successfully',
      data: { petition: petitionObj }
    });
  } catch (error) {
    console.error('Reject petition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting petition'
    });
  }
});

// @route   PUT /api/petitions/:id
// @desc    Update a petition (only by creator)
// @access  Private (authenticated users, creator only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Check if user is the creator
    if (petition.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own petitions'
      });
    }

    const {
      title,
      description,
      category,
      location,
      goal,
      tags,
      closesOn
    } = req.body;

    if (title) petition.title = title.trim();
    if (description !== undefined) petition.description = description.trim();
    if (category) petition.category = category;
    if (location) petition.location = location.trim();
    if (goal) {
      const goalNum = parseInt(goal);
      if (isNaN(goalNum) || goalNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Goal must be a positive number'
        });
      }
      petition.goal = goalNum;
    }
    if (tags !== undefined) {
      const processedTags = Array.isArray(tags) 
        ? tags.filter(tag => tag && tag.trim()).map(tag => tag.trim())
        : [];
      const userName = req.user?.name || req.user?.email?.split('@')[0] || 'User';
      petition.tags = [category || petition.category, location || petition.location, `by ${userName}`].concat(processedTags);
    }
    if (closesOn) {
      const closingDate = new Date(closesOn);
      if (closingDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Closing date must be in the future'
        });
      }
      petition.closesOn = closingDate;
    }

    // If petition was approved and is being updated, it needs re-approval
    if (petition.isApproved) {
      petition.isApproved = false;
    }

    await petition.save();

    const updatedPetition = await Petition.findById(petition._id)
      .populate('createdBy', 'name email role');
    
    // Convert to plain object to avoid virtual issues
    const petitionObj = updatedPetition.toObject({ virtuals: false });
    
    // Manually add createdBy info without virtuals
    if (petitionObj.createdBy) {
      petitionObj.createdBy = {
        _id: petitionObj.createdBy._id,
        name: petitionObj.createdBy.name,
        email: petitionObj.createdBy.email,
        role: petitionObj.createdBy.role
      };
    }

    res.json({
      success: true,
      message: 'Petition updated successfully. It will need re-approval.',
      data: { petition: petitionObj }
    });
  } catch (error) {
    console.error('Update petition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating petition'
    });
  }
});

// @route   DELETE /api/petitions/:id
// @desc    Delete a petition (only by creator or official)
// @access  Private (authenticated users)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Check if user is the creator or an official
    const isCreator = petition.createdBy.toString() === req.user._id.toString();
    const isOfficial = req.user.role === 'official';

    if (!isCreator && !isOfficial) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own petitions or must be an official'
      });
    }

    await petition.deleteOne();

    res.json({
      success: true,
      message: 'Petition deleted successfully'
    });
  } catch (error) {
    console.error('Delete petition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting petition'
    });
  }
});

export default router;

