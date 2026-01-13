#!/bin/bash

# Civix Backend Setup Script
echo "🚀 Setting up Civix Backend Authentication System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Database Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/civix?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:8080
EOL
    echo "✅ .env file created"
    echo "⚠️  Please update the MONGODB_URI in .env with your actual MongoDB connection string"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the MONGODB_URI in backend/.env with your MongoDB Atlas connection string"
echo "2. Start the backend server: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm run dev"
echo ""
echo "🔗 API will be available at: http://localhost:5000/api"
echo "🔗 Health check: http://localhost:5000/api/health"
echo ""
echo "📚 For detailed setup instructions, see backend/README.md"
