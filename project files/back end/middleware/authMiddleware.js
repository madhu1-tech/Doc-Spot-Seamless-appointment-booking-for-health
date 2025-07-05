const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).send({ message: "No Token", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("🧠 Auth Middleware -> User ID:", decoded.id);

    next();
  } catch (error) {
    return res.status(401).send({ message: "Invalid Token", success: false });
  }
};

module.exports = authMiddleware;
