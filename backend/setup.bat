@echo off
REM Civix Backend Setup Script for Windows
echo 🚀 Setting up Civix Backend Authentication System...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Navigate to backend directory
cd backend

REM Install dependencies
echo 📦 Installing backend dependencies...
npm install

if %errorlevel% equ 0 (
    echo ✅ Backend dependencies installed successfully
) else (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Database Configuration
        echo MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/civix?retryWrites=true^&w=majority
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-%RANDOM%
        echo JWT_EXPIRE=7d
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # CORS Configuration
        echo FRONTEND_URL=http://localhost:8080
    ) > .env
    echo ✅ .env file created
    echo ⚠️  Please update the MONGODB_URI in .env with your actual MongoDB connection string
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎉 Backend setup complete!
echo.
echo 📋 Next steps:
echo 1. Update the MONGODB_URI in backend/.env with your MongoDB Atlas connection string
echo 2. Start the backend server: cd backend ^&^& npm run dev
echo 3. Start the frontend: cd frontend ^&^& npm run dev
echo.
echo 🔗 API will be available at: http://localhost:5000/api
echo 🔗 Health check: http://localhost:5000/api/health
echo.
echo 📚 For detailed setup instructions, see backend/README.md
pause
