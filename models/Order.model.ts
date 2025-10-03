import mongoose, { Document, Model, Types } from "mongoose";

export interface IOrderItem {
  productId: Types.ObjectId;
  variantSku?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrder {
  orderId: string;
  userId: Types.ObjectId;
  status:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  paymentMethod: "cod" | "upi" | "online" | "netbanking" | "wallet";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  transactionId?: string;
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  expectedDelivery?: Date;
  deliveredAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItemDocument extends IOrderItem, Document {}
export interface IOrderDocument extends IOrder, Document {
  items: Types.DocumentArray<IOrderItemDocument>;
}
export type IOrderModel = Model<IOrderDocument>;

const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantSku: { type: String },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema<IAddress>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<IOrderDocument, IOrderModel>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "online", "upi", "netbanking", "wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: String },
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema },
    expectedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1 });
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ status: 1 });

const Order: IOrderModel =
  (mongoose.models.Order as IOrderModel) ||
  mongoose.model<IOrderDocument, IOrderModel>("Order", orderSchema);

export default Order;
