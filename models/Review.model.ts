import mongoose, { Document, Model, Types } from "mongoose";

export interface IReview {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  rating: number;
  text: string;
  date: Date;
}

export interface IReviewDocument extends IReview, Document {}

export type IReviewModel = Model<IReviewDocument>;

const reviewSchema = new mongoose.Schema<IReviewDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Review: IReviewModel =
  (mongoose.models.Review as IReviewModel) ||
  mongoose.model<IReviewDocument, IReviewModel>("Review", reviewSchema);

export default Review;
