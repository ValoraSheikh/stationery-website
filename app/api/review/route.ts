import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Review from "@/models/Review.model";
import User from "@/models/User.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import mongoose, { Types } from "mongoose";

interface IUser {
  _id: Types.ObjectId;
  name: string;
  avatar: string;
}

interface IReviewLean {
  _id: Types.ObjectId;
  rating: number;
  text: string;
  date: Date;
  userId?: IUser;
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

    const body = await request.json();
    const { productId, rating, text } = body;

    if (!productId || !rating || !text) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const review = new Review({
      userId: user._id,
      productId,
      rating,
      text,
      date: new Date(),
    });

    await review.save();

    return NextResponse.json(
      { message: "Review submitted", review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    await dbConnect();

    const productId = request.nextUrl.searchParams.get("productId")
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid or missing productId" },
        { status: 400 }
      )
    }

    const reviews = await Review.find({ productId })
      .sort({ date: -1 })
      .populate<{ name: string; avatar: string }>("userId", "name avatar")
      .lean<IReviewLean[]>(); // <--- note the []

    const formattedReviews = reviews
      .filter((r) => r.userId)
      .map((r) => {
        const user = r.userId!;
        return {
          id: r._id.toString(),
          rating: r.rating,
          text: r.text,
          date: r.date,
          user: {
            id: user._id.toString(),
            name: user.name,
            avatar: user.avatar,
          },
        };
      });

    return NextResponse.json({ reviews: formattedReviews }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

