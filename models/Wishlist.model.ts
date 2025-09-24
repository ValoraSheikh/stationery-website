import mongoose, { Document, Model, Types } from "mongoose";

export interface IWishlistItem {
  productId: Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist {
  userId: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistItemDocument extends IWishlistItem, Document {}

export interface IWishlistDocument extends IWishlist, Document {
  items: Types.DocumentArray<IWishlistItemDocument>;
}

export type IWishlistModel = Model<IWishlistDocument>;

const wishlistItemSchema = new mongoose.Schema<IWishlistItem>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema<IWishlistDocument, IWishlistModel>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

const Wishlist: IWishlistModel =
  (mongoose.models.Wishlist as IWishlistModel) ||
  mongoose.model<IWishlistDocument, IWishlistModel>(
    "Wishlist",
    wishlistSchema
  );

export default Wishlist;
