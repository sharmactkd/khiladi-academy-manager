import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  decryptSensitiveValue,
  encryptSensitiveValue,
} from "../utils/fieldEncryption.js";

const refreshTokenSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      default: () => crypto.randomUUID(),
    },
    tokenHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    rotatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "academy_owner",
        "assistant_coach",
        "parent",
        "student",
      ],
      default: "academy_owner",
      index: true,
    },

    loginProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
      default: undefined,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
      default: undefined,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspensionReason: {
      type: String,
      default: "",
      trim: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    failedLoginAttempts: {
      type: Number,
      select: false,
      default: 0,
      min: 0,
    },

    lockedUntil: {
      type: Date,
      select: false,
      default: null,
    },

    mfaEnabled: {
      type: Boolean,
      default: false,
    },

    mfaSecret: {
      type: String,
      select: false,
      default: "",
      set: encryptSensitiveValue,
      get: decryptSensitiveValue,
    },

    mfaRecoveryCodes: {
      type: [String],
      select: false,
      default: [],
    },

    refreshTokens: {
      type: [refreshTokenSessionSchema],
      default: [],
    },

    passwordResetToken: {
      type: String,
      select: false,
      default: undefined,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
      default: undefined,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("validate", function () {
  if (!this.email && !this.phone && this.loginProvider === "local") {
    this.invalidate("email", "Email or phone is required");
    this.invalidate("phone", "Email or phone is required");
  }

  if (this.loginProvider === "local" && !this.password) {
    this.invalidate("password", "Password is required");
  }
});

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLoginLocked = function () {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

userSchema.methods.createSafeResponse = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    loginProvider: this.loginProvider,
    profilePicture: this.profilePicture,
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified,
    isActive: this.isActive,
    isSuspended: this.isSuspended,
    mfaEnabled: this.mfaEnabled,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.methods.cleanExpiredRefreshTokens = function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(
    (session) => session.expiresAt > now
  );
};

const User = mongoose.model("User", userSchema);

export default User;
