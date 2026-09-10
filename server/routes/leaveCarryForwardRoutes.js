const express = require("express");

const router =
  express.Router();

const {
  processYearEndCarryForward,
} = require(
  "../controllers/leaveCarryForwardController"
);

const protect =
  require(
    "../middleware/authMiddleware"
  ).protect;

const authorize =
  require(
    "../middleware/roleMiddleware"
  ).authorize;


/* =========================================================
   PROCESS YEAR-END CARRY FORWARD

   ADMIN / HR ONLY
========================================================= */

router.post(
  "/process",
  protect,
  authorize("admin", "hr"),
  processYearEndCarryForward
);


module.exports = router;