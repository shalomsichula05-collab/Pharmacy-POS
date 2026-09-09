//check whether the user is authenticated or not
const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token or session expired" });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Administrator access required"
        });
    }

    next();
}

module.exports = {
    authenticate,
    requireAdmin
};
