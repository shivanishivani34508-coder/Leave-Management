/* =========================================================
   LEAVE CARRY-FORWARD POLICY
========================================================= */

const LEAVE_CARRY_FORWARD_POLICY = {
  casual: {
    annualAllocation: 12,
    maxCarryForward: 3,
  },

  sick: {
    annualAllocation: 12,
    maxCarryForward: 5,
  },

  earned: {
    annualAllocation: 18,
    maxCarryForward: 10,
  },

  marriage: {
    annualAllocation: 5,
    maxCarryForward: 0,
  },

  maternity: {
    annualAllocation: 182,
    maxCarryForward: 0,
  },

  paternity: {
    annualAllocation: 15,
    maxCarryForward: 0,
  },

  bereavement: {
    annualAllocation: 5,
    maxCarryForward: 0,
  },
};


/* =========================================================
   GET CARRY-FORWARD LIMIT
========================================================= */

const getCarryForwardLimit = (leaveType) => {
  return (
    LEAVE_CARRY_FORWARD_POLICY[leaveType]?.maxCarryForward ?? 0
  );
};


/* =========================================================
   GET LEAVE POLICY
========================================================= */

const getLeavePolicy = async (department) => {
  return {
    casual: LEAVE_CARRY_FORWARD_POLICY.casual.annualAllocation,
    sick: LEAVE_CARRY_FORWARD_POLICY.sick.annualAllocation,
    earned: LEAVE_CARRY_FORWARD_POLICY.earned.annualAllocation,
    marriage: LEAVE_CARRY_FORWARD_POLICY.marriage.annualAllocation,
    maternity: LEAVE_CARRY_FORWARD_POLICY.maternity.annualAllocation,
    paternity: LEAVE_CARRY_FORWARD_POLICY.paternity.annualAllocation,
    bereavement: LEAVE_CARRY_FORWARD_POLICY.bereavement.annualAllocation,
  };
};


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  LEAVE_CARRY_FORWARD_POLICY,
  getCarryForwardLimit,
  getLeavePolicy,
};