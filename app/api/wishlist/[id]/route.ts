import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/connectDB";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User.model";
import Wishlist from "@/models/Wishlist.model";
import mongoose from "mongoose";

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required in body" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: user._id },
      { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } },
      { new: true }
    );

    if (!wishlist) {
      return NextResponse.json({ message: "Wishlist not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Product removed from wishlist", wishlist },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}