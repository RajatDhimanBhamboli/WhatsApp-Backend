const jwt = require("jsonwebtoken");

const SecretKey = "HareKrishna";

const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    
    if (!token) return res.status(401).json({ message: "Access Denied. No token provided!" });

    try {
        const decoded = jwt.verify(token, SecretKey);
        req.user = decoded; 
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token!" });
    }
};

module.exports = verifyToken;
