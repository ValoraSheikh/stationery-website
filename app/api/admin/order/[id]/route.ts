/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from "@/lib/connectDB";
import Order from "@/models/Order.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const data = await req.json();

    const body = await req.json().catch(() => ({}));

    // LOG: incoming details for debugging
    // (These will appear in your terminal where next dev is running)
    console.log("[server] PATCH /api/admin/[id] called. params.id:", id);
    console.log("[server] PATCH body:", JSON.stringify(body));

    // Support old clients sending "reason" or "orderId"
    if (data.reason && !data.cancellationReason) {
      data.cancellationReason = data.reason;
    }

    // Allowed fields (include notes too)
    const allowedFields = [
      "status",
      "paymentStatus",
      "expectedDelivery",
      "deliveredAt",
      "cancellationReason",
      "shippingAddress",
      "billingAddress",
      "notes",
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (typeof data[key] !== "undefined") {
        updateData[key] = data[key];
      }
    }

    // Parse dates if strings were provided
    if (
      updateData.expectedDelivery &&
      typeof updateData.expectedDelivery === "string"
    ) {
      const d = new Date(updateData.expectedDelivery);
      if (!isNaN(d.getTime())) updateData.expectedDelivery = d;
      else delete updateData.expectedDelivery;
    }
    if (updateData.deliveredAt && typeof updateData.deliveredAt === "string") {
      const d = new Date(updateData.deliveredAt);
      if (!isNaN(d.getTime())) updateData.deliveredAt = d;
      else delete updateData.deliveredAt;
    }

    // Special logic: if status set to delivered and deliveredAt not provided, set it now
    if (updateData.status === "delivered" && !updateData.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    // Build query: try ObjectId if possible, else match orderId string.
    let query: any;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { orderId: id }] };
    } else if (id) {
      query = { orderId: id };
    } else if (data.orderId) {
      // fallback to orderId in body if params missing
      query = { orderId: data.orderId };
    } else {
      return NextResponse.json(
        { error: "No order id provided" },
        { status: 400 }
      );
    }

    // If nothing to update, still fetch the order and return it (so client can refresh)
    const hasUpdates = Object.keys(updateData).length > 0;

    let updatedOrder;
    if (hasUpdates) {
      updatedOrder = await Order.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true }
      )
        .populate("userId", "name email")
        .populate("items.productId", "name price images");
    } else {
      // No updates requested — just fetch current order
      updatedOrder = await Order.findOne(query)
        .populate("userId", "name email")
        .populate("items.productId", "name price images");
    }

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Return updated order
    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully",
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH /api/admin/[id] error:", err);
    // If it's a mongoose cast error or similar, expose message for debugging
    return NextResponse.json(
      { error: err?.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
