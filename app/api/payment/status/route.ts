import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { Env, StandardCheckoutClient } from "pg-sdk-node";
import Order from "@/models/Order.model";
import dbConnect from "@/lib/connectDB";

const client = StandardCheckoutClient.getInstance(
  process.env.CLIENT_ID!,
  process.env.CLIENT_SECRET!,
  Number(process.env.CLIENT_VERSION || 1),
  Env.SANDBOX // ⚠️ change to PRODUCTION when live
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const merchantOrderId =
      searchParams.get("merchantOrderId") || searchParams.get("orderId");
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    if (!merchantOrderId) {
      return NextResponse.json(
        { error: "merchantOrderId is required" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ orderId, userId: session.user.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { state } = await client.getOrderStatus(merchantOrderId);

    const paymentStatus: "pending" | "paid" | "failed" | "refunded" =
      state === "COMPLETED"
        ? "paid"
        : state === "PENDING"
        ? "pending"
        : "failed";

    if (order.paymentStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === "paid") {
        order.deliveredAt = undefined;
      }
      await order.save();
    }

    return NextResponse.json({ paymentStatus });
  } catch (error) {
    console.error(
      "💥 Payment status error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
