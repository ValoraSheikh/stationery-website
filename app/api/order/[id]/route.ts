import { NextRequest, NextResponse } from "next/server";
import Order from "@/models/Order.model";
import dbConnect from "@/lib/connectDB";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orderId = await params?.id;
  if (!orderId) {
    return NextResponse.json(
      { error: "Order ID is required" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Fetch the latest order for this user and populate product images
    const order = await Order.findOne({
      orderId: orderId,
      userId: session.user.id,
    })
      .populate({
        path: "items.productId",
        select: "images name brandName price", // only needed fields
      })
      .lean();

    if (!order) {
      return NextResponse.json({ error: "No orders found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 🔒 Must be logged in
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    // If your schema uses `orderId`
    const order = await Order.findOne({ orderId: id, userId: session.user.id });

    // Or, if you want to use Mongo `_id`, swap with:
    // const order = await Order.findOne({ _id: id, userId: session.user.id });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not owned by this user" },
        { status: 404 }
      );
    }

    await Order.deleteOne({ orderId: id, userId: session.user.id });
    // Or if using `_id`: await Order.deleteOne({ _id: id, userId: session.user.id });

    return NextResponse.json(
      { success: true, message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
