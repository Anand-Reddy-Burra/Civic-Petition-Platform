# Civix Backend - User Authentication System

This is the backend API for the Civix Digital Civic Engagement Platform, providing secure user authentication and management.

## Features

- ✅ User Registration (Sign Up)
- ✅ User Authentication (Sign In)
- ✅ JWT Token-based Authentication
- ✅ Secure Password Hashing with bcrypt
- ✅ Input Validation and Error Handling
- ✅ Rate Limiting for Security
- ✅ CORS Configuration
- ✅ MongoDB Integration
- ✅ Cookie-based Authentication
- ✅ Role-based Access Control

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/civix?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:8080
```

**Important:** Replace the MongoDB URI with your actual MongoDB Atlas connection string.

### 3. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### POST `/api/auth/signup`
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "dateOfBirth": "1990-01-01",
  "location": "New York",
  "role": "public"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "public",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "jwt-token-here"
  }
}
```

#### POST `/api/auth/signin`
Authenticate user and get token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "public",
      "lastLogin": "...",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "jwt-token-here"
  }
}
```

#### POST `/api/auth/logout`
Logout user (clear token)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/me`
Get current user information

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "public",
      "isActive": true,
      "lastLogin": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### GET `/api/auth/check`
Check authentication status

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "public"
    }
  }
}
```

### Health Check

#### GET `/api/health`
Check server status

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "environment": "development"
}
```

## Security Features

### Password Requirements
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

### CORS Configuration
- Configured for frontend URLs
- Credentials enabled for cookie authentication

### Input Validation
- Email format validation
- Password strength validation
- Age verification (minimum 13 years)
- Required field validation

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Database Schema

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, min 6 chars, hashed),
  dateOfBirth: Date (required, min age 13),
  location: String (required, max 100 chars),
  role: String (enum: ['public', 'official'], default: 'public'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  emailVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

The frontend components (`SignIn.tsx` and `SignUp.tsx`) have been updated to:

1. **Connect to the backend API** using the `authAPI` utility
2. **Handle form validation** with real-time error display
3. **Show loading states** during API calls
4. **Display success/error alerts** using the `showAlert` utility
5. **Store authentication data** in localStorage
6. **Navigate properly** after successful authentication

## Development Notes

- The server uses ES6 modules (`import/export`)
- MongoDB connection is established on server startup
- JWT tokens are set as HTTP-only cookies for security
- All passwords are hashed using bcrypt with salt rounds of 12
- The server includes graceful shutdown handling

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify your MongoDB URI is correct
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Check if your MongoDB cluster is running

2. **CORS Errors**
   - Verify the frontend URL in CORS configuration
   - Ensure credentials are included in requests

3. **Authentication Issues**
   - Check if JWT_SECRET is set in environment variables
   - Verify token expiration settings

4. **Rate Limiting**
   - If you hit rate limits during development, restart the server
   - Adjust rate limiting settings in `server.js` if needed

### Testing the API

You can test the API using tools like Postman or curl:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123","dateOfBirth":"1990-01-01","location":"Test City"}'
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure proper MongoDB connection string
4. Set up proper CORS origins
5. Use HTTPS for secure cookie transmission
6. Consider using a process manager like PM2
7. Set up proper logging and monitoring
