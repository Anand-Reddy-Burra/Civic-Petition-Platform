import express from 'express';
import User from '../models/User.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validateSignUp, validateSignIn } from '../middleware/validation.js';
import { generateVerificationToken, generateVerificationCode, sendVerificationEmail, sendVerificationCodeEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', validateSignUp, async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, location, role = 'public' } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // Generate 6-digit verification code and expiry
    const verificationCode = generateVerificationCode();
    const codeHash = (await import('crypto')).createHash('sha256').update(verificationCode).digest('hex');
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const user = new User({
      name,
      email,
      password,
      dateOfBirth,
      location,
      role,
      emailVerificationCodeHash: codeHash,
      emailVerificationCodeExpires: codeExpires
    });

    await user.save();

    // Send verification code email
    const emailResult = await sendVerificationCodeEmail(email, name, verificationCode);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still create user but log the error
    }

    // Generate JWT token (but user needs to verify email first)
    const token = generateToken(user._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Enter the 6-digit code sent to your email to verify your account.',
      data: {
        user: userResponse,
        token,
        emailVerified: user.emailVerified,
        verificationEmailSent: emailResult.success
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // Handle validation errors
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
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/signin
// @desc    Authenticate user and get token
// @access  Public
router.post('/signin', validateSignIn, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Sign in attempt:', { email, passwordLength: password?.length });

    // Find user and include password for comparison
    const user = await User.findByEmail(email).select('+password');
    
    console.log('👤 User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('📧 User email:', user.email);
      console.log('✅ User active:', user.isActive);
      console.log('🔐 Password hash exists:', !!user.password);
    }
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('❌ Email not verified');
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before signing in. Check your inbox for the verification link.',
        emailVerified: false
      });
    }

    // Check password
    console.log('🔐 Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password comparison failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken(user._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify user email with token
// @access  Public
router.post('/verify-email-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const cryptoModule = await import('crypto');
    const codeHash = cryptoModule.createHash('sha256').update(String(code)).digest('hex');

    // Find user with matching hash and not expired
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerified: false,
      emailVerificationCodeHash: codeHash,
      emailVerificationCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    user.emailVerified = true;
    user.emailVerificationCodeHash = undefined;
    user.emailVerificationCodeExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ success: false, message: 'Server error during code verification' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-email-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new code
    const cryptoModule = await import('crypto');
    const verificationCode = generateVerificationCode();
    user.emailVerificationCodeHash = cryptoModule
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');
    user.emailVerificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send verification code email
    const emailResult = await sendVerificationCodeEmail(email, user.name, verificationCode);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending verification email'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (clear token)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Clear the token cookie
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          dateOfBirth: user.dateOfBirth,
          location: user.location,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user data'
    });
  }
});

// @route   GET /api/auth/debug/users
// @desc    Debug endpoint to see all users (remove in production)
// @access  Public
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   POST /api/auth/debug/test-password
// @desc    Debug endpoint to test password comparison (remove in production)
// @access  Public
router.post('/debug/test-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const user = await User.findByEmail(email).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        isActive: user.isActive
      },
      passwordValid: isPasswordValid,
      passwordHash: user.password
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing password',
      error: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset - send verification code to email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.'
      });
    }

    // Generate 6-digit verification code
    const cryptoModule = await import('crypto');
    const verificationCode = generateVerificationCode();
    const codeHash = cryptoModule.createHash('sha256').update(verificationCode).digest('hex');
    const codeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save reset code to user
    user.passwordResetCodeHash = codeHash;
    user.passwordResetCodeExpires = codeExpires;
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, user.name, verificationCode);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify password reset code
// @access  Public
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const cryptoModule = await import('crypto');
    const codeHash = cryptoModule.createHash('sha256').update(String(code)).digest('hex');

    // Find user with matching hash and not expired
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCodeHash: codeHash,
      passwordResetCodeExpires: { $gt: new Date() }
    }).select('+passwordResetCodeHash +passwordResetCodeExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    res.json({
      success: true,
      message: 'Verification code is valid'
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during code verification'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password after verification
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code, and new password are required'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const cryptoModule = await import('crypto');
    const codeHash = cryptoModule.createHash('sha256').update(String(code)).digest('hex');

    // Find user with matching hash and not expired
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCodeHash: codeHash,
      passwordResetCodeExpires: { $gt: new Date() }
    }).select('+passwordResetCodeHash +passwordResetCodeExpires +password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetCodeHash = undefined;
    user.passwordResetCodeExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   GET /api/auth/check
// @desc    Check if user is authenticated
// @access  Public
router.get('/check', async (req, res) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.json({
        success: false,
        authenticated: false,
        message: 'No token provided'
      });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.json({
        success: false,
        authenticated: false,
        message: 'Invalid token or user not found'
      });
    }

    res.json({
      success: true,
      authenticated: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          dateOfBirth: user.dateOfBirth,
          location: user.location,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    res.json({
      success: false,
      authenticated: false,
      message: 'Invalid token'
    });
  }
});

export default router;
