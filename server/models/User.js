const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    casual: {
      type: Number,
      default: 12,
      min: 0,
    },

    sick: {
      type: Number,
      default: 12,
      min: 0,
    },

    earned: {
      type: Number,
      default: 18,
      min: 0,
    },

    marriage: {
      type: Number,
      default: 5,
      min: 0,
    },


    maternity: {
      type: Number,
      default: 182,
      min: 0,
    },

    paternity: {
      type: Number,
      default: 15,
      min: 0,
    },
    bereavement: {
      type: Number,
      default: 5,
      min: 0,
    },

    /* =====================================================
       CARRY FORWARD LEAVES
    ===================================================== */

    carryForward: {
      casual: {
        type: Number,
        default: 0,
        min: 0,
      },

      sick: {
        type: Number,
        default: 0,
        min: 0,
      },

      earned: {
        type: Number,
        default: 0,
        min: 0,
      },

      marriage: {
        type: Number,
        default: 0,
        min: 0,
      },

      maternity: {
        type: Number,
        default: 0,
        min: 0,
      },

      paternity: {
        type: Number,
        default: 0,
        min: 0,
      },

      bereavement: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    _id: false,
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

   role: {
  type: String,
  enum: [
    "admin",
    "employee",
    "manager",
    "departmentHead",
    "hr",
  ],
  default: "employee",
},

gender: {
  type: String,
  enum: ["Male", "Female", "Other"],
  required: true,
},

leaveBalances: {
  type: leaveBalanceSchema,
  default: () => ({}),
},

manager: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

departmentHead: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

department: {
  type: String,
  default: "",
},
    
  },
  {
    timestamps: true,
  }
);

console.log(
  "Leave Balance Schema:",
  leaveBalanceSchema.obj
);

console.log("Leave Balance Schema:", leaveBalanceSchema.obj);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);