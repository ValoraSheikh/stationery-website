import mongoose, { Document, Model } from "mongoose";

export interface IContact {
  name: string;
  email: string;
  phoneNo?: number;
  subject: string;
  message: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactDocument extends IContact, Document {}
export type IContactModel = Model<IContactDocument>;

const contactSchema = new mongoose.Schema<IContactDocument, IContactModel>(
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
      lowercase: true,
    },
    phoneNo: {
      type: Number,
      trim: true,
      minlength: [10, 'Phone no. must be 10 character']
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [10, "Message must be at least 10 characters long"],
    },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

const Contact: IContactModel =
  (mongoose.models.Contact as IContactModel) ||
  mongoose.model<IContactDocument, IContactModel>("Contact", contactSchema);

export default Contact;
