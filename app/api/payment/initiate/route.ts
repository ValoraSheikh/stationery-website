import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";
import dbConnect from "@/lib/connectDB";
import Order from "@/models/Order.model";

const client = StandardCheckoutClient.getInstance(
  process.env.CLIENT_ID!,
  process.env.CLIENT_SECRET!,
  Number(process.env.CLIENT_VERSION || 1),
  Env.SANDBOX // ⚠️ change to PRODUCTION when live
);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await dbConnect();

    const body = await req.json();
    const { amount, redirectUrl, orderId } = body;

    if (!amount || !redirectUrl || !orderId) {
      return NextResponse.json(
        { error: "amount, redirectUrl, and orderId are required" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ orderId, userId: session.user.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.set("merchantOrderId", orderId);
    await order.save();

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(orderId.toString())
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await client.pay(request);

    return NextResponse.json(
      { redirectUrl: response.redirectUrl, merchantOrderId: orderId },
      { status: 200 }
    );
  } catch (err) {
    console.error("Payment initiate POST error:", err);
    return NextResponse.json(
      { error: "Internal Server error" },
      { status: 500 }
    );
  }
}
