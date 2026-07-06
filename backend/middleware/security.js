const rateLimit = require('express-rate-limit');

// Environment variable validator
function validateEnv() {
  console.log("🔒 Running environment variable validation...");
  
  if (!process.env.PORT) {
    console.warn("⚠️ PORT environment variable not set. Defaulting to 5000.");
  }
  
  // Guard JWT Secret
  const jwtSecret = process.env.JWT_SECRET;
  const isDefaultSecret = !jwtSecret || jwtSecret === 'sales_intel_secret_key_2026_jwt';
  
  if (isDefaultSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error("❌ CRITICAL SECURITY FAILURE: Default JWT secrets are blocked in production environments. Please define a unique JWT_SECRET in your env settings.");
      process.exit(1);
    } else {
      console.warn("⚠️ SECURITY WARNING: Using default JWT_SECRET. Secure this key before moving to production.");
    }
  }

  // Check Gemini API key configuration
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ CONFIGURATION WARNING: GEMINI_API_KEY is not defined. AI Agents will run in fallback rule-based mode.");
  }
  
  console.log("✅ Environment configuration successfully validated.");
}

// Rate limiter for authentication endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication requests from this IP. Please try again after 15 minutes." }
});

// Rate limiter for core API gateway endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 API gateway requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Rate limit reached. Please limit the speed of API requests." }
});

// Input payload validator for CRM customer list parsing
function validateCrmPayload(req, res, next) {
  if (req.method === 'POST') {
    const data = req.body.data;
    if (data && !Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid payload format. Customer data must be an array." });
    }
  }
  next();
}

// Global server error handling middleware
function errorHandler(err, req, res, next) {
  console.error('💥 Unhandled API Server Exception:', err.stack || err.message);
  
  const status = err.status || 500;
  const response = {
    message: err.message || "An unexpected internal server error occurred.",
    status
  };

  // Only expose details in non-production mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(status).json(response);
}

module.exports = {
  validateEnv,
  authLimiter,
  apiLimiter,
  validateCrmPayload,
  errorHandler
};
