import { NextRequest, NextResponse } from "next/server";
import Order from "@/models/Order.model";
import dbConnect from "@/lib/connectDB";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";


export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await dbConnect();

    // Fetch the latest order for this user and populate product images
    const latestOrder = await Order.findOne({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.productId",
        select: "images name brandName", // Only select needed fields
      })
      .lean();

    if (!latestOrder) {
      return NextResponse.json({ error: "No orders found" }, { status: 404 });
    }

    return NextResponse.json(latestOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}