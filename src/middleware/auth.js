const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if header exists and starts with "Bearer"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // 2. Verify using your local SECRET (matches your register/login controllers)
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      // 'jwt expired' or 'invalid signature' will trigger this
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 3. Attach the decoded payload (id, email, role) to the request
    req.user = decoded;
    next();
  });
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user.role comes from the token payload we signed during login
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

module.exports = { authenticate, restrictTo };
