import { NextRequest, NextResponse } from "next/server";
import Order from "@/models/Order.model";
import dbConnect from "@/lib/connectDB";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextAuth]/options";
import User from "@/models/User.model";

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

    const newOrder = await Order.create({
      orderData,
    });

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
