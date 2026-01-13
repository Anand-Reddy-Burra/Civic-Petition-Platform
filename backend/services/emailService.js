import nodemailer from 'nodemailer';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail App Password
    }
  });
};

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a 6-digit numeric code as string
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Civix Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Civix Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Civix!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Digital Civic Engagement Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for registering with Civix! To complete your registration and start engaging with your community, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; font-size: 16px; display: inline-block; transition: background 0.3s;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, you can also copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This verification link will expire in 24 hours. If you didn't create an account with Civix, 
              please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send 6-digit code email
export const sendVerificationCodeEmail = async (email, name, code) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Civix Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Civix verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background:#f8f9fa;">
          <h2 style="margin:0 0 12px;color:#333;">Hi ${name},</h2>
          <p style="margin:0 0 16px;color:#555;">Use this code to verify your email address. It expires in 10 minutes.</p>
          <div style="text-align:center;">
            <div style="display:inline-block;font-size:28px;letter-spacing:6px;font-weight:700;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;color:#111;">
              ${code}
            </div>
          </div>
          <p style="margin:16px 0 0;color:#888;font-size:12px;">If you didn't request this, you can ignore this email.</p>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send password reset email with code
export const sendPasswordResetEmail = async (email, name, code) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Civix Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset My Password - Civix Platform',
      html: `
        <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f0; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Civix Branding at Top -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; background-color: #ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding-right: 6px; vertical-align: middle; line-height: 0;">
                    <img src="cid:logoPng" alt="Civix Logo" width="28" height="28" style="display: block; border: 0; outline: none; text-decoration: none;">
                  </td>
                  <td style="vertical-align: middle;">
                    <h1 style="color: #000000; font-size: 30px; font-weight: bold; margin: 0; line-height: 1.2; display: inline-block;">Civix</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content Section with Split Design -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Left Side - Orange Background (65%) -->
                  <td width="65%" style="background-color: #E8A75B; padding: 60px 40px; vertical-align: middle; position: relative; border-radius: 0 100px 100px 0;">
                    <div style="text-align: center;">
                      <h1 style="color: #000000; font-size: 28px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.2;">Reset Your Password</h1>
                      <p style="color: #000000; font-size: 16px; margin: 0 0 30px 0; line-height: 1.5;">This Code will expire in 30 minutes for your security.</p>
                    </div>
                  </td>
                  
                  <!-- Right Side - White Background with Content (35%) -->
                  <td width="35%" style="background-color: #ffffff; padding: 40px 30px; vertical-align: top;">
                    <p style="color: #232323; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; line-height: 1.5;">Hi ${name},</p>
                    <p style="color: #232323; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">We received a request to reset the password for your Civix account.</p>
                    <p style="color: #232323; font-size: 16px; margin: 0 0 24px 0; line-height: 1.6;">If this was you, please use the verification code below to reset your password:</p>
                    
                    <!-- Verification Code Display -->
                    <div style="text-align: center; margin: 30px 0;">
                      <div style="display: inline-block; font-size: 36px; letter-spacing: 2px; font-weight: 700; background-color: #F5F5F5; border: none; border-radius: 8px; padding: 20px 30px; color: #111111; min-width: 200px;">
                        ${code}
                      </div>
                    </div>
                    
                    <p style="color: #232323; font-size: 16px; margin: 24px 0 16px 0; line-height: 1.6;">This code will expire in 30 minutes for your security.</p>
                    <p style="color: #232323; font-size: 16px; margin: 16px 0 16px 0; line-height: 1.6;">Thank you for being part of Civix, where your voice matters in building stronger communities.</p>
                    <p style="color: #232323; font-size: 16px; margin: 24px 0 8px 0; line-height: 1.6;">Best regards,</p>
                    <p style="color: #232323; font-size: 16px; font-weight: bold; margin: 0; line-height: 1.6;">The Civix Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

      `,
      attachments: [
        {
          filename: 'favicon-32x32.png',
          path: path.resolve(__dirname, '../../frontend/public/favicon-32x32.png'),
          cid: 'logoPng'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Civix Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Civix - Email Verified!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Email Verified!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">You're all set to start engaging!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Great news! Your email has been successfully verified. You can now access all features of the Civix platform:
            </p>
            
            <ul style="color: #666; font-size: 16px; line-height: 1.8;">
              <li>📝 Create and sign petitions</li>
              <li>🗳️ Participate in polls and surveys</li>
              <li>📊 View community reports and data</li>
              <li>💬 Engage in civic discussions</li>
              <li>🏛️ Connect with local officials</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; font-size: 16px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Thank you for joining Civix and being part of the digital democracy movement!
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};
