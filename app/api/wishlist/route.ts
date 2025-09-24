import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Wishlist from "@/models/Wishlist.model";
import Product from "@/models/Product.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextAuth]/options";
import mongoose from "mongoose";
import User from "@/models/User.model";

export async function POST(request: NextRequest) {
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
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    let wishlist = await Wishlist.findOne({ userId: session.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: session.user.id, items: [] });
    }

    const exists = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );
    if (exists) {
      return NextResponse.json(
        { message: "Product already in wishlist" },
        { status: 200 }
      );
    }

    wishlist.items.push({ productId, addedAt: new Date() });
    await wishlist.save();

    return NextResponse.json(
      { message: "Product added to wishlist", wishlist },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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

