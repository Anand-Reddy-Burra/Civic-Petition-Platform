// Environment configuration
export const config = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://infosys1807:Snia1955@cluster0.ar3btyr.mongodb.net/civix?appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080'
};
