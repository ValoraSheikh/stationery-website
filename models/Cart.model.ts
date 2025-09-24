import mongoose, { Document, Model, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
  priceAtAdd?: number;
}

export interface ICart {
  userId?: Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  shippingCost: number;
  totalAmount: number;
  taxAmount?: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItemDocument extends ICartItem, Document {}

export interface ICartDocument extends ICart, Document {
  items: Types.DocumentArray<ICartItemDocument>;
}

export type ICartModel = Model<ICartDocument>

const cartItemSchema = new mongoose.Schema<ICartItem>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    priceAtAdd: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema<ICartDocument, ICartModel>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    sessionId: {
      type: String,
      required: function (this: ICartDocument) {
        return !this.userId;
      },
    },
    items: [cartItemSchema],
    shippingCost: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

cartSchema.pre<ICartDocument>("save", function (next) {
  this.totalAmount =
    this.items.reduce(
      (sum: number, item: ICartItemDocument) =>
        sum + item.quantity * (item.priceAtAdd || 0),
      0
    ) +
    this.shippingCost +
    (this.taxAmount || 0);
  next();
});

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart: ICartModel =
  (mongoose.models.Cart as ICartModel) ||
  mongoose.model<ICartDocument, ICartModel>("Cart", cartSchema);

export default Cart;

export type CreateCartData = Omit<
  ICart,
  "createdAt" | "updatedAt" | "totalAmount"
> & {
  totalAmount?: number;
};

export type CreateCartItemData = Omit<ICartItem, "addedAt"> & {
  addedAt?: Date;
};
