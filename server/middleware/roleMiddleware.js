const authorize = (...roles) => {
  return (req, res, next) => {
    console.log("================================");
    console.log("REQUEST:", req.method, req.originalUrl);
    console.log("Allowed Roles:", roles);
    console.log("User Role:", req.user?.role);
    console.log("================================");

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = {
  authorize,
};