import { NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Order from "@/models/Order.model";
import "@/models/User.model";
import "@/models/Product.model";

export async function GET() {
  try {
    await dbConnect();

    // ✅ Fetch all orders with populated user + product details
    const orders = await Order.find()
      .populate("userId", "name email") // basic user info
      .populate("items.productId", "name price images productCode") // basic product info
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Transform for frontend readability
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = orders.map((o: any) => ({
      id: o._id.toString(),
      orderId: o.orderId,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      user: o.userId
        ? {
            id: o.userId._id?.toString(),
            name: o.userId.name,
            email: o.userId.email,
          }
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: o.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        variantSku: item.variantSku,
        product: item.productId
          ? {
              id: item.productId._id?.toString(),
              name: item.productId.name,
              price: item.productId.price,
              image:
                Array.isArray(item.productId.images) &&
                item.productId.images.length > 0
                  ? item.productId.images[0]
                  : null,
            }
          : null,
      })),
      subtotal: o.subtotal,
      shippingCost: o.shippingCost,
      taxAmount: o.taxAmount,
      discount: o.discount,
      grandTotal: o.grandTotal,
      payment: {
        method: o.paymentMethod,
        status: o.paymentStatus,
        transactionId: o.transactionId,
      },
      shippingAddress: o.shippingAddress,
      expectedDelivery: o.expectedDelivery,
      deliveredAt: o.deliveredAt,
    }));

    return NextResponse.json({ orders: mapped });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json(
      { error: "Server error", message: (err as Error).message },
      { status: 500 }
    );
  }
}
