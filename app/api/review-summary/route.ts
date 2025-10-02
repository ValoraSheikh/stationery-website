import { NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Review from "@/models/Review.model";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { message: "productId query parameter is required" },
        { status: 400 }
      );
    }

    // Make sure productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid productId" },
        { status: 400 }
      );
    }

    // Aggregate reviews for the product
    const summary = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    // Return default if no reviews exist
    const result = summary[0] || { averageRating: 0, reviewCount: 0 };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching review summary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
