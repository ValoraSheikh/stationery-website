import { Schema, model, models, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  name: string;
  email: string;
  password?: string;
  provider: "credentials" | "google";
  role: "user" | "admin";
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

// Extend the interface for instance methods
export interface IUserMethods {
  updateLastActive(): Promise<this>;
  comparePassword(password: string): Promise<boolean>;
}

// Create a type that combines the interface with Mongoose Document
export interface IUserDocument extends IUser, IUserMethods, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function (this: IUserDocument) {
        return this.provider === "credentials";
      },
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String, // Used by NextAuth (Google login etc)
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("save", async function (this: IUserDocument, next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  next();
});

userSchema.methods.updateLastActive = async function (this: IUserDocument) {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.comparePassword = async function (
  this: IUserDocument,
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    return false; // No password set (likely OAuth user)
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.pre("save", function (this: IUserDocument, next) {
  if (!this.isNew) {
    this.lastActive = new Date();
  }
  next();
});

const User = models?.User || model<IUserDocument>("User", userSchema);
export default User;
