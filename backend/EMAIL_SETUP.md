# Email Verification Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Gmail App Password Setup
1. Go to your Google Account settings
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Go to **App passwords** → **Generate app password**
4. Select **Mail** and **Other (Custom name)**
5. Name it "Civix Platform" and copy the 16-character password

### Step 2: Update Environment Variables
Edit your `.env` file in the backend folder:

```env
# Email Configuration (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### Step 3: Test the Setup
1. Start your backend server: `npm run dev`
2. Register a new user via API or frontend
3. Check your email for verification link
4. Click the link to verify

## 📧 How It Works

### Registration Flow:
1. User registers → Account created with `emailVerified: false`
2. Verification email sent automatically
3. User clicks link → Email verified → Welcome email sent
4. User can now sign in

### Sign In Flow:
1. User tries to sign in
2. System checks if email is verified
3. If not verified → Shows error message
4. If verified → Normal login process

## 🔧 API Endpoints

### New Endpoints Added:
- `GET /api/auth/verify-email?token=xxx` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email

### Updated Endpoints:
- `POST /api/auth/signup` - Now sends verification email
- `POST /api/auth/signin` - Now checks email verification

## 🎨 Email Templates

The system includes beautiful HTML email templates:
- **Verification Email**: Professional design with verification button
- **Welcome Email**: Confirmation after successful verification

## 🚨 Troubleshooting

### Common Issues:
1. **"Invalid login credentials"** → Check if email is verified
2. **Email not sending** → Verify Gmail app password
3. **Token expired** → Use resend verification endpoint

### Testing:
```bash
# Test verification email sending
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🔒 Security Features

- Verification tokens expire after 24 hours
- Tokens are cleared after successful verification
- Rate limiting on resend verification
- Secure token generation using crypto

## 📱 Frontend Integration

Your frontend should handle:
1. Show "Check your email" message after registration
2. Handle verification success/error states
3. Provide "Resend verification" option
4. Check `emailVerified` status before allowing login

## 🎯 Production Notes

- Replace Gmail with professional email service (SendGrid, Mailgun)
- Use environment-specific email templates
- Add email delivery monitoring
- Consider email queue for high volume
