// Test script for email verification
import { sendVerificationEmail, sendWelcomeEmail } from './services/emailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('🧪 Testing email verification system...\n');

  // Check if email credentials are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials not set in .env file');
    console.log('Please add EMAIL_USER and EMAIL_PASS to your .env file');
    return;
  }

  console.log('✅ Email credentials found');
  console.log(`📧 From: ${process.env.EMAIL_USER}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}\n`);

  // Test verification email
  console.log('📤 Testing verification email...');
  const testEmail = 'test@example.com';
  const testName = 'Test User';
  const testToken = 'test-token-123';

  try {
    const result = await sendVerificationEmail(testEmail, testName, testToken);
    
    if (result.success) {
      console.log('✅ Verification email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Failed to send verification email');
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Error testing verification email:');
    console.log(error.message);
  }

  console.log('\n📤 Testing welcome email...');
  
  try {
    const result = await sendWelcomeEmail(testEmail, testName);
    
    if (result.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Failed to send welcome email');
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Error testing welcome email:');
    console.log(error.message);
  }

  console.log('\n🎉 Email test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Check your email inbox for the test emails');
  console.log('2. If emails are received, your setup is working!');
  console.log('3. If not, check your Gmail app password and .env file');
}

// Run the test
testEmail().catch(console.error);
