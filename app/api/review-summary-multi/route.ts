import { NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Review from "@/models/Review.model";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const productIdsParam = searchParams.get("productIds"); // comma-separated IDs

    if (!productIdsParam) {
      return NextResponse.json(
        { message: "productIds query parameter is required" },
        { status: 400 }
      );
    }

    // Convert to valid ObjectIds
    const productIds = productIdsParam
      .split(",")
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (productIds.length === 0) {
      return NextResponse.json({}, { status: 200 }); // no valid IDs
    }

    // Aggregate reviews for all productIds
    const summaries = await Review.aggregate([
      { $match: { productId: { $in: productIds } } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    // Map productId -> summary
    const summaryMap: Record<string, { averageRating: number; reviewCount: number }> = {};
    summaries.forEach(s => {
      summaryMap[s._id.toString()] = {
        averageRating: s.averageRating,
        reviewCount: s.reviewCount,
      };
    });

    return NextResponse.json(summaryMap, { status: 200 });
  } catch (error) {
    console.error("Error fetching review summaries:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
