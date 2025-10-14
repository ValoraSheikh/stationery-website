/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/connectDB";
import Review from "@/models/Review.model";
import "@/models/Product.model";
import "@/models/User.model";


export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const reviews = await Review.find()
      .populate("userId", "name email avatar")
      .populate(
        "productId",
        "name price images productCode mainCategory subCategory variants totalStock"
      )
      .sort({ createdAt: -1 })
      .lean();

    // ✅ ADD THIS LINE - Remove reviews with deleted users/products
    const validReviews = reviews.filter((r: any) => r.userId && r.productId);

    // Change this line from 'reviews' to 'validReviews'
    const mapped = validReviews.map((r: any) => ({
      _id: r._id,
      rating: r.rating,
      text: r.text,
      date: r.date || r.createdAt,
      user: r.userId
        ? {
            _id: r.userId._id,
            name: r.userId.name,
            email: r.userId.email,
            avatar: r.userId.avatar,
          }
        : null,
      product: r.productId
        ? {
            _id: r.productId._id,
            name: r.productId.name,
            productCode: r.productId.productCode,
            price: r.productId.price,
            image:
              Array.isArray(r.productId.images) && r.productId.images.length > 0
                ? r.productId.images[0]
                : null,
            mainCategory: r.productId.mainCategory,
            subCategory: r.productId.subCategory,
            totalStock: r.productId.totalStock,
          }
        : null,
    }));

    return NextResponse.json({ reviews: mapped });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json(
      { error: "Server error", message: (err as Error).message },
      { status: 500 }
    );
  }
}