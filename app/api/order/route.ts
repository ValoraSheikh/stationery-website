import { NextRequest, NextResponse } from "next/server";
import Order from "@/models/Order.model";
import dbConnect from "@/lib/connectDB";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import User from "@/models/User.model";
import Product from "@/models/Product.model";

interface IProduct {
  _id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
}

interface PopulatedItem {
  productId: IProduct;
  price: number;
  quantity: number;
}

interface IOrder {
  _id: string;
  orderId: string;
  userId: string;
  items: { productId: string; price: number; quantity: number }[];
  shippingAddress: string;
  billingAddress: string;
  payment?: { method: string };
  shipping?: { method: string };
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  createdAt: Date;
  trackingNumber?: string;
}

interface PopulatedOrder extends Omit<IOrder, "items"> {
  items: PopulatedItem[];
}

function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-6)}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userId = user._id;

    const body = await request.json();

    const orderId = generateOrderId();

    const orderData = {
      orderId,
      userId,
      ...body,
    };

    const newOrder = await Order.create(orderData);

    const savedOrder = await newOrder.save();

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: savedOrder,
        orderId: savedOrder.orderId,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create order error:", error);

    // Type guard for MongoDB duplicate key error
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID already exists",
        },
        { status: 409 }
      );
    }

    // Type guard for Mongoose validation error
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError" &&
      "errors" in error
    ) {
      const validationErrors = Object.values(
        error.errors as Record<string, { message: string }>
      ).map((err) => err.message);
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await dbConnect();

    const orders = await Order.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.productId",
        model: Product,
        select: "name description images price",
      })
      .lean<PopulatedOrder[]>(); // ✅ tell mongoose the shape after populate

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "No orders found" }, { status: 404 });
    }

    const response = orders.map((order) => ({
      orderId: order.orderId,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber || null,
      items: order.items.map((item) => ({
        productId: item.productId._id.toString(),
        name: item.productId.name,
        description: item.productId.description,
        image: item.productId.images?.[0] || "",
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      paymentMethod: order.payment?.method || "N/A",
      shippingMethod: order.shipping?.method || "Standard",
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shippingCost,
      total: order.total,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
